import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <BrandLogo variant="footer" />
            </div>
            <p>Marketplace de autos con planes claros para publicar una unidad y contacto directo por WhatsApp.</p>
            <div className="footer-social">
              <a href="https://www.facebook.com/share/1CoxcMa1TQ/" target="_blank" rel="noreferrer" aria-label="Facebook de Auto Zona Merlo"><i className="fa-brands fa-facebook-f" /></a>
              <a href="https://www.instagram.com/autozonamsl?igsh=djYyZjZqdHhmNTEx" target="_blank" rel="noreferrer" aria-label="Instagram de Auto Zona Merlo"><i className="fa-brands fa-instagram" /></a>
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
              <li><Link to="/sobre-nosotros">Sobre nosotros</Link></li>
              <li><Link to="/terminos-y-condiciones">Términos y condiciones</Link></li>
              <li><Link to="/terminos-y-condiciones#privacidad">Política de privacidad</Link></li>
              <li><a href="#">Centro de ayuda</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contacto</h4>
            <ul>
              <li><a href="tel:2665016253"><i className="fa-solid fa-phone" style={{ marginRight: 6 }} />2665-016253</a></li>
              <li><a href="mailto:autozonacomercial@gmail.com"><i className="fa-solid fa-envelope" style={{ marginRight: 6 }} />autozonacomercial@gmail.com</a></li>
              <li><span><i className="fa-solid fa-location-dot" style={{ marginRight: 6 }} />Merlo, San Luis</span></li>
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
