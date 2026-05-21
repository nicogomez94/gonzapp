import { Link } from 'react-router-dom';

const VALUES = [
  {
    icon: 'fa-solid fa-scale-balanced',
    title: 'Honestidad',
    text: 'Cada publicación y cada consulta se trabajan con información clara para cuidar a compradores y vendedores.',
  },
  {
    icon: 'fa-solid fa-eye',
    title: 'Transparencia',
    text: 'Buscamos que el proceso de compra y venta sea simple, visible y sin pasos confusos.',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Responsabilidad',
    text: 'Acompañamos con criterio profesional del sector automotor y de la gestoría registral.',
  },
];

export default function SobreNosotrosPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Inicio</Link>
            <i className="fa-solid fa-chevron-right" />
            <span>Sobre nosotros</span>
          </div>
          <div className="about-hero-grid">
            <div className="about-copy">
              <div className="section-tag">Sobre nosotros</div>
              <h1>Somos AutoZona, tu próximo auto más cerca</h1>
              <p>
                AutoZona tiene su origen en Villa de Merlo, Provincia de San Luis. Desde 2025 creamos un espacio pensado para transformar la experiencia de comprar y vender vehículos entre particulares.
              </p>
              <div className="about-actions">
                <Link to="/publicaciones" className="btn btn-primary btn-lg">
                  <i className="fa-solid fa-car-side" /> Ver publicaciones
                </Link>
                <a href="https://wa.me/542665016253" target="_blank" rel="noreferrer" className="btn btn-outline-gray btn-lg">
                  <i className="fa-brands fa-whatsapp" /> Contactar
                </a>
              </div>
            </div>
            <div className="about-panel">
              <div className="about-panel-icon">
                <i className="fa-solid fa-location-dot" />
              </div>
              <strong>Villa de Merlo</strong>
              <span>San Luis, Argentina</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-story-section">
        <div className="container about-story-grid">
          <div>
            <div className="section-tag">Nuestra mirada</div>
            <h2>Comprar un vehículo es una decisión importante</h2>
          </div>
          <div className="about-story">
            <p>
              En AutoZona entendemos que la compra de un vehículo es una decisión muy importante. Por eso decidimos crear un espacio dedicado a aportar simplicidad y transparencia en el proceso de compra y venta de vehículos entre particulares.
            </p>
            <p>
              Ayudamos a compradores y vendedores a encontrarse en un solo sitio, con publicaciones claras y contacto directo para avanzar con confianza.
            </p>
          </div>
        </div>
      </section>

      <section className="section about-values-section">
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Valores</div>
            <h2 className="section-title">Lo que guía nuestro trabajo</h2>
          </div>
          <div className="about-values-grid">
            {VALUES.map(value => (
              <article key={value.title} className="about-value-card">
                <div className="about-value-icon"><i className={value.icon} /></div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-team-section">
        <div className="container about-team">
          <div className="about-team-icon">
            <i className="fa-solid fa-people-group" />
          </div>
          <div>
            <div className="section-tag">Equipo</div>
            <h2>Profesionales del sector automotor</h2>
            <p>
              AutoZona está conformado por profesionales del sector automotor, gestores y mandatarios del automotor. Nuestro objetivo es hacer que la compraventa sea mucho más fácil, ayudando a cada persona a acceder a su propio vehículo con total seguridad.
            </p>
            <p className="about-closing">Estamos para ayudarte.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
