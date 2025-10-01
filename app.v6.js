(function(){
  const WORDS = window.WORDS || {};
  const grid = document.getElementById('grid');
  const category = document.getElementById('category');
  const playAllBtn = document.getElementById('playAllBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  const rate = document.getElementById('rate');
  const rateVal = document.getElementById('rateVal');
  const inappWarn = document.getElementById('inappWarn');

  const PAGE = 10;
  let cur = Object.keys(WORDS)[0] || '';
  let list = WORDS[cur] || [];
  let page = 0, isPlaying=false, abortAll=false;

  // Fill categories
  category.innerHTML = Object.keys(WORDS).map(c=>`<option value="${c}">${c}</option>`).join('');
  if(cur) category.value = cur;

  function render(){
    list = WORDS[cur] || [];
    const start = page * PAGE;
    const items = list.slice(start, start + PAGE);
    grid.innerHTML = items.map(([en,ko])=>`
      <div class="card" role="listitem">
        <div class="en">${en}</div>
        <div class="ko">${ko}</div>
        <div class="tts">
          <button class="enb" data-en="${en}" aria-label="${en} 영어로 듣기">▶ EN</button>
          <button class="kob" data-ko="${ko}" aria-label="${ko} 한국어로 듣기">▶ KO</button>
        </div>
      </div>
    `).join('');
    pageInfo.textContent = `${page+1} / ${Math.ceil((WORDS[cur]||[]).length / PAGE)}`;
    grid.querySelectorAll('.enb').forEach(b=> b.onclick=()=>say([[b.dataset.en,'en']]));
    grid.querySelectorAll('.kob').forEach(b=> b.onclick=()=>say([[b.dataset.ko,'ko']]));
  }

  async function say(seq){
    const s = window.speechSynthesis;
    if(!s){ inappWarn.style.display = 'block'; return; }
    abortAll=false;
    for(const [text,lang] of seq){
      if(abortAll) break;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = (lang==='en')?'en-US':'ko-KR';
      u.rate = parseFloat(rate.value||'1');
      const done = new Promise(r=>{u.onend=r; u.onerror=r;});
      s.speak(u); await done;
    }
  }

  async function playAll(){
    if(isPlaying) return; isPlaying=true; abortAll=false;
    const items = (WORDS[cur]||[]).slice(page*PAGE, page*PAGE+PAGE);
    for(const [en,ko] of items){
      if(abortAll) break;
      await say([[en,'en'],[ko,'ko']]);
      await new Promise(r=>setTimeout(r, 80));
    }
    isPlaying=false;
  }

  category.onchange = ()=>{ cur=category.value; page=0; render(); };
  shuffleBtn.onclick = ()=>{ WORDS[cur] = (WORDS[cur]||[]).slice().sort(()=>Math.random()-0.5); page=0; render(); };
  prevBtn.onclick = ()=>{ page=Math.max(0,page-1); render(); };
  nextBtn.onclick = ()=>{ page=Math.min(Math.ceil((WORDS[cur]||[]).length/PAGE)-1, page+1); render(); };
  playAllBtn.onclick = playAll;
  pauseBtn.onclick = ()=>{ const s=speechSynthesis; if(s?.speaking && !s.paused) s.pause(); else if(s?.paused) s.resume(); };
  stopBtn.onclick = ()=>{ abortAll=true; speechSynthesis?.cancel(); isPlaying=false; };
  rate.oninput = ()=> rateVal.textContent = parseFloat(rate.value).toFixed(1) + 'x';

  // In-app warning if speech is missing
  setTimeout(()=>{ if(!('speechSynthesis' in window)) inappWarn.style.display='block'; }, 800);

  render();
})();