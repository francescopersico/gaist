# Gaist Chat

Web app a **pagina singola** per conversare con **Google Gemini**, costruita con
[AI SDK](https://ai-sdk.dev) e pronta per essere importata e pubblicata come App
in **Google AI Studio**.

- Frontend React 19 + Vite, una sola pagina.
- Backend Express 5 con endpoint streaming `POST /api/chat`.
- Provider `@ai-sdk/google`: la API key resta **solo lato server**.
- Layout responsive, tema chiaro/scuro, accessibilità verificata.

## Requisiti

- Node.js **>= 22** (richiesto da `ai@7`; vedere `.nvmrc`)
- Una API key Gemini: <https://aistudio.google.com/apikey>

## Avvio locale

```bash
npm install
cp .env.example .env
# apri .env e compila GEMINI_API_KEY
npm run dev
```

Apri <http://localhost:3000>.

## Variabili d'ambiente

| Variabile | Obbligatoria | Default | Descrizione |
| --------- | ------------ | ------- | ----------- |
| `GEMINI_API_KEY` | sì | — | Chiave Gemini. In AI Studio è iniettata automaticamente come secret. |
| `GOOGLE_GENERATIVE_AI_API_KEY` | no | — | Fallback letto da AI SDK se `GEMINI_API_KEY` non è definita. |
| `GEMINI_MODEL` | no | `gemini-3.8-flash` | Modello Gemini da usare. |
| `PORT` | no | `3000` | Porta del server HTTP. |

Il file `.env` è ignorato da Git: non committare mai chiavi reali.

## Script

| Comando | Cosa fa |
| ------- | ------- |
| `npm run dev` | Avvia Express con Vite in middleware mode su `localhost:3000`. |
| `npm run dev:watch` | Come `dev`, ma riavvia il server a ogni modifica (solo locale interattivo). |
| `npm run build` | Genera la build di produzione in `dist/`. |
| `npm start` | Serve `dist/` e le API in modalità produzione. |
| `npm run typecheck` | TypeScript in modalità `--noEmit`. |
| `npm test` | Test Vitest (handler HTTP, config, helper e rendering). |
| `npm run test:watch` | Test in watch mode. |

## Struttura

```
index.html              entry Vite
metadata.json           metadati per Google AI Studio
server/
  index.ts              Express: dev Vite middleware / static in produzione
  chat.ts               POST /api/chat con AI SDK + Gemini
  env.ts                lettura e validazione delle variabili d'ambiente
src/
  App.tsx               pagina unica: useChat + layout
  components/           MessageList, Composer, EmptyState
  lib/messages.ts       helper di presentazione e messaggi d'errore
  styles.css            design token, responsive, dark mode
tests/                  Vitest + Supertest + rendering SSR
```

Flusso di una richiesta:

1. `useChat` invia la cronologia a `POST /api/chat`.
2. Il server valida il body con Zod e converte i messaggi UI in messaggi modello.
3. `streamText` chiama Gemini e `pipeUIMessageStreamToResponse` trasmette i delta.
4. Il client aggiorna i `parts` dei messaggi in tempo reale.

Limiti applicati: massimo 40 messaggi, 32.000 caratteri di testo per richiesta,
2.048 token di output.

## Test e verifiche

```bash
npm run typecheck
npm test
npm run build
```

Per un test manuale con Gemini reale:

```bash
npm run dev
curl -sN -X POST http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"messages":[{"id":"m1","role":"user","parts":[{"type":"text","text":"Ciao!"}]}]}'
```

## Pubblicazione su Google AI Studio

La pubblicazione richiede il tuo account Google e GitHub: l'import e il
**Publish** non possono essere automatizzati da questo repository.

### 1. Repository GitHub

Il progetto è già pubblicato su
<https://github.com/francescopersico/gaist> (branch `main`). Per modifiche
future:

```bash
git add .
git commit -m "fix: descrizione della modifica"
git push
```

### 2. Importa in AI Studio

1. Apri [Google AI Studio Build](https://aistudio.google.com/apps).
2. Nel box del prompt, apri il menu **Add files (+)** e scegli
   **Import from GitHub**.
3. Autorizza GitHub se richiesto e seleziona il repository.
4. Attendi la normalizzazione del progetto e la preview.

### 3. Configura il secret

In AI Studio apri **Settings → Secrets** e verifica che esista
`GEMINI_API_KEY`. Per una nuova app è configurata automaticamente; se manca,
aggiungila con una chiave Gemini.

### 4. Pubblica

1. Controlla la preview: invia un messaggio e verifica lo streaming.
2. Clicca **Publish** in alto a destra.
3. Con lo **Starter Tier** puoi pubblicare fino a 2 app e scegliere un URL
   `https://<nome>.ai.studio`. Con un progetto Google Cloud paid hai più quota e
   i domini personalizzati.

Se la preview segnala errori di build, chiedi all'agente di AI Studio:

> fix any build issues with the current code

### Note sul runtime AI Studio

- Il runtime è React + Node.js: la struttura del progetto è già compatibile.
- `npm run dev` e `npm start` usano `tsx` **senza watch mode**, così non
  dipendono da stdin o da un TTY interattivo (sandbox e container chiudono
  spesso stdin con EOF). `npm run dev:watch` è solo per lo sviluppo locale.
- La chiave è iniettata solo lato server come `GEMINI_API_KEY`; il provider la
  legge esplicitamente con fallback su `GOOGLE_GENERATIVE_AI_API_KEY`.
- Se il runtime usasse una versione di Node precedente alla 22, `ai@7` non
  partirebbe: in quel caso va valutato il downgrade al tag npm `ai-v6`.

## Limiti noti

- Nessuna autenticazione: chiunque abbia l'URL pubblicato può usare l'app e
  consumare la quota della tua API key.
- Nessuna persistenza: ricaricando la pagina la conversazione si azzera.
- Solo testo: niente immagini, audio, tool calling o ricerca Google.
- Lo Stop è disponibile solo durante lo streaming effettivo, per evitare che una
  risposta annullata arrivi fuori ordine.
