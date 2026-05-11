#!/usr/bin/env node
/**
 * Pre-build validator. Runs as the `prebuild` npm hook, BEFORE `vite build`,
 * so any syntax / structure error aborts the build before a dist/ is produced.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { transform as esbuildTransform } from 'esbuild';
import { HtmlValidate } from 'html-validate';
import { brandedBanner, bold, cyan, dim, green, red, yellow } from './branding.mjs';

const SRC_DIR = path.resolve('src');

async function* walk(dir, extensions) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            yield* walk(full, extensions);
        } else if (e.isFile()) {
            const lower = e.name.toLowerCase();
            if (extensions.some((ext) => lower.endsWith(ext))) yield full;
        }
    }
}

const rel = (p) => path.relative(SRC_DIR, p).split(path.sep).join('/');

function formatEsbuildError(err, label) {
    if (err && Array.isArray(err.errors) && err.errors.length) {
        return err.errors
            .map((e) => {
                const loc = e.location;
                const where = loc ? ` ${loc.line}:${loc.column}` : '';
                return `${label}${where}  ${e.text}`;
            })
            .join('\n      ');
    }
    return `${label}  ${err?.message || String(err)}`;
}

async function validateExternalJs(file) {
    const code = await fs.readFile(file, 'utf8');
    try {
        await esbuildTransform(code, {
            loader: 'js',
            target: 'es2020',
            sourcefile: rel(file),
            format: file.endsWith('.mjs') ? 'esm' : undefined
        });
        return null;
    } catch (err) {
        return formatEsbuildError(err, 'JS parse');
    }
}

async function validateExternalCss(file) {
    const code = await fs.readFile(file, 'utf8');
    try {
        await esbuildTransform(code, {
            loader: 'css',
            sourcefile: rel(file)
        });
        return null;
    } catch (err) {
        return formatEsbuildError(err, 'CSS parse');
    }
}

function extractInlineBlocks(html) {
    const blocks = [];

    const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    for (const m of html.matchAll(scriptRe)) {
        const attrs = m[1];
        const body = m[2];
        if (/\bsrc\s*=/i.test(attrs)) continue;
        const typeMatch = attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i);
        const type = typeMatch ? typeMatch[1].toLowerCase() : 'text/javascript';
        if (
            type !== 'text/javascript' &&
            type !== 'application/javascript' &&
            type !== 'module' &&
            type !== ''
        ) {
            continue;
        }
        if (!body.trim()) continue;
        const offset = m.index + m[0].indexOf(body);
        blocks.push({
            kind: 'js',
            body,
            offset,
            isModule: type === 'module'
        });
    }

    const styleRe = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
    for (const m of html.matchAll(styleRe)) {
        const body = m[2];
        if (!body.trim()) continue;
        const offset = m.index + m[0].indexOf(body);
        blocks.push({ kind: 'css', body, offset });
    }

    return blocks;
}

function locFromOffset(source, offset) {
    let line = 1;
    let col = 1;
    for (let i = 0; i < offset && i < source.length; i++) {
        if (source.charCodeAt(i) === 10 /* \n */) {
            line++;
            col = 1;
        } else {
            col++;
        }
    }
    return { line, col };
}

async function validateInlineBlocks(file) {
    const html = await fs.readFile(file, 'utf8');
    const blocks = extractInlineBlocks(html);
    const issues = [];
    for (const b of blocks) {
        const { line } = locFromOffset(html, b.offset);
        try {
            if (b.kind === 'js') {
                await esbuildTransform(b.body, {
                    loader: 'js',
                    target: 'es2020',
                    format: b.isModule ? 'esm' : undefined,
                    sourcefile: `${rel(file)}:inline-script@${line}`
                });
            } else {
                await esbuildTransform(b.body, {
                    loader: 'css',
                    sourcefile: `${rel(file)}:inline-style@${line}`
                });
            }
        } catch (err) {
            issues.push(
                formatEsbuildError(
                    err,
                    `inline <${b.kind === 'js' ? 'script' : 'style'}> at line ${line}`
                )
            );
        }
    }
    return issues;
}

const htmlValidator = new HtmlValidate({
    root: true,
    extends: ['html-validate:document'],
    rules: {
        'heading-level': 'off',
        'input-missing-label': 'off',
        'missing-doctype': 'off',
        'prefer-native-element': 'off',
        'element-required-content': 'off',
        'element-required-attributes': 'off',
        'attribute-allowed-values': 'off',
        'attribute-empty-style': 'off',
        'attribute-boolean-style': 'off',
        'no-deprecated-attr': 'off',
        'wcag/h30': 'off',
        'wcag/h32': 'off',
        'wcag/h36': 'off',
        'wcag/h37': 'off',
        'wcag/h67': 'off',
        'wcag/h71': 'off',
        'no-inline-style': 'off',
        'no-trailing-whitespace': 'off',
        'require-sri': 'off',
        'unique-landmark': 'off',
        'no-redundant-role': 'off',
    }
});

async function validateHtml(file) {
    const report = await htmlValidator.validateFile(file);
    if (report.valid) return [];
    return report.results.flatMap((r) =>
        r.messages
            .filter((m) => m.severity === 2)
            .map(
                (m) =>
                    `${m.line}:${m.column}  ${m.message}` +
                    (m.ruleId ? `  ${dim('(' + m.ruleId + ')')}` : '')
            )
    );
}

async function main() {
    process.stdout.write(brandedBanner('Pre-build validation'));
    process.stdout.write(
        `  ${cyan('→')} Validating ${bold('src/')} ${dim('— HTML structure, CSS + JS syntax (external & inline)')}\n\n`
    );

    let fileCount = 0;
    let errorCount = 0;
    const t0 = Date.now();

    const report = (file, issues) => {
        if (!issues || (Array.isArray(issues) && issues.length === 0)) return;
        const list = Array.isArray(issues) ? issues : [issues];
        errorCount += list.length;
        process.stderr.write(`  ${red('✗')} ${bold(rel(file))}\n`);
        for (const issue of list) {
            process.stderr.write(`      ${issue}\n`);
        }
    };

    for await (const file of walk(SRC_DIR, ['.html'])) {
        fileCount++;
        const structural = await validateHtml(file);
        const inline = await validateInlineBlocks(file);
        report(file, [...structural, ...inline]);
    }

    for await (const file of walk(SRC_DIR, ['.css'])) {
        fileCount++;
        report(file, await validateExternalCss(file));
    }

    for await (const file of walk(SRC_DIR, ['.js', '.mjs'])) {
        fileCount++;
        report(file, await validateExternalJs(file));
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

    if (errorCount > 0) {
        process.stderr.write(
            `\n  ${red('✗')} ${bold(`${errorCount} issue${errorCount === 1 ? '' : 's'}`)} in ${fileCount} file${fileCount === 1 ? '' : 's'} ` +
                `${dim(`(${elapsed}s)`)}\n` +
                `  ${yellow('→')} Build aborted. Fix the issues above and re-run ${bold('npm run build')}.\n\n`
        );
        process.exit(1);
    }

    process.stdout.write(
        `  ${green('✓')} ${bold(`${fileCount} file${fileCount === 1 ? '' : 's'}`)} validated cleanly ${dim(`in ${elapsed}s`)}\n\n`
    );
}

main().catch((err) => {
    process.stderr.write(
        `\n  ${red('✗')} Validator crashed: ${err?.stack || err?.message || err}\n\n`
    );
    process.exit(1);
});
