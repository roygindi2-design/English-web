import { chromium } from 'playwright';
const paths = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(()=>chromium.launch());
const ctx = await b.newContext({ viewport:{width:375,height:780}, deviceScaleFactor:2 });
for (const p of paths) {
  const page = await ctx.newPage();
  const errs=[]; page.on('console', m=>{ if(m.type()==='error') errs.push(m.text().slice(0,120)); });
  try {
    await page.goto('http://127.0.0.1:3000'+p, { waitUntil:'networkidle', timeout:45000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(()=>{
      const tappable=[...document.querySelectorAll('button,a,[role=button],input,select,textarea,[onclick]')].filter(e=>e.offsetParent!==null);
      const small=tappable.filter(e=>{const b=e.getBoundingClientRect();return b.width<44||b.height<44;});
      const h=[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent.trim()).slice(0,4);
      return { chars: document.body.innerText.replace(/\s+/g,' ').trim().length,
        taps: tappable.length, under44: small.length,
        smallLabels: small.slice(0,6).map(e=>(e.textContent||e.getAttribute('aria-label')||'?').trim().slice(0,24)),
        hscroll: document.documentElement.scrollWidth>375+1,
        headings:h,
        text: document.body.innerText.replace(/\s+/g,' ').trim().slice(0,180) };
    });
    console.log(p, JSON.stringify({...r, errs:errs.slice(0,3)}, null, 0));
  } catch(e){ console.log(p, 'ERR', String(e).slice(0,100)); }
  await page.close();
}
await b.close();
