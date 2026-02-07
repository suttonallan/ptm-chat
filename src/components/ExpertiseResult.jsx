const ExpertiseResult = ({ result }) => {
  if (!result) return null;

  return (
    <div className="expertise-result">
      <div className="result-header">
        <h2 className="result-title">Résultat de l'expertise</h2>
      </div>

      <div className="result-verdict">
        <p className="verdict-text">{result.verdict}</p>
      </div>

      <div className="result-score">
        <div className="score-header">
          <span className="score-label">Score</span>
          <span className="score-value">{result.score}/100</span>
        </div>
        <div className="score-bar-container">
          <div
            className="score-bar-fill"
            style={{ width: `${result.score}%` }}
          />
        </div>
      </div>

      <div className="result-comment">
        <h3 className="comment-title">Commentaire expert</h3>
        <p className="comment-text">{result.commentaire_expert}</p>
      </div>
    </div>
  );
};

export default ExpertiseResult;
