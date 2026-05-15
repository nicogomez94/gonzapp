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
  const [acceptTerms, setAcceptTerms] = useState(false);

  const nextPathForUser = (userData) => {
    if (userData.role === 'ADMIN') return '/dashboard';
    if (userData.approvalStatus === 'PENDING_PLAN') return '/planes';
    if (userData.approvalStatus === 'PENDING_APPROVAL') return '/mi-cuenta';
    return '/mi-cuenta';
  };

  const passwordScore = (() => {
    const value = registerForm.password || '';
    let score = 0;
    if (value.length >= 6) score += 1;
    if (value.length >= 10) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return Math.min(score, 4);
  })();

  const strengthMeta = [
    { label: '', color: 'var(--border)', width: '0%' },
    { label: 'Débil', color: 'var(--error)', width: '28%' },
    { label: 'Media', color: 'var(--warning)', width: '52%' },
    { label: 'Buena', color: 'var(--primary)', width: '76%' },
    { label: 'Fuerte', color: 'var(--success)', width: '100%' }
  ][passwordScore];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.login(loginForm);
      login(data.token, data.user);
      show('¡Bienvenido de vuelta!');
      navigate(nextPathForUser(data.user));
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!acceptTerms) {
      setError('Debés aceptar los términos y condiciones');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.register(registerForm);
      login(data.token, data.user);
      show('¡Cuenta creada con éxito! Elegí un plan para continuar.');
      navigate('/planes');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => { setTab(t); setError(''); };

  return (
    <div className={`login-wrap login-${tab}`}>
      {/* LEFT VISUAL PANEL */}
      <div className="login-visual">
        <Link to="/" className="visual-logo">
          <span className="logo-auto">AUTO</span><span className="logo-zona">ZONA</span>
        </Link>

        <div className="visual-car">
          <img src="/hilux.png" alt="Toyota Hilux" />
        </div>

        <div className="visual-tagline">
          <h2>Tu próximo auto está a un clic</h2>
          <p>Publicá, comprá y vendé autos con la plataforma más completa de Argentina.</p>
        </div>

        <div className="visual-features">
          <div className="visual-feature">
            <div className="visual-feature-icon"><i className="fa-solid fa-shield-halved" /></div>
            <div className="visual-feature-text">
              <strong>Transacciones 100% seguras</strong>
              <span>Protegidas con verificación y gestión clara</span>
            </div>
          </div>
          <div className="visual-feature">
            <div className="visual-feature-icon"><i className="fa-solid fa-magnifying-glass" /></div>
            <div className="visual-feature-text">
              <strong>Publicaciones listas para comparar</strong>
              <span>Encontrá exactamente lo que buscás</span>
            </div>
          </div>
          <div className="visual-feature">
            <div className="visual-feature-icon"><i className="fa-brands fa-whatsapp" /></div>
            <div className="visual-feature-text">
              <strong>Contacto directo con vendedores</strong>
              <span>Sin intermediarios ni comisiones ocultas</span>
            </div>
          </div>
        </div>

        <div className="visual-stats">
          <div className="visual-stat"><strong>48K+</strong><span>Autos vendidos</span></div>
          <div className="visual-stat"><strong>98%</strong><span>Satisfacción</span></div>
          <div className="visual-stat"><strong>850+</strong><span>Concesionarias</span></div>
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
                <i className="fa-brands fa-google" style={{ color: '#EA4335' }} /> Google
              </button>
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-facebook" style={{ color: '#1877F2' }} /> Facebook
              </button>
            </div>

            <div className="divider"><span>o ingresá con tu email</span></div>

            {error && tab === 'login' && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="auth-form-stack">
                <div className="form-group">
                  <label className="form-label">Email</label>
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

                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label">Contraseña</label>
                    <Link to="/forgot-password" className="forgot-link">¿Olvidaste tu contraseña?</Link>
                  </div>
                  <div className="input-wrap input-wrap-password">
                    <i className="fa-solid fa-lock input-icon" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Tu contraseña"
                      required
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    />
                    <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                      <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="check-row auth-check-row">
                  <label>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    <span>Recordarme en este dispositivo</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Ingresando…</> : <><i className="fa-solid fa-right-to-bracket" /> Ingresar</>}
                </button>
              </div>
            </form>

            <p className="auth-switch">
              ¿No tenés cuenta? <button type="button" className="link-btn" onClick={() => switchTab('register')}>Registrate gratis</button>
            </p>
          </div>

          {/* REGISTER PANEL */}
          <div className={`auth-panel${tab === 'register' ? ' active' : ''}`} style={{ display: tab === 'register' ? 'block' : 'none' }}>
            <h2 className="form-title">Creá tu cuenta gratis</h2>
            <p className="form-subtitle">Publicá tu auto y llegá a miles de compradores</p>

            <div className="social-buttons">
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-google" style={{ color: '#EA4335' }} /> Google
              </button>
              <button className="btn btn-social" type="button">
                <i className="fa-brands fa-facebook" style={{ color: '#1877F2' }} /> Facebook
              </button>
            </div>

            <div className="divider"><span>o registrate con tu email</span></div>

            {error && tab === 'register' && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="auth-form-stack">
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
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

                <div className="form-group">
                  <label className="form-label">Email</label>
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

                <div className="form-group">
                  <label className="form-label">Teléfono / WhatsApp <span>(opcional)</span></label>
                  <div className="input-wrap">
                    <i className="fa-brands fa-whatsapp input-icon input-icon-whatsapp" />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+54 9 11 1234-5678"
                      value={registerForm.phone}
                      onChange={e => setRegisterForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  <span className="form-hint"><i className="fa-solid fa-info-circle" /> Se usará para contacto directo de compradores</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <div className="input-wrap input-wrap-password">
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
                  <div className="strength-bar"><div className="strength-bar-fill" style={{ width: strengthMeta.width, background: strengthMeta.color }} /></div>
                  <div className="strength-row">
                    <span className="form-hint">Usá letras, números y símbolos</span>
                    <span className="strength-label" style={{ color: strengthMeta.color }}>{strengthMeta.label}</span>
                  </div>
                </div>

                <div className="check-row terms-row">
                  <label>
                    <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} />
                    <span>Acepto los <a href="#">Términos y condiciones</a> y la <a href="#">Política de privacidad</a> de AutoZona</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                  {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Creando tu cuenta…</> : <><i className="fa-solid fa-user-plus" /> Crear cuenta gratis</>}
                </button>
              </div>
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
