import type { UIMessage } from 'ai';

/**
 * Concatena i part testuali di un messaggio UI, ignorando reasoning, tool call
 * e altri part non visualizzabili nella chat.
 */
export function getMessageText(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('');
}

/**
 * Trasforma un errore tecnico in un messaggio comprensibile all'utente.
 */
export function describeChatError(error: Error): string {
  const raw = error.message?.trim();

  if (!raw) {
    return 'Qualcosa è andato storto. Riprova tra qualche istante.';
  }

  if (/failed to fetch|networkerror|network error|load failed/i.test(raw)) {
    return 'Connessione assente o interrotta. Controlla la rete e riprova.';
  }

  if (/503|non configurato|missing.*api key/i.test(raw)) {
    return 'Il servizio non è configurato: manca la chiave Gemini sul server.';
  }

  if (/429|rate limit|quota/i.test(raw)) {
    return 'Troppe richieste in questo momento. Attendi qualche secondo e riprova.';
  }

  return raw.length > 280 ? `${raw.slice(0, 280)}…` : raw;
}
