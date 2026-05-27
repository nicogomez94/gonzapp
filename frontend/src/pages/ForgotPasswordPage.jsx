import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError('Ocurrió un error. Intentá de nuevo en unos minutos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap login-login">
      {/* LEFT VISUAL PANEL */}
      <div className="login-visual">
        <Link to="/" className="visual-logo">
          <BrandLogo variant="login" />
        </Link>
        <div className="visual-car">
          <img src="/hilux.png" alt="Toyota Hilux" />
        </div>
        <div className="visual-tagline">
          <h2>Tu próximo auto está a un clic</h2>
          <p>Publicá, comprá y vendé autos con la plataforma más completa de Argentina.</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="login-form-panel">
        <div className="form-wrap">
          <Link to="/login" className="back-link">
            <i className="fa-solid fa-arrow-left" /> Volver al inicio de sesión
          </Link>

          {sent ? (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--success)' }}>
                <i className="fa-solid fa-envelope-circle-check" />
              </div>
              <h2 className="form-title">Revisá tu email</h2>
              <p className="form-subtitle" style={{ marginBottom: 24 }}>
                Si el email <strong>{email}</strong> está registrado, vas a recibir un enlace para restablecer tu contraseña en los próximos minutos.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ¿No llegó? Revisá la carpeta de spam o{' '}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setSent(false); setEmail(''); }}
                >
                  intentá con otro email
                </button>.
              </p>
            </div>
          ) : (
            <>
              <h2 className="form-title">Olvidaste tu contraseña</h2>
              <p className="form-subtitle">
                Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
              </p>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <i className="fa-solid fa-circle-exclamation" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
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
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                    {loading
                      ? <><i className="fa-solid fa-spinner fa-spin" /> Enviando…</>
                      : <><i className="fa-solid fa-paper-plane" /> Enviar enlace</>}
                  </button>
                </div>
              </form>

              <p className="auth-switch">
                ¿Acordaste la contraseña? <Link to="/login" className="link-btn">Ingresá acá</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
