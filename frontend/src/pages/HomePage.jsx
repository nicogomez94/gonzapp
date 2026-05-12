import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingsApi, plansApi } from '../api';
import ListingCard from '../components/ListingCard';

const BRANDS = ['Toyota', 'Ford', 'Volkswagen', 'Honda', 'Chevrolet', 'Renault', 'Fiat', 'Jeep', 'Nissan', 'Peugeot'];
const CATEGORIES = [
  { icon: '🚗', name: 'Sedanes', count: '2.340', q: 'Sedan' },
  { icon: '🚙', name: 'SUVs', count: '4.120', q: 'SUV' },
  { icon: '🛻', name: 'Pickups', count: '1.890', q: 'Pickup' },
  { icon: '🚘', name: 'Hatchbacks', count: '3.210', q: 'Hatchback' },
  { icon: '🚐', name: 'Utilitarios', count: '890', q: 'Utilitario' },
  { icon: '🏎️', name: 'Deportivos', count: '560', q: 'Deportivo' },
  { icon: '🚌', name: 'Minivans', count: '420', q: 'Minivan' },
  { icon: '🚚', name: 'Camionetas', count: '1.100', q: 'Camioneta' },
];

function useScrollAnimations() {
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up,.fade-in,.slide-left,.slide-right,.scale-in').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ brand: '', priceMax: '', location: '' });
  const [featured, setFeatured] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useScrollAnimations();

  useEffect(() => {
    listingsApi.getAll({ limit: 6 })
      .then(r => setFeatured(r.data.listings || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));
    plansApi.getAll().then(r => setPlans(r.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.brand) params.set('brand', search.brand);
    if (search.priceMax) params.set('priceMax', search.priceMax);
    navigate(`/publicaciones?${params.toString()}`);
  };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-road" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-left">
              <div className="hero-eyebrow fade-in">
                <i className="fa-solid fa-star" /> La plataforma #1 de autos usados en Argentina
              </div>
              <h1 className="fade-up delay-1">Encontrá tu próximo <em>auto ideal</em> al mejor precio</h1>
              <p className="hero-sub fade-up delay-2">Miles de vehículos verificados de particulares y concesionarias. Comprá, vendé y financiá sin salir de casa.</p>

              <form className="hero-search fade-up delay-3" onSubmit={handleSearch}>
                <div className="hero-search-grid">
                  <div>
                    <label>Marca</label>
                    <select value={search.brand} onChange={e => setSearch({ ...search, brand: e.target.value })}>
                      <option value="">Todas las marcas</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Precio máximo</label>
                    <select value={search.priceMax} onChange={e => setSearch({ ...search, priceMax: e.target.value })}>
                      <option value="">Sin límite</option>
                      <option value="5000000">Hasta $5.000.000</option>
                      <option value="10000000">Hasta $10.000.000</option>
                      <option value="15000000">Hasta $15.000.000</option>
                      <option value="25000000">Hasta $25.000.000</option>
                    </select>
                  </div>
                  <div>
                    <label>Ubicación</label>
                    <select>
                      <option value="">Todo el país</option>
                      <option>Buenos Aires</option>
                      <option>Córdoba</option>
                      <option>Rosario</option>
                      <option>Mendoza</option>
                    </select>
                  </div>
                </div>
                <div className="hero-search-footer">
                  <span className="search-hint"><i className="fa-solid fa-fire" style={{ color: 'var(--accent)' }} /> 9.548 publicaciones activas hoy</span>
                  <button type="submit" className="btn btn-primary"><i className="fa-solid fa-magnifying-glass" /> Buscar ahora</button>
                </div>
              </form>

              <div className="hero-stats-row fade-up delay-4">
                <div className="hero-stat"><strong>9.548+</strong><span>Publicaciones activas</span></div>
                <div className="hero-stat"><strong>646+</strong><span>Concesionarias</span></div>
                <div className="hero-stat"><strong>36.480+</strong><span>Ventas realizadas</span></div>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-car-mockup">
                <div className="car-listing-preview">
                  <div className="car-preview-img">🚗</div>
                  <div className="car-preview-body">
                    <div className="car-preview-brand">Toyota · Destacado</div>
                    <div className="car-preview-name">Hilux SRX 4×4 Automática</div>
                    <div className="car-preview-price">$28.500.000</div>
                    <div className="car-preview-specs">
                      <span><i className="fa-solid fa-road" /> 32.000 km</span>
                      <span><i className="fa-solid fa-gas-pump" /> Diesel</span>
                      <span><i className="fa-solid fa-gears" /> Automático</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hero-float-badges">
                <div className="hero-float-badge"><i className="fa-solid fa-shield-check" style={{ color: 'var(--success)' }} /> Verificado</div>
                <div className="hero-float-badge"><i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} /> Contacto directo</div>
                <div className="hero-float-badge"><i className="fa-solid fa-credit-card" style={{ color: 'var(--primary)' }} /> Financiación</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS BAND */}
      <div className="brands-band">
        <div className="container">
          <div className="brands-inner">
            <span className="brands-label">Marcas</span>
            {BRANDS.map(b => (
              <button key={b} className="brand-pill" onClick={() => navigate(`/publicaciones?brand=${b}`)}>{b}</button>
            ))}
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-tag">Categorías</div>
              <h2 className="section-title fade-up">Explorá por tipo de vehículo</h2>
            </div>
            <Link to="/publicaciones" className="btn btn-outline">Ver todas <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(c => (
              <button key={c.name} className="category-card" onClick={() => navigate(`/publicaciones?search=${c.q}`)}>
                <div className="cat-icon">{c.icon}</div>
                <h3>{c.name}</h3>
                <p>{c.count} autos</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-tag orange">Destacados</div>
              <h2 className="section-title fade-up">Publicaciones destacadas</h2>
              <p className="section-subtitle">Los mejores vehículos seleccionados para vos</p>
            </div>
            <Link to="/publicaciones" className="btn btn-outline">Ver todas <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          {loadingFeatured ? (
            <div className="listings-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton listing-skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="listings-grid">
              {featured.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-car" style={{ fontSize: '3rem', marginBottom: 12, display: 'block', color: 'var(--text-faint)' }} />
              <p>No hay publicaciones disponibles por el momento.</p>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/publicaciones" className="btn btn-outline btn-lg fade-up">
              Ver todas las publicaciones <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-inner">
            <div className="stats-item fade-up"><strong>9.548+</strong><span>Publicaciones activas</span></div>
            <div className="stats-item fade-up delay-2"><strong>646+</strong><span>Concesionarias registradas</span></div>
            <div className="stats-item fade-up delay-3"><strong>36.480+</strong><span>Autos vendidos</span></div>
            <div className="stats-item fade-up delay-4"><strong>98%</strong><span>Usuarios satisfechos</span></div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-section">
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Simple y rápido</div>
            <h2 className="section-title fade-up">¿Cómo funciona?</h2>
            <p className="section-subtitle fade-up delay-1">En 3 pasos tenés tu auto o vendés el tuyo</p>
          </div>
          <div className="steps-grid">
            <div className="step-card fade-up delay-1">
              <div className="step-icon"><i className="fa-solid fa-magnifying-glass" /></div>
              <div className="step-num">1</div>
              <h3>Buscá tu auto</h3>
              <p>Filtrá por marca, modelo, precio, kilómetros y ubicación. Miles de opciones al instante.</p>
            </div>
            <div className="step-card fade-up delay-2">
              <div className="step-icon"><i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} /></div>
              <div className="step-num">2</div>
              <h3>Contactá al vendedor</h3>
              <p>Escribile directo por WhatsApp o Mensaje. Sin intermediarios. Sin comisiones.</p>
            </div>
            <div className="step-card fade-up delay-3">
              <div className="step-icon"><i className="fa-solid fa-handshake" /></div>
              <div className="step-num">3</div>
              <h3>Cerrá el trato</h3>
              <p>Coordiná la revisión, pagá con MercadoPago y listo. Transferencia segura garantizada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" style={{ background: 'var(--bg-2)' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">¿Por qué elegirnos?</div>
            <h2 className="section-title fade-up">Todo lo que necesitás para comprar o vender</h2>
          </div>
          <div className="features-grid">
            {[
              { bg: '#EEF3FF', color: 'var(--primary)', icon: 'fa-solid fa-shield-check', title: 'Vehículos verificados', desc: 'Cada publicación pasa por nuestro proceso de verificación. Informe de título, multas y deudas incluido.' },
              { bg: '#FFF3EB', color: 'var(--accent)', icon: 'fa-solid fa-camera', title: 'Fotos 360°', desc: 'Publicaciones con galerías completas y recorridos virtuales del vehículo desde tu celular.' },
              { bg: '#DCFCE7', color: 'var(--success)', icon: 'fa-solid fa-credit-card', title: 'Financiación fácil', desc: 'Simulá tu crédito en segundos. Trabajamos con los mejores bancos y financieras del país.' },
              { bg: '#FEF3C7', color: 'var(--warning)', icon: 'fa-solid fa-bell', title: 'Alertas inteligentes', desc: 'Configurá tu búsqueda y te avisamos cuando llegue el auto que buscás al precio que querés.' },
              { bg: '#EEF3FF', color: 'var(--primary)', icon: 'fa-brands fa-whatsapp', title: 'WhatsApp directo', desc: 'Contacto inmediato con el vendedor sin registros ni formularios. Rápido y sin fricción.' },
              { bg: '#FFF3EB', color: 'var(--accent)', icon: 'fa-solid fa-chart-line', title: 'Tasación gratis', desc: 'Conocé el valor de mercado de tu auto en segundos con nuestra herramienta de tasación.' },
            ].map((f, i) => (
              <div key={f.title} className={`feature-card fade-up delay-${(i % 3) + 1}`}>
                <div className="feature-icon" style={{ background: f.bg, color: f.color }}><i className={f.icon} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section" id="planes" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Precios</div>
            <h2 className="section-title fade-up">Planes para publicar</h2>
            <p className="section-subtitle fade-up delay-1">Elegí el plan que mejor se adapte a tus necesidades</p>
          </div>
          <div className="pricing-grid">
            {plans.length > 0 ? plans.map((p, i) => (
              <div key={p.id} className={`pricing-card fade-up delay-${i + 1}${i === 1 ? ' featured' : ''}`}>
                {i === 1 && <div className="pricing-badge">MÁS POPULAR</div>}
                <div className="pricing-icon" style={{ background: i === 0 ? 'var(--bg-2)' : i === 1 ? 'var(--primary-bg)' : 'var(--accent-bg)', color: i === 0 ? 'var(--text-muted)' : i === 1 ? 'var(--primary)' : 'var(--accent)' }}>
                  <i className={i === 0 ? 'fa-solid fa-leaf' : i === 1 ? 'fa-solid fa-rocket' : 'fa-solid fa-crown'} />
                </div>
                <div className="pricing-name">{p.name}</div>
                <div className="pricing-price">${(p.price || 0).toLocaleString('es-AR')}<span>/mes</span></div>
                <p className="pricing-desc">{p.description || 'Plan para publicar tus vehículos'}</p>
                <ul className="pricing-features">
                  {(p.features || [`Hasta ${p.maxListings || 1} publicaciones`, 'Soporte básico']).map(f => (
                    <li key={f}><i className="fa-solid fa-check" /> {f}</li>
                  ))}
                </ul>
                <Link to="/login?tab=register" className={`btn ${i === 1 ? 'btn-primary' : 'btn-outline'} btn-block`}>Comenzar ahora</Link>
              </div>
            )) : (
              // Fallback static plans
              [
                { name: 'Básico', price: '$30.000', period: '/mes', desc: 'Para particulares que quieren vender su auto', features: ['1 publicación activa', 'Fotos estándar', 'Soporte por email', 'Duración 30 días'], icon: 'fa-solid fa-leaf', bg: 'var(--bg-2)', color: 'var(--text-muted)', featured: false },
                { name: 'Intermedio', price: '$55.000', period: '/mes', desc: 'Para vendedores frecuentes y pequeños dealers', features: ['5 publicaciones activas', 'Fotos HD + video', 'Destacado en búsquedas', 'Soporte prioritario', 'Estadísticas básicas'], icon: 'fa-solid fa-rocket', bg: 'var(--primary-bg)', color: 'var(--primary)', featured: true },
                { name: 'Premium', price: '$80.000', period: '/mes', desc: 'Para concesionarias y vendedores profesionales', features: ['Publicaciones ilimitadas', 'Banner en homepage', 'Posicionamiento top', 'API de integración', 'Manager dedicado', 'Estadísticas avanzadas'], icon: 'fa-solid fa-crown', bg: 'var(--accent-bg)', color: 'var(--accent)', featured: false },
              ].map((p, i) => (
                <div key={p.name} className={`pricing-card fade-up delay-${i + 1}${p.featured ? ' featured' : ''}`}>
                  {p.featured && <div className="pricing-badge">MÁS POPULAR</div>}
                  <div className="pricing-icon" style={{ background: p.bg, color: p.color }}><i className={p.icon} /></div>
                  <div className="pricing-name">{p.name}</div>
                  <div className="pricing-price">{p.price}<span>{p.period}</span></div>
                  <p className="pricing-desc">{p.desc}</p>
                  <ul className="pricing-features">
                    {p.features.map(f => <li key={f}><i className="fa-solid fa-check" /> {f}</li>)}
                  </ul>
                  <Link to="/login?tab=register" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} btn-block`}>Comenzar ahora</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Testimonios</div>
            <h2 className="section-title fade-up">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="testimonials-grid">
            {[
              { init: 'MG', name: 'Martín González', role: 'Vendedor particular', text: 'Vendí mi Corolla en 4 días. La plataforma es súper fácil de usar y recibí muchas consultas de compradores serios. 100% recomendable.' },
              { init: 'LP', name: 'Laura Paz', role: 'Compradora', text: 'Encontré exactamente el auto que buscaba. El proceso fue transparente, pude verificar todo y el vendedor fue muy profesional. Excelente experiencia.' },
              { init: 'CR', name: 'Carlos Rodríguez', role: 'Concesionaria AutoPrime', text: 'Tenemos más de 40 publicaciones activas y el panel de administración es muy completo. Nuestras ventas aumentaron un 35% desde que usamos GonzApp.' },
            ].map((t, i) => (
              <div key={t.name} className={`testimonial-card fade-up delay-${i + 1}`}>
                <div className="t-stars">★★★★★</div>
                <p className="t-text">"{t.text}"</p>
                <div className="t-author">
                  <div className="t-avatar">{t.init}</div>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>¿Querés vender tu auto?</h2>
          <p>Publicá gratis y llegá a miles de compradores en todo el país. Sin comisiones ocultas.</p>
          <div className="cta-actions">
            <Link to="/login?tab=register" className="btn btn-white btn-lg">
              <i className="fa-solid fa-plus" /> Publicar ahora — Es gratis
            </Link>
            <a href="https://wa.me/542665016253" target="_blank" rel="noreferrer" className="btn btn-outline-white btn-lg" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.4)', color: '#fff' }}>
              <i className="fa-brands fa-whatsapp" /> Consultar
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
