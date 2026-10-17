import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'tts-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api/tts', async (req, res) => {
          try {
            const url = new URL(req.url, 'http://localhost');
            let q = url.searchParams.get('q');
            let tl = url.searchParams.get('tl') || 'hi';
            if (!q || !q.trim()) {
              res.statusCode = 400;
              return res.end('Missing text query parameter: q');
            }

            // Clean text for TTS engine (strip quotes, trim length < 170 chars)
            q = q.replace(/["“”'‘’]/g, '').trim();
            if (q.length > 170) {
              q = q.substring(0, 168);
            }

            const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
              q
            )}&tl=${encodeURIComponent(tl)}&client=tw-ob`;

            const response = await fetch(targetUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            });

            if (!response.ok) {
              res.statusCode = response.status;
              return res.end('Google TTS stream error');
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(buffer);
          } catch (err) {
            console.error('TTS proxy error:', err);
            res.statusCode = 500;
            res.end(err.message);
          }
        });
      },
    },
  ],
})
