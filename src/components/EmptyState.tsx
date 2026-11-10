interface EmptyStateProps {
  onSelect: (prompt: string) => void;
  disabled: boolean;
}

const SUGGESTIONS = [
  'Spiegami in due minuti cosa è lo AI SDK e a cosa serve.',
  'Scrivi una funzione TypeScript che inverte una stringa.',
  'Dammi tre idee semplici per un’app basata su Gemini.',
];

export default function EmptyState({ onSelect, disabled }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-labelledby="empty-title">
      <div className="empty-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path
            d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.4l-1.9-5.6L4.5 10.9 10.1 9 12 3.5Z"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 id="empty-title">Ciao, come posso aiutarti?</h2>
      <p>
        Scrivi un messaggio oppure parti da uno spunto. Le risposte vengono
        generate da Gemini e arrivano in streaming.
      </p>
      <div className="suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="suggestion"
            onClick={() => onSelect(suggestion)}
            disabled={disabled}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  );
}
