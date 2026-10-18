import { useState } from 'react'
import { ArrowRight, Building2, CircleDollarSign, ImagePlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DemoNotice, Message } from '../components/Status.jsx'
import { createDemoProperty } from '../lib/demoStore.js'
import { getPropertyImages, getPropertyPhotoLocation } from '../lib/content.js'

export function SellPage({ session }) {
  const [form, setForm] = useState({ title: '', description: '', transaction_type: 'buy', property_type: 'house', price: '', city: '', neighborhood: '', bedrooms: '', bathrooms: '', size_sqft: '', images: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async event => {
    event.preventDefault(); if (!session) return
    setSaving(true); setError('')
    const payload = {
      owner_id: session.user.id, title: form.title.trim(), description: form.description.trim(), transaction_type: form.transaction_type,
      property_type: form.property_type, price: Number(form.price), currency: 'GBP', city: form.city.trim(), neighborhood: form.neighborhood.trim() || null,
      bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms), bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
      size_sqft: form.size_sqft === '' ? null : Number(form.size_sqft), image_urls: form.images.split('\n').map(url => url.trim()).filter(url => /^https:\/\/\S+$/.test(url)).slice(0, 5), status: 'pending_review',
    }
    if (!supabase) {
      const property = createDemoProperty({ ...payload, owner: { id: session.user.id, display_name: session.user.user_metadata?.display_name || session.user.email } })
      setSaving(false); navigate(`/properties/${property.id}`); return
    }
    const { data, error: insertError } = await supabase.from('properties').insert(payload).select('id').single()
    if (insertError) { setError('We couldn’t submit this listing. Check the details and try again.'); setSaving(false); return }
    setSaving(false); navigate(`/account?listing=${data.id}`)
  }
  return <div className="route-enter"><section className="sell-hero"><span className="eyebrow eyebrow-light"><span className="eyebrow-line" /> For owners and property professionals</span><h1>Every place has<br />a <em>next chapter.</em></h1><p>Introduce your property to people looking for a place to belong.</p></section>
    <section className="listing-form-section section-pad"><div className="listing-form-intro"><div className="eyebrow"><span className="eyebrow-line" /> Create a listing</div><h2>Start with the <em>details.</em></h2><p>Share an accurate price, useful photos and a thoughtful description so the right people can find it.</p>{!supabase && <DemoNotice>Your demo listing appears immediately in this browser and can be opened from Explore. Real shared listings need a Supabase connection and are reviewed before publication.</DemoNotice>}</div>
      {!session ? <div className="sign-in-callout"><Building2 size={22} /><h3>Sign in to list a property</h3><p>Your listing will be attached to your account so you can manage it as it progresses.</p><Link className="primary-btn" to="/sign-in">Sign in or create an account <ArrowRight size={15} /></Link></div> : <form className="listing-form" onSubmit={submit}><div className="form-row"><label>Listing title<input name="title" value={form.title} onChange={update} required minLength={5} maxLength={120} placeholder="A clear, memorable description" /></label><label>Transaction type<select name="transaction_type" value={form.transaction_type} onChange={update}><option value="buy">For sale</option><option value="rent">For rent</option></select></label></div><div className="form-row"><label>Property category<select name="property_type" value={form.property_type} onChange={update}><option value="house">House</option><option value="apartment">Apartment</option><option value="land">Land</option><option value="commercial">Commercial</option><option value="office">Office</option><option value="shop">Shop</option><option value="other">Other</option></select></label><label>Price in GBP<input name="price" type="number" min="1" step="1" value={form.price} onChange={update} required /></label></div><PhotoCategoryPreview type={form.property_type} /><label>Description<textarea name="description" rows={5} minLength={10} maxLength={8000} value={form.description} onChange={update} required placeholder="Tell people what makes this place special." /></label><div className="form-row"><label>City<input name="city" value={form.city} onChange={update} required /></label><label>Neighbourhood<input name="neighborhood" value={form.neighborhood} onChange={update} /></label></div><div className="form-row form-row-three"><label>Bedrooms<input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={update} /></label><label>Bathrooms<input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={update} /></label><label>Size in sq ft<input name="size_sqft" type="number" min="0" value={form.size_sqft} onChange={update} /></label></div><label><span><ImagePlus size={15} /> Your property photo URLs</span><span className="field-hint">Optional. Add HTTPS image links, one per line. Up to five photos. Example images are not added to the listing.</span><textarea name="images" rows={3} value={form.images} onChange={update} placeholder="https://…" /></label>{error && <Message kind="error">{error}</Message>}<button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Publishing…' : <>{supabase ? 'Submit for review' : 'Publish demo listing'} <ArrowRight size={15} /></>}</button><p className="form-note"><CircleDollarSign size={14} /> Listing does not create a transaction or collect payment.</p></form>}
    </section></div>
}

function PhotoCategoryPreview({ type }) {
  const property = { property_type: type }
  const photos = getPropertyImages(property)
  return <section className="category-photo-preview"><div><strong>8 photo examples for {type.replace('_', ' ')}</strong><span>Regional design inspiration</span></div><div className="category-photo-strip">{photos.map((src, index) => <figure key={`${type}-${index}`}><img src={src} alt={`${type} style inspiration, example ${index + 1}`} loading="lazy" /><figcaption>{getPropertyPhotoLocation(property, index)}</figcaption></figure>)}</div><p>These stock images show different architectural styles. Location names are inspiration labels, not verified photo locations.</p></section>
}
