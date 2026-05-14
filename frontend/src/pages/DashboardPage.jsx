import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsApi, usersApi, plansApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const LISTING_STATUSES = ['ACTIVE', 'PAUSED', 'PENDING', 'EXPIRED'];
const FUELS = ['Nafta', 'Diesel', 'Eléctrico', 'Híbrido', 'GNC'];
const TRANSMISSIONS = ['Manual', 'Automática'];

const emptyListing = { title: '', brand: '', model: '', year: '', mileage: '', fuel: 'Nafta', transmission: 'Manual', engine: '', priceArs: '', priceUsd: '', location: '', phone: '', description: '', status: 'ACTIVE', featured: false, verified: false, images: [], equipment: [] };
const emptyUser = { name: '', email: '', password: '', phone: '', role: 'USER' };
const emptyPlan = { name: '', price: '', maxImages: '', daysActive: '', features: '' };

const CHART_DATA = [
  { label: 'Lun', val: 210, h: 55, color: 'var(--primary-bg)' },
  { label: 'Mar', val: 275, h: 72, color: 'var(--primary-bg)' },
  { label: 'Mié', val: 345, h: 90, color: 'var(--primary)' },
  { label: 'Jue', val: 228, h: 60, color: 'var(--primary-bg)' },
  { label: 'Vie', val: 305, h: 80, color: '#FFD9B8' },
  { label: 'Sáb', val: 325, h: 85, color: '#FFD9B8' },
  { label: 'Dom', val: 159, h: 45, color: 'var(--primary-bg)' },
];

const ACTIVITY = [
  { bg: 'var(--success-bg)', color: 'var(--success)', icon: 'fa-brands fa-whatsapp', text: 'Carlos Gómez consultó por la Hilux SRX', strong: 'Carlos Gómez', time: 'hace 5 min' },
  { bg: 'var(--primary-bg)', color: 'var(--primary)', icon: 'fa-solid fa-eye', text: 'La Corolla recibió 28 visitas hoy', time: 'hace 1 hora' },
  { bg: 'var(--accent-bg)', color: 'var(--accent)', icon: 'fa-solid fa-heart', text: 'Valentina R. guardó tu Fortuner', time: 'hace 2 horas' },
  { bg: 'var(--warning-bg)', color: 'var(--warning)', icon: 'fa-solid fa-bell', text: 'Publicación Hilux por vencer en 3 días', time: 'hace 4 horas' },
  { bg: 'var(--success-bg)', color: 'var(--success)', icon: 'fa-solid fa-check', text: 'Plan Intermedio asignado a una unidad', time: 'hace 1 día' },
];

function StatusDot({ status }) {
  const s = status?.toLowerCase();
  return <div className={`status-dot ${s}`} />;
}

