import { useState, useRef } from 'react';

const ExpertiseForm = ({ onSubmit, isLoading, error }) => {
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const newPhotos = [...photos, ...imageFiles].slice(0, 3);
      setPhotos(newPhotos);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) return;
    
    if (onSubmit) {
      onSubmit(photos, notes);
    }
  };

  return (
    <div className="expertise-form">
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Upload photos */}
      <div className="upload-section">
        <label className="upload-label">Photos du piano (1-3 photos)</label>
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''} ${photos.length > 0 ? 'has-photos' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          {photos.length === 0 ? (
            <div className="upload-placeholder">
              <span className="upload-icon">📷</span>
              <p>Glissez-déposez vos photos ici ou cliquez pour sélectionner</p>
            </div>
          ) : (
            <div className="photos-preview">
              {photos.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Piano ${index + 1}`}
                    className="photo-preview"
                  />
                  <button
                    className="photo-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(index);
                    }}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes optionnelles */}
      <div className="notes-section">
        <label className="notes-label" htmlFor="notes">
          Notes optionnelles (marque, état, année)
        </label>
        <textarea
          id="notes"
          className="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Yamaha U3, 1985, quelques touches collantes..."
          rows={4}
        />
      </div>

      {/* Bouton Analyser */}
      <button
        className="analyze-button"
        onClick={handleAnalyze}
        disabled={photos.length === 0 || isLoading}
      >
        {isLoading ? 'Analyse en cours...' : 'Analyser mon piano'}
      </button>
    </div>
  );
};

export default ExpertiseForm;
