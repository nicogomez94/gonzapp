import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingsApi, plansApi } from '../api';
import ListingCard from '../components/ListingCard';
import { useDebug } from '../context/DebugContext';
import { debugDefaults } from '../context/debugDefaults';
import { VEHICLE_TYPES } from '../constants/vehicleTypes';

const BRANDS = ['Toyota', 'Ford', 'Volkswagen', 'Honda', 'Chevrolet', 'Renault', 'Fiat', 'Jeep', 'Nissan', 'Peugeot'];

const WHATSAPP_LINK = 'https://wa.me/542665016253';

const FALLBACK_PLANS = [
  {
    name: 'Básico',
    price: 30000,
    desc: 'Publicación básica para vender una unidad',
    features: ['1 unidad', 'Publicación por 30 días', '6 imágenes del vehículo', 'Contacto por WhatsApp'],
    icon: 'fa-solid fa-leaf',
    bg: 'var(--bg-2)',
    color: 'var(--text-muted)',
    featured: false,
  },
  {
    name: 'Intermedio',
    price: 55000,
    desc: 'Publicación con documentación verificada',
    features: ['1 unidad', '8 imágenes del vehículo', 'Informe de Dominio y Multas', 'Insignia "Documentación Verificada"', 'Contacto por WhatsApp'],
    icon: 'fa-solid fa-shield-halved',
    bg: 'var(--primary-bg)',
    color: 'var(--primary)',
    featured: true,
  },
  {
    name: 'Premium',
    price: 80000,
    desc: 'Publicación completa con informe y beneficio de gestoría',
    features: ['1 unidad', '10 fotos del vehículo', 'Informe de Dominio y Multas', 'Insignia "Documentación Verificada"', '15% de descuento en Honorarios de Gestoría', 'Contacto por WhatsApp'],
    icon: 'fa-solid fa-crown',
    bg: 'var(--accent-bg)',
    color: 'var(--accent)',
    featured: false,
  },
];

const planWhatsAppLink = (planName) => `${WHATSAPP_LINK}?text=${encodeURIComponent(`Hola, quiero consultar por el plan ${planName} para publicar mi auto.`)}`;