export default function DashboardPage() {
  const { user, isAdmin, logout } = useAuth();
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

  const [listingForm, setListingForm] = useState(emptyListing);
  const [userForm, setUserForm] = useState(emptyUser);
  const [planForm, setPlanForm] = useState(emptyPlan);

  const loadListings = useCallback(() => {
    setLoadingL(true);
    listingsApi.getAll({ limit: 100 })
      .then(r => { const d = r.data.listings || r.data || []; setListings(d); setListingsTotal(r.data.total || d.length); })
      .catch(() => {}).finally(() => setLoadingL(false));
  }, []);

  const loadUsers = useCallback(() => {
    setLoadingU(true);
    usersApi.getAll().then(r => setUsers(r.data.users || r.data || [])).catch(() => {}).finally(() => setLoadingU(false));
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

  const openCreateListing = () => { setListingForm(emptyListing); setListingModal({ mode: 'create' }); };
  const openEditListing = (l) => { setListingForm({ ...l, images: l.images?.join('\n') || '', equipment: l.equipment?.join(', ') || '' }); setListingModal({ mode: 'edit', id: l.id }); };
  const saveListing = async (e) => {
    e.preventDefault();
    const payload = { ...listingForm, year: +listingForm.year, mileage: +listingForm.mileage, priceArs: listingForm.priceArs ? +listingForm.priceArs : undefined, priceUsd: listingForm.priceUsd ? +listingForm.priceUsd : undefined, images: typeof listingForm.images === 'string' ? listingForm.images.split('\n').map(s => s.trim()).filter(Boolean) : listingForm.images, equipment: typeof listingForm.equipment === 'string' ? listingForm.equipment.split(',').map(s => s.trim()).filter(Boolean) : listingForm.equipment };
    try { if (listingModal.mode === 'create') await listingsApi.create(payload); else await listingsApi.update(listingModal.id, payload); show(listingModal.mode === 'create' ? 'Publicación creada' : 'Publicación actualizada'); setListingModal(null); loadListings(); } catch (err) { show(err.response?.data?.error || 'Error al guardar', 'error'); }
  };
  const deleteListing = async (id) => { try { await listingsApi.remove(id); show('Publicación eliminada'); loadListings(); } catch { show('Error al eliminar', 'error'); } setDeleteConfirm(null); };

  const openCreateUser = () => { setUserForm(emptyUser); setUserModal({ mode: 'create' }); };
  const openEditUser = (u) => { setUserForm({ ...u, password: '' }); setUserModal({ mode: 'edit', id: u.id }); };
  const saveUser = async (e) => {
    e.preventDefault();
    const payload = { ...userForm }; if (!payload.password) delete payload.password;
    try { if (userModal.mode === 'create') await usersApi.create(payload); else await usersApi.update(userModal.id, payload); show(userModal.mode === 'create' ? 'Usuario creado' : 'Usuario actualizado'); setUserModal(null); loadUsers(); } catch (err) { show(err.response?.data?.error || 'Error al guardar', 'error'); }
  };
  const deleteUser = async (id) => { try { await usersApi.remove(id); show('Usuario eliminado'); loadUsers(); } catch { show('Error al eliminar', 'error'); } setDeleteConfirm(null); };

  const openCreatePlan = () => { setPlanForm(emptyPlan); setPlanModal({ mode: 'create' }); };
  const openEditPlan = (p) => { setPlanForm({ ...p, features: p.features?.join(', ') || '' }); setPlanModal({ mode: 'edit', id: p.id }); };
  const savePlan = async (e) => {
    e.preventDefault();
    const payload = { ...planForm, price: +planForm.price, maxImages: +planForm.maxImages, daysActive: +planForm.daysActive, features: planForm.features.split(',').map(s => s.trim()).filter(Boolean) };
    try { if (planModal.mode === 'create') await plansApi.create(payload); else await plansApi.update(planModal.id, payload); show(planModal.mode === 'create' ? 'Plan creado' : 'Plan actualizado'); setPlanModal(null); loadPlans(); } catch (err) { show(err.response?.data?.error || 'Error al guardar', 'error'); }
  };
  const deletePlan = async (id) => { try { await plansApi.remove(id); show('Plan eliminado'); loadPlans(); } catch { show('Error al eliminar', 'error'); } setDeleteConfirm(null); };

  const activeListing = listings.filter(l => l.status === 'ACTIVE').length;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  const nav = (s) => { setSection(s); setSidebarOpen(false); };

  return (
    <div className="dash-wrap">
      {/* SIDEBAR */}
      <aside className={`dash-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div>
            <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
            <div className="sidebar-user-role"><span className="plan-badge plan-pro">Admin</span></div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Principal</div>
          <button className={`sidebar-item${section === 'resumen' ? ' active' : ''}`} onClick={() => nav('resumen')}>
            <i className="fa-solid fa-chart-pie" /> Resumen
          </button>
          <button className={`sidebar-item${section === 'publicaciones' ? ' active' : ''}`} onClick={() => nav('publicaciones')}>
            <i className="fa-solid fa-car" /> Mis publicaciones
            <span className="sidebar-badge">{listingsTotal}</span>
          </button>
          <button className={`sidebar-item${section === 'mensajes' ? ' active' : ''}`} onClick={() => nav('mensajes')}>
            <i className="fa-solid fa-comment-dots" /> Mensajes
            <span className="sidebar-badge orange">4</span>
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
          <div className="sidebar-section-label">Configuración</div>
          <button className="sidebar-item"><i className="fa-solid fa-gear" /> Configuración</button>
          <button className="sidebar-item"><i className="fa-solid fa-circle-question" /> Soporte</button>
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
              <i className="fa-solid fa-plus" /> Nueva publicación
            </button>
          </div>

          <div className="stats-grid-4">
            <div className="stat-card fade-up">
              <div className="stat-icon blue"><i className="fa-solid fa-car" /></div>
              <div className="stat-info"><h3>{activeListing}</h3><p>Publicaciones activas</p><div className="stat-trend up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> +2 este mes</div></div>
            </div>
            <div className="stat-card fade-up delay-1">
              <div className="stat-icon orange"><i className="fa-solid fa-eye" /></div>
              <div className="stat-info"><h3>1.847</h3><p>Visitas esta semana</p><div className="stat-trend up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> +14% vs semana pasada</div></div>
            </div>
            <div className="stat-card fade-up delay-2">
              <div className="stat-icon green"><i className="fa-solid fa-comment-dots" /></div>
              <div className="stat-info"><h3>34</h3><p>Consultas recibidas</p><div className="stat-trend up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> +8 nuevas hoy</div></div>
            </div>
            <div className="stat-card fade-up delay-3">
              <div className="stat-icon yellow"><i className="fa-solid fa-users" /></div>
              <div className="stat-info"><h3>{users.length}</h3><p>Usuarios registrados</p><div className="stat-trend up"><i className="fa-solid fa-arrow-up" style={{ fontSize: '0.65rem' }} /> +5% este mes</div></div>
            </div>
          </div>

          <div className="three-col">
            <div className="chart-card fade-up">
              <div className="chart-header">
                <h3>Visitas por día</h3>
                <select style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}>
                  <option>Últimos 7 días</option>
                  <option>Últimos 30 días</option>
                </select>
              </div>
              <div className="chart-bars">
                {CHART_DATA.map(d => (
                  <div key={d.label} className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: `${d.h}%`, background: d.color }}>
                      <span className="chart-bar-val">{d.val}</span>
                    </div>
                    <span className="chart-bar-label">{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="legend" style={{ marginTop: 12 }}>
                <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--primary-bg)', border: '1.5px solid var(--primary)' }} /> Días laborales</div>
                <div className="legend-item"><div className="legend-dot" style={{ background: '#FFD9B8', border: '1.5px solid var(--accent)' }} /> Fin de semana</div>
              </div>
            </div>

            <div className="chart-card fade-up delay-1">
              <div className="chart-header">
                <h3>Actividad reciente</h3>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>En vivo</span>
              </div>
              <div className="activity-list">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-icon" style={{ background: a.bg, color: a.color }}>
                      <i className={a.icon} />
                    </div>
                    <div>
                      <div className="activity-text">{a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </div>
                ))}
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
                      <td><button className="btn btn-ghost btn-sm" onClick={() => openEditListing(l)}><i className="fa-solid fa-pen" /></button></td>
                    </tr>
                  ))}
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
                  <thead><tr><th>Título</th><th>Marca</th><th>Año</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {listings.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.87rem' }}>{l.title}</td>
                        <td>{l.brand}</td>
                        <td>{l.year}</td>
                        <td>{l.priceUsd ? `USD ${l.priceUsd.toLocaleString('es-AR')}` : `$${l.priceArs?.toLocaleString('es-AR')}`}</td>
                        <td><div className="pub-status"><StatusDot status={l.status} /><span style={{ fontSize: '0.82rem' }}>{l.status}</span></div></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
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
              <button className="btn btn-outline btn-sm"><i className="fa-solid fa-download" /> Exportar</button>
              <button className="btn btn-accent btn-sm" onClick={openCreateUser}><i className="fa-solid fa-plus" /> Nuevo usuario</button>
            </div>
          </div>
          {loadingU ? <div style={{ padding: 40, textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }} /></div> : (
            <div className="chart-card">
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: '-22px' }}>
                <table>
                  <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Plan</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.87rem' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-accent' : 'badge-verified'}`}>{u.role}</span></td>
                        <td>{u.plan?.name || 'Sin plan'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEditUser(u)}><i className="fa-solid fa-pen" /></button>
                            <button className="btn btn-sm" style={{ background: 'var(--error-bg)', color: 'var(--error)', border: 'none' }} onClick={() => setDeleteConfirm({ type: 'user', id: u.id })}><i className="fa-solid fa-trash" /></button>
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

        {/* ====== MENSAJES (placeholder) ====== */}
        <div className={`dash-section${section === 'mensajes' ? ' active' : ''}`}>
          <div className="dash-page-header"><div><h2>Mensajes</h2><p>Próximamente disponible</p></div></div>
          <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-comment-dots" style={{ fontSize: '3rem', marginBottom: 16, display: 'block', color: 'var(--text-faint)' }} />
            <p>El módulo de mensajes estará disponible próximamente.</p>
          </div>
        </div>

        {/* ====== ESTADÍSTICAS (placeholder) ====== */}
        <div className={`dash-section${section === 'estadisticas' ? ' active' : ''}`}>
          <div className="dash-page-header"><div><h2>Control manual</h2><p>Revisión administrativa de usuarios, planes y unidad publicada</p></div></div>
          <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-clipboard-check" style={{ fontSize: '3rem', marginBottom: 16, display: 'block', color: 'var(--text-faint)' }} />
            <p>Acá se mostrará el control de plan asignado y uso de la unidad por usuario.</p>
          </div>
        </div>

      </main>

      {/* LISTING MODAL */}
      {listingModal && (
        <Modal title={listingModal.mode === 'create' ? 'Nueva publicación' : 'Editar publicación'} onClose={() => setListingModal(null)}
          footer={<><button className="btn btn-outline" onClick={() => setListingModal(null)}>Cancelar</button><button className="btn btn-primary" form="listing-form" type="submit">Guardar</button></>}>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}><input type="checkbox" checked={listingForm.featured} onChange={e => setListingForm(f => ({ ...f, featured: e.target.checked }))} /> Destacado</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem' }}><input type="checkbox" checked={listingForm.verified} onChange={e => setListingForm(f => ({ ...f, verified: e.target.checked }))} /> Verificado</label>
            </div>
            <div className="input-group"><label className="input-label">Descripción</label><textarea className="form-input" rows={3} value={listingForm.description} onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="input-group"><label className="input-label">Imágenes (una URL por línea)</label><textarea className="form-input" rows={3} value={listingForm.images} onChange={e => setListingForm(f => ({ ...f, images: e.target.value }))} /></div>
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
            <div className="input-group"><label className="input-label">Características (separadas por comas)</label><input className="form-input" value={planForm.features} onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))} placeholder="6 fotos, Soporte, Destacado" /></div>
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
