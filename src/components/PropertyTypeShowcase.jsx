import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPropertyImages, getPropertyPhotoLocation } from '../lib/content.js'

const categories = [
  ['house', 'Houses', 'Room for the life you’re building.'],
  ['apartment', 'Apartments', 'Considered city living.'],
  ['land', 'Land', 'A blank canvas with possibility.'],
  ['commercial', 'Commercial', 'Space for the next big idea.'],
  ['office', 'Offices', 'Places for good work to happen.'],
  ['shop', 'Shops', 'Find a home for your business.'],
  ['other', 'Something different', 'Explore unique property opportunities.'],
]

export function PropertyTypeShowcase() {
  return <section className="property-types section-pad" data-reveal><div className="property-types-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Explore by property type</span><h2>Find space for<br /><em>what’s next.</em></h2></div><p>From a first apartment to commercial spaces and open land, discover places in markets across the world.</p></div><div className="property-type-grid">{categories.map(([type, label, description]) => { const property = { property_type: type }; const image = getPropertyImages(property)[0]; return <Link className={`property-type-card type-${type}`} to={`/properties?mode=buy&type=${type}`} key={type}><img src={image} alt={`${label} architecture inspiration`} loading="lazy" /><span className="property-type-scrim" /><span className="property-type-copy"><small>{type.toUpperCase()} · INSPIRATION FROM {getPropertyPhotoLocation(property).toUpperCase()}</small><strong>{label}</strong><span>{description}</span></span><span className="property-type-arrow"><ArrowUpRight size={17} /></span></Link> })}</div><p className="property-types-note">Stock imagery and regional labels offer visual inspiration. They don’t indicate a listing’s exact location or replace owner supplied property photographs.</p></section>
}
