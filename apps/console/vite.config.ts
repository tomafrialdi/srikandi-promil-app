import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The monorepo root also has a React copy (pinned for apps/mobile). Force a single instance.
  resolve: { dedupe: ['react', 'react-dom'] },
})
