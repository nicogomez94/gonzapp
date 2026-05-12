import { createContext, useContext } from 'react';

const DebugContext = createContext(false);

const DEBUG = import.meta.env.VITE_DEBUG === 'true';

export const debugDefaults = {
  login: { email: 'admin@autozona.com', password: 'admin123' },
  register: {
    name: 'Juan Test',
    email: 'test@example.com',
    phone: '1155001234',
    password: 'test1234',
  },
  listing: {
    title: 'Toyota Corolla 2022 TEST',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    mileage: 15000,
    fuel: 'Nafta',
    transmission: 'Automática',
    engine: '2.0L',
    priceArs: 18000000,
    priceUsd: 20000,
    location: 'Buenos Aires',
    phone: '1155001234',
    description: 'Vehículo en excelente estado, único dueño.',
  },
};

export function DebugProvider({ children }) {
  return <DebugContext.Provider value={DEBUG}>{children}</DebugContext.Provider>;
}

export const useDebug = () => useContext(DebugContext);
