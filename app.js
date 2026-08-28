const app = document.getElementById('app');
const data = window.GURDWARAS;
const TOTAL_ROUNDS = 10;

let state = {
  screen:'home', rounds:[], roundIndex:0, score:0, streak:0, bestStreak:0,
  attempt:1, hints:[], disabledIds:new Set(), correctCount:0, answeredCount:0
};

const discovered = new Set(JSON.parse(localStorage.getItem('gurdwara_discovered') || '[]'));
const visited = new Set(JSON.parse(localStorage.getItem('gurdwara_visited') || '[]'));
const wantToVisit = new Set(JSON.parse(localStorage.getItem('gurdwara_want_to_visit') || '[]'));

const GURU_INFO = {
  "Guru Nanak": {order:1, years:"1469–1539", summary:"Founder of the Sikh faith. His teachings emphasized devotion to one God, equality, honest living, sharing and service."},
  "Guru Angad": {order:2, years:"1504–1552", summary:"The second Sikh Guru, remembered for developing and promoting the Gurmukhi script and strengthening Sikh institutions."},
  "Guru Amar Das": {order:3, years:"1479–1574", summary:"The third Sikh Guru. Goindwal became an important Sikh centre during his Guruship, and he strongly promoted equality, sangat and langar."},
  "Guru Ram Das": {order:4, years:"1534–1581", summary:"The fourth Sikh Guru and founder of the settlement that developed into Amritsar. He began work connected with the sacred pool at the future Harmandir Sahib."},
  "Guru Arjan": {order:5, years:"1563–1606", summary:"The fifth Sikh Guru. He oversaw the building of Harmandir Sahib and compiled the Adi Granth, which was installed there in 1604."},
  "Guru Hargobind": {order:6, years:"1595–1644", summary:"The sixth Sikh Guru, associated with the principle of Miri-Piri and the establishment of the Akal Takht."},
  "Guru Har Rai": {order:7, years:"1630–1661", summary:"The seventh Sikh Guru, remembered for compassion, service and stewardship while maintaining the Sikh community's strength."},
  "Guru Har Krishan": {order:8, years:"1656–1664", summary:"The eighth Sikh Guru. Sikh tradition particularly remembers his service to people suffering during an epidemic in Delhi."},
  "Guru Tegh Bahadur": {order:9, years:"1621–1675", summary:"The ninth Sikh Guru, revered for his martyrdom in defence of freedom of conscience and religious practice."},
  "Guru Gobind Singh": {order:10, years:"1666–1708", summary:"The tenth Sikh Guru. He founded the Khalsa in 1699 and declared the Guru Granth Sahib the eternal Guru of the Sikhs."}
};

const PLACE_INFO = {
  "Amritsar": {country:"India", region:"Punjab", summary:"A central city in Sikh history and home to Sri Harmandir Sahib and Sri Akal Takht Sahib."},
  "Anandpur Sahib": {country:"India", region:"Punjab", summary:"A major Sikh historical centre closely associated with Guru Tegh Bahadur and Guru Gobind Singh, and with the creation of the Khalsa in 1699."},
  "Chandni Chowk": {country:"India", region:"Delhi", summary:"The historic Delhi market district where Guru Tegh Bahadur was executed in 1675; Gurdwara Sis Ganj Sahib commemorates the site."},
  "Delhi": {country:"India", region:"Delhi", summary:"Home to several major historical Gurdwaras connected with Guru Har Krishan, Guru Tegh Bahadur and Guru Nanak."},
  "Goindwal": {country:"India", region:"Punjab", summary:"An important early Sikh centre closely associated with Guru Amar Das and the historic Baoli Sahib."},
  "Patna": {country:"India", region:"Bihar", summary:"Birthplace of Guru Gobind Singh and home to Takht Sri Patna Sahib."},
  "Nanded": {country:"India", region:"Maharashtra", summary:"Closely associated with the final period of Guru Gobind Singh's life and home to Takht Sachkhand Sri Hazur Sahib."},
  "Talwandi Sabo": {country:"India", region:"Punjab", summary:"Home to Takht Sri Damdama Sahib and closely associated with Guru Gobind Singh and Sikh learning."},
  "Nankana Sahib": {country:"Pakistan", region:"Punjab", summary:"Birthplace of Guru Nanak and one of the most important Sikh pilgrimage centres in Pakistan."},
  "Hasan Abdal": {country:"Pakistan", region:"Punjab", summary:"Home to Gurdwara Panja Sahib, associated through Sikh tradition with Guru Nanak."},
  "Kartarpur": {country:"Pakistan", region:"Punjab", summary:"The community founded by Guru Nanak where he spent the later years of his life."},
  "Fatehgarh Sahib": {country:"India", region:"Punjab", summary:"A major Sikh martyrdom site associated with the younger Sahibzadas and Mata Gujri."},
  "Chamkaur Sahib": {country:"India", region:"Punjab", summary:"Associated with the Battle of Chamkaur and the martyrdom of the elder Sahibzadas."},
  "Tarn Taran": {country:"India", region:"Punjab", summary:"Historic Sikh city associated with Guru Arjan and Gurdwara Sri Tarn Taran Sahib."}
};



function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function layout(content){ app.innerHTML=`<div class="brand"><div class="brand-title">ੴ Gurdwara Discovery</div><div class="badge">Prototype V1.3</div></div>${content}`; }


