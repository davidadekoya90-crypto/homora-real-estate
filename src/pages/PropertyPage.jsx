import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, MapPin, Ruler, Share2, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DemoNotice, EmptyState, Loading, Message } from '../components/Status.jsx'
import { getDemoProperty, listDemoProperties, startDemoConversation } from '../lib/demoStore.js'
import { rememberProperty } from '../lib/marketplaceTools.js'
import { RecentProperties } from '../components/MarketplaceTools.jsx'
import { PropertyCard } from '../components/PropertyCard.jsx'
import { getPropertyImages, getPropertyPhotoLocation } from '../lib/content.js'

export function PropertyPage({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [currentImage, setCurrentImage] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [similar, setSimilar] = useState([])
  useEffect(() => {
    if (!supabase) { setProperty(getDemoProperty(id)); setLoading(false); return }
    let alive = true
    supabase.from('properties').select('*, profiles:profiles!properties_owner_id_fkey(display_name,username,avatar_url,bio)').eq('id', id).maybeSingle().then(({ data, error: err }) => {
      if (!alive) return
      if (err) setError('We couldn’t load this property.'); else setProperty(data)
      setLoading(false)
    })
    return () => { alive = false }
  }, [id])
  useEffect(() => { if (property) rememberProperty(property) }, [property])
  useEffect(() => {
    if (!property) return
    let alive = true
    if (!supabase) { setSimilar(listDemoProperties().filter(item => item.id !== property.id && item.transaction_type === property.transaction_type).slice(0, 3)); return () => { alive = false } }
    supabase.from('properties').select('*').eq('status', 'published').eq('transaction_type', property.transaction_type).eq('property_type', property.property_type).neq('id', property.id).limit(3).then(({ data }) => { if (alive) setSimilar(data || []) })
    return () => { alive = false }
  }, [property])
  const enquire = async () => {
    if (!supabase) {
      const result = startDemoConversation(property, session.user.id)
      if (result.error) setError(result.error)
      else navigate(`/messages?conversation=${result.conversation.id}`)
      return
    }
    setSending(true); setError(''); setNotice('')
    const { data: existing, error: lookupError } = await supabase.from('conversations').select('id').eq('property_id', property.id).eq('buyer_id', session.user.id).maybeSingle()
    if (lookupError) { setError('We couldn’t start a conversation. Please try again.'); setSending(false); return }
    if (existing) { navigate(`/messages?conversation=${existing.id}`); setSending(false); return }
    const { data, error: err } = await supabase.from('conversations').insert({ property_id: property.id, buyer_id: session.user.id, seller_id: property.owner_id }).select('id').single()
    if (err) setError('Your conversation could not be started. Please try again later.')
    else navigate(`/messages?conversation=${data.id}`)
    setSending(false)
  }
  if (loading) return <section className="section-pad"><Loading label="Loading property details" /></section>
  if (error && !property) return <section className="section-pad"><Message kind="error">{error}</Message></section>
  if (!property) return <section className="section-pad"><EmptyState title="This property isn’t available." body="It may have been removed or is no longer published." /></section>
  const images = getPropertyImages(property)
  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency: property.currency || 'GBP', maximumFractionDigits: 0 }).format(property.price)
  return <><article className="property-detail section-pad route-enter"><Link className="back-link" to="/properties"><ArrowLeft size={15} /> Back to properties</Link>{property.is_demo && <DemoNotice>Sample property for the interactive demo. Your enquiries are saved locally in this browser.</DemoNotice>}<div className="detail-top"><div><div className="eyebrow"><span className="eyebrow-line" /> {property.transaction_type === 'rent' ? 'Available to rent' : 'Available to buy'}</div><h1>{property.title}</h1><p><MapPin size={15} /> {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}</p></div><strong className="detail-price">{price}{property.transaction_type === 'rent' ? ' / month' : ''}</strong></div>
    {!property.image_urls?.length && <Message>Illustrative category photos are shown below. The owner has not added property-specific images yet.</Message>}{images.length ? <div className="gallery"><div className="gallery-main"><button className="gallery-open" onClick={() => setLightbox(true)} aria-label="Open photo viewer"><img src={images[currentImage]} alt={`${property.property_type} photo ${currentImage + 1} for ${property.title}`} /></button>{!property.image_urls?.length && <span className="gallery-inspiration">Visual inspiration · {getPropertyPhotoLocation(property, currentImage)} · stock photo</span>}{images.length > 1 && <div className="gallery-controls"><button onClick={() => setCurrentImage((currentImage + images.length - 1) % images.length)} aria-label="Previous photo"><ArrowLeft /></button><span>{currentImage + 1} / {images.length}</span><button onClick={() => setCurrentImage((currentImage + 1) % images.length)} aria-label="Next photo"><ArrowRight /></button></div>}</div><div className="gallery-thumbs">{images.map((image, index) => <button className={index === currentImage ? 'selected' : ''} key={image} onClick={() => setCurrentImage(index)} aria-label={!property.image_urls?.length ? `Show inspiration photo ${index + 1}, ${getPropertyPhotoLocation(property, index)}` : `Show photo ${index + 1}`}><img src={image} alt="" /></button>)}</div></div> : <div className="gallery-empty">The owner hasn’t added property photos yet.</div>}
    <div className="detail-columns"><div><div className="spec-row">{property.bedrooms != null && <span><BedDouble size={18} />{property.bedrooms} bedrooms</span>}{property.bathrooms != null && <span><Bath size={18} />{property.bathrooms} bathrooms</span>}{property.size_sqft != null && <span><Ruler size={18} />{property.size_sqft.toLocaleString()} sq ft</span>}</div><h2>About this place</h2><p className="detail-description">{property.description || 'The owner has not added a description yet.'}</p><h2>Property details</h2><dl className="details-list"><div><dt>Property type</dt><dd>{property.property_type}</dd></div><div><dt>Listing status</dt><dd>{property.status}</dd></div><div><dt>Listed</dt><dd>{new Date(property.created_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}</dd></div></dl></div><aside className="owner-card"><span className="owner-avatar">{property.profiles?.display_name?.[0] || property.owner?.display_name?.[0] || 'H'}</span><span className="eyebrow">LISTED BY</span><h3>{property.profiles?.display_name || property.owner?.display_name || 'HOMORA member'}</h3>{(property.profiles?.username || property.owner?.username) && <p>@{property.profiles?.username || property.owner?.username}</p>}{session ? <button className="primary-btn" onClick={enquire} disabled={sending}>{sending ? 'Opening…' : 'Message about this property'}</button> : <Link className="primary-btn" to="/sign-in">Sign in to message</Link>}{notice && <Message>{notice}</Message>}{error && <Message kind="error">{error}</Message>}<button className="share-btn" onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => setNotice('Property link copied.'))}><Share2 size={14} /> Share listing</button></aside></div>
  </article>{lightbox && <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="Property photo viewer" onClick={() => setLightbox(false)}><button className="lightbox-close" aria-label="Close photo viewer"><X /></button><button className="lightbox-prev" aria-label="Previous photo" onClick={event => { event.stopPropagation(); setCurrentImage((currentImage + images.length - 1) % images.length) }}><ArrowLeft /></button><img src={images[currentImage]} alt={`${property.title} photo ${currentImage + 1}`} onClick={event => event.stopPropagation()} /><button className="lightbox-next" aria-label="Next photo" onClick={event => { event.stopPropagation(); setCurrentImage((currentImage + 1) % images.length) }}><ArrowRight /></button><span>{currentImage + 1} / {images.length}</span></div>}{similar.length > 0 && <section className="similar-section section-pad"><div className="eyebrow"><span className="eyebrow-line" /> More to consider</div><h2>Similar <em>places.</em></h2><div className="property-grid">{similar.map(item => <PropertyCard key={item.id} property={item} session={session} />)}</div></section>}<PropertyFinancialTools property={property} /><RecentProperties session={session} /></>
}

