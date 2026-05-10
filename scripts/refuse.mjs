#!/usr/bin/env node

const c = (n) => (s) => `\x1b[${n}m${s}\x1b[0m`;
const reset = '\x1b[0m';
const dim   = c(2);
const bold  = c(1);
const cyan  = c(36);
const yellow = c(33);
const red   = c(31);

const command = process.argv[2] || 'this command';

const lines = [
    '',
    cyan('  ╭──────────────────────────────────────────────────────────────╮'),
    cyan('  │  ') + bold('Surya Website') + dim(' - Production-Build-Only Project') + cyan('               │'),
    cyan('  │  ') + dim('Fusing Imagination with Innovation · surya.is-a.dev') + cyan('         │'),
    cyan('  ╰──────────────────────────────────────────────────────────────╯'),
    '',
    `  ${red('✗')} ${bold(`npm run ${command}`)} is disabled.`,
    `    Dev server, preview, serve, start, and test are intentionally`,
    `    turned off — this project is shipped only as a static build.`,
    '',
    `  ${yellow('→')} The only supported command is:`,
    `      ${bold(cyan('npm run build'))}`,
    ''
];

process.stderr.write(lines.join('\n') + '\n');
process.exit(1);
