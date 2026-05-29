import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isFavorite, toggleFavorite } from '../utils/favorites';
import { cloudinaryImage } from '../utils/images';

export default function ListingCard({ listing, showStatus = false }) {
  const [fav, setFav] = useState(() => isFavorite(listing.id));

  const handleFav = (e) => { e.preventDefault(); setFav(toggleFavorite(listing.id)); };

  const img = listing.images?.[0];
  const price = listing.priceUsd
    ? `USD ${listing.priceUsd.toLocaleString('es-AR')}`
    : `$${(listing.priceArs || 0).toLocaleString('es-AR')}`;

  const statusMap = { ACTIVE: 'Activo', PAUSED: 'Pausado', EXPIRED: 'Expirado', PENDING: 'Pendiente' };

  return (
    <Link to={`/publicaciones/${listing.id}`} className="listing-card">
      <div className="listing-img">
        {img
          ? <img src={cloudinaryImage(img, 'f_auto,q_auto,c_fill,w_720,h_480')} alt={listing.title} loading="lazy" />
          : <div className="img-placeholder"><i className="fa-solid fa-car-side" /></div>
        }
        <div className="listing-badge-wrap">
          {listing.featured && <span className="badge badge-accent">Destacado</span>}
          {listing.verified && <span className="badge badge-success"><i className="fa-solid fa-shield-halved" /> Verificado</span>}
        </div>
        <button className={`listing-fav${fav ? ' active' : ''}`} onClick={handleFav} aria-label="Favorito">
          <i className={fav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
        </button>
      </div>
      <div className="listing-body">
        <div className="listing-cat">{listing.brand} · {listing.vehicleType || 'Auto'} · {listing.year}</div>
        <h3 className="listing-title">{listing.title}</h3>
        <div className="listing-price">{price}</div>
        <div className="listing-price-sub">
          {listing.priceUsd ? 'Dólares · Precio en dólares' : 'en pesos'}
        </div>
        <div className="listing-specs">
          <span className="listing-spec"><i className="fa-solid fa-road" /> {(listing.mileage || 0).toLocaleString('es-AR')} km</span>
          <span className="listing-spec"><i className="fa-solid fa-gas-pump" /> {listing.fuel}</span>
          <span className="listing-spec"><i className="fa-solid fa-gears" /> {listing.transmission}</span>
        </div>
        <div className="listing-meta">
          <span><i className="fa-solid fa-location-dot" style={{ marginRight: 4 }} />{listing.location}</span>
          {showStatus && (
            <span className={`badge badge-${listing.status === 'ACTIVE' ? 'success' : listing.status === 'PAUSED' ? 'warning' : 'gray'}`}>
              {statusMap[listing.status] || listing.status}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
