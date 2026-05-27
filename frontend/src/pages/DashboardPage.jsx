import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsApi, usersApi, plansApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useDebug } from '../context/DebugContext';
import { debugDefaults } from '../context/debugDefaults';
import { useToast } from '../context/ToastContext';
import BrandLogo from '../components/BrandLogo';
import Modal from '../components/Modal';
import ImageUploadPreview from '../components/ImageUploadPreview';

const LISTING_STATUSES = ['ACTIVE', 'PAUSED', 'PENDING', 'EXPIRED'];
const USER_APPROVAL_STATUSES = ['PENDING_PLAN', 'PENDING_APPROVAL', 'APPROVED'];
const FUELS = ['Nafta', 'Diesel', 'Eléctrico', 'Híbrido', 'GNC'];
const TRANSMISSIONS = ['Manual', 'Automática'];

const emptyListing = { title: '', brand: '', model: '', year: '', mileage: '', fuel: 'Nafta', transmission: 'Manual', engine: '', priceArs: '', priceUsd: '', location: '', phone: '', description: '', status: 'ACTIVE', featured: false, verified: false, images: [], equipment: [] };
const emptyUser = { name: '', email: '', password: '', phone: '', role: 'USER', approvalStatus: 'PENDING_PLAN', planId: '' };
const emptyPlan = { name: '', price: '', maxImages: '', daysActive: '', features: '' };

function StatusDot({ status }) {
  const s = status?.toLowerCase();
  return <div className={`status-dot ${s}`} />;
}

const approvalMeta = {
  PENDING_PLAN: { label: 'Debe elegir plan', badge: 'badge-gray' },
  PENDING_APPROVAL: { label: 'Esperando admin', badge: 'badge-warning' },
  APPROVED: { label: 'Aprobado', badge: 'badge-success' },
};

const parseImageList = (images) => {
  if (Array.isArray(images)) return images.filter(Boolean);
  return (images || '').split('\n').map(s => s.trim()).filter(Boolean);
};

