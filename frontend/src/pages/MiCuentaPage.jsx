import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, listingsApi } from '../api';
import ListingCard from '../components/ListingCard';
import { FAVORITES_CHANGED, getFavoriteIds } from '../utils/favorites';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function MiCuentaPage() {
  const { user, login, updateUser } = useAuth();
  const { show } = useToast();
  const [profileForm, setProfileForm] = useState(() => ({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', password: '' }));
  const [saving, setSaving] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteIds());
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

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
        setProfileForm({ name: data.user.name || '', email: data.user.email || '', phone: data.user.phone || '', password: '' });
      })
      .catch(() => {});
  }, [user?.id, updateUser]);

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
            <h2>¿Querés publicar?</h2>
            <p>La carga se gestiona por WhatsApp para mantener el proceso simple en esta etapa.</p>
            <a href="https://wa.me/542665016253?text=Hola%2C%20quiero%20publicar%20mi%20auto%20en%20AutoZona" target="_blank" rel="noreferrer" className="btn btn-accent btn-block">
              <i className="fa-brands fa-whatsapp" /> Consultar publicación
            </a>
          </aside>
        </div>

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
      </div>
    </div>
  );
}
