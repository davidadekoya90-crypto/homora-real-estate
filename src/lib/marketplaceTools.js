const KEY = 'homora.marketplace.tools'
const getState = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } }
const saveState = state => { localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new Event('homora:tools-updated')); return state }
export const subscribeTools = callback => { window.addEventListener('homora:tools-updated', callback); window.addEventListener('storage', callback); return () => { window.removeEventListener('homora:tools-updated', callback); window.removeEventListener('storage', callback) } }
export function rememberProperty(property) { const state = getState(); const recent = state.recent || []; state.recent = [property, ...recent.filter(item => (item.id || item) !== property.id)].slice(0, 8); saveState(state) }
export function getRecentProperties() { return (getState().recent || []).filter(item => typeof item === 'object') }
export function toggleCompareProperty(property) { const state = getState(); const items = state.compare || []; const exists = items.some(item => (item.id || item) === property.id); state.compare = exists ? items.filter(item => (item.id || item) !== property.id) : items.length < 4 ? [...items, property] : items; saveState(state); return state.compare }
export function getCompareProperties() { return (getState().compare || []).filter(item => typeof item === 'object') }
export function saveSearchAlert(search) { const state = getState(); state.alerts = [...(state.alerts || []).filter(item => JSON.stringify(item) !== JSON.stringify(search)), search].slice(-10); saveState(state); return state.alerts }
export function getSearchAlerts() { return getState().alerts || [] }
export function getTheme() { return getState().theme || 'light' }
export function setTheme(theme) { const state = getState(); state.theme = theme; saveState(state); return theme }
