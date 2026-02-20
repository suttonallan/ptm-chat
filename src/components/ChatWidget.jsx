import { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import useChat from '../hooks/useChat';
import { API_CHAT_UPLOAD } from '../config/api';

// Détection simple anglais vs français (même logique que useChat)
const EN_WORDS = /\b(the|is|are|how|much|what|when|where|do|does|can|could|would|my|your|this|that|have|has|for|with|about|piano|tuning|need|want|please|yes|no|hi|hello|thanks|thank)\b/i;
function isConversationEnglish(messages) {
  // Regarde les messages user pour déterminer la langue
  const userTexts = messages
    .filter(m => m.role === 'user' && m.text)
    .map(m => m.text)
    .join(' ');
  if (!userTexts) return false;
  const matches = (userTexts.match(EN_WORDS) || []).length;
  return matches >= 2;
}

const ChatWidget = ({ isOpen, onClose, initialMessage, inputValue, onInputChange, onSend }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expertiseResult, setExpertiseResult] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [pendingPhotoPreviews, setPendingPhotoPreviews] = useState([]);
  const [awaitingContext, setAwaitingContext] = useState(false);
  const [textMessageCount, setTextMessageCount] = useState(0);
  const fileInputRef = useRef(null);
  const { messages, sendMessage, isTyping, addMessage, getSessionId } = useChat(initialMessage, expertiseResult);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Fix iOS Safari: ajuster la hauteur quand le clavier ou la barre de nav change
  const inputFieldRef = useRef(null);
  useEffect(() => {
    const setVH = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    };
    setVH();
    window.visualViewport?.addEventListener('resize', setVH);
    window.addEventListener('resize', setVH);
    return () => {
      window.visualViewport?.removeEventListener('resize', setVH);
      window.removeEventListener('resize', setVH);
    };
  }, []);


  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const trimmed = inputValue.trim();
    setTextMessageCount((prev) => prev + 1);

    if (awaitingContext && pendingPhotos.length > 0) {
      addMessage({
        id: Date.now(),
        role: 'user',
        text: trimmed,
        timestamp: new Date()
      });

      runExpertise(pendingPhotos, trimmed);
      setPendingPhotos([]);
      setPendingPhotoPreviews([]);
      setAwaitingContext(false);
      onSend(inputValue);
      return;
    }

    sendMessage(trimmed);
    onSend(inputValue);
  };

  const runExpertise = async (files, notes = '') => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      files.forEach((file) => { formData.append('images', file); });
      formData.append('session_id', getSessionId());
      formData.append('message', notes?.trim() || '');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      const response = await fetch(API_CHAT_UPLOAD, { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.expertise_result) setExpertiseResult(data.expertise_result);
      addMessage({ id: Date.now() + 1, role: 'bot', text: data.reply, timestamp: new Date() });
    } catch (error) {
      const en = isConversationEnglish(messages);
      const isTimeout = error.name === 'AbortError';
      addMessage({
        id: Date.now() + 1, role: 'bot',
        text: en
          ? (isTimeout ? "The analysis is taking too long. Please try again." : "Sorry, the analysis couldn't be completed. " + (error.message || 'Please try again.'))
          : (isTimeout ? "L'analyse prend trop de temps. Veuillez réessayer." : "Désolé, l'analyse n'a pas pu être effectuée. " + (error.message || 'Réessayez.')),
        timestamp: new Date()
      });
    } finally { setIsAnalyzing(false); }
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

    if (textMessageCount >= 2) {
      runExpertise(limitedFiles, '');
    } else {
      setPendingPhotos(limitedFiles);
      setAwaitingContext(true);
      const en = isConversationEnglish(messages);
      addMessage({
        id: Date.now() + 1,
        role: 'bot',
        text: en
          ? "Thanks for the photos! 📸 Before I run the analysis, it would help to know a bit more:\n\n• When was it last tuned?\n• What concerns do you have?\n\nFor a better evaluation, a full view of the piano and a shot of the inside (brand, serial numbers, hammers) would be ideal!"
          : "Merci pour les photos ! 📸 Avant que je lance l'analyse, ça m'aiderait d'en savoir un peu plus :\n\n• Quand a-t-il été accordé pour la dernière fois ?\n• Qu'est-ce qui vous préoccupe ?\n\nPour une meilleure évaluation, une vue d'ensemble du piano et une photo de l'intérieur (marque, numéros de série, marteaux) seraient idéales !",
        timestamp: new Date()
      });
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
              {isConversationEnglish(messages) ? 'PTM is typing...' : "PTM est en train d'écrire..."}
            </div>
          </div>
        )}
        {isAnalyzing && (
          <div className="chat-message bot">
            <div className="message-bubble typing-indicator">
              {isConversationEnglish(messages) ? 'Analyzing...' : 'Analyse en cours...'}
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
          onTouchStart={(e) => e.target.focus()}
          placeholder={isConversationEnglish(messages) ? "Type your message..." : "Tapez votre message..."}
        />
        <button type="submit" className="chat-send-button">
          {isConversationEnglish(messages) ? 'Send' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
