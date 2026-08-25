// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ghurobangladesh.com',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        if (item.url.endsWith('.com/')) return { ...item, priority: 1.0, changefreq: 'daily' };
        if (/\/(places|districts|divisions)\/[^/]+\/?$/.test(item.url)) return { ...item, priority: 0.8 };
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: { output: { manualChunks: undefined } },
    },
  },
  experimental: { clientPrerender: true },
});
