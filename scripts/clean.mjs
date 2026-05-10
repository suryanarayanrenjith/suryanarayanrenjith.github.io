#!/usr/bin/env node
/**
 * Removes the dist/ directory. Wraps fs.rm so we can show a properly
 * formatted Surya Website banner instead of an inline `node -e` blob.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { brandedBanner, bold, cyan, dim, green, red } from './branding.mjs';

const distDir = path.resolve('dist');

process.stdout.write(
    brandedBanner('clean') +
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
