import { useEffect, useRef, useState } from 'react';
import ChatMessage from './ChatMessage';
import useChat from '../hooks/useChat';
import { API_EXPERTISE } from '../config/api';

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
  const { messages, sendMessage, isTyping, addMessage } = useChat(initialMessage, expertiseResult);
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
      files.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('email', '');
      formData.append('notes', notes?.trim() || '');

      const response = await fetch(API_EXPERTISE, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Expertise API raw response:", JSON.stringify(data, null, 2));
      console.log("Response type:", typeof data, data);

      // Construire un message lisible à partir de la réponse API
      const d = data;
      const en = isConversationEnglish(messages);
      let text = en ? "📊 Piano Evaluation:\n\n" : "📊 Évaluation de votre piano :\n\n";

      if (d.marque_detectee && d.marque_detectee !== "Non identifiée") {
        text += `🎹 ${d.marque_detectee}`;
        if (d.modele_detecte) text += ` — ${d.modele_detecte}`;
        text += "\n";
      }
      if (d.historique_marque) {
        text += `${d.historique_marque}\n`;
      }
      if (d.annee_estimee) {
        text += en ? `📅 Estimated age: ${d.annee_estimee}\n` : `📅 Âge estimé : ${d.annee_estimee}\n`;
      }

      text += en ? `\n⭐ Score: ${d.score}/10\n` : `\n⭐ Score : ${d.score}/10\n`;
      text += en ? `📋 Verdict: ${d.verdict}\n` : `📋 Verdict : ${d.verdict}\n`;

      if (d.valeur_marche_estimee && d.valeur_marche_estimee.sans_travaux) {
        text += en
          ? `\n💰 Estimated value: ${d.valeur_marche_estimee.sans_travaux} (as is)`
          : `\n💰 Valeur estimée : ${d.valeur_marche_estimee.sans_travaux} (en l'état)`;
        if (d.valeur_marche_estimee.avec_travaux) {
          text += en
            ? ` → ${d.valeur_marche_estimee.avec_travaux} (after repairs)`
            : ` → ${d.valeur_marche_estimee.avec_travaux} (après travaux)`;
        }
        text += "\n";
      }

      if (d.commentaire_expert) {
        text += `\n💬 ${d.commentaire_expert}\n`;
      }

      if (d.prochaine_etape) {
        text += `\n👉 ${d.prochaine_etape}\n`;
      }

      text += en
        ? "\n⚠️ This evaluation is generated by AI from photos. It does not replace an in-person inspection by a certified technician."
        : "\n⚠️ Cette évaluation est générée par intelligence artificielle à partir de photos. Elle ne remplace pas une inspection en personne par un technicien certifié.";

      setExpertiseResult(d);

      addMessage({
        id: Date.now() + 1,
        role: 'bot',
        text: text,
        timestamp: new Date()
      });
    } catch (error) {
      const en = isConversationEnglish(messages);
      addMessage({
        id: Date.now() + 1,
        role: 'bot',
        text: en
          ? "Sorry, the analysis couldn't be completed. Please try again with different photos."
          : "Désolé, l'analyse n'a pas pu être effectuée. Réessayez avec d'autres photos.",
        timestamp: new Date()
      });
    } finally {
      setIsAnalyzing(false);
    }
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
