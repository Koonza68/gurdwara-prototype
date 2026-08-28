# Gurdwara Discovery — Prototype V1.0.3

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
