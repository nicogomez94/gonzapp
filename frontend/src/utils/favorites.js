export const FAVORITES_CHANGED = 'autozona:favorites-changed';

export function getFavoriteIds() {
  try {
    const ids = JSON.parse(localStorage.getItem('favorites') || '[]');
    return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavoriteIds().includes(Number(id));
}

export function setFavoriteIds(ids) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Boolean))];
  localStorage.setItem('favorites', JSON.stringify(uniqueIds));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED, { detail: uniqueIds }));
  return uniqueIds;
}

export function toggleFavorite(id) {
  const listingId = Number(id);
  const ids = getFavoriteIds();
  const exists = ids.includes(listingId);
  const nextIds = exists ? ids.filter(x => x !== listingId) : [...ids, listingId];
  setFavoriteIds(nextIds);
  return !exists;
}

export function removeFavorite(id) {
  setFavoriteIds(getFavoriteIds().filter(x => x !== Number(id)));
}
