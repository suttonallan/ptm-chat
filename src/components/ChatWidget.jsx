import { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import useChat from '../hooks/useChat';
import { API_EXPERTISE } from '../config/api';

const ChatWidget = ({ isOpen, onClose, initialMessage, inputValue, onInputChange, onSend }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expertiseResult, setExpertiseResult] = useState(null);
  const fileInputRef = useRef(null);
  const { messages, sendMessage, isTyping, addMessage } = useChat(initialMessage, expertiseResult);
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

  const handleFileSelect = async (files, resetInput) => {
    const imageFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const limitedFiles = imageFiles.slice(0, 3);
    const imagePreviews = limitedFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    addMessage({
      id: Date.now(),
      role: 'user',
      type: 'images',
      images: imagePreviews,
      timestamp: new Date()
    });

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      limitedFiles.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('email', '');
      formData.append('notes', '');

      const response = await fetch(API_EXPERTISE, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setExpertiseResult(data);

      const formattedResult = [
        '📊 Évaluation de votre piano :',
        `Score : ${data.score}/100`,
        data.verdict,
        '',
        `💬 ${data.commentaire_expert}`,
        '',
        '⚠️ Cette évaluation est générée par IA. Un technicien certifié pourra valider ces observations.',
        '',
        'Souhaitez-vous en savoir plus sur nos services ou prendre rendez-vous ?'
      ].join('\n');

      addMessage({
        id: Date.now() + 1,
        role: 'bot',
        text: formattedResult,
        timestamp: new Date()
      });
    } catch (error) {
      addMessage({
        id: Date.now() + 1,
        role: 'bot',
        text: "Désolé, l'analyse n'a pas pu être effectuée. Réessayez avec d'autres photos.",
        timestamp: new Date()
      });
    } finally {
      setIsAnalyzing(false);
    }

    if (resetInput) {
      resetInput();
    }
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
          <span className="chat-close-desktop">✕ Fermer</span>
          <span className="chat-close-mobile">← Retour au site</span>
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
        {isAnalyzing && (
          <div className="chat-message bot">
            <div className="message-bubble typing-indicator">
              Analyse en cours...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSend}>
        <button
          type="button"
          className="chat-attach-button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Joindre des photos"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="chat-file-input"
          onChange={(e) => handleFileSelect(e.target.files, () => { e.target.value = ''; })}
        />
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
