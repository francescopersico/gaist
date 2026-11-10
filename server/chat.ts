import { createGoogle } from '@ai-sdk/google';
import {
  convertToModelMessages,
  pipeUIMessageStreamToResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import { Router } from 'express';
import { z } from 'zod';
import { readServerConfig } from './env';

export const MAX_MESSAGES = 40;
export const MAX_PARTS_PER_MESSAGE = 64;
export const MAX_TOTAL_TEXT_CHARS = 32_000;
export const MAX_OUTPUT_TOKENS = 2_048;

const SYSTEM_PROMPT = [
  'Sei un assistente AI utile, diretto e affidabile.',
  'Rispondi nella lingua in cui ti scrive l’utente.',
  'Sii conciso ma completo; usa elenchi o passaggi quando aiutano la chiarezza.',
  'Scrivi in testo semplice: evita Markdown decorativo (grassetto, corsivo, titoli), salvo blocchi di codice quando l’utente li chiede.',
  'Se non conosci una risposta, dillo invece di inventare fatti.',
].join(' ');

const partSchema = z.object({ type: z.string() }).loose();

const messageSchema = z.object({
  id: z.string().min(1).max(128),
  role: z.enum(['system', 'user', 'assistant']),
  parts: z
    .array(partSchema)
    .min(1)
    .max(MAX_PARTS_PER_MESSAGE),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
});

export class MissingApiKeyError extends Error {
  constructor() {
    super('Nessuna API key Gemini configurata.');
    this.name = 'MissingApiKeyError';
  }
}

export interface ChatStreamInput {
  messages: UIMessage[];
  abortSignal: AbortSignal;
}

export type ChatStreamFactory = (
  input: ChatStreamInput,
) => Promise<ReadableStream<UIMessageChunk>>;

/**
 * Somma i caratteri dei soli part testuali, così i payload binari non
 * aggirano il limite complessivo dell'input.
 */
export function totalTextLength(
  messages: Array<{ parts: Array<{ type?: unknown; text?: unknown }> }>,
): number {
  let total = 0;

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === 'text' && typeof part.text === 'string') {
        total += part.text.length;
      }
    }
  }

  return total;
}

export async function createGeminiStream({
  messages,
  abortSignal,
}: ChatStreamInput): Promise<ReadableStream<UIMessageChunk>> {
  const { apiKey, model } = readServerConfig();

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const google = createGoogle({ apiKey });
  const result = streamText({
    model: google(model),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.7,
    abortSignal,
  });

  return toUIMessageStream({ stream: result.stream });
}

export interface ChatRouterOptions {
  createStream?: ChatStreamFactory;
}

export function createChatRouter(
  options: ChatRouterOptions = {},
): Router {
  const createStream = options.createStream ?? createGeminiStream;
  const router = Router();

  router.post('/chat', async (req, res) => {
    const parsed = chatRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'Richiesta non valida.' });
      return;
    }

    if (totalTextLength(parsed.data.messages) > MAX_TOTAL_TEXT_CHARS) {
      res.status(400).json({
        error: `Il messaggio supera il limite di ${MAX_TOTAL_TEXT_CHARS} caratteri.`,
      });
      return;
    }

    const controller = new AbortController();
    res.on('close', () => controller.abort());

    try {
      const stream = await createStream({
        messages: parsed.data.messages as UIMessage[],
        abortSignal: controller.signal,
      });

      pipeUIMessageStreamToResponse({ response: res, stream });
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }

      if (error instanceof MissingApiKeyError) {
        res.status(503).json({
          error:
            'Servizio non configurato: manca la variabile GEMINI_API_KEY.',
        });
        return;
      }

      console.error('[chat] errore durante la generazione:', error);
      res.status(500).json({
        error: 'Errore durante la generazione della risposta.',
      });
    }
  });

  return router;
}
