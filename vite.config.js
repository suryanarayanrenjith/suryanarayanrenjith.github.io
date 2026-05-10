import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { minify as htmlMinify } from 'html-minifier-terser';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (...p) => resolve(__dirname, ...p);

const htmlMinifyPlugin = () => ({
    name: 'sr-html-minify-preserve-comments',
    enforce: 'post',
    apply: 'build',
    async transformIndexHtml(html, ctx) {

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
                minifyCSS: false,
                decodeEntities: false,
                keepClosingSlash: true,
                preserveLineBreaks: false
            });
        } catch (err) {
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
        viteStaticCopy({
            targets: [
                { src: 'blocker.js',         dest: '.' },
                { src: 'tf-fix-blocker.js',  dest: '.' },
                { src: 'CNAME',              dest: '.' },
                { src: '.nojekyll',          dest: '.' },
                { src: 'robots.txt',         dest: '.' },
                { src: 'LICENSE',            dest: '.' },
                { src: 'assets/**/*',        dest: 'assets' },

                { src: 'Contact/**/*',       dest: 'Contact' },
                { src: 'Resume/**/*',        dest: 'Resume' }
            ]
        }),

        htmlMinifyPlugin()
    ]
});
