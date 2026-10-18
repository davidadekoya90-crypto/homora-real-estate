import { useEffect, useState } from 'react'
import { ArrowRight, BellPlus, Check, GitCompareArrows, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCompareProperties, getRecentProperties, getSearchAlerts, saveSearchAlert, subscribeTools, toggleCompareProperty } from '../lib/marketplaceTools.js'
import { PropertyCard } from './PropertyCard.jsx'

export function CompareTray() {
  const [items, setItems] = useState(getCompareProperties)
  useEffect(() => subscribeTools(() => setItems(getCompareProperties())), [])
  if (!items.length) return null
  return <div className="compare-tray"><span><GitCompareArrows size={16} /> Compare {items.length} of 4</span><div>{items.slice(0, 4).map(item => <span key={item.id}>{item.title}</span>)}</div><Link className="primary-btn" to="/compare">Compare homes <ArrowRight size={14} /></Link><button aria-label="Clear comparison" onClick={() => { items.forEach(toggleCompareProperty); setItems([]) }}><X size={15} /></button></div>
}

export function RecentProperties({ session }) {
  const [items, setItems] = useState(getRecentProperties)
  useEffect(() => subscribeTools(() => setItems(getRecentProperties())), [])
  if (!items.length) return null
  return <section className="recent-section"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> Pick up where you left off</div><h2>Recently <em>viewed.</em></h2></div></div><div className="property-grid">{items.slice(0, 4).map(property => <PropertyCard key={property.id} property={property} session={session} compact />)}</div></section>
}

export function SaveSearchButton({ search, session }) {
  const signature = JSON.stringify(search)
  const [saved, setSaved] = useState(() => getSearchAlerts().some(item => JSON.stringify(item) === signature))
  useEffect(() => setSaved(getSearchAlerts().some(item => JSON.stringify(item) === signature)), [signature])
  const save = () => {
    if (!session) { window.location.assign('/sign-in'); return }
    saveSearchAlert(search); setSaved(true)
  }
  return <button className={`save-search-btn ${saved ? 'saved' : ''}`} type="button" onClick={save}>{saved ? <Check size={14} /> : <BellPlus size={14} />}{saved ? 'Search saved' : 'Save this search'}</button>
}