function saveJourneyState(){
  localStorage.setItem('gurdwara_visited', JSON.stringify([...visited]));
  localStorage.setItem('gurdwara_want_to_visit', JSON.stringify([...wantToVisit]));
}
function toggleVisited(id){
  if(visited.has(id)){ visited.delete(id); }
  else { visited.add(id); }
  saveJourneyState();
}
function toggleWantToVisit(id){
  if(wantToVisit.has(id)){ wantToVisit.delete(id); }
  else { wantToVisit.add(id); }
  saveJourneyState();
}
function distanceKm(a,b){
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
  const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function nearbyGurdwaras(item,limit=4){
  if(!Number.isFinite(item.lat)||!Number.isFinite(item.lng)) return [];
  return data.filter(x=>x.id!==item.id && Number.isFinite(x.lat)&&Number.isFinite(x.lng))
    .map(x=>({item:x, km:distanceKm(item,x)}))
    .sort((a,b)=>a.km-b.km).slice(0,limit);
}
function journeyStatus(item){
  const wasVisited=visited.has(item.id);
  const wantsReturn=wantToVisit.has(item.id);
  if(wasVisited && wantsReturn) return 'Visited · Want to Visit Again';
  if(wasVisited) return 'Visited';
  if(wantsReturn) return 'Want to Visit';
  return 'Not marked';
}
function renderJourneyButtons(item){
  const both=visited.has(item.id) && wantToVisit.has(item.id);
  return `<div class="journey-actions">
    <button class="journey-btn ${visited.has(item.id)?'active':''}" id="visitedBtn">🙏 ${visited.has(item.id)?'Visited ✓':'Mark Visited'}</button>
    <button class="journey-btn ${wantToVisit.has(item.id)?'active':''}" id="wantBtn">🧭 ${wantToVisit.has(item.id)?(both?'Visit Again ✓':'Want to Visit ✓'):(visited.has(item.id)?'Visit Again':'Want to Visit')}</button>
  </div>`;
}
function bindJourneyButtons(item, rerender){
  const v=document.getElementById('visitedBtn'), w=document.getElementById('wantBtn');
  if(v) v.onclick=()=>{toggleVisited(item.id); rerender();};
  if(w) w.onclick=()=>{toggleWantToVisit(item.id); rerender();};
}

function entityLinkText(text){
  let s=escapeHtml(text);
  const guruNames=Object.keys(GURU_INFO).sort((a,b)=>b.length-a.length);
  guruNames.forEach(name=>{
    const safe=escapeHtml(name);
    s=s.replace(new RegExp(`\\b${safe.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),
      `<button class="inline-entity" data-guru-name="${safe}">${safe}</button>`);
  });
  const placeNames=Object.keys(PLACE_INFO).sort((a,b)=>b.length-a.length);
  placeNames.forEach(name=>{
    const safe=escapeHtml(name);
    s=s.replace(new RegExp(`\\b${safe.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'g'),
      `<button class="inline-entity place-link" data-place-name="${safe}">${safe}</button>`);
  });
  data.forEach(g=>{
    const safe=escapeHtml(g.name);
    s=s.replace(new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'),
      `<button class="inline-entity gurdwara-link" data-profile-id="${g.id}">${safe}</button>`);
  });
  return s;
}
function bindEntityLinks(returnMode='game'){
  document.querySelectorAll('[data-guru-name]').forEach(el=>el.onclick=e=>{
    e.preventDefault(); renderGuruProfile(el.dataset.guruName, returnMode);
  });
  document.querySelectorAll('[data-place-name]').forEach(el=>el.onclick=e=>{
    e.preventDefault(); renderPlaceProfile(el.dataset.placeName, returnMode);
  });
  document.querySelectorAll('[data-profile-id]').forEach(el=>el.onclick=e=>{
    e.preventDefault();
    const next=data.find(x=>x.id===Number(el.dataset.profileId));
    if(next) renderProfile(next, returnMode);
  });
}
function renderGuruProfile(name, returnMode='game'){
  const info=GURU_INFO[name] || {summary:"Prototype biography to be researched.", years:""};
  const linked=data.filter(x=>x.gurus?.includes(name));
  layout(`<section class="card profile-card entity-profile">
    <div class="profile-top"><button class="secondary back-profile" id="entityBack">← Back to Gurdwara</button><span class="badge">Guru Profile</span></div>
    <div class="entity-icon">ੴ</div>
    <p class="eyebrow">THE ${info.order?`${info.order}${info.order===1?'ST':info.order===2?'ND':info.order===3?'RD':'TH'} SIKH GURU`:'SIKH GURU'}</p>
    <h1 class="profile-title">${escapeHtml(name)}</h1>
    <p class="entity-years">${escapeHtml(info.years||'')}</p>
    <div class="feature-info"><h2>About</h2><p>${escapeHtml(info.summary)}</p></div>
    <div class="profile-section"><h2>Gurdwaras in this prototype connected with ${escapeHtml(name)}</h2>
      <div class="nearby-grid">${linked.length?linked.map(x=>`<button class="nearby-card" data-profile-id="${x.id}">
        <strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.city)}, ${escapeHtml(x.country)}</span>
        <small>${escapeHtml(x.significance)}</small></button>`).join(''):'<p class="small-note">No linked prototype Gurdwaras yet.</p>'}
      </div>
    </div>
    <div class="research-note">📚 <strong>Prototype profile:</strong> This short Guru biography will be expanded and formally sourced in the historical-content pass.</div>
  </section>`);
  document.getElementById('entityBack').onclick=()=>history.back();
  bindEntityLinks(returnMode);
}
function renderPlaceProfile(name, returnMode='game'){
  const info=PLACE_INFO[name] || {summary:"Historical place profile to be researched.",country:"",region:""};
  const linked=data.filter(x=>x.city===name || x.region===name || (name==="Delhi" && x.region==="Delhi"));
  layout(`<section class="card profile-card entity-profile">
    <div class="profile-top"><button class="secondary back-profile" id="entityBack">← Back</button><span class="badge">Place Profile</span></div>
    <div class="entity-icon">📍</div>
    <p class="eyebrow">SIKH HISTORY & GEOGRAPHY</p>
    <h1 class="profile-title">${escapeHtml(name)}</h1>
    <p class="location">${escapeHtml(info.region||'')}${info.country?`, ${escapeHtml(info.country)}`:''}</p>
    <div class="feature-info"><h2>Why this place matters</h2><p>${escapeHtml(info.summary)}</p></div>
    <div class="profile-section"><h2>Gurdwaras connected with this place</h2>
      <div class="nearby-grid">${linked.length?linked.map(x=>`<button class="nearby-card" data-profile-id="${x.id}">
        <strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.city)}, ${escapeHtml(x.country)}</span>
        <small>Open Gurdwara Profile</small></button>`).join(''):'<p class="small-note">A historical-location page will be added here as the database expands.</p>'}
      </div>
    </div>
    <div class="research-note">📚 <strong>Prototype place profile:</strong> Later versions can include historic events, related Gurus, photographs, maps and pilgrimage routes.</div>
  </section>`);
  document.getElementById('entityBack').onclick=()=>history.back();
  bindEntityLinks(returnMode);
}
function relatedEntities(item){
  const gurus=item.gurus||[];
  const corpus=[item.story,item.traditions,item.significance,item.didYouKnow,item.city,item.region].join(' ');
  const places=Object.keys(PLACE_INFO).filter(p=>corpus.includes(p));
  return {gurus,places};
}

function renderProfile(item, returnMode='game'){
  const nearby=nearbyGurdwaras(item);
  const mapHtml=renderSingleGurdwaraMap(item);
  const related=relatedEntities(item);
  if(location.hash !== `#gurdwara-${item.id}`) history.pushState({type:'gurdwara',id:item.id,returnMode},'',`#gurdwara-${item.id}`);
  layout(`<section class="card profile-card">
    <div class="profile-top">
      <button class="secondary back-profile" id="profileBack">← Back</button>
      <span class="badge">${journeyStatus(item)}</span>
    </div>
    <div class="reveal-photo"><img src="${item.imageUrl}" alt="${escapeHtml(item.name)}"></div>
    <div class="profile-heading-row">
      <div><p class="eyebrow">GURDWARA PROFILE</p><h1 class="profile-title">${escapeHtml(item.name)}</h1>
      <p class="location">${escapeHtml(item.punjabi)}<br><button class="inline-entity place-link" data-place-name="${escapeHtml(item.city)}">${escapeHtml(item.city)}</button>, ${escapeHtml(item.region)}, ${escapeHtml(item.country)}</p></div>
      <div class="profile-status">${discovered.has(item.id)?'🏛️ Discovered':'○ Not discovered'}</div>
    </div>
    ${renderJourneyButtons(item)}
    <div class="tag-row">${item.values.map(v=>`<span class="tag">${escapeHtml(v)}</span>`).join('')}<span class="tag">${escapeHtml(item.difficulty)}</span></div>

    <div class="quick-facts">
      <div><span>Period</span><strong>${escapeHtml(item.historicalPeriod)}</strong></div>
      <div><span>Associated Guru${item.gurus.length>1?'s':''}</span><strong>${item.gurus.map(g=>`<button class="inline-entity" data-guru-name="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join(', ')}</strong></div>
      <div><span>Location</span><strong><button class="inline-entity place-link" data-place-name="${escapeHtml(item.city)}">${escapeHtml(item.city)}</button></strong></div>
    </div>

    <div class="profile-section story-section">
      <h2>Why This Gurdwara Matters</h2>
      <div class="feature-info significance-feature"><div class="feature-icon">ੴ</div><div><h3>Significance to the Sikh Faith</h3><p>${entityLinkText(item.significance)}</p></div></div>

      <div class="story-block"><h3>📖 The Story</h3><p>${entityLinkText(item.story)}</p></div>
      <div class="story-block tradition-block"><h3>✨ Stories & Traditions</h3><p>${entityLinkText(item.traditions)}</p></div>
      <div class="story-block fact-block"><h3>💡 Did You Know?</h3><p>${entityLinkText(item.didYouKnow)}</p></div>
    </div>

    <div class="profile-section">
      <h2>People & Places in This Story</h2>
      <p class="section-intro">Follow the people and locations connected with this Gurdwara.</p>
      <div class="entity-grid">
        ${related.gurus.map(g=>`<button class="entity-card" data-guru-name="${escapeHtml(g)}"><span class="entity-card-icon">ੴ</span><div><strong>${escapeHtml(g)}</strong><small>Open Guru profile</small></div></button>`).join('')}
        ${related.places.map(p=>`<button class="entity-card" data-place-name="${escapeHtml(p)}"><span class="entity-card-icon">📍</span><div><strong>${escapeHtml(p)}</strong><small>Explore this place</small></div></button>`).join('')}
      </div>
    </div>

    <div class="profile-section">
      <h2>Plan Your Visit</h2>
      ${mapHtml}
      <div class="visit-note">
        <h3>🙏 Pilgrimage & Visitor Information</h3>
        <p>Visitor details, sarai/accommodation, langar information, accessibility, transport, major events and verified travel notes will be added as this profile is researched.</p>
      </div>
      <div class="nearby-section">
        <h3>🏛️ Nearby Gurdwaras</h3>
        <div class="nearby-grid">
          ${nearby.map(n=>`<button class="nearby-card" data-profile-id="${n.item.id}">
            <strong>${escapeHtml(n.item.name)}</strong><span>${escapeHtml(n.item.city)}, ${escapeHtml(n.item.country)}</span>
            <small>Approx. ${Math.round(n.km)} km away · Open profile</small></button>`).join('')}
        </div>
      </div>
    </div>

    <div class="profile-section source-section">
      <h2>Sources & Verification</h2>
      <p class="section-intro">Historical and traditional material should remain transparent about where it comes from.</p>
      <div class="profile-footer">
        <a class="secondary" href="${item.source}" target="_blank" rel="noopener">History Source</a>
        <a class="secondary" href="${item.imagePage}" target="_blank" rel="noopener">Photo Source</a>
      </div>
    </div>
  </section>`);
  document.getElementById('profileBack').onclick=()=> returnMode==='journey' ? renderMyJourney() : returnMode==='explore' ? renderExplore() : history.back();
  bindJourneyButtons(item,()=>renderProfile(item,returnMode));
  bindEntityLinks(returnMode);
}

function renderHome(){
  layout(`<section class="card hero">
    <div class="ik-onkar">ੴ</div>
    <h1>Discover the Gurdwaras</h1>
    <p class="lead">Play, learn and begin building your own Sikh heritage journey.</p>
    <div class="stats">
      <div class="stat"><strong>${data.length}</strong><span>Gurdwaras</span></div>
      <div class="stat"><strong>${discovered.size}</strong><span>Discovered</span></div>
      <div class="stat"><strong>${visited.size}</strong><span>Visited</span></div>
    </div>
    <button class="primary" id="start">Start Photo Challenge</button>
    <button class="journey-home-btn explore-home-btn" id="exploreGurdwaras">🏛️ Explore Gurdwaras <span>Browse all ${data.length}</span></button>
    <button class="journey-home-btn" id="myJourney">🧭 My Journey <span>${wantToVisit.size} Want to Visit</span></button>
    <p class="small-note">Prototype V1.3 · Quiz, heritage profiles and personal pilgrimage planning.</p>
  </section>`);
  document.getElementById('start').onclick=startGame;
  document.getElementById('exploreGurdwaras').onclick=()=>renderExplore();
  document.getElementById('myJourney').onclick=renderMyJourney;
}


function initLeafletJourneyMap(containerId, items, options={}){
  const el=document.getElementById(containerId);
  if(!el || !window.L || !items.length) return;
  const map=L.map(containerId,{scrollWheelZoom:false, attributionControl:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,
    attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);

  const bounds=[];
  items.forEach((x,i)=>{
    const number=options.startNumber ? options.startNumber+i : i+1;
    const icon=L.divIcon({
      className:'numbered-leaflet-icon',
      html:`<span>${number}</span>`,
      iconSize:[32,32],
      iconAnchor:[16,16],
      popupAnchor:[0,-15]
    });
    const marker=L.marker([x.lat,x.lng],{icon}).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(x.name)}</strong><br>${escapeHtml(x.city)}, ${escapeHtml(x.country)}${options.showStop?`<br>Stop ${number}`:''}`);
    marker.on('click',()=>{});
    bounds.push([x.lat,x.lng]);
  });

  if(bounds.length===1) map.setView(bounds[0],10);
  else map.fitBounds(bounds,{padding:[30,30],maxZoom:9});
  setTimeout(()=>map.invalidateSize(),150);
}

