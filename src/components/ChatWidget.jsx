import { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import useChat from '../hooks/useChat';

const ChatWidget = ({ isOpen, onClose, initialMessage, inputValue, onInputChange, onSend, expertiseResult }) => {
  const { messages, sendMessage, isTyping } = useChat(initialMessage, expertiseResult);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);


  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue);
    onSend(inputValue);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-content">
          <span className="chat-header-icon">🎹</span>
          <span className="chat-header-title">Piano Technique Montréal</span>
        </div>
        <button
          className="chat-close"
          onClick={onClose}
          aria-label="Fermer le chat"
        >
          ×
        </button>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping && (
          <div className="chat-message bot">
            <div className="message-bubble typing-indicator">
              PTM est en train d'écrire...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Tapez votre message..."
        />
        <button type="submit" className="chat-send-button">
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
