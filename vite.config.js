import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'html-dev-transform',
      transformIndexHtml: {
        order: 'pre',
        handler(html, ctx) {
          // If in dev server mode or during build preparation, inject /src/main.jsx
          let processed = html
            .replace(/<script type="module" crossorigin src="\/assets\/[^"]+"><\/script>/g, '')
            .replace(/<link rel="stylesheet" crossorigin href="\/assets\/[^"]+">/g, '');
          if (!processed.includes('/src/main.jsx')) {
            processed = processed.replace('</body>', '  <script type="module" src="/src/main.jsx"></script>\n</body>');
          }
          return processed;
        }
      }
    }
  ],
})