function journeyMap(items){
  const located=items.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
  if(!located.length) return `<div class="empty-map">Add Gurdwaras to Want to Visit to begin your pilgrimage map.</div>`;
  return `<div class="real-journey-map">
    <div id="journeyLeafletMap" class="leaflet-journey-map" aria-label="Map of Gurdwaras I want to visit"></div>
    <div class="map-location-list">
      ${located.map((x,i)=>`<button class="map-location-chip" data-journey-profile="${x.id}">
        <span>${i+1}</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.city)}, ${escapeHtml(x.country)}</small></div>
      </button>`).join('')}
    </div>
    <p class="map-note">Map © OpenStreetMap contributors. Numbered markers match the Gurdwaras listed below.</p>
  </div>`;
}
function renderJourneyCollection(items,type){
  if(!items.length) return `<div class="journey-empty">Nothing here yet. Explore Gurdwaras and use the ${type==='visited'?'Visited':'Want to Visit'} button to add them.</div>`;
  return `<div class="journey-list">${items.map(x=>`<article class="journey-item">
    <img src="${x.imageUrl}" alt="${escapeHtml(x.name)}">
    <div class="journey-item-body"><strong>${escapeHtml(x.name)}</strong><span>${escapeHtml(x.city)}, ${escapeHtml(x.country)}</span>
      <button class="mini-profile-btn" data-journey-profile="${x.id}">Open Profile</button>
    </div>
  </article>`).join('')}</div>`;
}

const START_CITIES = {
  "Amritsar, Punjab": {lat:31.6340,lng:74.8723},
  "Chandigarh": {lat:30.7333,lng:76.7794},
  "Delhi": {lat:28.6139,lng:77.2090},
  "Jalandhar, Punjab": {lat:31.3260,lng:75.5762},
  "Ludhiana, Punjab": {lat:30.9010,lng:75.8573},
  "Patna, Bihar": {lat:25.5941,lng:85.1376},
  "Nanded, Maharashtra": {lat:19.1383,lng:77.3210},
  "Lahore, Pakistan": {lat:31.5204,lng:74.3587},
  "Other / Home City": null
};

function nearestNeighbourRoute(startPoint, items){
  const remaining=[...items];
  const ordered=[];
  let current=startPoint;
  while(remaining.length){
    let bestIndex=0,bestDist=Infinity;
    remaining.forEach((x,i)=>{
      const d=distanceKm(current,x);
      if(d<bestDist){bestDist=d;bestIndex=i;}
    });
    const next=remaining.splice(bestIndex,1)[0];
    ordered.push({item:next, distanceFromPrevious:bestDist});
    current=next;
  }
  return ordered;
}
function formatDateRange(start,end){
  if(!start && !end) return "Dates not set";
  const fmt=s=>new Date(`${s}T12:00:00`).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  if(start && end) return `${fmt(start)} – ${fmt(end)}`;
  return start?`Starting ${fmt(start)}`:`Ending ${fmt(end)}`;
}
function plannerMap(route){
  const items=route.map(x=>x.item).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
  if(!items.length) return '';
  return `<div class="real-journey-map pilgrimage-real-map">
    <div id="pilgrimageLeafletMap" class="leaflet-journey-map" aria-label="Pilgrimage route map"></div>
    <div class="route-legend">${items.map((x,i)=>`<div><span>${i+1}</span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.city)}</small></div>`).join('')}</div>
    <p class="map-note">Map © OpenStreetMap contributors. Stop numbers correspond to the itinerary below.</p>
  </div>`;
}
function itineraryText(plan){
  let lines=[`My Gurdwara Pilgrimage`,`Home/start: ${plan.startName}`,`Outbound: ${plan.outboundDeparture||plan.startName} → ${plan.selectedArrival||'Pilgrimage gateway'}`];
  if(plan.tripType==='multicity' && plan.multiCityStops?.length) lines.push(`Multi-city: ${plan.multiCityStops.join(' → ')}`);
  lines.push(`Return: ${plan.selectedDeparture||'Pilgrimage gateway'} → ${plan.returnDestination||plan.startName}`,`Dates: ${formatDateRange(plan.startDate,plan.endDate)}`,`Approximate pilgrimage distance: ${Math.round(plan.totalKm)} km`,``);
  plan.route.forEach((r,i)=>{
    lines.push(`${i+1}. ${r.item.name} — ${r.item.city}, ${r.item.country}`);
    lines.push(`   Approx. ${Math.round(r.distanceFromPrevious)} km from previous stop`);
  });
  return lines.join('\n');
}

function renderMyJourney(){
  const visitedItems=data.filter(x=>visited.has(x.id));
  const wishItems=data.filter(x=>wantToVisit.has(x.id));
  const discoveredItems=data.filter(x=>discovered.has(x.id));
  layout(`<section class="journey-page">
    <div class="card journey-hero">
      <div class="profile-top"><button class="secondary back-profile" id="journeyHome">← Home</button><span class="badge">My Journey</span></div>
      <div class="journey-title"><div><p class="eyebrow">YOUR SIKH HERITAGE JOURNEY</p><h1>My Journey</h1>
      <p>Keep track of where you've been and where you'd like to go next.</p></div><div class="journey-symbol">ੴ</div></div>
      <div class="journey-stats">
        <div><strong>${discoveredItems.length}</strong><span>Discovered</span></div>
        <div><strong>${visitedItems.length}</strong><span>Visited</span></div>
        <div><strong>${wishItems.length}</strong><span>Want to Visit</span></div>
        <div><strong>${data.length-visitedItems.length}</strong><span>Still to Explore</span></div>
      </div>
    </div>

    <div class="card pilgrimage-card">
      <div class="section-heading"><div><p class="eyebrow">PILGRIMAGE PLANNER</p><h2>🧭 Places I Want to Visit</h2>
      <p>Your saved Gurdwaras are the beginning of a personal pilgrimage.</p></div>
      <button class="primary small-primary" id="buildPilgrimage" ${wishItems.length?'':'disabled'}>Build My Pilgrimage</button></div>
      ${journeyMap(wishItems)}
      ${renderJourneyCollection(wishItems,'want')}
    </div>

    <div class="journey-columns">
      <div class="card"><h2>🙏 Visited</h2><p class="section-intro">Gurdwaras you've marked as part of your journey.</p>${renderJourneyCollection(visitedItems,'visited')}</div>
      <div class="card"><h2>🏛️ Discovered</h2><p class="section-intro">Gurdwaras you've encountered while playing.</p>${renderJourneyCollection(discoveredItems,'discovered')}</div>
    </div>
  </section>`);
  initLeafletJourneyMap('journeyLeafletMap', wishItems);
  document.getElementById('journeyHome').onclick=renderHome;
  document.querySelectorAll('[data-journey-profile]').forEach(el=>el.onclick=()=>{
    const item=data.find(x=>x.id===Number(el.dataset.journeyProfile));
    if(item) renderProfile(item,'journey');
  });
  const build=document.getElementById('buildPilgrimage');
  if(build && !build.disabled) build.onclick=()=>renderPilgrimageBuilder(wishItems);
}


