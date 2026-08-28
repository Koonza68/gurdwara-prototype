const app = document.getElementById('app');
const data = window.GURDWARAS;
const TOTAL_ROUNDS = 10;

let state = {
  screen:'home', rounds:[], roundIndex:0, score:0, streak:0, bestStreak:0,
  attempt:1, hints:[], disabledIds:new Set()
};

const discovered = new Set(JSON.parse(localStorage.getItem('gurdwara_discovered') || '[]'));

function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function layout(content){ app.innerHTML=`<div class="brand"><div class="brand-title">ੴ Gurdwara Discovery</div><div class="badge">Prototype V0.4.1</div></div>${content}`; }

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
  state.roundIndex=0; state.score=0; state.streak=0; state.bestStreak=0;
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
    renderResult(true,item,earned); return;
  }
  state.score=Math.max(0,state.score-25);
  state.disabledIds.add(id);
  if(state.attempt===1) state.streak=0;
  if(state.attempt<3){ state.hints.push(buildHint(item,state.attempt)); state.attempt++; renderQuestion(); }
  else { discovered.add(item.id); localStorage.setItem('gurdwara_discovered',JSON.stringify([...discovered])); renderResult(false,item,0); }
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
      <div class="info"><h3>ੴ Significance to the Sikh Faith</h3><p>${escapeHtml(item.significance)}</p></div>
      <div class="info"><h3>📖 The Story</h3><p>${escapeHtml(item.story)}</p></div>
      <div class="info"><h3>✨ Stories & Traditions</h3><p>${escapeHtml(item.traditions)}</p></div>
      <div class="info"><h3>💡 Did You Know?</h3><p>${escapeHtml(item.didYouKnow)}</p></div>
      <div class="info"><h3>👤 Associated Guru(s)</h3><p>${item.gurus.map(escapeHtml).join(', ')}</p></div>
    </div>
    <div class="discovered">🏛️ <strong>Added to your discovered collection.</strong><br><span class="small-note">${discovered.size} of ${data.length} prototype gurdwaras discovered.</span></div>
    <p class="photo-source"><a href="${item.imagePage}" target="_blank" rel="noopener">Prototype photo source: Wikimedia Commons</a></p>
    <div class="row">
      <a class="secondary" href="${item.source}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">View History Source</a>
      <button class="primary" id="next">${state.roundIndex===TOTAL_ROUNDS-1?'See Results':'Next Gurdwara'}</button>
    </div>
  </section>`);
  document.getElementById('next').onclick=()=>{ if(state.roundIndex===TOTAL_ROUNDS-1) renderEnd(); else {state.roundIndex++;beginRound();} };
}

function renderEnd(){
  layout(`<section class="card hero"><div class="ik-onkar">ੴ</div><h2>Challenge Complete</h2><div class="end-score">${state.score}</div>
    <p class="lead">Best first-try streak: <strong>${state.bestStreak}</strong><br>Prototype collection discovered: <strong>${discovered.size}/${data.length}</strong></p>
    <div class="row"><button class="secondary" id="home">Home</button><button class="primary" id="again">Play Again</button></div></section>`);
  document.getElementById('home').onclick=renderHome; document.getElementById('again').onclick=startGame;
}
renderHome();
