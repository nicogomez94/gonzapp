import { useEffect, useRef, useState } from 'react';

const CROP_WIDTH = 1200;
const CROP_HEIGHT = 800;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getEditedFileName = (fileName = 'imagen.jpg') => {
  const dotIndex = fileName.lastIndexOf('.');
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${base}-encuadrada.jpg`;
};

/**
 * ImageUploadPreview
 * Props:
 *  - images: string[]       array of image URLs
 *  - onUpload: (e) => void  file-input onChange handler (calls uploadImages, updates parent)
 *  - onChange: (urls) => void  called when an image is removed
 *  - uploading: boolean
 *  - maxImages: number (optional)
 *  - cropBeforeUpload: boolean (optional)
 */
export default function ImageUploadPreview({ images = [], onUpload, onChange, uploading = false, maxImages, cropBeforeUpload = true }) {
  const [lightbox, setLightbox] = useState(null);
  const [cropQueue, setCropQueue] = useState([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [cropImageSize, setCropImageSize] = useState(null);
  const [cropFrameSize, setCropFrameSize] = useState({ width: 0, height: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [croppedFiles, setCroppedFiles] = useState([]);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const dragStartRef = useRef(null);
  const cropFrameRef = useRef(null);
  const inputRef = useRef(null);

  const validImages = images.filter(Boolean);
  const currentCropItem = cropQueue[cropIndex];
  const currentCropFile = currentCropItem?.file;
  const cropSrc = currentCropItem?.src || '';
  const isCropping = cropBeforeUpload && Boolean(currentCropItem);
  const baseScale = cropImageSize && cropFrameSize.width && cropFrameSize.height
    ? Math.max(cropFrameSize.width / cropImageSize.width, cropFrameSize.height / cropImageSize.height)
    : 1;
  const displayWidth = cropImageSize ? cropImageSize.width * baseScale * cropZoom : 0;
  const displayHeight = cropImageSize ? cropImageSize.height * baseScale * cropZoom : 0;

  useEffect(() => {
    if (!currentCropItem) return undefined;
    const img = new Image();
    img.onload = () => setCropImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = currentCropItem.src;

    return undefined;
  }, [currentCropItem]);

  useEffect(() => () => {
    cropQueue.forEach(item => URL.revokeObjectURL(item.src));
  }, [cropQueue]);

  useEffect(() => {
    if (!isCropping) return undefined;

    const updateFrameSize = () => {
      const rect = cropFrameRef.current?.getBoundingClientRect();
      if (rect?.width && rect?.height) {
        setCropFrameSize({ width: rect.width, height: rect.height });
      }
    };

    updateFrameSize();
    window.addEventListener('resize', updateFrameSize);
    return () => window.removeEventListener('resize', updateFrameSize);
  }, [isCropping]);

  useEffect(() => {
    if (!isDraggingCrop) return undefined;

    const move = (e) => {
      if (!dragStartRef.current) return;
      const point = e.touches?.[0] || e;
      setCropOffset({
        x: dragStartRef.current.offset.x + point.clientX - dragStartRef.current.point.x,
        y: dragStartRef.current.offset.y + point.clientY - dragStartRef.current.point.y,
      });
    };
    const stop = () => {
      setIsDraggingCrop(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', stop);
    };
  }, [isDraggingCrop]);

  const removeImage = (url) => {
    onChange(validImages.filter(u => u !== url));
  };

  const emitUpload = (files) => {
    if (!files.length) return;
    onUpload?.({ target: { files, value: '' } });
  };

  const resetFileInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const revokeCropQueue = (queue = cropQueue) => {
    queue.forEach(item => URL.revokeObjectURL(item.src));
  };

  const resetCropAdjustments = () => {
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
    setCropImageSize(null);
    setIsProcessingCrop(false);
  };

  const handleFileSelection = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!cropBeforeUpload) {
      onUpload?.(e);
      return;
    }

    const imageFiles = files.filter(file => file.type?.startsWith('image/'));
    if (!imageFiles.length) {
      resetFileInput();
      return;
    }

    revokeCropQueue();
    setCropQueue(imageFiles.map(file => ({ file, src: URL.createObjectURL(file) })));
    setCropIndex(0);
    setCroppedFiles([]);
    resetCropAdjustments();
    resetFileInput();
  };

  const cancelCrop = () => {
    revokeCropQueue();
    setCropQueue([]);
    setCropIndex(0);
    setCroppedFiles([]);
  };

  const resetCrop = () => {
    setCropZoom(1);
    setCropRotation(0);
    setCropOffset({ x: 0, y: 0 });
  };

  const startCropDrag = (e) => {
    const point = e.touches?.[0] || e;
    dragStartRef.current = {
      point: { x: point.clientX, y: point.clientY },
      offset: cropOffset,
    };
    setIsDraggingCrop(true);
  };

  const buildCroppedFile = () => new Promise((resolve, reject) => {
    if (!currentCropFile || !cropSrc || !cropImageSize || !cropFrameSize.width) {
      reject(new Error('No se pudo preparar la imagen'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CROP_WIDTH;
      canvas.height = CROP_HEIGHT;
      const ctx = canvas.getContext('2d');
      const outputScale = CROP_WIDTH / cropFrameSize.width;
      const sourceScale = baseScale * cropZoom * outputScale;

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
      ctx.translate(CROP_WIDTH / 2 + cropOffset.x * outputScale, CROP_HEIGHT / 2 + cropOffset.y * outputScale);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        -(cropImageSize.width * sourceScale) / 2,
        -(cropImageSize.height * sourceScale) / 2,
        cropImageSize.width * sourceScale,
        cropImageSize.height * sourceScale
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('No se pudo generar el recorte'));
          return;
        }
        resolve(new File([blob], getEditedFileName(currentCropFile.name), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = cropSrc;
  });

  const confirmCrop = async () => {
    if (isProcessingCrop) return;
    setIsProcessingCrop(true);

    try {
      const nextFile = await buildCroppedFile();
      const nextCroppedFiles = [...croppedFiles, nextFile];
      const nextIndex = cropIndex + 1;

      if (nextIndex < cropQueue.length) {
        setCroppedFiles(nextCroppedFiles);
        setCropIndex(nextIndex);
        resetCropAdjustments();
        return;
      }

      emitUpload(nextCroppedFiles);
      revokeCropQueue();
      setCropQueue([]);
      setCropIndex(0);
      setCroppedFiles([]);
    } catch (err) {
      // Keep the editor open so the user can retry or cancel.
      console.error(err);
      setIsProcessingCrop(false);
    }
  };

  const skipCurrentCrop = () => {
    if (isProcessingCrop) return;
    const nextIndex = cropIndex + 1;
    if (nextIndex < cropQueue.length) {
      setCropIndex(nextIndex);
      resetCropAdjustments();
      return;
    }
    emitUpload(croppedFiles);
    cancelCrop();
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
          onChange={handleFileSelection}
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

      {isCropping && (
        <div
          className="image-crop-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Encuadrar imagen"
        >
          <div className="image-crop-modal">
            <div className="image-crop-header">
              <div>
                <h3>Encuadrar imagen</h3>
                <p>{cropIndex + 1} de {cropQueue.length}</p>
              </div>
              <button type="button" className="image-crop-icon-btn" onClick={cancelCrop} title="Cerrar">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="image-crop-stage">
              <div
                ref={cropFrameRef}
                className={`image-crop-frame${isDraggingCrop ? ' dragging' : ''}`}
                onMouseDown={startCropDrag}
                onTouchStart={startCropDrag}
              >
                {cropSrc && cropImageSize && (
                  <img
                    src={cropSrc}
                    alt="Imagen para encuadrar"
                    draggable="false"
                    className="image-crop-img"
                    style={{
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                      transform: `translate(-50%, -50%) translate(${cropOffset.x}px, ${cropOffset.y}px) rotate(${cropRotation}deg)`,
                    }}
                  />
                )}
                <div className="image-crop-grid" />
              </div>
            </div>

            <div className="image-crop-controls">
              <label className="image-crop-control">
                <span><i className="fa-solid fa-magnifying-glass-plus" /> Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropZoom}
                  onChange={e => setCropZoom(Number(e.target.value))}
                />
              </label>
              <label className="image-crop-control">
                <span><i className="fa-solid fa-rotate-right" /> Rotación</span>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={cropRotation}
                  onChange={e => setCropRotation(Number(e.target.value))}
                />
              </label>
              <div className="image-crop-actions-secondary">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCropZoom(z => clamp(z + 0.15, 1, 3))} title="Acercar">
                  <i className="fa-solid fa-plus" />
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setCropZoom(z => clamp(z - 0.15, 1, 3))} title="Alejar">
                  <i className="fa-solid fa-minus" />
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={resetCrop} title="Restablecer">
                  <i className="fa-solid fa-arrow-rotate-left" />
                </button>
              </div>
            </div>

            <div className="image-crop-footer">
              <button type="button" className="btn btn-outline" onClick={skipCurrentCrop} disabled={isProcessingCrop}>Omitir</button>
              <button type="button" className="btn btn-primary" onClick={confirmCrop} disabled={isProcessingCrop || !cropImageSize || !cropFrameSize.width}>
                <i className={`fa-solid ${isProcessingCrop ? 'fa-spinner fa-spin' : 'fa-check'}`} /> Usar encuadre
              </button>
            </div>
          </div>
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
