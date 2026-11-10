import { createUIMessageStream } from 'ai';
import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  createChatRouter,
  MAX_TOTAL_TEXT_CHARS,
  MissingApiKeyError,
  totalTextLength,
  type ChatStreamFactory,
} from '../server/chat';

const validBody = {
  messages: [
    {
      id: 'm1',
      role: 'user',
      parts: [{ type: 'text', text: 'Ciao, chi sei?' }],
    },
  ],
};

function buildApp(createStream: ChatStreamFactory): Express {
  const app = express();
  app.use(express.json({ limit: '256kb' }));
  app.use('/api', createChatRouter({ createStream }));
  return app;
}

const fakeStream: ChatStreamFactory = async () =>
  createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'start' });
      writer.write({ type: 'text-start', id: 't1' });
      writer.write({ type: 'text-delta', id: 't1', delta: 'Ciao dal test' });
      writer.write({ type: 'text-end', id: 't1' });
      writer.write({ type: 'finish' });
    },
  });

describe('POST /api/chat', () => {
  it('rifiuta un body non valido con 400', async () => {
    const app = buildApp(fakeStream);

    const response = await request(app)
      .post('/api/chat')
      .send({ messages: [] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Richiesta non valida.' });
  });

  it('rifiuta un payload testuale troppo grande con 400', async () => {
    const app = buildApp(fakeStream);
    const response = await request(app)
      .post('/api/chat')
      .send({
        messages: [
          {
            id: 'm1',
            role: 'user',
            parts: [
              { type: 'text', text: 'a'.repeat(MAX_TOTAL_TEXT_CHARS + 1) },
            ],
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain(String(MAX_TOTAL_TEXT_CHARS));
  });

  it('restituisce 503 quando manca la API key', async () => {
    const app = buildApp(async () => {
      throw new MissingApiKeyError();
    });

    const response = await request(app).post('/api/chat').send(validBody);

    expect(response.status).toBe(503);
    expect(response.body.error).toContain('GEMINI_API_KEY');
  });

  it('restituisce 500 senza esporre dettagli interni', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const app = buildApp(async () => {
      throw new Error('segreto interno del provider');
    });

    const response = await request(app).post('/api/chat').send(validBody);

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('segreto interno');
    consoleError.mockRestore();
  });

  it('trasmette lo stream UI con 200 e i delta testuali', async () => {
    const app = buildApp(fakeStream);

    const response = await request(app).post('/api/chat').send(validBody);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/event-stream');
    expect(response.text).toContain('"type":"start"');
    expect(response.text).toContain('"type":"text-delta"');
    expect(response.text).toContain('Ciao dal test');
  });

  it('passa i messaggi e un AbortSignal al factory', async () => {
    const factory = vi.fn(fakeStream);
    const app = buildApp(factory);

    await request(app).post('/api/chat').send(validBody);

    expect(factory).toHaveBeenCalledTimes(1);
    const input = factory.mock.calls[0]?.[0];
    expect(input?.messages).toHaveLength(1);
    expect(input?.abortSignal).toBeInstanceOf(AbortSignal);
  });
});

describe('totalTextLength', () => {
  it('somma solo i part testuali', () => {
    const total = totalTextLength([
      {
        parts: [
          { type: 'text', text: 'abc' },
          { type: 'file', text: 'ignorato' },
          { type: 'text', text: 'de' },
        ],
      },
    ]);

    expect(total).toBe(5);
  });

  it('ignora valori non stringa', () => {
    expect(totalTextLength([{ parts: [{ type: 'text', text: 42 }] }])).toBe(0);
  });
});