export default function DashboardPage() {
  const { user, isAdmin, logout } = useAuth();
  const isDebug = useDebug();
  const navigate = useNavigate();
  const { show } = useToast();
  const [section, setSection] = useState('resumen');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [listings, setListings] = useState([]);
  const [listingsTotal, setListingsTotal] = useState(0);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingL, setLoadingL] = useState(false);
  const [loadingU, setLoadingU] = useState(false);
  const [loadingP, setLoadingP] = useState(false);

  const [listingModal, setListingModal] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [planModal, setPlanModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const getListingDefaults = () => ({
    ...emptyListing,
    ...(isDebug ? debugDefaults.listing : {}),
    images: isDebug ? debugDefaults.listing.images : emptyListing.images,
    equipment: isDebug ? debugDefaults.listing.equipment : emptyListing.equipment,
  });
  const getUserDefaults = () => ({ ...emptyUser, ...(isDebug ? debugDefaults.user : {}) });
  const getPlanDefaults = () => ({ ...emptyPlan, ...(isDebug ? debugDefaults.plan : {}) });

  const [listingForm, setListingForm] = useState(() => getListingDefaults());
  const [userForm, setUserForm] = useState(() => getUserDefaults());
  const [planForm, setPlanForm] = useState(() => getPlanDefaults());
  const [uploadingImages, setUploadingImages] = useState(false);

  const loadListings = useCallback(() => {
    setLoadingL(true);
    listingsApi.getAll({ limit: 100 })
      .then(r => { const d = r.data.listings || r.data || []; setListings(d); setListingsTotal(r.data.total || d.length); })
      .catch(() => {}).finally(() => setLoadingL(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingU(true);
    usersApi.getAll({ limit: 100 }).then(r => setUsers(r.data.users || r.data || [])).catch(() => {}).finally(() => setLoadingU(false));
  }, []);

  const loadPlans = useCallback(() => {
    setLoadingP(true);
    plansApi.getAll().then(r => setPlans(r.data || [])).catch(() => {}).finally(() => setLoadingP(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    queueMicrotask(() => {
      loadListings(); loadUsers(); loadPlans();
    });
  }, [isAdmin, navigate, loadListings, loadUsers, loadPlans]);

  useEffect(() => {
    const animated = document.querySelectorAll('.dash-section .fade-up');
    animated.forEach((el, index) => {
      window.setTimeout(() => el.classList.add('visible'), index * 80);
    });
  }, [section]);

  const openCreateListing = () => { setListingForm(getListingDefaults()); setListingModal({ mode: 'create' }); };
  const openEditListing = (l) => { setListingForm({ ...l, images: l.images || [], equipment: l.equipment?.join(', ') || '' }); setListingModal({ mode: 'edit', id: l.id }); };
  const uploadListingImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    setUploadingImages(true);

    try {
      const { data } = await listingsApi.uploadImages(formData);
      const uploaded = data.images || [];
      setListingForm(f => ({ ...f, images: [...parseImageList(f.images), ...uploaded] }));
      show(`${uploaded.length} imagen${uploaded.length === 1 ? '' : 'es'} cargada${uploaded.length === 1 ? '' : 's'}`);
    } catch (err) {
      show(err.response?.data?.error || 'Error al cargar imágenes', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };
  const saveListing = async (e) => {
    e.preventDefault();
    const payload = { ...listingForm, year: +listingForm.year, mileage: +listingForm.mileage, priceArs: listingForm.priceArs ? +listingForm.priceArs : undefined, priceUsd: listingForm.priceUsd ? +listingForm.priceUsd : undefined, images: parseImageList(listingForm.images), equipment: typeof listingForm.equipment === 'string' ? listingForm.equipment.split(',').map(s => s.trim()).filter(Boolean) : listingForm.equipment };
    try { if (listingModal.mode === 'create') await listingsApi.create(payload); else await listingsApi.update(listingModal.id, payload); show(listingModal.mode === 'create' ? 'Publicación creada' : 'Publicación actualizada'); setListingModal(null); loadListings(); } catch (err) { show(err.response?.data?.error || 'Error al guardar', 'error'); }
  };
  const approveListing = async (id) => {
    try {
      await listingsApi.update(id, { status: 'ACTIVE' });
      show('Publicación aprobada y publicada');
      loadListings();
    } catch (err) {
      show(err.response?.data?.error || 'No se pudo aprobar la publicación', 'error');
    }
  };
  const toggleFeaturedListing = async (listing) => {
    try {
      await listingsApi.update(listing.id, { featured: !listing.featured });
      show(!listing.featured ? 'Publicación marcada como destacada' : 'Publicación quitada de destacadas');
      loadListings();
    } catch (err) {
      show(err.response?.data?.error || 'No se pudo actualizar el destacado', 'error');
    }
  };
  const deleteListing = async (id) => { try { await listingsApi.remove(id); show('Publicación eliminada'); loadListings(); } catch { show('Error al eliminar', 'error'); } setDeleteConfirm(null); };

  const openCreateUser = () => { setUserForm(getUserDefaults()); setUserModal({ mode: 'create' }); };
  const openEditUser = (u) => { setUserForm({ ...u, password: '', planId: u.planId || '' }); setUserModal({ mode: 'edit', id: u.id }); };
  const saveUser = async (e) => {
    e.preventDefault();
    const payload = { ...userForm, planId: userForm.planId ? +userForm.planId : null }; if (!payload.password) delete payload.password;
    try { if (userModal.mode === 'create') await usersApi.create(payload); else await usersApi.update(userModal.id, payload); show(userModal.mode === 'create' ? 'Usuario creado' : 'Usuario actualizado'); setUserModal(null); loadUsers(); } catch (err) { show(err.response?.data?.error || 'Error al guardar', 'error'); }
  };
  const approveUser = async (id) => {
    try {
      await usersApi.update(id, { approvalStatus: 'APPROVED' });
      show('Usuario aprobado');
      loadUsers();
    } catch (err) {
      show(err.response?.data?.error || 'No se pudo aprobar el usuario', 'error');
    }
  };
  const deleteUser = async (id) => { try { await usersApi.remove(id); show('Usuario eliminado'); loadUsers(); } catch { show('Error al eliminar', 'error'); } setDeleteConfirm(null); };

  const openCreatePlan = () => { setPlanForm(getPlanDefaults()); setPlanModal({ mode: 'create' }); };
  const openEditPlan = (p) => { setPlanForm({ ...p, features: p.features?.join(', ') || '' }); setPlanModal({ mode: 'edit', id: p.id }); };
  const savePlan = async (e) => {
    e.preventDefault();
    const payload = { ...planForm, price: +planForm.price, maxImages: +planForm.maxImages, daysActive: +planForm.daysActive, features: planForm.features.split(',').map(s => s.trim()).filter(Boolean) };
    try { if (planModal.mode === 'create') await plansApi.create(payload); else await plansApi.update(planModal.id, payload); show(planModal.mode === 'create' ? 'Plan creado' : 'Plan actualizado'); setPlanModal(null); loadPlans(); } catch (err) { show(err.response?.data?.error || 'Error al guardar', 'error'); }
  };
  const deletePlan = async (id) => { try { await plansApi.remove(id); show('Plan eliminado'); loadPlans(); } catch { show('Error al eliminar', 'error'); } setDeleteConfirm(null); };

  const activeListing = listings.filter(l => l.status === 'ACTIVE').length;
  const pendingListing = listings.filter(l => l.status === 'PENDING').length;
  const usersWithPlan = users.filter(u => u.planId).length;
  const pendingApprovalUsers = users.filter(u => u.approvalStatus === 'PENDING_APPROVAL').length;
  const usersOverLimit = users.filter(u => (u._count?.listings || 0) > 1).length;
  const getUserListingCount = (u) => u._count?.listings || u.listings?.length || 0;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  const nav = (s) => { setSection(s); setSidebarOpen(false); };

  return (
    <div className="dash-wrap">
      {/* SIDEBAR */}
      <aside className={`dash-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <div className="dash-sidebar-logo">
          <BrandLogo variant="admin" />
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
            {/* <div className="sidebar-user-role"><span className="plan-badge plan-pro">Admin</span></div> */}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Principal</div>
          <button className={`sidebar-item${section === 'resumen' ? ' active' : ''}`} onClick={() => nav('resumen')}>
            <i className="fa-solid fa-chart-pie" /> Resumen
          </button>
          <button className={`sidebar-item${section === 'publicaciones' ? ' active' : ''}`} onClick={() => nav('publicaciones')}>
            <i className="fa-solid fa-car" /> Publicaciones
            <span className="sidebar-badge">{listingsTotal}</span>
          </button>
          <button className={`sidebar-item${section === 'estadisticas' ? ' active' : ''}`} onClick={() => nav('estadisticas')}>
            <i className="fa-solid fa-clipboard-check" /> Control manual
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Administración</div>
          <button className={`sidebar-item${section === 'usuarios' ? ' active' : ''}`} onClick={() => nav('usuarios')}>
            <i className="fa-solid fa-users" /> Usuarios
            <span className="sidebar-badge gray">{users.length}</span>
          </button>
          <button className={`sidebar-item${section === 'planes' ? ' active' : ''}`} onClick={() => nav('planes')}>
            <i className="fa-solid fa-crown" /> Planes
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Cuenta</div>
          <button className="sidebar-item" style={{ color: 'var(--error)' }} onClick={() => { logout(); navigate('/'); }}>
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}

      {/* MAIN */}
      <main className="dash-main">

        {/* ====== RESUMEN ====== */}
        <div className={`dash-section${section === 'resumen' ? ' active' : ''}`}>
          <div className="dash-page-header">
            <div>
              <h2>Buen día, {user?.name?.split(' ')[0] || 'Admin'} 👋</h2>
              <p>{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Resumen de tu cuenta</p>
            </div>
            <button className="btn btn-accent" onClick={openCreateListing}>
              <i className="fa-solid fa-plus" /> Cargar publicación
            </button>
          </div>

          <div className="stats-grid-4">
            <div className="stat-card fade-up">
              <div className="stat-icon blue"><i className="fa-solid fa-car" /></div>
              <div className="stat-info"><h3>{listingsTotal}</h3><p>Publicaciones cargadas</p></div>
            </div>
            <div className="stat-card fade-up delay-1">
              <div className="stat-icon green"><i className="fa-solid fa-circle-check" /></div>
              <div className="stat-info"><h3>{activeListing}</h3><p>Publicaciones activas</p></div>
            </div>
            <div className="stat-card fade-up delay-2">
              <div className="stat-icon orange"><i className="fa-solid fa-clock" /></div>
              <div className="stat-info"><h3>{pendingListing}</h3><p>Pendientes de revisión</p></div>
            </div>
            <div className="stat-card fade-up delay-3">
              <div className="stat-icon yellow"><i className="fa-solid fa-users" /></div>
              <div className="stat-info"><h3>{users.length}</h3><p>Usuarios registrados</p></div>
            </div>
          </div>

          <div className="three-col">
            <div className="chart-card fade-up">
              <div className="chart-header">
                <h3>Control manual de planes</h3>
                <button className="btn btn-outline btn-sm" onClick={() => nav('estadisticas')}>Ver control</button>
              </div>
              <div className="stats-grid-4 plan-control-stats">
                <div className="stat-card" style={{ boxShadow: 'none' }}>
                  <div className="stat-icon blue"><i className="fa-solid fa-crown" /></div>
                  <div className="stat-info"><h3>{plans.length}</h3><p>Planes definidos</p></div>
                </div>
                <div className="stat-card" style={{ boxShadow: 'none' }}>
                  <div className="stat-icon green"><i className="fa-solid fa-user-check" /></div>
                  <div className="stat-info"><h3>{usersWithPlan}</h3><p>Usuarios con plan</p></div>
                </div>
                <div className="stat-card" style={{ boxShadow: 'none' }}>
                  <div className="stat-icon yellow"><i className="fa-solid fa-clock" /></div>
                  <div className="stat-info"><h3>{pendingApprovalUsers}</h3><p>Validaciones pendientes</p></div>
                </div>
                <div className="stat-card" style={{ boxShadow: 'none' }}>
                  <div className="stat-icon orange"><i className="fa-solid fa-triangle-exclamation" /></div>
                  <div className="stat-info"><h3>{usersOverLimit}</h3><p>Sobre 1 unidad</p></div>
                </div>
              </div>
            </div>

            <div className="chart-card fade-up delay-1">
              <div className="chart-header">
                <h3>Contacto de suscripción</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="activity-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                  <i className="fa-brands fa-whatsapp" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>2665-016253</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Teléfono definido en el PRD para sumarse a la web.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent listings table */}
          <div className="chart-card fade-up">
            <div className="chart-header">
              <h3>Publicaciones recientes</h3>
              <button className="btn btn-outline btn-sm" onClick={() => nav('publicaciones')}>Ver todas</button>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: '-22px', marginTop: 0 }}>
              <table>
                <thead><tr><th>Vehículo</th><th>Precio</th><th>Estado</th><th>Fecha</th><th /></tr></thead>
                <tbody>
                  {listings.slice(0, 6).map(l => (
                    <tr key={l.id}>
                      <td><div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{l.title}</div><div style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}>{l.brand} · {l.year}</div></td>
                      <td><strong>{l.priceUsd ? `USD ${l.priceUsd.toLocaleString('es-AR')}` : `$${l.priceArs?.toLocaleString('es-AR')}`}</strong></td>
                      <td>
                        <div className="pub-status">
                          <StatusDot status={l.status} />
                          <span style={{ fontSize: '0.82rem' }}>{l.status === 'ACTIVE' ? 'Activa' : l.status === 'PAUSED' ? 'Pausada' : l.status}</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.82rem' }}>{new Date(l.createdAt).toLocaleDateString('es-AR')}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {l.status === 'PENDING' && <button className="btn btn-primary btn-sm" onClick={() => approveListing(l.id)}>Aprobar</button>}
                          <button className={`btn ${l.featured ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => toggleFeaturedListing(l)} title={l.featured ? 'Quitar de destacadas' : 'Marcar como destacada'}>
                            <i className="fa-solid fa-star" />
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEditListing(l)}><i className="fa-solid fa-pen" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loadingL && listings.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                        Todavía no hay publicaciones cargadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ====== PUBLICACIONES ====== */}
        <div className={`dash-section${section === 'publicaciones' ? ' active' : ''}`}>
          <div className="dash-page-header">
            <div><h2>Publicaciones</h2><p>Gestioná las publicaciones cargadas manualmente</p></div>
            <button className="btn btn-accent btn-sm" onClick={openCreateListing}>
              <i className="fa-solid fa-plus" /> Nueva publicación
            </button>
          </div>
          {loadingL ? <div style={{ padding: 40, textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }} /></div> : (
            <div className="chart-card">
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: '-22px' }}>
                <table>
                  <thead><tr><th>Título</th><th>Marca</th><th>Año</th><th>Precio</th><th>Estado</th><th>Destacado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {listings.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.87rem' }}>{l.title}</td>
                        <td>{l.brand}</td>
                        <td>{l.year}</td>
                        <td>{l.priceUsd ? `USD ${l.priceUsd.toLocaleString('es-AR')}` : `$${l.priceArs?.toLocaleString('es-AR')}`}</td>
                        <td><div className="pub-status"><StatusDot status={l.status} /><span style={{ fontSize: '0.82rem' }}>{l.status}</span></div></td>
                        <td>
                          <button className={`btn ${l.featured ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => toggleFeaturedListing(l)} title={l.featured ? 'Quitar de destacadas' : 'Marcar como destacada'}>
                            <i className="fa-solid fa-star" /> {l.featured ? 'Sí' : 'No'}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {l.status === 'PENDING' && <button className="btn btn-primary btn-sm" onClick={() => approveListing(l.id)}>Aprobar</button>}
                            <button className="btn btn-outline btn-sm" onClick={() => openEditListing(l)}><i className="fa-solid fa-pen" /></button>
                            <button className="btn btn-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 'none' }} onClick={() => setDeleteConfirm({ type: 'listing', id: l.id })}><i className="fa-solid fa-trash" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ====== USUARIOS ====== */}
        <div className={`dash-section${section === 'usuarios' ? ' active' : ''}`}>
          <div className="dash-page-header">
            <div><h2>Usuarios</h2><p>Gestión de usuarios registrados en la plataforma</p></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-accent btn-sm" onClick={openCreateUser}><i className="fa-solid fa-plus" /> Nuevo usuario</button>
            </div>
          </div>
          {loadingU ? <div style={{ padding: 40, textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }} /></div> : (
            <div className="chart-card">
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: '-22px' }}>
                <table>
                  <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Plan</th><th>Validación</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {users.map(u => {
                      const meta = approvalMeta[u.approvalStatus] || approvalMeta.PENDING_PLAN;
                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, fontSize: '0.87rem' }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{u.phone || '—'}</td>
                          <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-accent' : 'badge-verified'}`}>{u.role}</span></td>
                          <td>{u.plan?.name || 'Sin plan'}</td>
                          <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {u.approvalStatus === 'PENDING_APPROVAL' && (
                                <button className="btn btn-primary btn-sm" onClick={() => approveUser(u.id)}>Aprobar</button>
                              )}
                              <button className="btn btn-outline btn-sm" onClick={() => openEditUser(u)}><i className="fa-solid fa-pen" /></button>
                              <button className="btn btn-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 'none' }} onClick={() => setDeleteConfirm({ type: 'user', id: u.id })}><i className="fa-solid fa-trash" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ====== PLANES ====== */}
        <div className={`dash-section${section === 'planes' ? ' active' : ''}`}>
          <div className="dash-page-header">
            <div><h2>Planes</h2><p>Gestión de planes de publicación</p></div>
            <button className="btn btn-accent btn-sm" onClick={openCreatePlan}><i className="fa-solid fa-plus" /> Nuevo plan</button>
          </div>
          {loadingP ? <div style={{ padding: 40, textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }} /></div> : (
            <div className="stats-grid-4">
              {plans.map((p) => (
                <div key={p.id} className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>${p.price?.toLocaleString('es-AR')}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/publicación</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditPlan(p)}><i className="fa-solid fa-pen" /></button>
                      <button className="btn btn-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 'none' }} onClick={() => setDeleteConfirm({ type: 'plan', id: p.id })}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {['1 unidad', ...(p.features || [])].filter((f, index, arr) => arr.indexOf(f) === index).map(f => <li key={f}><i className="fa-solid fa-check" style={{ color: 'var(--success)', marginRight: 6 }} />{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ====== CONTROL MANUAL ====== */}
        <div className={`dash-section${section === 'estadisticas' ? ' active' : ''}`}>
          <div className="dash-page-header"><div><h2>Control manual</h2><p>Revisión administrativa de usuarios, planes y unidad publicada</p></div></div>
          <div className="chart-card">
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: '-22px' }}>
              <table>
                <thead><tr><th>Usuario</th><th>Plan asignado</th><th>Validación</th><th>Publicaciones cargadas</th><th>Límite etapa 1</th><th>Estado</th><th /></tr></thead>
                <tbody>
                  {users.map(u => {
                    const count = getUserListingCount(u);
                    const overLimit = count > 1;
                    const meta = approvalMeta[u.approvalStatus] || approvalMeta.PENDING_PLAN;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.87rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}>{u.email}</div>
                        </td>
                        <td>{u.plan?.name || 'Sin plan'}</td>
                        <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                        <td>{count}</td>
                        <td>1 unidad</td>
                        <td><span className={`badge ${overLimit ? 'badge-accent' : 'badge-success'}`}>{overLimit ? 'Revisar' : 'OK'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {u.approvalStatus === 'PENDING_APPROVAL' && <button className="btn btn-primary btn-sm" onClick={() => approveUser(u.id)}>Aprobar</button>}
                            <button className="btn btn-ghost btn-sm" onClick={() => openEditUser(u)}><i className="fa-solid fa-pen" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loadingU && users.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                        Todavía no hay usuarios cargados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      {/* LISTING MODAL */}
      {listingModal && (
        <Modal title={listingModal.mode === 'create' ? 'Nueva publicación' : 'Editar publicación'} onClose={() => setListingModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setListingModal(null)}>Cancelar</button><button className="btn btn-primary" form="listing-form" type="submit" disabled={uploadingImages}>Guardar</button></>}>
          <form id="listing-form" onSubmit={saveListing} className="modal-form">
            <div className="form-row">
              <div className="input-group"><label className="input-label">Título *</label><input className="form-input" required value={listingForm.title} onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Marca *</label><input className="form-input" required value={listingForm.brand} onChange={e => setListingForm(f => ({ ...f, brand: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="input-group"><label className="input-label">Modelo *</label><input className="form-input" required value={listingForm.model} onChange={e => setListingForm(f => ({ ...f, model: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Año *</label><input className="form-input" type="number" required value={listingForm.year} onChange={e => setListingForm(f => ({ ...f, year: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="input-group"><label className="input-label">Km</label><input className="form-input" type="number" value={listingForm.mileage} onChange={e => setListingForm(f => ({ ...f, mileage: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Motor</label><input className="form-input" value={listingForm.engine} onChange={e => setListingForm(f => ({ ...f, engine: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="input-group"><label className="input-label">Combustible</label><select className="form-input" value={listingForm.fuel} onChange={e => setListingForm(f => ({ ...f, fuel: e.target.value }))}>{FUELS.map(x => <option key={x}>{x}</option>)}</select></div>
              <div className="input-group"><label className="input-label">Transmisión</label><select className="form-input" value={listingForm.transmission} onChange={e => setListingForm(f => ({ ...f, transmission: e.target.value }))}>{TRANSMISSIONS.map(x => <option key={x}>{x}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="input-group"><label className="input-label">Precio ARS</label><input className="form-input" type="number" value={listingForm.priceArs} onChange={e => setListingForm(f => ({ ...f, priceArs: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Precio USD</label><input className="form-input" type="number" value={listingForm.priceUsd} onChange={e => setListingForm(f => ({ ...f, priceUsd: e.target.value }))} /></div>
            </div>
            <div className="form-row">
              <div className="input-group"><label className="input-label">Ubicación</label><input className="form-input" value={listingForm.location} onChange={e => setListingForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Teléfono</label><input className="form-input" value={listingForm.phone} onChange={e => setListingForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="input-group"><label className="input-label">Estado</label><select className="form-input" value={listingForm.status} onChange={e => setListingForm(f => ({ ...f, status: e.target.value }))}>{LISTING_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="form-row" style={{ gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}><input type="checkbox" checked={listingForm.featured} onChange={e => setListingForm(f => ({ ...f, featured: e.target.checked }))} /> Destacada</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}><input type="checkbox" checked={listingForm.verified} onChange={e => setListingForm(f => ({ ...f, verified: e.target.checked }))} /> Verificado</label>
            </div>
            <div className="input-group"><label className="input-label">Descripción</label><textarea className="form-input" rows={3} value={listingForm.description} onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="input-group">
              <label className="input-label">Imágenes</label>
              <ImageUploadPreview
                images={parseImageList(listingForm.images)}
                onUpload={uploadListingImages}
                onChange={arr => setListingForm(f => ({ ...f, images: arr }))}
                uploading={uploadingImages}
              />
            </div>
            <div className="input-group"><label className="input-label">Equipamiento (separado por comas)</label><input className="form-input" value={listingForm.equipment} onChange={e => setListingForm(f => ({ ...f, equipment: e.target.value }))} /></div>
          </form>
        </Modal>
      )}

      {/* USER MODAL */}
      {userModal && (
        <Modal title={userModal.mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'} onClose={() => setUserModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setUserModal(null)}>Cancelar</button><button className="btn btn-primary" form="user-form" type="submit">Guardar</button></>}>
          <form id="user-form" onSubmit={saveUser} className="modal-form">
            <div className="input-group"><label className="input-label">Nombre *</label><input className="form-input" required value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="input-group"><label className="input-label">Email *</label><input className="form-input" type="email" required value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="input-group"><label className="input-label">Teléfono</label><input className="form-input" value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="input-group"><label className="input-label">Contraseña {userModal.mode === 'edit' && '(dejar vacío para no cambiar)'}</label><input className="form-input" type="password" required={userModal.mode === 'create'} value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="input-group"><label className="input-label">Rol</label><select className="form-input" value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div>
            <div className="input-group">
              <label className="input-label">Plan asignado</label>
              <select className="form-input" value={userForm.planId} onChange={e => setUserForm(f => ({ ...f, planId: e.target.value }))}>
                <option value="">Sin plan</option>
                {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Validación</label>
              <select className="form-input" value={userForm.approvalStatus || 'PENDING_PLAN'} onChange={e => setUserForm(f => ({ ...f, approvalStatus: e.target.value }))}>
                {USER_APPROVAL_STATUSES.map(status => (
                  <option key={status} value={status}>{approvalMeta[status]?.label || status}</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* PLAN MODAL */}
      {planModal && (
        <Modal title={planModal.mode === 'create' ? 'Nuevo plan' : 'Editar plan'} onClose={() => setPlanModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setPlanModal(null)}>Cancelar</button><button className="btn btn-primary" form="plan-form" type="submit">Guardar</button></>}>
          <form id="plan-form" onSubmit={savePlan} className="modal-form">
            <div className="input-group"><label className="input-label">Nombre *</label><input className="form-input" required value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="input-group"><label className="input-label">Precio (ARS) *</label><input className="form-input" type="number" required value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div className="form-row">
              <div className="input-group"><label className="input-label">Máx. imágenes</label><input className="form-input" type="number" value={planForm.maxImages} onChange={e => setPlanForm(f => ({ ...f, maxImages: e.target.value }))} /></div>
              <div className="input-group"><label className="input-label">Días activo</label><input className="form-input" type="number" value={planForm.daysActive} onChange={e => setPlanForm(f => ({ ...f, daysActive: e.target.value }))} /></div>
            </div>
            <div className="input-group"><label className="input-label">Características (separadas por comas)</label><input className="form-input" value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} placeholder="6 imágenes, Informe de dominio, Documentación verificada" /></div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <Modal title="Confirmar eliminación" onClose={() => setDeleteConfirm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancelar</button><button className="btn btn-sm" style={{ background: 'var(--error)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 'var(--radius)', cursor: 'pointer' }} onClick={() => { if (deleteConfirm.type === 'listing') deleteListing(deleteConfirm.id); else if (deleteConfirm.type === 'user') deleteUser(deleteConfirm.id); else if (deleteConfirm.type === 'plan') deletePlan(deleteConfirm.id); }}>Eliminar</button></>}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>¿Estás seguro de que querés eliminar este elemento? Esta acción no se puede deshacer.</p>
        </Modal>
      )}
    </div>
  );
}
