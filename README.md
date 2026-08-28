# Gurdwara Discovery — Prototype V1.3.1

## Pilgrimage Planner

V1.0 turns the My Journey wish list into a usable pilgrimage-planning workflow.

### New
- Choose a starting city from a set of common travel anchors.
- Add optional start/end dates.
- Select which Want to Visit Gurdwaras to include.
- Automatically orders selected Gurdwaras using a nearest-neighbour first-pass route.
- Calculates approximate straight-line distances between stops and a total approximate journey distance.
- Numbered pilgrimage map.
- Detailed itinerary cards with image, location, travel distance, journey status and Sikh significance.
- **Print / Save PDF** using the browser's print dialog.
- **Copy Itinerary** for sharing by email/message.
- Print-specific styling for a clean itinerary.
- Links from itinerary stops back to full Gurdwara profiles.

### Important
Distances are approximate straight-line calculations, not driving routes. Before travel, users must verify transport, borders/visas, accommodation, sarai, accessibility and local visitor information. A future version can integrate real road/transit routing and travel partners.


## V1.0.1 journey-state update
Visited and Want to Visit are now independent states.

A user can:
- mark a Gurdwara as **Visited**,
- also mark the same Gurdwara as **Want to Visit / Visit Again**,
- include previously visited Gurdwaras in a future pilgrimage,
- see combined status as **Visited · Want to Visit Again**.

The pilgrimage planner continues to use the Want to Visit collection, regardless of whether a Gurdwara has already been visited.


## V1.0.2 map upgrade
The schematic India/Pakistan map on My Journey has been replaced with a real OpenStreetMap view.

- Map automatically fits the saved Want to Visit Gurdwaras.
- Gurdwaras are listed immediately below the map with numbered location chips.
- Location chips open the corresponding Gurdwara profile.
- Added Open Full Map.
- The generated pilgrimage itinerary now uses the same real map approach with a numbered route legend.
- Visited and Want to Visit remain independent states.


## V1.0.3 smarter date selection
- When a Start Date is selected, End Date automatically defaults to 7 days later.
- End Date is constrained so it cannot be earlier than Start Date.
- If the user changes Start Date beyond the current End Date, End Date automatically repairs to 7 days later.
- Because the End Date field is pre-populated with the later date, browser date pickers generally open around that later month/date, reducing extra calendar navigation.


## V1.0.4 map-marker fix
The OpenStreetMap iframe could show the real geography but not multiple custom markers. The journey maps now use Leaflet with OpenStreetMap tiles.

- Every Want to Visit Gurdwara appears as a numbered marker.
- The map automatically zooms to fit all selected Gurdwaras.
- Clicking a marker shows the Gurdwara name and location.
- Marker numbers match the list below the map.
- The generated pilgrimage itinerary uses the same numbered-marker map.


## V1.0.5 home-city travel origin
- Starting City now includes **Other / Home City**.
- Choosing Other reveals a free-text Home City field (for example Vancouver, BC, Canada).
- The custom home city appears as the true starting point in the generated itinerary.
- Added a Getting There section for future Flights, Rail Connections, Ground Travel and Accommodation.
- Custom home-city international distance is intentionally not included in the current approximate kilometre calculation because live geocoding/routing has not yet been integrated.


## V1.0.6 departure & arrival gateway planner
- App suggests an arrival gateway based on the beginning of the selected pilgrimage route.
- App suggests a return departure gateway based on the end of the selected route.
- Users can accept the suggestion, choose another supported gateway, or enter their own city/airport.
- Users can specify their outbound departure city/airport and final return destination.
- Generated itinerary shows outbound and return travel legs plus both app suggestions and user overrides.
- Gateway choices are saved with the generated itinerary.
- Prepared the UI for future live airfare, rail, ground travel and accommodation data.


## V1.0.7 airport dropdowns & multi-city
- Departure and final-destination fields now use city/airport dropdowns with IATA airport codes.
- Includes common Canadian, UK, US, Australian, Asian, Middle Eastern and Indian airports.
- Each dropdown includes **Other / Enter my own**.
- Added **Round trip / Multi-city** flight itinerary type.
- Multi-city mode lets users add or remove additional city/airport stops.
- Generated itinerary includes the multi-city sequence.
- Airport codes are preserved in the itinerary display to prepare for later live airfare search.


## V1.3 Explore Gurdwaras
- New **Explore Gurdwaras** entry on the home screen.
- Search by Gurdwara name, city, Guru or region.
- Filter by region/country, associated Guru, Visited, Want to Visit or Discovered.
- Browse all prototype Gurdwaras as visual directory cards.
- Toggle between **List** and **Map** views.
- Explore map uses Leaflet/OpenStreetMap with numbered markers and profile popups.
- Directory cards display location, associated Gurus and personal journey status.
- Gurdwara profiles return naturally to Explore when opened from the directory.

The core app navigation is now Play → Explore → My Journey.


## V1.3 Going Global
Expanded the prototype directory from 20 to 36 Gurdwaras, adding major Sikh heritage and diaspora locations in Pakistan, the United Kingdom, Canada and the United States.

New entries include Nankana Sahib, Kartarpur Sahib, Panja Sahib, Dera Sahib Lahore, Southall, Gravesend, Smethwick, Abbotsford Gur Sikh Temple, Vancouver KDS, Victoria KDS, Stockton, San Jose and additional Canadian/U.S. diaspora institutions.

Historic Guru-era shrines use faith/history significance. Diaspora profiles deliberately emphasize local Sikh history, migration, community development, seva and regional importance rather than inventing Guru connections.

Photo URLs remain Wikimedia Commons prototype references and should be visually/rights verified before a production release.


## V1.3 — 50 Gurdwaras
Directory expanded to 50 locations. The new group broadens the world map beyond India/Pakistan/UK/Canada/US to Singapore, Malaysia, Hong Kong, Australia, Kenya, New Zealand and the UAE, while adding two more regional Indian pilgrimage sites.

The goal is deliberate geographic and historical variety: Guru-era pilgrimage sites, pioneer-era diaspora institutions and contemporary global Sikh community centres. Diaspora entries continue to use local/community significance rather than invented Guru associations.

Prototype Wikimedia photo URLs should be visually verified before production.


## V1.3.1 — GitHub Pages refresh fix

This release adds stronger cache-busting so new deployments are easier to verify.

- Asset URLs now include both the semantic version and a unique build ID.
- Added no-cache meta directives to the page.
- Added a persistent bottom-right build badge showing the exact live version/build.
- Added `build-info.json` so the deployed build can be checked directly.
- The browser should now need only a normal refresh after GitHub Pages finishes deploying.

Current build: `2026-08-27-2030`.
