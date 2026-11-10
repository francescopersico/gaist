import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import Composer from './components/Composer';
import EmptyState from './components/EmptyState';
import MessageList from './components/MessageList';
import { describeChatError } from './lib/messages';

export default function App() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    regenerate,
    clearError,
    setMessages,
  } = useChat();

  const isBusy = status === 'submitted' || status === 'streaming';
  const hasConversation = messages.length > 0;

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !nearBottomRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [messages, status]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    if (error) clearError();
    void sendMessage({ text: trimmed });
    setInput('');
  };

  const retry = () => {
    clearError();
    void regenerate();
  };

  const newChat = () => {
    clearError();
    setMessages([]);
    setInput('');
  };

  const statusLabel =
    status === 'streaming'
      ? 'Sta rispondendo…'
      : status === 'submitted'
        ? 'In attesa…'
        : status === 'error'
          ? 'Errore'
          : 'Pronto';

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 10.9 10.1 9 12 3.5Z"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h1>Gaist Chat</h1>
            <p className="subtitle">Gemini · AI SDK</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className={`status status-${status}`} aria-live="polite">
            <span className="status-dot" aria-hidden="true" />
            {statusLabel}
          </span>
          <button
            type="button"
            className="ghost-button"
            onClick={newChat}
            disabled={isBusy || (!hasConversation && !error)}
          >
            Nuova chat
          </button>
        </div>
      </header>

      <main className="chat-panel">
        <div
          className="messages-scroll"
          ref={scrollRef}
          onScroll={(event) => {
            const element = event.currentTarget;
            nearBottomRef.current =
              element.scrollHeight - element.scrollTop - element.clientHeight < 80;
          }}
        >
          {hasConversation ? (
            <MessageList messages={messages} isStreaming={isBusy} />
          ) : (
            <EmptyState
              onSelect={(prompt) => submit(prompt)}
              disabled={isBusy}
            />
          )}
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <p>{describeChatError(error)}</p>
            <div className="error-actions">
              {hasConversation && (
                <button type="button" className="ghost-button" onClick={retry}>
                  Riprova
                </button>
              )}
              <button type="button" className="ghost-button" onClick={clearError}>
                Chiudi
              </button>
            </div>
          </div>
        )}

        <Composer
          input={input}
          isBusy={isBusy}
          canStop={status === 'streaming'}
          onChange={setInput}
          onSubmit={() => submit(input)}
          onStop={stop}
        />
      </main>
    </div>
  );
}
