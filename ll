These are the chnages i need for the propety card whnr i open propety i shoe see than
please make sure to enhave for mobile respconsie as well..
like for thisis only when i opent peiot i giues all the webreo steylin colou foekr will remaib the same
we are chnagiu how the propety detial looks when we opne the propety 
Context: My current property detail page content is too narrow — it's centered in a fixed-width column with large empty space on both sides, making the page feel unbalanced and like it's not using the screen properly. Rebuild this page using the full available width, following the structure below.

0. Layout / Width Fix (Important — fix this first)

The page content must use the full width of the viewport, with only small, consistent side padding/margins (e.g., 24–48px on desktop), not large empty cream gutters like the current version.
Use a two-column layout: main content column (~65–70% width) on the left, sticky sidebar (~30–35% width) on the right — similar proportion to what's shown in my reference screenshots.
On smaller/tablet screens, the sidebar should stack below the main content instead of leaving empty space beside it.
Remove any max-width container that's currently constraining the page to a narrow centered block — the content area should stretch edge-to-edge (minus padding) across the full browser width.


1. Header Section

Property title in bold
Status badges below/beside title (pill-style: "Apartment", "For Rent", "Featured" — reuse existing badge data)
Full address with a location pin icon
Large bold price (e.g., "₹45,000/month")
Small "BROKERAGE" info pill if applicable (keep if this data exists, hide if not)

2. Image Gallery

Thumbnail strip layout (like current site) OR large+stacked layout — use large image + thumbnail row, full width of the main content column
If fewer than expected images exist, collapse gracefully — no empty placeholder boxes

3. Property Overview Section (grid layout)

Small icon cards in a row: Bedrooms, Bathrooms, Area, Type, etc.
Icon container 32×32px, icon itself 16×16px
Only show fields that have actual data — skip any field showing "0" or empty (e.g., don't show "0 Sqft" if area wasn't entered — hide that card entirely)

4. Tab Navigation
Tabs: Overview | Locality | Amenities | Summary | Similar Homes Nearby

No "Legal Report" tab

5. Description Section

Short 2–4 line plain-text summary, compact spacing
Hide entirely if no description exists

6. Locality Section (Nearby Places)

Full-width embedded map inside the main content column
Horizontally scrollable category cards below: Hospitals, Schools & Colleges, Malls & Shops
Each shows up to 3 places with name (fetched directly from Google Places API), distance in km, travel time in mins
Hide empty categories; hide the whole section if no places saved (but still show map if location exists)

7. Amenities Section

Icon + label grid, circular icon background 48×48px / icon 20×20px
Hide entirely if none saved

8. Summary Section

Collapsible "About Home" table — Ask Price, Facing, Floor, Areas, Furnishing, Bedrooms, Bathrooms
Skip rows with missing data


9. Sidebar (sticky, right column, ~30–35% width)

Dark background price card at top: large price + full address text (matches current site style)
Contact Owner button (solid dark)
Schedule Visit button (outlined)
Agent/advisor card: avatar, name, "Verified Property Team" subtext
Call Agent button (outlined)
WhatsApp button (solid green, WhatsApp icon)
Share button (outlined)
Remove any "Visualize Your Future Home" / AI Interior card if present


10. Icon Sizing Rules (apply throughout)

Overview grid icons: 16×16px inside 32×32px container
Amenities icons: 20×20px inside 48×48px circular container
Nearby places category icons: 16–18px inline with text
Sidebar button icons: 16×16px inline with button text
No icon anywhere should exceed 24×24px
Use one consistent icon library (e.g., Lucide React) with explicit size set on every icon — never leave default sizing

11. General Rule (site-wide)
Any section or field with missing/empty data must be completely hidden — never show blank cards, "0" values, "N/A," or empty placeholder boxes.
12. Admin Panel Requirement
When editing an existing property:

Admin must be able to add Amenities even if none exist yet
Admin must be able to run "Scan Property" (nearby places) even on properties created before this feature existed
Both should pre-fill existing values and allow adding more, saving via the existing update flow