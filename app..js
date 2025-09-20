// app.js v5 — Keep TTS playing across page navigation during '전체 재생(카테고리)'
(function(){
  'use strict';

  // ---- 에러 오버레이 ----
  window.addEventListener('error', function(e){
    const box = document.getElementById('err');
    if(!box) return;
    box.style.display = 'block';
    box.textContent = '[에러] ' + (e.message||'') + '\n' + (e.filename||'') + ':' + (e.lineno||'') + ':' + (e.colno||'');
  });

  // ---- 인앱 브라우저 경고 ----
  (function showInAppWarning(){
    const ua = navigator.userAgent || '';
    const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line|DaumApp/i.test(ua);
    if(inApp){
      const el = document.getElementById('inappWarn');
      if(el) el.style.display = 'block';
    }
  })();

  // ====== 데이터(카테고리별 50단어) ======
  const WORDS = window.WORDS || {}; // v4에서는 파일 내에 WORDS 선언이 있었음. v5는 index.html과 동일 파일을 쓰므로 전역 WORDS를 지원.

  // ====== 상태/DOM ======
  const $ = (id)=>document.getElementById(id);
  const categorySel=$('category'), grid=$('grid'), pageInfo=$('pageInfo');
  const nextBtn=$('nextBtn'), prevBtn=$('prevBtn');
  const shuffleBtn=$('shuffleBtn'), playAllBtn=$('playAllBtn'), pauseBtn=$('pauseBtn'), stopBtn=$('stopBtn');
  const rateEl=$('rate'), rateVal=$('rateVal'), ttsInitBtn=$('ttsInitBtn');
  const ttsBrokenBox=$('ttsBroken'), openChrome=$('openChrome');

  // WORDS가 파일 내 정의(기존 v4)인 경우 그대로 사용하고, 아닐 경우 안전가드
  const categories = Object.keys(WORDS);
  if(categories.length === 0){
    // fallback 간단 데이터
    WORDS["동물"] = [["cat","고양이"],["dog","개"]];
  }

  let currentCategory = Object.keys(WORDS)[0];
  let order = [...Array(WORDS[currentCategory].length).keys()];
  let page = 0;

  // 재생 상태
  let playQueue = [];
  let isPlaying = false;
  let isPaused = false;
  let lastMode = 'all'; // 'all' | 'page'
  let ttsBroken = false;

  // ====== TTS 가드 ======
  const hasTTS = ('speechSynthesis' in window) && (typeof window.SpeechSynthesisUtterance !== 'undefined');
  function synth(){ return hasTTS ? window.speechSynthesis : null; }

  let voices = [];
  function refreshVoices(){ try{ const s=synth(); voices = s && s.getVoices ? s.getVoices() : []; }catch(_){ voices=[]; } }
  refreshVoices(); if(hasTTS && synth()) synth().onvoiceschanged = refreshVoices;

  function showTTSBroken(){
    ttsBroken = true;
    if(ttsBrokenBox) ttsBrokenBox.style.display = 'block';
  }

  function pickVoice(lang){ if(!voices.length) return null; const v=voices.find(v=>v.lang && v.lang.toLowerCase().startsWith(lang)); return v||voices[0]; }

  function enqueuePair(en,ko){ playQueue.push({text:en,lang:'en'},{text:ko,lang:'ko'}); }
  function buildCategoryQueue(){ playQueue=[]; order.forEach(i=>{ const [en,ko]=WORDS[currentCategory][i]; enqueuePair(en,ko); }); lastMode='all'; return playQueue.length; }
  function buildPageQueue(){ playQueue=[]; const start=page*10; const list=WORDS[currentCategory]; order.slice(start,start+10).forEach(i=>{ const [en,ko]=list[i]; enqueuePair(en,ko); }); lastMode='page'; return playQueue.length; }

  function singleSpeak(text,lang){
    try{
      const s=synth(); if(!s){ showTTSBroken(); return; }
      const u=new SpeechSynthesisUtterance(text); const v=pickVoice(lang); if(v) u.voice=v;
      u.lang=(lang==='en'?'en-US':'ko-KR'); u.rate=parseFloat(rateEl.value||'1'); s.speak(u);
    }catch(_){ showTTSBroken(); }
  }

  function stopAll(){ try{ const s=synth(); if(s) s.cancel(); }catch(_){}
    isPlaying=false; isPaused=false; playQueue=[]; updateControls(); }

  function updateControls(){
    const s = synth();
    if(!s){ pauseBtn.textContent='▶ 재생'; return; }
    pauseBtn.textContent = (isPaused ? '▶ 재개' : (s.speaking ? '⏸ 일시정지' : '▶ 재생'));
  }

  function renderOptions(){
    categorySel.innerHTML = Object.keys(WORDS).map(k=>`<option value="${k}">${k}</option>`).join('');
    categorySel.value = currentCategory;
  }
  function render(){
    const list = WORDS[currentCategory]; const start = page*10; const slice = order.slice(start,start+10);
    grid.innerHTML='';
    slice.forEach(i=>{
      const [en,ko]=list[i];
      const card=document.createElement('div'); card.className='card';
      const enEl=document.createElement('div'); enEl.className='en'; enEl.textContent=en;
      const koEl=document.createElement('div'); koEl.className='ko'; koEl.textContent=ko;
      const tts=document.createElement('div'); tts.className='tts';
      const b1=document.createElement('button'); b1.textContent='▶ EN'; b1.addEventListener('click',()=>{ const s=synth(); if(s && (s.speaking||s.paused)) return; singleSpeak(en,'en'); });
      const b2=document.createElement('button'); b2.textContent='▶ KO'; b2.addEventListener('click',()=>{ const s=synth(); if(s && (s.speaking||s.paused)) return; singleSpeak(ko,'ko'); });
      tts.appendChild(b1); tts.appendChild(b2);
      card.appendChild(enEl); card.appendChild(koEl); card.appendChild(tts);
      grid.appendChild(card);
    });
    const totalPages=Math.ceil(order.length/10); pageInfo.textContent=`${page+1} / ${totalPages}`;
  }

  function startQueue(){
    if(ttsBroken) return;
    if(playQueue.length===0){ isPlaying=false; updateControls(); return; }
    const s = synth(); if(!s){ isPlaying=false; playQueue=[]; updateControls(); showTTSBroken(); return; }
    isPlaying = true;
    const {text,lang} = playQueue.shift();
    const u = new SpeechSynthesisUtterance(text); const v=pickVoice(lang); if(v) u.voice=v;
    u.lang=(lang==='en'?'en-US':'ko-KR'); u.rate=parseFloat(rateEl.value||'1');
    s.speak(u);
    u.onend = ()=> setTimeout(()=>{
      if(!isPlaying || isPaused){ updateControls(); return; }
      if(playQueue.length>0) startQueue(); else { isPlaying=false; updateControls(); }
    },120);
    updateControls();
  }

  // ====== 이벤트 ======
  categorySel.addEventListener('change', ()=>{
    currentCategory=categorySel.value; order=[...Array(WORDS[currentCategory].length).keys()]; page=0;
    // 카테고리 바꾸면 의도적으로 정지
    stopAll(); render();
  });

  nextBtn.addEventListener('click', ()=>{
    const tp=Math.ceil(order.length/10);
    page=(page+1)%tp;
    // 전체재생 중이라면 재생 유지(큐 유지), UI만 업데이트
    if(isPlaying && lastMode==='all'){ render(); return; }
    // 그 외 모드/정지 상태에선 기존처럼 멈추고 렌더
    stopAll(); render();
  });

  prevBtn.addEventListener('click', ()=>{
    const tp=Math.ceil(order.length/10);
    page=(page-1+tp)%tp;
    if(isPlaying && lastMode==='all'){ render(); return; }
    stopAll(); render();
  });

  shuffleBtn.addEventListener('click', ()=>{
    for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
    page=0;
    // 섞기는 재생 일관성을 위해 항상 멈춘 뒤 적용
    stopAll(); render();
  });

  rateEl.addEventListener('input', ()=>{ rateVal.textContent=(parseFloat(rateEl.value)||1).toFixed(1)+'x'; });

  playAllBtn.addEventListener('click', ()=>{ stopAll(); buildCategoryQueue(); isPaused=false; startQueue(); });
  pauseBtn.addEventListener('click', ()=>{
    const s=synth(); if(!s){ showTTSBroken(); return; }
    if(!isPaused){ isPaused = true; try{ s.cancel(); }catch(_){}} else { isPaused = false; if(playQueue.length===0){ if(lastMode==='page') buildPageQueue(); else buildCategoryQueue(); } startQueue(); }
    updateControls();
  });
  stopBtn.addEventListener('click', stopAll);

  // 초기화
  (function init(){
    renderOptions(); render(); updateControls();
    if(!hasTTS){
      const warn = document.getElementById('ttsWarn');
      if(warn) warn.textContent = '· 이 브라우저는 음성합성이 제한될 수 있어요.';
      showTTSBroken();
    }
    if(openChrome){
      openChrome.addEventListener('click', (e)=>{
        e.preventDefault();
        const url = location.href;
        location.href = `intent://${url.replace(/^https?:\/\//,'')}/#Intent;scheme=https;package=com.android.chrome;end`;
      });
    }
  })();
})();