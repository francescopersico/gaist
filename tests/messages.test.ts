import type { UIMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { describeChatError, getMessageText } from '../src/lib/messages';

function assistantMessage(parts: UIMessage['parts']): UIMessage {
  return { id: 'a1', role: 'assistant', parts };
}

describe('getMessageText', () => {
  it('concatena i part testuali', () => {
    const message = assistantMessage([
      { type: 'text', text: 'Ciao' },
      { type: 'text', text: ' mondo' },
    ]);

    expect(getMessageText(message)).toBe('Ciao mondo');
  });

  it('ignora i part non testuali', () => {
    const message = assistantMessage([
      { type: 'text', text: 'Risposta' },
      { type: 'reasoning', text: 'ragionamento interno' },
    ]);

    expect(getMessageText(message)).toBe('Risposta');
  });
});

describe('describeChatError', () => {
  it('traduce gli errori di rete', () => {
    expect(describeChatError(new Error('Failed to fetch'))).toContain(
      'Connessione',
    );
  });

  it('spiega il 503 di configurazione', () => {
    expect(
      describeChatError(new Error('503 Servizio non configurato')),
    ).toContain('chiave Gemini');
  });

  it('traduce il rate limit', () => {
    expect(describeChatError(new Error('429 rate limit'))).toContain(
      'Troppe richieste',
    );
  });

  it('tronca i messaggi molto lunghi', () => {
    const described = describeChatError(new Error('x'.repeat(500)));

    expect(described.length).toBeLessThanOrEqual(281);
    expect(described.endsWith('…')).toBe(true);
  });

  it('gestisce errori senza messaggio', () => {
    expect(describeChatError(new Error(''))).toContain('Qualcosa è andato storto');
  });
});
