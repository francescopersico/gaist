import { useEffect, useRef } from 'react';

interface ComposerProps {
  input: string;
  isBusy: boolean;
  canStop: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}

export default function Composer({
  input,
  isBusy,
  canStop,
  onChange,
  onSubmit,
  onStop,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="sr-only" htmlFor="chat-input">
        Scrivi un messaggio
      </label>
      <textarea
        id="chat-input"
        ref={textareaRef}
        className="composer-input"
        value={input}
        rows={1}
        placeholder="Scrivi un messaggio…"
        autoComplete="off"
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            if (!isBusy) onSubmit();
          }
        }}
      />
      <div className="composer-actions">
        {canStop ? (
          <button
            type="button"
            className="icon-button stop-button"
            onClick={onStop}
            aria-label="Interrompi la risposta"
            title="Interrompi"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            className="icon-button send-button"
            disabled={isBusy || input.trim().length === 0}
            aria-label="Invia messaggio"
            title="Invia (Invio)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 19V5m0 0-6 6m6-6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