const planFeatures = (plan) => {
  const features = plan.features?.length ? plan.features : [];
  return [
    '1 unidad',
    ...features,
    ...(features.length ? [] : [`${plan.maxImages || 6} imágenes del vehículo`, 'Contacto por WhatsApp']),
  ].filter((feature, index, arr) => arr.indexOf(feature) === index);
};

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
  const isDebug = useDebug();
  const [search, setSearch] = useState(() => (
    isDebug ? debugDefaults.search : { brand: '', priceMax: '', location: '' }
  ));
  const [featured, setFeatured] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useScrollAnimations();

  useEffect(() => {
    listingsApi.getAll({ featured: true, limit: 6 })
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
    if (search.location) params.set('location', search.location);
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
                <i className="fa-solid fa-star" /> La plataforma #1 de usados en: Valle del Conlara (San Luis), Traslasierra (Cba), Río Cuarto, Villa Mercedes, San Luis Capital.
              </div>
              <h1 className="fade-up delay-1">Encontrá tu próximo <em>auto ideal</em> al mejor precio</h1>
              <p className="hero-sub fade-up delay-2">Encontrá autos publicados y consultá por planes pagos para vender una unidad con contacto directo por WhatsApp.</p>

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
                    <select value={search.location} onChange={e => setSearch({ ...search, location: e.target.value })}>
                      <option value="">Todo el país</option>
                      <option>Buenos Aires</option>
                      <option>Córdoba</option>
                      <option>Rosario</option>
                      <option>Mendoza</option>
                    </select>
                  </div>
                </div>
                <div className="hero-search-footer">
                  <span className="search-hint"><i className="fa-solid fa-car-side" style={{ color: 'var(--accent)' }} /> Publicaciones disponibles para consultar</span>
                  <button type="submit" className="btn btn-primary"><i className="fa-solid fa-magnifying-glass" /> Buscar ahora</button>
                </div>
              </form>

              <div className="hero-stats-row fade-up delay-4">
                <div className="hero-stat"><strong>3</strong><span>Planes de publicación</span></div>
                <div className="hero-stat"><strong>1</strong><span>Unidad por plan</span></div>
                <div className="hero-stat"><strong>WhatsApp</strong><span>Contacto directo</span></div>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-car-mockup">
                <div className="car-listing-preview">
                  <div className="car-preview-img">
                    <img src="/hilux.png" alt="Toyota Hilux SRX 4x4 destacada" />
                  </div>
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
                <div className="hero-float-badge"><i className="fa-solid fa-shield-halved" style={{ color: 'var(--success)' }} /> Verificado</div>
                <div className="hero-float-badge"><i className="fa-brands fa-whatsapp" style={{ color: '#25D366' }} /> Contacto directo</div>
                <div className="hero-float-badge"><i className="fa-solid fa-car-side" style={{ color: 'var(--primary)' }} /> Una unidad</div>
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
              <br />
            <Link to="/publicaciones" className="btn btn-outline">Ver todas <i className="fa-solid fa-arrow-right" /></Link>
          </div>
          <div className="categories-grid">
            {VEHICLE_TYPES.map(c => (
              <button key={c.value} className="category-card" onClick={() => navigate(`/publicaciones?vehicleType=${encodeURIComponent(c.value)}`)}>
                <div className="cat-icon">{c.icon}</div>
                <h3>{c.plural}</h3>
                <p>Ver autos</p>
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
            <br />
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
            <div className="stats-item fade-up"><strong>$30.000</strong><span>Plan Básico</span></div>
            <div className="stats-item fade-up delay-2"><strong>$55.000</strong><span>Plan Intermedio</span></div>
            <div className="stats-item fade-up delay-3"><strong>$80.000</strong><span>Plan Premium</span></div>
            <div className="stats-item fade-up delay-4"><strong>1</strong><span>Unidad por plan</span></div>
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
              { bg: '#EEF3FF', color: 'var(--primary)', icon: 'fa-solid fa-list-check', title: 'Planes claros', desc: 'Tres opciones de publicación con precio fijo, duración definida y una sola unidad por plan.' },
              { bg: '#FFF3EB', color: 'var(--accent)', icon: 'fa-solid fa-camera', title: 'Imágenes según plan', desc: 'Incluí 6, 8 o 10 fotos del vehículo según el plan que elijas.' },
              { bg: '#DCFCE7', color: 'var(--success)', icon: 'fa-solid fa-file-shield', title: 'Documentación verificada', desc: 'Los planes Intermedio y Premium incluyen informe de dominio y multas con insignia de verificación.' },
              { bg: '#FEF3C7', color: 'var(--warning)', icon: 'fa-solid fa-handshake', title: 'Beneficio de gestoría', desc: 'El plan Premium suma descuento en honorarios de gestoría para la transferencia de dominio.' },
              { bg: '#EEF3FF', color: 'var(--primary)', icon: 'fa-brands fa-whatsapp', title: 'WhatsApp directo', desc: 'Consultas rápidas para elegir plan, coordinar la publicación y contactar al vendedor.' },
              { bg: '#FFF3EB', color: 'var(--accent)', icon: 'fa-solid fa-user-gear', title: 'Carga administrada', desc: 'La gestión inicial de publicaciones y usuarios se acompaña desde el panel administrativo.' },
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
                <div className="pricing-price">${(p.price || 0).toLocaleString('es-AR')}<span>/publicación</span></div>
                <p className="pricing-desc">{p.description || 'Plan para publicar tus vehículos'}</p>
                <ul className="pricing-features">
                  {planFeatures(p).map(f => (
                    <li key={f}><i className="fa-solid fa-check" /> {f}</li>
                  ))}
                </ul>
                <a href={planWhatsAppLink(p.name)} target="_blank" rel="noreferrer" className={`btn ${i === 1 ? 'btn-primary' : 'btn-outline'} btn-block`}>
                  Consultar por WhatsApp
                </a>
              </div>
            )) : (
              // Fallback static plans
              FALLBACK_PLANS.map((p, i) => (
                <div key={p.name} className={`pricing-card fade-up delay-${i + 1}${p.featured ? ' featured' : ''}`}>
                  {p.featured && <div className="pricing-badge">MÁS POPULAR</div>}
                  <div className="pricing-icon" style={{ background: p.bg, color: p.color }}><i className={p.icon} /></div>
                  <div className="pricing-name">{p.name}</div>
                  <div className="pricing-price">${p.price.toLocaleString('es-AR')}<span>/publicación</span></div>
                  <p className="pricing-desc">{p.desc}</p>
                  <ul className="pricing-features">
                    {p.features.map(f => <li key={f}><i className="fa-solid fa-check" /> {f}</li>)}
                  </ul>
                  <a href={planWhatsAppLink(p.name)} target="_blank" rel="noreferrer" className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'} btn-block`}>
                    Consultar por WhatsApp
                  </a>
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
              { init: 'CR', name: 'Carlos Rodríguez', role: 'Vendedor particular', text: 'Elegí el plan Intermedio por la documentación verificada. Me ayudó a publicar con más claridad y a responder consultas por WhatsApp.' },
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
          <p>Elegí un plan para publicar una unidad y coordiná la carga por WhatsApp.</p>
          <div className="cta-actions">
            <a href={planWhatsAppLink('publicación')} target="_blank" rel="noreferrer" className="btn btn-white btn-lg">
              <i className="fa-brands fa-whatsapp" /> Consultar plan
            </a>
            <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn btn-outline-white btn-lg" style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.4)', color: '#fff' }}>
              <i className="fa-solid fa-circle-question" /> Hacer una consulta
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
