import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listingsApi } from '../api';
import ListingCard from '../components/ListingCard';
import { isFavorite, toggleFavorite } from '../utils/favorites';
import { cloudinaryImage } from '../utils/images';

export default function DetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [favoriteState, setFavoriteState] = useState(() => ({ id, value: isFavorite(id) }));

  useEffect(() => {
    window.scrollTo(0, 0);
    queueMicrotask(() => setLoading(true));
    listingsApi.getById(id)
      .then(r => {
        setListing(r.data);
        return listingsApi.getAll({ brand: r.data.brand, limit: 4 });
      })
      .then(r => setRelated((r.data.listings || r.data || []).filter(l => String(l.id) !== String(id))))
      .catch(() => navigate('/publicaciones'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }} />
    </div>
  );

  if (!listing) return null;

  const priceDisplay = listing.priceUsd
    ? `USD ${listing.priceUsd.toLocaleString('es-AR')}`
    : `$\u00a0${listing.priceArs?.toLocaleString('es-AR')}`;

  const imgs = listing.images?.length ? listing.images : [];
  const fav = favoriteState.id === id ? favoriteState.value : isFavorite(id);
  const sellerSince = listing.user?.createdAt ? new Date(listing.user.createdAt).getFullYear() : 'fecha no disponible';

  const SPECS = [
    { icon: 'fa-solid fa-car-side', label: 'Tipo', value: listing.vehicleType },
    { icon: 'fa-solid fa-calendar', label: 'Año', value: listing.year },
    { icon: 'fa-solid fa-road', label: 'Kilómetros', value: listing.mileage ? `${listing.mileage.toLocaleString('es-AR')} km` : null },
    { icon: 'fa-solid fa-gas-pump', label: 'Combustible', value: listing.fuel },
    { icon: 'fa-solid fa-gears', label: 'Transmisión', value: listing.transmission },
    { icon: 'fa-solid fa-gauge-high', label: 'Motor', value: listing.engine },
    { icon: 'fa-solid fa-location-dot', label: 'Ubicación', value: listing.location },
    { icon: 'fa-solid fa-palette', label: 'Color', value: listing.color },
    { icon: 'fa-solid fa-id-card', label: 'Versión', value: listing.version },
  ].filter(s => s.value);

  const SAFETY = ['No hacer pagos por adelantado', 'Revisá el vehículo en persona', 'Exigí los documentos del auto', 'Firmá el contrato ante escribano', 'Verificá la titularidad en el Registro'];

  return (
    <div className="page-wrap">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/"><i className="fa-solid fa-house" /></Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} />
          <Link to="/publicaciones">Publicaciones</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} />
          <span>{listing.title}</span>
        </div>

        <div className="detail-layout">
          {/* MAIN COLUMN */}
          <div>
            {/* GALLERY */}
            <div className="gallery-main">
              {imgs.length > 0 ? (
                <img src={cloudinaryImage(imgs[activeImg], 'f_auto,q_auto,c_limit,w_1600')} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="img-placeholder" style={{ height: 420 }}>
                  <i className="fa-solid fa-car-side" />
                </div>
              )}
              <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                {listing.featured && <span className="badge badge-accent">Destacado</span>}
              </div>
              <button
                className={`gallery-fav${fav ? ' active' : ''}`}
                title="Guardar"
                onClick={() => setFavoriteState({ id, value: toggleFavorite(listing.id) })}
                style={{ position: 'absolute', top: 16, right: 16, background: '#fff', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                <i className={fav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
              </button>
            </div>

            {imgs.length > 1 && (
              <div className="gallery-thumbs">
                {imgs.map((img, i) => (
                  <button key={i} className={`gallery-thumb${activeImg === i ? ' active' : ''}`}
                    onClick={() => setActiveImg(i)}>
                    <img src={cloudinaryImage(img, 'f_auto,q_auto,c_fill,w_180,h_120')} alt="" />
                  </button>
                ))}
              </div>
            )}

            {/* TITLE ROW */}
            <div className="detail-title-row">
              <div>
                <div className="listing-cat" style={{ marginBottom: 8 }}>{listing.brand} · {listing.vehicleType || 'Auto'}</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, margin: 0 }}>{listing.title}</h1>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  <span><i className="fa-solid fa-location-dot" /> {listing.location || 'Argentina'}</span>
                  <span><i className="fa-solid fa-clock" /> {new Date(listing.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
              <div className="detail-price">
                <div className="price-main">{priceDisplay}</div>
                {listing.priceArs && listing.priceUsd && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>${listing.priceArs.toLocaleString('es-AR')} ARS</div>
                )}
              </div>
            </div>

            {/* SPECS GRID */}
            <div className="specs-grid">
              {SPECS.map(s => (
                <div key={s.label} className="spec-item">
                  <div className="spec-icon"><i className={s.icon} /></div>
                  <div>
                    <span className="spec-label">{s.label}</span>
                    <span className="spec-value">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* DESCRIPTION */}
            {listing.description && (
              <div className="detail-section">
                <h2>Descripción</h2>
                <p className="description-text">{listing.description}</p>
              </div>
            )}

            {/* EQUIPMENT */}
            {listing.equipment?.length > 0 && (
              <div className="detail-section">
                <h2>Equipamiento</h2>
                <div className="features-list">
                  {listing.equipment.map(e => (
                    <span key={e} className="feature-item"><i className="fa-solid fa-check" style={{ color: 'var(--success)' }} /> {e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATION */}
            <div className="detail-section">
              <h2><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)', marginRight: 8 }} /> Ubicación</h2>
              <div className="map-placeholder">
                <i className="fa-solid fa-map" />
                <p>{listing.location || 'Argentina'}</p>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="detail-sidebar">
            {/* PRICE + ACTIONS */}
            <div className="sidebar-card">
              <div className="sidebar-price">{priceDisplay}</div>
              {listing.priceArs && listing.priceUsd && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 16 }}>${listing.priceArs.toLocaleString('es-AR')} ARS</div>
              )}
              <div className="sidebar-actions">
                <a
                  href={`https://wa.me/54${(listing.phone || '2665016253').replace(/\D/g, '')}?text=Hola%2C%20me%20interesa%20tu%20${encodeURIComponent(listing.title)}`}
                  target="_blank" rel="noreferrer"
                  className="btn btn-whatsapp btn-block">
                  <i className="fa-brands fa-whatsapp" /> Consultar por WhatsApp
                </a>
                <a href="tel:+54" className="btn btn-outline btn-block">
                  <i className="fa-solid fa-phone" /> Llamar
                </a>
                <button className="btn btn-ghost btn-block" onClick={() => navigator.share?.({ title: listing.title, url: window.location.href })}>
                  <i className="fa-solid fa-share-nodes" /> Compartir
                </button>
              </div>
            </div>

            {/* SELLER */}
            <div className="sidebar-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Vendedor</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="seller-avatar">
                  {listing.user?.name?.[0]?.toUpperCase() || 'V'}
                </div>
                <div>
                  <div className="seller-name">{listing.user?.name || 'Vendedor'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Miembro desde {sellerSince}</div>
                </div>
              </div>
              <div className="seller-stats">
                <div><strong>1</strong>&nbsp;<span>Unidad publicada</span></div>
                <div><strong>WhatsApp</strong>&nbsp;<span>Contacto directo</span></div>
              </div>
            </div>

            {/* SAFETY */}
            <div className="sidebar-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>
                <i className="fa-solid fa-shield-halved" style={{ color: 'var(--success)', marginRight: 8 }} /> Consejos de seguridad
              </h3>
              <ul className="safety-list">
                {SAFETY.map(s => (
                  <li key={s}><i className="fa-solid fa-circle-check" style={{ color: 'var(--success)', marginRight: 8 }} /> {s}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* RELATED */}
        {related.length > 0 && (
          <div className="detail-section" style={{ marginTop: 48 }}>
            <div className="section-header" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Publicaciones similares</h2>
              <Link to={`/publicaciones?brand=${listing.brand}`} className="btn btn-outline btn-sm">Ver más</Link>
            </div>
            <div className="similar-grid">
              {related.slice(0, 3).map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
