import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { minify as htmlMinify } from 'html-minifier-terser';
import { transform as esbuildTransform } from 'esbuild';
import { promises as fsp } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

import { brandedBanner, bold, cyan, dim, red } from './scripts/branding.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_ROOT = __dirname;
const SRC_DIR      = resolve(PROJECT_ROOT, 'src');
const DIST_DIR     = resolve(PROJECT_ROOT, 'dist');

const r = (...p) => resolve(SRC_DIR, ...p);

const PUBLIC_SCRIPT_RE =
    /<script\b[^>]*\bsrc=["']\/[\w./-]+\.js["'][^>]*><\/script>/gi;

const protectedScripts = new Map();
const placeholderFor = (id) => `<!--@@@@@@SR_KEEP:${id}@@@@@@-->`;
const PLACEHOLDER_RESTORE_RE = /<!--@@@@@@SR_KEEP:([^@]+?)@@@@@@-->/g;

const protectPublicScriptsPlugin = () => ({
    name: 'sr-protect-public-scripts',
    enforce: 'pre',
    apply: 'build',
    transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
            const fileKey = String(ctx?.filename || ctx?.path || '_')
                .replace(/[\\/]/g, '_');
            let i = 0;
            return html.replace(PUBLIC_SCRIPT_RE, (match) => {
                const id = `${fileKey}#${i++}`;
                protectedScripts.set(id, match);
                return placeholderFor(id);
            });
        }
    }
});

const suryaBrandingPlugin = () => {
    let printed = false;
    return {
        name: 'sr-surya-branding',
        apply: 'build',
        enforce: 'pre',
        buildStart() {
            if (printed) return;
            printed = true;
            process.stdout.write(
                brandedBanner('Production Build') +
                `  ${cyan('→')} ${dim('Bundling, minifying, and emitting to')} ${bold('dist/')}…\n\n`
            );
        }
    };
};

const verbatimCssMinifyPlugin = () => ({
    name: 'sr-verbatim-css-minify',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
        const distDir = DIST_DIR;
        const targets = ['Contact', 'Resume'];

        async function* walkCss(dir) {
            let entries;
            try {
                entries = await fsp.readdir(dir, { withFileTypes: true });
            } catch {
                return;
            }
            for (const e of entries) {
                const full = join(dir, e.name);
                if (e.isDirectory()) yield* walkCss(full);
                else if (e.isFile() && e.name.toLowerCase().endsWith('.css'))
                    yield full;
            }
        }

        let totalBefore = 0;
        let totalAfter = 0;
        let count = 0;

        for (const t of targets) {
            for await (const file of walkCss(join(distDir, t))) {
                try {
                    const orig = await fsp.readFile(file, 'utf8');
                    const result = await esbuildTransform(orig, {
                        loader: 'css',
                        minify: true,
                        target: 'es2020',
                        legalComments: 'none'
                    });
                    if (
                        typeof result.code === 'string' &&
                        result.code.length < orig.length
                    ) {
                        await fsp.writeFile(file, result.code, 'utf8');
                        totalBefore += orig.length;
                        totalAfter += result.code.length;
                        count++;
                        const rel = relative(distDir, file);
                        const pct = ((1 - result.code.length / orig.length) * 100).toFixed(1);
                        console.log(
                            `  ${rel.padEnd(32)} ${(orig.length / 1024).toFixed(1).padStart(7)}KB → ${(result.code.length / 1024).toFixed(1).padStart(7)}KB  -${pct}%`
                        );
                    }
                } catch (err) {
                    console.warn(`  [skip] ${relative(distDir, file)}: ${err?.message || err}`);
                }
            }
        }

        if (count > 0) {
            const saved = totalBefore - totalAfter;
            const pct = ((saved / totalBefore) * 100).toFixed(1);
            console.log(
                `[verbatim-css-minify] ${count} file(s), saved ${(saved / 1024).toFixed(1)}KB (-${pct}%)\n`
            );
        }
    }
});

