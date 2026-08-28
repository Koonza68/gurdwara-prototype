const app = document.getElementById('app');
const data = window.GURDWARAS;
const TOTAL_ROUNDS = 10;

let state = {
  screen: 'home', rounds: [], roundIndex: 0, score: 0, streak: 0, bestStreak: 0,
  attempt: 1, hints: [], disabledIds: new Set(), images: {}
};

const discovered = new Set(JSON.parse(localStorage.getItem('gurdwara_discovered') || '[]'));

function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function layout(content){
  app.innerHTML = `<div class="brand"><div class="brand-title">ੴ Gurdwara Discovery</div><div class="badge">Prototype V0.3</div></div>${content}`;
}
function renderHome(){
  state.screen='home';
  layout(`<section class="card hero">
    <div class="ik-onkar">ੴ</div><h1>Discover the Gurdwaras</h1>
    <p class="lead">Match a Gurdwara name to the correct image, then discover its history, significance, stories and traditions.</p>
    <div class="stats">
      <div class="stat"><strong>20</strong><span>Gurdwaras</span></div>
      <div class="stat"><strong>10</strong><span>Rounds</span></div>
      <div class="stat"><strong>${discovered.size}</strong><span>Discovered</span></div>
    </div>
    <button class="primary" id="start">Start Photo Challenge</button>
    <p class="small-note">Choose from four images. A wrong choice costs 25 points and replaces the name with a clue.</p>
  </section>`);
  document.getElementById('start').onclick=startGame;
}
function startGame(){
  state.rounds=shuffle(data).slice(0,TOTAL_ROUNDS).map(correct=>{
    const others=shuffle(data.filter(x=>x.id!==correct.id)).slice(0,3);
    return {correct,options:shuffle([correct,...others])};
  });
  state.roundIndex=0; state.score=0; state.streak=0; state.bestStreak=0; state.images={};
  beginRound();
}
function beginRound(){
  state.attempt=1; state.hints=[]; state.disabledIds=new Set();
  renderQuestion(true);
}
async function getImage(item){
  if(state.images[item.id] !== undefined) return state.images[item.id];
  try{
    const url=`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wikiTitle)}`;
    const r=await fetch(url); if(!r.ok) throw new Error();
    const j=await r.json();
    return state.images[item.id]=j.thumbnail?.source||j.originalimage?.source||null;
  }catch(e){ return state.images[item.id]=null; }
}
function buildHint(item,number){
  if(number===1 && item.gurus?.length) return {type:'ੴ Sikh Connection',text:`This site is closely associated with ${item.gurus.join(', ')}.`};
  if(number===1) return {type:'⭐ Significance',text:item.significance};
  return {type:'📍 Location',text:`This Gurdwara is located in ${item.city}, ${item.region}, ${item.country}.`};
}
async function renderQuestion(loadImages=false){
  state.screen='question';
  const round=state.rounds[state.roundIndex];
  if(loadImages) await Promise.all(round.options.map(getImage));
  const pct=(state.roundIndex/TOTAL_ROUNDS)*100;
  const prompt = state.attempt===1
    ? `<div class="name-prompt"><span>Find this Gurdwara</span><h2>${escapeHtml(round.correct.name)}</h2><div class="punjabi-name">${escapeHtml(round.correct.punjabi)}</div></div>`
    : `<div class="name-prompt clue-prompt"><span>Use the clue to find the correct image</span><h2>${escapeHtml(state.hints[state.hints.length-1].type)}</h2><p>${escapeHtml(state.hints[state.hints.length-1].text)}</p></div>`;
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
        const u=state.images[o.id], disabled=state.disabledIds.has(o.id);
        return `<button class="photo-choice ${disabled?'eliminated':''}" data-id="${o.id}" ${disabled?'disabled':''} aria-label="Gurdwara image option ${i+1}">
          ${u?`<img src="${u}" alt="Gurdwara image option ${i+1}">`:`<div class="grid-fallback">Photo unavailable</div>`}
          <span class="photo-number">${i+1}</span>${disabled?'<span class="wrong-overlay">Not this one</span>':''}
        </button>`;
      }).join('')}
    </div>
    ${state.attempt>1?`<div class="hint-history">${state.hints.slice(0,-1).map(h=>`<span>${escapeHtml(h.type)}: ${escapeHtml(h.text)}</span>`).join('')}</div>`:''}
  </section>`);
  document.querySelectorAll('.photo-choice:not(:disabled)').forEach(b=>b.onclick=()=>answer(Number(b.dataset.id)));
}
function answer(id){
  const round=state.rounds[state.roundIndex], item=round.correct;
  if(id===item.id){
    const earned=state.attempt===1?100:state.attempt===2?75:50;
    state.score+=earned;
    if(state.attempt===1){state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);}
    discovered.add(item.id); localStorage.setItem('gurdwara_discovered',JSON.stringify([...discovered]));
    renderResult(true,item,earned); return;
  }
  state.score=Math.max(0,state.score-25);
  state.disabledIds.add(id);
  if(state.attempt===1) state.streak=0;
  if(state.attempt<3){
    state.hints.push(buildHint(item,state.attempt));
    state.attempt++;
    renderQuestion(false);
  }else{
    discovered.add(item.id); localStorage.setItem('gurdwara_discovered',JSON.stringify([...discovered]));
    renderResult(false,item,0);
  }
}
function renderResult(correct,item,earned){
  layout(`<section class="card">
    <div class="result-head"><div><div class="result-mark ${correct?'good':'bad'}">${correct?`✓ Correct · +${earned}`:'Answer revealed'}</div></div><div class="badge">Score ${state.score}</div></div>
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
    <div style="height:14px"></div><div class="row">
      <a class="secondary" href="${item.source}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">View Source</a>
      <button class="primary" id="next">${state.roundIndex===TOTAL_ROUNDS-1?'See Results':'Next Gurdwara'}</button>
    </div>
  </section>`);
  document.getElementById('next').onclick=()=>{if(state.roundIndex===TOTAL_ROUNDS-1)renderEnd();else{state.roundIndex++;beginRound();}};
}
function renderEnd(){
  layout(`<section class="card hero"><div class="ik-onkar">ੴ</div><h2>Challenge Complete</h2><div class="end-score">${state.score}</div>
  <p class="lead">Best first-try streak: <strong>${state.bestStreak}</strong><br>Prototype collection discovered: <strong>${discovered.size}/${data.length}</strong></p>
  <div class="row"><button class="secondary" id="home">Home</button><button class="primary" id="again">Play Again</button></div></section>`);
  document.getElementById('home').onclick=renderHome; document.getElementById('again').onclick=startGame;
}
renderHome();