function PropertyFinancialTools({ property }) {
  const [deposit, setDeposit] = useState(20)
  const [rate, setRate] = useState(5)
  const [years, setYears] = useState(25)
  const [rent, setRent] = useState(2400)
  const [budget, setBudget] = useState(4000)
  const price = Number(property.price) || 0
  const principal = price * (1 - deposit / 100)
  const monthlyRate = rate / 1200
  const months = years * 12
  const payment = monthlyRate ? principal * monthlyRate / (1 - (1 + monthlyRate) ** -months) : principal / months
  const yieldValue = price > 0 ? rent * 12 / price * 100 : 0
  const rentShare = budget > 0 ? price / budget * 100 : 0
  const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: property.currency || 'GBP', maximumFractionDigits: 0 }).format(value)
  return <section className="finance-tools section-pad"><div><span className="eyebrow"><span className="eyebrow-line" /> Plan your numbers</span><h2>Explore the <em>estimates.</em></h2><p>Illustrative only. Adjust the figures to fit your situation; these are not a quote or financial advice.</p></div><div className="finance-grid">{property.transaction_type === 'rent' ? <section className="finance-card"><h3>Rent budget check</h3><label>Your monthly housing budget<input type="number" min="1" value={budget} onChange={event => setBudget(Number(event.target.value))} /></label><div className="finance-result"><span>This listing’s rent is {rentShare.toFixed(0)}% of your budget</span><b>{money(price)} / month</b><small>Utilities, council tax, deposits and other costs are not included.</small></div></section> : <><section className="finance-card"><h3>Mortgage estimate</h3><label>Deposit <strong>{deposit}%</strong><input type="range" min="5" max="60" step="1" value={deposit} onChange={event => setDeposit(Number(event.target.value))} /></label><label>Interest rate <strong>{rate.toFixed(1)}%</strong><input type="range" min="1" max="12" step="0.1" value={rate} onChange={event => setRate(Number(event.target.value))} /></label><label>Term <strong>{years} years</strong><input type="range" min="5" max="40" step="1" value={years} onChange={event => setYears(Number(event.target.value))} /></label><div className="finance-result"><span>Estimated monthly payment</span><b>{money(payment)}</b><small>Loan estimate {money(principal)}. Fees and rate changes are not included.</small></div></section><section className="finance-card"><h3>Rental yield estimate</h3><label>Expected monthly rent<input type="number" min="0" value={rent} onChange={event => setRent(Number(event.target.value))} /></label><div className="finance-result"><span>Gross annual yield</span><b>{yieldValue.toFixed(1)}%</b><small>Based on asking price and the rent you entered. Costs and vacancy are not included.</small></div></section></>}</div></section>
}
