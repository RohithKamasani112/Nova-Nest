export const CANONICAL_FIELD_OPTIONS: { value: string; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'phone_raw', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'lead_date', label: 'Lead date' },
  { value: 'listing_type', label: 'Listing type (rent/sale)' },
  { value: 'property_type', label: 'Property type' },
  { value: 'configuration', label: 'Configuration (BHK)' },
  { value: 'price_raw', label: 'Price / budget' },
  { value: 'city', label: 'City' },
  { value: 'locality', label: 'Locality' },
  { value: 'state', label: 'State' },
  { value: 'project_name', label: 'Project name' },
  { value: 'external_property_id', label: 'Property / listing ID' },
  { value: 'address', label: 'Address' },
  { value: 'source_status', label: "Portal's own status" },
  { value: 'notes', label: 'Notes' },
  { value: 'property_description', label: 'Property description' },
  { value: 'lead_type', label: 'Lead type (domestic/NRI)' },
  { value: 'message', label: 'Message' },
  { value: 'agent_name', label: 'Agent' },
];

export function canonicalFieldLabel(value: string | null): string {
  if (!value) return 'Unmapped — stored as extra data';
  return CANONICAL_FIELD_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
