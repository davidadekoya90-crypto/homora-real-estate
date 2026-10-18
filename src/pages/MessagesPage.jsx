import { useCallback, useEffect, useState } from 'react'
import { ArrowUpRight, MessageCircle, Send } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DemoNotice, EmptyState, Loading, Message } from '../components/Status.jsx'
import { listDemoConversations, getDemoProfile, onDemoUpdate, sendDemoMessage } from '../lib/demoStore.js'
import { getPropertyImages } from '../lib/content.js'

export function MessagesPage({ session }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('conversation')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    if (!supabase) { setItems(listDemoConversations(session.user.id)); setLoading(false); return }
    const { data, error: queryError } = await supabase.from('conversations').select('id,property_id,buyer_id,seller_id,updated_at,property:properties(id,title,city,image_urls),buyer:profiles!conversations_buyer_id_fkey(id,display_name),seller:profiles!conversations_seller_id_fkey(id,display_name)').or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`).order('updated_at', { ascending: false })
    if (queryError) setError('Messages could not be loaded. Apply the messaging migration and try again.')
    else {
      const conversations = data || []
      const results = await Promise.all(conversations.map(async item => {
        const result = await supabase.from('messages').select('id,sender_id,body,created_at').eq('conversation_id', item.id).order('created_at')
        return { ...item, messages: result.data || [] }
      }))
      setItems(results)
    }
    setLoading(false)
  }, [session.user.id])
  useEffect(() => { refresh(); if (!supabase) return onDemoUpdate(refresh) }, [refresh])
  const active = items.find(item => item.id === selectedId) || items[0]
  useEffect(() => { if (!selectedId && active) setSearchParams({ conversation: active.id }, { replace: true }) }, [active, selectedId, setSearchParams])
  useEffect(() => {
    if (!supabase || !active) return
    const channel = supabase.channel(`messages-${active.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active.id}` }, refresh).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [active?.id, refresh])
  const send = async event => {
    event.preventDefault(); if (!active || !body.trim()) return
    setError('')
    if (!supabase) sendDemoMessage(active.id, session.user.id, body)
    else {
      const { error: sendError } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body: body.trim() })
      if (sendError) { setError('Your message could not be sent.'); return }
      await refresh()
    }
    setBody('')
  }
  const other = active && (supabase ? (active.buyer_id === session.user.id ? active.seller : active.buyer) : getDemoProfile(active.buyer_id === session.user.id ? active.seller_id : active.buyer_id))
  return <section className="messages-page section-pad route-enter"><div className="eyebrow"><span className="eyebrow-line" /> HOMORA inbox</div><h1>Good conversations<br /><em>move things forward.</em></h1>{!supabase && <DemoNotice>Demo messages are stored only in this browser. Switch demo profiles from your account to preview the other side.</DemoNotice>}{error && <Message kind="error">{error}</Message>}{loading ? <Loading label="Loading your inbox" /> : <div className="inbox"><aside className="inbox-list"><h2><MessageCircle size={17} /> Conversations</h2>{items.map(item => { const person = supabase ? (item.buyer_id === session.user.id ? item.seller : item.buyer) : getDemoProfile(item.buyer_id === session.user.id ? item.seller_id : item.buyer_id); const isActive = item.id === active?.id; const last = item.messages?.at(-1); return <button className={`conversation-row ${isActive ? 'is-active' : ''}`} key={item.id} onClick={() => setSearchParams({ conversation: item.id })}><strong>{person?.display_name || 'HOMORA member'}</strong><span>{item.property?.title || 'Property enquiry'}</span><small>{last?.body || 'Start a conversation'}</small></button> })}{!items.length && <p className="inbox-empty">When you message about a property, your conversation will appear here.</p>}</aside>{active ? <div className="chat-panel"><div className="chat-heading"><div><strong>{other?.display_name || 'HOMORA member'}</strong><span>About <Link to={`/properties/${active.property_id}`}>{active.property?.title || 'a property'} <ArrowUpRight size={12} /></Link></span></div><span className="chat-property-image">{active.property && <img src={getPropertyImages(active.property)[0]} alt="" />}</span></div><div className="chat-messages">{active.messages?.length ? active.messages.map(message => <div key={message.id} className={`chat-bubble ${message.sender_id === session.user.id ? 'mine' : ''}`}><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>) : <div className="chat-welcome"><MessageCircle size={22} /><p>Introduce yourself and ask a question about this property.</p></div>}</div><form className="chat-compose" onSubmit={send}><label className="sr-only" htmlFor="message-body">Write a message</label><textarea id="message-body" rows="2" maxLength="4000" value={body} onChange={event => setBody(event.target.value)} placeholder="Write a message…" required /><button className="primary-btn" aria-label="Send message"><Send size={15} /> Send</button></form></div> : <div className="chat-panel inbox-placeholder"><EmptyState title="Your inbox is ready." body="Open a property and message its owner to start your first conversation." to="/properties" link="Explore properties" /></div>}</div>}</section>
}
