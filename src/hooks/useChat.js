import { useState, useCallback, useEffect } from 'react';

const useChat = (initialMessage = null) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialiser le message initial quand il est fourni
  useEffect(() => {
    if (initialMessage && !hasInitialized && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        role: 'bot',
        text: initialMessage,
        timestamp: new Date()
      }]);
      setHasInitialized(true);
    }
  }, [initialMessage, hasInitialized, messages.length]);

  const generateBotResponse = (userText) => {
    const text = userText.toLowerCase();
    
    if (text.includes('prix') || text.includes('coût') || text.includes('combien') || text.includes('accord')) {
      return "Le mot « accordage » peut signifier différentes choses selon l'état de votre piano — ça peut aller d'un simple accord de maintien à une remise à niveau complète. Nos services vont de 250$ à 2500$ et plus, selon vos besoins. C'est exactement pour ça qu'on offre l'expertise : mieux comprendre votre piano pour vous proposer le bon service !";
    }
    
    if (text.includes('rendez-vous') || text.includes('rv') || text.includes('disponible')) {
      return "Je peux vous proposer une inspection par Zoom ou en personne à Montréal. Quel format vous convient ?";
    }
    
    if (text.includes('zoom')) {
      return "Parfait ! Nos inspections Zoom durent environ 30 minutes. Voulez-vous choisir un créneau ?";
    }
    
    return "Merci pour votre question ! Un membre de notre équipe pourra vous répondre en détail. Souhaitez-vous être contacté par email ?";
  };

  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simuler la réponse du bot après 500ms
    setIsTyping(true);
    
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  }, []);

  return {
    messages,
    sendMessage,
    isTyping
  };
};

export default useChat;
