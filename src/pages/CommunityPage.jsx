import { useCallback, useEffect, useState } from 'react'
import { Heart, MessageCircle, Send, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { DemoNotice, EmptyState, Loading, Message } from '../components/Status.jsx'
import { addDemoPostComment, createDemoPost, listDemoPosts, onDemoUpdate, toggleDemoPostLike } from '../lib/demoStore.js'

export function CommunityPage({ session }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const loadPosts = useCallback(async () => {
    if (!supabase) { setPosts(listDemoPosts()); setLoading(false); return }
    const { data, error: queryError } = await supabase.from('posts').select('id,caption,media_url,created_at,profiles:profiles!posts_author_id_fkey(display_name,username,avatar_url),likes(user_id),comments(id,body,created_at,author_id,profiles:profiles!comments_author_id_fkey(display_name))').eq('status', 'published').order('created_at', { ascending: false }).limit(40)
    if (queryError) setError('We couldn’t load the community feed.')
    else setPosts(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { loadPosts(); if (!supabase) return onDemoUpdate(loadPosts) }, [loadPosts])
  const publish = async e => {
    e.preventDefault(); setError(''); setNotice('')
    if (!session) { setError('Sign in to share with the community.'); return }
    if (!supabase) { createDemoPost(session.user.id, caption, mediaUrl); setCaption(''); setMediaUrl(''); setNotice('Your demo post is visible in this browser.'); return }
    const { error: insertError } = await supabase.from('posts').insert({ author_id: session.user.id, caption: caption.trim(), media_url: mediaUrl.trim() || null, status: 'pending_review' })
    if (insertError) setError('Your post could not be submitted. Check the details and try again.')
    else { setCaption(''); setMediaUrl(''); setNotice('Your post was submitted for community review.'); }
  }
  return <section className="community-page section-pad route-enter"><div className="community-intro"><div><div className="eyebrow"><span className="eyebrow-line" /> HOMORA community</div><h1>Places bring us<br /><em>together.</em></h1></div><p>Stories, questions, and places shared by people who know that home is about more than four walls.</p></div>
    {!supabase && <DemoNotice>Interactive demo feed: posts, likes and comments are saved in this browser. Switch sample profiles from your account to preview both sides.</DemoNotice>}{supabase && !session && <Message>Join the community to publish posts and save your favourite places. <Link to="/sign-in">Sign in or create an account</Link>.</Message>}
    {session && <form className="post-composer" onSubmit={publish}><span className="composer-avatar">{session.user.email?.[0]?.toUpperCase() || 'H'}</span><div className="composer-fields"><label className="sr-only" htmlFor="post-caption">Share a story with the community</label><textarea id="post-caption" maxLength={1800} rows={2} required value={caption} onChange={e => setCaption(e.target.value)} placeholder="Share a home, a question, or a good local find…" /><input type="url" aria-label="Post image or video URL" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Optional photo or video URL" /><button className="primary-btn" type="submit"><Send size={14} /> {supabase ? 'Submit post' : 'Publish demo post'}</button></div></form>}
    {notice && <Message>{notice}</Message>}{error && <Message kind="error">{error}</Message>}
    <div className="feed-layout"><div className="feed-list">{loading ? <Loading label="Loading community stories" /> : posts.length ? posts.map(post => <CommunityPost key={post.id} post={post} session={session} refresh={loadPosts} onError={setError} />) : !supabase ? null : <EmptyState title="The feed is taking shape." body="No approved community posts have been shared yet. Be the first to introduce yourself." to="/sign-in" link="Create an account" />}</div><aside className="feed-aside"><span className="eyebrow">A good place to begin</span><h2>What’s happening<br /><em>around home?</em></h2><p>Share a property journey, ask a local question, or introduce your work to people looking for a place like yours.</p><div className="feed-aside-rule" /><small>Posts from real HOMORA members. New accounts may need a review before their first post appears.</small></aside></div>
  </section>
}

function CommunityPost({ post, session, refresh, onError }) {
  const [comment, setComment] = useState('')
  const liked = Boolean(session && post.likes?.some(like => like.user_id === session.user.id))
  const toggleLike = async () => {
    if (!session) { onError('Sign in to like a post.'); return }
    if (!supabase) { toggleDemoPostLike(post.id, session.user.id); return }
    const response = liked
      ? await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', session.user.id)
      : await supabase.from('likes').insert({ post_id: post.id, user_id: session.user.id })
    if (response.error) onError('That like could not be saved.')
    else refresh()
  }
  const addComment = async event => {
    event.preventDefault()
    if (!session) { onError('Sign in to comment on a post.'); return }
    if (!supabase) { addDemoPostComment(post.id, session.user.id, comment); setComment(''); return }
    const { error } = await supabase.from('comments').insert({ post_id: post.id, author_id: session.user.id, body: comment.trim() })
    if (error) onError('That comment could not be saved.')
    else { setComment(''); refresh() }
  }
  return <article className="feed-post"><div className="post-head"><span className="post-avatar">{post.profiles?.display_name?.[0] || 'H'}</span><div><strong>{post.profiles?.display_name || 'HOMORA member'}</strong><small>{post.profiles?.username ? `@${post.profiles.username} · ` : ''}{new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</small></div><button type="button" className="follow-button" disabled title="Following is coming in a later phase"><UserRoundPlus size={15} /> Follow</button></div><p className="post-caption">{post.caption}</p>{post.media_url && <img className="post-media" src={post.media_url} alt="Photo shared by a HOMORA community member" loading="lazy" />}<div className="post-actions"><button onClick={toggleLike} aria-label={liked ? 'Unlike post' : 'Like post'}><Heart size={17} fill={liked ? 'currentColor' : 'none'} />{post.likes?.length || 0}</button><span><MessageCircle size={16} />{post.comments?.length || 0}</span></div>{post.comments?.slice(0, 4).map(item => <p className="post-comment" key={item.id}><strong>{item.profiles?.display_name || 'Member'}</strong> {item.body}</p>)}{session ? <form className="comment-form" onSubmit={addComment}><input aria-label="Write a comment" maxLength={1200} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a thoughtful comment…" required /><button aria-label="Send comment"><Send size={14} /></button></form> : <Link className="comment-sign-in" to="/sign-in">Sign in to join the conversation</Link>}</article>
}
