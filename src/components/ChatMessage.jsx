const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'user' : 'bot'}`}>
      <div className="message-bubble">
        {message.text}
      </div>
    </div>
  );
};

export default ChatMessage;
