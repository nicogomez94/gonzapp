import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-auto">AUTO</span><span className="logo-zona">ZONA</span>
            </div>
            <p>Marketplace de autos con planes claros para publicar una unidad y contacto directo por WhatsApp.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
              <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
              <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>
              <a href="#" aria-label="YouTube"><i className="fa-brands fa-youtube" /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Navegación</h4>
            <ul>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/publicaciones">Publicaciones</Link></li>
              <li><Link to="/planes">Planes y precios</Link></li>
              <li><a href="https://wa.me/542665016253" target="_blank" rel="noreferrer">Consultar por WhatsApp</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Información</h4>
            <ul>
              <li><a href="#">Sobre nosotros</a></li>
              <li><a href="#">Términos y condiciones</a></li>
              <li><a href="#">Política de privacidad</a></li>
              <li><a href="#">Centro de ayuda</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contacto</h4>
            <ul>
              <li><a href="tel:2665016253"><i className="fa-solid fa-phone" style={{ marginRight: 6 }} />2665-016253</a></li>
              <li><a href="mailto:info@autozona.com.ar"><i className="fa-solid fa-envelope" style={{ marginRight: 6 }} />info@autozona.com.ar</a></li>
              <li><span><i className="fa-solid fa-location-dot" style={{ marginRight: 6 }} />Buenos Aires, Argentina</span></li>
              <li><a href="https://wa.me/542665016253" target="_blank" rel="noreferrer"><i className="fa-brands fa-whatsapp" style={{ marginRight: 6 }} />WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AutoZona — Todos los derechos reservados</span>
          <span>
            Hecho por{' '}
            <a href="https://zigodev.com.ar" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              ZigoDev
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
