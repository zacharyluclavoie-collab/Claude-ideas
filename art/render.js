/* Renders the code-drawn sprites (genart.js) and the hero frog (frogart.js) to PNG files in art/out/.
   Usage: node art/render.js      (needs: npm i playwright) */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const here=__dirname,out=path.join(here,'out');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.setContent('<html><body></body></html>');
await p.addScriptTag({content:'(function(){'+fs.readFileSync(path.join(here,'genart.js'),'utf8').replace('module.exports={ART,names:Object.keys(ART)};','window.ART=ART;')+'})();'});
await p.addScriptTag({content:'(function(){'+fs.readFileSync(path.join(here,'frogart.js'),'utf8').replace('module.exports={frog};','window.frog=frog;')+'})();'});
fs.mkdirSync(out,{recursive:true});
for(const n of await p.evaluate(()=>Object.keys(window.ART))){
  const d=await p.evaluate(n=>{const c=document.createElement('canvas');c.width=c.height=512;window.ART[n](c.getContext('2d'));return c.toDataURL('image/png')},n);
  fs.writeFileSync(path.join(out,n+'.png'),Buffer.from(d.split(',')[1],'base64'))}
for(const pose of ['idle','open','chew']){
  const d=await p.evaluate(pose=>{const c=document.createElement('canvas');c.width=1000;c.height=790;window.frog(c.getContext('2d'),pose);return c.toDataURL('image/png')},pose);
  fs.writeFileSync(path.join(out,'frog_'+pose+'.png'),Buffer.from(d.split(',')[1],'base64'))}
console.log('wrote PNGs to',out);await b.close()})();
