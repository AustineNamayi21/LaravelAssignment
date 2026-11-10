(()=>{
const API='/api',$=s=>document.querySelector(s),app=$('#app');
const S={tok:localStorage.tok||'',me:JSON.parse(localStorage.me||'null'),tab:'all'};
let liked,follows;
const load=()=>{const g=k=>new Set(JSON.parse(localStorage[k+S.me?.id]||'[]'));liked=g('l');follows=g('f')};
const keep=(k,s)=>localStorage[k+S.me.id]=JSON.stringify([...s]);
const sv=p=>`<svg viewBox="0 0 24 24">${p}</svg>`;
const I={heart:sv('<path d="M12 21s-7.5-4.6-9.6-9.4A5.4 5.4 0 0 1 12 6.6a5.4 5.4 0 0 1 9.6 5C19.5 16.4 12 21 12 21z"/>'),chat:sv('<path d="M4 5h16v11H9l-5 4z"/>'),trash:sv('<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>'),pen:sv('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),x:sv('<path d="M6 6l12 12M18 6L6 18"/>'),
img:sv('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5L5 20"/>'),sun:sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),out:sv('<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>')};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ago=d=>{let s=(Date.now()-new Date(d))/1000;if(s<60)return'just now';s/=60;if(s<60)return~~s+' min ago';s/=60;if(s<24)return~~s+' h ago';s/=24;return s<7?~~s+' d ago':new Date(d).toLocaleDateString()};
const av=(n,s=40)=>`<span class="av" style="--s:${s}px;--h:${[...n].reduce((a,c)=>a+c.charCodeAt(0),0)*7%360}">${esc(n[0]||'?').toUpperCase()}</span>`;
const toast=(m,bad)=>{const t=document.createElement('div');t.className='toast'+(bad?' bad':'');t.textContent=m;$('#toasts').append(t);setTimeout(()=>t.remove(),3200)};
const go=h=>location.hash===h?render():location.hash=h;
const first=x=>Object.values(x.errors||{}).flat()[0]||x.message;

async function api(path,{method='GET',body,form}={}){
  const h={Accept:'application/json'};if(S.tok)h.Authorization='Bearer '+S.tok;
  let b=form;if(body){h['Content-Type']='application/json';b=JSON.stringify(body)}
  const r=await fetch(API+path,{method,headers:h,body:b}),d=await r.json().catch(()=>({}));
  if(r.status===401&&S.tok)out(true);
  if(!r.ok){const e=new Error(d.message||'Something went wrong');e.errors=d.errors||{};throw e}
  return d}
async function out(quiet){if(!quiet)try{await api('/logout',{method:'POST'})}catch{}
  S.tok='';S.me=null;delete localStorage.tok;delete localStorage.me;go('#/login')}

const field=(n,l,t,a)=>`<label for="${n}">${l}</label><input id="${n}" name="${n}" type="${t}" autocomplete="${a}" required>`;
function auth(reg){
  app.innerHTML=`<div class="wrap"><div class="hero"><h1>${[...'Mkondo'].map((c,k)=>`<span style="--k:${k}">${c}</span>`).join('')}</h1><p>Short posts, photos and the people behind them.</p></div>
  <form class="card auth">${reg?field('name','Name','text','name'):''}${field('email','Email','email','email')}${field('password','Password (8+ characters)','password',reg?'new-password':'current-password')}${reg?field('password_confirmation','Confirm password','password','new-password'):''}
  <div class="err" role="alert"></div><button class="btn">${reg?'Create account':'Log in'}</button>
  <p class="sw">${reg?'Have an account? <a href="#/login">Log in</a>':'New here? <a href="#/register">Create an account</a>'}</p></form></div>`;
  $('form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('.btn');b.disabled=true;
    try{const d=await api(reg?'/register':'/login',{method:'POST',body:Object.fromEntries(new FormData(e.target))});
      S.tok=localStorage.tok=d.token;S.me=d.user;localStorage.me=JSON.stringify(d.user);load();go('#/')}
    catch(x){e.target.querySelector('.err').textContent=first(x);b.disabled=false}}}

const theme=()=>{const t=document.documentElement.dataset.theme=='dark'?'light':'dark';document.documentElement.dataset.theme=localStorage.theme=t};
const shell=h=>{app.innerHTML=`<nav class="top"><a class="brand" href="#/">Mkondo<i>.</i></a><a class="chip" href="#/u/${S.me.id}">${av(S.me.name,32)}${esc(S.me.name)}</a><button class="ib" id="th" title="Switch theme" aria-label="Switch theme">${I.sun}</button><button class="ib" id="lo" title="Log out" aria-label="Log out">${I.out}</button></nav><main class="wrap">${h}</main>`;
  $('#th').onclick=theme;$('#lo').onclick=()=>out()};

const P={};
const post=(p,i=0)=>{P[p.id]=p;const own=p.author.id===S.me.id,on=liked.has(p.id),fl=follows.has(p.author.id);
  return `<article class="card post in" style="--i:${i}" data-id="${p.id}"><header><a class="who" href="#/u/${p.author.id}">${av(p.author.name)}<span><b>${esc(p.author.name)}</b><small>${ago(p.created_at)}</small></span></a>${own?`<button class="ib" data-a="ep" title="Edit post" aria-label="Edit post">${I.pen}</button><button class="ib" data-a="del" title="Delete post" aria-label="Delete post">${I.trash}</button>`:`<button class="fol ${fl?'on':''}" data-a="fol" data-u="${p.author.id}">${fl?'Following':'Follow'}</button>`}</header>${p.body?`<p>${esc(p.body)}</p>`:''}${p.image_url?`<img src="${esc(p.image_url)}" alt="Photo from ${esc(p.author.name)}" loading="lazy">`:''}<div class="foot"><button class="act ${on?'on':''}" data-a="like" aria-pressed="${on}" aria-label="Like">${I.heart}<span>${p.likes_count||0}</span></button><button class="act" data-a="cm" aria-label="Comments">${I.chat}<span>${p.comments_count||0}</span></button></div></article>`};

function fill(box,pg,base,au){
  box.querySelector('.more')?.remove();
  if(au)pg.data.forEach(p=>p.author=p.author||au);
  if(!pg.data.length&&!box.children.length){box.innerHTML=`<div class="empty">${box.dataset.empty||'No posts yet.'}</div>`;return}
  box.insertAdjacentHTML('beforeend',pg.data.map((p,i)=>post(p,Math.min(i,6))).join(''));
  const m=pg.meta;if(m&&m.current_page<m.last_page){const b=document.createElement('button');b.className='btn ghost more';b.textContent='Load more';
    b.onclick=()=>{b.disabled=true;api(base+(base.includes('?')?'&':'?')+'page='+(m.current_page+1)).then(d=>fill(box,d.posts||d,base,au)).catch(x=>{toast(x.message,1);b.disabled=false})};box.append(b)}}

async function feed(){
  shell(`<form class="card compose" id="cp">${av(S.me.name)}<div><textarea name="body" maxlength="280" rows="2" placeholder="What's flowing, ${esc(S.me.name.split(' ')[0])}?" aria-label="Write a post"></textarea><div class="prev" hidden><img alt="Selected photo"><button type="button" aria-label="Remove photo">${I.x}</button></div><div class="bar"><button type="button" class="ib" id="pick" title="Add a photo" aria-label="Add a photo">${I.img}</button><input type="file" accept="image/png,image/jpeg" hidden><span class="cnt">280</span><button class="btn" disabled>Post</button></div></div></form>
  <div class="tabs" data-t="${S.tab}"><span class="pill"></span><button data-t="all" class="${S.tab=='all'?'on':''}">For you</button><button data-t="following" class="${S.tab=='following'?'on':''}">Following</button></div><div id="list"></div>`);
  const f=$('#cp'),ta=f.elements.body,fi=f.querySelector('[type=file]'),pv=f.querySelector('.prev'),btn=f.querySelector('.btn'),cnt=f.querySelector('.cnt'),list=$('#list');
  const upd=()=>{const n=280-ta.value.length;cnt.textContent=n;cnt.classList.toggle('warn',n<20);btn.disabled=!(ta.value.trim()||fi.files[0])};
  ta.oninput=upd;$('#pick').onclick=()=>fi.click();
  fi.onchange=()=>{const x=fi.files[0];if(x&&x.size>2097152){toast('Choose a photo under 2 MB',1);fi.value=''}
    pv.hidden=!fi.files[0];if(fi.files[0])pv.querySelector('img').src=URL.createObjectURL(fi.files[0]);upd()};
  pv.querySelector('button').onclick=()=>{fi.value='';pv.hidden=true;upd()};
  f.onsubmit=async e=>{e.preventDefault();btn.disabled=true;const fd=new FormData();
    if(ta.value.trim())fd.append('body',ta.value.trim());if(fi.files[0])fd.append('image',fi.files[0]);
    try{const d=await api('/posts',{method:'POST',form:fd});list.querySelector('.empty')?.remove();
      list.insertAdjacentHTML('afterbegin',post(d.data));ta.value='';fi.value='';pv.hidden=true;upd();toast('Posted')}
    catch(x){toast(first(x),1);btn.disabled=false}};
  const tabs=document.querySelectorAll('.tabs button');
  const run=async()=>{list.innerHTML='';list.dataset.empty=S.tab=='all'?'No posts yet. Write the first one above.':'Follow people from their profiles and their posts will show up here.';
    const base='/posts'+(S.tab=='all'?'':'?following=1');try{fill(list,await api(base),base)}catch(x){toast(x.message,1)}};
  tabs.forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;$('.tabs').dataset.t=S.tab;tabs.forEach(x=>x.classList.toggle('on',x===b));run()});
  run()}

