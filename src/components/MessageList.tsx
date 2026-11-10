import type { UIMessage } from 'ai';
import { getMessageText } from '../lib/messages';

interface MessageListProps {
  messages: UIMessage[];
  isStreaming: boolean;
}

export default function MessageList({
  messages,
  isStreaming,
}: MessageListProps) {
  return (
    <div className="message-list" role="log" aria-live="polite" aria-relevant="additions text">
      {messages.map((message, index) => {
        const text = getMessageText(message);
        const isLast = index === messages.length - 1;
        const isPending = isLast && isStreaming && message.role === 'assistant';
        const isUser = message.role === 'user';

        return (
          <article
            key={message.id}
            className={`message ${isUser ? 'message-user' : 'message-assistant'}`}
            aria-label={isUser ? 'Tu' : 'Assistente'}
          >
            {!isUser && (
              <div className="avatar" aria-hidden="true">
                AI
              </div>
            )}
            <div className="bubble">
              {text ? (
                <p className="message-text">
                  {text}
                  {isPending && <span className="caret" aria-hidden="true" />}
                </p>
              ) : isPending ? (
                <span className="typing" aria-label="L’assistente sta scrivendo">
                  <span />
                  <span />
                  <span />
                </span>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
