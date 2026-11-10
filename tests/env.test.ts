import { describe, expect, it } from 'vitest';
import { DEFAULT_MODEL, DEFAULT_PORT, readServerConfig } from '../server/env';

describe('readServerConfig', () => {
  it('usa il secret di AI Studio prima della variabile AI SDK', () => {
    const config = readServerConfig({
      GEMINI_API_KEY: '  studio-key  ',
      GOOGLE_GENERATIVE_AI_API_KEY: 'sdk-key',
    });

    expect(config.apiKey).toBe('studio-key');
  });

  it('ricade su GOOGLE_GENERATIVE_AI_API_KEY per lo sviluppo locale', () => {
    const config = readServerConfig({
      GOOGLE_GENERATIVE_AI_API_KEY: 'sdk-key',
    });

    expect(config.apiKey).toBe('sdk-key');
  });

  it('restituisce undefined senza chiave', () => {
    const config = readServerConfig({});

    expect(config.apiKey).toBeUndefined();
  });

  it('applica i default per modello e porta', () => {
    const config = readServerConfig({});

    expect(config.model).toBe(DEFAULT_MODEL);
    expect(config.port).toBe(DEFAULT_PORT);
  });

  it('ignora porte non valide', () => {
    expect(readServerConfig({ PORT: '0' }).port).toBe(DEFAULT_PORT);
    expect(readServerConfig({ PORT: 'abc' }).port).toBe(DEFAULT_PORT);
    expect(readServerConfig({ PORT: '99999' }).port).toBe(DEFAULT_PORT);
    expect(readServerConfig({ PORT: '8080' }).port).toBe(8080);
  });
});
