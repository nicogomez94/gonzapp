import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, listingsApi } from '../api';
import ListingCard from '../components/ListingCard';
import Modal from '../components/Modal';
import ImageUploadPreview from '../components/ImageUploadPreview';
import { FAVORITES_CHANGED, getFavoriteIds } from '../utils/favorites';
import { useAuth } from '../context/AuthContext';
import { useDebug } from '../context/DebugContext';
import { debugDefaults } from '../context/debugDefaults';
import { useToast } from '../context/ToastContext';
import { VEHICLE_TYPES } from '../constants/vehicleTypes';

const emptyListingForm = {
  title: '',
  brand: '',
  model: '',
  vehicleType: 'Sedán',
  year: '',
  mileage: '',
  fuel: 'Nafta',
  transmission: 'Manual',
  engine: '',
  priceArs: '',
  priceUsd: '',
  location: '',
  phone: '',
  description: '',
  images: '',
  equipment: '',
};

const FUELS = ['Nafta', 'Diesel', 'Eléctrico', 'Híbrido', 'GNC'];
const TRANSMISSIONS = ['Manual', 'Automática', 'CVT'];

const parseList = (value, separator = '\n') => {
  if (Array.isArray(value)) return value.filter(Boolean);
  return (value || '').split(separator).map(item => item.trim()).filter(Boolean);
};

