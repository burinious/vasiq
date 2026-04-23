function formatMessageTime(timestamp) {
  if (!timestamp) return 'Sending...';
  if (typeof timestamp?.toDate === 'function') {
    return timestamp.toDate().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMessageMeta(message, isOwnMessage) {
  if (!isOwnMessage) {
    return formatMessageTime(message.createdAt);
  }

  if (message.deliveryStatus === 'failed') {
    return 'Failed to send';
  }

  if (message.deliveryStatus === 'read') {
    return `Read${message.createdAt ? ` - ${formatMessageTime(message.createdAt)}` : ''}`;
  }

  if (message.deliveryStatus === 'delivered') {
    return `Delivered${message.createdAt ? ` - ${formatMessageTime(message.createdAt)}` : ''}`;
  }

  if (message.deliveryStatus === 'sent') {
    return `Sent${message.createdAt ? ` - ${formatMessageTime(message.createdAt)}` : ''}`;
  }

  if (message.deliveryStatus === 'sending' || message.hasPendingWrites) {
    return 'Sending...';
  }

  if (!message.createdAt) {
    return 'Sent';
  }

  return `Sent - ${formatMessageTime(message.createdAt)}`;
}

function ChatWindow({
  title,
  subtitle,
  messages,
  messageText,
  onMessageTextChange,
  onSendMessage,
  currentUserId,
  disabled,
  status,
}) {
  return (
    <section className="panel chat-window">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Conversation</p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="message-thread">
        {messages.length ? (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                className={`message-bubble ${isOwnMessage ? 'message-bubble-own' : ''}`}
              >
                {!isOwnMessage ? <strong>{message.senderName || 'Student'}</strong> : null}
                <p>{message.text}</p>
                <span
                  className={`message-meta ${
                    message.deliveryStatus === 'failed' ? 'message-meta-failed' : ''
                  }`}
                >
                  {getMessageMeta(message, isOwnMessage)}
                </span>
              </div>
            );
          })
        ) : (
          <p className="muted-text">No messages yet.</p>
        )}
      </div>

      <form className="chat-form" onSubmit={onSendMessage}>
        <input
          className="input"
          value={messageText}
          onChange={(event) => onMessageTextChange(event.target.value)}
          placeholder="Type a message"
          disabled={disabled}
        />
        <button
          type="submit"
          className="primary-button"
          disabled={disabled || !messageText.trim()}
        >
          Send
        </button>
      </form>
      {status ? <p className="error-text">{status}</p> : null}
    </section>
  );
}

export default ChatWindow;
