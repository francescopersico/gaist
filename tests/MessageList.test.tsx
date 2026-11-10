import type { UIMessage } from 'ai';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MessageList from '../src/components/MessageList';

const userMessage: UIMessage = {
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text: 'Domanda utente' }],
};

const streamingMessage: UIMessage = {
  id: 'a1',
  role: 'assistant',
  parts: [{ type: 'text', text: 'Risposta parziale' }],
};

const pendingMessage: UIMessage = {
  id: 'a2',
  role: 'assistant',
  parts: [{ type: 'text', text: '' }],
};

describe('MessageList', () => {
  it('mostra messaggi utente e assistente', () => {
    const html = renderToStaticMarkup(
      createElement(MessageList, {
        messages: [userMessage, streamingMessage],
        isStreaming: false,
      }),
    );

    expect(html).toContain('Domanda utente');
    expect(html).toContain('Risposta parziale');
    expect(html).toContain('message-user');
    expect(html).toContain('message-assistant');
    expect(html).not.toContain('caret');
  });

  it('mostra il cursore sull’ultima risposta in streaming', () => {
    const html = renderToStaticMarkup(
      createElement(MessageList, {
        messages: [userMessage, streamingMessage],
        isStreaming: true,
      }),
    );

    expect(html).toContain('caret');
  });

  it('mostra i puntini quando la risposta è ancora vuota', () => {
    const html = renderToStaticMarkup(
      createElement(MessageList, {
        messages: [userMessage, pendingMessage],
        isStreaming: true,
      }),
    );

    expect(html).toContain('typing');
    expect(html).toContain('sta scrivendo');
  });
});
