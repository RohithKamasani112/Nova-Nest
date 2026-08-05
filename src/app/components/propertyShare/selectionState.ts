import { Property } from '../../../types';

export interface SelectionState {
  selected: Map<string, Property>;
  order: string[]; // tray order — decoupled from Map iteration order
}

export const EMPTY_SELECTION: SelectionState = { selected: new Map(), order: [] };

// Pure, framework-free state transitions — the part of "selection survives
// a filter change" that actually matters is that these functions never
// look at "what's currently filtered/visible"; they only ever add/remove
// the one property (or list of properties) they're explicitly told to.
// Unit-tested directly (no React needed) against the exact filter-switch
// scenario in the acceptance criteria.
export function toggleSelection(state: SelectionState, property: Property): SelectionState {
  const next = new Map(state.selected);
  if (next.has(property.id)) {
    next.delete(property.id);
    return { selected: next, order: state.order.filter((id) => id !== property.id) };
  }
  next.set(property.id, property);
  return { selected: next, order: [...state.order, property.id] };
}

export function selectAll(state: SelectionState, properties: Property[]): SelectionState {
  const next = new Map(state.selected);
  const existingIds = new Set(state.order);
  const additions: string[] = [];
  for (const p of properties) {
    if (!next.has(p.id)) additions.push(p.id);
    next.set(p.id, p);
    existingIds.add(p.id);
  }
  return { selected: next, order: [...state.order, ...additions] };
}

export function removeFromSelection(state: SelectionState, id: string): SelectionState {
  const next = new Map(state.selected);
  next.delete(id);
  return { selected: next, order: state.order.filter((x) => x !== id) };
}

export function reorderSelection(state: SelectionState, nextOrder: string[]): SelectionState {
  return { selected: state.selected, order: nextOrder };
}

export function clearSelection(): SelectionState {
  return EMPTY_SELECTION;
}