export default function MiCuentaPage() {
  const { user, login, updateUser } = useAuth();
  const isDebug = useDebug();
  const { show } = useToast();
  const getProfileForm = useCallback((nextUser) => ({
    ...(isDebug ? debugDefaults.profile : { name: '', email: '', phone: '', password: '' }),
    name: nextUser?.name || (isDebug ? debugDefaults.profile.name : ''),
    email: nextUser?.email || (isDebug ? debugDefaults.profile.email : ''),
    phone: nextUser?.phone || (isDebug ? debugDefaults.profile.phone : ''),
    password: '',
  }), [isDebug]);
  const getListingForm = useCallback((phone) => ({
    ...emptyListingForm,
    ...(isDebug ? debugDefaults.listing : {}),
    phone: phone || (isDebug ? debugDefaults.listing.phone : ''),
  }), [isDebug]);
  const [profileForm, setProfileForm] = useState(() => getProfileForm(user));
  const [saving, setSaving] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteIds());
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [loadingMyListings, setLoadingMyListings] = useState(false);
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [listingForm, setListingForm] = useState(() => getListingForm(user?.phone));
  const [savingListing, setSavingListing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const initials = useMemo(() => {
    return (profileForm.name || user?.name || 'U')
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profileForm.name, user?.name]);

  useEffect(() => {
    authApi.me()
      .then(({ data }) => {
        updateUser(data.user);
        setProfileForm(getProfileForm(data.user));
      })
      .catch(() => {});
  }, [user?.id, updateUser, getProfileForm]);

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(getFavoriteIds());
    window.addEventListener(FAVORITES_CHANGED, syncFavorites);
    window.addEventListener('storage', syncFavorites);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED, syncFavorites);
      window.removeEventListener('storage', syncFavorites);
    };
  }, []);

  useEffect(() => {
    if (!favoriteIds.length) {
      return;
    }

    Promise.resolve()
      .then(() => {
        setLoadingFavs(true);
        return Promise.allSettled(favoriteIds.map(id => listingsApi.getById(id)));
      })
      .then(results => {
        setFavorites(results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data));
      })
      .finally(() => setLoadingFavs(false));
  }, [favoriteIds]);

  const visibleFavorites = favoriteIds.length ? favorites : [];
  const isApprovedUser = user?.role !== 'ADMIN' && user?.approvalStatus === 'APPROVED';

  const loadMyListings = useCallback(() => {
    if (!isApprovedUser) return;
    setLoadingMyListings(true);
    listingsApi.getMine()
      .then(({ data }) => setMyListings(data.listings || []))
      .catch(() => show('No se pudieron cargar tus publicaciones', 'error'))
      .finally(() => setLoadingMyListings(false));
  }, [isApprovedUser, show]);

  useEffect(() => {
    queueMicrotask(loadMyListings);
  }, [loadMyListings]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...profileForm };
      if (!payload.password) delete payload.password;
      const { data } = await authApi.updateMe(payload);
      login(data.token, data.user);
      setProfileForm(f => ({ ...f, password: '' }));
      show('Datos actualizados');
    } catch (err) {
      show(err.response?.data?.error || 'No se pudieron guardar los datos', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openListingModal = () => {
    setListingForm(getListingForm(user?.phone));
    setListingModalOpen(true);
  };

  const uploadListingImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    setUploadingImages(true);

    try {
      const { data } = await listingsApi.uploadImages(formData);
      const nextImages = [...parseList(listingForm.images), ...(data.images || [])];
      setListingForm(f => ({ ...f, images: nextImages }));
      show(`${data.images?.length || 0} imagen${data.images?.length === 1 ? '' : 'es'} cargada${data.images?.length === 1 ? '' : 's'}`);
    } catch (err) {
      show(err.response?.data?.error || 'No se pudieron cargar las imágenes', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const saveListing = async (e) => {
    e.preventDefault();
    setSavingListing(true);

    const payload = {
      ...listingForm,
      year: +listingForm.year,
      mileage: +listingForm.mileage,
      priceArs: +listingForm.priceArs,
      priceUsd: listingForm.priceUsd ? +listingForm.priceUsd : undefined,
      images: parseList(listingForm.images),
      equipment: parseList(listingForm.equipment, ','),
    };

    try {
      await listingsApi.create(payload);
      show('Publicación enviada para revisión');
      setListingModalOpen(false);
      loadMyListings();
    } catch (err) {
      show(err.response?.data?.error || 'No se pudo enviar la publicación', 'error');
    } finally {
      setSavingListing(false);
    }
  };

  if (user?.role !== 'ADMIN' && user?.approvalStatus === 'PENDING_APPROVAL') {
    return (
      <div className="page-wrap account-page">
        <div className="container">
          <div className="account-header">
            <div className="account-avatar">{initials}</div>
            <div>
              <div className="breadcrumb" style={{ marginBottom: 8 }}>
                <Link to="/"><i className="fa-solid fa-house" /></Link>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} />
                <span>Validación</span>
              </div>
              <h1>Estamos validando tu cuenta</h1>
              <p>Ya elegiste tu plan. El administrador tiene que aprobarte para habilitar tu panel.</p>
            </div>
          </div>

          <section className="account-card approval-wait-card">
            <div className="approval-wait-icon"><i className="fa-solid fa-clock" /></div>
            <div>
              <span className="badge badge-warning">Pendiente de validación</span>
              <h2>Tu solicitud está en revisión</h2>
              <p>
                Tu cuenta quedó registrada con el plan {user.plan?.name ? <strong> {user.plan.name}</strong> : ' seleccionado'}.
                Un administrador revisará tus datos y, una vez aprobada, vas a poder acceder al panel y operar normalmente en el sitio.
              </p>
              <div className="approval-wait-actions">
                <Link to="/planes" className="btn btn-outline"><i className="fa-solid fa-crown" /> Ver planes</Link>
                <a href="https://wa.me/542665016253?text=Hola%2C%20ya%20eleg%C3%AD%20un%20plan%20en%20AutoZona%20y%20quiero%20validar%20mi%20cuenta" target="_blank" rel="noreferrer" className="btn btn-accent">
                  <i className="fa-brands fa-whatsapp" /> Escribir por WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap account-page">
      <div className="container">
        <div className="account-header">
          <div className="account-avatar">{initials}</div>
          <div>
            <div className="breadcrumb" style={{ marginBottom: 8 }}>
              <Link to="/"><i className="fa-solid fa-house" /></Link>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} />
              <span>Mi cuenta</span>
            </div>
            <h1>Mi cuenta</h1>
            <p>Gestioná tus datos y tené a mano los autos que guardaste.</p>
          </div>
        </div>

        <div className="account-layout">
          <section className="account-card">
            <div className="account-card-header">
              <div>
                <h2>Datos personales</h2>
                <p>Estos datos se usan para identificar tu cuenta.</p>
              </div>
              <span className="badge badge-primary">{user?.role === 'ADMIN' ? 'Admin' : 'Usuario'}</span>
            </div>

            <form onSubmit={saveProfile}>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Nombre completo</label>
                  <input className="form-input" required value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Email</label>
                  <input className="form-input" type="email" required value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label">Teléfono</label>
                  <input className="form-input" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Nueva contraseña</label>
                  <input className="form-input" type="password" minLength={6} placeholder="Dejar vacío para no cambiar" value={profileForm.password} onChange={e => setProfileForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
              <br />
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <><i className="fa-solid fa-spinner fa-spin" /> Guardando</> : <><i className="fa-solid fa-floppy-disk" /> Guardar cambios</>}
              </button>
            </form>
          </section>

          <aside className="account-card account-publish-card">
            <div className="stat-icon orange"><i className="fa-solid fa-car" /></div>
            <h2>Publicar vehículo</h2>
            <p>Tu publicación se enviará a revisión y quedará visible cuando el administrador la apruebe.</p>
            <button type="button" className="btn btn-accent btn-block" onClick={openListingModal}>
              <i className="fa-solid fa-plus" /> Cargar publicación
            </button>
          </aside>
        </div>

        {isApprovedUser && (
          <section className="account-card account-listings-card">
            <div className="account-card-header">
              <div>
                <h2>Mis publicaciones</h2>
                <p>Las publicaciones pendientes se revisan antes de mostrarse en el sitio.</p>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={openListingModal}>
                <i className="fa-solid fa-plus" /> Nueva publicación
              </button>
            </div>

            {loadingMyListings ? (
              <div className="account-loading">
                <i className="fa-solid fa-spinner fa-spin" /> Cargando publicaciones
              </div>
            ) : myListings.length > 0 ? (
              <div className="account-favorites-grid">
                {myListings.map(listing => <ListingCard key={listing.id} listing={listing} showStatus />)}
              </div>
            ) : (
              <div className="empty-state">
                <i className="fa-solid fa-car-side" />
                <h3>Todavía no cargaste publicaciones</h3>
                <p>Creá tu primera publicación y quedará pendiente hasta la aprobación administrativa.</p>
                <button type="button" className="btn btn-primary" onClick={openListingModal}>
                  <i className="fa-solid fa-plus" /> Cargar publicación
                </button>
              </div>
            )}
          </section>
        )}

        <section className="account-card account-favorites-card">
          <div className="account-card-header">
            <div>
              <h2>Mis favoritos</h2>
              <p>{favoriteIds.length ? `${favoriteIds.length} publicación${favoriteIds.length === 1 ? '' : 'es'} guardada${favoriteIds.length === 1 ? '' : 's'}` : 'Guardá autos tocando el corazón en las publicaciones.'}</p>
            </div>
            <Link to="/publicaciones" className="btn btn-outline btn-sm"><i className="fa-solid fa-magnifying-glass" /> Buscar autos</Link>
          </div>

          {loadingFavs ? (
            <div className="account-loading">
              <i className="fa-solid fa-spinner fa-spin" /> Cargando favoritos
            </div>
          ) : visibleFavorites.length > 0 ? (
            <div className="account-favorites-grid">
              {visibleFavorites.map(listing => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fa-regular fa-heart" />
              <h3>Todavía no guardaste favoritos</h3>
              <p>Entrá al listado y tocá el corazón de los autos que quieras seguir viendo.</p>
              <Link to="/publicaciones" className="btn btn-primary"><i className="fa-solid fa-car-side" /> Ver publicaciones</Link>
            </div>
          )}
        </section>

        {listingModalOpen && (
          <Modal
            title="Nueva publicación"
            onClose={() => setListingModalOpen(false)}
            closeOnOverlay={false}
            closeOnEscape={false}
            footer={<button className="btn btn-primary" form="account-listing-form" type="submit" disabled={savingListing || uploadingImages}>{savingListing ? 'Enviando' : 'Enviar a revisión'}</button>}
          >
            <form id="account-listing-form" onSubmit={saveListing} className="modal-form">
              <div className="form-row">
                <div className="input-group"><label className="input-label">Título *</label><input className="form-input" required value={listingForm.title} onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))} placeholder="Toyota Corolla XEI 2.0" /></div>
                <div className="input-group"><label className="input-label">Marca *</label><input className="form-input" required value={listingForm.brand} onChange={e => setListingForm(f => ({ ...f, brand: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="input-group"><label className="input-label">Modelo *</label><input className="form-input" required value={listingForm.model} onChange={e => setListingForm(f => ({ ...f, model: e.target.value }))} /></div>
                <div className="input-group"><label className="input-label">Tipo de vehículo *</label><select className="form-input" required value={listingForm.vehicleType || 'Sedán'} onChange={e => setListingForm(f => ({ ...f, vehicleType: e.target.value }))}>{VEHICLE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="input-group"><label className="input-label">Año *</label><input className="form-input" type="number" required value={listingForm.year} onChange={e => setListingForm(f => ({ ...f, year: e.target.value }))} /></div>
                <div className="input-group"><label className="input-label">Kilometraje *</label><input className="form-input" type="number" required value={listingForm.mileage} onChange={e => setListingForm(f => ({ ...f, mileage: e.target.value }))} /></div>
              </div>
              <div className="input-group"><label className="input-label">Motor</label><input className="form-input" value={listingForm.engine} onChange={e => setListingForm(f => ({ ...f, engine: e.target.value }))} placeholder="2.0" /></div>
              <div className="form-row">
                <div className="input-group"><label className="input-label">Combustible *</label><select className="form-input" value={listingForm.fuel} onChange={e => setListingForm(f => ({ ...f, fuel: e.target.value }))}>{FUELS.map(fuel => <option key={fuel}>{fuel}</option>)}</select></div>
                <div className="input-group"><label className="input-label">Transmisión *</label><select className="form-input" value={listingForm.transmission} onChange={e => setListingForm(f => ({ ...f, transmission: e.target.value }))}>{TRANSMISSIONS.map(transmission => <option key={transmission}>{transmission}</option>)}</select></div>
              </div>
              <div className="form-row">
                <div className="input-group"><label className="input-label">Precio ARS *</label><input className="form-input" type="number" required value={listingForm.priceArs} onChange={e => setListingForm(f => ({ ...f, priceArs: e.target.value }))} /></div>
                <div className="input-group"><label className="input-label">Precio USD</label><input className="form-input" type="number" value={listingForm.priceUsd} onChange={e => setListingForm(f => ({ ...f, priceUsd: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="input-group"><label className="input-label">Ubicación *</label><input className="form-input" required value={listingForm.location} onChange={e => setListingForm(f => ({ ...f, location: e.target.value }))} /></div>
                <div className="input-group"><label className="input-label">Teléfono *</label><input className="form-input" required value={listingForm.phone} onChange={e => setListingForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <div className="input-group"><label className="input-label">Descripción</label><textarea className="form-input" rows={3} value={listingForm.description} onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="input-group">
                <label className="input-label">Imágenes</label>
                <ImageUploadPreview
                  images={parseList(listingForm.images)}
                  onUpload={uploadListingImages}
                  onChange={arr => setListingForm(f => ({ ...f, images: arr }))}
                  uploading={uploadingImages}
                />
              </div>
              <div className="input-group"><label className="input-label">Equipamiento</label><input className="form-input" value={listingForm.equipment} onChange={e => setListingForm(f => ({ ...f, equipment: e.target.value }))} placeholder="Airbag, ABS, Cámara de reversa" /></div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
