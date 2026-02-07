const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isImages = message.type === 'images';
  const isExpertise = message.type === 'expertise';

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
        ) : isExpertise ? (
          <div className="expertise-message">
            <div className="expertise-title">📊 Évaluation de votre piano :</div>
            <div className="expertise-score">Score : {message.expertise?.score}/100</div>
            <div className="expertise-verdict">{message.expertise?.verdict}</div>
            <div className="expertise-comment">💬 {message.expertise?.commentaire_expert}</div>
            <div className="expertise-disclaimer">
              ⚠️ Cette évaluation est générée par intelligence artificielle à partir de photos. Elle ne remplace pas une inspection en personne par un technicien certifié.
            </div>
            <div className="expertise-cta">Souhaitez-vous en savoir plus sur nos services ou prendre rendez-vous ?</div>
          </div>
        ) : (
          message.text
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