const PILGRIMAGE_GATEWAYS = [
  {city:"Amritsar", airport:"Sri Guru Ram Dass Jee International Airport", code:"ATQ", lat:31.7096,lng:74.7973},
  {city:"Delhi", airport:"Indira Gandhi International Airport", code:"DEL", lat:28.5562,lng:77.1000},
  {city:"Chandigarh", airport:"Chandigarh International Airport", code:"IXC", lat:30.6735,lng:76.7885},
  {city:"Patna", airport:"Jay Prakash Narayan Airport", code:"PAT", lat:25.5913,lng:85.0880},
  {city:"Nanded", airport:"Shri Guru Gobind Singh Ji Airport", code:"NDC", lat:19.1833,lng:77.3167}
];

const AIRPORT_OPTIONS = [
  {city:"Vancouver", country:"Canada", code:"YVR", airport:"Vancouver International Airport"},
  {city:"Toronto", country:"Canada", code:"YYZ", airport:"Toronto Pearson International Airport"},
  {city:"Calgary", country:"Canada", code:"YYC", airport:"Calgary International Airport"},
  {city:"Montreal", country:"Canada", code:"YUL", airport:"Montréal–Trudeau International Airport"},
  {city:"London", country:"United Kingdom", code:"LHR", airport:"London Heathrow Airport"},
  {city:"Birmingham", country:"United Kingdom", code:"BHX", airport:"Birmingham Airport"},
  {city:"Manchester", country:"United Kingdom", code:"MAN", airport:"Manchester Airport"},
  {city:"New York", country:"United States", code:"JFK", airport:"John F. Kennedy International Airport"},
  {city:"Newark", country:"United States", code:"EWR", airport:"Newark Liberty International Airport"},
  {city:"San Francisco", country:"United States", code:"SFO", airport:"San Francisco International Airport"},
  {city:"Los Angeles", country:"United States", code:"LAX", airport:"Los Angeles International Airport"},
  {city:"Seattle", country:"United States", code:"SEA", airport:"Seattle–Tacoma International Airport"},
  {city:"Chicago", country:"United States", code:"ORD", airport:"O'Hare International Airport"},
  {city:"Sydney", country:"Australia", code:"SYD", airport:"Sydney Airport"},
  {city:"Melbourne", country:"Australia", code:"MEL", airport:"Melbourne Airport"},
  {city:"Singapore", country:"Singapore", code:"SIN", airport:"Singapore Changi Airport"},
  {city:"Kuala Lumpur", country:"Malaysia", code:"KUL", airport:"Kuala Lumpur International Airport"},
  {city:"Dubai", country:"United Arab Emirates", code:"DXB", airport:"Dubai International Airport"},
  {city:"Doha", country:"Qatar", code:"DOH", airport:"Hamad International Airport"},
  {city:"Delhi", country:"India", code:"DEL", airport:"Indira Gandhi International Airport"},
  {city:"Amritsar", country:"India", code:"ATQ", airport:"Sri Guru Ram Dass Jee International Airport"},
  {city:"Chandigarh", country:"India", code:"IXC", airport:"Chandigarh International Airport"},
  {city:"Patna", country:"India", code:"PAT", airport:"Jay Prakash Narayan Airport"},
  {city:"Nanded", country:"India", code:"NDC", airport:"Shri Guru Gobind Singh Ji Airport"}
];

function airportLabel(a){
  return `${a.city}, ${a.country} — ${a.code}`;
}
function airportSelectOptions(selectedCode=''){
  return AIRPORT_OPTIONS.map(a=>`<option value="${a.code}" ${selectedCode===a.code?'selected':''}>${escapeHtml(airportLabel(a))}</option>`).join('') +
    `<option value="custom">Other / Enter my own</option>`;
}
function airportFromCode(code){
  return AIRPORT_OPTIONS.find(a=>a.code===code);
}


function nearestGateway(point){
  return PILGRIMAGE_GATEWAYS
    .map(g=>({g,d:distanceKm(point,g)}))
    .sort((a,b)=>a.d-b.d)[0].g;
}
function suggestedGateways(items){
  if(!items.length) return {arrival:PILGRIMAGE_GATEWAYS[0],departure:PILGRIMAGE_GATEWAYS[0]};
  const first=items[0], last=items[items.length-1];
  return {arrival:nearestGateway(first),departure:nearestGateway(last)};
}
function gatewayOption(g){
  return `${g.city} — ${g.code}`;
}

