import { useState, useCallback, useEffect, useRef } from 'react';
import { API_CHAT } from '../config/api';

const useChat = (initialMessage = null, expertiseResult = null) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const sessionIdRef = useRef(null);

  // Générer le session_id une seule fois au premier message
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
    }
    return sessionIdRef.current;
  }, []);

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

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Générer session_id au premier message
      const sessionId = getSessionId();

      // Préparer le payload
      const payload = {
        message: text.trim(),
        session_id: sessionId,
        expertise_result: expertiseResult || null
      };

      // Appel API
      const response = await fetch(API_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || "Désolé, je n'ai pas pu obtenir de réponse.";

      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: botReply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling chat API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: "Désolé, je n'ai pas pu répondre. Réessayez.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [expertiseResult, getSessionId]);

  return {
    messages,
    sendMessage,
    isTyping
  };
};

export default useChat;
