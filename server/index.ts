import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createChatRouter } from './chat';
import { readServerConfig } from './env';

if (existsSync('.env')) {
  loadEnvFile('.env');
}

const { port } = readServerConfig();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', createChatRouter());

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato.' });
});

if (isProduction) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);
}

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Gaist Chat in ascolto su http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