const htmlMinifyPlugin = () => ({
    name: 'sr-html-minify-preserve-comments',
    enforce: 'post',
    apply: 'build',
    async transformIndexHtml(html, ctx) {
        const isCurl = ctx?.path?.endsWith('curl/index.html') || ctx?.filename?.includes(`${'curl'}`);
        try {
            let out = await htmlMinify(html, {
                collapseWhitespace: !isCurl,
                conservativeCollapse: true,
                removeComments: true,
                ignoreCustomComments: [/@@@@@@/],

                removeRedundantAttributes: false,
                removeEmptyAttributes: false,
                removeScriptTypeAttributes: false,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: false,
                minifyJS: {
                    format: { comments: false }
                },
                minifyCSS: false,
                decodeEntities: false,
                keepClosingSlash: true,
                preserveLineBreaks: false
            });

            out = out.replace(
                /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
                (_m, attrs, css) =>
                    `<style${attrs}>${css.replace(/\/\*[\s\S]*?\*\//g, '')}</style>`
            );

            out = out.replace(
                /(-->)\s*(<!DOCTYPE\s+html[^>]*>)/i,
                '$1\n$2'
            );

            out = out.replace(
                PLACEHOLDER_RESTORE_RE,
                (m, id) => protectedScripts.get(id) || m
            );

            return out;
        } catch (err) {
            console.warn('[html-minify] skipped:', err?.message || err);
            return html;
        }
    }
});

const refuseNonBuild = (command) => {
    if (command === 'build') return;
    process.stderr.write(
        brandedBanner('Production-Build-Only Project') +
        `  ${red('✗')} Dev server, preview, serve, and all non-build modes are disabled.\n` +
        '\n' +
        `  ${cyan('→')} The only supported command is:\n` +
        `      ${bold(cyan('npm run build'))}\n\n`
    );
    throw new Error('Vite is configured for production builds only.');
};

export default defineConfig(({ command }) => {
    refuseNonBuild(command);
    return {
    root: SRC_DIR,
    publicDir: false,
    base: '/',
    appType: 'mpa',

    resolve: {
        preserveSymlinks: true
    },

    build: {
        outDir: DIST_DIR,
        emptyOutDir: true,
        assetsDir: '_app',
        cssCodeSplit: true,
        modulePreload: { polyfill: true },
        target: 'es2020',
        sourcemap: false,
        chunkSizeWarningLimit: 2000,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_debugger: true,
                passes: 2
            },
            format: { comments: false },
            mangle: { safari10: true }
        },
        cssMinify: 'esbuild',
        rollupOptions: {
            external: [/^https?:\/\//],
            input: {
                index:    r('index.html'),
                notfound: r('404.html'),
                policy:   r('policy.html'),
                game:     r('Game/index.html'),
                goto:     r('Goto/index.html'),
                matrix:   r('Matrix/index.html'),
                curl:     r('curl/index.html')
            },
            output: {
                entryFileNames: '_app/js/[name]-[hash].js',
                chunkFileNames: '_app/js/[name]-[hash].js',
                assetFileNames: ({ name }) => {
                    if (!name) return '_app/assets/[name]-[hash][extname]';
                    if (/\.(css)$/i.test(name)) return '_app/css/[name]-[hash][extname]';
                    if (/\.(woff2?|ttf|eot|otf)$/i.test(name)) return '_app/fonts/[name]-[hash][extname]';
                    if (/\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(name)) return '_app/img/[name]-[hash][extname]';
                    if (/\.(mp3|wav|ogg|m4a)$/i.test(name)) return '_app/media/[name]-[hash][extname]';
                    return '_app/assets/[name]-[hash][extname]';
                }
            }
        }
    },

    plugins: [
        suryaBrandingPlugin(),

        viteStaticCopy({

            targets: [
                { src: 'blocker.js',         dest: '.' },
                { src: 'tf-fix-blocker.js',  dest: '.' },
                { src: 'CNAME',              dest: '.' },
                { src: '.nojekyll',          dest: '.' },
                { src: 'robots.txt',         dest: '.' },
                { src: 'assets',             dest: '.' },
                { src: 'Contact',            dest: '.' },
                { src: 'Resume',             dest: '.' },

                { src: '../LICENSE',         dest: '.' }
            ]
        }),

        protectPublicScriptsPlugin(),
        htmlMinifyPlugin(),
        verbatimCssMinifyPlugin()
    ]
    };
});
