import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { listingsApi } from '../api';
import ListingCard from '../components/ListingCard';

const BRANDS = ['Toyota', 'Ford', 'Volkswagen', 'Honda', 'Chevrolet', 'Renault', 'Peugeot', 'Fiat', 'Jeep', 'Nissan'];
const FUELS = ['Nafta', 'Diesel', 'Eléctrico', 'Híbrido', 'GNC'];
const TRANSMISSIONS = ['Manual', 'Automática'];

export default function PublicacionesPage() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const LIMIT = 12;

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    fuel: '',
    transmission: '',
    yearFrom: '',
    yearTo: '',
    priceMin: '',
    priceMax: searchParams.get('priceMax') || '',
    kmMax: '',
    sort: 'newest',
  });

  const fetchListings = useCallback(() => {
    setLoading(true);
    const params = { ...filters, page, limit: LIMIT };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    listingsApi.getAll(params)
      .then(r => {
        setListings(r.data.listings || r.data || []);
        setTotal(r.data.total || (r.data.listings || r.data || []).length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    queueMicrotask(fetchListings);
  }, [fetchListings]);

  const setFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };

  const clearFilters = () => {
    setFilters({ search: '', brand: '', fuel: '', transmission: '', yearFrom: '', yearTo: '', priceMin: '', priceMax: '', kmMax: '', sort: 'newest' });
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const activeFilterCount = [filters.brand, filters.fuel, filters.transmission, filters.priceMin, filters.priceMax, filters.kmMax].filter(Boolean).length;

  return (
    <>
      {/* PAGE TOP */}
      <div className="page-top">
        <div className="container">
          <div className="page-top-inner">
            <div className="breadcrumb">
              <Link to="/"><i className="fa-solid fa-house" /></Link>
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.65rem' }} />
              <span>Publicaciones</span>
            </div>
            <button className="btn btn-outline-gray btn-sm filter-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="fa-solid fa-sliders" /> Filtros {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          <div className="search-bar">
            <i className="fa-solid fa-magnifying-glass search-bar-icon" />
            <input
              type="text"
              placeholder="Buscá por marca, modelo, versión…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
            <div className="search-divider" />
            <select className="form-input" style={{ border: 'none', background: 'transparent', width: 150, padding: '0 8px', fontSize: '0.88rem' }}>
              <option>Todo el país</option>
              <option>Buenos Aires</option>
              <option>Córdoba</option>
              <option>Rosario</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => fetchListings()}>
              <i className="fa-solid fa-magnifying-glass" /> Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="listings-layout">
          {/* SIDEBAR */}
          <aside className={`filters-sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
            <div className="filters-header">
              <h3><i className="fa-solid fa-sliders" style={{ marginRight: 6, color: 'var(--primary)' }} /> Filtros</h3>
              {activeFilterCount > 0 && (
                <span className="filter-reset" onClick={clearFilters}>Limpiar todo</span>
              )}
            </div>

            {/* Marca */}
            <div className="filter-section">
              <div className="filter-title">Marca <i className="fa-solid fa-chevron-down" /></div>
              <div className="filter-checks">
                {BRANDS.map(b => (
                  <label key={b} className="filter-check">
                    <input type="checkbox" checked={filters.brand === b}
                      onChange={() => setFilter('brand', filters.brand === b ? '' : b)} />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Precio */}
            <div className="filter-section">
              <div className="filter-title">Precio (ARS) <i className="fa-solid fa-chevron-down" /></div>
              <div className="price-range">
                <input type="number" placeholder="Mín" value={filters.priceMin}
                  onChange={e => setFilter('priceMin', e.target.value)} />
                <span>—</span>
                <input type="number" placeholder="Máx" value={filters.priceMax}
                  onChange={e => setFilter('priceMax', e.target.value)} />
              </div>
            </div>

            {/* Año */}
            <div className="filter-section">
              <div className="filter-title">Año <i className="fa-solid fa-chevron-down" /></div>
              <div className="price-range">
                <input type="number" placeholder="Desde" value={filters.yearFrom}
                  onChange={e => setFilter('yearFrom', e.target.value)} />
                <span>—</span>
                <input type="number" placeholder="Hasta" value={filters.yearTo}
                  onChange={e => setFilter('yearTo', e.target.value)} />
              </div>
            </div>

            {/* Combustible */}
            <div className="filter-section">
              <div className="filter-title">Combustible <i className="fa-solid fa-chevron-down" /></div>
              <div className="filter-checks">
                {FUELS.map(f => (
                  <label key={f} className="filter-check">
                    <input type="checkbox" checked={filters.fuel === f}
                      onChange={() => setFilter('fuel', filters.fuel === f ? '' : f)} />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Transmisión */}
            <div className="filter-section">
              <div className="filter-title">Transmisión <i className="fa-solid fa-chevron-down" /></div>
              <div className="filter-checks">
                {TRANSMISSIONS.map(t => (
                  <label key={t} className="filter-check">
                    <input type="checkbox" checked={filters.transmission === t}
                      onChange={() => setFilter('transmission', filters.transmission === t ? '' : t)} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Km */}
            <div className="filter-section">
              <div className="filter-title">Kilómetros <i className="fa-solid fa-chevron-down" /></div>
              <select className="form-input" value={filters.kmMax} onChange={e => setFilter('kmMax', e.target.value)}>
                <option value="">Sin límite</option>
                <option value="20000">Hasta 20.000 km</option>
                <option value="50000">Hasta 50.000 km</option>
                <option value="100000">Hasta 100.000 km</option>
                <option value="150000">Hasta 150.000 km</option>
              </select>
            </div>
          </aside>

          {/* RESULTS */}
          <div>
            <div className="results-header">
              <div className="results-count">
                <strong>{total}</strong> resultados encontrados
              </div>
              <div className="results-controls">
                <select className="sort-select" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
                  <option value="newest">Más recientes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="featured">Destacados</option>
                </select>
                <div className="view-toggle">
                  <button className={`view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} title="Vista grilla">
                    <i className="fa-solid fa-th-large" />
                  </button>
                  <button className={`view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="Vista lista">
                    <i className="fa-solid fa-list" />
                  </button>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="active-filters">
                {filters.brand && <span className="active-filter">{filters.brand} <button onClick={() => setFilter('brand', '')}><i className="fa-solid fa-times" /></button></span>}
                {filters.fuel && <span className="active-filter">{filters.fuel} <button onClick={() => setFilter('fuel', '')}><i className="fa-solid fa-times" /></button></span>}
                {filters.transmission && <span className="active-filter">{filters.transmission} <button onClick={() => setFilter('transmission', '')}><i className="fa-solid fa-times" /></button></span>}
              </div>
            )}

            {loading ? (
              <div className={`results-grid${view === 'list' ? ' list-view' : ''}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="no-results">
                <i className="fa-solid fa-magnifying-glass" />
                <h3>Sin resultados</h3>
                <p>No encontramos vehículos con los filtros seleccionados.</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={clearFilters}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className={`results-grid${view === 'list' ? ' list-view' : ''}`}>
                {listings.map(l => <ListingCard key={l.id} listing={l} />)}
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <i className="fa-solid fa-chevron-left" />
                </button>
                {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  );
                })}
                {totalPages > 7 && <span className="page-btn dots">…</span>}
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
