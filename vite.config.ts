import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    // The desktop CSP allows local fonts, not data: URLs. Keep even the small
    // CJK subsets as files so the approved pixel typography actually loads.
    assetsInlineLimit: 0,
  },
});

