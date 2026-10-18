import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Heart, LogOut, MessageCircle, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { BackendNotice, Loading, Message } from '../components/Status.jsx'
import { createDemoAccount, demoPeople, findDemoAccount, getDemoProfile, listDemoFavorites, listDemoProperties, setDemoSession, updateDemoProfile } from '../lib/demoStore.js'

export function AccountPage({ session }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(Boolean(session && supabase))
  const [newPassword, setNewPassword] = useState('')
  const isRecovery = window.location.hash.includes('type=recovery')
  useEffect(() => {
    if (!session || !supabase) return
    let alive = true
    Promise.all([
      supabase.from('profiles').select('display_name,username,bio,city,role').eq('id', session.user.id).maybeSingle(),
      supabase.from('properties').select('id,title,city,status,transaction_type,price,currency,created_at').eq('owner_id', session.user.id).order('created_at', { ascending: false }),
    ]).then(([profileResult, listingResult]) => {
      if (!alive) return
      if (!profileResult.error) setProfile(profileResult.data)
      if (!listingResult.error) setListings(listingResult.data || [])
      setLoading(false)
    })
    return () => { alive = false }
  }, [session])
  const handleAuth = async e => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    let result
    if (mode === 'sign-up') result = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: name.trim() } } })
    else if (mode === 'recover') result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/account` })
    else result = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (result.error) setError(result.error.message)
    else if (mode === 'sign-up' && !result.data.session) setNotice('Check your email to verify your address. You can sign in after verification.')
    else if (mode === 'recover') setNotice('If an account uses that address, a password reset link is on its way.')
    else if (mode === 'sign-in') navigate('/account')
    setBusy(false)
  }
  const updatePassword = async e => {
    e.preventDefault(); setBusy(true); setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) setError(updateError.message); else { setNotice('Your password has been updated.'); window.history.replaceState(null, '', '/account') }
    setBusy(false)
  }
  const saveProfile = async e => {
    e.preventDefault(); setError(''); setNotice('')
    const form = new FormData(e.currentTarget)
    const changes = { id: session.user.id, display_name: String(form.get('display_name')).trim(), username: String(form.get('username')).trim() || null, bio: String(form.get('bio')).trim() || null, city: String(form.get('city')).trim() || null, role: String(form.get('role')) }
    const { error: updateError } = await supabase.from('profiles').upsert(changes)
    if (updateError) setError(updateError.code === '23505' ? 'That username is already taken.' : 'Your profile could not be updated.')
    else { setProfile(changes); setNotice('Your profile has been updated.') }
  }
  if (!supabase) return <DemoAccountPage session={session} />
  if (isRecovery && session) return <section className="section-pad auth-page route-enter"><form className="auth-card" onSubmit={updatePassword}><span className="eyebrow"><span className="eyebrow-line" /> Account security</span><h1>Choose a new<br /><em>password.</em></h1><label>New password<input type="password" minLength={8} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>{error && <Message kind="error">{error}</Message>}{notice && <Message>{notice}</Message>}<button className="primary-btn" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button></form></section>
  if (!session) return <section className="section-pad auth-page route-enter"><form className="auth-card" onSubmit={handleAuth}><span className="eyebrow"><span className="eyebrow-line" /> HOMORA membership</span><h1>{mode === 'sign-up' ? <>Make room for<br /><em>what’s next.</em></> : mode === 'recover' ? <>Let’s get you<br /><em>back in.</em></> : <>Your next move,<br /><em>starts here.</em></>}</h1><p>{mode === 'sign-up' ? 'Create an account to publish listings and join the community.' : 'Sign in to manage your properties, profile, and conversations.'}</p>{mode === 'sign-up' && <label>Your name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required /></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>{mode !== 'recover' && <label>Password<input type="password" minLength={8} autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required /></label>}{mode === 'sign-in' && <button className="forgot-link" type="button" onClick={() => { setMode('recover'); setNotice(''); setError('') }}>Forgot your password?</button>}{error && <Message kind="error">{error}</Message>}{notice && <Message>{notice}</Message>}<button className="primary-btn auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : mode === 'recover' ? 'Send reset link' : 'Sign in'} <ArrowUpRight size={15} /></button><p className="auth-switch">{mode === 'sign-up' ? 'Already have an account?' : 'New to HOMORA?'} <button type="button" onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setNotice(''); setError('') }}>{mode === 'sign-up' ? 'Sign in' : 'Create account'}</button></p></form></section>
  if (loading) return <section className="section-pad"><Loading label="Loading your account" /></section>
  return <section className="account-page section-pad route-enter"><div className="account-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Your HOMORA</span><h1>Good to see you, <em>{profile?.display_name?.split(' ')[0] || 'there'}.</em></h1><p>Manage your profile and keep an eye on your listings.</p></div><button className="logout-button" onClick={async () => { await supabase.auth.signOut(); navigate('/') }}><LogOut size={15} /> Sign out</button></div><div className="dashboard-grid"><form className="profile-card" onSubmit={saveProfile}><div className="dashboard-card-heading"><UserRound size={17} /><h2>Your profile</h2></div><label>Name<input name="display_name" defaultValue={profile?.display_name || session.user.user_metadata?.display_name || ''} required maxLength={80} /></label><label>Username<input name="username" defaultValue={profile?.username || ''} maxLength={30} placeholder="your-name" /></label><label>About you<textarea name="bio" rows={3} defaultValue={profile?.bio || ''} maxLength={500} /></label><label>Location<input name="city" defaultValue={profile?.city || ''} /></label><label>How you use HOMORA<select name="role" defaultValue={profile?.role || 'buyer'}><option value="buyer">I’m looking to buy</option><option value="seller">I’m selling or letting</option><option value="agent">I’m an agent</option><option value="business">I’m a property business</option></select></label>{error && <Message kind="error">{error}</Message>}{notice && <Message>{notice}</Message>}<button className="primary-btn"><Check size={15} /> Save profile</button></form><div className="dashboard-right"><section className="dashboard-panel"><div className="dashboard-card-heading"><Building2Icon /><h2>Your listings</h2><Link to="/sell">Add a property <ArrowUpRight size={13} /></Link></div>{listings.length ? <div className="listing-rows">{listings.map(listing => <div key={listing.id}><div><strong>{listing.title}</strong><small>{listing.city} · {listing.transaction_type === 'rent' ? 'Rent' : 'Sale'}</small></div><span className={`status-pill status-${listing.status}`}>{listing.status.replace('_', ' ')}</span></div>)}</div> : <div className="dashboard-empty"><p>You haven’t added a property yet.</p><Link to="/sell">Create your first listing <ArrowUpRight size={13} /></Link></div>}</section><section className="dashboard-panel dashboard-shortcuts"><div className="dashboard-card-heading"><Heart size={17} /><h2>Your next steps</h2></div><Link to="/properties">Discover properties <ArrowUpRight size={14} /></Link><Link to="/community"><MessageCircle size={15} /> Join the community <ArrowUpRight size={14} /></Link><p>Message property owners and buyers from your HOMORA inbox.</p></section></div></div></section>
}

function Building2Icon() { return <span className="small-building" aria-hidden="true">⌂</span> }

function DemoAccountPage({ session }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  if (!session) {
    const submit = event => {
      event.preventDefault(); setError(''); setNotice('')
      if (mode === 'sign-up') {
        const result = createDemoAccount(name, email)
        if (result.error) setError(result.error)
        else setNotice('Your local demo account is ready. It is saved in this browser only.')
      } else {
        const person = findDemoAccount(email)
        if (!person) setError('No local account uses that email. Create a demo account first.')
        else setDemoSession(person)
      }
    }
    return <section className="section-pad auth-page route-enter"><form className="auth-card" onSubmit={submit}><span className="eyebrow"><span className="eyebrow-line" /> Interactive demo mode</span><h1>Try HOMORA<br /><em>for yourself.</em></h1><div className="demo-banner"><strong>Browser-only demo</strong><span>Profiles, listings, favourites, and messages stay in this browser. This demo does not provide secure accounts or share content with other people.</span></div>{mode === 'sign-up' && <label>Your name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} required /></label>}<label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={mode === 'sign-in' ? 'buyer@homora.demo' : 'you@example.com'} /></label>{error && <Message kind="error">{error}</Message>}{notice && <Message>{notice}</Message>}<button className="primary-btn auth-submit">{mode === 'sign-up' ? 'Create local demo account' : 'Continue in demo mode'} <ArrowUpRight size={15} /></button><p className="auth-switch">{mode === 'sign-up' ? 'Already tried the demo?' : 'Want your own profile?'} <button type="button" onClick={() => { setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up'); setError(''); setNotice('') }}>{mode === 'sign-up' ? 'Sign in' : 'Create account'}</button></p><div className="demo-personas"><span>Preview an example profile</span>{demoPeople.map(person => <button type="button" key={person.id} onClick={() => setDemoSession(person)}><span>{person.role === 'buyer' ? 'Buyer' : 'Seller'}</span><strong>{person.display_name}</strong><ArrowUpRight size={13} /></button>)}</div></form></section>
  }
  const person = getDemoProfile(session.user.id) || { id: session.user.id, display_name: session.user.user_metadata.display_name, email: session.user.email, role: 'buyer' }
  const listings = listDemoProperties().filter(property => property.owner_id === session.user.id)
  const saved = listDemoFavorites(session.user.id)
  const save = event => {
    event.preventDefault(); const fields = new FormData(event.currentTarget)
    updateDemoProfile(session.user.id, { display_name: String(fields.get('display_name')).trim(), username: String(fields.get('username')).trim(), bio: String(fields.get('bio')).trim(), city: String(fields.get('city')).trim(), role: String(fields.get('role')) })
    setNotice('Your demo profile was updated in this browser.')
  }
  return <section className="account-page section-pad route-enter"><div className="demo-banner demo-banner-wide"><strong>Interactive demo account</strong><span>Changes are stored locally in this browser. Create a real shared account by configuring Supabase.</span></div><div className="account-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Your demo HOMORA</span><h1>Good to see you, <em>{person.display_name?.split(' ')[0] || 'there'}.</em></h1><p>{person.email} · Browser demo profile</p></div><div className="account-quick-actions"><Link className="header-cta" to="/messages">Open messages</Link><button className="logout-button" onClick={() => { setDemoSession(null); navigate('/') }}><LogOut size={15} /> Sign out</button></div></div><div className="dashboard-grid"><form className="profile-card" onSubmit={save}><div className="dashboard-card-heading"><UserRound size={17} /><h2>Your profile</h2></div><label>Name<input name="display_name" defaultValue={person.display_name} required maxLength={80} /></label><label>Username<input name="username" defaultValue={person.username || ''} maxLength={30} /></label><label>About you<textarea name="bio" rows={3} defaultValue={person.bio || ''} maxLength={500} /></label><label>Location<input name="city" defaultValue={person.city || ''} /></label><label>How you use HOMORA<select name="role" defaultValue={person.role || 'buyer'}><option value="buyer">I’m looking to buy</option><option value="seller">I’m selling or letting</option><option value="agent">I’m an agent</option><option value="business">I’m a property business</option></select></label>{notice && <Message>{notice}</Message>}<button className="primary-btn"><Check size={15} /> Save demo profile</button></form><div className="dashboard-right"><section className="dashboard-panel"><div className="dashboard-card-heading"><Building2Icon /><h2>Your demo listings</h2><Link to="/sell">Add a property <ArrowUpRight size={13} /></Link></div>{listings.length ? <div className="listing-rows">{listings.map(listing => <div key={listing.id}><div><strong><Link to={`/properties/${listing.id}`}>{listing.title}</Link></strong><small>{listing.city}</small></div><span className="status-pill status-published">Demo live</span></div>)}</div> : <div className="dashboard-empty"><p>You haven’t shared a property from this profile yet.</p><Link to="/sell">Create your first listing <ArrowUpRight size={13} /></Link></div>}</section><section className="dashboard-panel"><div className="dashboard-card-heading"><Heart size={17} /><h2>Saved properties</h2></div>{saved.length ? <div className="listing-rows">{saved.map(property => <div key={property.id}><div><strong><Link to={`/properties/${property.id}`}>{property.title}</Link></strong><small>{property.city}</small></div></div>)}</div> : <div className="dashboard-empty"><p>Save places you want to come back to.</p><Link to="/properties">Explore homes <ArrowUpRight size={13} /></Link></div>}</section><section className="dashboard-panel dashboard-shortcuts"><div className="dashboard-card-heading"><MessageCircle size={17} /><h2>Switch demo view</h2></div>{demoPeople.filter(candidate => candidate.id !== session.user.id).map(candidate => <button className="persona-switch" key={candidate.id} onClick={() => setDemoSession(candidate)}>Preview as {candidate.role}: {candidate.display_name} <ArrowUpRight size={13} /></button>)}</section></div></div></section>
}
