import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navClass = scrolled ? 'navbar scrolled' : 'navbar';

  return (
    <>
      <nav className={navClass}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            <i className="fa-solid fa-car-side" /> AutoZona
          </Link>

          <ul className="nav-links">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Inicio</NavLink></li>
            <li><NavLink to="/publicaciones" className={({ isActive }) => isActive ? 'active' : ''}>Publicaciones</NavLink></li>
            <li><a href="#">Concesionarias</a></li>
            <li><a href="#">Tasaciones</a></li>
            {isAdmin && <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>}
          </ul>

          <div className="nav-actions">
            {user ? (
              <>
                {isAdmin && <Link to="/dashboard" className="btn btn-ghost btn-sm"><i className="fa-solid fa-chart-pie" /> Panel</Link>}
                <button className="btn btn-outline-gray btn-sm" onClick={handleLogout}><i className="fa-solid fa-right-from-bracket" /> Salir</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Ingresar</Link>
                <Link to="/login?tab=register" className="btn btn-accent btn-sm"><i className="fa-solid fa-plus" /> Publicar</Link>
              </>
            )}
          </div>

          <button className={`nav-hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <ul>
          <li><NavLink to="/" end onClick={() => setMenuOpen(false)}>Inicio</NavLink></li>
          <li><NavLink to="/publicaciones" onClick={() => setMenuOpen(false)}>Publicaciones</NavLink></li>
          <li><a href="#" onClick={() => setMenuOpen(false)}>Concesionarias</a></li>
          <li><a href="#" onClick={() => setMenuOpen(false)}>Tasaciones</a></li>
          {isAdmin && <li><NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink></li>}
        </ul>
        <div className="mobile-actions">
          {user ? (
            <button className="btn btn-outline-gray btn-block" onClick={() => { setMenuOpen(false); handleLogout(); }}>
              <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-gray btn-block" onClick={() => setMenuOpen(false)}>Ingresar</Link>
              <Link to="/login?tab=register" className="btn btn-accent btn-block" onClick={() => setMenuOpen(false)}>
                <i className="fa-solid fa-plus" /> Publicar
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
