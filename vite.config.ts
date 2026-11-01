import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Development only: the production app nginx forwards /ws to the relay service (nginx.conf).
  server: { proxy: { '/ws': { target: 'ws://localhost:8081', ws: true } } },
})
