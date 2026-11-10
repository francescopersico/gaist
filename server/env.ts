export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const DEFAULT_PORT = 3000;

export interface ServerConfig {
  apiKey: string | undefined;
  model: string;
  port: number;
}

/**
 * Risolve la configurazione del server.
 *
 * In Google AI Studio la chiave è iniettata come `GEMINI_API_KEY`; in locale
 * AI SDK usa convenzionalmente `GOOGLE_GENERATIVE_AI_API_KEY`. Accettiamo
 * entrambe, dando precedenza al secret di AI Studio.
 */
export function readServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const apiKey =
    env.GEMINI_API_KEY?.trim() || env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const parsedPort = Number(env.PORT ?? DEFAULT_PORT);
  const port =
    Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65_536
      ? parsedPort
      : DEFAULT_PORT;

  return {
    apiKey: apiKey || undefined,
    model,
    port,
  };
}
