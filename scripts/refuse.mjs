#!/usr/bin/env node
/**
 * Refusal script — printed when a user runs any non-build npm script
 * (dev / preview / serve / start / test). Takes the disabled command
 * name as the first CLI argument and exits non-zero so any caller
 * treats it as failure.
 */

import { brandedBanner, bold, cyan, red, yellow } from './branding.mjs';

const command = process.argv[2] || 'this command';

const out =
    brandedBanner('Production-Build-Only Project') +
    `  ${red('✗')} ${bold(`npm run ${command}`)} is disabled.\n` +
    `    Dev server, preview, serve, start, and test are intentionally\n` +
    `    turned off - this project is shipped only as a static build.\n` +
    '\n' +
    `  ${yellow('→')} The only supported command is:\n` +
    `      ${bold(cyan('npm run build'))}\n\n`;

process.stderr.write(out);
process.exit(1);
