import { useEffect, useState } from 'react'
import { ArrowUpRight, BedDouble, Heart, MapPin } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { getPropertyImages, getPropertyPhotoLocation } from '../lib/content.js'
import { isDemoFavorite, onDemoUpdate, toggleDemoFavorite } from '../lib/demoStore.js'
import { CompareButton } from './CompareButton.jsx'

export function PropertyCard({ property, session }) {
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const navigate = useNavigate()
  const image = getPropertyImages(property)[0]
  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency: property.currency || 'GBP', maximumFractionDigits: 0 }).format(property.price)
  useEffect(() => {
    if (!session) return
    if (!supabase) {
      setSaved(isDemoFavorite(property.id, session.user.id))
      return onDemoUpdate(() => setSaved(isDemoFavorite(property.id, session.user.id)))
    }
    supabase.from('favorites').select('property_id').eq('property_id', property.id).eq('user_id', session.user.id).maybeSingle().then(({ data }) => setSaved(Boolean(data)))
  }, [property.id, session])
  const toggleSave = async () => {
    if (!session) { navigate('/sign-in'); return }
    setSaveError(false)
    if (!supabase) { setSaved(toggleDemoFavorite(property.id, session.user.id)); return }
    const result = saved
      ? await supabase.from('favorites').delete().eq('property_id', property.id).eq('user_id', session.user.id)
      : await supabase.from('favorites').insert({ property_id: property.id, user_id: session.user.id })
    if (result.error) setSaveError(true)
    else setSaved(!saved)
  }
  return <article className="property-card" data-reveal>
    <Link to={`/properties/${property.id}`} className="property-image"><img src={image} alt={`${property.property_type || 'Property'}: ${property.title}`} loading="lazy" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = getPropertyImages({ ...property, image_urls: [] })[0] }} />{!property.image_urls?.length && <span className="property-tag illustrative-tag">INSPIRATION · {getPropertyPhotoLocation(property)}</span>}{property.is_demo && <span className="property-tag demo-tag" style={{ top: property.image_urls?.length ? 12 : 42 }}>DEMO LISTING</span>}<span className="property-tag" style={{ top: (property.is_demo ? 42 : 12) + (!property.image_urls?.length ? 30 : 0) }}>{property.transaction_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}</span><span className="image-arrow"><ArrowUpRight size={19} /></span></Link>
    <div className="property-info"><div><p className="property-place"><MapPin size={13} />{property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}</p><Link className="property-title" to={`/properties/${property.id}`}>{property.title}</Link></div><button className={saved ? 'heart-btn is-saved' : 'heart-btn'} type="button" onClick={toggleSave} title={saveError ? 'Could not save this property' : saved ? 'Remove from saved properties' : 'Save this property'} aria-label={saved ? 'Remove from saved properties' : 'Save this property'}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>
    <div className="property-meta">{property.bedrooms != null && <span><BedDouble size={15} />{property.bedrooms} beds</span>}{property.size_sqft != null && <span>{property.size_sqft.toLocaleString()} sq ft</span>}<b>{price}{property.transaction_type === 'rent' ? ' / mo' : ''}</b></div><CompareButton property={property} />
  </article>
}
