import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages specific configuration
  base: process.env.NODE_ENV === 'production' ? '/tictactoe-discord/' : '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: undefined,
      }
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 3000,
    https: false, // Discord requires HTTPS in production, but local dev can use HTTP
  },
  
  // Ensure proper MIME types for Discord Activities
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
