import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import BrandLogo from '../components/BrandLogo';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const passwordScore = (() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  })();

  const strengthMeta = [
    { label: '', color: 'var(--border)', width: '0%' },
    { label: 'Débil', color: 'var(--error)', width: '28%' },
    { label: 'Media', color: 'var(--warning)', width: '52%' },
    { label: 'Buena', color: 'var(--primary)', width: '76%' },
    { label: 'Fuerte', color: 'var(--success)', width: '100%' }
  ][passwordScore];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('El enlace es inválido. Solicitá uno nuevo.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace es inválido o ya expiró.');
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

          {!token ? (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--error)' }}>
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h2 className="form-title">Enlace inválido</h2>
              <p className="form-subtitle">Este enlace no es válido. Pedí un nuevo enlace de recuperación.</p>
              <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 16 }}>
                Recuperar contraseña
              </Link>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: 'var(--success)' }}>
                <i className="fa-solid fa-circle-check" />
              </div>
              <h2 className="form-title">¡Contraseña actualizada!</h2>
              <p className="form-subtitle">Tu contraseña fue cambiada correctamente. Te redirigimos al inicio de sesión…</p>
            </div>
          ) : (
            <>
              <h2 className="form-title">Nueva contraseña</h2>
              <p className="form-subtitle">Elegí una contraseña segura para tu cuenta.</p>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <i className="fa-solid fa-circle-exclamation" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="auth-form-stack">
                  <div className="form-group">
                    <label className="form-label">Nueva contraseña</label>
                    <div className="input-wrap input-wrap-password">
                      <i className="fa-solid fa-lock input-icon" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                      <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                        <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="strength-bar-wrap" style={{ marginTop: 8 }}>
                        <div className="strength-bar-track">
                          <div
                            className="strength-bar-fill"
                            style={{ width: strengthMeta.width, background: strengthMeta.color, transition: 'width 0.3s, background 0.3s' }}
                          />
                        </div>
                        {strengthMeta.label && (
                          <span className="strength-label" style={{ color: strengthMeta.color }}>{strengthMeta.label}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                    {loading
                      ? <><i className="fa-solid fa-spinner fa-spin" /> Guardando…</>
                      : <><i className="fa-solid fa-key" /> Guardar nueva contraseña</>}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
