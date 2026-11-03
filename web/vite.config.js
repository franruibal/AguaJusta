import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, /api va a la API de Node (puerto 3001).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:3001' },
  },
});
