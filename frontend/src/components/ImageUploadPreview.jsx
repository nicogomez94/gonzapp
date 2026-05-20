import { useState, useRef } from 'react';

/**
 * ImageUploadPreview
 * Props:
 *  - images: string[]       array of image URLs
 *  - onUpload: (e) => void  file-input onChange handler (calls uploadImages, updates parent)
 *  - onChange: (urls) => void  called when an image is removed
 *  - uploading: boolean
 *  - maxImages: number (optional)
 */
export default function ImageUploadPreview({ images = [], onUpload, onChange, uploading = false, maxImages }) {
  const [lightbox, setLightbox] = useState(null);
  const inputRef = useRef(null);

  const validImages = images.filter(Boolean);

  const removeImage = (url) => {
    onChange(validImages.filter(u => u !== url));
  };

  const handleLightboxKeyDown = (e) => {
    if (e.key === 'Escape') setLightbox(null);
    if (e.key === 'ArrowRight') {
      const idx = validImages.indexOf(lightbox);
      if (idx < validImages.length - 1) setLightbox(validImages[idx + 1]);
    }
    if (e.key === 'ArrowLeft') {
      const idx = validImages.indexOf(lightbox);
      if (idx > 0) setLightbox(validImages[idx - 1]);
    }
  };

  const lightboxIdx = validImages.indexOf(lightbox);

  return (
    <div className="image-upload-area">
      <div className="image-upload-row">
        <button
          type="button"
          className="btn btn-outline image-upload-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <i className="fa-solid fa-upload" />
          {uploading ? ' Cargando…' : ' Seleccionar archivos'}
        </button>
        {maxImages && (
          <span className="image-upload-hint">{validImages.length}/{maxImages} imágenes</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={onUpload}
          disabled={uploading}
        />
      </div>

      {validImages.length > 0 && (
        <div className="image-preview-grid">
          {validImages.map((url, i) => (
            <div key={url + i} className="image-preview-item" title="Clic para ampliar">
              <img
                src={url}
                alt={`Imagen ${i + 1}`}
                className="image-preview-thumb"
                onClick={() => setLightbox(url)}
                onError={e => { e.target.style.opacity = 0.25; }}
              />
              <button
                type="button"
                className="image-preview-remove"
                onClick={() => removeImage(url)}
                title="Eliminar imagen"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              <div className="image-preview-zoom-icon">
                <i className="fa-solid fa-magnifying-glass-plus" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="image-lightbox-overlay"
          onClick={() => setLightbox(null)}
          onKeyDown={handleLightboxKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de imagen"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        >
          <div className="image-lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="Vista previa ampliada" className="image-lightbox-img" />
            <div className="image-lightbox-toolbar">
              <button
                type="button"
                className="image-lightbox-nav"
                onClick={() => setLightbox(validImages[lightboxIdx - 1])}
                disabled={lightboxIdx === 0}
                title="Anterior"
              >
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span className="image-lightbox-counter">{lightboxIdx + 1} / {validImages.length}</span>
              <button
                type="button"
                className="image-lightbox-nav"
                onClick={() => setLightbox(validImages[lightboxIdx + 1])}
                disabled={lightboxIdx === validImages.length - 1}
                title="Siguiente"
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          </div>
          <button
            type="button"
            className="image-lightbox-close"
            onClick={() => setLightbox(null)}
            title="Cerrar"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  );
}
