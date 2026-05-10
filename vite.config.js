import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { minify as htmlMinify } from 'html-minifier-terser';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (...p) => resolve(__dirname, ...p);

/**
 * Custom HTML minifier that PRESERVES all HTML comments —
 * including the SR `@@@@` ASCII art at the top of index.html.
 * Inline <script>/<style>/<pre> contents are not whitespace-collapsed
 * (html-minifier-terser default behavior).
 */
const htmlMinifyPlugin = () => ({
    name: 'sr-html-minify-preserve-comments',
    enforce: 'post',
    apply: 'build',
    async transformIndexHtml(html, ctx) {
        // The curl/index.html is intentionally an ASCII-only redirector;
        // skip aggressive minification so the <pre> art is byte-perfect.
        const isCurl = ctx?.path?.endsWith('curl/index.html') || ctx?.filename?.includes(`${'curl'}`);
        try {
            return await htmlMinify(html, {
                collapseWhitespace: !isCurl,
                conservativeCollapse: true,
                removeComments: false,
                removeRedundantAttributes: true,
                removeEmptyAttributes: true,
                removeScriptTypeAttributes: false,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
                minifyJS: true,
                minifyCSS: true,
                decodeEntities: false,
                keepClosingSlash: true,
                preserveLineBreaks: false
            });
        } catch (err) {
            // If minification fails for any reason, fall back to the
            // original HTML so the build never breaks.
            // eslint-disable-next-line no-console
            console.warn('[html-minify] skipped:', err?.message || err);
            return html;
        }
    }
});

export default defineConfig({
    root: __dirname,
    publicDir: false,
    base: '/',
    appType: 'mpa',

    resolve: {
        preserveSymlinks: true
    },

    server: {
        port: 5173,
        strictPort: false,
        open: false
    },

    preview: {
        port: 4173,
        strictPort: false
    },

    build: {
        outDir: 'dist',
        emptyOutDir: true,
        // IMPORTANT: avoid colliding with the existing /assets/ folder at repo root.
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
            // Keep https:// imports (e.g. THREE.js from cdnjs in script.js) external —
            // browsers handle them natively in module scripts.
            external: [/^https?:\/\//],
            input: {
                index:    r('index.html'),
                notfound: r('404.html'),
                policy:   r('policy.html'),
                cli:      r('Cli/index.html'),
                contact:  r('Contact/index.html'),
                game:     r('Game/index.html'),
                goto:     r('Goto/index.html'),
                matrix:   r('Matrix/index.html'),
                resume:   r('Resume/index.html'),
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
        // Mirror untouched static files into dist/. These are referenced by
        // absolute paths in the HTML and must keep their original location.
        viteStaticCopy({
            targets: [
                { src: 'blocker.js',         dest: '.' },
                { src: 'tf-fix-blocker.js',  dest: '.' },
                { src: 'CNAME',              dest: '.' },
                { src: '.nojekyll',          dest: '.' },
                { src: 'robots.txt',         dest: '.' },
                { src: 'LICENSE',            dest: '.' },
                // Preserve the existing assets tree verbatim — same paths the site
                // already references (/assets/favicon, /assets/bg.webp, /assets/bg_music.mp3, etc.)
                { src: 'assets/**/*',        dest: 'assets' }
            ]
        }),

        htmlMinifyPlugin()
    ]
});
