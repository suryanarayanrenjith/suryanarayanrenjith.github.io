/**
 * Surya Website branding — single source of truth for the
 * "Surya Website / Fusing Imagination with Innovation" banner that the
 * build pipeline, the refusal scripts, and the clean script all share.
 */

const c = (code) => (text) => `\x1b[${code}m${text}\x1b[0m`;

export const dim    = c(2);
export const bold   = c(1);
export const cyan   = c(36);
export const red    = c(31);
export const yellow = c(33);
export const white  = c(97);
export const green  = c(32);

export const TITLE   = 'Surya Website';
export const TAGLINE = 'Fusing Imagination with Innovation · surya.is-a.dev';

const BOX_INNER = 62;

const TOP    = cyan('  ╭' + '─'.repeat(BOX_INNER) + '╮');
const BOTTOM = cyan('  ╰' + '─'.repeat(BOX_INNER) + '╯');

function row(colored, visibleLength) {
    const trailing = Math.max(0, BOX_INNER - 2 - visibleLength);
    return (
        cyan('  │  ') +
        colored +
        cyan(' '.repeat(trailing) + '│')
    );
}

export function brandedBanner(subtitle) {
    const head = bold(white(TITLE)) + dim(` - ${subtitle}`);
    const headLen = TITLE.length + 3 + subtitle.length;

    const tag = dim(TAGLINE);
    const tagLen = TAGLINE.length;

    return [
        '',
        TOP,
        row(head, headLen),
        row(tag, tagLen),
        BOTTOM,
        ''
    ].join('\n') + '\n';
}
