import { ArrowRight, CircleAlert, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Loading({ label = 'Loading' }) { return <div className="status-line"><LoaderCircle className="spinner" size={16} />{label}</div> }
export function Message({ children, kind = 'info' }) { return <div className={`message message-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{kind === 'error' && <CircleAlert size={16} />}{children}</div> }
export function DemoNotice({ children }) { return <div className="demo-notice"><span>DEMO</span>{children || 'This is a browser-only preview. Changes stay on this device and are not shared with real users.'}</div> }
export function BackendNotice({ feature = 'Live listings, accounts, and community posts' }) { return <Message>{feature} are unavailable until Supabase is configured. Add the project URL and public anon key to <code>.env.local</code>, then apply <code>supabase/migrations/001_marketplace.sql</code>.</Message> }
export function EmptyState({ title, body, to = '/properties', link = 'Explore properties' }) { return <div className="empty-state"><span className="empty-mark">H.</span><h3>{title}</h3><p>{body}</p><Link className="text-link" to={to}>{link}<span><ArrowRight size={15} /></span></Link></div> }