async function profile(id){
  shell('<div class="empty">Loading profile…</div>');
  try{const d=await api('/users/'+id),u=d.data,self=u.id===S.me.id,fl=follows.has(u.id);
    $('main').innerHTML=`<div class="card prof">${av(u.name,72)}<div style="flex:1"><h2>${esc(u.name)}</h2><div class="stats"><span><b id="fc">${u.followers_count}</b> followers</span><span><b>${u.following_count}</b> following</span></div></div>${self?'':`<button class="btn ${fl?'ghost':''}" id="fb">${fl?'Following':'Follow'}</button>`}</div><div id="list" data-empty="No posts yet."></div>`;
    const fb=$('#fb');if(fb){fb.dataset.u=u.id;fb.onclick=async()=>{try{const on=follows.has(u.id),r=await fol(u.id);fb.classList.toggle('ghost',!on);$('#fc').textContent=r.followers_count}catch(x){toast(x.message,1)}}}
    fill($('#list'),d.posts,'/users/'+id,u)}
  catch(x){$('main').innerHTML=`<div class="empty">${esc(x.message)}<br><a href="#/" style="color:var(--acc)">Back to the feed</a></div>`}}

const bump=(c,n)=>{const s=c.querySelectorAll('.act span')[1];s.textContent=+s.textContent+n};
const CM={},cmt=x=>(CM[x.id]=x,`<div class="c" data-id="${x.id}">${av(x.commenter.name,30)}<div><b>${esc(x.commenter.name)}</b>${esc(x.body)}</div>${x.commenter.id===S.me.id?`<button data-a="ec" data-c="${x.id}" title="Edit comment" aria-label="Edit comment">${I.pen}</button><button data-a="dc" data-c="${x.id}" title="Delete comment" aria-label="Delete comment">${I.trash}</button>`:''}</div>`);
async function comments(c,id){
  let p=c.querySelector('.cm');if(p){p.remove();return}
  p=document.createElement('div');p.className='cm';p.innerHTML='<div class="list"></div><form class="cf"><input name="body" maxlength="1000" placeholder="Add a comment" required aria-label="Add a comment"><button class="btn">Comment</button></form>';c.append(p);
  const l=p.querySelector('.list'),d=await api(`/posts/${id}/comments`);
  l.innerHTML=d.data.map(cmt).join('')||'<p class="empty" style="padding:6px">No comments yet.</p>';
  p.querySelector('form').onsubmit=async e=>{e.preventDefault();const i=e.target.elements.body;
    try{const r=await api(`/posts/${id}/comments`,{method:'POST',body:{body:i.value}});l.querySelector('.empty')?.remove();l.insertAdjacentHTML('afterbegin',cmt(r.data));i.value='';bump(c,1)}catch(x){toast(first(x),1)}};
  p.querySelector('input').focus()}

