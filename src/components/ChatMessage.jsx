// Rend cliquables les adresses web, les courriels et le numéro de téléphone,
// et retire le gras Markdown (**…**) que l'IA produit parfois.
const MOTIF = /(https?:\/\/[^\s<>)"']+|[\w.+-]+@[\w-]+\.[\w.-]+|514[ -.]?344[ -.]?8008)/g;

function texteAvecLiens(texte) {
  const propre = String(texte || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,6}\s+/gm, '');
  const morceaux = propre.split(MOTIF);
  return morceaux.map((m, i) => {
    if (i % 2 === 0) return m;
    // ponctuation collée à la fin d'une adresse (point, virgule…) : hors du lien
    const fin = m.match(/[.,;:!?]+$/);
    const coeur = fin ? m.slice(0, -fin[0].length) : m;
    let href;
    if (/^https?:\/\//.test(coeur)) href = coeur;
    else if (coeur.includes('@')) href = `mailto:${coeur}`;
    else href = 'tel:+15143448008';
    const externe = href.startsWith('http');
    return (
      <span key={i}>
        <a
          href={href}
          className="message-lien"
          target={externe ? '_blank' : undefined}
          rel={externe ? 'noopener noreferrer' : undefined}
        >
          {coeur}
        </a>
        {fin ? fin[0] : ''}
      </span>
    );
  });
}

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isImages = message.type === 'images';

  return (
    <div className={`chat-message ${isUser ? 'user' : 'bot'}`}>
      <div className="message-bubble">
        {isImages ? (
          <div className="message-images">
            {message.images?.map((image, index) => (
              <img
                key={`${message.id}-${index}`}
                src={image.url}
                alt={image.name || `Piano ${index + 1}`}
                className="message-image"
              />
            ))}
          </div>
        ) : (
          texteAvecLiens(message.text)
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
