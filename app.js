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
function layout(content){ app.innerHTML=`<div class="brand"><div class="brand-title">ੴ Gurdwara Discovery</div><div class="badge">Prototype V0.8</div></div>${content}`; }


function saveJourneyState(){
  localStorage.setItem('gurdwara_visited', JSON.stringify([...visited]));
  localStorage.setItem('gurdwara_want_to_visit', JSON.stringify([...wantToVisit]));
}
function toggleVisited(id){
  if(visited.has(id)){ visited.delete(id); }
  else { visited.add(id); wantToVisit.delete(id); }
  saveJourneyState();
}
function toggleWantToVisit(id){
  if(wantToVisit.has(id)){ wantToVisit.delete(id); }
  else { wantToVisit.add(id); visited.delete(id); }
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
  if(visited.has(item.id)) return 'Visited';
  if(wantToVisit.has(item.id)) return 'Want to Visit';
  return 'Not marked';
}
function renderJourneyButtons(item){
  return `<div class="journey-actions">
    <button class="journey-btn ${visited.has(item.id)?'active':''}" id="visitedBtn">🙏 ${visited.has(item.id)?'Visited ✓':'Mark Visited'}</button>
    <button class="journey-btn ${wantToVisit.has(item.id)?'active':''}" id="wantBtn">🧭 ${wantToVisit.has(item.id)?'Want to Visit ✓':'Want to Visit'}</button>
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
  document.getElementById('profileBack').onclick=()=>history.back();
  bindJourneyButtons(item,()=>renderProfile(item,returnMode));
  bindEntityLinks(returnMode);
}

function renderHome(){
  layout(`<section class="card hero">
    <div class="ik-onkar">ੴ</div>
    <h1>Discover the Gurdwaras</h1>
    <p class="lead">Match the Gurdwara name to the correct photograph, then discover its history, significance, stories and traditions.</p>
    <div class="stats">
      <div class="stat"><strong>20</strong><span>Gurdwaras</span></div>
      <div class="stat"><strong>10</strong><span>Rounds</span></div>
      <div class="stat"><strong>${discovered.size}</strong><span>Discovered</span></div>
    </div>
    <button class="primary" id="start">Start Photo Challenge</button>
    <p class="small-note">V0.4 uses a curated photograph for each prototype Gurdwara rather than automatic Wikipedia thumbnails.</p>
  </section>`);
  document.getElementById('start').onclick=startGame;
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
    : `<div class="name-prompt clue-prompt"><span>The name is now hidden — use this clue</span><h2>${escapeHtml(clue.type)}</h2><p>${escapeHtml(clue.text)}</p></div>`;

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
  layout(`<section class="card">
    <div class="result-head"><div><div class="result-mark ${correct?'good':'bad'}">${correct?`✓ Correct · +${earned}`:'Answer revealed'}</div></div><div class="badge">Score ${state.score}</div></div>
    <div class="reveal-photo"><img src="${item.imageUrl}" alt="${escapeHtml(item.name)}"></div>
    <h2>${escapeHtml(item.name)}</h2>
    <p class="location">${escapeHtml(item.punjabi)}<br>${escapeHtml(item.city)}, ${escapeHtml(item.region)}, ${escapeHtml(item.country)}</p>
    <div class="tag-row">${item.values.map(v=>`<span class="tag">${escapeHtml(v)}</span>`).join('')}<span class="tag">${escapeHtml(item.difficulty)}</span></div>
    <div class="info-grid">
      <div class="info"><h3>📅 Historical Period / Established</h3><p><strong>${escapeHtml(item.historicalPeriod)}</strong><br>${escapeHtml(item.established)}</p></div>
      ${renderSingleGurdwaraMap(item)}
      <div class="info"><h3>ੴ Significance to the Sikh Faith</h3><p>${escapeHtml(item.significance)}</p></div>
      <div class="info"><h3>📖 The Story</h3><p>${escapeHtml(item.story)}</p></div>
      <div class="info"><h3>✨ Stories & Traditions</h3><p>${escapeHtml(item.traditions)}</p></div>
      <div class="info"><h3>💡 Did You Know?</h3><p>${escapeHtml(item.didYouKnow)}</p></div>
      <div class="info"><h3>👤 Associated Guru(s)</h3><p>${item.gurus.map(escapeHtml).join(', ')}</p></div>
    </div>
    <div class="discovered">🏛️ <strong>Added to your discovered collection.</strong><br><span class="small-note">${discovered.size} of ${data.length} prototype gurdwaras discovered.</span></div>
    <p class="photo-source"><a href="${item.imagePage}" target="_blank" rel="noopener">Prototype photo source: Wikimedia Commons</a></p>
    <div class="row result-actions">
      <button class="secondary" id="profileBtn">Open Full Profile</button>
      <button class="primary" id="next">${state.roundIndex===TOTAL_ROUNDS-1?'See Results':'Next Gurdwara'}</button>
    </div>
  </section>`);
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
