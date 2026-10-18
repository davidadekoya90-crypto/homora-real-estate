import { useState } from 'react'
import { ArrowRight, Check, MessageCircle, Search, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

const guides = {
  Buyer: { icon: Search, title: 'Find the place that feels right.', steps: ['Search homes by location, price and property type.', 'Open a listing to compare its details and photos.', 'Message the owner directly and keep the conversation in your inbox.'], href: '/properties', action: 'Explore properties' },
  Seller: { icon: Upload, title: 'Share your property with the right people.', steps: ['Create a HOMORA profile in a few moments.', 'Add a clear description, price, location and photos.', 'Interested buyers can view your listing and start a private conversation.'], href: '/sell', action: 'Create a listing' },
  Professional: { icon: MessageCircle, title: 'Build trust around your work.', steps: ['Introduce yourself as an agent or property business.', 'Share useful local knowledge with the community.', 'Respond to property conversations and build relationships.'], href: '/community', action: 'Meet the community' },
}

export function GuideSection() {
  const [role, setRole] = useState('Buyer')
  const guide = guides[role]
  const Icon = guide.icon
  return <section className="guide-section section-pad" data-reveal><div className="guide-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> A quick guided tour</span><h2>HOMORA, at your<br /><em>own pace.</em></h2></div><p>Choose how you’re arriving and follow a simple route through the marketplace.</p></div><div className="guide-card"><nav className="guide-tabs" aria-label="Choose a guided tour">{Object.keys(guides).map(item => <button key={item} className={role === item ? 'active' : ''} onClick={() => setRole(item)}>{item}</button>)}</nav><div className="guide-content"><div className="guide-summary"><span className="guide-icon"><Icon size={20} /></span><h3>{guide.title}</h3><Link className="text-link" to={guide.href}>{guide.action}<span><ArrowRight size={15} /></span></Link></div><ol className="guide-steps">{guide.steps.map((step, index) => <li key={step}><span>{index + 1 < 10 ? `0${index + 1}` : index + 1}</span><p>{step}</p><Check size={15} /></li>)}</ol></div></div></section>
}
