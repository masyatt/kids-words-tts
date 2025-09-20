// app.js — 깃허브/티스토리 임베드 대응(인라인 스크립트 금지), Pause/Resume 안정화
(function(){
  'use strict';

  // === 오류 출력(임베드 환경 디버깅용) ===
  window.addEventListener('error', function(e){
    const box = document.getElementById('err');
    if(!box) return;
    box.style.display = 'block';
    box.textContent = '[에러] ' + (e.message||'') + '\n' + (e.filename||'') + ':' + (e.lineno||'') + ':' + (e.colno||'');
  });

  // ====== 데이터(카테고리별 50단어) ======
  const WORDS = {
    "동물": [
      ["cat","고양이"],["dog","개"],["bird","새"],["fish","물고기"],["rabbit","토끼"],
      ["horse","말"],["cow","소"],["pig","돼지"],["sheep","양"],["goat","염소"],
      ["chicken","닭"],["duck","오리"],["goose","거위"],["turkey","칠면조"],["deer","사슴"],
      ["bear","곰"],["lion","사자"],["tiger","호랑이"],["elephant","코끼리"],["giraffe","기린"],
      ["monkey","원숭이"],["panda","판다"],["zebra","얼룩말"],["kangaroo","캥거루"],["koala","코알라"],
      ["fox","여우"],["wolf","늑대"],["dolphin","돌고래"],["whale","고래"],["shark","상어"],
      ["penguin","펭귄"],["seal","물개"],["turtle","거북이"],["frog","개구리"],["snake","뱀"],
      ["crocodile","악어"],["hippo","하마"],["rhino","코뿔소"],["camel","낙타"],["donkey","당나귀"],
      ["mouse","생쥐"],["rat","쥐"],["squirrel","다람쥐"],["bat","박쥐"],["owl","올빼미"],
      ["eagle","독수리"],["bee","벌"],["ant","개미"],["butterfly","나비"],["spider","거미"]
    ],
    "날씨": [
      ["sun","해"],["sunny","맑은"],["cloud","구름"],["cloudy","흐린"],["rain","비"],
      ["rainy","비 오는"],["drizzle","이슬비"],["shower","소나기"],["thunder","천둥"],["lightning","번개"],
      ["thunderstorm","뇌우"],["storm","폭풍"],["typhoon","태풍"],["hurricane","허리케인"],["wind","바람"],
      ["windy","바람 부는"],["breeze","산들바람"],["gale","강풍"],["snow","눈"],["snowy","눈 오는"],
      ["sleet","진눈깨비"],["hail","우박"],["mist","옅은 안개"],["fog","안개"],["foggy","안개 낀"],
      ["rainbow","무지개"],["temperature","기온"],["hot","더운"],["warm","따뜻한"],["cool","서늘한"],
      ["cold","추운"],["freeze","얼다"],["freezing","영하의"],["frost","서리"],["icy","얼음 낀"],
      ["humid","습한"],["humidity","습도"],["dry","건조한"],["drought","가뭄"],["flood","홍수"],
      ["overcast","회색 구름 낀"],["clear","쾌청한"],["sprinkle","가랑비"],["blizzard","눈보라"],["heatwave","폭염"],
      ["snowfall","강설"],["raindrop","빗방울"],["dew","이슬"],["puddle","물웅덩이"],["forecast","일기예보"]
    ],
    "숫자": Array.from({length:50}, (_,i)=>{
      const en=["one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty","twenty-one","twenty-two","twenty-three","twenty-four","twenty-five","twenty-six","twenty-seven","twenty-eight","twenty-nine","thirty","thirty-one","thirty-two","thirty-three","thirty-four","thirty-five","thirty-six","thirty-seven","thirty-eight","thirty-nine","forty","forty-one","forty-two","forty-three","forty-four","forty-five","forty-six","forty-seven","forty-eight","forty-nine","fifty"];
      const ko=["하나","둘","셋","넷","다섯","여섯","일곱","여덟","아홉","열","열하나","열둘","열셋","열넷","열다섯","열여섯","열일곱","열여덟","열아홉","스무","스물하나","스물둘","스물셋","스물넷","스물다섯","스물여섯","스물일곱","스물여덟","스물아홉","서른","서른하나","서른둘","서른셋","서른넷","서른다섯","서른여섯","서른일곱","서른여덟","서른아홉","마흔","마흔하나","마흔둘","마흔셋","마흔넷","마흔다섯","마흔여섯","마흔일곱","마흔여덟","마흔아홉","쉰"];
      return [en[i], ko[i]];
    }),
    "색": [
      ["red","빨강"],["blue","파랑"],["yellow","노랑"],["green","초록"],["orange","주황"],
      ["purple","보라"],["pink","분홍"],["brown","갈색"],["black","검정"],["white","흰색"],
      ["gray","회색"],["light blue","하늘색"],["dark blue","진파랑"],["light green","연두색"],["dark green","진초록"],
      ["light pink","연분홍"],["dark red","진빨강"],["gold","금색"],["silver","은색"],["bronze","청동색"],
      ["beige","베이지색"],["ivory","아이보리색"],["navy","남색"],["mint","민트색"],["lavender","라벤더색"],
      ["violet","바이올렛색"],["indigo","인디고색"],["magenta","자홍색"],["cyan","시안색"],["turquoise","터키석색"],
      ["teal","틸색"],["lime","라임색"],["maroon","자주색"],["peach","복숭아색"],["coral","산호색"],
      ["salmon","연어색"],["cream","크림색"],["khaki","카키색"],["tan","황갈색"],["mustard","겨자색"],
      ["scarlet","주홍색"],["olive","올리브색"],["charcoal","숯색"],["rose","장미색"],["plum","자두색"],
      ["sand","모래색"],["lilac","라일락색"],["burgundy","버건디색"],["apricot","살구색"],["pastel pink","파스텔분홍"]
    ],
    "가족": [
      ["mother","엄마"],["father","아빠"],["parents","부모님"],["baby","아기"],["child","아이"],
      ["boy","소년"],["girl","소녀"],["brother","남자형제"],["sister","여자형제"],["big brother","형"],
      ["little brother","남동생"],["big sister","누나"],["little sister","여동생"],["grandma","할머니"],["grandpa","할아버지"],
      ["grandparents","조부모님"],["grandson","손자"],["granddaughter","손녀"],["grandchildren","손주들"],["cousin","사촌"],
      ["aunt","이모"],["uncle","삼촌"],["nephew","조카(남)"],["niece","조카(여)"],["family","가족"],
      ["relative","친척"],["twins","쌍둥이"],["newborn","갓난아기"],["teenager","십대"],["adult","어른"],
      ["husband","남편"],["wife","아내"],["son","아들"],["daughter","딸"],["parents-in-law","시부모님"],
      ["father-in-law","시아버지"],["mother-in-law","시어머니"],["brother-in-law","형부"],["sister-in-law","형수"],["stepfather","새아빠"],
      ["stepmother","새엄마"],["stepson","의붓아들"],["stepdaughter","의붓딸"],["half-brother","이복형제(남)"],["half-sister","이복형제(여)"],
      ["godfather","대부"],["godmother","대모"],["caregiver","보호자"],["household","식구"],["family pet","반려동물"],
      ["babysitter","베이비시터"]
    ],
    "감정": [
      ["happy","행복한"],["sad","슬픈"],["angry","화난"],["scared","무서운"],["surprised","놀란"],
      ["tired","피곤한"],["sleepy","졸린"],["excited","신이 난"],["bored","심심한"],["hungry","배고픈"],
      ["thirsty","목마른"],["sick","아픈"],["hurt","다친"],["fine","괜찮은"],["good","좋은"],
      ["bad","나쁜"],["cold","추운"],["hot","더운"],["shy","수줍은"],["brave","용감한"],
      ["proud","자랑스러운"],["nervous","긴장한"],["worried","걱정되는"],["calm","차분한"],["curious","궁금한"],
      ["confused","혼란스러운"],["jealous","질투하는"],["kind","친절한"],["polite","예의 바른"],["sorry","미안한"],
      ["thankful","고마운"],["lonely","외로운"],["friendly","다정한"],["silly","엉뚱한"],["funny","웃기는"],
      ["relaxed","편안한"],["upset","속상한"],["annoyed","짜증난"],["frustrated","답답한"],["shocked","충격받은"],
      ["ashamed","부끄러운"],["eager","열성적인"],["hopeful","희망찬"],["disappointed","실망한"],["delighted","매우 기쁜"],
      ["terrified","겁에 질린"],["thrilled","짜릿한"],["impatient","성급한"],["gentle","온화한"],["energetic","에너지 넘치는"]
    ],
    "몸": [
      ["head","머리"],["hair","머리카락"],["face","얼굴"],["eyes","눈"],["ears","귀"],
      ["nose","코"],["mouth","입"],["teeth","이"],["tongue","혀"],["lips","입술"],
      ["chin","턱"],["cheek","볼"],["neck","목"],["shoulder","어깨"],["arm","팔"],
      ["elbow","팔꿈치"],["wrist","손목"],["hand","손"],["finger","손가락"],["thumb","엄지손가락"],
      ["chest","가슴"],["back","등"],["waist","허리"],["hip","엉덩이"],["leg","다리"],
      ["knee","무릎"],["ankle","발목"],["foot","발"],["toe","발가락"],["stomach","배"],
      ["belly button","배꼽"],["heart","심장"],["lungs","폐"],["bone","뼈"],["skin","피부"],
      ["brain","뇌"],["blood","피"],["eyebrow","눈썹"],["eyelash","속눈썹"],["forehead","이마"],
      ["shoulder blade","어깨뼈"],["palm","손바닥"],["heel","발뒤꿈치"],["calf","종아리"],["thigh","허벅지"],
      ["rib","갈비뼈"],["vein","정맥"],["muscle","근육"],["joints","관절"],["spine","척추"]
    ],
    "일상동사": [
      ["eat","먹다"],["drink","마시다"],["sleep","자다"],["wake up","일어나다"],["sit","앉다"],
      ["stand","서다"],["walk","걷다"],["run","달리다"],["jump","점프하다"],["hop","깡충뛰다"],
      ["skip","건너뛰다"],["clap","박수치다"],["sing","노래하다"],["dance","춤추다"],["read","읽다"],
      ["write","쓰다"],["draw","그리다"],["color","색칠하다"],["play","놀다"],["play music","연주하다"],
      ["swim","수영하다"],["ride","타다"],["fly","날다"],["drive","운전하다"],["open","열다"],
      ["close","닫다"],["come","오다"],["go","가다"],["give","주다"],["take","받다"],
      ["make","만들다"],["build","짓다"],["cut","자르다"],["cook","요리하다"],["wash","씻다"],
      ["clean","청소하다"],["brush","닦다"],["look","보다"],["listen","듣다"],["hear","들리다"],
      ["talk","말하다"],["tell","이야기하다"],["cry","울다"],["laugh","웃다"],["smile","미소짓다"],
      ["think","생각하다"],["help","돕다"],["hold","잡다"],["push","밀다"],["pull","당기다"]
    ]
  };

  // ====== 상태 ======
  const $ = (id)=>document.getElementById(id);
  const categorySel=$('category'), grid=$('grid'), pageInfo=$('pageInfo');
  const nextBtn=$('nextBtn'), prevBtn=$('prevBtn');
  const shuffleBtn=$('shuffleBtn'), playAllBtn=$('playAllBtn'), pauseBtn=$('pauseBtn'), stopBtn=$('stopBtn');
  const rateEl=$('rate'), rateVal=$('rateVal');

  let currentCategory = Object.keys(WORDS)[0];
  let order = [...Array(WORDS[currentCategory].length).keys()];
  let page = 0;

  // 재생 상태
  let playQueue = [];
  let isPlaying = false;
  let isPaused = false;
  let lastMode = 'all'; // 'all' | 'page'

  // ====== TTS 가드 ======
  const hasTTS = ('speechSynthesis' in window) && (typeof window.SpeechSynthesisUtterance !== 'undefined');
  function synth(){ return hasTTS ? window.speechSynthesis : null; }

  let voices = [];
  function refreshVoices(){ try{ const s=synth(); voices = s && s.getVoices ? s.getVoices() : []; }catch(_){ voices=[]; } }
  refreshVoices(); if(hasTTS && synth()) synth().onvoiceschanged = refreshVoices;

  function pickVoice(lang){ if(!voices.length) return null; const v=voices.find(v=>v.lang && v.lang.toLowerCase().startsWith(lang)); return v||voices[0]; }

  function enqueuePair(en,ko){ playQueue.push({text:en,lang:'en'},{text:ko,lang:'ko'}); }
  function buildCategoryQueue(){ playQueue=[]; WORDS[currentCategory].forEach(([en,ko])=>enqueuePair(en,ko)); lastMode='all'; return playQueue.length; }
  function buildPageQueue(){ playQueue=[]; const start=page*10; const list=WORDS[currentCategory]; order.slice(start,start+10).forEach(i=>{ const [en,ko]=list[i]; enqueuePair(en,ko); }); lastMode='page'; return playQueue.length; }

  function startQueue(){
    if(playQueue.length===0){ isPlaying=false; updateControls(); return; }
    const s = synth(); if(!s){ isPlaying=false; playQueue=[]; updateControls(); return; }
    isPlaying = true;
    const {text,lang} = playQueue.shift();
    const u = new SpeechSynthesisUtterance(text); const v=pickVoice(lang); if(v) u.voice=v;
    u.lang=(lang==='en'?'en-US':'ko-KR'); u.rate=parseFloat(rateEl.value||'1');
    u.onend = ()=> setTimeout(()=>{
      if(!isPlaying || isPaused){ updateControls(); return; }
      if(playQueue.length>0) startQueue(); else { isPlaying=false; updateControls(); }
    },120);
    s.speak(u);
    updateControls();
  }

  function stopAll(){ try{ const s=synth(); if(s) s.cancel(); }catch(_){}
    isPlaying=false; isPaused=false; playQueue=[]; updateControls(); }

  function updateControls(){
    const s = synth();
    if(!s){ pauseBtn.textContent='▶ 재생'; return; }
    pauseBtn.textContent = (isPaused ? '▶ 재개' : (s.speaking ? '⏸ 일시정지' : '▶ 재생'));
  }

  // ====== UI 렌더 ======
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
      const b1=document.createElement('button'); b1.textContent='▶ EN'; b1.addEventListener('click',()=>{ const s=synth(); if(s && (s.speaking||s.paused)) return; speak(en,'en'); });
      const b2=document.createElement('button'); b2.textContent='▶ KO'; b2.addEventListener('click',()=>{ const s=synth(); if(s && (s.speaking||s.paused)) return; speak(ko,'ko'); });
      tts.appendChild(b1); tts.appendChild(b2);
      card.appendChild(enEl); card.appendChild(koEl); card.appendChild(tts);
      grid.appendChild(card);
    });
    const totalPages=Math.ceil(order.length/10); pageInfo.textContent=`${page+1} / ${totalPages}`;
  }

  function speak(text,lang){
    try{
      const s=synth(); if(!s) return;
      const u=new SpeechSynthesisUtterance(text); const v=pickVoice(lang); if(v) u.voice=v;
      u.lang=(lang==='en'?'en-US':'ko-KR'); u.rate=parseFloat(rateEl.value||'1'); s.speak(u);
    }catch(_){}
  }

  // ====== 이벤트 ======
  categorySel.addEventListener('change', ()=>{ currentCategory=categorySel.value; order=[...Array(WORDS[currentCategory].length).keys()]; page=0; stopAll(); render(); });
  nextBtn.addEventListener('click', ()=>{ const tp=Math.ceil(order.length/10); page=(page+1)%tp; stopAll(); render(); });
  prevBtn.addEventListener('click', ()=>{ const tp=Math.ceil(order.length/10); page=(page-1+tp)%tp; stopAll(); render(); });
  shuffleBtn.addEventListener('click', ()=>{ for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; } page=0; stopAll(); render(); });
  rateEl.addEventListener('input', ()=>{ rateVal.textContent=(parseFloat(rateEl.value)||1).toFixed(1)+'x'; });

  playAllBtn.addEventListener('click', ()=>{ stopAll(); buildCategoryQueue(); isPaused=false; startQueue(); });
  pauseBtn.addEventListener('click', ()=>{
    const s=synth(); if(!s) return;
    if(!isPaused){ // 일시정지
      isPaused = true;
      try{ s.cancel(); }catch(_){}
    }else{ // 재개
      isPaused = false;
      if(playQueue.length===0){
        if(lastMode==='page') buildPageQueue(); else buildCategoryQueue();
      }
      startQueue();
    }
    updateControls();
  });
  stopBtn.addEventListener('click', stopAll);

  // 초기화
  (function init(){
    renderOptions(); render(); updateControls();
    if(!hasTTS){
      const warn = document.getElementById('ttsWarn');
      if(warn) warn.textContent = '· 이 브라우저는 음성합성이 제한될 수 있어요.';
    }
  })();
})();