function addDaysIso(iso, days){
  if(!iso) return '';
  const d=new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate()+days);
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function renderPilgrimageBuilder(items){
  layout(`<section class="card profile-card planner-card">
    <div class="profile-top"><button class="secondary back-profile" id="builderBack">← My Journey</button><span class="badge">Pilgrimage Planner V1.0</span></div>
    <p class="eyebrow">BUILD YOUR PILGRIMAGE</p>
    <h1 class="profile-title">Plan My Journey</h1>
    <p class="lead planner-lead">Choose a starting city and optional dates. We'll order your saved Gurdwaras into a practical first-pass route.</p>

    <div class="planner-form">
      <label><span>Starting city</span>
        <select id="startCity">${Object.keys(START_CITIES).map((name,i)=>`<option value="${escapeHtml(name)}" ${i===0?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select>
      </label>
      <label id="customCityWrap" class="custom-city-wrap" hidden><span>Home city</span>
        <input type="text" id="customCity" placeholder="e.g. Vancouver, BC, Canada" autocomplete="address-level2">
        <small class="field-help">We'll use this as the beginning of your pilgrimage itinerary. Live flight and rail planning can be added in a future travel upgrade.</small>
      </label>
      <div class="date-grid">
        <label><span>Start date <small>(optional)</small></span><input type="date" id="startDate"></label>
        <label><span>End date <small>(optional)</small></span><input type="date" id="endDate"></label>
      </div>
    </div>

    <div class="planner-selected">
      <h2>Selected Gurdwaras</h2>
      <p class="section-intro">${items.length} saved from Want to Visit.</p>
      <div class="planner-selection-list">${items.map(x=>`<label class="planner-check">
        <input type="checkbox" value="${x.id}" checked>
        <div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.city)}, ${escapeHtml(x.country)}</small></div>
      </label>`).join('')}</div>
    </div>

    <div class="gateway-planner">
      <p class="eyebrow">TRAVEL GATEWAYS</p>
      <h2>Arrival & Return Travel</h2>
      <p class="section-intro">We'll suggest practical gateway airports from your selected Gurdwaras. You can use our suggestion or enter your own.</p>

      <div class="gateway-grid">
        <div class="gateway-box">
          <h3>✈️ Start of Pilgrimage</h3>
          <label><span>Departure city / airport</span>
            <select id="outboundDeparture">${airportSelectOptions('YVR')}</select>
          </label>
          <input id="customOutboundDeparture" class="gateway-custom" type="text" placeholder="Enter your departure city / airport" hidden>
          <label><span>Arrival gateway</span>
            <select id="arrivalGateway">
              <option value="suggested">Use our suggestion</option>
              ${PILGRIMAGE_GATEWAYS.map(g=>`<option value="${g.code}">${escapeHtml(gatewayOption(g))}</option>`).join('')}
              <option value="custom">Choose my own</option>
            </select>
          </label>
          <input id="customArrivalGateway" class="gateway-custom" type="text" placeholder="Your arrival city / airport" hidden>
          <div class="gateway-suggestion" id="arrivalSuggestion"></div>
        </div>

        <div class="gateway-box">
          <h3>🏠 End of Pilgrimage</h3>
          <label><span>Return departure gateway</span>
            <select id="departureGateway">
              <option value="suggested">Use our suggestion</option>
              ${PILGRIMAGE_GATEWAYS.map(g=>`<option value="${g.code}">${escapeHtml(gatewayOption(g))}</option>`).join('')}
              <option value="custom">Choose my own</option>
            </select>
          </label>
          <input id="customDepartureGateway" class="gateway-custom" type="text" placeholder="Your return departure city / airport" hidden>
          <label><span>Final destination</span>
            <select id="returnDestination">${airportSelectOptions('YVR')}</select>
          </label>
          <input id="customReturnDestination" class="gateway-custom" type="text" placeholder="Enter your final city / airport" hidden>
          <div class="gateway-suggestion" id="departureSuggestion"></div>
        </div>
      </div>

      <div class="trip-type-box">
        <label><span>Flight itinerary type</span>
          <select id="tripType">
            <option value="roundtrip">Round trip</option>
            <option value="multicity">Multi-city</option>
          </select>
        </label>
        <div id="multiCityWrap" class="multi-city-wrap" hidden>
          <div class="multi-city-head">
            <div><strong>Additional flight stops</strong><small>Add cities you want to visit before returning home.</small></div>
            <button type="button" class="secondary mini-add-leg" id="addFlightLeg">+ Add City</button>
          </div>
          <div id="multiCityLegs"></div>
        </div>
      </div>
    </div>

    <button class="primary" id="generatePlan">Build My Pilgrimage</button>
  </section>`);

  document.getElementById('builderBack').onclick=renderMyJourney;

  const startDateInput=document.getElementById('startDate');
  const endDateInput=document.getElementById('endDate');
  const startCitySelect=document.getElementById('startCity');
  const customCityWrap=document.getElementById('customCityWrap');
  const customCityInput=document.getElementById('customCity');
  const arrivalGateway=document.getElementById('arrivalGateway');
  const departureGateway=document.getElementById('departureGateway');
  const customArrivalGateway=document.getElementById('customArrivalGateway');
  const customDepartureGateway=document.getElementById('customDepartureGateway');
  const outboundDeparture=document.getElementById('outboundDeparture');
  const returnDestination=document.getElementById('returnDestination');
  const customOutboundDeparture=document.getElementById('customOutboundDeparture');
  const customReturnDestination=document.getElementById('customReturnDestination');
  const tripType=document.getElementById('tripType');
  const multiCityWrap=document.getElementById('multiCityWrap');
  const multiCityLegs=document.getElementById('multiCityLegs');
  let flightLegCount=0;

  function selectedAirportText(selectEl, customEl){
    if(selectEl.value==='custom') return customEl.value.trim();
    const a=airportFromCode(selectEl.value);
    return a ? `${a.city} (${a.code})` : selectEl.value;
  }
  function addMultiCityLeg(){
    flightLegCount++;
    const row=document.createElement('div');
    row.className='multi-city-leg';
    row.dataset.leg=flightLegCount;
    row.innerHTML=`<span class="leg-number">${flightLegCount}</span>
      <select class="multi-city-airport">${airportSelectOptions('')}</select>
      <input class="multi-city-custom" type="text" placeholder="Enter city / airport" hidden>
      <button type="button" class="remove-leg" aria-label="Remove city">×</button>`;
    const sel=row.querySelector('.multi-city-airport');
    const custom=row.querySelector('.multi-city-custom');
    sel.addEventListener('change',()=>{custom.hidden=sel.value!=='custom'; if(!custom.hidden) custom.focus();});
    row.querySelector('.remove-leg').onclick=()=>row.remove();
    multiCityLegs.appendChild(row);
  }

  outboundDeparture.addEventListener('change',()=>{customOutboundDeparture.hidden=outboundDeparture.value!=='custom'; if(!customOutboundDeparture.hidden) customOutboundDeparture.focus();});
  returnDestination.addEventListener('change',()=>{customReturnDestination.hidden=returnDestination.value!=='custom'; if(!customReturnDestination.hidden) customReturnDestination.focus();});
  tripType.addEventListener('change',()=>{
    multiCityWrap.hidden=tripType.value!=='multicity';
    if(!multiCityWrap.hidden && !multiCityLegs.children.length) addMultiCityLeg();
  });
  document.getElementById('addFlightLeg').onclick=addMultiCityLeg;

  function currentChosen(){
    const ids=[...document.querySelectorAll('.planner-check input:checked')].map(x=>Number(x.value));
    return data.filter(x=>ids.includes(x.id));
  }
  function refreshGatewaySuggestions(){
    const chosen=currentChosen();
    if(!chosen.length) return;
    const startName=startCitySelect.value==='Other / Home City' ? (customCityInput.value.trim()||'Your home city') : startCitySelect.value;
    const routeSeed=nearestNeighbourRoute(
      START_CITIES[startCitySelect.value] || {lat:chosen[0].lat,lng:chosen[0].lng}, chosen
    ).map(r=>r.item);
    const sug=suggestedGateways(routeSeed);
    document.getElementById('arrivalSuggestion').innerHTML=`<strong>Our suggestion:</strong> ${escapeHtml(gatewayOption(sug.arrival))}<br><small>Near the beginning of your selected pilgrimage route.</small>`;
    document.getElementById('departureSuggestion').innerHTML=`<strong>Our suggestion:</strong> ${escapeHtml(gatewayOption(sug.departure))}<br><small>Near the final part of your selected pilgrimage route.</small>`;
    // Keep the user's airport selections. Home-city text remains separate from airport choice.
  }
  arrivalGateway.addEventListener('change',()=>{customArrivalGateway.hidden=arrivalGateway.value!=='custom'; if(!customArrivalGateway.hidden) customArrivalGateway.focus();});
  departureGateway.addEventListener('change',()=>{customDepartureGateway.hidden=departureGateway.value!=='custom'; if(!customDepartureGateway.hidden) customDepartureGateway.focus();});
  document.querySelectorAll('.planner-check input').forEach(x=>x.addEventListener('change',refreshGatewaySuggestions));

  startCitySelect.addEventListener('change',()=>{
    const isOther=startCitySelect.value==='Other / Home City';
    customCityWrap.hidden=!isOther;
    if(isOther) setTimeout(()=>customCityInput.focus(),50);
    setTimeout(refreshGatewaySuggestions,60);
  });
  customCityInput.addEventListener('input',()=>{});
  refreshGatewaySuggestions();

  startDateInput.addEventListener('change',()=>{
    const start=startDateInput.value;
    if(!start) return;

    // End date can never be before the start date.
    endDateInput.min=start;

    // Default the trip to one week later, or repair an invalid earlier end date.
    const suggestedEnd=addDaysIso(start,7);
    if(!endDateInput.value || endDateInput.value < start){
      endDateInput.value=suggestedEnd;
    }

    // Updating the end-date value also causes most browser date pickers
    // to open around the selected later month/date.
  });

  endDateInput.addEventListener('change',()=>{
    const start=startDateInput.value;
    if(start && endDateInput.value && endDateInput.value < start){
      endDateInput.value=addDaysIso(start,7);
    }
  });

  document.getElementById('generatePlan').onclick=()=>{
    const ids=[...document.querySelectorAll('.planner-check input:checked')].map(x=>Number(x.value));
    const chosen=data.filter(x=>ids.includes(x.id));
    if(!chosen.length){ alert('Choose at least one Gurdwara.'); return; }
    const selectedStart=document.getElementById('startCity').value;
    const isCustom=selectedStart==='Other / Home City';
    const customName=document.getElementById('customCity').value.trim();
    if(isCustom && !customName){ alert('Enter your home city.'); document.getElementById('customCity').focus(); return; }
    const startName=isCustom?customName:selectedStart;

    // Custom home cities are displayed as the true journey origin. Until live
    // geocoding/travel data is added, route ordering begins from the nearest
    // selected Gurdwara rather than pretending we know the home's coordinates.
    const start=isCustom
      ? {lat:chosen.reduce((s,x)=>s+x.lat,0)/chosen.length, lng:chosen.reduce((s,x)=>s+x.lng,0)/chosen.length}
      : START_CITIES[selectedStart];
    const route=nearestNeighbourRoute(start,chosen);
    const totalKm=route.reduce((sum,r)=>sum+r.distanceFromPrevious,0);
    const suggestions=suggestedGateways(route.map(r=>r.item));
    const selectedArrival=arrivalGateway.value==='suggested' ? gatewayOption(suggestions.arrival)
      : arrivalGateway.value==='custom' ? customArrivalGateway.value.trim()
      : gatewayOption(PILGRIMAGE_GATEWAYS.find(g=>g.code===arrivalGateway.value));
    const selectedDeparture=departureGateway.value==='suggested' ? gatewayOption(suggestions.departure)
      : departureGateway.value==='custom' ? customDepartureGateway.value.trim()
      : gatewayOption(PILGRIMAGE_GATEWAYS.find(g=>g.code===departureGateway.value));
    if(arrivalGateway.value==='custom' && !selectedArrival){ alert('Enter your arrival city or airport.'); return; }
    if(departureGateway.value==='custom' && !selectedDeparture){ alert('Enter your return departure city or airport.'); return; }
    const plan={startName,startDate:document.getElementById('startDate').value,endDate:document.getElementById('endDate').value,route,totalKm,
      outboundDeparture:selectedAirportText(outboundDeparture,customOutboundDeparture)||startName,
      suggestedArrival:gatewayOption(suggestions.arrival), selectedArrival,
      suggestedDeparture:gatewayOption(suggestions.departure), selectedDeparture,
      returnDestination:selectedAirportText(returnDestination,customReturnDestination)||startName,
      tripType:tripType.value,
      multiCityStops:[...multiCityLegs.querySelectorAll('.multi-city-leg')].map(row=>{
        const sel=row.querySelector('.multi-city-airport');
        const custom=row.querySelector('.multi-city-custom');
        return selectedAirportText(sel,custom);
      }).filter(Boolean)};
    localStorage.setItem('gurdwara_last_pilgrimage', JSON.stringify({
      startName:plan.startName,startDate:plan.startDate,endDate:plan.endDate,
      route:route.map(r=>({id:r.item.id,distanceFromPrevious:r.distanceFromPrevious})),totalKm,
      outboundDeparture:plan.outboundDeparture,suggestedArrival:plan.suggestedArrival,selectedArrival:plan.selectedArrival,
      suggestedDeparture:plan.suggestedDeparture,selectedDeparture:plan.selectedDeparture,returnDestination:plan.returnDestination,
      tripType:plan.tripType,multiCityStops:plan.multiCityStops
    }));
    renderPilgrimagePlan(plan);
  };
}

function renderPilgrimagePlan(plan){
  const dateRange=formatDateRange(plan.startDate,plan.endDate);
  layout(`<section class="pilgrimage-print-shell">
    <div class="card planner-result">
      <div class="profile-top no-print"><button class="secondary back-profile" id="planBack">← Edit Plan</button><span class="badge">My Pilgrimage</span></div>

      <div class="print-header">
        <div><p class="eyebrow">PERSONAL PILGRIMAGE ITINERARY</p><h1>My Gurdwara Journey</h1>
          <p>${escapeHtml(plan.startName)} · ${escapeHtml(dateRange)}</p></div>
        <div class="journey-symbol">ੴ</div>
      </div>

      <div class="plan-summary">
        <div><strong>${plan.route.length}</strong><span>Gurdwaras</span></div>
        <div><strong>${Math.round(plan.totalKm)}</strong><span>Approx. km*</span></div>
        <div><strong>${visited.size}</strong><span>Already Visited</span></div>
      </div>

      <div class="travel-gateway">
        <div><span class="travel-icon">✈️</span><div><p class="eyebrow">GETTING TO YOUR PILGRIMAGE</p><h2>${escapeHtml(plan.outboundDeparture)} → ${escapeHtml(plan.selectedArrival)}</h2>
        <p><strong>Our suggested arrival:</strong> ${escapeHtml(plan.suggestedArrival)}${plan.selectedArrival!==plan.suggestedArrival?` · <strong>Your choice:</strong> ${escapeHtml(plan.selectedArrival)}`:''}</p></div></div>
        <div class="gateway-trip-line"><span>OUTBOUND</span><strong>${escapeHtml(plan.outboundDeparture)}</strong><b>→</b><strong>${escapeHtml(plan.selectedArrival)}</strong></div>
        ${plan.tripType==='multicity' && plan.multiCityStops?.length
          ? `<div class="multi-city-summary"><span>MULTI-CITY</span>${plan.multiCityStops.map((s,i)=>`<div><b>${i+1}</b>${escapeHtml(s)}</div>`).join('')}</div>`
          : ''}
        <div class="gateway-trip-line"><span>RETURN</span><strong>${escapeHtml(plan.selectedDeparture)}</strong><b>→</b><strong>${escapeHtml(plan.returnDestination)}</strong></div>
        <p class="gateway-recommendation"><strong>Our suggested return gateway:</strong> ${escapeHtml(plan.suggestedDeparture)}${plan.selectedDeparture!==plan.suggestedDeparture?` · <strong>Your choice:</strong> ${escapeHtml(plan.selectedDeparture)}`:''}</p>
        <div class="travel-option-row"><span>✈️ Airfare lookup — next</span><span>🚆 Rail connections</span><span>🚗 Ground travel</span><span>🏨 Accommodation</span></div>
      </div>

      ${plannerMap(plan.route)}

      <div class="itinerary-section">
        <h2>Suggested Route</h2>
        <p class="section-intro">This first-pass order uses approximate straight-line distance between pilgrimage stops. International travel from a custom home city is not included in the kilometre total yet. Driving distance and border/travel requirements may differ.</p>
        <div class="itinerary-list">
          <div class="itinerary-start"><span>START</span><div><strong>${escapeHtml(plan.startName)}</strong><small>Your selected starting city</small></div></div>
          ${plan.route.map((r,i)=>`<article class="itinerary-stop">
            <div class="stop-number">${i+1}</div>
            <img src="${r.item.imageUrl}" alt="${escapeHtml(r.item.name)}">
            <div class="stop-body">
              <h3>${escapeHtml(r.item.name)}</h3>
              <p>${escapeHtml(r.item.city)}, ${escapeHtml(r.item.region)}, ${escapeHtml(r.item.country)}</p>
              <div class="stop-meta">Approx. ${Math.round(r.distanceFromPrevious)} km from previous stop · ${visited.has(r.item.id)&&wantToVisit.has(r.item.id)?'🙏 Visited · 🧭 Visiting Again':visited.has(r.item.id)?'🙏 Visited':wantToVisit.has(r.item.id)?'🧭 Want to Visit':'🏛️ Discovered'}</div>
              <p class="stop-significance">${escapeHtml(r.item.significance)}</p>
              <button class="mini-profile-btn no-print" data-plan-profile="${r.item.id}">Open Gurdwara Profile</button>
            </div>
          </article>`).join('')}
        </div>
      </div>

      <div class="travel-notes">
        <h2>Travel Notes</h2>
        <p>Before travelling, verify current border/visa requirements, local transport, accommodation or sarai availability, accessibility, opening arrangements and major religious events for each stop.</p>
      </div>

      <div class="plan-actions no-print">
        <button class="secondary" id="copyPlan">Copy Itinerary</button>
        <button class="secondary" id="editPlan">Edit Plan</button>
        <button class="primary" id="printPlan">🖨️ Print / Save PDF</button>
      </div>
    </div>
  </section>`);

  initLeafletJourneyMap('pilgrimageLeafletMap', plan.route.map(r=>r.item), {showStop:true});
  document.getElementById('planBack').onclick=()=>renderPilgrimageBuilder(plan.route.map(r=>r.item));
  document.getElementById('editPlan').onclick=()=>renderPilgrimageBuilder(plan.route.map(r=>r.item));
  document.getElementById('printPlan').onclick=()=>window.print();
  document.getElementById('copyPlan').onclick=async()=>{
    const text=itineraryText(plan);
    try{ await navigator.clipboard.writeText(text); document.getElementById('copyPlan').textContent='Copied ✓'; }
    catch(e){ window.prompt('Copy your itinerary:',text); }
  };
  document.querySelectorAll('[data-plan-profile]').forEach(el=>el.onclick=()=>{
    const item=data.find(x=>x.id===Number(el.dataset.planProfile));
    if(item) renderProfile(item,'journey');
  });
}


let exploreState={view:'list',query:'',region:'all',guru:'all',status:'all'};

function exploreFiltered(){
  const q=exploreState.query.toLowerCase().trim();
  return data.filter(x=>{
    const hay=[x.name,x.punjabi,x.city,x.region,x.country,...(x.gurus||[]),...(x.values||[])].join(' ').toLowerCase();
    const regionOK=exploreState.region==='all'||x.region===exploreState.region||x.country===exploreState.region;
    const guruOK=exploreState.guru==='all'||(x.gurus||[]).includes(exploreState.guru);
    const statusOK=exploreState.status==='all'
      ||(exploreState.status==='visited'&&visited.has(x.id))
      ||(exploreState.status==='want'&&wantToVisit.has(x.id))
      ||(exploreState.status==='discovered'&&discovered.has(x.id));
    return (!q||hay.includes(q))&&regionOK&&guruOK&&statusOK;
  });
}
function exploreCard(x){
  const both=visited.has(x.id)&&wantToVisit.has(x.id);
  return `<article class="explore-card" data-explore-profile="${x.id}">
    <div class="explore-photo"><img src="${x.imageUrl}" alt="${escapeHtml(x.name)}"><span>${escapeHtml(x.country)}</span></div>
    <div class="explore-card-body">
      <h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.punjabi)}</p>
      <div class="explore-location">📍 ${escapeHtml(x.city)}, ${escapeHtml(x.region)}</div>
      <div class="explore-gurus">${(x.gurus||[]).slice(0,2).map(g=>`<span>${escapeHtml(g)}</span>`).join('')}</div>
      <div class="explore-status">${both?'🙏 Visited · 🧭 Visit Again':visited.has(x.id)?'🙏 Visited':wantToVisit.has(x.id)?'🧭 Want to Visit':discovered.has(x.id)?'🏛️ Discovered':'○ Not discovered'}</div>
    </div>
  </article>`;
}
function exploreMap(items){
  return `<div class="card explore-map-card">
    <div id="exploreLeafletMap" class="leaflet-journey-map explore-map"></div>
    <p class="map-note">Map © OpenStreetMap contributors. Click a numbered marker to identify a Gurdwara.</p>
  </div>`;
}
function initExploreMap(items){
  const located=items.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
  const el=document.getElementById('exploreLeafletMap');
  if(!el||!window.L||!located.length)return;
  const map=L.map('exploreLeafletMap',{scrollWheelZoom:false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  const bounds=[];
  located.forEach((x,i)=>{
    const icon=L.divIcon({className:'numbered-leaflet-icon',html:`<span>${i+1}</span>`,iconSize:[32,32],iconAnchor:[16,16]});
    const marker=L.marker([x.lat,x.lng],{icon}).addTo(map);
    marker.bindPopup(`<strong>${escapeHtml(x.name)}</strong><br>${escapeHtml(x.city)}, ${escapeHtml(x.country)}<br><button class="popup-profile" data-id="${x.id}">Open Profile</button>`);
    marker.on('popupopen',()=>{
      setTimeout(()=>{
        const btn=document.querySelector(`.popup-profile[data-id="${x.id}"]`);
        if(btn)btn.onclick=()=>renderProfile(x,'explore');
      },0);
    });
    bounds.push([x.lat,x.lng]);
  });
  if(bounds.length===1)map.setView(bounds[0],9);else map.fitBounds(bounds,{padding:[25,25],maxZoom:8});
  setTimeout(()=>map.invalidateSize(),100);
}
function renderExplore(){
  const regions=[...new Set(data.flatMap(x=>[x.region,x.country]).filter(Boolean))].sort();
  const gurus=[...new Set(data.flatMap(x=>x.gurus||[]))].sort();
  const items=exploreFiltered();
  layout(`<section class="explore-page">
    <div class="card explore-hero">
      <div class="profile-top"><button class="secondary back-profile" id="exploreHome">← Home</button><span class="badge">${items.length} Gurdwaras</span></div>
      <p class="eyebrow">SIKH HERITAGE DIRECTORY</p><h1>Explore Gurdwaras</h1>
      <p>Browse sacred places by name, Guru, region, map or your personal journey.</p>
      <div class="explore-search"><input id="exploreSearch" type="search" value="${escapeHtml(exploreState.query)}" placeholder="Search Gurdwara, city, Guru or region…"></div>
      <div class="explore-filters">
        <select id="regionFilter"><option value="all">All regions</option>${regions.map(r=>`<option value="${escapeHtml(r)}" ${exploreState.region===r?'selected':''}>${escapeHtml(r)}</option>`).join('')}</select>
        <select id="guruFilter"><option value="all">All Gurus</option>${gurus.map(g=>`<option value="${escapeHtml(g)}" ${exploreState.guru===g?'selected':''}>${escapeHtml(g)}</option>`).join('')}</select>
        <select id="statusFilter">
          <option value="all" ${exploreState.status==='all'?'selected':''}>All journey statuses</option>
          <option value="visited" ${exploreState.status==='visited'?'selected':''}>Visited</option>
          <option value="want" ${exploreState.status==='want'?'selected':''}>Want to Visit</option>
          <option value="discovered" ${exploreState.status==='discovered'?'selected':''}>Discovered</option>
        </select>
        <div class="view-toggle"><button class="${exploreState.view==='list'?'active':''}" data-view="list">☷ List</button><button class="${exploreState.view==='map'?'active':''}" data-view="map">⌖ Map</button></div>
      </div>
    </div>
    ${items.length ? (exploreState.view==='map'?exploreMap(items):`<div class="explore-grid">${items.map(exploreCard).join('')}</div>`) : `<div class="card journey-empty">No Gurdwaras match those filters.</div>`}
  </section>`);
  document.getElementById('exploreHome').onclick=renderHome;
  const search=document.getElementById('exploreSearch');
  search.oninput=()=>{exploreState.query=search.value; clearTimeout(window._exploreTimer); window._exploreTimer=setTimeout(renderExplore,180);};
  document.getElementById('regionFilter').onchange=e=>{exploreState.region=e.target.value;renderExplore();};
  document.getElementById('guruFilter').onchange=e=>{exploreState.guru=e.target.value;renderExplore();};
  document.getElementById('statusFilter').onchange=e=>{exploreState.status=e.target.value;renderExplore();};
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{exploreState.view=b.dataset.view;renderExplore();});
  document.querySelectorAll('[data-explore-profile]').forEach(el=>el.onclick=()=>{const x=data.find(d=>d.id===Number(el.dataset.exploreProfile));if(x)renderProfile(x,'explore');});
  if(exploreState.view==='map')initExploreMap(items);
}

function startGame(){
  const eligible=data.filter(x=>x.imageUrl);
  state.rounds=shuffle(eligible).slice(0,TOTAL_ROUNDS).map(correct=>{
    const others=shuffle(eligible.filter(x=>x.id!==correct.id)).slice(0,3);
    return {correct, options:shuffle([correct,...others])};
  });
  state.roundIndex=0; state.score=0; state.streak=0; state.bestStreak=0; state.correctCount=0; state.answeredCount=0;
  beginRound();
}
function beginRound(){ state.attempt=1; state.hints=[]; state.disabledIds=new Set(); renderQuestion(); }

function buildHint(item,number){
  if(number===1 && item.gurus?.length) return {type:'ੴ Sikh Connection',text:`This site is closely associated with ${item.gurus.join(', ')}.`};
  if(number===1) return {type:'⭐ Significance',text:item.significance};
  return {type:'📍 Location',text:`This Gurdwara is located in ${item.city}, ${item.region}, ${item.country}.`};
}

function renderQuestion(){
  const round=state.rounds[state.roundIndex];
  const pct=(state.roundIndex/TOTAL_ROUNDS)*100;
  const clue=state.hints[state.hints.length-1];
  const prompt=state.attempt===1
    ? `<div class="name-prompt"><span>Find this Gurdwara</span><h2>${escapeHtml(round.correct.name)}</h2></div>`
    : `<div class="name-prompt clue-prompt"><span>Find this Gurdwara</span><h2>${escapeHtml(round.correct.name)}</h2><div class="clue-divider"></div><h3>${escapeHtml(clue.type)}</h3><p>${escapeHtml(clue.text)}</p></div>`;

  layout(`<section class="card">
    <div class="stats">
      <div class="stat"><strong>${state.roundIndex+1}/${TOTAL_ROUNDS}</strong><span>Question</span></div>
      <div class="stat"><strong>${state.score}</strong><span>Score</span></div>
      <div class="stat"><strong>${state.streak}</strong><span>Streak</span></div>
    </div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    ${prompt}
    <p class="small-note center-note">Attempt ${state.attempt} of 3 · Correct now: +${state.attempt===1?100:state.attempt===2?75:50} · Wrong: −25</p>
    <div class="photo-grid">
      ${round.options.map((o,i)=>{
        const disabled=state.disabledIds.has(o.id);
        return `<button class="photo-choice ${disabled?'eliminated':''}" data-id="${o.id}" ${disabled?'disabled':''} aria-label="Gurdwara image option ${i+1}">
          <img src="${o.imageUrl}" alt="Gurdwara image option ${i+1}" loading="eager"
            onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
          <div class="grid-fallback" style="display:none">Photo could not load</div>
          <span class="photo-number">${i+1}</span>
          ${disabled?'<span class="wrong-overlay">Not this one</span>':''}
        </button>`;
      }).join('')}
    </div>
    ${state.attempt>1 && state.hints.length>1 ? `<div class="hint-history">${state.hints.slice(0,-1).map(h=>`<span>${escapeHtml(h.type)}: ${escapeHtml(h.text)}</span>`).join('')}</div>`:''}
  </section>`);
  document.querySelectorAll('.photo-choice:not(:disabled)').forEach(b=>b.onclick=()=>answer(Number(b.dataset.id)));
}

function answer(id){
  const round=state.rounds[state.roundIndex], item=round.correct;
  if(id===item.id){
    const earned=state.attempt===1?100:state.attempt===2?75:50;
    state.score+=earned;
    if(state.attempt===1){ state.streak++; state.bestStreak=Math.max(state.bestStreak,state.streak); }
    discovered.add(item.id); localStorage.setItem('gurdwara_discovered',JSON.stringify([...discovered]));
    state.correctCount++; state.answeredCount++; renderResult(true,item,earned); return;
  }
  state.score=Math.max(0,state.score-25);
  state.disabledIds.add(id);
  if(state.attempt===1) state.streak=0;
  if(state.attempt<3){ state.hints.push(buildHint(item,state.attempt)); state.attempt++; renderQuestion(); }
  else { discovered.add(item.id); localStorage.setItem('gurdwara_discovered',JSON.stringify([...discovered])); state.answeredCount++; renderResult(false,item,0); }
}


function renderSingleGurdwaraMap(item){
  if(!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return '';
  const mapUrl=`https://www.openstreetmap.org/export/embed.html?bbox=${item.lng-0.18}%2C${item.lat-0.12}%2C${item.lng+0.18}%2C${item.lat+0.12}&layer=mapnik&marker=${item.lat}%2C${item.lng}`;
  const openUrl=`https://www.openstreetmap.org/?mlat=${item.lat}&mlon=${item.lng}#map=14/${item.lat}/${item.lng}`;
  return `<div class="info map-info">
    <h3>📍 Map & Location</h3>
    <div class="single-map-wrap">
      <iframe class="single-map" src="${mapUrl}" title="Map showing ${escapeHtml(item.name)}" loading="lazy"></iframe>
    </div>
    <div class="map-actions">
      <div><strong>${escapeHtml(item.city)}, ${escapeHtml(item.region)}, ${escapeHtml(item.country)}</strong><br>
      <span class="small-note">Approximate prototype coordinates</span></div>
      <a class="secondary map-link" href="${openUrl}" target="_blank" rel="noopener">Open Full Map</a>
    </div>
  </div>`;
}

