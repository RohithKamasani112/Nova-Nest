import type { Property } from '../types';
import { CATEGORY_LABELS } from '../utils/propertySearchState';
export function PropertyComparison({ properties, onClear, onOpen }: { properties: Property[]; onClear: () => void; onOpen: (p: Property) => void }) {
  if (!properties.length) return null;
  const rows: [string, (p: Property) => string][] = [
    ['Listing', p => p.title], ['Area', p => p.locality || p.location], ['Type', p => CATEGORY_LABELS[p.category]],
    ['Price', p => `INR ${p.price.toLocaleString('en-IN')}${p.status === 'rent' ? ' / month' : ' total'}`],
    ['BHK', p => ['land', 'condo'].includes(p.category) ? 'Not applicable' : String(p.bedrooms)],
    ['Listed size', p => `${p.areaSqft.toLocaleString('en-IN')} sq ft`],
    ['Carpet area', p => p.carpetArea ? `${p.carpetArea.toLocaleString('en-IN')} sq ft` : 'Ask our team'],
    ['Furnishing', p => p.furnishingStatus || (p.furnished ? 'Fully Furnished' : 'Ask our team')],
    ['Maintenance / month', p => p.maintenanceCharges ? `INR ${p.maintenanceCharges.toLocaleString('en-IN')}` : 'Ask our team'],
    ['Security deposit', p => p.status !== 'rent' ? 'Not applicable' : p.securityDeposit ? `INR ${p.securityDeposit.toLocaleString('en-IN')}` : 'Ask our team'],
  ];
  return <section className="my-6 rounded-2xl border border-gold/30 bg-white p-4 sm:p-6" aria-labelledby="comparison-heading">
    <div className="mb-4 flex items-center justify-between gap-3"><h2 id="comparison-heading" className="font-serif text-2xl text-charcoal">Compare properties ({properties.length}/3)</h2><button type="button" onClick={onClear} className="text-sm underline">Clear comparison</button></div>
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Property comparison table"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr><th className="p-3">Details</th>{properties.map(p => <th key={p.id} className="p-3"><button type="button" onClick={() => onOpen(p)} className="font-semibold text-primary underline">{p.title}</button></th>)}</tr></thead><tbody>{rows.map(([label, format]) => <tr key={label} className="border-t"><th scope="row" className="p-3 font-medium text-gray-500">{label}</th>{properties.map(p => <td key={p.id} className="p-3">{format(p)}</td>)}</tr>)}</tbody></table></div>
    <p className="mt-3 text-xs text-gray-500">Confirm availability and final commercial terms with our team before booking.</p>
  </section>;
}
