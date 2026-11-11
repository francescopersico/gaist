# Iteration v0.1.0 — Chat AI a pagina singola su Google AI Studio

- **Status:** in-progress
- **Scope type:** minor
- **Started:** 2026-11-10
- **Last updated:** 2026-11-11

> Fasi 1–4 completate. Fase 5 in corso: repository pubblico
> `francescopersico/gaist` creato e pushato; restano import in AI Studio,
> verifica del secret e Publish.

## 1. Objective

Realizzare una web app a pagina singola che permetta di conversare con un agente
AI basato su Google Gemini tramite AI SDK, e renderla importabile e pubblicabile
come App in Google AI Studio collegando il repository GitHub.

## 2. Starting state

Verificato il 2026-11-10 con ispezione diretta del repository:

| Evidenza | Risultato osservato |
| -------- | ------------------- |
| `git log --oneline -10` | un solo commit: `0159aa3 Set agents instructions` |
| `git status --short` | working tree pulito |
| Contenuto root | `AGENTS.md`, `iterations/PLAN.template.md`, `.git/` |
| `package.json` | assente |
| `.gitignore` | assente |
| `git remote -v` | nessun remote configurato |
| `node -v` / `npm -v` | `v24.21.0` / `11.19.0` |
| `gh auth status` | autenticato come `francescopersico`, scope `repo` (non usato: push manuale scelto dall'utente) |
| Iterazioni esistenti | nessuna; `iterations/` contiene solo il template |

Non esiste quindi alcun codice applicativo, test, build o configurazione da cui
partire: l'iterazione parte da zero.

## 3. Scope

### In scope

- App web a **una sola pagina** con interfaccia chat (lista messaggi, composer,
  streaming delle risposte, stato di errore, stop della generazione).
- Backend Node.js/Express che espone `POST /api/chat` e usa **AI SDK** con il
  provider `@ai-sdk/google`.
- API key letta solo lato server, compatibile con il secret `GEMINI_API_KEY`
  iniettato da Google AI Studio.
- Progetto eseguibile in locale con un solo comando e buildabile per produzione.
- Test automatici minimi su handler HTTP e helper di presentazione.
- README con procedura completa: setup locale, variabili d'ambiente, creazione
  repository GitHub, **Import from GitHub** in AI Studio e **Publish**.

### Out of scope

- Autenticazione utenti, rate limiting per account, quota per utente.
- Persistenza delle conversazioni (DB, Firestore, localStorage).
- Tool calling, ricerca Google, input multimodale, generazione immagini.
- Multi-pagina, routing, internazionalizzazione.
- Deploy automatico da CI o da parte dell'agente: l'import e la pubblicazione in
  AI Studio richiedono il login dell'utente su Google e GitHub.
- Creazione del repository remoto e `git push` (l'utente ha scelto push manuale).

## 4. Decisions

| Ambito | Scelta | Alternative valutate | Motivo |
| ------ | ------ | -------------------- | ------ |
| Stack | Vite 8 + React 19 + TypeScript + Express 5 | Next.js App Router; SPA senza backend | AI Studio Build genera/esporta "standard React frontend + Node.js backend" e il suo runtime è React + Node. Una forma nativa riduce il lavoro di normalizzazione dell'import. Next.js richiederebbe una trasformazione del progetto. |
| SDK LLM | `ai@7` + `@ai-sdk/google@4` | `@google/genai` diretto; endpoint OpenAI-compatible | Requisito esplicito dell'utente (AI SDK); è anche il percorso indicato dalla guida ufficiale AI Studio "Gemini and the AI SDK by Vercel". |
| Streaming | `streamText` + `toUIMessageStream` + `pipeUIMessageStreamToResponse` | risposta non-streaming; SSE custom | Pattern ufficiale AI SDK per Express; compatibile con `useChat`. |
| API key | `createGoogle({ apiKey })` con fallback `GEMINI_API_KEY` → `GOOGLE_GENERATIVE_AI_API_KEY` | solo `GOOGLE_GENERATIVE_AI_API_KEY` | AI Studio inietta il secret come `GEMINI_API_KEY`; il fallback permette lo sviluppo locale con la convenzione AI SDK. |
| Modello | `gemini-3.8-flash`, override con `GEMINI_MODEL` | `gemini-4-argon` (flagship, più lento/costoso); `gemini-3.5-flash-lite` (minimo costo) | Modello Flash corrente indicato nella doc AI Studio e usato negli esempi ufficiali con AI SDK: buon compromesso latenza/qualità per una chat. |
| Dev server | un solo processo/porta: Express + Vite in `middlewareMode`; `dev` senza watch, `dev:watch` solo locale | Vite dev + proxy verso server separato; `concurrently`; `tsx watch` come `dev` | Il runtime AI Studio espone una sola porta e non è interattivo: `tsx watch` legge stdin e in sandbox/container può comportarsi in modo imprevedibile. `dev` resta avviabile sempre; il riavvio automatico è opt-in. |
| Stile | CSS puro con design token, un solo foglio | Tailwind CSS + plugin | Meno dipendenze di build, meno superficie di rottura nell'import AI Studio; per una singola pagina non serve un framework CSS. |
| Rendering risposte | testo semplice con `white-space: pre-wrap` | renderer Markdown (`react-markdown`) | Meno dipendenze e nessun rischio di HTML non sanificato; il system prompt chiede di evitare Markdown decorativo. |
| Manifest AI Studio | `metadata.json` con `majorCapabilities: ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]` | omettere il campo | Campo non documentato nella doc pubblica, ma presente in tutte le app generate da AI Studio che usano Gemini lato server: dichiara la capability e favorisce l'iniezione del secret `GEMINI_API_KEY`. |
| Stop generazione | visibile solo durante `status === 'streaming'` | sempre durante `submitted`/`streaming` | Durante i test autonomi lo stop in fase `submitted` seguito da un nuovo invio faceva arrivare fuori ordine la risposta annullata. |
| Test | Vitest + Supertest, handler con dipendenza di streaming iniettabile | Playwright E2E | Verifica rapida e deterministica senza chiamare Gemini; i test E2E richiedono rete e API key. |
| Build server | `tsx` anche in produzione (`start`) | `tsc` separato + `node dist-server` | Node richiede ≥22 per `ai@7`; `tsx` evita problemi di estensioni ESM nel build del server ed è il runner suggerito dalla doc AI Studio. |
| Deploy | Import manuale del repo in AI Studio + Publish | Cloud Run via `gcloud`; hosting terzo | Obiettivo esplicito: App su Google AI Studio collegata al repo GitHub. |

## 5. Architecture

```
.
├── index.html                  # entry Vite
├── metadata.json               # metadati app AI Studio (nome/permissioni)
├── package.json                # scripts: dev, build, start, test, typecheck
├── tsconfig.json               # client + server, noEmit per typecheck
├── vite.config.ts              # build SPA in dist/
├── .env.example                # GEMINI_API_KEY / GEMINI_MODEL (nessun segreto)
├── .gitignore                  # solo essenziali
├── README.md                   # locale + GitHub + AI Studio
├── server/
│   ├── index.ts                # Express: middleware, Vite dev, static prod, listen
│   ├── chat.ts                 # router POST /api/chat (AI SDK + Gemini)
│   └── env.ts                  # lettura/validazione variabili d'ambiente
├── src/
│   ├── main.tsx                # bootstrap React
│   ├── App.tsx                 # pagina unica: useChat + layout
│   ├── components/
│   │   ├── MessageList.tsx     # messaggi e streaming
│   │   ├── Composer.tsx        # textarea, invio, stop
│   │   └── EmptyState.tsx      # suggerimenti iniziali
│   ├── lib/messages.ts         # estrazione testo e stato messaggi (testabile)
│   └── styles.css              # design token + stili responsive
└── tests/
    ├── chat.test.ts            # handler HTTP: 400, 200 stream, 503 senza key
    └── messages.test.ts        # helper UI
```

Flusso dati:

1. `src/App.tsx` usa `useChat` (`@ai-sdk/react`), transport di default su
   `POST /api/chat`.
2. Il browser invia `UIMessage[]` (role + parts).
3. `server/chat.ts` valida il body con Zod (array limitato, ruoli ammessi),
   converte con `convertToModelMessages` e chiama
   `streamText({ model: google(GEMINI_MODEL), system, messages })`.
4. La risposta viene pipeata con `pipeUIMessageStreamToResponse`; `useChat`
   aggiorna i `parts` in tempo reale.
5. La API key resta esclusivamente in `process.env` lato server.

Confini: `server/` non importa nulla da `src/`; `src/` non conosce provider né
chiavi; la logica di validazione/streaming è iniettabile per i test.

## 6. Phases

### Phase 1 — Scaffolding e shell eseguibile

- **Status:** complete
- **Changes:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`,
  `metadata.json`, `.gitignore`, `.env.example`, `server/index.ts`,
  `src/main.tsx`, `src/App.tsx` (placeholder), `src/styles.css`, `README.md`.
- **Tasks:**
  - [ ] Inizializzare il progetto con dipendenze `ai`, `@ai-sdk/google`,
        `@ai-sdk/react`, `react`, `react-dom`, `express`, `zod`, `tsx`.
  - [ ] Configurare devDependencies (`vite`, `@vitejs/plugin-react`, `typescript`,
        `vitest`, `supertest`, tipi).
  - [ ] Definire script `dev`, `build`, `start`, `typecheck`, `test`.
  - [ ] Creare il server Express con Vite in `middlewareMode`, health check e
        serving statico di `dist/` in produzione.
  - [ ] Creare il foglio di stile con token e la pagina placeholder.
  - [ ] Creare `.gitignore` con soli essenziali (`node_modules`, `dist`,
        `.env*` escluso `.env.example`, `coverage`, log, `.DS_Store`).
  - [ ] Documentare prerequisiti (Node ≥ 22) e comandi nel README.
- **Verification:**
  - `npm install` → exit 0.
  - `npm run typecheck` → nessun errore.
  - `npm run build` → `dist/index.html` e asset generati.
  - `npm run dev` poi `curl -sI http://localhost:3000/` → `HTTP/1.1 200`.
  - `git status --short` → nessun file ignorato o segreto in staging.
- **Acceptance criteria:** l'app si avvia su `http://localhost:3000`, la build di
  produzione riesce e non esiste alcun segreto nei file versionati.
- **Evidence (2026-11-10):** `npm install` exit 0; `npm run typecheck` exit 0;
  `npm run build` ha prodotto `dist/index.html` e asset; `curl -sI
  http://localhost:3000/` → `HTTP/1.1 200 OK`; `/api/health` → `{"status":"ok"}`.

### Phase 2 — Backend `/api/chat` con AI SDK e Gemini

- **Status:** complete
- **Changes:** `server/chat.ts`, `server/env.ts`, `server/index.ts`,
  `.env.example`, `README.md`.
- **Tasks:**
  - [ ] Definire schema Zod per il body (`messages`: array 1..40, ruoli
        `user`/`assistant`, dimensione massima del payload).
  - [ ] Creare il provider Google con risoluzione della chiave
        (`GEMINI_API_KEY` poi `GOOGLE_GENERATIVE_AI_API_KEY`).
  - [ ] Implementare `POST /api/chat`: `convertToModelMessages`, `streamText`
        con system prompt, `toUIMessageStream`,
        `pipeUIMessageStreamToResponse`.
  - [ ] Gestire abort su disconnessione client e timeout `/api/chat`.
  - [ ] Restituire errori JSON chiari: `400` body non valido, `503` chiave
        mancante, `500` errore provider (senza leak di dettagli sensibili).
  - [ ] Limitare `maxOutputTokens` e la lunghezza dell'input.
- **Verification:**
  - Con chiave valida: `curl -sN -X POST http://localhost:3000/api/chat -H 'content-type: application/json' -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"Ciao, chi sei?"}]}]}'`
    → frame `data: {"type":"start"...}` seguiti da `text-delta` e `finish`.
  - Senza chiave: stesso comando → HTTP `503` con `{"error":"..."}`.
  - Body invalido → HTTP `400`.
  - `npm run build && grep -r "GEMINI_API_KEY" dist/` → nessun match.
- **Acceptance criteria:** endpoint streaming funzionante con Gemini reale,
  errori espliciti e chiave mai presente nel bundle client.
- **Evidence (2026-11-10):** body invalido → `400 {"error":"Richiesta non
  valida."}`; senza chiave → `503`; endpoint sconosciuto → `404`. Con
  `GEMINI_API_KEY` reale: `POST /api/chat` → `200 text/event-stream`, chunk
  `start`/`text-delta`/`text-end`/`finish`, risposta osservata: «La capitale
  dell'Italia è Roma.». `grep -r "AIza" dist/` → nessun match.

### Phase 3 — UI chat a pagina singola

- **Status:** complete
- **Changes:** `src/App.tsx`, `src/components/*`, `src/lib/messages.ts`,
  `src/styles.css`.
- **Tasks:**
  - [ ] Integrare `useChat` con transport di default e stato
        `status`/`error`/`stop`.
  - [ ] Renderizzare i `parts` testuali, inclusi messaggi in streaming.
  - [ ] Empty state con 3 suggerimenti cliccabili che inviano un messaggio.
  - [ ] Composer: textarea auto-grow, Enter invia, Shift+Enter va a capo,
        disabilitato durante lo streaming, pulsante Stop.
  - [ ] Auto-scroll che rispetta lo scroll manuale dell'utente.
  - [ ] Banner di errore con azione "Riprova".
  - [ ] Accessibilità: label, `aria-live` per i messaggi, focus visibile,
        contrasto, `prefers-reduced-motion`.
  - [ ] Layout responsive mobile/desktop, tema chiaro/scuro automatico.
- **Verification:**
  - `npm run typecheck` → nessun errore.
  - `npm run build` → build ok.
  - Con `npm run dev` e chiave: apertura pagina, invio messaggio, testo che
    appare progressivamente, Stop che interrompe, errore simulato (chiave
    rimossa) che mostra il banner.
  - Verifica viewport 390×844 e 1440×900 senza overflow orizzontale.
- **Acceptance criteria:** una sola pagina, chat streaming utilizzabile con
  tastiera e touch, stati di errore e stop visibili e funzionanti.
- **Evidence (2026-11-10):** test nel browser: invio messaggio e risposta reale
  in streaming con cursore e stato «Sta rispondendo…»; Stop a metà risposta
  conserva il testo parziale e riporta lo stato a «Pronto»; senza chiave compare
  il banner con «Riprova»/«Chiudi»; «Nuova chat» ripristina l'empty state;
  viewport 390×844 senza overflow orizzontale. Lighthouse accessibilità: 100.

### Phase 4 — Test, hardening e documentazione AI Studio

- **Status:** complete
- **Changes:** `tests/*`, `vitest.config.ts` (se necessario), `README.md`,
  `.env.example`, `metadata.json`, `.gitignore`.
- **Tasks:**
  - [ ] Test handler con stream iniettato: 400 su body invalido, 200 e
        `content-type` corretto su richiesta valida, 503 senza chiave.
  - [ ] Test helper UI (`getMessageText`, stato streaming).
  - [ ] Aggiungere `engines.node >= 22` e `.nvmrc`.
  - [ ] README: setup, variabili, script, limiti noti, comandi git per creare e
        pushare il repository, procedura **Import from GitHub** e **Publish**
        in AI Studio, gestione secret `GEMINI_API_KEY`.
  - [ ] Verifica finale che nessun segreto o artefatto sia versionato.
- **Verification:**
  - `npm test` → suite verde.
  - `npm run typecheck` → nessun errore.
  - `npm run build` → build ok.
  - `npm start` poi `curl -sI http://localhost:3000/` → 200 e HTML.
  - `git ls-files | rg -n "\.env$|node_modules|dist/"` → nessun match.
- **Acceptance criteria:** test verdi, documentazione sufficiente a importare e
  pubblicare l'app senza assistenza.
- **Evidence (2026-11-10):** `npm test` → 4 file, 23 test verdi; `npm run
  typecheck` exit 0; `npm run build` exit 0; `PORT=3100 npm start` → `GET /`
  `200 text/html`, `/api/health` ok, `POST /api/chat` reale `200
  text/event-stream` con risposta «ok»; `git status` non elenca `.env`.

### Phase 5 — Import e pubblicazione in AI Studio (manuale)

- **Status:** in-progress
- **Changes:** `package.json`, `README.md`: `dev` senza watch mode per i
  runtime non interattivi; verifiche e adattamenti richiesti da AI Studio.
- **Tasks:**
  - [x] Repository GitHub pubblico creato e pushato su `main`.
  - [x] Rendere `dev`/`start` indipendenti da stdin e TTY (`tsx` senza watch);
        `dev:watch` resta solo per lo sviluppo locale.
  - [x] Dichiarare in `metadata.json` la capability
        `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
  - [ ] L'utente apre AI Studio Build → **Add files (+)** → **Import from
        GitHub** e seleziona il repository.
  - [ ] Verificare che il secret `GEMINI_API_KEY` sia presente in **Settings →
        Secrets**.
  - [ ] Correggere eventuali problemi di build segnalati dall'anteprima
        (prompt: "fix any build issues with the current code").
  - [ ] Publish con URL `*.ai.studio` (Starter Tier o progetto Cloud paid).
- **Verification:**
  - Anteprima AI Studio: invio di un messaggio e risposta in streaming.
  - `curl -sI <URL_PUBBLICATO>` → 200.
  - Messaggio reale dal vivo dopo la pubblicazione.
- **Acceptance criteria:** app raggiungibile su URL pubblico AI Studio e chat
  funzionante con il secret gestito da AI Studio.
- **Evidence (2026-11-10):** `gh repo create francescopersico/gaist --public
  --source=. --remote=origin --push` → <https://github.com/francescopersico/gaist>,
  branch `main` tracciato su `origin/main`, commit `d303536`.
- **Evidence (2026-11-11):** con `tsx 4.23.15`, `tsx watch server/index.ts` con
  stdin da `/dev/null` e da pipe chiusa subito è rimasto vivo (nessuna uscita
  osservata), ma `package.json` è stato comunque reso indipendente da stdin:
  `dev` = `tsx server/index.ts`, `dev:watch` = `tsx watch server/index.ts`.
  `metadata.json` ora dichiara `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, come
  nelle app generate da AI Studio che usano Gemini lato server.

## 7. Verification matrix

| Comando | Cosa verifica | Evidenza attesa |
| ------- | ------------- | --------------- |
| `npm install` | dipendenze risolvibili | exit 0, lockfile creato |
| `npm run typecheck` | tipi client e server | exit 0, nessun errore |
| `npm run build` | build Vite di produzione | `dist/index.html` + asset |
| `npm test` | handler e helper | suite verde |
| `npm run dev` + `curl -sI localhost:3000/` | dev server | `HTTP/1.1 200` |
| `curl -sN -X POST .../api/chat` | streaming reale | frame SSE `text-delta` |
| `curl` senza chiave | errore configurazione | `503` JSON |
| `curl` body invalido | validazione | `400` JSON |
| `npm start` + `curl -sI localhost:3000/` | serving produzione | `200` + HTML |
| `git ls-files` filtrato | igiene repository | nessun segreto/artefatto |
| `curl -sI <URL AI Studio>` | deploy | `200` |

## 8. Risks

| Rischio | Impatto | Mitigazione |
| ------- | ------- | ----------- |
| L'import AI Studio normalizza il progetto in modo imprevisto | build/preview rotta | struttura nativa React+Express, dipendenze standard, README con prompt di riparazione; fase 5 dedicata agli adattamenti |
| AI Studio usa `GEMINI_API_KEY`, AI SDK di default `GOOGLE_GENERATIVE_AI_API_KEY` | 401/503 in produzione | provider creato esplicitamente con fallback tra le due variabili |
| Runtime AI Studio con Node < 22 | `ai@7` non parte | dichiarare `engines.node >= 22`; in caso di blocco, valutare `ai@6` (tag `ai-v6`) come piano B documentato |
| Account non eleggibile allo Starter Tier (Workspace o billing pregresso) | Publish bloccata | documentare il fallback su progetto Google Cloud paid |
| Modello non disponibile/quotato nella regione dell'utente | errori provider | modello configurabile con `GEMINI_MODEL`; messaggio d'errore leggibile |
| App pubblica senza autenticazione | abuso e consumo quota | limiti su messaggi/token, nota nel README; auth fuori scope |
| Streaming bufferizzato da proxy/Cloud Run | risposta "a scatti" o vuota | `pipeUIMessageStreamToResponse`, header no-buffer, test end-to-end dopo publish |
| Chiave committata per errore | leak credenziali | `.gitignore` su `.env*`, `.env.example` senza valori, controllo `git ls-files` |

## 9. Sources consulted

| Fonte | URL | Consultata il | Informazioni usate |
| ----- | --- | ------------- | ------------------ |
| Google AI Studio — Build apps | https://aistudio.google.com/docs/aistudio-build-mode | 2026-11-10 | Web app = React client + Node.js server; Import from GitHub; sync; `GEMINI_API_KEY` server-side; `metadata.json` e `requestFramePermissions`; limiti deploy |
| Google AI Studio — Full-stack apps | https://aistudio.google.com/docs/aistudio-fullstack | 2026-11-10 | Runtime server Node, npm, gestione secret, best practice separazione UI/server |
| Google AI Studio — Publish | https://aistudio.google.com/docs/aistudio-deploying | 2026-11-10 | Publish su Cloud Run, Starter Tier (2 app), URL `*.ai.studio`, custom domain |
| Google AI Studio — Gemini + AI SDK by Vercel | https://aistudio.google.com/docs/vercel-ai-sdk-example.md | 2026-11-10 | Uso ufficiale di `ai` + `@ai-sdk/google` con Gemini; modello `gemini-3.8-flash`; variabile `GOOGLE_GENERATIVE_AI_API_KEY` |
| AI SDK — Google provider | https://ai-sdk.dev/providers/ai-sdk-providers/google | 2026-11-10 | `google()` / `createGoogle()`, `apiKey`, env di default, `streamText`, opzioni `thinkingConfig`, tabella modelli |
| AI SDK — Express cookbook | https://ai-sdk.dev/cookbook/api-servers/express | 2026-11-10 | `pipeUIMessageStreamToResponse` + `toUIMessageStream` per streaming su Express |
| AI SDK — Next.js quickstart | https://ai-sdk.dev/docs/getting-started/nextjs-app-router | 2026-11-10 | API v7: `convertToModelMessages`, `createUIMessageStreamResponse`, forma `UIMessage.parts`, `sendMessage` |
| AI SDK — useChat reference | https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat | 2026-11-10 | Transport default `/api/chat`, stato `status`/`error`, `stop`, `regenerate`, gestione input esterna |
| npm registry (`npm view ai`, `npm view @ai-sdk/google`, `npm view @ai-sdk/react`) | https://registry.npmjs.org/ai | 2026-11-10 | Versioni correnti (`ai@7.0.166`, `@ai-sdk/google@4.0.114`, `@ai-sdk/react@4.0.170`) e requisito `node >= 22` |
| Zeabur — Import from AI Studio | https://zeabur.com/docs/en-US/get-started/migration/aistudio | 2026-11-10 | Conferma che i progetti AI Studio sono React frontend + Express backend e che i secret non vengono esportati |
| MarkTechPost — AI Studio import from GitHub | https://www.marktechpost.com/2026/07/09/google-ai-studio-adds-import-from-github | 2026-11-10 | Comportamento dell'import: normalizzazione del repo nel formato del runtime, poi deploy |

## 10. Testing log

Vuoto: l'iterazione non è ancora entrata in `testing`.

## 11. Completion checklist

- [ ] Tutte le fasi pianificate sono `complete`.
- [ ] Verifica finale eseguita e documentata.
- [ ] README aggiornato.
- [ ] `.gitignore` contiene solo gli elementi essenziali.
- [ ] Iterazione portata a `testing` e consegnata all'utente.
- [ ] Chiusura esplicita dell'utente (`complete`).
