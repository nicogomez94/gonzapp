import { createContext, useContext } from 'react';

const DebugContext = createContext(false);

const DEBUG = import.meta.env.VITE_DEBUG === 'true';

export function DebugProvider({ children }) {
  return <DebugContext.Provider value={DEBUG}>{children}</DebugContext.Provider>;
}

export const useDebug = () => useContext(DebugContext);