async function fol(uid){const on=follows.has(uid),r=await api(`/users/${uid}/follow`,{method:on?'DELETE':'POST'});
  on?follows.delete(uid):follows.add(uid);keep('f',follows);
  document.querySelectorAll(`[data-u="${uid}"]`).forEach(b=>{b.textContent=on?'Follow':'Following';b.classList.toggle('on',!on)});toast(on?'Unfollowed':'Followed');return r}

function editPost(c,id){
  if(c.querySelector('.ed'))return;const p=P[id];c.classList.add('editing');
  c.querySelector('header').insertAdjacentHTML('afterend',`<form class="ed"><textarea name="body" maxlength="280" rows="3" aria-label="Edit post">${esc(p.body||'')}</textarea>${p.image_url?'<label class="chk"><input type="checkbox" name="rm"> Remove photo</label>':''}<div class="bar"><button type="button" class="ib" title="${p.image_url?'Replace photo':'Add a photo'}" aria-label="Change photo">${I.img}</button><input type="file" accept="image/png,image/jpeg" hidden><span class="nm"></span><button type="button" class="btn ghost" data-a="ex" style="margin-left:auto">Cancel</button><button class="btn">Save</button></div></form>`);
  const f=c.querySelector('.ed'),fi=f.querySelector('[type=file]');
  f.querySelector('.ib').onclick=()=>fi.click();
  fi.onchange=()=>{if(fi.files[0]&&fi.files[0].size>2097152){toast('Choose a photo under 2 MB',1);fi.value=''}f.querySelector('.nm').textContent=fi.files[0]?.name||''};
  f.onsubmit=async e=>{e.preventDefault();const fd=new FormData();fd.append('_method','PUT');fd.append('body',f.elements.body.value.trim());
    if(fi.files[0])fd.append('image',fi.files[0]);if(f.elements.rm?.checked)fd.append('remove_image','1');
    try{const r=await api('/posts/'+id,{method:'POST',form:fd}),n=c.querySelectorAll('.act span');
      c.outerHTML=post({...r.data,likes_count:+n[0].textContent,comments_count:+n[1].textContent});toast('Saved')}catch(x){toast(first(x),1)}}}

