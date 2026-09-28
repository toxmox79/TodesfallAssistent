const DB_NAME='sterbefall_assistent_db', DB_VERSION=2;
let db;
const state={route:'welcome', persons:[], activePersonId:null, cases:[], settings:{simpleMode:true}, filter:'Alle', editPersonId:null};

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const d=req.result;
      ['profile','case','docs','settings','persons','cases','meta'].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s)});
    };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
function idbGet(store,key){return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbSet(store,key,val){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(val,key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmtDate(v){if(!v)return ''; const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('de-DE')}
function uid(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
function activePerson(){return state.persons.find(p=>p.id===state.activePersonId)||null}
function personName(p){return p?[p.profile?.firstName,p.profile?.lastName].filter(Boolean).join(' ')||'Unbenannte Person':'Keine Person gewählt'}
function relationLabel(v){return ({self:'Ich',partner:'Partner/in',mother:'Mutter',father:'Vater',child:'Kind',sibling:'Geschwister',other:'Andere Person'})[v]||'Angehörige/r'}
function completion(p=activePerson()){
  if(!p)return 0;
  const x=p.profile||{};
  const keys=['firstName','lastName','birthDate','street','zip','city','phone','email','maritalStatus','healthInsurance'];
  const base=keys.filter(k=>x[k]).length;
  const emergency=(p.emergencyContacts||[]).length?1:0;
  return Math.round((base+emergency)/(keys.length+1)*100);
}
function docsOf(p=activePerson()){return p?.documents||{}}

const nav=()=>`<nav class="bottom-nav no-print">
<button class="nav-btn ${state.route==='home'?'active':''}" onclick="go('home')"><span class="ni">⌂</span>Start</button>
<button class="nav-btn ${state.route==='documents'?'active':''}" onclick="go('documents')"><span class="ni">▤</span>Dokumente</button>
<button class="nav-btn ${state.route==='case'?'active':''}" onclick="go('case')"><span class="ni">◷</span>Sterbefall</button>
<button class="nav-btn ${state.route==='profile'?'active':''}" onclick="go('profile')"><span class="ni">●</span>Profil</button>
</nav>`;
function appTop(title,sub=''){return `<div class="topbar"><button class="cta ghost" style="padding:8px 11px" onclick="back()">‹</button><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div></div>`}
function go(r){state.route=r;render();window.scrollTo(0,0)}
function back(){if(['person-edit','vorsorge-person'].includes(state.route)) return go('vorsorge'); go(state.route==='welcome'?'welcome':'home')}

function render(){
 const a=document.getElementById('app');
 let html='';
 if(state.route==='welcome')html=welcome();
 else if(state.route==='home')html=home()+nav();
 else if(state.route==='vorsorge')html=vorsorgePeople()+nav();
 else if(state.route==='vorsorge-person')html=vorsorgePerson()+nav();
 else if(state.route==='person-edit')html=personEdit()+nav();
 else if(state.route==='profile')html=profile()+nav();
 else if(state.route==='documents')html=documents()+nav();
 else if(state.route==='case')html=caseScreen()+nav();
 else if(state.route==='emergency')html=emergency();
 else if(state.route==='generator')html=generator()+nav();
 a.innerHTML=html;
}
function welcome(){return `<section class="screen"><div class="hero"><div class="hero-badge">🤲</div><h1>Sterbefall<br>Assistent</h1><p>Wichtige Dinge rechtzeitig regeln – für mehr Sicherheit im Leben und im Ernstfall.</p><button class="cta" onclick="go('home')">Jetzt starten →</button></div><div class="content"><div class="notice"><b>Local first:</b> Deine Daten bleiben standardmäßig auf diesem Gerät. Kein Konto erforderlich.</div></div></section>`}
function home(){return `<section class="screen">${appTop('Willkommen','Was möchten Sie tun?')}<div class="content"><div class="grid-menu">
<button class="menu-card" onclick="go('vorsorge')"><div class="icon">🌿</div><div><h3>Vorsorge</h3><p>Für Sie selbst und Angehörige vorsorgen</p></div><div class="arrow">›</div></button>
<button class="menu-card yellow" onclick="toast('Bereich „Schwere Erkrankung“ wird im nächsten Ausbau ergänzt.')"><div class="icon">❤</div><div><h3>Schwere Erkrankung</h3><p>Wichtige Schritte und Unterstützung</p></div><div class="arrow">›</div></button>
<button class="menu-card" onclick="go('case')"><div class="icon">🕯</div><div><h3>Sterbefall</h3><p>Was ist jetzt konkret zu tun?</p></div><div class="arrow">›</div></button>
<button class="menu-card yellow" onclick="go('documents')"><div class="icon">📄</div><div><h3>Dokumente</h3><p>Vollmachten, Schreiben und Unterlagen</p></div><div class="arrow">›</div></button>
</div><div class="section-title"><h2>Schnellzugriff</h2></div><div class="row"><button class="cta teal full" onclick="go('emergency')">🚨 Notfallkarte</button><button class="cta ghost full" onclick="go('generator')">✍ Schreiben</button></div></div></section>`}

function vorsorgePeople(){
  const cards=state.persons.length?state.persons.map(personCard).join(''):`<div class="empty-card"><div class="empty-icon">👥</div><h3>Noch keine Person angelegt</h3><p>Lege zuerst dich selbst oder einen Angehörigen an.</p></div>`;
  return `<section class="screen">${appTop('Vorsorge','Für Sie selbst und Angehörige')}<div class="content"><div class="section-title"><h2>Für wen möchten Sie vorsorgen?</h2></div><div class="person-grid">${cards}</div><button class="cta full" style="margin-top:14px" onclick="newPerson()">＋ Person hinzufügen</button><div class="notice" style="margin-top:14px">Jede Person hat eigene Stammdaten, Vollmachten, Dokumente, Notfallkontakte und einen eigenen Vorsorge-Fortschritt.</div></div></section>`
}
function personCard(p){const pct=completion(p);return `<div class="person-card ${p.id===state.activePersonId?'selected':''}"><button class="person-main" onclick="selectPerson('${p.id}')"><div class="avatar">${relationEmoji(p.relation)}</div><div class="grow"><b>${esc(personName(p))}</b><div class="small muted">${esc(relationLabel(p.relation))}</div><div class="person-progress"><span style="width:${pct}%"></span></div><div class="small">Vorsorge ${pct}%</div></div><div class="chev">›</div></button><div class="person-actions"><button onclick="editPerson('${p.id}')">Bearbeiten</button><button class="danger-link" onclick="deletePerson('${p.id}')">Löschen</button></div></div>`}
function relationEmoji(r){return ({self:'👤',partner:'❤️',mother:'👵',father:'👴',child:'🧒',sibling:'🧑',other:'👥'})[r]||'👤'}
function newPerson(){state.editPersonId=null;go('person-edit')}
function editPerson(id){state.editPersonId=id;go('person-edit')}
function selectPerson(id){state.activePersonId=id;saveMeta();go('vorsorge-person')}
async function deletePerson(id){const p=state.persons.find(x=>x.id===id);if(!p)return;if(!confirm(`${personName(p)} wirklich löschen?`))return;state.persons=state.persons.filter(x=>x.id!==id);if(state.activePersonId===id)state.activePersonId=state.persons[0]?.id||null;await persistPersons();toast('Person gelöscht');render()}

function personEdit(){
 const p=state.editPersonId?state.persons.find(x=>x.id===state.editPersonId):null;
 const x=p?.profile||{};
 return `<section class="screen">${appTop(p?'Person bearbeiten':'Person hinzufügen','Nur wenige Angaben zum Start')}<div class="content"><div class="form-card"><h3>Grunddaten</h3>${selectField('Beziehung','personRelation',p?.relation||'other',['self|Ich','partner|Partner/in','mother|Mutter','father|Vater','child|Kind','sibling|Geschwister','other|Andere Person'],true)}${field('Vorname','personFirst',x.firstName)}${field('Nachname','personLast',x.lastName)}${field('Geburtsdatum','personBirth',x.birthDate,'date')}</div><button class="cta teal full" onclick="savePersonBasic()">${p?'Änderungen speichern':'Person anlegen'}</button></div></section>`
}
async function savePersonBasic(){
 const relation=document.getElementById('personRelation').value;
 const firstName=document.getElementById('personFirst').value.trim();
 const lastName=document.getElementById('personLast').value.trim();
 const birthDate=document.getElementById('personBirth').value;
 if(!firstName||!lastName){toast('Vor- und Nachname bitte ausfüllen');return}
 if(state.editPersonId){
   const p=state.persons.find(x=>x.id===state.editPersonId);p.relation=relation;p.profile={...(p.profile||{}),firstName,lastName,birthDate};
 }else{
   const p={id:uid('person'),relation,profile:{firstName,lastName,birthDate},documents:{},emergencyContacts:[]};
   state.persons.push(p);state.activePersonId=p.id;
 }
 await persistPersons();state.editPersonId=null;toast('Person gespeichert');go('vorsorge')
}

function vorsorgePerson(){const p=activePerson();if(!p)return `<section class="screen">${appTop('Vorsorge')}<div class="content"><div class="notice">Bitte zuerst eine Person auswählen.</div><button class="cta full" style="margin-top:12px" onclick="go('vorsorge')">Zur Personenübersicht</button></div></section>`;const pct=completion(p);return `<section class="screen">${appTop('Vorsorge',`Für ${esc(personName(p))}`)}<div class="content"><button class="person-switch" onclick="go('vorsorge')"><span>${relationEmoji(p.relation)} ${esc(personName(p))}</span><small>${esc(relationLabel(p.relation))} · Person wechseln</small></button><div class="progress-card"><div class="progress-ring" style="--p:${pct}"><div style="text-align:center"><b>${pct}%</b><br><span>vorbereitet</span></div></div><p style="text-align:center" class="muted">Daten werden nur einmal erfasst und automatisch in passende Formulare übernommen.</p></div>
<div class="section-title"><h2>Nächste Schritte</h2></div><div class="list">
${task('Persönliche Daten vervollständigen',pct>=80,'Profil und Kontaktdaten','profile')}
${task('Vorsorgevollmacht prüfen',!!docsOf(p).vorsorge,'Status und Aufbewahrungsort','documents')}
${task('Patientenverfügung hinterlegen',!!docsOf(p).patienten,'Status und Aufbewahrungsort','documents')}
${task('Notfallkontakt festlegen',(p.emergencyContacts||[]).length>0,'Für Krankenhaus und Ernstfall','profile')}
${task('Bestattungswünsche festhalten',!!docsOf(p).bestattung,'Wünsche dokumentieren','documents')}
</div><div class="spacer"></div><button class="cta teal full" onclick="go('profile')">Vorsorge fortsetzen →</button></div></section>`}
function task(title,done,meta,route){return `<button class="list-item ${done?'done':''}" onclick="go('${route}')"><div class="dot">${done?'✓':''}</div><div class="grow"><b>${title}</b><div class="meta">${meta}</div></div><div class="chev">›</div></button>`}

function profile(){const p=activePerson();if(!p)return noPerson('Profil');const x=p.profile||{};const emergency=(p.emergencyContacts||[])[0]||{};return `<section class="screen">${appTop('Profil',`Daten für ${esc(personName(p))}`)}<div class="content"><button class="person-switch" onclick="go('vorsorge')"><span>${relationEmoji(p.relation)} ${esc(personName(p))}</span><small>Person wechseln</small></button><div class="form-card"><h3>Persönliche Daten</h3>${field('Vorname','firstName',x.firstName)}${field('Nachname','lastName',x.lastName)}<div class="two">${field('Geburtsdatum','birthDate',x.birthDate,'date')}${selectField('Familienstand','maritalStatus',x.maritalStatus,['','ledig','verheiratet','geschieden','verwitwet','Lebenspartnerschaft'])}</div></div>
<div class="form-card"><h3>Kontakt & Adresse</h3>${field('Straße / Hausnummer','street',x.street)}<div class="two">${field('PLZ','zip',x.zip)}${field('Ort','city',x.city)}</div><div class="two">${field('Telefon','phone',x.phone,'tel')}${field('E-Mail','email',x.email,'email')}</div></div>
<div class="form-card"><h3>Versicherung & Identifikation</h3>${field('Krankenkasse','healthInsurance',x.healthInsurance)}${field('Versichertennummer','healthInsuranceNo',x.healthInsuranceNo)}${field('Rentenversicherungsnummer','pensionNo',x.pensionNo)}</div>
<div class="form-card"><h3>Notfallkontakt</h3><div class="notice" style="margin-bottom:12px">Noch einfach gehalten: ein Hauptkontakt. Später kann hier eine bereits angelegte Person ausgewählt werden.</div>${field('Name','emergencyName',emergency.name)}${field('Beziehung','emergencyRelation',emergency.relation)}${field('Telefon','emergencyPhone',emergency.phone,'tel')}</div>
<button class="cta teal full" onclick="saveProfile()">Speichern</button></div></section>`}
function noPerson(title){return `<section class="screen">${appTop(title)}<div class="content"><div class="notice">Für diesen Bereich muss zuerst unter Vorsorge eine Person angelegt und ausgewählt werden.</div><button class="cta full" style="margin-top:12px" onclick="go('vorsorge')">Zu Vorsorge</button></div></section>`}
function field(label,key,val='',type='text'){return `<div class="field"><label>${label}</label><input type="${type}" id="${key}" value="${esc(val||'')}" /></div>`}
function selectField(label,key,val,opts,encoded=false){return `<div class="field"><label>${label}</label><select id="${key}">${opts.map(o=>{let value=o,label=o;if(encoded&&o.includes('|'))[value,label]=o.split('|');return `<option value="${esc(value)}" ${value===val?'selected':''}>${esc(label||'Bitte auswählen')}</option>`}).join('')}</select></div>`}
async function saveProfile(){const p=activePerson();if(!p)return;const keys=['firstName','lastName','birthDate','maritalStatus','street','zip','city','phone','email','healthInsurance','healthInsuranceNo','pensionNo'];p.profile=p.profile||{};keys.forEach(k=>p.profile[k]=document.getElementById(k)?.value?.trim()||'');const ec={name:document.getElementById('emergencyName')?.value.trim()||'',relation:document.getElementById('emergencyRelation')?.value.trim()||'',phone:document.getElementById('emergencyPhone')?.value.trim()||''};p.emergencyContacts=ec.name||ec.phone?[ec]:[];await persistPersons();toast('Profil lokal gespeichert');render()}

const docsDef=[['vorsorge','Vorsorgevollmacht','Wer darf handeln, wenn die Person es nicht kann?'],['patienten','Patientenverfügung','Medizinische Wünsche dokumentieren'],['betreuung','Betreuungsverfügung','Wunschperson für eine Betreuung'],['bestattung','Bestattungswünsche','Bestattungsart und persönliche Wünsche'],['testament','Testament / Erbregelung','Aufbewahrungsort und Status'],['bank','Bankvollmacht','Kontozugriff im Bedarfsfall']];
function documents(){const p=activePerson();if(!p)return noPerson('Dokumente');return `<section class="screen">${appTop('Dokumente',`Für ${esc(personName(p))}`)}<div class="content"><button class="person-switch" onclick="go('vorsorge')"><span>${relationEmoji(p.relation)} ${esc(personName(p))}</span><small>Person wechseln</small></button><div class="pill-row"><button class="pill active">Alle</button><button class="pill">Vorsorge</button><button class="pill">Rechtliches</button><button class="pill">Weitere</button></div><div class="spacer"></div>${docsDef.map(([k,n,d])=>docRow(k,n,d,p)).join('')}<button class="cta full" onclick="go('generator')">＋ Neues Schreiben erstellen</button><div class="notice" style="margin-top:14px">Rechtlich relevante Dokumente sollten mit offiziellen oder fachlich geprüften Vorlagen erstellt bzw. abgeglichen werden.</div></div></section>`}
function docRow(k,n,d,p){const on=!!p.documents?.[k];return `<div class="doc-row"><div class="doc-icon">📄</div><div class="grow"><b>${n}</b><div class="small muted">${d}</div><div class="status ${on?'':'warn'}">${on?'✓ vorhanden':'○ noch nicht hinterlegt'}</div></div><button class="cta ghost" style="padding:8px 12px" onclick="toggleDoc('${k}')">${on?'Ändern':'Markieren'}</button></div>`}
async function toggleDoc(k){const p=activePerson();if(!p)return;p.documents=p.documents||{};p.documents[k]=!p.documents[k];await persistPersons();render();toast('Dokumentstatus gespeichert')}

function emergency(){const p=activePerson();if(!p)return noPerson('Notfallkarte');const x=p.profile||{};const ec=(p.emergencyContacts||[])[0]||{};return `<section class="emergency"><button class="cta ghost no-print" onclick="go('home')">‹ Zurück</button><div style="text-align:center;font-size:48px">⚠</div><h1>NOTFALL</h1><p class="lead">Wichtige Informationen für ${esc(personName(p))}</p><div class="emergency-card"><h3>Wichtiger Kontakt</h3><b>${esc(ec.name||'Noch nicht hinterlegt')}</b><div class="muted">${esc(ec.relation||'')}</div><div style="margin-top:12px"><span class="tag">☎ ${esc(ec.phone||'Telefon fehlt')}</span></div></div><div class="emergency-card"><h3>Vorsorge</h3><div class="kv"><b>Patientenverfügung</b><span>${p.documents?.patienten?'Vorhanden':'Nicht hinterlegt'}</span><b>Vorsorgevollmacht</b><span>${p.documents?.vorsorge?'Vorhanden':'Nicht hinterlegt'}</span><b>Krankenkasse</b><span>${esc(x.healthInsurance||'Nicht hinterlegt')}</span></div></div><div class="emergency-card"><h3>Person</h3><div class="kv"><b>Name</b><span>${esc(personName(p))}</span><b>Geburtsdatum</b><span>${esc(fmtDate(x.birthDate))}</span><b>Adresse</b><span>${esc([x.street,[x.zip,x.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')||'Nicht hinterlegt')}</span></div></div></section>`}

function caseScreen(){const existing=state.cases[0]||{};const personOptions=state.persons.map(p=>`<option value="${p.id}" ${existing.personId===p.id?'selected':''}>${esc(personName(p))} – ${esc(relationLabel(p.relation))}</option>`).join('');return `<section class="screen">${appTop('Sterbefall','Geführter Ablauf statt endloser Checkliste')}<div class="content"><div class="form-card"><h3>Fall anlegen</h3><div class="field"><label>Person</label><select id="casePerson"><option value="">Bitte auswählen</option>${personOptions}</select></div>${field('Sterbedatum','cDeath',existing.deathDate,'date')}${selectField('Sterbeort','cPlace',existing.place,['','Zuhause','Krankenhaus','Pflegeheim','Hospiz','Ausland','Sonstiges'])}<button class="cta teal full" onclick="saveCase()">Fall speichern</button></div>
${existing.personId?caseTasks(existing):''}</div></section>`}
function caseTasks(c){const p=state.persons.find(x=>x.id===c.personId);const x=p?.profile||{};return `<div class="timeline"><div class="step done">Formalitäten</div><div class="step active">Behörden</div><div class="step">Finanzen</div><div class="step">Abschluss</div></div><div class="section-title"><h2>Nächste Aufgaben für ${esc(personName(p))}</h2></div><div class="list">${task('Sterbeurkunden organisieren',false,'Standesamt / Bestatter','case')}${task('Krankenkasse informieren',false,x.healthInsurance||'Krankenkasse ergänzen','generator')}${task('Rentenversicherung benachrichtigen',false,x.pensionNo?'Nummer ist hinterlegt':'Rentenversicherungsnummer fehlt','generator')}${task('Verträge prüfen und kündigen',false,'Telefon, Energie, Abos, Vereine','generator')}</div>`}
async function saveCase(){const personId=document.getElementById('casePerson').value;if(!personId){toast('Bitte Person auswählen');return}state.cases=[{id:state.cases[0]?.id||uid('case'),personId,deathDate:document.getElementById('cDeath').value,place:document.getElementById('cPlace').value}];await idbSet('cases','main',state.cases);toast('Sterbefall lokal gespeichert');render()}

function generator(){const c=state.cases[0];const p=c?state.persons.find(x=>x.id===c.personId):activePerson();if(!p)return noPerson('Schreiben erstellen');const x=p.profile||{};const subjectName=personName(p);return `<section class="screen">${appTop('Schreiben erstellen',`Daten von ${esc(subjectName)} werden automatisch eingesetzt`)}<div class="content"><div class="form-card"><h3>Art des Schreibens</h3><div class="field"><label>Vorlage</label><select id="template" onchange="updatePreview()"><option value="death">Mitteilung über einen Sterbefall</option><option value="cancel">Kündigung wegen Todesfall</option><option value="record">Bitte um schriftliche Bestätigung</option></select></div>${field('Empfänger / Organisation','recipient','')}${field('Vertrags- / Kundennummer','contractNo','')}<button class="cta teal full" onclick="updatePreview()">Vorschau aktualisieren</button></div><div class="section-title"><h2>Vorschau</h2><button onclick="window.print()">Drucken / PDF</button></div><div id="preview" class="preview">${esc(buildLetter('death','', '',p,c))}</div><div class="spacer"></div><div class="notice">Bekannte Angaben wurden automatisch übernommen. Fehlende Angaben müssen nur einmal ergänzt werden.</div></div></section>`}
function buildLetter(type,recipient,contractNo,p,c){const x=p.profile||{};const sender=[personName(p),x.street,[x.zip,x.city].filter(Boolean).join(' ')].filter(Boolean).join('\n');const deathDate=fmtDate(c?.deathDate);const birth=fmtDate(x.birthDate);let body='';if(type==='death')body=`hiermit teile ich Ihnen mit, dass ${personName(p)}${birth?`, geboren am ${birth}`:''}${deathDate?`, am ${deathDate}`:''} verstorben ist.\n\nBitte vermerken Sie den Sterbefall in Ihren Unterlagen und teilen Sie mir mit, ob Sie weitere Nachweise benötigen.`;if(type==='cancel')body=`hiermit kündige ich den bestehenden Vertrag${contractNo?` mit der Nummer ${contractNo}`:''} aufgrund des Todes von ${personName(p)}${deathDate?` zum Sterbedatum ${deathDate}`:''}.\n\nBitte bestätigen Sie mir die Beendigung schriftlich und teilen Sie mit, falls weitere Unterlagen erforderlich sind.`;if(type==='record')body=`bezugnehmend auf den Sterbefall von ${personName(p)} bitte ich um eine schriftliche Bestätigung über die Bearbeitung und gegebenenfalls noch erforderliche Unterlagen.`;return `${sender}\n\n${recipient||'[Empfänger]'}\n\nBetreff: ${type==='cancel'?'Kündigung wegen Todesfall':'Mitteilung Sterbefall'}\n\nSehr geehrte Damen und Herren,\n\n${body}\n\nMit freundlichen Grüßen\n\n${personName(p)}`}
function updatePreview(){const c=state.cases[0];const p=c?state.persons.find(x=>x.id===c.personId):activePerson();if(!p)return;const t=document.getElementById('template')?.value||'death',r=document.getElementById('recipient')?.value||'',cn=document.getElementById('contractNo')?.value||'';document.getElementById('preview').textContent=buildLetter(t,r,cn,p,c)}

async function persistPersons(){await idbSet('persons','main',state.persons);await saveMeta()}
async function saveMeta(){await idbSet('meta','main',{activePersonId:state.activePersonId,dataVersion:2})}
async function migrateLegacy(){
  const existing=await idbGet('persons','main');
  if(existing?.length){state.persons=existing;return}
  const oldProfile=await idbGet('profile','main')||{};
  const oldDocs=await idbGet('docs','main')||{};
  if(Object.keys(oldProfile).length||Object.keys(oldDocs).length){
    const p={id:uid('person'),relation:'self',profile:{...oldProfile},documents:{...oldDocs},emergencyContacts:[]};
    if(oldProfile.emergencyName||oldProfile.emergencyPhone){p.emergencyContacts=[{name:oldProfile.emergencyName||'',relation:oldProfile.emergencyRelation||'',phone:oldProfile.emergencyPhone||''}]}
    delete p.profile.emergencyName;delete p.profile.emergencyRelation;delete p.profile.emergencyPhone;
    state.persons=[p];state.activePersonId=p.id;await persistPersons();toast('Vorhandenes Profil wurde übernommen');
  }
}
async function init(){db=await openDB();await migrateLegacy();if(!state.persons.length)state.persons=await idbGet('persons','main')||[];const meta=await idbGet('meta','main')||{};state.activePersonId=meta.activePersonId||state.activePersonId||state.persons[0]?.id||null;state.cases=await idbGet('cases','main')||[];state.settings=await idbGet('settings','main')||state.settings;render();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}

window.go=go;window.back=back;window.newPerson=newPerson;window.editPerson=editPerson;window.selectPerson=selectPerson;window.deletePerson=deletePerson;window.savePersonBasic=savePersonBasic;window.saveProfile=saveProfile;window.toggleDoc=toggleDoc;window.saveCase=saveCase;window.updatePreview=updatePreview;window.addEventListener('DOMContentLoaded',init);
