import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Building2, MapPin, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { editorialPhotos, photo } from '../lib/content.js'
import { DemoNotice, EmptyState, Loading, Message } from '../components/Status.jsx'
import { PropertyCard } from '../components/PropertyCard.jsx'
import { GuideSection } from '../components/GuideSection.jsx'
import { PropertyTypeShowcase } from '../components/PropertyTypeShowcase.jsx'
import { listDemoProperties, onDemoUpdate } from '../lib/demoStore.js'

export function HomePage({ session }) {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('buy')
  const [propertyType, setPropertyType] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    if (!supabase) {
      setProperties(listDemoProperties().slice(0, 3)); setLoading(false)
      return onDemoUpdate(key => { if (key === 'properties') setProperties(listDemoProperties().slice(0, 3)) })
    }
    let alive = true
    supabase.from('properties').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(3)
      .then(({ data, error }) => { if (!alive) return; if (error) setLoadError('Featured listings could not be loaded. Please try again shortly.'); else setProperties(data || []); setLoading(false) })
    return () => { alive = false }
  }, [])
  const search = e => { e.preventDefault(); const params = new URLSearchParams({ mode }); if (query.trim()) params.set('location', query.trim()); if (propertyType) params.set('type', propertyType); navigate(`/properties?${params}`) }
  return <div className="route-enter">
    <section className="hero" id="top"><img className="hero-backdrop" src={photo(editorialPhotos.hero, 1400)} srcSet={`${photo(editorialPhotos.hero, 800)} 800w, ${photo(editorialPhotos.hero, 1400)} 1400w, ${photo(editorialPhotos.hero, 2200)} 2200w`} sizes="100vw" alt="Sunlit, architect-designed home surrounded by greenery" /><div className="hero-scrim" />
      <div className="hero-copy"><div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> A place for what comes next</div><h1>Find a place.<br /><em>Discover a possibility.</em></h1><p>Thoughtful homes, good people, and the connections that make a move feel right.</p><div className="hero-actions"><Link className="hero-primary" to="/properties">Explore properties <ArrowUpRight size={16} /></Link><Link className="hero-secondary" to="/sell">List your property <ArrowRight size={15} /></Link></div></div>
      <div className="hero-caption"><span>ARCHITECTURE, WITH ROOM TO LIVE</span><span>01 / HOMORA COLLECTION</span></div>
      <div className="hero-search-wrap"><form className="search-panel" onSubmit={search}><div className="search-tabs">{[['buy','Buy'],['rent','Rent']].map(([key,label]) => <button key={key} type="button" className={mode === key ? 'active' : ''} onClick={() => setMode(key)}>{label}</button>)}<span className="sell-tab">Sell <Link to="/sell" aria-label="Start selling">↗</Link></span></div><div className="search-fields"><label className="location-field"><span>WHERE DO YOU WANT TO BE?</span><div><MapPin size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="City, neighbourhood, or postcode" aria-label="Location" /></div></label><label className="select-field"><span>PROPERTY TYPE</span><div><Building2 size={17} /><select value={propertyType} onChange={e => setPropertyType(e.target.value)} aria-label="Property type"><option value="">Any property</option><option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option></select></div></label><button className="search-submit" type="submit"><Search size={17} /> Find a place <ArrowRight size={16} /></button></div><div className="search-foot"><span>Homes with honest details and real people behind them.</span><Link to="/properties">Advanced search <ArrowRight size={13} /></Link></div></form></div>
      <a className="scroll-cue" href="#featured">SCROLL TO DISCOVER <ArrowDown size={13} /></a>
    </section>
    <section className="homes-section section-pad" id="featured"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> The HOMORA edit</div><h2>Places with<br /><em>a point of view.</em></h2></div><div className="heading-aside"><p>Homes worth a closer look. Explore current listings shared by members of the HOMORA community.</p><Link className="text-link" to="/properties">Explore all properties <span><ArrowRight size={15} /></span></Link></div></div>
      {!supabase && <DemoNotice>Sample listings are labelled DEMO. New listings you add in this preview are stored in this browser only.</DemoNotice>}{loading ? <Loading label="Finding the latest listings" /> : loadError ? <Message kind="error">{loadError}</Message> : properties.length ? <div className="property-grid">{properties.map(p => <PropertyCard key={p.id} property={p} session={session} />)}</div> : <EmptyState title="A little quiet, for now." body="There are no published listings yet. When members share their homes, they’ll appear here." />}
      <div className="market-trust"><span><ShieldCheck size={16} /> Member-published listings</span><span><UsersRound size={16} /> Local people, direct connections</span><Link to="/community">Meet the community <ArrowUpRight size={14} /></Link></div>
    </section>
    <GuideSection />
    <PropertyTypeShowcase />
    <section className="editorial-section" data-reveal><div className="editorial-image"><img src={photo(editorialPhotos.garden, 1500)} alt="A peaceful country home opening onto its garden" loading="lazy" /><span>HOMES, AND THE LIFE AROUND THEM</span></div><div className="editorial-copy"><div className="eyebrow"><span className="eyebrow-line" /> The place behind the place</div><h2>Good moves<br />start with <em>good people.</em></h2><p>HOMORA brings buyers, sellers, agents, and property businesses into one considered space. Discover a home, ask a real question, and get to know the people who can help you take the next step.</p><Link className="primary-btn" to="/community">Meet the community <ArrowRight size={15} /></Link><span className="editorial-index">01 / A MORE HUMAN MARKETPLACE</span></div></section>
    <section className="cta-band" data-reveal><div><span className="eyebrow eyebrow-light"><span className="eyebrow-line" /> For owners and professionals</span><h2>Have a place to share?</h2><p>Introduce your property or business to a community looking for what you do.</p></div><Link className="hero-primary" to="/sell">Start a listing <ArrowUpRight size={16} /></Link></section>
  </div>
}
