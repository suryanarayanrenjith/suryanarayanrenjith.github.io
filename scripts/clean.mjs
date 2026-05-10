#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const c = (n) => (s) => `\x1b[${n}m${s}\x1b[0m`;
const dim   = c(2);
const bold  = c(1);
const cyan  = c(36);
const green = c(32);
const red   = c(31);

const distDir = path.resolve('dist');

process.stdout.write(
    '\n' +
    cyan('  ╭──────────────────────────────────────────────────────────────╮\n') +
    cyan('  │  ') + bold('Surya Website') + dim(' - clean') + cyan('                                       │\n') +
    cyan('  ╰──────────────────────────────────────────────────────────────╯\n') +
    '\n' +
    `  ${cyan('→')} Removing  ${bold(path.relative(process.cwd(), distDir) || 'dist')}${path.sep}\n`
);

try {
    let existed = true;
    try {
        await fs.access(distDir);
    } catch {
        existed = false;
    }
    await fs.rm(distDir, { recursive: true, force: true });
    process.stdout.write(
        existed
            ? `  ${green('✓')} Removed.\n\n`
            : `  ${dim('·')} Nothing to remove.\n\n`
    );
} catch (err) {
    process.stderr.write(`  ${red('✗')} Failed to clean: ${err.message}\n\n`);
    process.exit(1);
}
