const app = document.getElementById('app');
const data = window.GURDWARAS;
const TOTAL_ROUNDS = 10;

let state = {
  screen: 'home',
  rounds: [],
  roundIndex: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  selected: null,
  answered: false,
  attempt: 1,
  hints: [],
  imageUrl: null,
  imageCredit: null
};

const discovered = new Set(JSON.parse(localStorage.getItem('gurdwara_discovered') || '[]'));

function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function layout(content){
  app.innerHTML = `
    <div class="brand"><div class="brand-title">ੴ Gurdwara Discovery</div><div class="badge">Prototype V0.2</div></div>
    ${content}
  `;
}

function renderHome(){
  state.screen='home';
  layout(`
    <section class="card hero">
      <div class="ik-onkar">ੴ</div>
      <h1>Discover the Gurdwaras</h1>
      <p class="lead">Identify historic gurdwaras, learn why they matter to the Sikh faith, and unlock their stories and traditions.</p>
      <div class="stats">
        <div class="stat"><strong>20</strong><span>Gurdwaras</span></div>
        <div class="stat"><strong>10</strong><span>Rounds</span></div>
        <div class="stat"><strong>${discovered.size}</strong><span>Discovered</span></div>
      </div>
      <button class="primary" id="start">Start Photo Challenge</button>
      <p class="small-note">Three attempts per question. Hints appear after incorrect answers. Historical text is prototype content and should be formally reviewed before public release.</p>
    </section>
  `);
  document.getElementById('start').onclick = startGame;
}

function startGame(){
  state.rounds = shuffle(data).slice(0,TOTAL_ROUNDS).map(correct=>{
    const others = shuffle(data.filter(x=>x.id!==correct.id)).slice(0,3);
    return { correct, options: shuffle([correct, ...others]) };
  });
  state.roundIndex=0;
  state.score=0;
  state.streak=0;
  state.bestStreak=0;
  beginRound();
}

function beginRound(){
  state.selected=null;
  state.answered=false;
  state.attempt=1;
  state.hints=[];
  renderQuestion(true);
}

