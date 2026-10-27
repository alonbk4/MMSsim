import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base is relative so the built bundle also works when served from a
// subpath (GitHub Pages) or from a Capacitor webview later on.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The site sits behind a sign-in gate, which turns away any request
      // without its cookie. Browsers fetch the manifest without cookies
      // unless told otherwise, and without the manifest the app can't be
      // installed to a home screen.
      useCredentials: true,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MMSsim — Yard Systems Simulator',
        short_name: 'MMSsim',
        description:
          'Design off-grid water, food, energy and nutrient systems for a real site and see whether they balance.',
        theme_color: '#1b3a2b',
        background_color: '#0f1613',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        /*
         * The page is deliberately not precached. Workbox maps a request for
         * "/" onto a precached index.html and serves it cache-first, which is
         * the whole problem: leave it in and the runtime rule below never sees
         * a navigation. Offline still works — the first successful visit puts
         * the page in the runtime cache, and every visit after that can come
         * from it.
         */
        globIgnores: ['index.html'],
        cleanupOutdatedCaches: true,
        /*
         * Serve the page itself network-first.
         *
         * Precached HTML is served cache-first, which means the first reload
         * after a deploy hands back the previous shell — and that shell asks
         * for asset filenames that the new deploy has already replaced. They
         * are gone from the server, and the moment the new worker tidies the
         * old cache they are gone from there too: a request for a file that
         * exists nowhere, and a blank page.
         *
         * Going to the network first for navigations means an online visitor
         * always gets the current HTML with asset names that resolve. The
         * three-second timeout keeps it usable on a bad connection, and the
         * cache still answers when there is no network at all, so this stays
         * an app you can open in a shed.
         */
        navigateFallback: undefined,
        runtimeCaching: [
          {
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mmssim-pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 8 },
              /*
               * Only a real page is kept. When the sign-in has expired, the
               * gate answers with a redirect to its sign-in page; Workbox
               * would otherwise keep that redirect in place of the page, and
               * the next time the app was opened offline there would be
               * nothing to open.
               */
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
