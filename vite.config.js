import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Force the automatic JSX runtime so JSX components do not depend on a global React variable.
  plugins: [react({ jsxRuntime: 'automatic' })],
  esbuild: {
    jsx: 'automatic'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (
            id.includes('/node_modules/leaflet/') ||
            id.includes('/node_modules/react-leaflet/')
          ) {
            return 'maps';
          }

          if (id.includes('/node_modules/@supabase/')) {
            return 'supabase';
          }

          if (id.includes('/node_modules/lucide-react/')) {
            return 'icons';
          }
        }
      }
    }
  }
});
