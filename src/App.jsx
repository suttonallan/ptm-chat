import { useState } from 'react';
import ChatWidget from './components/ChatWidget';
import ExpertiseForm from './components/ExpertiseForm';
import ExpertiseResult from './components/ExpertiseResult';
import Disclaimer from './components/Disclaimer';
import useExpertise from './hooks/useExpertise';
import './App.css';

const App = () => {
  const { result, isLoading, isSuccess, isError, isIdle, error, reset, submitExpertise } = useExpertise();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleChatSend = (text) => {
    setChatInput('');
  };

  const getInitialChatMessage = () => {
    if (result) {
      return "J'ai analysé votre piano ! Avez-vous des questions sur le résultat ou nos services ?";
    }
    return "Bonjour ! Comment puis-je vous aider ?";
  };


  return (
    <div className="app">
      {/* SECTION PRINCIPALE */}
      <main className="main-section">
        <div className="main-container">
          <h1 className="main-title">🎹 Expertise Piano par IA</h1>
          <p className="main-subtitle">
            Obtenez une évaluation préliminaire gratuite de votre piano
          </p>

          {isIdle && (
            <ExpertiseForm 
              onSubmit={submitExpertise}
              isLoading={isLoading}
              error={error}
            />
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyse en cours...</p>
            </div>
          )}

          {isSuccess && result && (
            <>
              <ExpertiseResult result={result} />
              <Disclaimer />
            </>
          )}

          {isError && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p className="error-message-text">{error || 'Une erreur est survenue lors de l\'analyse'}</p>
              <button
                className="retry-button"
                onClick={reset}
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </main>

      {/* WIDGET CHAT FLOTTANT */}
      {!isChatOpen ? (
        <button
          className="chat-badge"
          onClick={openChat}
          aria-label="Ouvrir le chat"
        >
          <span className="chat-badge-icon">🎹</span>
        </button>
      ) : (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={closeChat}
          initialMessage={getInitialChatMessage()}
          inputValue={chatInput}
          onInputChange={setChatInput}
          onSend={handleChatSend}
        />
      )}
    </div>
  );
};

export default App;
