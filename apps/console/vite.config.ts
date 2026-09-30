import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The monorepo root also has a React copy (pinned for apps/mobile). Force a single instance.
  resolve: { dedupe: ['react', 'react-dom'] },
})
