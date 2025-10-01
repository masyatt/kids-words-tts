// 간이 예외사전: 필요 시 원하는 표기로 덮어쓰기(소문자 기준)
const EXCEPTIONS = {
  "bear":"베어","deer":"디어","lion":"라이언","giraffe":"지래프","monkey":"몽키","sheep":"쉽",
  "chicken":"치킨","duck":"덕","goose":"구스","horse":"호스","cow":"카우","pig":"피그","dog":"도그","cat":"캣",
  "monday":"먼데이","tuesday":"튜즈데이","wednesday":"웬즈데이","thursday":"써즈데이","friday":"프라이데이",
  "january":"재뉴어리","february":"페브루어리","march":"마치","april":"에이프릴","may":"메이",
  "june":"준","july":"줄라이","august":"어거스트","september":"섭템버","october":"옥토버",
  "november":"노벰버","december":"디셈버"
};

function romanToHangulLite(input){
  const word = (input||"").toLowerCase().trim();
  if (!word) return "";
  if (EXCEPTIONS[word]) return EXCEPTIONS[word];

  const tokens = word.split(/([-\s]+)/);
  const converted = tokens.map(tok => {
    if (/^[-\s]+$/.test(tok)) return tok.replace(/\s+/g,' ').replace(/-/g,'·');
    return convertToken(tok);
  }).join('');
  return converted;

  function convertToken(tok){
    // 특수 철자군 우선
    const specials = [
      [/tion$/g,"션"], [/sion$/g,"션"], [/ture$/g,"쳐"],
      [/cia|sia/g,"샤"], [/cie|sie/g,"시"],
      [/qu/g,"쿠"], [/ck/g,"크"], [/ph/g,"프"],
      [/sh/g,"쉬"], [/ch/g,"치"], [/th/g,"쓰"],
      [/ng$/g,"ㅇ"], [/ng/g,"응"]
    ];
    let s = tok;
    specials.forEach(([re, rep])=>{ s = s.replace(re, rep); });

    const vowels = {'a':'아','e':'에','i':'이','o':'오','u':'우','y':'이'};
    const consBase = {
      b:'브', c:'크', d:'드', f:'프', g:'그', h:'흐', j:'지', k:'크', l:'를',
      m:'므', n:'느', p:'프', q:'쿠', r:'르', s:'스', t:'트', v:'브', w:'우',
      x:'엑스', y:'이', z:'즈'
    };
    function softC(next){ return (next && /[eiy]/.test(next)) ? '스' : '크'; }
    function softG(next){ return (next && /[eiy]/.test(next)) ? '지' : '그'; }

    let out = '';
    for (let i=0; i<s.length; i++){
      const ch = s[i];
      if (/[가-힣]/.test(ch)) { out += ch; continue; }
      if (!/[a-z]/.test(ch)) { out += ch; continue; }
      if (vowels[ch]) { out += vowels[ch]; continue; }

      let base;
      if (ch==='c') base = softC(s[i+1]);
      else if (ch==='g') base = softG(s[i+1]);
      else base = consBase[ch] || ch;

      if (/[a-z]/.test(s[i+1]) && vowels[s[i+1]] && /[가-힣]/.test(base)){
        const vv = vowels[s[i+1]];
        if (/[브드그프즈츠르므느스트]/.test(base)) {
          out += base.replace(/.$/, vv[0]);
        } else if (base === '우' || base === '이' || base === '엑스') {
          out += base + vv;
        } else {
          out += base + vv;
        }
        i++;
      } else {
        out += base;
      }
    }
    out = out
      .replace(/으아/g,'아').replace(/으에/g,'에').replace(/으이/g,'이').replace(/으오/g,'오').replace(/으우/g,'우')
      .replace(/르으/g,'르').replace(/느으/g,'느').replace(/므으/g,'므')
      .replace(/  +/g,' ').trim();
    return out;
  }
}

function applyPron(){
  const grid = document.getElementById('grid');
  if (!grid) return;
  const ens = grid.querySelectorAll('.en');
  ens.forEach(el=>{
    if (el.querySelector('.pron')) return;
    const enText = (el.childNodes[0]?.nodeValue || el.textContent || '').trim();
    if (!enText) return;
    const pron = romanToHangulLite(enText);
    const span = document.createElement('span');
    span.className = 'pron';
    span.textContent = pron;
    el.appendChild(span);
  });
}

const gridEl = document.getElementById('grid');
const mo = new MutationObserver(()=> applyPron());
if (gridEl) mo.observe(gridEl, {childList:true, subtree:true});
document.addEventListener('DOMContentLoaded', ()=> setTimeout(applyPron, 0));
