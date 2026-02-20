import { useEffect, useState } from 'react';
import ChatWidget from './components/ChatWidget';
import './App.css';

const App = () => {
  const isWidgetMode = new URLSearchParams(window.location.search).get('widget') === 'true';
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBadgeMinimized, setIsBadgeMinimized] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const openChat = () => {
    setIsChatOpen(true);
    // Dire au parent (WordPress) d'agrandir l'iframe
    if (isWidgetMode) window.parent.postMessage('ptm-chat-open', '*');
  };

  const closeChat = () => {
    setIsChatOpen(false);
    // Dire au parent (WordPress) de réduire l'iframe
    if (isWidgetMode) window.parent.postMessage('ptm-chat-close', '*');
  };

  const handleChatSend = () => {
    setChatInput('');
  };

  const initialMessage = [
    'Bonjour ! Hello ! 👋',
    'Je suis l\'assistant de Piano Technique Montréal. I\'m the Piano Technique Montréal assistant.',
    '',
    '💡 Envoyez-moi des photos de votre piano avec 📎 pour une évaluation gratuite !',
    'Send me photos of your piano with 📎 for a free evaluation!',
  ].join('\n');

  useEffect(() => {
    document.body.classList.toggle('widget-mode', isWidgetMode);
    document.documentElement.classList.toggle('widget-mode', isWidgetMode);
    return () => {
      document.body.classList.remove('widget-mode');
      document.documentElement.classList.remove('widget-mode');
    };
  }, [isWidgetMode]);

  if (isWidgetMode) {
    return (
      <div className="app widget-only">
        {!isChatOpen ? (
          <div className="chat-badge-container">
            {!isBadgeMinimized ? (
              <button
                className="chat-badge"
                onClick={openChat}
                aria-label="Ouvrir le chat"
              >
                <span className="chat-badge-logo">
                  <img src="/logo-ptm.png" alt="PTM" />
                </span>
                <span className="chat-badge-text">📸 Évaluation gratuite !</span>
                <button
                  type="button"
                  className="chat-badge-close"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsBadgeMinimized(true);
                  }}
                  aria-label="Masquer le badge"
                >
                  ×
                </button>
              </button>
            ) : (
              <button
                className="chat-badge-mini"
                onClick={openChat}
                onMouseEnter={() => setIsBadgeMinimized(false)}
                aria-label="Réafficher le chat"
              >
                💬
              </button>
            )}
          </div>
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
  }

  return (
    <div className="app app-frame">
      <div className="phone-frame">
        <div className="phone-screen">
          <header className="ptm-header">
        <div className="ptm-header-row">
          <div className="ptm-logo">
            <span className="ptm-keys" aria-hidden="true" />
          </div>
          <div className="ptm-brand">
            <div className="ptm-brand-title">PIANO TECHNIQUE MONTRÉAL</div>
            <div className="ptm-brand-subtitle">Techniciens accordeurs</div>
          </div>
          <div className="ptm-menu" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <button className="ptm-cta">CHOISIR MON RENDEZ-VOUS</button>
          </header>

          <main className="ptm-main">
            <section className="ptm-hero">
          <h1 className="ptm-hero-title">
            ENTRETIEN, <span className="ptm-highlight">ACCORD</span> & RESTAURATION DE PIANOS
          </h1>
          <p className="ptm-hero-subtitle">LA BONNE SANTÉ DE VOTRE PIANO VOUS TIENT À CŒUR?</p>
          <p className="ptm-hero-text">
            Nos techniciens accordeurs s&apos;assurent de la richesse et douceur du son, de la précision du
            toucher, de l&apos;expression des nuances et du confort du jeu pour votre plaisir de jouer.
          </p>
          <button className="ptm-secondary-cta">
            <span className="ptm-highlight">EN SAVOIR PLUS</span>
          </button>
            </section>
          </main>

          <footer className="ptm-footer">© 2026 Piano Technique Montréal</footer>

          {/* WIDGET CHAT FLOTTANT */}
          {!isChatOpen ? (
            <div className="chat-badge-container">
              {!isBadgeMinimized ? (
                <button
                  className="chat-badge"
                  onClick={openChat}
                  aria-label="Ouvrir le chat"
                >
                  <span className="chat-badge-logo">
                    <img src="/logo-ptm.png" alt="PTM" />
                  </span>
                  <span className="chat-badge-text">📸 Évaluation gratuite !</span>
                  <button
                    type="button"
                    className="chat-badge-close"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsBadgeMinimized(true);
                    }}
                    aria-label="Masquer le badge"
                  >
                    ×
                  </button>
                </button>
              ) : (
                <button
                  className="chat-badge-mini"
                  onClick={openChat}
                  onMouseEnter={() => setIsBadgeMinimized(false)}
                  aria-label="Réafficher le chat"
                >
                  💬
                </button>
              )}
            </div>
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
      </div>
    </div>
  );
};

export default App;
