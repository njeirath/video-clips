import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/jellyfin-capture-api',
  test: {
    name: 'jellyfin-capture-api',
    watch: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reportsDirectory: '../../coverage/apps/jellyfin-capture-api',
      provider: 'v8',
    },
  },
});
