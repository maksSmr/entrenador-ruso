import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = process.env.VITE_API_URL || entorno.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    define: {
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    server: {
      port: 5173,
    },
  };
});
