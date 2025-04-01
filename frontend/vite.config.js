import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for production build
  base: '/',
  
  // Resolve aliases for easier imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  },
  
  // Prevent asset inlining for 3D models and textures
  build: {
    assetsInlineLimit: 0,
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  
  // Development server options
  server: {
    // Enable hot module replacement
    hmr: true,
    // Expose to network (important for Docker)
    host: '0.0.0.0',
    port: 5173,
  }
});