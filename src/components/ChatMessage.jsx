const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isImages = message.type === 'images';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'bot'}`}>
      <div className="message-bubble">
        {isImages ? (
          <div className="message-images">
            {message.images?.map((image, index) => (
              <img
                key={`${message.id}-${index}`}
                src={image.url}
                alt={image.name || `Piano ${index + 1}`}
                className="message-image"
              />
            ))}
          </div>
        ) : (
          message.text
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
