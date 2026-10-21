import { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import useChat from '../hooks/useChat';
import { API_CHAT_UPLOAD } from '../config/api';

// Détection simple anglais vs français (même logique que useChat)
const EN_WORDS = /\b(the|is|are|how|much|what|when|where|does|can|could|would|my|your|this|that|have|has|for|with|about|need|want|please|yes|hello|thanks|thank)\b/gi;
function isConversationEnglish(messages) {
  // Regarde les messages user pour déterminer la langue
  const userTexts = messages
    .filter(m => m.role === 'user' && m.text)
    .map(m => m.text)
    .join(' ');
  if (!userTexts) return !/^fr\b/i.test((typeof navigator !== 'undefined' && navigator.language) || 'fr');
  const matches = (userTexts.match(EN_WORDS) || []).length;
  return matches >= 2;
}

// Réduit la photo (~1600 px, JPEG) avant l'envoi : passe sous la limite de 5 Mo de l'IA
// et retire les métadonnées (dont la position GPS). En cas d'échec, garde l'original.
async function preparerPhoto(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1600;
    const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    if (!blob) return file;
    return new File([blob], (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

const MAX_PHOTOS = 3;

const ChatWidget = ({ isOpen, onClose, initialMessage, inputValue, onInputChange, onSend }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expertiseResult, setExpertiseResult] = useState(null);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [pendingPhotoPreviews, setPendingPhotoPreviews] = useState([]);
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
    const trimmed = inputValue.trim();

    // Photos en attente : on les envoie toutes ensemble, avec le texte s'il y en a un.
    if (pendingPhotos.length > 0) {
      addMessage({ id: Date.now(), role: 'user', type: 'images', images: pendingPhotoPreviews, timestamp: new Date() });
      if (trimmed) addMessage({ id: Date.now() + 1, role: 'user', text: trimmed, timestamp: new Date() });
      runExpertise(pendingPhotos, trimmed);
      setPendingPhotos([]);
      setPendingPhotoPreviews([]);
      onSend(inputValue);
      return;
    }

    if (!trimmed) return;
    sendMessage(trimmed);
    onSend(inputValue);
  };

  const retirerPhoto = (i) => {
    setPendingPhotos((p) => p.filter((_, j) => j !== i));
    setPendingPhotoPreviews((p) => p.filter((_, j) => j !== i));
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
    const choisies = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (resetInput) resetInput();
    const place = MAX_PHOTOS - pendingPhotos.length;
    if (choisies.length === 0 || place <= 0) return;
    const pretes = await Promise.all(choisies.slice(0, place).map(preparerPhoto));
    setPendingPhotos((p) => [...p, ...pretes].slice(0, MAX_PHOTOS));
    setPendingPhotoPreviews((p) => [...p, ...pretes.map((f) => ({ url: URL.createObjectURL(f), name: f.name }))].slice(0, MAX_PHOTOS));
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

      {pendingPhotoPreviews.length > 0 && (
        <div className="chat-photo-tray">
          <div className="chat-photo-tray-thumbs">
            {pendingPhotoPreviews.map((p, i) => (
              <div className="chat-photo-thumb" key={p.url}>
                <img src={p.url} alt="" />
                <button type="button" onClick={() => retirerPhoto(i)} aria-label={isConversationEnglish(messages) ? 'Remove photo' : 'Retirer la photo'}>×</button>
              </div>
            ))}
            {pendingPhotoPreviews.length < MAX_PHOTOS && (
              <button type="button" className="chat-photo-add" onClick={() => fileInputRef.current?.click()}>
                {isConversationEnglish(messages) ? '+ Photo' : '+ Photo'}
              </button>
            )}
          </div>
          <div className="chat-photo-tray-hint">
            {isConversationEnglish(messages)
              ? `${pendingPhotoPreviews.length}/${MAX_PHOTOS} photos. Add a word if you like (inherited, buying…), then tap Send.`
              : `${pendingPhotoPreviews.length}/${MAX_PHOTOS} photos. Ajoutez un mot si vous voulez (hérité, achat…), puis touchez Envoyer.`}
          </div>
        </div>
      )}

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
