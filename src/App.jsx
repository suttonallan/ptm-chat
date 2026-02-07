import { useState } from 'react';
import ChatWidget from './components/ChatWidget';
import './App.css';

const App = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleChatSend = () => {
    setChatInput('');
  };

  const initialMessage = [
    'Bonjour ! 👋 Je suis l\'assistant de Piano Technique Montréal.',
    '',
    '💡 Envoyez-moi 1 à 3 photos de votre piano avec le bouton 📎 et obtenez une évaluation gratuite en quelques secondes !',
    '',
    'Ou posez-moi vos questions sur nos services.'
  ].join('\n');

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header-inner">🎹 Piano Technique Montréal</div>
      </header>

      <main className="site-main">
        <section className="hero">
          <h1 className="hero-title">
            Accordage et entretien de pianos à Montréal et partout dans le monde
          </h1>
          <p className="hero-subtitle">
            Expertise gratuite par IA • Accordage • Réparation • Restauration • Inspection Zoom
          </p>
        </section>

        <section className="services-grid">
          <div className="service-card">
            <div className="service-icon">🎼</div>
            <h3 className="service-title">Accordage professionnel</h3>
            <p className="service-text">Précision, stabilité et musicalité, adaptés à votre piano.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🔧</div>
            <h3 className="service-title">Réparation & entretien</h3>
            <p className="service-text">Interventions fiables pour préserver la mécanique et le toucher.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">🪵</div>
            <h3 className="service-title">Restauration</h3>
            <p className="service-text">Remise à neuf complète avec respect du caractère d'origine.</p>
          </div>
          <div className="service-card">
            <div className="service-icon">📹</div>
            <h3 className="service-title">Inspection Zoom</h3>
            <p className="service-text">Évaluation à distance guidée par un technicien certifié.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        © 2026 Piano Technique Montréal
      </footer>

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
          initialMessage={initialMessage}
          inputValue={chatInput}
          onInputChange={setChatInput}
          onSend={handleChatSend}
        />
      )}
    </div>
  );
};

export default App;
