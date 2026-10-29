const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountDashboard(data){
 const [assets,route,points]=await Promise.all(['./assets.json','./route.geojson','./checkpoints.geojson'].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error('Could not load '+u);return r.json()})));
 const asset=id=>assets.find(a=>a.id===id);
 const fallback={'v2-training':'seq-photo-01','v2-pregame':'seq-photo-02','v2-start':'seq-photo-03'};
 const picture=id=>asset(id)||asset(fallback[id]);
 const img=(id,cls='')=>{const a=picture(id);return a?`<img class="${cls}" src="${a.url}" alt="${esc(a.alt)}">`:''};
 const story=data.roleplay||{};
 const miles=data.rides.reduce((s,r)=>s+r.distance_tenths_mile,0)/10,seconds=data.rides.reduce((s,r)=>s+r.moving_duration_seconds,0),days=new Set(data.rides.map(r=>r.local_date)).size;
 const weekly=Array.from({length:20},(_,i)=>data.rides.filter(r=>r.week_index===i+1).reduce((s,r)=>s+r.distance_tenths_mile/10,0));
 const metrics=()=>`<div class="prep-metrics"><div><strong>20 weeks</strong><span>of preparation</span></div><div><strong>${days}</strong><span>training days</span></div><div><strong>${miles.toLocaleString()}</strong><span>miles ridden</span></div><div><strong>${Math.floor(seconds/3600)}h ${Math.round(seconds%3600/60)}m</strong><span>time training</span></div></div>`;
 const chart=()=>`<div class="mini-chart" aria-label="Weekly training distance">${weekly.map((n,i)=>`<button data-prep-week="${i+1}" aria-label="Week ${i+1}, ${n.toFixed(1)} miles"><span style="height:${n/Math.max(...weekly)*100}%"></span></button>`).join('')}</div><div class="chart-labels"><span>Feb 21</span><span>Weekly miles</span><span>Jul 10</span></div>`;
 const attribution=()=>`<div class="quote-person"><span class="avatar-photo" aria-hidden="true" style="background-image:url('${esc(picture('seq-photo-01')?.url||'')}')"></span><span>Alex</span></div>`;
 const quotation=(text,id='')=>`<blockquote class="story-quote" ${id?`data-source-turn="${esc(id)}"`:''}><p>${esc(text)}</p>${attribution()}</blockquote>`;
 const passageView=b=>`<div class="interview-passage">${attribution()}<blockquote>${(b.passages?.length?b.passages:[{text:b.quote,source_turn_id:b.source_turn_id}]).map(p=>`<p data-source-turn="${esc(p.source_turn_id)}">${esc(p.display_text||p.text)}</p>`).join('')}</blockquote></div>`;
 let narrative='direct',selected=-1;
 const directItem=b=>story.direct?.items[b.id||'overview'];
 const narrativeTitle=b=>narrative==='direct'?(directItem(b)?.title||b.title):b.title;
 const narrativeView=b=>narrative==='direct'&&directItem(b)?`<div class="direct-reflection"><p class="reflection-address">For you, Alex</p>${directItem(b).paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:passageView(b);
 const opening=story.overview?.quote||'That it happened and that I can carry that with me';
 document.querySelector('#dashboard').innerHTML=`<div class="dashboard-heading"><div><p class="eyebrow">ALEX’S JOURNEY · STP 2026</p><h1>The miles. <em>The people.</em> The whole story.</h1></div><div class="narrative-switch" role="group" aria-label="Narrative approach"><button data-narrative="direct" aria-pressed="true">For Alex</button></div></div>
 <div class="journey-layout"><nav class="moment-strip" aria-label="Journey table of contents"></nav><div class="journey-content">
 <div id="overview-panel"><section class="overview-card overview-athlete"><div class="card-top"><p class="eyebrow">ALEX / HIS STORY</p><button id="arc-open" class="card-link">Read his story ↗</button></div><h2>${esc(narrativeTitle(story.overview)||'The person behind the miles.')}</h2><div class="overview-story-body"><div class="overview-portrait">${img('seq-photo-01')}</div><div class="overview-story-words">${narrativeView(story.overview)}</div></div></section>
 <section class="overview-card overview-preparation"><div class="card-top"><p class="eyebrow">THE PREPARATION</p><button id="training-open" class="card-link">Explore training ↗</button></div><h2>Twenty weeks of showing up.</h2><button class="training-photo" id="training-photo" aria-label="Explore Alex’s complete training history">${img('v2-training')}</button>${metrics()}${chart()}</section></div>
 <section id="moment-panel" class="moment-panel" aria-live="polite" hidden></section>
 <div class="map-shell"><div class="map-legend"><span><i class="ride-key"></i>STP course</span><span><i class="car-key"></i>Shared travel</span><span id="map-status" role="status"></span></div><div id="journey-map" aria-label="Interactive whole journey map"></div></div>
 </div></div>
 <dialog id="training-dialog"><div class="dialog-top"><p class="eyebrow">THE COMPLETE PREPARATION</p><button data-close="training-dialog" aria-label="Close training history">✕</button></div><h2>Your training rides.</h2><p class="small">The chart uses the preserved synthetic training ledger. In the role-play interview, Alex recalled 75 training days over four months and about 3,000 miles. Those estimates are kept separate from the ledger’s 20 weeks and 2,836.5 miles.</p><div id="training-history"></div></dialog>
 <dialog id="arc-dialog"><div class="dialog-top"><p class="eyebrow">ALEX / HIS STORY</p><button data-close="arc-dialog" aria-label="Close personal story">✕</button></div><h2>The person behind the miles.</h2><div id="arc-reading"></div></dialog>
 <dialog id="about-dialog"><div class="dialog-top"><p class="eyebrow">ABOUT THIS EXPERIENCE</p><button data-close="about-dialog" aria-label="Close demo details">✕</button></div><h2>A story in progress.</h2><p>This local demo uses Will’s interview role-playing fictional Alex. This finished example uses curated editorial reflections addressed to Alex. It was prepared through an iterative interview and editorial review; it was not generated by the simulated interview on the main demo page. No raw interview transcript is included in this hosted example. Images are generated illustrations, not photographs of the people or event. The cheering image is a provisional example.</p><p>The preparation chart preserves a synthetic 20-week ledger; Alex’s recalled four months and roughly 3,000 miles are estimates from the role-play, not replacements for those records.</p><p>The map uses <a href="https://ridewithgps.com/routes/51758476" target="_blank" rel="noreferrer">Cascade’s published 2026 STP route</a>. It is not Alex’s GPS track. Training, meetup, approach and return markers are illustrative placements; dashed travel lines show connections, not roads driven. The skyline recollection does not establish a particular mountain or viewpoint.</p><p>Use Try your own story to explore the separate browser-local workflow. No real accounts or live AI interview are connected here.</p></dialog>`;
 // Preserve the existing, already-bound ledger and individual ride interactions.
 for(const selector of ['#chapter-1 .metrics','#chapter-1 .chart-panel','#calendar']){const el=document.querySelector(selector);if(el)document.querySelector('#training-history').append(el)}
 const trainingDialog=document.querySelector('#training-dialog');
 function openTraining(week){if(!trainingDialog.open)trainingDialog.showModal();const calendar=document.querySelector('#calendar');if(calendar)calendar.open=true;if(week){document.querySelector('#week-summary').textContent=`Week ${week} · ${weekly[week-1].toFixed(1)} miles`;requestAnimationFrame(()=>document.querySelector('#week-'+week)?.scrollIntoView({block:'center'}))}}
 const bindTraining=()=>document.querySelectorAll('[data-prep-week]').forEach(b=>b.onclick=()=>openTraining(Number(b.dataset.prepWeek)));
 document.querySelector('#training-open').onclick=()=>openTraining();document.querySelector('#training-photo').onclick=()=>openTraining();bindTraining();
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
 document.querySelector('#arc-open').onclick=()=>document.querySelector('#arc-dialog').showModal();
 document.querySelector('#about-open').onclick=()=>document.querySelector('#about-dialog').showModal();
 const renderArc=()=>document.querySelector('#arc-reading').innerHTML=(story.beats||[]).filter(b=>['return','prep','rack','reflection'].includes(b.id)).map(b=>`<section class="arc-section"><h3>${esc(narrativeTitle(b))}</h3>${narrativeView(b)}</section>`).join('')||quotation(opening);renderArc();
 const coordinates=route.type==='FeatureCollection'?route.features.find(f=>f.geometry.type==='LineString').geometry.coordinates:route.geometry.coordinates;
 const start=[coordinates[0][1],coordinates[0][0]],finish=[coordinates.at(-1)[1],coordinates.at(-1)[0]];
 const features=points.features||[];
 function point(pattern,fallbackLoc){const p=features.find(f=>new RegExp(pattern,'i').test([f.properties.id,f.properties.name].join(' ')));return p?[p.geometry.coordinates[1],p.geometry.coordinates[0]]:fallbackLoc}
 const mid=point('midpoint|chehalis',[46.65,-122.96]);
 const frames={return:{loc:[start[0]+.045,start[1]-.055],zoom:12},prep:{loc:[start[0]+.025,start[1]-.035],zoom:12},rack:{loc:[start[0]-.035,start[1]-.04],zoom:12},start:{loc:start,zoom:13},effort:{loc:point('spanaway',[47.1,-122.43]),zoom:12},challenge:{loc:[mid[0]-.04,mid[1]],zoom:12},approach:{loc:[finish[0]+.006,finish[1]-.004],zoom:14},finish:{loc:finish,zoom:14},pizza:{loc:[finish[0]-.002,finish[1]+.003],zoom:14},'return-dinner':{loc:[46.7,-122.70],zoom:11},reflection:{}};
 const events=(story.beats||[]).map(b=>({...b,...(frames[b.id]||frames[b.frame_key]||{}),label:b.nav_label}));
 const map=L.map('journey-map',{scrollWheelZoom:false}).setView([46.5,-122.6],7);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:18}).addTo(map);
 let tileErrors=0;tiles.on('tileerror',()=>{if(++tileErrors>3)document.querySelector('#map-status').textContent='Basemap unavailable · route remains visible';});
 const path=L.geoJSON(route,{style:{color:'#256b58',weight:4,opacity:.9}}).addTo(map);
 const travel=L.polyline([frames.rack.loc,[47,-122.64],[46.4,-122.7],[45.8,-122.73],finish],{color:'#bc7149',weight:2,dashArray:'7 7',opacity:.65}).addTo(map);
 L.polyline([finish,[45.8,-122.7],frames['return-dinner'].loc,[47,-122.6],[start[0]-.08,start[1]+.035]],{color:'#bc7149',weight:2,dashArray:'7 7',opacity:.8}).addTo(map);
 travel.bindTooltip('Shared travel · illustrative connection');
 const markers=[];
 events.forEach((e,i)=>{if(!e.loc||e.reflection)return;const icon=L.divIcon({className:'number-marker',html:`<button aria-label="${i+1}. ${esc(e.label)}"><span>${i+1}</span></button>`,iconSize:[30,30],iconAnchor:[15,15]});markers[i]=L.marker(e.loc,{icon,keyboard:false}).addTo(map).bindTooltip(e.label,{direction:'top',offset:[0,-12]}).on('click',()=>select(i));});
 document.querySelector('.moment-strip').innerHTML='<button data-event="-1" aria-pressed="true"><span class="beat-number">◎</span><span class="beat-label">Overview</span></button>'+events.map((e,i)=>`<button data-event="${i}" aria-pressed="false"><span class="beat-number">${String(i+1).padStart(2,'0')}</span><span class="beat-label">${esc(e.label)}</span></button>`).join('');
 function all(){map.stop();map.invalidateSize({pan:false});const bounds=path.getBounds();events.filter(e=>e.loc).forEach(e=>bounds.extend(e.loc));map.fitBounds(bounds,{padding:[35,35],animate:false});}
 function select(i,reframe=true){
  selected=i;
  const e=events[i];document.querySelector('#overview-panel').hidden=i!==-1;document.querySelector('#moment-panel').hidden=i===-1;
  document.querySelectorAll('[data-event]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.event)===i)));markers.forEach((m,j)=>m.getElement()?.classList.toggle('is-selected',i===j));
  if(i===-1){if(reframe)all();document.querySelector('#journey-map').dataset.frame='overview';return;}
  const panel=document.querySelector('#moment-panel');panel.dataset.beat=e.id;
  const photo=e.id==='finish'?'seq-photo-10':e.photo;const hasImage=!!picture(photo);
  panel.innerHTML=`<div class="moment-title"><p class="eyebrow">${esc(e.eyebrow||e.label)}</p><h2>${esc(narrativeTitle(e))}</h2>${e.id==='prep'?'<button id="moment-training" class="card-link">Explore training ↗</button>':''}</div><div class="moment-body ${hasImage?'':'without-image'} ${e.id==='prep'?'training-moment':''} ${e.id==='reflection'?'reflection-moment':''}">${hasImage?`<figure class="moment-image">${img(photo)}</figure>`:''}<div class="moment-words">${narrativeView(e)}${e.id==='prep'?`<div class="moment-training-data">${metrics()}${chart()}</div>`:''}</div></div>`;
  panel.scrollTop=0;document.querySelector('#moment-training')?.addEventListener('click',()=>openTraining());bindTraining();
  if(reframe){map.stop();map.invalidateSize({pan:false});if(e.loc&&!e.reflection)map.setView(e.loc,e.zoom,{animate:false});else all();document.querySelector('#journey-map').dataset.frame=e.id;}
 }
 document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>select(Number(b.dataset.event)));
 function setNarrative(next){
  document.title=next==='direct'?'STP · A finished example':'STP · A finished example';
  narrative=next;document.querySelector('#dashboard').dataset.narrative=next;
  document.querySelectorAll('[data-narrative]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.narrative===next)));
  document.querySelector('.overview-athlete h2').textContent=narrativeTitle(story.overview);
  document.querySelector('.overview-story-words').innerHTML=narrativeView(story.overview);
  document.querySelector('.overview-athlete .eyebrow').textContent=next==='direct'?'ALEX / YOUR STORY':'ALEX / HIS STORY';
  document.querySelector('#arc-open').textContent=next==='direct'?'Read your story ↗':'Read his story ↗';
  document.querySelector('#arc-dialog h2').textContent=next==='direct'?'Your ride, and what it meant.':'The person behind the miles.';
  renderArc();select(selected,false);
 }
 document.querySelectorAll('[data-narrative]').forEach(b=>b.onclick=()=>setNarrative(b.dataset.narrative));

 let mode='view';function setMode(next){mode=next;document.body.dataset.mode=next;document.querySelector('#dashboard').hidden=next!=='view';document.querySelector('#contribute').hidden=next==='view';document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===next)));window.scrollTo({top:0,behavior:'instant'});if(next==='view')requestAnimationFrame(()=>map.invalidateSize({pan:false}));}
 document.querySelectorAll('button[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 document.querySelector('.brand').onclick=e=>{e.preventDefault();setMode('view');select(-1);};
 setMode('view');setNarrative('direct');all();
 new ResizeObserver(()=>{if(mode==='view')map.invalidateSize({pan:false})}).observe(document.querySelector('#journey-map'));
}