function editComment(k,cid){
  k.innerHTML=`${av(CM[cid].commenter.name,30)}<form class="cf"><input maxlength="1000" required aria-label="Edit comment" value="${esc(CM[cid].body)}"><button class="btn">Save</button><button type="button" class="btn ghost" data-a="cx">Cancel</button></form>`;
  const i=k.querySelector('input');i.focus();
  k.querySelector('form').onsubmit=async e=>{e.preventDefault();
    try{const r=await api('/comments/'+cid,{method:'PUT',body:{body:i.value}});k.outerHTML=cmt(r.data);toast('Saved')}catch(x){toast(first(x),1)}}}

app.onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const c=b.closest('.post'),id=+c.dataset.id,a=b.dataset.a;
  try{
    if(a=='like'){const on=liked.has(id),r=await api(`/posts/${id}/like`,{method:on?'DELETE':'POST'});
      on?liked.delete(id):liked.add(id);keep('l',liked);b.classList.toggle('on',!on);b.setAttribute('aria-pressed',!on);b.lastChild.textContent=r.likes_count}
    else if(a=='del'){if(!confirm('Delete this post and its comments?'))return;await api('/posts/'+id,{method:'DELETE'});c.classList.add('gone');setTimeout(()=>c.remove(),350);toast('Deleted')}
    else if(a=='cm')await comments(c,id);
    else if(a=='fol')await fol(+b.dataset.u);
    else if(a=='ep')editPost(c,id);
    else if(a=='ex'){c.querySelector('.ed').remove();c.classList.remove('editing')}
    else if(a=='ec')editComment(b.closest('.c'),+b.dataset.c);
    else if(a=='cx'){const k=b.closest('.c');k.outerHTML=cmt(CM[+k.dataset.id])}
    else if(a=='dc'){await api('/comments/'+b.dataset.c,{method:'DELETE'});b.closest('.c').remove();bump(c,-1)}
  }catch(x){toast(x.message,1)}};

function render(){
  const h=location.hash.slice(1)||'/';
  if(!S.tok)return auth(h=='/register');
  if(h=='/login'||h=='/register')return go('#/');
  const m=h.match(/^\/u\/(\d+)/);m?profile(+m[1]):feed()}

document.documentElement.dataset.theme=localStorage.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
load();window.onhashchange=render;render();
})();
