import { useEffect, useState } from 'react'
import { Check, GitCompareArrows } from 'lucide-react'
import { getCompareProperties, subscribeTools, toggleCompareProperty } from '../lib/marketplaceTools.js'

export function CompareButton({ property }) {
  const [selected, setSelected] = useState(() => getCompareProperties().some(item => item.id === property.id))
  useEffect(() => subscribeTools(() => setSelected(getCompareProperties().some(item => item.id === property.id))), [property.id])
  return <button type="button" className={`compare-toggle ${selected ? 'selected' : ''}`} onClick={() => { const items = toggleCompareProperty(property); setSelected(items.some(item => item.id === property.id)) }} aria-pressed={selected} title="Compare up to four homes">{selected ? <Check size={13} /> : <GitCompareArrows size={13} />}{selected ? 'Added to compare' : 'Compare'}</button>
}
