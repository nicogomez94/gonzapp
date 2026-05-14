import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useDebug, debugDefaults } from '../context/DebugContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const { login } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const isDebug = useDebug();

  const [loginForm, setLoginForm] = useState(
    isDebug ? debugDefaults.login : { email: '', password: '' }
  );
  const [registerForm, setRegisterForm] = useState(
    isDebug ? debugDefaults.register : { name: '', email: '', phone: '', password: '' }
  );
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(loginForm);
      login(data.token, data.user);
      show('¡Bienvenido de vuelta!');
      navigate(data.user.role === 'ADMIN' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.register(registerForm);
      login(data.token, data.user);
      show('¡Cuenta creada con éxito!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(''); };

  return (
    <div className="login-wrap">
      {/* LEFT VISUAL PANEL */}
      <div className="login-visual">
        <div className="visual-logo">
          <i className="fa-solid fa-car-side" />
          AutoZona
        </div>
        <div className="visual-tagline">
          Plataforma para comprar autos y publicar una unidad con planes claros
        </div>
        <div className="visual-car">🚗</div>
        <div className="visual-features">
          <div><i className="fa-solid fa-shield-check" /> Documentación verificada según plan</div>
          <div><i className="fa-solid fa-car-side" /> Una unidad por publicación</div>
          <div><i className="fa-brands fa-whatsapp" /> Contacto directo</div>
        </div>
        <div className="visual-stats">
          <div><strong>$30k</strong><span>Básico</span></div>
          <div><strong>$55k</strong><span>Intermedio</span></div>
          <div><strong>$80k</strong><span>Premium</span></div>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="login-form-panel">
        <div className="form-wrap">
          <Link to="/" className="back-link">
            <i className="fa-solid fa-arrow-left" /> Volver al inicio
          </Link>

          {/* TABS */}
          <div className="auth-tabs">
            <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => switchTab('login')}>
              Ingresar
            </button>
            <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>
              Registrarse
            </button>
          </div>

          {/* LOGIN PANEL */}
          <div className={`auth-panel${tab === 'login' ? ' active' : ''}`} style={{ display: tab === 'login' ? 'block' : 'none' }}>
            <h2 className="form-title">Bienvenido de vuelta</h2>
            <p className="form-subtitle">Ingresá a tu cuenta para gestionar tus publicaciones</p>

            <div className="social-buttons">
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-google" style={{ color: '#EA4335' }} /> Continuar con Google
              </button>
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-facebook" style={{ color: '#1877F2' }} /> Continuar con Facebook
              </button>
            </div>

            <div className="divider"><span>o con tu email</span></div>

            {error && tab === 'login' && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-envelope input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="tu@email.com"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-lock input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="check-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                  Recordarme
                </label>
                <Link to="/forgot-password" className="forgot-link">¿Olvidaste tu contraseña?</Link>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Ingresando…</> : <><i className="fa-solid fa-right-to-bracket" /> Ingresar</>}
              </button>
            </form>

            <p className="auth-switch">
              ¿No tenés cuenta? <button type="button" className="link-btn" onClick={() => switchTab('register')}>Registrate</button>
            </p>
          </div>

          {/* REGISTER PANEL */}
          <div className={`auth-panel${tab === 'register' ? ' active' : ''}`} style={{ display: tab === 'register' ? 'block' : 'none' }}>
            <h2 className="form-title">Creá tu cuenta</h2>
            <p className="form-subtitle">Creá tu usuario para gestionar consultas y publicaciones</p>

            <div className="social-buttons">
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-google" style={{ color: '#EA4335' }} /> Continuar con Google
              </button>
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-facebook" style={{ color: '#1877F2' }} /> Continuar con Facebook
              </button>
            </div>

            <div className="divider"><span>o con tu email</span></div>

            {error && tab === 'register' && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="input-group">
                <label className="input-label">Nombre completo</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-user input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Juan Pérez"
                    required
                    value={registerForm.name}
                    onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-envelope input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="tu@email.com"
                    required
                    value={registerForm.email}
                    onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Teléfono</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-phone input-icon" />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="1155001234"
                    value={registerForm.phone}
                    onChange={e => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <div className="input-wrap">
                  <i className="fa-solid fa-lock input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    value={registerForm.password}
                    onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                    <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Creando cuenta…</> : <><i className="fa-solid fa-user-plus" /> Crear cuenta</>}
              </button>
            </form>

            <p className="auth-switch">
              ¿Ya tenés cuenta? <button type="button" className="link-btn" onClick={() => switchTab('login')}>Ingresá acá</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
