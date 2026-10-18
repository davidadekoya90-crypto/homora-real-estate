import { useEffect, useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCompareProperties, subscribeTools, toggleCompareProperty } from '../lib/marketplaceTools.js'
import { EmptyState } from '../components/Status.jsx'
import { getPropertyImages } from '../lib/content.js'

export function ComparePage() {
  const [items, setItems] = useState(getCompareProperties)
  useEffect(() => subscribeTools(() => setItems(getCompareProperties())), [])
  if (!items.length) return <section className="section-pad"><EmptyState title="Choose a few homes to compare." body="Select Compare on property cards to see their key details side by side." to="/properties" link="Explore properties" /></section>
  const rows = [['Price', item => `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: item.currency || 'GBP', maximumFractionDigits: 0 }).format(item.price)}${item.transaction_type === 'rent' ? ' / month' : ''}`], ['Location', item => `${item.neighborhood ? `${item.neighborhood}, ` : ''}${item.city}`], ['Type', item => item.property_type], ['Bedrooms', item => item.bedrooms ?? '—'], ['Bathrooms', item => item.bathrooms ?? '—'], ['Size', item => item.size_sqft ? `${item.size_sqft.toLocaleString()} sq ft` : '—'], ['Listing', item => item.transaction_type === 'rent' ? 'For rent' : 'For sale']]
  return <section className="compare-page section-pad route-enter"><Link className="back-link" to="/properties"><ArrowLeft size={15} /> Back to search</Link><div className="eyebrow"><span className="eyebrow-line" /> Make a considered choice</div><h1>Compare the <em>details.</em></h1><p className="compare-intro">Review up to four properties side by side. Demo comparisons are stored in this browser.</p><div className="compare-table-wrap"><table className="compare-table"><thead><tr><th>Property</th>{items.map(item => <th key={item.id}><Link to={`/properties/${item.id}`}><img src={getPropertyImages(item)[0]} alt={`${item.property_type || 'Property'}: ${item.title}`} /><strong>{item.title}</strong></Link><button onClick={() => toggleCompareProperty(item)} aria-label={`Remove ${item.title}`}><X size={14} /></button></th>)}</tr></thead><tbody>{rows.map(([label, value]) => <tr key={label}><th>{label}</th>{items.map(item => <td key={item.id}>{value(item)}</td>)}</tr>)}</tbody></table></div></section>
}
