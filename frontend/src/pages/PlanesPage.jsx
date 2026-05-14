import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { plansApi } from '../api';

const WHATSAPP_LINK = 'https://wa.me/542665016253';

const FALLBACK_PLANS = [
  {
    name: 'Básico',
    price: 30000,
    description: 'Publicación básica para vender una unidad',
    features: ['1 unidad', 'Publicación por 30 días', '6 imágenes del vehículo', 'Contacto por WhatsApp'],
  },
  {
    name: 'Intermedio',
    price: 55000,
    description: 'Publicación con documentación verificada',
    features: ['1 unidad', '8 imágenes del vehículo', 'Informe de Dominio y Multas', 'Insignia "Documentación Verificada"', 'Contacto por WhatsApp'],
  },
  {
    name: 'Premium',
    price: 80000,
    description: 'Publicación completa con informe y beneficio de gestoría',
    features: ['1 unidad', '10 fotos del vehículo', 'Informe de Dominio y Multas', 'Insignia "Documentación Verificada"', '15% de descuento en Honorarios de Gestoría', 'Contacto por WhatsApp'],
  },
];

const PLAN_META = [
  { icon: 'fa-solid fa-leaf', bg: 'var(--bg-2)', color: 'var(--text-muted)' },
  { icon: 'fa-solid fa-shield-check', bg: 'var(--primary-bg)', color: 'var(--primary)', featured: true },
  { icon: 'fa-solid fa-crown', bg: 'var(--accent-bg)', color: 'var(--accent)' },
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

const includesFeature = (plan, terms) => {
  const text = planFeatures(plan).join(' ').toLowerCase();
  return terms.some(term => text.includes(term));
};

export default function PlanesPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    plansApi.getAll()
      .then(r => setPlans(r.data?.length ? r.data : FALLBACK_PLANS))
      .catch(() => setPlans(FALLBACK_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const visiblePlans = plans.length ? plans : FALLBACK_PLANS;

  return (
    <>
      <section className="plans-hero">
        <div className="container">
          <div className="breadcrumb plans-breadcrumb">
            <Link to="/">Inicio</Link>
            <i className="fa-solid fa-chevron-right" />
            <span>Planes</span>
          </div>
          <div className="plans-hero-grid">
            <div>
              <div className="section-tag">Planes y precios</div>
              <h1>Elegí cómo publicar tu auto</h1>
              <p>
                Cada plan permite publicar una unidad, con contacto directo por WhatsApp y acompañamiento para coordinar la carga inicial.
              </p>
              <div className="plans-hero-actions">
                <a href={planWhatsAppLink('publicación')} target="_blank" rel="noreferrer" className="btn btn-accent btn-lg">
                  <i className="fa-brands fa-whatsapp" /> Consultar por WhatsApp
                </a>
                <Link to="/publicaciones" className="btn btn-outline-gray btn-lg">Ver publicaciones</Link>
              </div>
            </div>
            <div className="plans-summary">
              <div><strong>3</strong><span>Opciones iniciales</span></div>
              <div><strong>1</strong><span>Unidad por plan</span></div>
              <div><strong>30</strong><span>Días de publicación</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag orange">Publicación</div>
            <h2 className="section-title">Planes disponibles</h2>
            <p className="section-subtitle">Precios por publicación, pensados para una primera etapa simple y manual.</p>
          </div>
          <div className="pricing-grid">
            {visiblePlans.map((plan, index) => {
              const meta = PLAN_META[index] || PLAN_META[0];
              return (
                <div key={plan.id || plan.name} className={`pricing-card${meta.featured ? ' featured' : ''}`}>
                  {meta.featured && <div className="pricing-badge">MÁS POPULAR</div>}
                  <div className="pricing-icon" style={{ background: meta.bg, color: meta.color }}>
                    <i className={meta.icon} />
                  </div>
                  <div className="pricing-name">{plan.name}</div>
                  <div className="pricing-price">${(plan.price || 0).toLocaleString('es-AR')}<span>/publicación</span></div>
                  <p className="pricing-desc">{plan.description || 'Plan para publicar tu vehículo'}</p>
                  <ul className="pricing-features">
                    {planFeatures(plan).map(feature => (
                      <li key={feature}><i className="fa-solid fa-check" /> {feature}</li>
                    ))}
                  </ul>
                  <a href={planWhatsAppLink(plan.name)} target="_blank" rel="noreferrer" className={`btn ${meta.featured ? 'btn-primary' : 'btn-outline'} btn-block`}>
                    Consultar este plan
                  </a>
                </div>
              );
            })}
          </div>
          {loading && <p className="plans-loading">Cargando planes actualizados...</p>}
        </div>
      </section>

      <section className="section plans-detail-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Detalle</div>
            <h2 className="section-title">Compará antes de elegir</h2>
            <p className="section-subtitle">La diferencia principal está en la cantidad de imágenes, la documentación verificada y el beneficio de gestoría.</p>
          </div>
          <div className="plans-table-wrap">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Incluye</th>
                  {visiblePlans.map(plan => <th key={plan.id || plan.name}>{plan.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Unidad publicada</td>
                  {visiblePlans.map(plan => <td key={plan.id || plan.name}>1</td>)}
                </tr>
                <tr>
                  <td>Imágenes del vehículo</td>
                  {visiblePlans.map(plan => (
                    <td key={plan.id || plan.name}>{plan.maxImages || (plan.name === 'Premium' ? 10 : plan.name === 'Intermedio' ? 8 : 6)}</td>
                  ))}
                </tr>
                <tr>
                  <td>Informe de dominio y multas</td>
                  {visiblePlans.map(plan => (
                    <td key={plan.id || plan.name}>{includesFeature(plan, ['dominio', 'multas']) ? 'Incluido' : '-'}</td>
                  ))}
                </tr>
                <tr>
                  <td>Beneficio de gestoría</td>
                  {visiblePlans.map(plan => (
                    <td key={plan.id || plan.name}>{includesFeature(plan, ['gestoría', 'gestoria']) ? 'Incluido' : '-'}</td>
                  ))}
                </tr>
                <tr>
                  <td>Consulta y coordinación</td>
                  {visiblePlans.map(plan => <td key={plan.id || plan.name}>WhatsApp</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Proceso</div>
            <h2 className="section-title">Cómo se activa tu publicación</h2>
          </div>
          <div className="steps-grid">
            {[
              { icon: 'fa-brands fa-whatsapp', title: 'Consultás el plan', text: 'Nos escribís por WhatsApp y confirmamos qué opción se ajusta a tu publicación.' },
              { icon: 'fa-solid fa-file-lines', title: 'Enviás la información', text: 'Coordinamos fotos, datos del vehículo y documentación según el plan elegido.' },
              { icon: 'fa-solid fa-car-side', title: 'Publicamos la unidad', text: 'El aviso queda visible para recibir consultas directas de compradores interesados.' },
            ].map(step => (
              <div key={step.title} className="step-card">
                <div className="step-icon"><i className={step.icon} /></div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
