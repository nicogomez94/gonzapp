import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import './styles/global.css';

function ProtectedAdmin({ children }) {
  const { isAdmin, user } = useAuth();
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

export default function App() {
  return (
    <BrowserRouter>
      <DebugProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/publicaciones" element={<Layout><PublicacionesPage /></Layout>} />
              <Route path="/publicaciones/:id" element={<Layout><DetallePage /></Layout>} />
              <Route path="/login" element={<LoginPage />} />
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
