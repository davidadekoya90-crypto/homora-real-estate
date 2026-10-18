const KEYS = {
  users: 'homora.demo.users',
  session: 'homora.demo.session',
  properties: 'homora.demo.properties',
  favorites: 'homora.demo.favorites',
  conversations: 'homora.demo.conversations',
  messages: 'homora.demo.messages',
  profile: 'homora.demo.profile',
}

export const demoPeople = [
  { id: 'demo-buyer', display_name: 'Taylor Morgan', username: 'taylormorgan', email: 'buyer@homora.demo', role: 'buyer', bio: 'Looking for a thoughtful home and a good local coffee shop.' },
  { id: 'demo-seller', display_name: 'Alex Property', username: 'alexproperty', email: 'seller@homora.demo', role: 'seller', bio: 'Independent property owner sharing good places with good people.' },
]

export const sampleProperties = [
  { id: 'sample-london-home', owner_id: 'demo-seller', title: 'A quiet corner of Notting Hill', description: 'A light-filled three bedroom home on a leafy residential street. Original proportions, calm interiors and a small west-facing garden make this a considered city retreat.', transaction_type: 'buy', property_type: 'house', price: 1250000, currency: 'GBP', city: 'London', neighborhood: 'Notting Hill', bedrooms: 3, bathrooms: 2, size_sqft: 1840, image_urls: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'], status: 'published', created_at: '2026-10-17T10:00:00.000Z', is_demo: true, owner: demoPeople[1] },
  { id: 'sample-bristol-apartment', owner_id: 'demo-seller', title: 'Clifton light, with room to grow', description: 'A generous four bedroom home with tall sash windows, a warm timber kitchen and an easy connection to the neighbourhood. Shared as an example HOMORA listing.', transaction_type: 'buy', property_type: 'apartment', price: 785000, currency: 'GBP', city: 'Bristol', neighborhood: 'Clifton', bedrooms: 4, bathrooms: 3, size_sqft: 2210, image_urls: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=82'], status: 'published', created_at: '2026-10-16T10:00:00.000Z', is_demo: true, owner: demoPeople[1] },
  { id: 'sample-cotswolds-cottage', owner_id: 'demo-seller', title: 'A Cotswolds cottage for slower days', description: 'A five bedroom country home with garden views, generous gathering spaces and the kind of quiet that makes weekends last a little longer.', transaction_type: 'rent', property_type: 'house', price: 3200, currency: 'GBP', city: 'Gloucestershire', neighborhood: 'The Cotswolds', bedrooms: 5, bathrooms: 4, size_sqft: 3500, image_urls: ['https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=82'], status: 'published', created_at: '2026-10-15T10:00:00.000Z', is_demo: true, owner: demoPeople[1] },
]

function read(key, fallback) {
  try { const value = localStorage.getItem(KEYS[key]); return value ? JSON.parse(value) : fallback } catch { return fallback }
}
function write(key, value) {
  localStorage.setItem(KEYS[key], JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('homora:demo-updated', { detail: key }))
  return value
}
export function onDemoUpdate(callback) {
  const listener = event => callback(event.detail)
  window.addEventListener('homora:demo-updated', listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener('homora:demo-updated', listener); window.removeEventListener('storage', listener) }
}
export function getDemoSession() { return read('session', null) }
export function setDemoSession(person) {
  const session = person ? { user: { id: person.id, email: person.email, user_metadata: { display_name: person.display_name, role: person.role }, app_metadata: { demo: true } } } : null
  if (session) localStorage.setItem(KEYS.session, JSON.stringify(session)); else localStorage.removeItem(KEYS.session)
  window.dispatchEvent(new CustomEvent('homora:demo-session', { detail: session }))
  return session
}
export function onDemoSession(callback) {
  const listener = event => callback(event.detail)
  window.addEventListener('homora:demo-session', listener)
  return () => window.removeEventListener('homora:demo-session', listener)
}
export function createDemoAccount(name, email) {
  const users = read('users', [])
  if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) return { error: 'A demo account already uses that email. Sign in with it instead.' }
  const user = { id: crypto.randomUUID(), display_name: name.trim(), email: email.trim().toLowerCase(), username: null, role: 'buyer', bio: '', city: '' }
  write('users', [...users, user])
  setDemoSession(user)
  return { user }
}
export function findDemoAccount(email) {
  return [...demoPeople, ...read('users', [])].find(user => user.email.toLowerCase() === email.trim().toLowerCase()) || null
}
export function listDemoProperties() { return [...read('properties', []), ...sampleProperties] }
export function getDemoProperty(id) { return listDemoProperties().find(property => property.id === id) || null }
export function createDemoProperty(property) {
  const next = { ...property, id: crypto.randomUUID(), status: 'published', created_at: new Date().toISOString(), is_demo: true }
  write('properties', [next, ...read('properties', [])])
  return next
}
export function listDemoFavorites(userId) { return read('favorites', []).filter(favorite => favorite.user_id === userId).map(favorite => getDemoProperty(favorite.property_id)).filter(Boolean) }
export function toggleDemoFavorite(propertyId, userId) {
  const favorites = read('favorites', [])
  const exists = favorites.some(item => item.property_id === propertyId && item.user_id === userId)
  write('favorites', exists ? favorites.filter(item => !(item.property_id === propertyId && item.user_id === userId)) : [...favorites, { property_id: propertyId, user_id: userId }])
  return !exists
}
export function isDemoFavorite(propertyId, userId) { return read('favorites', []).some(item => item.property_id === propertyId && item.user_id === userId) }
export function startDemoConversation(property, buyerId) {
  if (property.owner_id === buyerId) return { error: 'You are viewing your own listing.' }
  const conversations = read('conversations', [])
  const existing = conversations.find(item => item.property_id === property.id && item.buyer_id === buyerId)
  if (existing) return { conversation: existing }
  const conversation = { id: crypto.randomUUID(), property_id: property.id, buyer_id: buyerId, seller_id: property.owner_id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  write('conversations', [conversation, ...conversations])
  return { conversation }
}
export function listDemoConversations(userId) {
  const messages = read('messages', [])
  return read('conversations', []).filter(item => item.buyer_id === userId || item.seller_id === userId).map(conversation => ({ ...conversation, property: getDemoProperty(conversation.property_id), messages: messages.filter(message => message.conversation_id === conversation.id).sort((a,b) => a.created_at.localeCompare(b.created_at)) })).sort((a,b) => b.updated_at.localeCompare(a.updated_at))
}
export function sendDemoMessage(conversationId, senderId, body) {
  const message = { id: crypto.randomUUID(), conversation_id: conversationId, sender_id: senderId, body: body.trim(), created_at: new Date().toISOString() }
  write('messages', [...read('messages', []), message])
  const conversations = read('conversations', []).map(item => item.id === conversationId ? { ...item, updated_at: message.created_at } : item)
  write('conversations', conversations)
  return message
}
export function getDemoProfile(userId) {
  return [...demoPeople, ...read('users', [])].find(person => person.id === userId) || null
}
export function updateDemoProfile(userId, changes) {
  const people = read('users', [])
  const updated = people.map(person => person.id === userId ? { ...person, ...changes } : person)
  write('users', updated)
  const current = getDemoSession()
  if (current?.user.id === userId) setDemoSession(updated.find(person => person.id === userId))
  return updated.find(person => person.id === userId) || getDemoProfile(userId)
}

export function listDemoPosts() {
  const saved = read('posts', [])
  const sample = { id: 'demo-post-welcome', caption: 'Welcome to the HOMORA demo. Ask a question, share a local recommendation, or start a conversation about a property that catches your eye.', created_at: '2026-10-18T10:00:00.000Z', author_id: 'demo-seller', likes: [], comments: [], demo_sample: true }
  return [...saved, ...(saved.some(post => post.id === sample.id) ? [] : [sample])].map(post => ({ ...post, profiles: getDemoProfile(post.author_id) || demoPeople[1], likes: post.likes || [], comments: post.comments || [] })).sort((a,b) => b.created_at.localeCompare(a.created_at))
}
export function createDemoPost(authorId, caption, mediaUrl) {
  const post = { id: crypto.randomUUID(), author_id: authorId, caption: caption.trim(), media_url: mediaUrl || null, created_at: new Date().toISOString(), likes: [], comments: [] }
  write('posts', [post, ...read('posts', [])]); return post
}
export function toggleDemoPostLike(postId, userId) {
  const posts = read('posts', [])
  if (!posts.some(post => post.id === postId) && postId === 'demo-post-welcome') posts.push({ id: postId, caption: 'Welcome to the HOMORA demo. Ask a question, share a local recommendation, or start a conversation about a property that catches your eye.', created_at: '2026-10-18T10:00:00.000Z', author_id: 'demo-seller', likes: [], comments: [], demo_sample: true })
  const next = posts.map(post => post.id !== postId ? post : { ...post, likes: post.likes.some(like => like.user_id === userId) ? post.likes.filter(like => like.user_id !== userId) : [...post.likes, { user_id: userId }] })
  write('posts', next)
}
export function addDemoPostComment(postId, userId, body) {
  const posts = read('posts', [])
  if (!posts.some(post => post.id === postId) && postId === 'demo-post-welcome') posts.push({ id: postId, caption: 'Welcome to the HOMORA demo. Ask a question, share a local recommendation, or start a conversation about a property that catches your eye.', created_at: '2026-10-18T10:00:00.000Z', author_id: 'demo-seller', likes: [], comments: [], demo_sample: true })
  write('posts', posts.map(post => post.id === postId ? { ...post, comments: [...post.comments, { id: crypto.randomUUID(), author_id: userId, body: body.trim(), created_at: new Date().toISOString(), profiles: getDemoProfile(userId) }] } : post))
}
