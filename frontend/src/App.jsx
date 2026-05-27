import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DebugProvider } from './context/DebugContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DebugBanner from './components/DebugBanner';
import HomePage from './pages/HomePage';
import PublicacionesPage from './pages/PublicacionesPage';
import DetallePage from './pages/DetallePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MiCuentaPage from './pages/MiCuentaPage';
import PlanesPage from './pages/PlanesPage';
import TerminosPage from './pages/TerminosPage';
import SobreNosotrosPage from './pages/SobreNosotrosPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './styles/global.css';

function ProtectedAdmin({ children }) {
  const { isAdmin, user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/mi-cuenta" replace />;
  return children;
}

function ProtectedUser({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN' && user.approvalStatus === 'PENDING_PLAN') return <Navigate to="/planes" replace />;
  return children;
}

function Layout({ children, hideFooter }) {
  return (
    <>
      <Navbar />
      {children}
      {!hideFooter && <Footer />}
      <DebugBanner />
    </>
  );
}

function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ block: 'start' });
        return;
      }
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash, key]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <DebugProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/planes" element={<Layout><PlanesPage /></Layout>} />
              <Route path="/terminos-y-condiciones" element={<Layout><TerminosPage /></Layout>} />
              <Route path="/sobre-nosotros" element={<Layout><SobreNosotrosPage /></Layout>} />
              <Route path="/publicaciones" element={<Layout><PublicacionesPage /></Layout>} />
              <Route path="/publicaciones/:id" element={<Layout><DetallePage /></Layout>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/mi-cuenta" element={
                <ProtectedUser>
                  <Layout><MiCuentaPage /></Layout>
                </ProtectedUser>
              } />
              <Route path="/dashboard" element={
                <ProtectedAdmin>
                  <Layout hideFooter><DashboardPage /></Layout>
                </ProtectedAdmin>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </DebugProvider>
    </BrowserRouter>
  );
}
