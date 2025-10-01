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

  // Add a toggle UI: English-only reading (default ON)
  let englishOnly = true;
  (function injectToggle(){
    const bar = document.querySelector('.bar') || document.querySelector('.controls') || document.body;
    const wrap = document.createElement('label');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '8px';
    wrap.style.marginLeft = '8px';
    wrap.title = '영어만 읽기 (발음/한국어는 말하지 않음)';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = true;
    cb.id = 'englishOnlyToggle';
    const span = document.createElement('span');
    span.textContent = '영어만 읽기';
    wrap.appendChild(cb); wrap.appendChild(span);
    bar && bar.appendChild(wrap);
    cb.addEventListener('change', ()=>{ englishOnly = cb.checked; });
  })();

  const PAGE = 10;
  let cur = Object.keys(WORDS)[0] || '';
  let list = WORDS[cur] || [];
  let page = 0, isPlaying=false, abortAll=false;

  // --- TTS setup for Android Chrome ---
  const synth = window.speechSynthesis;
  let voices = [];
  let ready = false;
  let warmed = false;
  let resumeHackTimer = null;

  function logWarnOnce(msg){
    if (inappWarn) { inappWarn.style.display='block'; inappWarn.textContent = msg; }
  }

  function waitForVoices(timeout=1500){
    return new Promise(resolve=>{
      const t0 = Date.now();
      function done(){ voices = synth ? synth.getVoices() : []; resolve(voices); }
      if (!synth) return resolve([]);
      voices = synth.getVoices();
      if (voices && voices.length) return resolve(voices);
      const onv = ()=>{ synth.removeEventListener('voiceschanged', onv); done(); };
      synth.addEventListener('voiceschanged', onv);
      const iv = setInterval(()=>{
        voices = synth.getVoices();
        if (voices && voices.length) { clearInterval(iv); synth.removeEventListener('voiceschanged', onv); done(); }
        if (Date.now()-t0 > timeout){ clearInterval(iv); synth.removeEventListener('voiceschanged', onv); done(); }
      }, 100);
    });
  }

  function pickVoice(langPrefix){
    if (!voices || !voices.length) return null;
    const exact = voices.find(v=> v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if (exact) return exact;
    const byName = voices.find(v=> (v.name||'').toLowerCase().includes(langPrefix.split('-')[0]));
    return byName || voices[0];
  }

  async function warmUpOnce(){
    if (warmed || !synth) return;
    try{
      const u = new SpeechSynthesisUtterance(' ');
      u.lang = 'en-US';
      u.volume = 0.01;
      u.rate = 1;
      synth.speak(u);
      setTimeout(()=>{ try{synth.cancel();}catch(e){} }, 120);
      warmed = true;
    }catch(e){ /* ignore */ }
  }

  async function ensureReady(){
    if (!synth){ logWarnOnce('이 브라우저에서는 음성 합성이 지원되지 않아요. 크롬/사파리 최신 버전을 사용해 주세요.'); return false; }
    if (!ready){
      await waitForVoices(2000);
      ready = (voices && voices.length > 0);
      if (!ready){
        logWarnOnce('필요한 음성 데이터가 아직 로드되지 않았어요. 화면을 한 번 더 터치한 뒤 다시 시도해 주세요.');
        return false;
      }
    }
    return true;
  }

  function startResumeHack(){
    stopResumeHack();
    resumeHackTimer = setInterval(()=>{
      try{ if (synth && synth.speaking && synth.paused) synth.resume(); }catch(e){}
    }, 800);
  }
  function stopResumeHack(){
    if (resumeHackTimer){ clearInterval(resumeHackTimer); resumeHackTimer = null; }
  }

  // Strip Hangul (jamo + syllables) from a string, keep English only
  function stripHangulPron(s){
    if (!s) return s;
    // Remove Hangul ranges and trim extra spaces
    return s.replace(/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7A3]+/g, '').replace(/\s{2,}/g,' ').trim();
  }

  // Warm-up on first user interaction
  ['click','touchstart'].forEach(ev=>{
    window.addEventListener(ev, ()=>{ warmUpOnce(); }, { once:true, passive:true });
  });

  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden){ try{ synth && synth.cancel(); }catch(e){} abortAll=true; isPlaying=false; stopResumeHack(); }
  });

  // Fill categories
  if (category) {
    category.innerHTML = Object.keys(WORDS).map(c=>`<option value="${c}">${c}</option>`).join('');
    if(cur) category.value = cur;
  }

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
    grid.querySelectorAll('.enb').forEach(b=> b.onclick=()=>speakSeq([[stripHangulPron(b.dataset.en),'en']]));
    grid.querySelectorAll('.kob').forEach(b=> b.onclick=()=>speakSeq(englishOnly ? [[stripHangulPron(b.previousElementSibling.previousElementSibling.textContent),'en']] : [[b.dataset.ko,'ko']]));
    // ↑ KO 버튼: 영어만 읽기 모드일 때도 영어만 읽도록(요청 상황 대비). 원래 KO 읽기를 원하면 토글 해제.
  }

  async function speakSeq(seq){
    if (!(await ensureReady())) return;
    abortAll=false;
    startResumeHack();
    for(const [text,lang] of seq){
      if(abortAll) break;
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice(lang==='en' ? 'en' : 'ko');
      if (v) u.voice = v;
      u.lang = (lang==='en')?'en-US':'ko-KR';
      u.rate = parseFloat(rate.value||'1');
      await new Promise(res=>{
        u.onend = ()=>res();
        u.onerror = ()=>res();
        try{ synth.speak(u); }catch(e){ res(); }
      });
    }
    stopResumeHack();
  }

  async function playAll(){
    if(isPlaying) return; isPlaying=true; abortAll=false;
    if (!(await ensureReady())) { isPlaying=false; return; }
    startResumeHack();
    const items = (WORDS[cur]||[]).slice(page*PAGE, page*PAGE+PAGE);
    for(const [en,ko] of items){
      if(abortAll) break;
      const cleaned = stripHangulPron(en);
      if (englishOnly){
        await speakSeq([[cleaned,'en']]); // speak English only
      } else {
        await speakSeq([[cleaned,'en'],[ko,'ko']]); // speak both if toggled off
      }
      await new Promise(r=>setTimeout(r, 80));
    }
    stopResumeHack();
    isPlaying=false;
  }

  if (category) category.onchange = ()=>{ cur=category.value; page=0; render(); };
  if (shuffleBtn) shuffleBtn.onclick = ()=>{ WORDS[cur] = (WORDS[cur]||[]).slice().sort(()=>Math.random()-0.5); page=0; render(); };
  if (prevBtn) prevBtn.onclick = ()=>{ page=Math.max(0,page-1); render(); };
  if (nextBtn) nextBtn.onclick = ()=>{ page=Math.min(Math.ceil((WORDS[cur]||[]).length/PAGE)-1, page+1); render(); };
  if (playAllBtn) playAllBtn.onclick = playAll;
  if (pauseBtn) pauseBtn.onclick = ()=>{ try{ if(synth?.speaking && !synth.paused) synth.pause(); else if(synth?.paused) synth.resume(); }catch(e){} };
  if (stopBtn) stopBtn.onclick = ()=>{ abortAll=true; try{ synth?.cancel(); }catch(e){} isPlaying=false; stopResumeHack(); };
  if (rate) rate.oninput = ()=> rateVal.textContent = parseFloat(rate.value).toFixed(1) + 'x';

  setTimeout(async ()=>{
    if (!synth){ logWarnOnce('이 브라우저에서는 음성 합성이 지원되지 않아요.'); return; }
    await waitForVoices(1500);
    if (!(voices && voices.length)){
      logWarnOnce('음성 데이터를 불러오는 중이에요. 화면을 한 번 터치한 후 다시 시도해 주세요.');
    }
  }, 500);

  render();
})();