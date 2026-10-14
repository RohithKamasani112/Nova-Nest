// The sales team shares one login (owner's request — not individual
// per-person accounts). After signing in, whoever's on that device picks
// "who I am" from the agent roster, or "all leads" — stored per-device so
// two people signed into the same shared account on their own phones each
// see their own choice. See SalesHomePage.tsx / SalesLeadsPage.tsx.
export const SALES_VIEW_AGENT_KEY = 'sales_view_agent_id'; // 'all' | an agents.id
export const SALES_VIEW_AGENT_NAME_KEY = 'sales_view_agent_name'; // cached label, avoids a re-fetch just to show it

export function clearSalesView(): void {
  localStorage.removeItem(SALES_VIEW_AGENT_KEY);
  localStorage.removeItem(SALES_VIEW_AGENT_NAME_KEY);
}
