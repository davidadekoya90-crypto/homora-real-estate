import { useEffect, useState } from 'react'
import { ArrowUpDown, MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { PropertyCard } from '../components/PropertyCard.jsx'
import { CompareTray, RecentProperties, SaveSearchButton } from '../components/MarketplaceTools.jsx'
import { DemoNotice, EmptyState, Loading, Message } from '../components/Status.jsx'
import { listDemoProperties, onDemoUpdate } from '../lib/demoStore.js'

export function ExplorePage({ session }) {
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState({ location: params.get('location') || '', mode: params.get('mode') || 'buy', type: params.get('type') || '', min: '', max: '', beds: '', baths: '', area: '', sort: 'newest' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  useEffect(() => setFilters(current => ({ ...current, location: params.get('location') || '', mode: params.get('mode') || 'buy', type: params.get('type') || '' })), [params])
  useEffect(() => {
    if (!supabase) {
      const refresh = () => {
        let results = listDemoProperties().filter(property => property.status === 'published' && property.transaction_type === filters.mode)
        if (filters.location.trim()) results = results.filter(property => `${property.city} ${property.neighborhood || ''} ${property.title}`.toLowerCase().includes(filters.location.trim().toLowerCase()))
        if (filters.type) results = results.filter(property => property.property_type === filters.type)
        if (filters.min) results = results.filter(property => property.price >= Number(filters.min))
        if (filters.max) results = results.filter(property => property.price <= Number(filters.max))
        if (filters.beds) results = results.filter(property => (property.bedrooms || 0) >= Number(filters.beds))
        if (filters.baths) results = results.filter(property => (property.bathrooms || 0) >= Number(filters.baths))
        if (filters.area) results = results.filter(property => (property.size_sqft || 0) >= Number(filters.area))
        if (filters.sort === 'price-low') results.sort((a, b) => a.price - b.price)
        else if (filters.sort === 'price-high') results.sort((a, b) => b.price - a.price)
        else results.sort((a, b) => b.created_at.localeCompare(a.created_at))
        setItems(results); setLoading(false)
      }
      refresh(); return onDemoUpdate(key => { if (key === 'properties') refresh() })
    }
    let alive = true
    setLoading(true); setError('')
    let request = supabase.from('properties').select('*').eq('status', 'published').eq('transaction_type', filters.mode)
    if (filters.location.trim()) { const safeLocation = filters.location.trim().replace(/[,()%]/g, ' '); request = request.or(`city.ilike.%${safeLocation}%,neighborhood.ilike.%${safeLocation}%,title.ilike.%${safeLocation}%`) }
    if (filters.type) request = request.eq('property_type', filters.type)
    if (filters.min) request = request.gte('price', Number(filters.min))
    if (filters.max) request = request.lte('price', Number(filters.max))
    if (filters.beds) request = request.gte('bedrooms', Number(filters.beds))
    if (filters.baths) request = request.gte('bathrooms', Number(filters.baths))
    if (filters.area) request = request.gte('size_sqft', Number(filters.area))
    const order = filters.sort === 'price-low' ? ['price', true] : filters.sort === 'price-high' ? ['price', false] : ['created_at', false]
    request.order(order[0], { ascending: order[1] }).limit(60).then(({ data, error: queryError }) => { if (!alive) return; if (queryError) setError('We couldn’t load these properties. Please try again.'); else setItems(data || []); setLoading(false) })
    return () => { alive = false }
  }, [filters])
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value }))
  const submit = event => { event.preventDefault(); setParams({ ...(filters.location ? { location: filters.location } : {}), ...(filters.type ? { type: filters.type } : {}), mode: filters.mode }) }
  return <section className="explore-page section-pad route-enter"><div className="eyebrow"><span className="eyebrow-line" /> HOMORA marketplace</div><div className="explore-title-row"><div><h1>Find your <em>next place.</em></h1><p>Explore property listings shared by members of the HOMORA community.</p></div><label className="sort-select"><ArrowUpDown size={15} /><select aria-label="Sort properties" value={filters.sort} onChange={event => update('sort', event.target.value)}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label></div>
    <div className="explore-layout"><aside className="filter-panel"><h2><SlidersHorizontal size={16} /> Refine your search</h2><form onSubmit={submit}><label>Looking to<select value={filters.mode} onChange={event => update('mode', event.target.value)}><option value="buy">Buy</option><option value="rent">Rent</option></select></label><label>Location<span className="input-with-icon"><MapPin size={15} /><input value={filters.location} onChange={event => update('location', event.target.value)} placeholder="City or neighbourhood" /></span></label><label>Property type<select value={filters.type} onChange={event => update('type', event.target.value)}><option value="">Any type</option>{['house','apartment','land','commercial','office','shop','other'].map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}</select></label><div className="filter-pair"><label>Price from<input type="number" min="0" value={filters.min} onChange={event => update('min', event.target.value)} placeholder="No minimum" /></label><label>Price to<input type="number" min="0" value={filters.max} onChange={event => update('max', event.target.value)} placeholder="No maximum" /></label></div><div className="filter-pair"><label>Bedrooms<select value={filters.beds} onChange={event => update('beds', event.target.value)}><option value="">Any</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}</select></label><label>Bathrooms<select value={filters.baths} onChange={event => update('baths', event.target.value)}><option value="">Any</option>{[1,2,3,4].map(n => <option key={n} value={n}>{n}+</option>)}</select></label></div><label>Minimum size<input type="number" min="0" value={filters.area} onChange={event => update('area', event.target.value)} placeholder="Square feet" /></label><button className="primary-btn" type="submit"><Search size={15} /> Apply filters</button></form></aside><div className="explore-results"><div className="results-count"><span>{loading ? 'Looking for homes…' : `${items.length} ${items.length === 1 ? 'property' : 'properties'}`}{filters.location && <span> near {filters.location}</span>}</span><SaveSearchButton session={session} search={{ location: filters.location, mode: filters.mode, type: filters.type, min: filters.min, max: filters.max, beds: filters.beds, baths: filters.baths, area: filters.area }} /></div>{!supabase && <DemoNotice>Search results and saved searches stay in this browser. Alerts are saved preferences; automatic email and push delivery needs a live service.</DemoNotice>}{loading ? <Loading label="Finding properties" /> : supabase && error ? <Message kind="error">{error}</Message> : items.length ? <div className="property-grid">{items.map(item => <PropertyCard key={item.id} property={item} session={session} />)}</div> : <EmptyState title="No matches just yet." body="Try changing your location or opening up the filters. New listings appear here when they’re published." to="/sell" link="List a property" />}<RecentProperties session={session} /></div></div><CompareTray /></section>
}
