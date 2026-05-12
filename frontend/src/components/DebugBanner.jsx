import { useDebug } from '../context/DebugContext';

export default function DebugBanner() {
  const isDebug = useDebug();
  if (!isDebug) return null;

  return (
    <div className="debug-banner">
      <span className="debug-badge">DEBUG</span>
      <span>⚠️ MODO DEBUG — Formularios prerellenos</span>
    </div>
  );
}