async function getImage(item){
  state.imageUrl=null; state.imageCredit=null;
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wikiTitle)}`;
    const r = await fetch(url);
    if(!r.ok) throw new Error('No image');
    const j = await r.json();
    state.imageUrl = j.thumbnail?.source || j.originalimage?.source || null;
    state.imageCredit = state.imageUrl ? 'Wikipedia image' : null;
  } catch(e) {}
}

function buildHint(item, number){
  if(number === 1){
    if(item.gurus?.length){
      return {
        type: 'ੴ Sikh Connection',
        text: `This site is closely associated with ${item.gurus.join(', ')}.`
      };
    }
    return { type: '⭐ Significance', text: item.significance };
  }
  return {
    type: '📍 Location',
    text: `This Gurdwara is located in ${item.city}, ${item.region}, ${item.country}.`
  };
}

function pointsForAttempt(attempt){
  return attempt === 1 ? 100 : attempt === 2 ? 75 : 50;
}

async function renderQuestion(loadImage=false){
  state.screen='question';
  const round = state.rounds[state.roundIndex];
  if(loadImage) await getImage(round.correct);
  const pct = ((state.roundIndex)/TOTAL_ROUNDS)*100;
  const attemptsRemaining = 4 - state.attempt;

  layout(`
    <section class="card">
      <div class="stats">
        <div class="stat"><strong>${state.roundIndex+1}/${TOTAL_ROUNDS}</strong><span>Question</span></div>
        <div class="stat"><strong>${state.score}</strong><span>Score</span></div>
        <div class="stat"><strong>${state.streak}</strong><span>Streak</span></div>
      </div>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <div class="photo-wrap">
        ${state.imageUrl ? `<img src="${state.imageUrl}" alt="A Sikh gurdwara used for the quiz" onerror="this.remove();this.parentElement.querySelector('.photo-fallback').style.display='block'">` : ''}
        <div class="photo-fallback" style="display:${state.imageUrl?'none':'block'}"><strong>Photo unavailable</strong><br><span>Use the hints and choices for this prototype round.</span></div>
        ${state.imageCredit ? `<div class="photo-credit">${state.imageCredit}</div>`:''}
      </div>
      <div class="question">
        <h2>Can you identify this Gurdwara?</h2>
        <p class="small-note">Attempt ${state.attempt} of 3 · ${attemptsRemaining} ${attemptsRemaining===1?'attempt':'attempts'} remaining after this guess · Up to ${pointsForAttempt(state.attempt)} points</p>
      </div>
      ${state.hints.length ? `<div class="hint-stack">${state.hints.map(h=>`<div class="hint"><strong>${escapeHtml(h.type)}</strong><span>${escapeHtml(h.text)}</span></div>`).join('')}</div>` : ''}
      <div class="answers">
        ${round.options.map(o=>`<button class="answer" data-id="${o.id}">${escapeHtml(o.name)}</button>`).join('')}
      </div>
    </section>
  `);
  document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answer(Number(b.dataset.id)));
}

function answer(id){
  if(state.answered) return;
  const item=state.rounds[state.roundIndex].correct;
  const correct = id===item.id;

  if(correct){
    const earned = pointsForAttempt(state.attempt);
    state.score += earned;
    if(state.attempt===1){
      state.streak++;
      state.bestStreak=Math.max(state.bestStreak,state.streak);
    }
    discovered.add(item.id);
    localStorage.setItem('gurdwara_discovered', JSON.stringify([...discovered]));
    state.answered=true;
    renderResult(true, item, earned);
    return;
  }

  // A wrong first guess breaks the first-try streak.
  if(state.attempt===1) state.streak=0;

  if(state.attempt < 3){
    const hint = buildHint(item, state.attempt);
    state.hints.push(hint);
    state.attempt++;
    renderQuestion(false);
  } else {
    state.answered=true;
    discovered.add(item.id);
    localStorage.setItem('gurdwara_discovered', JSON.stringify([...discovered]));
    renderResult(false, item, 0);
  }
}

function renderResult(correct,item,earned){
  const attemptsUsed = state.attempt;
  layout(`
    <section class="card">
      <div class="result-head">
        <div><div class="result-mark ${correct?'good':'bad'}">${correct?`✓ Correct · +${earned}`:'Answer revealed'}</div></div>
        <div class="badge">Score ${state.score}</div>
      </div>
      ${correct ? `<p class="small-note">Solved on attempt ${attemptsUsed} of 3.</p>` : `<p class="small-note">Three attempts used. Here is the correct answer and its story.</p>`}
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
      <div style="height:14px"></div>
      <div class="row">
        <a class="secondary" href="${item.source}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none">View Source</a>
        <button class="primary" id="next">${state.roundIndex===TOTAL_ROUNDS-1?'See Results':'Next Gurdwara'}</button>
      </div>
    </section>
  `);
  document.getElementById('next').onclick = ()=>{
    if(state.roundIndex===TOTAL_ROUNDS-1) renderEnd();
    else { state.roundIndex++; beginRound(); }
  };
}

function renderEnd(){
  state.screen='end';
  layout(`
    <section class="card hero">
      <div class="ik-onkar">ੴ</div>
      <h2>Challenge Complete</h2>
      <div class="end-score">${state.score}</div>
      <p class="lead">Best first-try streak: <strong>${state.bestStreak}</strong><br>Prototype collection discovered: <strong>${discovered.size}/${data.length}</strong></p>
      <div class="row">
        <button class="secondary" id="home">Home</button>
        <button class="primary" id="again">Play Again</button>
      </div>
    </section>
  `);
  document.getElementById('home').onclick=renderHome;
  document.getElementById('again').onclick=startGame;
}

renderHome();