function renderResult(correct,item,earned){
  const related=relatedEntities(item);
  layout(`<section class="card reveal-card">
    <div class="result-head"><div><div class="result-mark ${correct?'good':'bad'}">${correct?`✓ Correct · +${earned}`:'Answer revealed'}</div></div><div class="badge">Score ${state.score}</div></div>
    <div class="reveal-photo"><img src="${item.imageUrl}" alt="${escapeHtml(item.name)}"></div>

    <div class="reveal-heading">
      <div>
        <h2>${escapeHtml(item.name)}</h2>
        <p class="location">${escapeHtml(item.punjabi)}<br>
          <button class="inline-entity place-link" data-place-name="${escapeHtml(item.city)}">${escapeHtml(item.city)}</button>, ${escapeHtml(item.region)}, ${escapeHtml(item.country)}
        </p>
      </div>
      <span class="badge">${journeyStatus(item)}</span>
    </div>

    ${renderJourneyButtons(item)}

    <div class="tag-row">${item.values.map(v=>`<span class="tag">${escapeHtml(v)}</span>`).join('')}<span class="tag">${escapeHtml(item.difficulty)}</span></div>

    <div class="info-grid reveal-info">
      <div class="info"><h3>📅 Historical Period / Established</h3><p><strong>${escapeHtml(item.historicalPeriod)}</strong><br>${entityLinkText(item.established)}</p></div>
      ${renderSingleGurdwaraMap(item)}
      <div class="info"><h3>ੴ Significance to the Sikh Faith</h3><p>${entityLinkText(item.significance)}</p></div>
      <div class="info"><h3>📖 The Story</h3><p>${entityLinkText(item.story)}</p></div>
      <div class="info"><h3>✨ Stories & Traditions</h3><p>${entityLinkText(item.traditions)}</p></div>
      <div class="info"><h3>💡 Did You Know?</h3><p>${entityLinkText(item.didYouKnow)}</p></div>
      <div class="info"><h3>👤 Associated Guru(s)</h3><p>${item.gurus.map(g=>`<button class="inline-entity" data-guru-name="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join(', ')}</p></div>
    </div>

    <div class="related-reveal">
      <h3>🔗 Explore People & Places</h3>
      <div class="entity-grid compact-entities">
        ${related.gurus.map(g=>`<button class="entity-card" data-guru-name="${escapeHtml(g)}"><span class="entity-card-icon">ੴ</span><div><strong>${escapeHtml(g)}</strong><small>Open Guru profile</small></div></button>`).join('')}
        ${related.places.map(p=>`<button class="entity-card" data-place-name="${escapeHtml(p)}"><span class="entity-card-icon">📍</span><div><strong>${escapeHtml(p)}</strong><small>Explore this place</small></div></button>`).join('')}
      </div>
    </div>

    <div class="discovered">🏛️ <strong>Added to your discovered collection.</strong><br><span class="small-note">${discovered.size} of ${data.length} prototype gurdwaras discovered.</span></div>

    <div class="row result-actions">
      <button class="secondary" id="profileBtn">Open Full Profile</button>
      <button class="primary" id="next">${state.roundIndex===TOTAL_ROUNDS-1?'See Results':'Next Gurdwara'}</button>
    </div>
  </section>`);

  bindJourneyButtons(item,()=>renderResult(correct,item,earned));
  bindEntityLinks('game');

  document.getElementById('profileBtn').onclick=()=>renderProfile(item,'game');
  document.getElementById('next').onclick=()=>{ if(state.roundIndex===TOTAL_ROUNDS-1) renderEnd(); else {state.roundIndex++;beginRound();} };
}
function renderEnd(){
  const pct=Math.round((state.correctCount/TOTAL_ROUNDS)*100);
  const markers=data.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)).map(x=>{
    const left=((x.lng-68)/(88-68))*100;
    const top=(1-((x.lat-18)/(35-18)))*100;
    const found=discovered.has(x.id);
    return `<button class="map-marker ${found?'found':''}" style="left:${Math.max(2,Math.min(98,left))}%;top:${Math.max(3,Math.min(97,top))}%"
      title="${escapeHtml(x.name)} — ${escapeHtml(x.city)}, ${escapeHtml(x.country)}"
      data-map-id="${x.id}"><span>●</span></button>`;
  }).join('');

  layout(`<section class="results-layout">
    <div class="card results-card">
      <div class="ik-onkar">ੴ</div><h2>Challenge Complete!</h2>
      <div class="end-score">${state.score}</div><p class="score-label">Total Score</p>
      <div class="results-stats">
        <div class="result-stat"><strong>${state.correctCount}/${TOTAL_ROUNDS}</strong><span>Correct</span></div>
        <div class="result-stat"><strong>${pct}%</strong><span>Accuracy</span></div>
        <div class="result-stat"><strong>${state.bestStreak}</strong><span>Best Streak</span></div>
      </div>
      <div class="performance"><strong>🏆 Performance Summary</strong>
        <p>You identified ${state.correctCount} of ${TOTAL_ROUNDS} Gurdwaras correctly.</p>
        <p>Prototype collection discovered: <strong>${discovered.size}/${data.length}</strong></p>
      </div>
      <div class="row"><button class="secondary" id="home">Home</button><button class="primary" id="again">Play Again</button></div>
    </div>
    <div class="card map-card">
      <div class="map-title"><h2>📍 Gurdwara Map</h2><p>Explore where the 20 prototype Gurdwaras are located.</p></div>
      <div class="prototype-map">
        <div class="map-land"></div>${markers}
        <div class="map-label pakistan">Pakistan</div><div class="map-label india">India</div>
      </div>
      <div id="map-detail" class="map-detail">Tap a marker to see the Gurdwara and location. Green markers are already in your discovered collection.</div>
      <div class="location-list">${data.map(x=>`<button class="location-item" data-map-id="${x.id}"><span>${discovered.has(x.id)?'✓':'●'}</span><div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.city)}, ${escapeHtml(x.country)}</small></div></button>`).join('')}</div>
    </div>
  </section>`);
  document.getElementById('home').onclick=renderHome;
  document.getElementById('again').onclick=startGame;
  document.querySelectorAll('[data-map-id]').forEach(el=>el.onclick=()=>{
    const x=data.find(g=>g.id===Number(el.dataset.mapId));
    document.getElementById('map-detail').innerHTML=`<strong>${escapeHtml(x.name)}</strong><br>${escapeHtml(x.city)}, ${escapeHtml(x.region)}, ${escapeHtml(x.country)} · ${discovered.has(x.id)?'✓ Discovered':'Not yet discovered'}<br><button class="mini-profile-btn" id="openProfileFromMap">Open Profile</button>`;
    document.getElementById('openProfileFromMap').onclick=()=>renderProfile(x,'results');
  });
}
window.addEventListener('popstate',()=>{
  const m=location.hash.match(/^#gurdwara-(\d+)$/);
  if(m){
    const item=data.find(x=>x.id===Number(m[1]));
    if(item) { renderProfile(item,'game'); return; }
  }
  renderHome();
});
renderHome();
