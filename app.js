const DB_NAME='sterbefall_assistent_db', DB_VERSION=1;
let db;
const state={route:'welcome', profile:{}, caseData:{}, docs:{}, settings:{simpleMode:true}, filter:'Alle'};

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const d=req.result;['profile','case','docs','settings'].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s)});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
function idbGet(store,key){return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbSet(store,key,val){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(val,key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmtDate(v){if(!v)return ''; const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('de-DE')}
function fullName(){return [state.profile.firstName,state.profile.lastName].filter(Boolean).join(' ')||'Noch nicht hinterlegt'}
function completion(){const keys=['firstName','lastName','birthDate','street','zip','city','phone','email','maritalStatus','healthInsurance','emergencyName'];return Math.round(keys.filter(k=>state.profile[k]).length/keys.length*100)}

const nav=()=>`<nav class="bottom-nav no-print">
<button class="nav-btn ${state.route==='home'?'active':''}" onclick="go('home')"><span class="ni">⌂</span>Start</button>
<button class="nav-btn ${state.route==='documents'?'active':''}" onclick="go('documents')"><span class="ni">▤</span>Dokumente</button>
<button class="nav-btn ${state.route==='case'?'active':''}" onclick="go('case')"><span class="ni">◷</span>Sterbefall</button>
<button class="nav-btn ${state.route==='profile'?'active':''}" onclick="go('profile')"><span class="ni">●</span>Profil</button>
</nav>`;
function top(title,sub=''){return `<div class="topbar"><button class="cta ghost" style="padding:8px 11px" onclick="back()">‹</button><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div></div>`}
function go(r){state.route=r;render();window.scrollTo(0,0)}
function back(){go(state.route==='welcome'?'welcome':'home')}

function render(){
 const a=document.getElementById('app');
 let html='';
 if(state.route==='welcome')html=welcome();
 else if(state.route==='home')html=home()+nav();
 else if(state.route==='vorsorge')html=vorsorge()+nav();
 else if(state.route==='profile')html=profile()+nav();
 else if(state.route==='documents')html=documents()+nav();
 else if(state.route==='case')html=caseScreen()+nav();
 else if(state.route==='emergency')html=emergency();
 else if(state.route==='generator')html=generator()+nav();
 a.innerHTML=html;
}
function welcome(){return `<section class="screen"><div class="hero"><div class="hero-badge">🤲</div><h1>Sterbefall<br>Assistent</h1><p>Wichtige Dinge rechtzeitig regeln – für mehr Sicherheit im Leben und im Ernstfall.</p><button class="cta" onclick="go('home')">Jetzt starten →</button></div><div class="content"><div class="notice"><b>Local first:</b> Deine Daten bleiben standardmäßig auf diesem Gerät. Kein Konto erforderlich.</div></div></section>`}
function home(){return `<section class="screen">${top('Willkommen','Was möchten Sie tun?')}<div class="content"><div class="grid-menu">
<button class="menu-card" onclick="go('vorsorge')"><div class="icon">🌿</div><div><h3>Meine Vorsorge</h3><p>Vollmachten, Wünsche und Unterlagen vorbereiten</p></div><div class="arrow">›</div></button>
<button class="menu-card yellow" onclick="toast('Bereich „Schwere Erkrankung“ wird im nächsten Ausbau ergänzt.')"><div class="icon">❤</div><div><h3>Schwere Erkrankung</h3><p>Wichtige Schritte und Unterstützung</p></div><div class="arrow">›</div></button>
<button class="menu-card" onclick="go('case')"><div class="icon">🕯</div><div><h3>Sterbefall</h3><p>Was ist jetzt konkret zu tun?</p></div><div class="arrow">›</div></button>
<button class="menu-card yellow" onclick="go('documents')"><div class="icon">📄</div><div><h3>Dokumente</h3><p>Vollmachten, Schreiben und Unterlagen</p></div><div class="arrow">›</div></button>
</div><div class="section-title"><h2>Schnellzugriff</h2></div><div class="row"><button class="cta teal full" onclick="go('emergency')">🚨 Notfallkarte</button><button class="cta ghost full" onclick="go('generator')">✍ Schreiben</button></div></div></section>`}
function vorsorge(){const p=completion();return `<section class="screen">${top('Meine Vorsorge','Ihr persönlicher Vorsorge-Status')}<div class="content"><div class="progress-card"><div class="progress-ring" style="--p:${p}"><div style="text-align:center"><b>${p}%</b><br><span>vorbereitet</span></div></div><p style="text-align:center" class="muted">Ihre Daten werden nur einmal erfasst und in passende Formulare automatisch übernommen.</p></div>
<div class="section-title"><h2>Ihre nächsten Schritte</h2></div><div class="list">
${task('Persönliche Daten vervollständigen',p>=80,'Profil und Kontaktdaten','profile')}
${task('Vorsorgevollmacht prüfen',!!state.docs.vorsorge,'Status und Aufbewahrungsort','documents')}
${task('Patientenverfügung hinterlegen',!!state.docs.patienten,'Status und Aufbewahrungsort','documents')}
${task('Notfallkontakt festlegen',!!state.profile.emergencyName,'Für Krankenhaus und Ernstfall','profile')}
${task('Bestattungswünsche festhalten',!!state.docs.bestattung,'Wünsche dokumentieren','documents')}
</div><div class="spacer"></div><button class="cta teal full" onclick="go('profile')">Vorsorge fortsetzen →</button></div></section>`}
function task(title,done,meta,route){return `<button class="list-item ${done?'done':''}" onclick="go('${route}')"><div class="dot">${done?'✓':''}</div><div class="grow"><b>${title}</b><div class="meta">${meta}</div></div><div class="chev">›</div></button>`}

function profile(){const p=state.profile; return `<section class="screen">${top('Mein Profil','Daten einmal erfassen – überall verwenden')}<div class="content"><div class="form-card"><h3>Persönliche Daten</h3>${field('Vorname','firstName',p.firstName)}${field('Nachname','lastName',p.lastName)}<div class="two">${field('Geburtsdatum','birthDate',p.birthDate,'date')}${selectField('Familienstand','maritalStatus',p.maritalStatus,['','ledig','verheiratet','geschieden','verwitwet','Lebenspartnerschaft'])}</div></div>
<div class="form-card"><h3>Kontakt & Adresse</h3>${field('Straße / Hausnummer','street',p.street)}<div class="two">${field('PLZ','zip',p.zip)}${field('Ort','city',p.city)}</div><div class="two">${field('Telefon','phone',p.phone,'tel')}${field('E-Mail','email',p.email,'email')}</div></div>
<div class="form-card"><h3>Versicherung & Identifikation</h3>${field('Krankenkasse','healthInsurance',p.healthInsurance)}${field('Versichertennummer','healthInsuranceNo',p.healthInsuranceNo)}${field('Rentenversicherungsnummer','pensionNo',p.pensionNo)}</div>
<div class="form-card"><h3>Notfallkontakt</h3>${field('Name','emergencyName',p.emergencyName)}${field('Beziehung','emergencyRelation',p.emergencyRelation)}${field('Telefon','emergencyPhone',p.emergencyPhone,'tel')}</div>
<button class="cta teal full" onclick="saveProfile()">Speichern</button></div></section>`}
function field(label,key,val='',type='text'){return `<div class="field"><label>${label}</label><input type="${type}" id="${key}" value="${esc(val||'')}" /></div>`}
function selectField(label,key,val,opts){return `<div class="field"><label>${label}</label><select id="${key}">${opts.map(o=>`<option value="${esc(o)}" ${o===val?'selected':''}>${o||'Bitte auswählen'}</option>`).join('')}</select></div>`}
async function saveProfile(){['firstName','lastName','birthDate','maritalStatus','street','zip','city','phone','email','healthInsurance','healthInsuranceNo','pensionNo','emergencyName','emergencyRelation','emergencyPhone'].forEach(k=>state.profile[k]=document.getElementById(k)?.value?.trim()||'');await idbSet('profile','main',state.profile);toast('Profil lokal gespeichert');render()}

const docsDef=[['vorsorge','Vorsorgevollmacht','Wer darf handeln, wenn ich es nicht kann?'],['patienten','Patientenverfügung','Medizinische Wünsche dokumentieren'],['betreuung','Betreuungsverfügung','Wunschperson für eine Betreuung'],['bestattung','Bestattungswünsche','Bestattungsart und persönliche Wünsche'],['testament','Testament / Erbregelung','Aufbewahrungsort und Status'],['bank','Bankvollmacht','Kontozugriff im Bedarfsfall']];
function documents(){return `<section class="screen">${top('Dokumente','Status, Aufbewahrungsorte und Schreiben')}<div class="content"><div class="pill-row"><button class="pill active">Alle</button><button class="pill">Vorsorge</button><button class="pill">Rechtliches</button><button class="pill">Weitere</button></div><div class="spacer"></div>${docsDef.map(([k,n,d])=>docRow(k,n,d)).join('')}<button class="cta full" onclick="go('generator')">＋ Neues Schreiben erstellen</button><div class="notice" style="margin-top:14px">Rechtlich relevante Dokumente sollten mit offiziellen oder fachlich geprüften Vorlagen erstellt bzw. abgeglichen werden. Diese MVP-App verwaltet zunächst Status, Datenübernahme und Schreiben.</div></div></section>`}
function docRow(k,n,d){const on=!!state.docs[k];return `<div class="doc-row"><div class="doc-icon">📄</div><div class="grow"><b>${n}</b><div class="small muted">${d}</div><div class="status ${on?'':'warn'}">${on?'✓ vorhanden':'○ noch nicht hinterlegt'}</div></div><button class="cta ghost" style="padding:8px 12px" onclick="toggleDoc('${k}')">${on?'Ändern':'Markieren'}</button></div>`}
async function toggleDoc(k){state.docs[k]=!state.docs[k];await idbSet('docs','main',state.docs);render();toast('Dokumentstatus gespeichert')}

function emergency(){const p=state.profile;return `<section class="emergency"><button class="cta ghost no-print" onclick="go('home')">‹ Zurück</button><div style="text-align:center;font-size:48px">⚠</div><h1>NOTFALL</h1><p class="lead">Wichtige Informationen auf einen Blick</p><div class="emergency-card"><h3>Wichtiger Kontakt</h3><b>${esc(p.emergencyName||'Noch nicht hinterlegt')}</b><div class="muted">${esc(p.emergencyRelation||'')}</div><div style="margin-top:12px"><span class="tag">☎ ${esc(p.emergencyPhone||'Telefon fehlt')}</span></div></div><div class="emergency-card"><h3>Vorsorge</h3><div class="kv"><b>Patientenverfügung</b><span>${state.docs.patienten?'Vorhanden':'Nicht hinterlegt'}</span><b>Vorsorgevollmacht</b><span>${state.docs.vorsorge?'Vorhanden':'Nicht hinterlegt'}</span><b>Krankenkasse</b><span>${esc(p.healthInsurance||'Nicht hinterlegt')}</span></div></div><div class="emergency-card"><h3>Person</h3><div class="kv"><b>Name</b><span>${esc(fullName())}</span><b>Geburtsdatum</b><span>${esc(fmtDate(p.birthDate))}</span><b>Adresse</b><span>${esc([p.street,[p.zip,p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')||'Nicht hinterlegt')}</span></div></div></section>`}

function caseScreen(){const c=state.caseData;return `<section class="screen">${top('Sterbefall','Geführter Ablauf statt endloser Checkliste')}<div class="content"><div class="form-card"><h3>Fall anlegen</h3><div class="two">${field('Vorname','cFirst',c.firstName||state.profile.firstName)}${field('Nachname','cLast',c.lastName||state.profile.lastName)}</div><div class="two">${field('Geburtsdatum','cBirth',c.birthDate||state.profile.birthDate,'date')}${field('Sterbedatum','cDeath',c.deathDate,'date')}</div>${selectField('Sterbeort','cPlace',c.place,['','Zuhause','Krankenhaus','Pflegeheim','Hospiz','Ausland','Sonstiges'])}<button class="cta teal full" onclick="saveCase()">Fall speichern</button></div>
${c.firstName?`<div class="timeline"><div class="step done">Formalitäten</div><div class="step active">Behörden</div><div class="step">Finanzen</div><div class="step">Abschluss</div></div><div class="section-title"><h2>Nächste Aufgaben</h2></div><div class="list">${task('Sterbeurkunden organisieren',false,'Standesamt / Bestatter','case')}${task('Krankenkasse informieren',false,c.healthInsurance||state.profile.healthInsurance||'Krankenkasse ergänzen','generator')}${task('Rentenversicherung benachrichtigen',false,state.profile.pensionNo?'Nummer ist hinterlegt':'Rentenversicherungsnummer fehlt','generator')}${task('Verträge prüfen und kündigen',false,'Telefon, Energie, Abos, Vereine','generator')}</div>`:''}</div></section>`}
async function saveCase(){state.caseData={...state.caseData,firstName:document.getElementById('cFirst').value.trim(),lastName:document.getElementById('cLast').value.trim(),birthDate:document.getElementById('cBirth').value,deathDate:document.getElementById('cDeath').value,place:document.getElementById('cPlace').value,healthInsurance:state.profile.healthInsurance||''};await idbSet('case','main',state.caseData);toast('Sterbefall lokal gespeichert');render()}

function generator(){const c=state.caseData,p=state.profile;const subjectName=[c.firstName,c.lastName].filter(Boolean).join(' ')||fullName();return `<section class="screen">${top('Schreiben erstellen','Stammdaten werden automatisch eingesetzt')}<div class="content"><div class="form-card"><h3>Art des Schreibens</h3><div class="field"><label>Vorlage</label><select id="template" onchange="updatePreview()"><option value="death">Mitteilung über einen Sterbefall</option><option value="cancel">Kündigung wegen Todesfall</option><option value="record">Bitte um schriftliche Bestätigung</option></select></div>${field('Empfänger / Organisation','recipient','')}${field('Vertrags- / Kundennummer','contractNo','')}<button class="cta teal full" onclick="updatePreview()">Vorschau aktualisieren</button></div><div class="section-title"><h2>Vorschau</h2><button onclick="window.print()">Drucken / PDF</button></div><div id="preview" class="preview">${esc(buildLetter('death','', '',subjectName))}</div><div class="spacer"></div><div class="notice">Bekannte Angaben zu ${esc(subjectName)} wurden automatisch übernommen. Fehlende Angaben müssen nur noch einmal ergänzt werden.</div></div></section>`}
function buildLetter(type,recipient,contractNo,subjectName){const p=state.profile,c=state.caseData;const sender=[fullName(),p.street,[p.zip,p.city].filter(Boolean).join(' ')].filter(x=>x&&x!=='Noch nicht hinterlegt').join('\n');const deathDate=fmtDate(c.deathDate);const birth=fmtDate(c.birthDate||p.birthDate);let body='';if(type==='death')body=`hiermit teile ich Ihnen mit, dass ${subjectName}${birth?`, geboren am ${birth}`:''}${deathDate?`, am ${deathDate}`:''} verstorben ist.\n\nBitte vermerken Sie den Sterbefall in Ihren Unterlagen und teilen Sie mir mit, ob Sie weitere Nachweise benötigen.`;if(type==='cancel')body=`hiermit kündige ich den bestehenden Vertrag${contractNo?` mit der Nummer ${contractNo}`:''} aufgrund des Todes von ${subjectName}${deathDate?` zum Sterbedatum ${deathDate}`:''}.\n\nBitte bestätigen Sie mir die Beendigung schriftlich und teilen Sie mit, falls weitere Unterlagen erforderlich sind.`;if(type==='record')body=`bezugnehmend auf den Sterbefall von ${subjectName} bitte ich um eine schriftliche Bestätigung über die Bearbeitung und gegebenenfalls noch erforderliche Unterlagen.`;return `${sender}\n\n${recipient||'[Empfänger]'}\n\nBetreff: ${type==='cancel'?'Kündigung wegen Todesfall':'Mitteilung Sterbefall'}\n\nSehr geehrte Damen und Herren,\n\n${body}\n\nMit freundlichen Grüßen\n\n${fullName()}`}
function updatePreview(){const t=document.getElementById('template')?.value||'death',r=document.getElementById('recipient')?.value||'',cn=document.getElementById('contractNo')?.value||'',n=[state.caseData.firstName,state.caseData.lastName].filter(Boolean).join(' ')||fullName();document.getElementById('preview').textContent=buildLetter(t,r,cn,n)}

async function init(){db=await openDB();state.profile=await idbGet('profile','main')||{};state.caseData=await idbGet('case','main')||{};state.docs=await idbGet('docs','main')||{};state.settings=await idbGet('settings','main')||state.settings;render();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}
window.go=go;window.back=back;window.saveProfile=saveProfile;window.toggleDoc=toggleDoc;window.saveCase=saveCase;window.updatePreview=updatePreview;window.addEventListener('DOMContentLoaded',init);
