const DB_NAME='sterbefall_assistent_db', DB_VERSION=6;
let db;
const state={route:'welcome',persons:[],activePersonId:null,cases:[],settings:{simpleMode:true},editPersonId:null,docKey:null,officialPdfKey:null,lastPdf:null,applicationTaskId:null,shareScope:'person',shareLink:'',sharePin:'',pendingShare:null,pendingShareToken:null};

const OFFICIAL={
  vorsorge:'https://www.bmj.de/SharedDocs/Downloads/DE/Formular/Vorsorgevollmacht.html',
  betreuung:'https://www.bmj.de/SharedDocs/Downloads/DE/Formular/Betreuungsverfuegung.html',
  patienten:'https://www.bmj.de/DE/service/formulare/form_patientenverfuegung/form_patientenverfuegung_node.html',
  patientenInfo:'https://www.bmj.de/DE/themen/vorsorge_betreuungsrecht/patientenverfuegung/patientenverfuegung_node.html',
  zvr:'https://www.vorsorgeregister.de/privatpersonen/registrierung',
  zvrForms:'https://www.vorsorgeregister.de/formulare',
  organspende:'https://organspende-register.de/'
};

const OFFICIAL_PDFS={
  vorsorge:{title:'Vorsorgevollmacht - BMJ-Struktur Januar 2023',local:'forms/vorsorgevollmacht.pdf',url:'https://www.bmj.de/SharedDocs/Downloads/DE/Formular/Vorsorgevollmacht.html',source:'Struktur und Auswahlpunkte nach dem BMJ-Formular',stand:'BMJ Januar 2023'},
  patienten:{title:'Patientenverfügung nach BMJ-Textbausteinen',local:'forms/patientenverfuegung.pdf',url:'https://www.bmj.de/DE/service/formulare/form_patientenverfuegung/form_patientenverfuegung_node.html',source:'BMJ stellt Textbausteine bereit, kein einheitliches amtliches Formular',stand:'BMJ-Textbausteine'},
  betreuung:{title:'Betreuungsverfügung - BMJ-Struktur Januar 2023',local:'forms/betreuungsverfuegung.pdf',url:'https://www.bmj.de/SharedDocs/Downloads/DE/Formular/Betreuungsverfuegung.html',source:'Struktur und Felder nach dem BMJ-Formular',stand:'BMJ Januar 2023'},
  bank:{title:'Konto-/Depot-/Schrankfachvollmacht - BMJ/DK-Struktur',local:'forms/bankvollmacht.pdf',url:'https://www.bmj.de/SharedDocs/Publikationen/DE/Betreuungsrecht.html',source:'Struktur nach dem mit der Deutschen Kreditwirtschaft abgestimmten Formular',stand:'BMJ/DK-Formular'},
  schweigepflicht:{title:'Schweigepflichtentbindung - App-Vorlage',local:'forms/schweigepflichtentbindung.pdf',url:'https://www.bmj.de/DE/themen/vorsorge_betreuungsrecht/vorsorgevollmacht/vorsorgevollmacht_node.html',source:'Kein bundeseinheitliches amtliches Standardformular - App-Vorlage',stand:'App-Vorlage 09/2026'},
  bestattung:{title:'Bestattungswünsche - App-Vorlage',local:'forms/bestattungswuensche.pdf',url:'https://www.bmj.de/',source:'Kein bundeseinheitliches amtliches Standardformular - App-Vorlage',stand:'App-Vorlage 09/2026'},
  organe:{title:'Organspendeausweis - Struktur nach § 2 TPG / BIÖG',local:'forms/organspende-entscheidung.pdf',url:'https://www.organspende-info.de/organspendeausweis/infos-und-download/',source:'Auswahlmöglichkeiten nach dem offiziellen Organspendeausweis',stand:'BIÖG 2025'},
  testament:{title:'Testament - Vorbereitungsblatt',local:'forms/testament-vorbereitungsblatt.pdf',url:'https://www.bmj.de/',source:'Lokales Vorbereitungsblatt - kein Testament',stand:'App-Vorlage 09/2026'},
  zvrP:{title:'ZVR Formular P - Struktur Stand 01.02.2024',local:'forms/zvr-formular-p.pdf',url:'https://www.vorsorgeregister.de/formulare',source:'Struktur und Auswahlpunkte nach Formular P des Zentralen Vorsorgeregisters',stand:'ZVR 01.02.2024'}
};

const DOCS={
  vorsorge:{title:'Vorsorgevollmacht',desc:'Wer darf handeln, wenn die Person es selbst nicht kann?',icon:'🤝',official:'vorsorge',important:true},
  patienten:{title:'Patientenverfügung',desc:'Konkrete medizinische Wünsche für den Fall eigener Entscheidungsunfähigkeit.',icon:'🩺',official:'patienten',important:true},
  betreuung:{title:'Betreuungsverfügung',desc:'Wunschperson für den Fall einer gerichtlichen Betreuung.',icon:'⚖️',official:'betreuung',important:true},
  bank:{title:'Bankvollmacht',desc:'Kontozugriff und Bankangelegenheiten im Bedarfsfall klären.',icon:'🏦',important:true},
  schweigepflicht:{title:'Schweigepflichtentbindung',desc:'Festhalten, wer medizinische Informationen erhalten darf.',icon:'🔐',important:true},
  testament:{title:'Testament / Erbregelung',desc:'Status und Aufbewahrungsort einer erbrechtlichen Regelung.',icon:'📜'},
  bestattung:{title:'Bestattungswünsche',desc:'Bestattungsart, Ort, Trauerfeier und persönliche Wünsche.',icon:'🕯️'},
  organe:{title:'Organspende-Entscheidung',desc:'Eigene Entscheidung dokumentieren und Auffindbarkeit sichern.',icon:'❤️',official:'organspende'}
};
const RELATIONS={self:'Ich',partner:'Partner/in',mother:'Mutter',father:'Vater',child:'Kind',sibling:'Geschwister',other:'Andere Person'};

const LEGAL_DOC_INFO={
  vorsorge:{
    when:'Die Vollmacht ist gegenüber Dritten grundsätzlich ab ihrer Ausstellung wirksam. Eine interne Vereinbarung kann aber festlegen, dass die bevollmächtigte Person sie erst benutzen darf, wenn du deine Angelegenheiten nicht mehr selbst regeln kannst.',
    important:'Solange du selbst entscheidungs- und handlungsfähig bist, entscheidest du weiterhin selbst. Eine interne Nutzungsregel sollte nicht als aufschiebende Bedingung in die Vollmachtsurkunde geschrieben werden, weil Dritte sonst erst den Eintritt dieser Bedingung prüfen müssten.',
    form:'Für viele Angelegenheiten genügt eine schriftliche Vollmacht. Für bestimmte Geschäfte, insbesondere Grundstücks-/Grundbuchangelegenheiten oder andere formbedürftige Rechtsgeschäfte, können öffentliche Beglaubigung oder notarielle Beurkundung erforderlich sein.',
    source:'BMJ',
    url:'https://www.bmj.de/SharedDocs/Publikationen/DE/Betreuungsrecht.pdf'
  },
  patienten:{
    when:'Sie wird relevant, wenn du eine konkrete medizinische Entscheidung nicht mehr selbst treffen kannst und deine Festlegungen auf die aktuelle Lebens- und Behandlungssituation passen.',
    important:'Solange du selbst einwilligungsfähig bist, gilt deine aktuelle Entscheidung. Eine Patientenverfügung kann jederzeit formlos widerrufen werden.',
    form:'Schriftlich festhalten und eigenhändig unterschreiben. Eine notarielle Beglaubigung ist grundsätzlich nicht erforderlich.',
    source:'§ 1827 BGB',
    url:'https://www.gesetze-im-internet.de/bgb/__1827.html'
  },
  betreuung:{
    when:'Sie wird relevant, wenn ein Betreuungsgericht tatsächlich über die Bestellung eines rechtlichen Betreuers entscheiden muss.',
    important:'Das Gericht soll deinen früher geäußerten Wunsch zur Person des Betreuers berücksichtigen, soweit die gewünschte Person geeignet ist. Eine Betreuungsverfügung macht eine Betreuung nicht automatisch erforderlich.',
    form:'Eine schriftliche und unterschriebene Verfügung ist sinnvoll; eine notarielle Beurkundung ist normalerweise nicht erforderlich.',
    source:'§ 1816 BGB',
    url:'https://www.gesetze-im-internet.de/bgb/__1816.html'
  },
  bank:{
    when:'Gegenüber der Bank/Sparkasse kann die bevollmächtigte Person nach dem abgestimmten Formular grundsätzlich schon ab Ausstellung der Vollmacht handeln.',
    important:'Die Bank prüft nicht, ob ein „Vorsorgefall“ eingetreten ist. Wenn die Vollmacht erst später benutzt werden soll, muss das intern mit der bevollmächtigten Person vereinbart werden. Das abgestimmte Formular sieht außerdem vor, dass die Vollmacht nicht mit dem Tod erlischt.',
    form:'Das mit der Deutschen Kreditwirtschaft abgestimmte Formular sollte direkt mit der jeweiligen Bank/Sparkasse verwendet bzw. dort hinterlegt werden.',
    source:'BMJ / Deutsche Kreditwirtschaft',
    url:'https://hdr4.bmj.de/SharedDocs/Downloads/DE/Formular/Konto_und_Depotvollmacht.pdf?__blob=publicationFile&v=4'
  },
  schweigepflicht:{
    when:'Sie wirkt in dem Umfang, den du in der Erklärung festlegst, grundsätzlich ab Unterzeichnung bzw. ab dem von dir bestimmten Zeitpunkt.',
    important:'Solange du selbst entscheiden kannst, kannst du eine Schweigepflichtentbindung ändern oder widerrufen. Sie sollte möglichst klar benennen, welche Personen welche Informationen erhalten dürfen.',
    form:'Für eine allgemeine Schweigepflichtentbindung gibt es kein bundeseinheitliches Standardformular. Schriftliche, konkrete Angaben sind für die Praxis sinnvoll.',
    source:'App-Hinweis',
    url:''
  },
  bestattung:{
    when:'Diese Wünsche sind für die Zeit nach deinem Tod gedacht und sollen Angehörigen Orientierung geben.',
    important:'Bestattungsrecht und Zuständigkeiten unterscheiden sich teilweise nach Bundesland. Bestehende Verträge, Friedhofssatzungen und die bestattungspflichtigen Angehörigen können zusätzlich eine Rolle spielen.',
    form:'Kein bundeseinheitliches Standardformular. Möglichst konkret festhalten und den Aufbewahrungsort Angehörigen mitteilen.',
    source:'App-Hinweis',
    url:''
  },
  organe:{
    when:'Die Erklärung wird relevant, wenn nach deinem Tod eine Organ- oder Gewebespende medizinisch überhaupt in Betracht kommt.',
    important:'Eine unterschriebene Entscheidung ist verbindlich. Du kannst deine Entscheidung zu Lebzeiten jederzeit ändern; dann sollte die alte Erklärung vernichtet bzw. der Registereintrag aktualisiert werden.',
    form:'Organspendeausweis oder Eintrag im Organspende-Register. Eine notarielle Beglaubigung ist nicht erforderlich.',
    source:'BIÖG',
    url:'https://www.organspende-info.de/organspendeausweis/infos-und-download/'
  },
  testament:{
    when:'Ein Testament entfaltet seine erbrechtlichen Wirkungen grundsätzlich erst mit dem Tod.',
    important:'Das in dieser App erzeugte Vorbereitungsblatt ist kein wirksames eigenhändiges Testament. Ein privates Testament muss grundsätzlich vollständig eigenhändig geschrieben und unterschrieben werden.',
    form:'Alternativ kann ein notarielles Testament errichtet werden. Für ein eigenhändiges Testament genügt nicht, einen Computerausdruck nur zu unterschreiben.',
    source:'§ 2247 BGB',
    url:'https://www.gesetze-im-internet.de/bgb/__2247.html'
  }
};

function legalInfoCard(k){
  const i=LEGAL_DOC_INFO[k];if(!i)return '';
  return `<div class="legal-info-card no-print">
    <div class="legal-info-head"><div class="legal-info-icon">⚖️</div><div><b>Wann gilt bzw. wirkt dieses Dokument?</b><small>Wichtiger rechtlicher Hinweis</small></div></div>
    <div class="legal-info-row"><span>Wann relevant?</span><p>${esc(i.when)}</p></div>
    <div class="legal-info-row"><span>Besonders wichtig</span><p>${esc(i.important)}</p></div>
    <div class="legal-info-row"><span>Form</span><p>${esc(i.form)}</p></div>
    ${i.url?`<button class="cta ghost small-btn" onclick="window.open('${i.url}','_blank','noopener')">Offizielle Quelle: ${esc(i.source)} ↗</button>`:''}
  </div>`;
}

function vorsorgeUseRuleCard(fd={}){
  return `<div class="form-card no-print internal-rule-card">
    <div class="section-help-title"><h3>Interne Nutzungsregel der Vollmacht</h3><button type="button" class="help-btn" aria-expanded="false" onclick="toggleFormHelp('ffVUseRule',this)">?</button></div>
    <div class="field-help" id="help_ffVUseRule" hidden>Die Vorsorgevollmacht ist nach außen grundsätzlich sofort wirksam. Hier hältst du nur fest, ab wann die bevollmächtigte Person sie nach eurer internen Vereinbarung benutzen soll. Diese Regel sollte nicht als aufschiebende Bedingung in die eigentliche Vollmachtsurkunde geschrieben werden.</div>
    ${selectField('Wann darf die bevollmächtigte Person die Vollmacht nach eurer internen Vereinbarung benutzen?','ffVUseRule',fd.vUseRule||'',['|Bitte auswählen','immediately|Sofort','whenUnable|Erst wenn ich meine Angelegenheiten nicht mehr selbst regeln kann','onRequest|Nur nach meiner ausdrücklichen Aufforderung','custom|Eigene Vereinbarung'])}
    ${textareaField('Eigene interne Vereinbarung / Hinweise','ffVUseNotes',fd.vUseNotes||'','Diese Angaben bleiben in der App und werden nicht in die Vollmachtsurkunde gedruckt.')}
    <div class="notice"><b>Wichtig:</b> Diese Auswahl regelt grundsätzlich nur das Innenverhältnis zwischen dir und der bevollmächtigten Person. Gegenüber Dritten bleibt die Vollmacht grundsätzlich ab Ausstellung verwendbar.</div>
  </div>`;
}


function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;['profile','case','docs','settings','persons','cases','meta','templates'].forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s)});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function idbGet(store,key){return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function idbSet(store,key,val){return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(val,key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function fmtDate(v){if(!v)return '';const d=new Date(v+'T00:00:00');return isNaN(d)?v:d.toLocaleDateString('de-DE')}
function uid(prefix='id'){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`}
function toast(msg){const t=document.getElementById('toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1900)}
function activePerson(){return state.persons.find(p=>p.id===state.activePersonId)||null}
function personName(p){return p?[p.profile?.firstName,p.profile?.lastName].filter(Boolean).join(' ')||'Unbenannte Person':'Keine Person gewählt'}
function relationLabel(v){return RELATIONS[v]||'Angehörige/r'}
function relationEmoji(r){return ({self:'👤',partner:'❤️',mother:'👵',father:'👴',child:'🧒',sibling:'🧑',other:'👥'})[r]||'👤'}
function normalizePerson(p){p.profile=p.profile||{};p.contacts=p.contacts||p.emergencyContacts||[];delete p.emergencyContacts;p.medical=p.medical||{};p.zvr=p.zvr||{};p.bestattung=p.bestattung||{};p.digital=p.digital||{};p.documents=p.documents||{};for(const k of Object.keys(DOCS)){const v=p.documents[k];if(typeof v==='boolean')p.documents[k]={status:v?'available':'missing'};else if(!v)p.documents[k]={status:'missing'};}return p}
function docStatus(p,k){return normalizePerson(p).documents[k]?.status||'missing'}
function isDocDone(p,k){return ['available','registered'].includes(docStatus(p,k))}
function completion(p=activePerson()){
 if(!p)return 0;normalizePerson(p);const x=p.profile||{};
 const base=['firstName','lastName','birthDate','street','zip','city','phone','healthInsurance'].filter(k=>x[k]).length/8;
 const important=['vorsorge','patienten','betreuung','bank','schweigepflicht'].filter(k=>isDocDone(p,k)).length/5;
 const contacts=(p.contacts||[]).length?1:0;
 const zvr=p.zvr?.registered?1:0;
 const wishes=(p.bestattung?.type||p.bestattung?.notes||isDocDone(p,'bestattung'))?1:0;
 return Math.round((base*.25+important*.45+contacts*.12+zvr*.10+wishes*.08)*100);
}
function appTop(title,sub=''){return `<div class="topbar"><button class="cta ghost back-btn" onclick="back()">‹</button><div class="grow"><h1>${esc(title)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:''}</div></div>`}
const nav=()=>`<nav class="bottom-nav no-print"><button class="nav-btn ${state.route==='home'?'active':''}" onclick="go('home')"><span class="ni">⌂</span>Start</button><button class="nav-btn ${['documents','document-detail'].includes(state.route)?'active':''}" onclick="go('documents')"><span class="ni">▤</span>Dokumente</button><button class="nav-btn ${state.route==='case'?'active':''}" onclick="go('case')"><span class="ni">◷</span>Sterbefall</button><button class="nav-btn ${['profile','backup'].includes(state.route)?'active':''}" onclick="go('profile')"><span class="ni">●</span>Profil</button></nav>`;
function go(r){state.route=r;render();window.scrollTo(0,0)}
function back(){const map={'person-edit':'vorsorge','vorsorge-person':'vorsorge','profile':'vorsorge-person','trusted':'vorsorge-person','documents':'vorsorge-person','document-detail':'documents','form-fill':'document-detail','official-pdf':state.officialPdfKey==='zvrP'?'zvr':'document-detail','medical':'vorsorge-person','zvr':'vorsorge-person','bestattung':'vorsorge-person','digital':'vorsorge-person','emergency':'home','serious':'home','case':'home','application':'case','application-preview':'application','generator':'case','backup':'profile','share':'vorsorge-person','share-import':'home'};go(map[state.route]||'home')}
function render(){const a=document.getElementById('app');let html='';const r=state.route;if(r==='welcome')html=welcome();else if(r==='home')html=home()+nav();else if(r==='vorsorge')html=vorsorgePeople()+nav();else if(r==='vorsorge-person')html=vorsorgePerson()+nav();else if(r==='person-edit')html=personEdit()+nav();else if(r==='profile')html=profile()+nav();else if(r==='trusted')html=trusted()+nav();else if(r==='documents')html=documents()+nav();else if(r==='document-detail')html=documentDetail()+nav();else if(r==='form-fill')html=formFill()+nav();else if(r==='official-pdf')html=officialPdfScreen()+nav();else if(r==='medical')html=medical()+nav();else if(r==='zvr')html=zvr()+nav();else if(r==='bestattung')html=bestattung()+nav();else if(r==='digital')html=digital()+nav();else if(r==='emergency')html=emergency();else if(r==='serious')html=serious()+nav();else if(r==='case')html=caseScreen()+nav();else if(r==='application')html=applicationScreen()+nav();else if(r==='application-preview')html=applicationPreview()+nav();else if(r==='generator')html=generator()+nav();else if(r==='backup')html=backup()+nav();else if(r==='share')html=shareScreen()+nav();else if(r==='share-import')html=shareImportScreen();a.innerHTML=html;}
function noPerson(title){return `<section class="screen">${appTop(title)}<div class="content"><div class="empty-card"><div class="empty-icon">👥</div><h3>Noch keine Person ausgewählt</h3><p>Lege in der Vorsorge zuerst eine Person an.</p><button class="cta teal full" onclick="go('vorsorge')">Zur Vorsorge</button></div></div></section>`}
function personSwitch(p){return `<button class="person-switch" onclick="go('vorsorge')"><span>${relationEmoji(p.relation)} ${esc(personName(p))}</span><small>${esc(relationLabel(p.relation))} · Person wechseln</small></button>`}

const FORM_HELP={
  ffVHealthAll:'Die bevollmächtigte Person darf Entscheidungen zu ärztlicher Behandlung, Pflege und Versorgung treffen und deinen festgelegten Willen gegenüber Ärzten und Einrichtungen vertreten.',
  ffVHealthRisk:'Hier geht es um besonders wichtige medizinische Entscheidungen, bei denen die Behandlung oder ihre Ablehnung zum Tod oder zu schweren länger dauernden Gesundheitsschäden führen kann.',
  ffVRecords:'Die bevollmächtigte Person darf medizinische Unterlagen einsehen und Informationen von Ärzten erhalten. Dafür werden die behandelnden Personen ihr gegenüber von der Schweigepflicht entbunden.',
  ffVDetention:'Damit darf die bevollmächtigte Person einer Unterbringung in einer geschlossenen Einrichtung zustimmen. Das ist nur unter strengen gesetzlichen Voraussetzungen zulässig und benötigt regelmäßig eine gerichtliche Genehmigung.',
  ffVRestriction:'Gemeint sind Maßnahmen, die die Bewegungsfreiheit einschränken, zum Beispiel Bettgitter, Fixierungen oder bestimmte Medikamente. Dafür gelten strenge Voraussetzungen und häufig ist eine gerichtliche Genehmigung nötig.',
  ffVForcedTreatment:'Gemeint ist eine medizinische Behandlung gegen den natürlichen Willen der betroffenen Person. Sie ist nur in engen Ausnahmefällen und unter gesetzlichen Schutzvorgaben zulässig.',
  ffVHospitalTransfer:'Damit kann die bevollmächtigte Person unter den gesetzlichen Voraussetzungen einer Verbringung ins Krankenhaus zustimmen, wenn dort eine ärztliche Zwangsmaßnahme durchgeführt werden soll.',
  ffVResidence:'Die bevollmächtigte Person darf entscheiden, wo du wohnst oder betreut wirst, zum Beispiel zu Hause, in einer Pflegeeinrichtung oder an einem anderen geeigneten Ort.',
  ffVRentalRights:'Die bevollmächtigte Person darf deinen bestehenden Mietvertrag verwalten, kündigen und gegebenenfalls deinen Haushalt auflösen.',
  ffVNewRental:'Damit darf die bevollmächtigte Person für dich einen neuen Mietvertrag abschließen oder wieder kündigen.',
  ffVWBVG:'Das betrifft Verträge über Wohnen mit Pflege- oder Betreuungsleistungen, zum Beispiel in einem Pflegeheim oder einer betreuten Wohnform.',
  ffVAuthorities:'Die bevollmächtigte Person darf dich gegenüber Behörden, Versicherungen, Rentenstellen und Sozialleistungsträgern vertreten und dort notwendige Erklärungen abgeben.',
  ffVAssetsAll:'Damit darf die bevollmächtigte Person dein Vermögen allgemein verwalten und in deinem Namen rechtliche Geschäfte vornehmen.',
  ffVAssetDispose:'Die bevollmächtigte Person darf über Vermögenswerte verfügen, zum Beispiel Gegenstände verkaufen. Für Immobilien und bestimmte Geschäfte gelten zusätzliche Formvorschriften.',
  ffVPayments:'Die bevollmächtigte Person darf für dich Geld, Leistungen oder Wertgegenstände annehmen.',
  ffVDebts:'Damit darf die bevollmächtigte Person in deinem Namen Verpflichtungen eingehen, aus denen Zahlungen oder Schulden entstehen können.',
  ffVBank:'Die bevollmächtigte Person darf Bankangelegenheiten erledigen. Banken verlangen in der Praxis häufig zusätzlich ihr eigenes Vollmachtsformular.',
  ffVGifts:'Die bevollmächtigte Person darf nur Schenkungen vornehmen, soweit dies rechtlich zulässig ist. Größere oder ungewöhnliche Schenkungen sind damit nicht automatisch erlaubt.',
  ffVExcludedBusiness:'Hier kannst du ausdrücklich festlegen, welche Geschäfte die bevollmächtigte Person trotz der Vollmacht nicht durchführen darf.',
  ffVPost:'Die bevollmächtigte Person darf deine Post und elektronische Kommunikation entgegennehmen, öffnen und verwalten, soweit die Vollmacht reicht.',
  ffVCourt:'Damit darf die bevollmächtigte Person dich in gerichtlichen Verfahren vertreten und notwendige Prozesshandlungen vornehmen.',
  ffVSubPower:'Die bevollmächtigte Person darf einer weiteren Person eine Untervollmacht erteilen. Wenn du das nicht möchtest, wähle Nein.',
  ffVGuardianship:'Falls trotz der Vollmacht später doch ein gerichtlicher Betreuer nötig wird, soll diese Vertrauensperson bevorzugt als Betreuer/in vorgeschlagen werden.',
  ffVAfterDeath:'Die bevollmächtigte Person darf nach deinem Tod zunächst weiter aufgrund der Vollmacht handeln. Für bestimmte Geschäfte, etwa Grundbuchangelegenheiten, können trotzdem besondere Formanforderungen gelten.',
  ffVFurther:'Hier kannst du zusätzliche Wünsche, Einschränkungen oder Anweisungen festhalten, die in den vorherigen Punkten nicht vorkommen.',

  ffPSituationDying:'Gemeint ist eine Situation, in der der Sterbeprozess bereits begonnen hat und nach ärztlicher Einschätzung nicht mehr aufgehalten werden kann.',
  ffPSituationTerminal:'Gemeint ist das Endstadium einer unheilbaren, tödlich verlaufenden Krankheit. Der Tod muss dabei nicht unmittelbar bevorstehen.',
  ffPSituationBrain:'Gemeint ist eine schwere, nicht mehr rückgängig zu machende Gehirnschädigung, durch die Einsicht, Entscheidungen und Kontakt zur Umwelt dauerhaft verloren gegangen sind.',
  ffPSituationDementia:'Gemeint ist ein sehr weit fortgeschrittener Abbau geistiger Fähigkeiten, bei dem auch Essen und Trinken trotz Hilfe nicht mehr auf natürliche Weise möglich sind.',
  ffPSituationOwn:'Hier kannst du eine weitere konkrete Krankheitssituation beschreiben, für die deine Patientenverfügung gelten soll.',
  ffPLife:'Hier legst du fest, ob Ärzte in den zuvor ausgewählten Situationen lebensverlängernde Behandlungen einsetzen sollen. Einzelne Maßnahmen wie Beatmung, Ernährung oder Wiederbelebung werden darunter noch genauer festgelegt.',
  ffPPain:'Hier geht es darum, Schmerzen, Atemnot, Angst und andere Beschwerden zu lindern. Sehr starke Medikamente können dabei als Nebenwirkung Müdigkeit oder Bewusstseinsdämpfung verursachen.',
  ffPAcceptShortening:'Manche wirksamen Medikamente gegen starke Schmerzen oder Atemnot können unbeabsichtigt die Lebenszeit verkürzen. Hier erklärst du, ob du dieses mögliche Risiko zur wirksamen Beschwerdelinderung akzeptierst.',
  ffPNutrition:'Künstliche Ernährung bedeutet zum Beispiel Ernährung über eine Magensonde. Flüssigkeit kann auch über eine Infusion gegeben werden. Hier legst du fest, ob und wofür diese Maßnahmen eingesetzt werden sollen.',
  ffPResuscitation:'Wiederbelebung bedeutet Maßnahmen bei Herz- oder Atemstillstand, zum Beispiel Herzdruckmassage, Beatmung und gegebenenfalls elektrische Schocks.',
  ffPNoEmergencyDoctor:'Diese Festlegung betrifft Situationen, in denen deine Patientenverfügung eindeutig gilt und du Wiederbelebung ablehnst. Im Notfall muss der Wille schnell und eindeutig erkennbar sein.',
  ffPResuscitationAll:'Hier kannst du zusätzlich bestimmen, ob deine Entscheidung zur Wiederbelebung auch außerhalb der zuvor beschriebenen schweren Krankheitssituationen gelten soll.',
  ffPVentilation:'Künstliche Beatmung unterstützt oder ersetzt die eigene Atmung, zum Beispiel über einen Beatmungsschlauch oder eine Beatmungsmaske.',
  ffPDialysis:'Dialyse ist eine Blutwäsche. Sie übernimmt bei schwerem Nierenversagen einen Teil der Aufgabe der Nieren.',
  ffPAntibiotics:'Antibiotika behandeln bakterielle Infektionen. Hier entscheidest du, ob sie zur Lebensverlängerung, nur zur Beschwerdelinderung oder gar nicht eingesetzt werden sollen.',
  ffPBlood:'Gemeint sind Bluttransfusionen oder einzelne Blutbestandteile. Sie können zum Beispiel bei schwerer Blutarmut oder Blutverlust eingesetzt werden.',
  ffPPlace:'Hier kannst du festhalten, wo du möglichst behandelt und begleitet werden möchtest, zum Beispiel zu Hause, im Hospiz oder im Krankenhaus.',
  ffPConfidentiality:'Hier legst du fest, welche Personen medizinische Informationen erhalten dürfen und wem Ärzte Auskunft geben dürfen.',
  ffPOtherDirectives:'Hier trägst du ein, ob zusätzlich eine Vorsorgevollmacht oder Betreuungsverfügung besteht und wo sie zu finden ist.',
  ffPOrgan:'Eine Organspende kann in einzelnen Situationen Maßnahmen erfordern, die mit einer Patientenverfügung kollidieren können. Hier legst du fest, welcher Wunsch in diesem Fall Vorrang haben soll.',
  ffValues:'Hier kannst du persönliche Werte, religiöse Überzeugungen, Ängste oder Vorstellungen zu Lebensqualität festhalten. Das hilft bei der Auslegung deiner Wünsche.',

  ffBPrimarySection:'Diese Person soll vom Gericht bevorzugt als Betreuer/in bestellt werden, wenn tatsächlich eine rechtliche Betreuung erforderlich wird.',
  ffBFallbackSection:'Diese Person soll ersatzweise Betreuer/in werden, wenn die zuerst gewünschte Person nicht zur Verfügung steht oder nicht bestellt werden kann.',
  ffBExcludeSection:'Diese Person soll ausdrücklich nicht als Betreuer/in bestellt werden.',
  ffBWish1:'Hier kannst du konkrete Wünsche für eine mögliche Betreuung festhalten, zum Beispiel zur Wohnung, Pflege, Gesundheit oder Vermögensverwaltung.',
  ffBWish2:'Hier kannst du einen weiteren konkreten Wunsch für eine mögliche Betreuung festhalten.',
  ffBWish3:'Hier kannst du einen weiteren konkreten Wunsch für eine mögliche Betreuung festhalten.',
  ffBWish4:'Hier kannst du einen weiteren konkreten Wunsch für eine mögliche Betreuung festhalten.',

  ffBankAddress:'Trage hier die Bank oder Sparkasse ein, bei der die Vollmacht gelten soll. Viele Institute möchten die Vollmacht zusätzlich mit ihrem eigenen Formular aufnehmen.',

  ffProviders:'Du legst fest, ob die Schweigepflichtentbindung für alle behandelnden Stellen oder nur für ausdrücklich genannte Ärzte und Einrichtungen gelten soll.',
  ffNamedProviders:'Wenn du nur bestimmte Stellen freigibst, trägst du sie hier möglichst eindeutig ein.',
  ffDiagnosis:'Erlaubt die Weitergabe von Diagnosen und medizinischen Befunden an die ausgewählte Person.',
  ffTreatment:'Erlaubt Informationen über Behandlungen, Operationen und Therapien.',
  ffMedication:'Erlaubt Informationen darüber, welche Medikamente eingenommen oder verordnet werden.',
  ffCare:'Erlaubt Informationen zur Pflege, Entlassung aus Krankenhaus oder Einrichtung und zur weiteren Versorgung.',
  ffNotes:'Hier kannst du die Entbindung einschränken, zum Beispiel auf einen bestimmten Zweck, Zeitraum oder bestimmte Informationen.',

  ffFuneralType:'Hier kannst du die gewünschte Art der Bestattung festhalten. Das ist ein Wunsch für die Angehörigen und sollte möglichst mit ihnen besprochen werden.',
  ffUndertaker:'Wenn bereits ein Bestattungsvorsorgevertrag besteht oder ein bestimmter Bestatter gewünscht ist, kannst du ihn hier eintragen.',

  ffOrganDecision:'Wähle genau eine Variante: vollständige Zustimmung, Zustimmung mit Ausnahmen, nur bestimmte Organe/Gewebe, Ablehnung oder Entscheidung durch eine andere Person.',
  ffOrganLimits:'Hier werden bei eingeschränkter Zustimmung die Organe oder Gewebe genannt, die ausgeschlossen oder ausdrücklich freigegeben werden sollen.',
  ffOrganNotes:'Hier können besondere Hinweise ergänzt werden. Die eigentliche Entscheidung sollte trotzdem eindeutig aus einer der fünf Auswahlmöglichkeiten hervorgehen.',

  ffHeirs:'Hier notierst du, wer später Erbe werden soll. Das ist nur eine Vorbereitung: Ein privates Testament muss grundsätzlich vollständig eigenhändig geschrieben und unterschrieben werden.',
  ffLegacies:'Ein Vermächtnis bedeutet, dass eine Person einen bestimmten Gegenstand oder Geldbetrag erhalten soll, ohne dadurch automatisch Erbe zu werden.',
  ffTestamentNotes:'Hier kannst du Ersatzerben, Bedingungen oder den Wunsch nach Testamentsvollstreckung vorbereiten. Für die endgültige Gestaltung können rechtliche oder notarielle Beratung sinnvoll sein.',
  ffTestamentStorage:'Hier notierst du, wo das später wirksam errichtete Testament aufbewahrt wird. Das Vorbereitungsblatt selbst ist kein Testament.'
};

function helpText(key){if(key==='ffVUseRule')return 'Die Vollmacht ist gegenüber Dritten grundsätzlich sofort wirksam. Hier legst du nur fest, ab wann die bevollmächtigte Person sie nach eurer internen Vereinbarung benutzen soll.';return FORM_HELP[key]||''}
function helpMarkup(key,label=''){
  const text=helpText(key);if(!text)return '';
  return `<button type="button" class="help-btn no-print" aria-label="Erklärung zu ${esc(label)}" aria-expanded="false" onclick="toggleFormHelp('${key}',this)">?</button>`;
}
function helpBox(key){
  const text=helpText(key);if(!text)return '';
  return `<div class="field-help no-print" id="help_${key}" hidden>${esc(text)}</div>`;
}
function toggleFormHelp(key,btn){
  const box=document.getElementById('help_'+key);if(!box)return;
  const opening=box.hidden;
  document.querySelectorAll('.field-help:not([hidden])').forEach(el=>{
    if(el!==box){el.hidden=true;const b=el.parentElement?.querySelector('.help-btn');if(b)b.setAttribute('aria-expanded','false')}
  });
  box.hidden=!opening;
  if(btn)btn.setAttribute('aria-expanded',opening?'true':'false');
}

function field(label,key,val='',type='text',hint=''){return `<div class="field"><div class="field-label-row"><label for="${key}">${esc(label)}</label>${helpMarkup(key,label)}</div>${helpBox(key)}<input type="${type}" id="${key}" value="${esc(val||'')}" />${hint?`<small>${esc(hint)}</small>`:''}</div>`}
function textareaField(label,key,val='',hint=''){return `<div class="field"><div class="field-label-row"><label for="${key}">${esc(label)}</label>${helpMarkup(key,label)}</div>${helpBox(key)}<textarea id="${key}" rows="4">${esc(val||'')}</textarea>${hint?`<small>${esc(hint)}</small>`:''}</div>`}
function selectField(label,key,val,opts){return `<div class="field"><div class="field-label-row"><label for="${key}">${esc(label)}</label>${helpMarkup(key,label)}</div>${helpBox(key)}<select id="${key}">${opts.map(o=>{const [v,l]=String(o).includes('|')?String(o).split('|'):[o,o||'Bitte auswählen'];return `<option value="${esc(v)}" ${v===val?'selected':''}>${esc(l)}</option>`}).join('')}</select></div>`}
function task(title,done,meta,route){return `<button class="list-item ${done?'done':''}" onclick="go('${route}')"><div class="dot">${done?'✓':''}</div><div class="grow"><b>${esc(title)}</b><div class="meta">${esc(meta)}</div></div><div class="chev">›</div></button>`}
function openOfficial(k){const u=OFFICIAL[k];if(u)window.open(u,'_blank','noopener')}

function welcome(){return `<section class="screen"><div class="hero"><div class="hero-badge">🤲</div><h1>Sterbefall<br>Assistent</h1><p>Vorsorge, schwere Erkrankung und Sterbefall – verständlich, Schritt für Schritt und local first.</p><button class="cta" onclick="go('home')">Jetzt starten →</button></div><div class="content"><div class="notice"><b>Local first:</b> Persönliche Daten werden standardmäßig nur in diesem Browser auf diesem Gerät gespeichert.</div></div></section>`}
function home(){const p=activePerson();return `<section class="screen">${appTop('Willkommen','Was möchten Sie tun?')}<div class="content">${p?`<div class="active-summary"><span>${relationEmoji(p.relation)}</span><div class="grow"><small>Aktive Person</small><b>${esc(personName(p))}</b></div><button onclick="go('vorsorge')">Wechseln</button></div>`:''}<div class="grid-menu"><button class="menu-card" onclick="go('vorsorge')"><div class="icon">🌿</div><div><h3>Vorsorge</h3><p>Personen, Vollmachten, Wünsche und Notfallinformationen</p></div><div class="arrow">›</div></button><button class="menu-card yellow" onclick="go('serious')"><div class="icon">❤</div><div><h3>Schwere Erkrankung</h3><p>Was jetzt vorbereitet und geklärt werden sollte</p></div><div class="arrow">›</div></button><button class="menu-card" onclick="go('case')"><div class="icon">🕯</div><div><h3>Sterbefall</h3><p>Geführte Fallakte und nächste Schritte</p></div><div class="arrow">›</div></button><button class="menu-card yellow" onclick="go('documents')"><div class="icon">📄</div><div><h3>Dokumente</h3><p>Dokumentstatus und offizielle Formulare</p></div><div class="arrow">›</div></button></div><div class="section-title"><h2>Schnellzugriff</h2></div><div class="row"><button class="cta teal full" onclick="go('emergency')">🚨 Notfallkarte</button><button class="cta ghost full" onclick="go('backup')">💾 Datensicherung</button></div></div></section>`}

function vorsorgePeople(){const cards=state.persons.length?state.persons.map(personCard).join(''):`<div class="empty-card"><div class="empty-icon">👥</div><h3>Noch keine Person angelegt</h3><p>Lege dich selbst oder einen Angehörigen an.</p></div>`;return `<section class="screen">${appTop('Vorsorge','Für Sie selbst und Angehörige')}<div class="content"><div class="section-title"><h2>Für wen möchten Sie vorsorgen?</h2></div><div class="person-grid">${cards}</div><button class="cta full" style="margin-top:14px" onclick="newPerson()">＋ Person hinzufügen</button><div class="notice" style="margin-top:14px">Jede Person besitzt einen eigenen Vorsorgestatus, eigene Unterlagen und eigene Notfallinformationen.</div></div></section>`}
function personCard(p){const pct=completion(p);return `<div class="person-card ${p.id===state.activePersonId?'selected':''}"><button class="person-main" onclick="selectPerson('${p.id}')"><div class="avatar">${relationEmoji(p.relation)}</div><div class="grow"><b>${esc(personName(p))}</b><div class="small muted">${esc(relationLabel(p.relation))}</div><div class="person-progress"><span style="width:${pct}%"></span></div><div class="small">Vorsorge ${pct}%</div></div><div class="chev">›</div></button><div class="person-actions"><button onclick="editPerson('${p.id}')">Bearbeiten</button><button class="danger-link" onclick="deletePerson('${p.id}')">Löschen</button></div></div>`}
function newPerson(){state.editPersonId=null;go('person-edit')}
function editPerson(id){state.editPersonId=id;go('person-edit')}
async function selectPerson(id){state.activePersonId=id;await saveMeta();go('vorsorge-person')}
async function deletePerson(id){const p=state.persons.find(x=>x.id===id);if(!p||!confirm(`${personName(p)} wirklich löschen? Alle lokalen Vorsorgedaten dieser Person werden gelöscht.`))return;state.persons=state.persons.filter(x=>x.id!==id);state.cases=state.cases.filter(c=>c.personId!==id);if(state.activePersonId===id)state.activePersonId=state.persons[0]?.id||null;await persistAll();toast('Person gelöscht');render()}
function personEdit(){const p=state.editPersonId?state.persons.find(x=>x.id===state.editPersonId):null,x=p?.profile||{};return `<section class="screen">${appTop(p?'Person bearbeiten':'Person hinzufügen','Nur wenige Angaben zum Start')}<div class="content"><div class="form-card"><h3>Grunddaten</h3>${selectField('Beziehung','personRelation',p?.relation||'other',['self|Ich','partner|Partner/in','mother|Mutter','father|Vater','child|Kind','sibling|Geschwister','other|Andere Person'])}${field('Vorname','personFirst',x.firstName)}${field('Nachname','personLast',x.lastName)}${field('Geburtsdatum','personBirth',x.birthDate,'date')}</div><button class="cta teal full" onclick="savePersonBasic()">${p?'Änderungen speichern':'Person anlegen'}</button></div></section>`}
async function savePersonBasic(){const relation=document.getElementById('personRelation').value,firstName=document.getElementById('personFirst').value.trim(),lastName=document.getElementById('personLast').value.trim(),birthDate=document.getElementById('personBirth').value;if(!firstName||!lastName){toast('Vor- und Nachname bitte ausfüllen');return}if(state.editPersonId){const p=state.persons.find(x=>x.id===state.editPersonId);p.relation=relation;p.profile={...(p.profile||{}),firstName,lastName,birthDate};normalizePerson(p)}else{const p=normalizePerson({id:uid('person'),relation,profile:{firstName,lastName,birthDate}});state.persons.push(p);state.activePersonId=p.id}await persistPersons();state.editPersonId=null;toast('Person gespeichert');go('vorsorge')}

function moduleCard(icon,title,desc,meta,route,done=false){return `<button class="module-card ${done?'complete':''}" onclick="go('${route}')"><div class="module-icon">${icon}</div><div class="grow"><b>${esc(title)}</b><p>${esc(desc)}</p>${meta?`<small>${esc(meta)}</small>`:''}</div><div class="chev">›</div></button>`}
function vorsorgePerson(){const p=activePerson();if(!p)return noPerson('Vorsorge');const pct=completion(p);normalizePerson(p);const x=p.profile;const docsDone=Object.keys(DOCS).filter(k=>isDocDone(p,k)).length;return `<section class="screen">${appTop('Vorsorge',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}<div class="progress-card"><div class="progress-ring" style="--p:${pct}"><div style="text-align:center"><b>${pct}%</b><br><span>vorbereitet</span></div></div><p class="muted center">Die wichtigsten Angaben werden nur einmal erfasst und in den Bereichen wiederverwendet.</p></div><div class="section-title"><h2>Vorsorge-Bereiche</h2></div><div class="module-list">${moduleCard('👤','Stammdaten','Adresse, Versicherung und wichtige Kennnummern',x.street?'Stammdaten teilweise erfasst':'Noch ergänzen','profile',!!x.street)}${moduleCard('👥','Vertrauenspersonen','Bevollmächtigte und Notfallkontakte',(p.contacts||[]).length?`${p.contacts.length} Kontakt(e)`:'Noch keine Kontakte','trusted',(p.contacts||[]).length>0)}${moduleCard('📄','Dokumente & Vollmachten','Vorsorgevollmacht, Patientenverfügung, Bankvollmacht …',`${docsDone} von ${Object.keys(DOCS).length} dokumentiert`,'documents',docsDone>=5)}${moduleCard('🩺','Medizin & Krankenhaus','Hausarzt, wichtige Hinweise, Organspende und Auffindbarkeit',p.medical?.doctorName?'Hausarzt hinterlegt':'Noch ergänzen','medical',!!p.medical?.doctorName)}${moduleCard('🏛️','Zentrales Vorsorgeregister','Registrierung und Aufbewahrungsort dokumentieren',p.zvr?.registered?'Als registriert markiert':'Noch nicht registriert','zvr',!!p.zvr?.registered)}${moduleCard('🕯️','Bestattungswünsche','Wünsche festhalten, damit Angehörige nicht raten müssen',p.bestattung?.type||p.bestattung?.notes?'Wünsche vorhanden':'Noch offen','bestattung',!!(p.bestattung?.type||p.bestattung?.notes))}${moduleCard('🔑','Digitaler Nachlass','Konten, Geräte und Zugangshinweise – ohne Passwörter im Klartext',p.digital?.contactName?'Vertrauensperson hinterlegt':'Noch offen','digital',!!p.digital?.contactName)}</div><button class="cta ghost full mt16" onclick="openShare('person')">↗ Daten an Angehörige weitergeben</button><div class="notice" style="margin-top:16px"><b>Hinweis:</b> Die App ersetzt keine medizinische oder rechtliche Beratung. Bei rechtlich relevanten Dokumenten verlinkt sie bevorzugt auf offizielle Formulare und Informationen.</div></div></section>`}

function profile(){const p=activePerson();if(!p)return noPerson('Stammdaten');const x=p.profile||{};return `<section class="screen">${appTop('Stammdaten',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}<div class="form-card"><h3>Persönliche Daten</h3><div class="two">${selectField('Anrede','salutation',x.salutation||'',['|Bitte auswählen','Frau','Herr','keine'])}${field('Titel','title',x.title)}</div><div class="two">${field('Vorname','firstName',x.firstName)}${field('Nachname','lastName',x.lastName)}</div><div class="two">${field('Geburtsname','birthName',x.birthName)}${field('Geburtsort','birthPlace',x.birthPlace)}</div><div class="two">${field('Geburtsdatum','birthDate',x.birthDate,'date')}${selectField('Familienstand','maritalStatus',x.maritalStatus||'',['|Bitte auswählen','ledig','verheiratet','geschieden','verwitwet','Lebenspartnerschaft'])}</div></div><div class="form-card"><h3>Kontakt & Adresse</h3>${field('Straße / Hausnummer','street',x.street)}${field('Adresszusatz','addressAddition',x.addressAddition)}<div class="two">${field('PLZ','zip',x.zip)}${field('Ort','city',x.city)}</div><div class="two">${field('Land','country',x.country||'Deutschland')}${field('Telefon','phone',x.phone,'tel')}</div>${field('E-Mail','email',x.email,'email')}</div><div class="form-card"><h3>Versicherung & Identifikation</h3>${field('Krankenkasse','healthInsurance',x.healthInsurance)}${field('Versichertennummer','healthInsuranceNo',x.healthInsuranceNo)}${field('Rentenversicherungsnummer','pensionNo',x.pensionNo)}${field('Steuer-ID','taxId',x.taxId,'text','Optional – nur speichern, wenn gewünscht.')}</div><button class="cta teal full" onclick="saveProfile()">Speichern</button><button class="cta ghost full mt10" onclick="go('backup')">Datensicherung & Export</button></div></section>`}
async function saveProfile(){const p=activePerson();if(!p)return;['salutation','title','firstName','lastName','birthName','birthPlace','birthDate','maritalStatus','street','addressAddition','zip','city','country','phone','email','healthInsurance','healthInsuranceNo','pensionNo','taxId'].forEach(k=>p.profile[k]=document.getElementById(k)?.value?.trim()||'');await persistPersons();toast('Stammdaten lokal gespeichert');render()}

function trusted(){const p=activePerson();if(!p)return noPerson('Vertrauenspersonen');const list=(p.contacts||[]).map((c,i)=>`<div class="contact-card"><div class="avatar small-avatar">${c.isEmergency?'🚨':'👤'}</div><div class="grow"><b>${esc(c.name||'Unbenannt')}</b><div class="small muted">${esc(c.role||'Vertrauensperson')}</div><div class="small">${esc(c.phone||'Keine Telefonnummer')}</div></div><button class="danger-link" onclick="removeContact(${i})">Entfernen</button></div>`).join('');return `<section class="screen">${appTop('Vertrauenspersonen',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}${list||'<div class="empty-card"><div class="empty-icon">👥</div><h3>Noch keine Vertrauensperson</h3><p>Hinterlege mindestens einen gut erreichbaren Kontakt.</p></div>'}<div class="form-card"><h3>Kontakt hinzufügen</h3><div class="field"><label>Gespeicherte Person übernehmen</label><select id="contactPersonSource" onchange="applyTrustedPerson()"><option value="">Manuell eingeben</option>${selectablePeopleOptions(p,'')}</select></div>${field('Name','contactName','')}${field('Beziehung / Rolle','contactRole','')}${field('Telefon','contactPhone','','tel')}${field('E-Mail','contactEmail','','email')}<label class="checkline"><input type="checkbox" id="contactEmergency" checked> Als Notfallkontakt anzeigen</label><label class="checkline"><input type="checkbox" id="contactAgent"> Als bevollmächtigte Vertrauensperson markieren</label><button class="cta teal full" onclick="addContact()">＋ Kontakt hinzufügen</button></div></div></section>`}
async function addContact(){const p=activePerson(),name=document.getElementById('contactName').value.trim();if(!name){toast('Bitte einen Namen eingeben');return}p.contacts=p.contacts||[];p.contacts.push({id:uid('contact'),name,role:document.getElementById('contactRole').value.trim(),phone:document.getElementById('contactPhone').value.trim(),email:document.getElementById('contactEmail').value.trim(),isEmergency:document.getElementById('contactEmergency').checked,isAgent:document.getElementById('contactAgent').checked});await persistPersons();toast('Kontakt hinzugefügt');render()}
async function removeContact(i){const p=activePerson();if(!p||!confirm('Kontakt entfernen?'))return;p.contacts.splice(i,1);await persistPersons();render()}
function applyTrustedPerson(){const owner=activePerson(),c=resolveSelectedContact(owner,val('contactPersonSource'));if(!c)return;setVal('contactName',c.name);setVal('contactRole',c.role);setVal('contactPhone',c.phone);setVal('contactEmail',c.email)}

function documents(){const p=activePerson();if(!p)return noPerson('Dokumente');normalizePerson(p);return `<section class="screen">${appTop('Dokumente & Vollmachten',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}${Object.entries(DOCS).map(([k,d])=>docRow(p,k,d)).join('')}<div class="notice" style="margin-top:14px">„Vorhanden“ bedeutet hier nur, dass du den Status dokumentiert hast. Die App prüft nicht automatisch, ob ein Dokument rechtlich wirksam, aktuell oder vollständig ist.</div></div></section>`}
function docRow(p,k,d){const s=docStatus(p,k),label={missing:'Noch nicht vorhanden',draft:'In Vorbereitung',available:'Vorhanden',registered:'Vorhanden / registriert'}[s]||s;return `<button class="doc-row full-button" onclick="openDoc('${k}')"><div class="doc-icon">${d.icon}</div><div class="grow"><b>${esc(d.title)}</b><div class="small muted">${esc(d.desc)}</div>${LEGAL_DOC_INFO[k]?`<div class="legal-mini">⚖️ Rechtlicher Hinweis vorhanden</div>`:''}<div class="status ${s==='missing'?'warn':''}">${s==='missing'?'○':'✓'} ${esc(label)}</div></div><div class="chev">›</div></button>`}
function openDoc(k){state.docKey=k;go('document-detail')}
function attachmentCards(obj){const files=obj.attachments||[];if(!files.length)return `<div class="empty-mini">Noch keine unterschriebene Kopie hinterlegt.</div>`;return `<div class="attachment-grid">${files.map((a,i)=>`<div class="attachment-card">${a.type?.startsWith('image/')?`<img src="${a.dataUrl}" alt="Dokumentfoto">`:`<div class="attachment-pdf">PDF</div>`}<div class="grow"><b>${esc(a.name||'Dokument')}</b><small>${esc(a.addedAt?new Date(a.addedAt).toLocaleDateString('de-DE'):'')}</small></div><div class="attachment-actions"><button onclick="viewDocumentAttachment(${i})">Ansehen</button><button onclick="shareDocumentAttachment(${i})">Teilen</button><button class="danger-link" onclick="removeDocumentAttachment(${i})">Entfernen</button></div></div>`).join('')}</div>`}
function documentDetail(){const p=activePerson();if(!p)return noPerson('Dokument');const k=state.docKey||'vorsorge',d=DOCS[k],obj=normalizePerson(p).documents[k]||{};const directLabel=k==='testament'?'Vorbereitungsblatt ausfüllen':'Formular direkt ausfüllen';return `<section class="screen">${appTop(d.title,`Für ${personName(p)}`)}<div class="content"><div class="info-card"><div class="big-icon">${d.icon}</div><h2>${esc(d.title)}</h2><p>${esc(d.desc)}</p></div>${legalInfoCard(k)}<button class="cta teal full" onclick="go('form-fill')">✍ ${directLabel}</button>${OFFICIAL_PDFS[k]?`<button class="cta ghost full mt10" onclick="openOfficialPdf('${k}')">📄 Lokale Blanko-PDF automatisch befüllen</button>`:''}<div class="notice mt10"><b>Automatische Datenübernahme:</b> Bereits hinterlegte Personen-, Adress- und Kontaktdaten werden automatisch eingesetzt. Das fertige Dokument kann gedruckt, als PDF gespeichert oder über die Teilen-Funktion versendet werden.</div><div class="form-card mt16"><h3>Status & Ablage</h3>${selectField('Dokumentstatus','docStatus',obj.status||'missing',['missing|Noch nicht vorhanden','draft|In Vorbereitung','available|Vorhanden','registered|Vorhanden / registriert'])}${field('Datum / letzte Aktualisierung','docDate',obj.date||'','date')}${field('Aufbewahrungsort','docStorage',obj.storageLocation||'','text','Zum Beispiel: Arbeitszimmer, Notar, Bankschließfach.')}${field('Ordner / Register','docFolder',obj.storageFolder||'','text','Zum Beispiel: roter Vorsorgeordner, Register 3.')}${textareaField('Notizen','docNotes',obj.notes||'')}<button class="cta ghost full" onclick="saveDocumentDetail()">Status & Ablage speichern</button></div><div class="form-card"><h3>Unterschriebene Kopie hinterlegen</h3><p class="muted small">Du kannst ein Foto/Scan des unterschriebenen Dokuments oder eine PDF lokal in der App speichern. Die Datei bleibt auf diesem Gerät.</p><div class="field"><label>Foto, Scan oder PDF</label><input type="file" id="docAttachment" accept="image/*,application/pdf,.pdf" multiple></div><button class="cta teal full" onclick="addDocumentAttachments()">Datei(en) lokal speichern</button><div class="mt16">${attachmentCards(obj)}</div></div>${d.official?`<div class="official-card"><b>Offizielle Quelle zum Gegenprüfen</b><p>Das direkt ausgefüllte App-Dokument kann hier mit den amtlichen Informationen bzw. Formularen abgeglichen werden.</p><button class="cta ghost full" onclick="openOfficial('${d.official}')">Offizielle Seite öffnen ↗</button></div>`:''}${k==='patienten'?`<div class="notice"><b>Patientenverfügung:</b> Medizinische Festlegungen sollten inhaltlich eindeutig sein. Dieser Hinweis erscheint nur in der App und nicht auf dem Ausdruck/PDF.</div>`:''}${k==='testament'?`<div class="notice"><b>Testament:</b> Dieser Bereich bleibt ein Vorbereitungsblatt. Ein ausgedruckter Computertext ist nicht automatisch ein wirksames eigenhändiges Testament.</div>`:''}</div></section>`}
async function saveDocumentDetail(){const p=activePerson(),k=state.docKey;if(!p||!k)return;const prev=p.documents[k]||{};p.documents[k]={...prev,status:document.getElementById('docStatus').value,date:document.getElementById('docDate').value,storageLocation:document.getElementById('docStorage').value.trim(),storageFolder:document.getElementById('docFolder').value.trim(),notes:document.getElementById('docNotes').value.trim()};await persistPersons();toast('Status und Ablage gespeichert');render()}
function fileToDataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(file)})}
async function addDocumentAttachments(){const p=activePerson(),k=state.docKey,input=document.getElementById('docAttachment');if(!p||!k||!input?.files?.length){toast('Bitte mindestens eine Datei auswählen');return}const obj=p.documents[k]=p.documents[k]||{};obj.attachments=obj.attachments||[];for(const f of [...input.files]){if(f.size>20*1024*1024){toast(`${f.name}: größer als 20 MB – übersprungen`);continue}obj.attachments.push({id:uid('att'),name:f.name,type:f.type||'application/octet-stream',size:f.size,addedAt:new Date().toISOString(),dataUrl:await fileToDataUrl(f)})}obj.status=obj.status==='missing'?'available':obj.status;await persistPersons();toast('Dokumentkopie lokal gespeichert');render()}
function dataUrlToFile(dataUrl,name,type){const [head,b64]=dataUrl.split(',');const mime=type||head.match(/data:(.*?);/)?.[1]||'application/octet-stream';const bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return new File([u8],name||'dokument',{type:mime})}
function currentAttachment(i){const p=activePerson(),k=state.docKey;return p?.documents?.[k]?.attachments?.[i]||null}
function viewDocumentAttachment(i){const a=currentAttachment(i);if(!a)return;const w=window.open();if(w)w.location.href=a.dataUrl}
async function shareDocumentAttachment(i){const a=currentAttachment(i);if(!a)return;const f=dataUrlToFile(a.dataUrl,a.name,a.type);if(navigator.share&&navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f],title:a.name,text:'Dokument aus Sterbefall Assistent Deutschland'});return}catch(e){if(e?.name==='AbortError')return}}const link=document.createElement('a');link.href=a.dataUrl;link.download=a.name||'dokument';link.click();toast('Teilen nicht unterstützt – Datei wurde heruntergeladen')}
async function removeDocumentAttachment(i){const p=activePerson(),k=state.docKey;if(!p||!k)return;if(!confirm('Diese lokale Dokumentkopie entfernen?'))return;(p.documents[k].attachments||[]).splice(i,1);await persistPersons();render()}


function personAddress(p){const x=p?.profile||{};return [x.street,[x.zip,x.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
function selectablePeopleOptions(owner,selected=''){return state.persons.filter(x=>x.id!==owner?.id).map(x=>{const v=`person:${x.id}`,isSelected=selected===v||selected===x.id,rel=relationBetween(owner,x);return `<option value="${esc(v)}" ${isSelected?'selected':''}>👤 ${esc(personName(x))} – ${esc(rel)}</option>`}).join('')}
function contactOptions(p,selected=''){const cs=p.contacts||[];const people=selectablePeopleOptions(p,selected);const contacts=cs.map(c=>{const v=`contact:${c.id}`,isSelected=selected===v||selected===c.id;return `<option value="${esc(v)}" ${isSelected?'selected':''}>☎ ${esc(c.name)}${c.role?` – ${esc(c.role)}`:''}</option>`}).join('');return `<option value="">Bitte auswählen / manuell eingeben</option>${people?`<optgroup label="Gespeicherte Personen">${people}</optgroup>`:''}${contacts?`<optgroup label="Zusätzliche Kontakte">${contacts}</optgroup>`:''}`}
function resolveSelectedContact(owner,selection){if(!selection)return null;if(selection.startsWith('person:')){const id=selection.slice(7),q=state.persons.find(x=>x.id===id);if(!q)return null;const x=q.profile||{};return {source:'person',id:q.id,name:personName(q),role:relationLabel(q.relation),phone:x.phone||'',email:x.email||'',address:personAddress(q)}}if(selection.startsWith('contact:')){const id=selection.slice(8),c=(owner?.contacts||[]).find(x=>x.id===id);return c?{...c,source:'contact'}:null}const c=(owner?.contacts||[]).find(x=>x.id===selection);if(c)return {...c,source:'contact'};const q=state.persons.find(x=>x.id===selection&&x.id!==owner?.id);if(q){const x=q.profile||{};return {source:'person',id:q.id,name:personName(q),role:relationLabel(q.relation),phone:x.phone||'',email:x.email||'',address:personAddress(q)}}return null}
function commonIdentityFields(p){const x=p.profile||{};return `<div class="form-card"><h3>Person</h3><div class="autofill-badge">✓ aus Stammdaten übernommen</div><div class="two">${field('Vorname','ffFirst',x.firstName)}${field('Nachname','ffLast',x.lastName)}</div><div class="two">${field('Geburtsdatum','ffBirth',x.birthDate,'date')}${field('Geburtsort','ffBirthPlace',x.birthPlace)}</div>${field('Straße / Hausnummer','ffStreet',x.street)}<div class="two">${field('PLZ','ffZip',x.zip)}${field('Ort','ffCity',x.city)}</div><div class="two">${field('Telefon','ffPhone',x.phone,'tel')}${field('E-Mail','ffEmail',x.email,'email')}</div></div>`}
function agentFields(p,fd={}){return `<div class="form-card"><h3>Vertrauensperson / Bevollmächtigte Person</h3><div class="field"><label>Aus gespeicherten Personen oder Kontakten übernehmen</label><select id="ffContact" onchange="applyFormContact()">${contactOptions(p,fd.contactId||'')}</select></div><div class="two">${field('Name, Vorname','ffAgentName',fd.agentName||'')}${field('Beziehung / Rolle','ffAgentRole',fd.agentRole||'')}</div><div class="two">${field('Geburtsdatum','ffAgentBirth',fd.agentBirth||'','date')}${field('Geburtsort','ffAgentBirthPlace',fd.agentBirthPlace||'')}</div>${field('Anschrift','ffAgentAddress',fd.agentAddress||'')}<div class="two">${field('Telefon','ffAgentPhone',fd.agentPhone||'','tel')}${field('E-Mail','ffAgentEmail',fd.agentEmail||'','email')}</div></div>`}
function formFill(){const p=activePerson();if(!p)return noPerson('Formular');const k=state.docKey||'vorsorge',d=DOCS[k],obj=normalizePerson(p).documents[k]||{},fd=obj.formData||{};let body='';if(k==='vorsorge')body=formVorsorge(p,fd);else if(k==='patienten')body=formPatienten(p,fd);else if(k==='betreuung')body=formBetreuung(p,fd);else if(k==='bank')body=formBank(p,fd);else if(k==='schweigepflicht')body=formSchweigepflicht(p,fd);else if(k==='bestattung')body=formBestattung(p,fd);else if(k==='organe')body=formOrgane(p,fd);else if(k==='testament')body=formTestament(p,fd);return `<section class="screen form-fill-page">${appTop(d.title,`Direkt ausfüllen für ${personName(p)}`)}<div class="content"><div class="notice"><b>Automatisch vorausgefüllt:</b> Stammdaten werden übernommen. Änderungen hier gelten zunächst nur für dieses Formular und überschreiben die Stammdaten nicht.</div>${legalInfoCard(k)}<div class="help-intro no-print"><span class="help-btn static">?</span><span>Bei schwierigen Begriffen auf das Fragezeichen tippen – du erhältst eine kurze Erklärung in einfacher Sprache.</span></div>${body}<div class="row mt16 no-print"><button class="cta teal full" onclick="saveFilledForm()">Speichern</button><button class="cta ghost full" onclick="refreshFormPreview()">Vorschau</button></div><div class="row mt10 no-print"><button class="cta full" onclick="printFilledForm()">🖨 Drucken / PDF</button><button class="cta ghost full" onclick="openShare('document')">↗ Daten-Link teilen</button></div><div id="formPreview" class="print-document">${renderFilledDocument(k,p,fd)}</div></div></section>`}

function ynField(label,id,val=''){return selectField(label,id,val||'',['|Bitte auswählen','yes|Ja','no|Nein'])}
function formVorsorge(p,fd){return `${vorsorgeUseRuleCard(fd)}${commonIdentityFields(p)}${agentFields(p,fd)}
<div class="notice"><b>BMJ-Abgleich:</b> Die folgenden Punkte entsprechen der Reihenfolge und den Ja/Nein-Entscheidungen des BMJ-Formulars „Vorsorgevollmacht“, Stand Januar 2023.</div>
<div class="form-card"><h3>1. Gesundheitssorge / Pflegebedürftigkeit</h3>
${ynField('Alle Angelegenheiten der Gesundheitssorge und Einzelheiten ambulanter/(teil-)stationärer Pflege; Patientenverfügung durchsetzen','ffVHealthAll',fd.vHealthAll)}
${ynField('Einwilligung/Ablehnung/Widerruf bei Untersuchungen, Heilbehandlungen und Eingriffen mit Gefahr des Todes oder schweren länger dauernden Schadens (§ 1829 Abs. 1 und 2 BGB)','ffVHealthRisk',fd.vHealthRisk)}
${ynField('Krankenunterlagen einsehen, Herausgabe bewilligen und Schweigepflichtentbindung','ffVRecords',fd.vRecords)}
${ynField('Freiheitsentziehende Unterbringung (§ 1831 Abs. 1 BGB)','ffVDetention',fd.vDetention)}
${ynField('Freiheitsentziehende Maßnahmen, z. B. Bettgitter/Medikamente (§ 1831 Abs. 4 BGB)','ffVRestriction',fd.vRestriction)}
${ynField('Ärztliche Zwangsmaßnahmen (§ 1832 Abs. 1 BGB)','ffVForcedTreatment',fd.vForcedTreatment)}
${ynField('Verbringung zu stationärem Krankenhausaufenthalt bei ärztlicher Zwangsmaßnahme (§ 1832 Abs. 4 BGB)','ffVHospitalTransfer',fd.vHospitalTransfer)}
</div>
<div class="form-card"><h3>2. Aufenthalt und Wohnungsangelegenheiten</h3>
${ynField('Aufenthalt bestimmen','ffVResidence',fd.vResidence)}
${ynField('Rechte/Pflichten aus bestehendem Mietvertrag einschließlich Kündigung; Haushalt auflösen','ffVRentalRights',fd.vRentalRights)}
${ynField('Neuen Wohnungsmietvertrag abschließen und kündigen','ffVNewRental',fd.vNewRental)}
${ynField('Vertrag nach Wohn- und Betreuungsvertragsgesetz abschließen und kündigen','ffVWBVG',fd.vWBVG)}
</div>
<div class="form-card"><h3>3. Behörden</h3>${ynField('Vertretung bei Behörden, Versicherungen, Renten- und Sozialleistungsträgern einschließlich datenschutzrechtlicher Einwilligung','ffVAuthorities',fd.vAuthorities)}</div>
<div class="form-card"><h3>4. Vermögenssorge</h3>
${ynField('Vermögen verwalten und Rechtshandlungen/Rechtsgeschäfte im In- und Ausland vornehmen','ffVAssetsAll',fd.vAssetsAll)}
${ynField('Über Vermögensgegenstände jeder Art verfügen','ffVAssetDispose',fd.vAssetDispose)}
${ynField('Zahlungen und Wertgegenstände annehmen','ffVPayments',fd.vPayments)}
${ynField('Verbindlichkeiten eingehen','ffVDebts',fd.vDebts)}
${ynField('Willenserklärungen zu Konten, Depots und Safes; Vertretung gegenüber Kreditinstituten','ffVBank',fd.vBank)}
${ynField('Schenkungen im betreuungsrechtlich zulässigen Rahmen','ffVGifts',fd.vGifts)}
${textareaField('Folgende Geschäfte soll die bevollmächtigte Person nicht wahrnehmen können','ffVExcludedBusiness',fd.vExcludedBusiness||'')}
</div>
<div class="form-card"><h3>5-9. Weitere Befugnisse</h3>
${ynField('Post und Fernmeldeverkehr einschließlich elektronischer Kommunikation','ffVPost',fd.vPost)}
${ynField('Vertretung vor Gericht und Prozesshandlungen aller Art','ffVCourt',fd.vCourt)}
${ynField('Untervollmacht erteilen','ffVSubPower',fd.vSubPower)}
${ynField('Falls Betreuung erforderlich wird: Vertrauensperson als Betreuer/in bestellen','ffVGuardianship',fd.vGuardianship)}
${ynField('Vollmacht gilt über den Tod hinaus','ffVAfterDeath',fd.vAfterDeath)}
</div>
<div class="form-card"><h3>10. Weitere Regelungen</h3>${textareaField('Weitere Regelungen','ffVFurther',fd.vFurther||'')}</div>`}

function formPatienten(p,fd){return `${commonIdentityFields(p)}
<div class="notice"><b>Wichtig:</b> Das BMJ veröffentlicht hierfür keine einheitliche amtliche Ankreuzvorlage, sondern Textbausteine. Dieser Assistent bildet deren Aufbau ab und kombiniert nur die von dir gewählten Bausteine.</div>
<div class="form-card"><h3>2.2 Situationen, für die die Verfügung gelten soll</h3>
${checkLine('ffPSituationDying','Unabwendbar im unmittelbaren Sterbeprozess',fd.pSituationDying)}
${checkLine('ffPSituationTerminal','Endstadium einer unheilbaren, tödlich verlaufenden Krankheit',fd.pSituationTerminal)}
${checkLine('ffPSituationBrain','Irreversibler Verlust der Fähigkeit zu Einsicht, Entscheidung und Kontakt infolge Gehirnschädigung',fd.pSituationBrain)}
${checkLine('ffPSituationDementia','Weit fortgeschrittener Hirnabbauprozess: Nahrung/Flüssigkeit trotz Hilfe nicht mehr natürlich möglich',fd.pSituationDementia)}
${textareaField('Eigene Beschreibung einer Anwendungssituation','ffPSituationOwn',fd.pSituationOwn||'')}
</div>
<div class="form-card"><h3>2.3 Medizinische Maßnahmen</h3>
${selectField('2.3.1 Lebenserhaltende Maßnahmen','ffPLife',fd.pLife||'',['|Bitte auswählen','all|Alles medizinisch Mögliche und Sinnvolle zur Lebenserhaltung','omit|Lebenserhaltende Maßnahmen unterlassen; natürliche Nahrungs-/Flüssigkeitsaufnahme und palliative Pflege'])}
${selectField('2.3.2 Schmerz- und Symptombehandlung','ffPPain',fd.pPain||'',['|Bitte auswählen','clear|Fachgerechte Behandlung ohne bewusstseinsdämpfende Wirkungen','sedating|Falls anders nicht beherrschbar auch bewusstseinsdämpfende Mittel'])}
${checkLine('ffPAcceptShortening','Mögliche unbeabsichtigte Lebenszeitverkürzung durch Schmerz-/Symptomlinderung wird in Kauf genommen',fd.pAcceptShortening)}
${selectField('2.3.3 Künstliche Ernährung und Flüssigkeitszufuhr','ffPNutrition',fd.pNutrition||'',['|Bitte auswählen','continue|Beginnen/weiterführen, wenn lebensverlängernd','palliative|Nur palliativmedizinisch zur Beschwerdelinderung','none|Keine künstliche Ernährung und keine künstliche Flüssigkeitszufuhr'])}
${selectField('2.3.4 Wiederbelebung in den beschriebenen Situationen','ffPResuscitation',fd.pResuscitation||'',['|Bitte auswählen','yes|Wiederbelebungsversuche gewünscht','no|Wiederbelebungsversuche unterlassen'])}
${checkLine('ffPNoEmergencyDoctor','Notarzt nicht verständigen bzw. unverzüglich über Ablehnung von Wiederbelebung informieren',fd.pNoEmergencyDoctor)}
${selectField('Wiederbelebung auch außerhalb der beschriebenen Situationen','ffPResuscitationAll',fd.pResuscitationAll||'',['|Keine zusätzliche Festlegung','never|In allen Fällen von Kreislaufstillstand/Atemversagen ablehnen','exceptMedical|Ablehnen, außer unerwartet im Rahmen ärztlicher Maßnahmen'])}
${selectField('2.3.5 Künstliche Beatmung','ffPVentilation',fd.pVentilation||'',['|Bitte auswählen','yes|Beatmung, wenn lebensverlängernd','no|Keine Beatmung bzw. eingeleitete Beatmung einstellen; Luftnot lindern'])}
${selectField('2.3.6 Dialyse','ffPDialysis',fd.pDialysis||'',['|Bitte auswählen','yes|Dialyse, wenn lebensverlängernd','no|Keine Dialyse bzw. eingeleitete Dialyse einstellen'])}
${selectField('2.3.7 Antibiotika','ffPAntibiotics',fd.pAntibiotics||'',['|Bitte auswählen','yes|Antibiotika, wenn lebensverlängernd','palliative|Nur zur Beschwerdelinderung','no|Keine Antibiotika'])}
${selectField('2.3.8 Blut / Blutbestandteile','ffPBlood',fd.pBlood||'',['|Bitte auswählen','yes|Gabe, wenn lebensverlängernd','palliative|Nur zur Beschwerdelinderung','no|Keine Gabe von Blut/Blutbestandteilen'])}
</div>
<div class="form-card"><h3>2.4-2.9 Weitere Bausteine</h3>
${textareaField('Gewünschter Ort der Behandlung / Beistand','ffPPlace',fd.pPlace||'')}
${textareaField('Schweigepflicht / Personen, die informiert werden dürfen','ffPConfidentiality',fd.pConfidentiality||'')}
${textareaField('Hinweise auf Vorsorgevollmacht / Betreuungsverfügung','ffPOtherDirectives',fd.pOtherDirectives||'')}
${selectField('Organspende und Patientenverfügung','ffPOrgan',fd.pOrgan||'',['|Keine Festlegung','donationPriority|Organspende soll Vorrang haben','directivePriority|Festlegungen der Patientenverfügung sollen Vorrang haben','noDonation|Keine Organ-/Gewebespende'])}
${textareaField('Persönliche Wertvorstellungen / religiöse oder sonstige Wünsche','ffValues',fd.values||'')}
</div>`}

function miniPerson(prefix,title,fd={}){const hk=prefix+'Section';return `<div class="form-card"><div class="section-help-title"><h3>${title}</h3>${helpMarkup(hk,title)}</div>${helpBox(hk)}${field('Name, Vorname',prefix+'Name',fd[prefix+'Name']||'')}<div class="two">${field('Geburtsdatum',prefix+'Birth',fd[prefix+'Birth']||'','date')}${field('Geburtsort',prefix+'BirthPlace',fd[prefix+'BirthPlace']||'')}</div>${field('Adresse',prefix+'Address',fd[prefix+'Address']||'')}${field('Telefon, Telefax, E-Mail',prefix+'Contact',fd[prefix+'Contact']||'')}</div>`}
function formBetreuung(p,fd){return `${commonIdentityFields(p)}${miniPerson('ffBPrimary','Zu meinem Betreuer / meiner Betreuerin soll bestellt werden',fd)}${miniPerson('ffBFallback','Falls diese Person nicht bestellt werden kann, soll folgende Person bestellt werden',fd)}${miniPerson('ffBExclude','Auf keinen Fall soll folgende Person zum Betreuer / zur Betreuerin bestellt werden',fd)}<div class="form-card"><h3>Wünsche zur Wahrnehmung meiner Angelegenheiten</h3>${textareaField('1.','ffBWish1',fd.ffBWish1||'')}${textareaField('2.','ffBWish2',fd.ffBWish2||'')}${textareaField('3.','ffBWish3',fd.ffBWish3||'')}${textareaField('4.','ffBWish4',fd.ffBWish4||'')}</div>`}

function formBank(p,fd){return `${commonIdentityFields(p)}${agentFields(p,fd)}<div class="notice"><b>Originalstruktur:</b> Das abgestimmte BMJ/DK-Formular ist keine frei konfigurierbare Kontovollmacht. Es gilt für alle bestehenden und künftigen Konten/Depots bei der angegebenen Bank/Sparkasse sowie dort gemietete Schrankfächer. Es enthält ausdrücklich, dass die Vollmacht nicht mit dem Tod erlischt.</div><div class="form-card"><h3>Bank / Sparkasse</h3>${textareaField('Name und Anschrift der Bank/Sparkasse','ffBankAddress',fd.bankAddress||'')}</div><div class="form-card"><h3>Feststehender Umfang des Originalformulars</h3><ul class="plain-list"><li>Verfügungen über Guthaben und Zahlungsaufträge</li><li>Einlagen- und Girokonten auf Guthabenbasis einrichten</li><li>Eingeräumte Kredite und bankübliche vorübergehende Überziehungen nutzen</li><li>Wertpapier-/Devisengeschäfte im im Formular genannten Umfang</li><li>Mitteilungen, Kontoauszüge und Erklärungen entgegennehmen</li><li>Freistellungsaufträge erteilen/ändern</li><li>Debitkarten sowie Online-/Telefonbanking beantragen</li><li>Zugang zu gemieteten Schrankfächern</li><li>Keine Untervollmacht</li><li>Widerruf jederzeit möglich</li><li>Vollmacht erlischt nicht mit dem Tod</li></ul></div>`}

function formSchweigepflicht(p,fd){return `${commonIdentityFields(p)}${agentFields(p,fd)}<div class="notice"><b>App-Vorlage:</b> Für eine allgemeine Schweigepflichtentbindung gibt es kein bundeseinheitliches amtliches Standardformular. Deshalb wird sie nicht als „Originalformular“ bezeichnet.</div><div class="form-card"><h3>Umfang der Entbindung</h3>${selectField('Behandelnde Stellen','ffProviders',fd.providers||'all',['all|Alle behandelnden Ärztinnen/Ärzte und Einrichtungen','named|Nur ausdrücklich genannte Stellen'])}${textareaField('Genannte Ärztinnen/Ärzte / Einrichtungen','ffNamedProviders',fd.namedProviders||'')}${checkLine('ffDiagnosis','Diagnosen und Befunde',fd.diagnosis)}${checkLine('ffTreatment','Behandlung und Therapie',fd.treatment)}${checkLine('ffMedication','Medikation',fd.medication)}${checkLine('ffCare','Pflege- und Entlassungsplanung',fd.care)}${textareaField('Einschränkungen / Zweck','ffNotes',fd.notes||'')}</div>`}
function formBestattung(p,fd){const b=p.bestattung||{};return `${commonIdentityFields(p)}<div class="notice"><b>App-Vorlage:</b> Für Bestattungswünsche gibt es kein bundeseinheitliches amtliches Standardformular.</div><div class="form-card"><h3>Bestattungswünsche</h3>${selectField('Bestattungsart','ffFuneralType',fd.funeralType||b.type||'',['|Noch offen','Erdbestattung','Feuerbestattung','Seebestattung','Baumbestattung','Andere'])}${field('Gewünschter Friedhof / Ort','ffFuneralPlace',fd.funeralPlace||b.place||'')}${field('Bestatter / Vorsorgevertrag','ffUndertaker',fd.undertaker||b.undertaker||'')}${textareaField('Trauerfeier, Musik, Blumen, Kleidung, Anzeigen','ffCeremony',fd.ceremony||b.ceremony||'')}${textareaField('Weitere Wünsche','ffNotes',fd.notes||b.notes||'')}</div>`}
function formOrgane(p,fd){return `${commonIdentityFields(p)}<div class="notice"><b>Abgleich mit dem offiziellen Organspendeausweis:</b> Es darf genau eine der fünf Entscheidungsmöglichkeiten ausgewählt werden.</div><div class="form-card"><h3>Erklärung zur Organ- und Gewebespende</h3>${selectField('Entscheidung','ffOrganDecision',fd.organDecision||'',['|Bitte auswählen','yesAll|JA, Entnahme von Organen und Geweben gestattet','yesExcept|JA, mit Ausnahme bestimmter Organe/Gewebe','yesOnly|JA, jedoch nur für bestimmte Organe/Gewebe','no|NEIN, Entnahme widersprochen','delegate|Über JA oder NEIN soll eine andere Person entscheiden'])}${textareaField('Ausnahmen bzw. nur freigegebene Organe/Gewebe','ffOrganLimits',fd.organLimits||'')}${textareaField('Platz für Anmerkungen / besondere Hinweise','ffOrganNotes',fd.organNotes||'')}${agentFields(p,fd)}</div>`}
function formTestament(p,fd){return `${commonIdentityFields(p)}<div class="notice"><b>Vorbereitungsblatt – kein amtliches Formular und kein fertiges Testament:</b> Ein eigenhändiges Testament muss grundsätzlich eigenhändig geschrieben und unterschrieben werden.</div><div class="form-card"><h3>Erbwünsche vorbereiten</h3>${textareaField('Personen / Institutionen, die bedacht werden sollen','ffHeirs',fd.heirs||'')}${textareaField('Besondere Vermächtnisse / Gegenstände','ffLegacies',fd.legacies||'')}${textareaField('Wünsche zu Ersatzerben / Bedingungen / Testamentsvollstreckung','ffTestamentNotes',fd.testamentNotes||'')}${field('Geplanter Aufbewahrungsort','ffTestamentStorage',fd.testamentStorage||'')}</div>`}
function checkLine(id,label,on){return `<div class="checkline-help-wrap"><div class="checkline-row"><label class="checkline" for="${id}"><input type="checkbox" id="${id}" ${on?'checked':''}> <span>${esc(label)}</span></label>${helpMarkup(id,label)}</div>${helpBox(id)}</div>`}
function choiceField(label,id,val=''){return selectField(label,id,val||'',['|Bitte auswählen','want|Ich wünsche diese Maßnahme','refuse|Ich lehne diese Maßnahme ab','palliative|Nur zur Symptomlinderung / palliativ','individual|Individuell – siehe weitere Festlegungen'])}
function applyFormContact(){const p=activePerson(),sel=val('ffContact'),c=resolveSelectedContact(p,sel);if(!c)return;setVal('ffAgentName',c.name);setVal('ffAgentRole',c.role);setVal('ffAgentPhone',c.phone);setVal('ffAgentEmail',c.email);setVal('ffAgentAddress',c.address||'');if(sel.startsWith('person:')){const q=state.persons.find(x=>x.id===sel.slice(7));setVal('ffAgentBirth',q?.profile?.birthDate||'');setVal('ffAgentBirthPlace',q?.profile?.birthPlace||'')}refreshFormPreview()}
function setVal(id,v){const e=document.getElementById(id);if(e)e.value=v||''}
function collectFilledForm(){const k=state.docKey||'vorsorge';const common={firstName:val('ffFirst'),lastName:val('ffLast'),birthDate:val('ffBirth'),birthPlace:val('ffBirthPlace'),street:val('ffStreet'),zip:val('ffZip'),city:val('ffCity'),phone:val('ffPhone'),email:val('ffEmail')};const agent={contactId:val('ffContact'),agentName:val('ffAgentName'),agentRole:val('ffAgentRole'),agentBirth:val('ffAgentBirth'),agentBirthPlace:val('ffAgentBirthPlace'),agentPhone:val('ffAgentPhone'),agentEmail:val('ffAgentEmail'),agentAddress:val('ffAgentAddress')};
if(k==='vorsorge')return {...common,...agent,vHealthAll:val('ffVHealthAll'),vHealthRisk:val('ffVHealthRisk'),vRecords:val('ffVRecords'),vDetention:val('ffVDetention'),vRestriction:val('ffVRestriction'),vForcedTreatment:val('ffVForcedTreatment'),vHospitalTransfer:val('ffVHospitalTransfer'),vResidence:val('ffVResidence'),vRentalRights:val('ffVRentalRights'),vNewRental:val('ffVNewRental'),vWBVG:val('ffVWBVG'),vAuthorities:val('ffVAuthorities'),vAssetsAll:val('ffVAssetsAll'),vAssetDispose:val('ffVAssetDispose'),vPayments:val('ffVPayments'),vDebts:val('ffVDebts'),vBank:val('ffVBank'),vGifts:val('ffVGifts'),vExcludedBusiness:val('ffVExcludedBusiness'),vPost:val('ffVPost'),vCourt:val('ffVCourt'),vSubPower:val('ffVSubPower'),vGuardianship:val('ffVGuardianship'),vAfterDeath:val('ffVAfterDeath'),vFurther:val('ffVFurther'),vUseRule:val('ffVUseRule'),vUseNotes:val('ffVUseNotes')};
if(k==='patienten')return {...common,pSituationDying:checked('ffPSituationDying'),pSituationTerminal:checked('ffPSituationTerminal'),pSituationBrain:checked('ffPSituationBrain'),pSituationDementia:checked('ffPSituationDementia'),pSituationOwn:val('ffPSituationOwn'),pLife:val('ffPLife'),pPain:val('ffPPain'),pAcceptShortening:checked('ffPAcceptShortening'),pNutrition:val('ffPNutrition'),pResuscitation:val('ffPResuscitation'),pNoEmergencyDoctor:checked('ffPNoEmergencyDoctor'),pResuscitationAll:val('ffPResuscitationAll'),pVentilation:val('ffPVentilation'),pDialysis:val('ffPDialysis'),pAntibiotics:val('ffPAntibiotics'),pBlood:val('ffPBlood'),pPlace:val('ffPPlace'),pConfidentiality:val('ffPConfidentiality'),pOtherDirectives:val('ffPOtherDirectives'),pOrgan:val('ffPOrgan'),values:val('ffValues')};
if(k==='betreuung'){const r={...common};for(const pre of ['ffBPrimary','ffBFallback','ffBExclude'])for(const suf of ['Name','Birth','BirthPlace','Address','Contact'])r[pre+suf]=val(pre+suf);for(let i=1;i<=4;i++)r['ffBWish'+i]=val('ffBWish'+i);return r}
if(k==='bank')return {...common,...agent,bankAddress:val('ffBankAddress')};
if(k==='schweigepflicht')return {...common,...agent,providers:val('ffProviders'),namedProviders:val('ffNamedProviders'),diagnosis:checked('ffDiagnosis'),treatment:checked('ffTreatment'),medication:checked('ffMedication'),care:checked('ffCare'),notes:val('ffNotes')};
if(k==='bestattung')return {...common,funeralType:val('ffFuneralType'),funeralPlace:val('ffFuneralPlace'),undertaker:val('ffUndertaker'),ceremony:val('ffCeremony'),notes:val('ffNotes')};
if(k==='organe')return {...common,...agent,organDecision:val('ffOrganDecision'),organLimits:val('ffOrganLimits'),organNotes:val('ffOrganNotes')};
if(k==='testament')return {...common,heirs:val('ffHeirs'),legacies:val('ffLegacies'),testamentNotes:val('ffTestamentNotes'),testamentStorage:val('ffTestamentStorage')};return common}
async function saveFilledForm(){const p=activePerson(),k=state.docKey;if(!p||!k)return;const fd=collectFilledForm();p.documents[k]=p.documents[k]||{};p.documents[k].formData=fd;p.documents[k].status='draft';p.documents[k].date=new Date().toISOString().slice(0,10);if(k==='bestattung'){p.bestattung={...(p.bestattung||{}),type:fd.funeralType,place:fd.funeralPlace,undertaker:fd.undertaker,ceremony:fd.ceremony,notes:fd.notes}}await persistPersons();refreshFormPreview();toast('Formular lokal gespeichert')}
function refreshFormPreview(){const p=activePerson();if(!p)return;const e=document.getElementById('formPreview');if(e)e.innerHTML=renderFilledDocument(state.docKey,p,collectFilledForm())}
function printFilledForm(){refreshFormPreview();setTimeout(()=>window.print(),50)}
async function shareCurrentDocumentInfo(){const p=activePerson(),k=state.docKey,title=`${DOCS[k]?.title||'Dokument'} – ${personName(p)}`;if(navigator.share){try{await navigator.share({title,text:'Das Dokument ist im Sterbefall Assistent vorbereitet. Zum Versand als PDF bitte zunächst über „Drucken / PDF“ als PDF speichern oder die lokale Blanko-PDF befüllen.'});return}catch(e){if(e?.name==='AbortError')return}}toast('Auf diesem Gerät ist direktes Teilen hier nicht verfügbar. Bitte zuerst als PDF speichern.')}
function personBlock(fd,p){const x=fd&&Object.keys(fd).length?fd:(p.profile||{});return `${esc([x.firstName,x.lastName].filter(Boolean).join(' '))}<br>${x.birthDate?`geb. ${esc(fmtDate(x.birthDate))}<br>`:''}${esc(x.street||'')}<br>${esc([x.zip,x.city].filter(Boolean).join(' '))}`}
function agentBlock(fd){return `${esc(fd.agentName||'Nicht eingetragen')}${fd.agentRole?` (${esc(fd.agentRole)})`:''}<br>${esc(fd.agentAddress||'')}${fd.agentPhone?`<br>Tel.: ${esc(fd.agentPhone)}`:''}${fd.agentEmail?`<br>E-Mail: ${esc(fd.agentEmail)}`:''}`}
function yesno(v){return v==='yes'?'Ja':v==='no'?'Nein':v==='unsure'?'Noch offen':v||'—'}
function choiceText(v){return ({want:'gewünscht',refuse:'abgelehnt',palliative:'nur zur Symptomlinderung / palliativ',individual:'individuell geregelt'})[v]||'nicht festgelegt'}
function boolList(items){return `<ul>${items.filter(x=>x[1]).map(x=>`<li>${esc(x[0])}</li>`).join('')||'<li>Keine Auswahl getroffen</li>'}</ul>`}
function renderFilledDocument(k,p,fd={}){const title=DOCS[k]?.title||'Dokument';let body='';
const yn=(v)=>v==='yes'?'Ja':v==='no'?'Nein':'—';
if(k==='vorsorge'){const rows=[['Gesundheitssorge/Pflege allgemein',fd.vHealthAll],['Risikoreiche medizinische Maßnahmen § 1829',fd.vHealthRisk],['Krankenunterlagen/Schweigepflicht',fd.vRecords],['Freiheitsentziehende Unterbringung',fd.vDetention],['Freiheitsentziehende Maßnahmen',fd.vRestriction],['Ärztliche Zwangsmaßnahmen',fd.vForcedTreatment],['Krankenhausverbringung bei Zwangsmaßnahme',fd.vHospitalTransfer],['Aufenthalt bestimmen',fd.vResidence],['Bestehender Mietvertrag/Haushaltsauflösung',fd.vRentalRights],['Neuer Mietvertrag',fd.vNewRental],['Wohn-/Betreuungsvertrag',fd.vWBVG],['Behörden/Versicherungen/Rente/Sozialleistung',fd.vAuthorities],['Vermögen allgemein',fd.vAssetsAll],['Vermögensgegenstände',fd.vAssetDispose],['Zahlungen/Wertgegenstände',fd.vPayments],['Verbindlichkeiten',fd.vDebts],['Konten/Depots/Safes',fd.vBank],['Schenkungen',fd.vGifts],['Post/Fernmeldeverkehr',fd.vPost],['Gerichtsvertretung',fd.vCourt],['Untervollmacht',fd.vSubPower],['Betreuungsverfügung',fd.vGuardianship],['Geltung über den Tod hinaus',fd.vAfterDeath]];body=`<h2>Bevollmächtigte Person</h2><p>${agentBlock(fd)}</p><table>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${yn(r[1])}</td></tr>`).join('')}</table><p><b>Ausgeschlossene Geschäfte:</b><br>${nl(fd.vExcludedBusiness)}</p><p><b>Weitere Regelungen:</b><br>${nl(fd.vFurther)}</p>`}
else if(k==='patienten'){body=`<div class="fineprint"><b>Zusammenstellung nach BMJ-Textbausteinen; kein einheitliches amtliches Formular.</b></div><h2>Anwendungssituationen</h2>${boolList([['Unmittelbarer Sterbeprozess',fd.pSituationDying],['Endstadium unheilbarer tödlicher Krankheit',fd.pSituationTerminal],['Irreversible schwere Gehirnschädigung',fd.pSituationBrain],['Weit fortgeschrittener Hirnabbauprozess',fd.pSituationDementia]])}<p>${nl(fd.pSituationOwn)}</p><h2>Festlegungen</h2><table><tr><td>Lebenserhaltende Maßnahmen</td><td>${esc(fd.pLife||'—')}</td></tr><tr><td>Schmerz-/Symptombehandlung</td><td>${esc(fd.pPain||'—')}</td></tr><tr><td>Ernährung/Flüssigkeit</td><td>${esc(fd.pNutrition||'—')}</td></tr><tr><td>Wiederbelebung</td><td>${esc(fd.pResuscitation||'—')}</td></tr><tr><td>Beatmung</td><td>${esc(fd.pVentilation||'—')}</td></tr><tr><td>Dialyse</td><td>${esc(fd.pDialysis||'—')}</td></tr><tr><td>Antibiotika</td><td>${esc(fd.pAntibiotics||'—')}</td></tr><tr><td>Blut/Blutbestandteile</td><td>${esc(fd.pBlood||'—')}</td></tr></table><h2>Weitere Bausteine</h2><p><b>Ort/Beistand:</b><br>${nl(fd.pPlace)}</p><p><b>Schweigepflicht:</b><br>${nl(fd.pConfidentiality)}</p><p><b>Weitere Vorsorgeverfügungen:</b><br>${nl(fd.pOtherDirectives)}</p><p><b>Organspende:</b> ${esc(fd.pOrgan||'—')}</p><p><b>Wertvorstellungen:</b><br>${nl(fd.values)}</p>`}
else if(k==='betreuung'){body=`<h2>Gewünschte Betreuerperson</h2><p>${esc(fd.ffBPrimaryName||'—')}<br>${esc(fmtDate(fd.ffBPrimaryBirth))} ${esc(fd.ffBPrimaryBirthPlace||'')}<br>${esc(fd.ffBPrimaryAddress||'')}<br>${esc(fd.ffBPrimaryContact||'')}</p><h2>Ersatzperson</h2><p>${esc(fd.ffBFallbackName||'—')}<br>${esc(fd.ffBFallbackAddress||'')}</p><h2>Keinesfalls zu bestellen</h2><p>${esc(fd.ffBExcludeName||'—')}<br>${esc(fd.ffBExcludeAddress||'')}</p><h2>Wünsche</h2><ol><li>${nl(fd.ffBWish1)}</li><li>${nl(fd.ffBWish2)}</li><li>${nl(fd.ffBWish3)}</li><li>${nl(fd.ffBWish4)}</li></ol>`}
else if(k==='bank'){body=`<p><b>Bank/Sparkasse:</b><br>${nl(fd.bankAddress)}</p><h2>Bevollmächtigte Person</h2><p>${agentBlock(fd)}</p><p>Die Vollmacht gilt entsprechend dem abgestimmten Konto-/Depot-/Schrankfachvollmachtsformular für alle bestehenden und künftigen Konten und Depots bei der genannten Bank/Sparkasse sowie dort gemietete Schrankfächer. Sie erlischt nach dem Formular nicht mit dem Tod des Vollmachtgebers.</p>`}
else if(k==='schweigepflicht')body=`<div class="fineprint"><b>App-Vorlage - kein bundeseinheitliches amtliches Standardformular.</b></div><p>Ich entbinde die ${fd.providers==='named'?'nachfolgend genannten':'mich behandelnden'} Ärztinnen, Ärzte und Einrichtungen gegenüber folgender Person von der Schweigepflicht:</p><p>${agentBlock(fd)}</p>${fd.providers==='named'?`<p><b>Genannte Stellen:</b><br>${nl(fd.namedProviders)}</p>`:''}<h2>Umfasste Informationen</h2>${boolList([['Diagnosen und Befunde',fd.diagnosis],['Behandlung und Therapie',fd.treatment],['Medikation',fd.medication],['Pflege- und Entlassungsplanung',fd.care]])}<h2>Einschränkungen / Zweck</h2><p>${nl(fd.notes)}</p>`
else if(k==='bestattung')body=`<div class="fineprint"><b>App-Vorlage - kein bundeseinheitliches amtliches Standardformular.</b></div><p><b>Gewünschte Bestattungsart:</b> ${esc(fd.funeralType||'Noch offen')}<br><b>Friedhof / Ort:</b> ${esc(fd.funeralPlace||'—')}<br><b>Bestatter / Vorsorgevertrag:</b> ${esc(fd.undertaker||'—')}</p><h2>Trauerfeier</h2><p>${nl(fd.ceremony)}</p><h2>Weitere Wünsche</h2><p>${nl(fd.notes)}</p>`
else if(k==='organe'){const map={yesAll:'JA - uneingeschränkte Organ-/Gewebespende',yesExcept:'JA - mit Ausnahmen',yesOnly:'JA - nur bestimmte Organe/Gewebe',no:'NEIN - Entnahme widersprochen',delegate:'Andere Person entscheidet'};body=`<p><b>Entscheidung:</b> ${esc(map[fd.organDecision]||'Nicht festgelegt')}</p><p><b>Ausnahmen / Beschränkung:</b><br>${nl(fd.organLimits)}</p><p><b>Anmerkungen:</b><br>${nl(fd.organNotes)}</p>${fd.organDecision==='delegate'?`<h2>Entscheidungsperson</h2><p>${agentBlock(fd)}</p>`:''}`}
else if(k==='testament')body=`<div class="draft-mark">VORBEREITUNGSBLATT – KEIN TESTAMENT</div><h2>Bedachte Personen / Institutionen</h2><p>${nl(fd.heirs)}</p><h2>Vermächtnisse / Gegenstände</h2><p>${nl(fd.legacies)}</p><h2>Weitere Erbwünsche</h2><p>${nl(fd.testamentNotes)}</p><p><b>Geplanter Aufbewahrungsort:</b> ${esc(fd.testamentStorage||'—')}</p>`;
return `<article class="generated-form"><header><div class="form-brand">${['schweigepflicht','bestattung','testament'].includes(k)?'Sterbefall Assistent Deutschland':'Formularstruktur nach offizieller Quelle'}</div><h1>${esc(title)}</h1><p>für</p><div class="identity-box">${personBlock(fd,p)}</div></header>${body}<div class="signature"><div>Ort, Datum</div><div>Unterschrift</div></div><footer>${new Date().toLocaleDateString('de-DE')}</footer></article>`}
function nl(v){return esc(v||'—').replace(/\n/g,'<br>')}

function medical(){const p=activePerson();if(!p)return noPerson('Medizin & Krankenhaus');const m=p.medical||{};return `<section class="screen">${appTop('Medizin & Krankenhaus',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}<div class="form-card"><h3>Behandelnde Stellen</h3>${field('Hausarzt / Praxis','doctorName',m.doctorName)}${field('Telefon Hausarzt','doctorPhone',m.doctorPhone,'tel')}${field('Bevorzugtes Krankenhaus / Klinik','hospital',m.hospital)}</div><div class="form-card"><h3>Hinweise für den Ernstfall</h3>${textareaField('Wichtige medizinische Hinweise','medicalNotes',m.notes,'Nur Informationen eintragen, die im Notfall tatsächlich hilfreich sind.')}${textareaField('Allergien / Unverträglichkeiten','allergies',m.allergies)}${textareaField('Wichtige Medikamente','medications',m.medications)}${field('Aufbewahrungsort Medikamentenplan','medPlan',m.medPlan)}</div><div class="form-card"><h3>Krankenhaus & Auskunft</h3><label class="checkline"><input type="checkbox" id="medicalContactAllowed" ${m.contactAllowed?'checked':''}> Vertrauenspersonen sollen im Ernstfall schnell auffindbar sein</label><label class="checkline"><input type="checkbox" id="organDecision" ${m.organDecision?'checked':''}> Eine Organspende-Entscheidung wurde dokumentiert</label><button class="cta ghost full mt10" onclick="openOfficial('organspende')">Organspende-Register öffnen ↗</button></div><button class="cta teal full" onclick="saveMedical()">Speichern</button></div></section>`}
async function saveMedical(){const p=activePerson();p.medical={doctorName:val('doctorName'),doctorPhone:val('doctorPhone'),hospital:val('hospital'),notes:val('medicalNotes'),allergies:val('allergies'),medications:val('medications'),medPlan:val('medPlan'),contactAllowed:checked('medicalContactAllowed'),organDecision:checked('organDecision')};await persistPersons();toast('Medizinische Hinweise gespeichert');render()}

function zvr(){const p=activePerson();if(!p)return noPerson('Zentrales Vorsorgeregister');const z=p.zvr||{};return `<section class="screen">${appTop('Zentrales Vorsorgeregister',`Für ${personName(p)}`)}<div class="content"><div class="info-card"><div class="big-icon">🏛️</div><h2>ZVR</h2><p>Die Eingaben orientieren sich am Formular P (Stand 01.02.2024) und werden beim PDF automatisch übernommen.</p></div>
<div class="form-card"><h3>Registrierungsstatus</h3><label class="checkline"><input type="checkbox" id="zvrRegistered" ${z.registered?'checked':''}> Registrierung wurde vorgenommen</label>${field('Datum der Registrierung','zvrDate',z.date||'','date')}${field('Akten-/Registrierhinweis','zvrRef',z.reference||'','text','Optional; keine Zugangsdaten oder Passwörter speichern.')}</div>
<div class="form-card"><h3>Aufbewahrungsort der Vorsorgeurkunde</h3>${selectField('Wo liegt das Original?','zvrStorageType',z.storageType||'',['|Bitte auswählen','self|bei der vorsorgenden Person','trusted|bei der Vertrauensperson','other|bei einer sonstigen Person','facility|bei einer Einrichtung'])}${field('Eigene Beschreibung des Aufbewahrungsorts','zvrStorage',z.storageLocation||'')}${field('Einrichtung / Firma','zvrStorageInstitution',z.storageInstitution||'')}${field('Straße / Hausnummer','zvrStorageStreet',z.storageStreet||'')}${field('PLZ / Ort','zvrStorageCity',z.storageCity||'')}</div>
<div class="form-card"><h3>Zahlungsweise im Formular P</h3>${selectField('Zahlungsweise','zvrPayment',z.paymentMethod||'',['|Bitte auswählen','lastschrift|Lastschrift','ueberweisung|Überweisung'])}${field('IBAN','zvrIban',z.iban||'')}${field('Kontoinhaber/in','zvrAccountHolder',z.accountHolder||personName(p))}</div>
<div class="form-card"><h3>Vertrauensperson für Formular P</h3><div class="field"><label>Gespeicherte Person / Kontakt</label><select id="zvrContact">${contactOptions(p,z.contactId||'')}</select></div>${selectField('Vertretungsart','zvrTrustRole',z.trustRole||'',['|Bitte auswählen','single|Einzelvertretungsmacht','joint|Gesamtvertretungsmacht'])}<label class="checkline"><input type="checkbox" id="zvrTrustGuardian" ${z.trustGuardian?'checked':''}> auch als Betreuer/in vorgeschlagen</label></div>
<button class="cta teal full" onclick="saveZvr()">Speichern</button><button class="cta teal full mt10" onclick="saveZvr().then(()=>openOfficialPdf('zvrP'))">📄 Formular P automatisch befüllen</button><div class="row mt10"><button class="cta ghost full" onclick="openOfficial('zvr')">Online registrieren ↗</button><button class="cta ghost full" onclick="openOfficial('zvrForms')">Formulare ↗</button></div><div class="notice" style="margin-top:14px">Die Registrierung ersetzt das eigentliche Vorsorgedokument nicht. Für jede vorsorgende Person ist eine eigene Registrierung erforderlich.</div></div></section>`}
async function saveZvr(){const p=activePerson();p.zvr={registered:checked('zvrRegistered'),date:val('zvrDate'),reference:val('zvrRef'),storageType:val('zvrStorageType'),storageLocation:val('zvrStorage'),storageInstitution:val('zvrStorageInstitution'),storageStreet:val('zvrStorageStreet'),storageCity:val('zvrStorageCity'),paymentMethod:val('zvrPayment'),iban:val('zvrIban'),accountHolder:val('zvrAccountHolder'),contactId:val('zvrContact'),trustRole:val('zvrTrustRole'),trustGuardian:checked('zvrTrustGuardian')};await persistPersons();toast('ZVR-Daten gespeichert');}

function bestattung(){const p=activePerson();if(!p)return noPerson('Bestattungswünsche');const b=p.bestattung||{};return `<section class="screen">${appTop('Bestattungswünsche',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}<div class="notice"><b>Hinweis:</b> Für Bestattungswünsche gibt es kein bundeseinheitliches amtliches Standardformular. Die Angaben dienen der persönlichen Vorsorge und Orientierung für Angehörige.</div><div class="form-card"><h3>Bestattungswünsche</h3>${selectField('Bestattungsart','funeralType',b.type||'',['|Noch offen','Erdbestattung','Feuerbestattung','Seebestattung','Baumbestattung','Andere'])}${field('Gewünschter Friedhof / Ort','funeralPlace',b.place||'')}${field('Bestatter / Vorsorgevertrag','funeralUndertaker',b.undertaker||'')}${textareaField('Trauerfeier, Musik, Blumen, Kleidung, Anzeigen','funeralCeremony',b.ceremony||'')}${textareaField('Weitere Wünsche','funeralNotes',b.notes||'')}</div><button class="cta teal full" onclick="saveBestattung()">Speichern</button><button class="cta ghost full mt10" onclick="openDoc('bestattung')">Dokument & unterschriebene Fassung verwalten</button></div></section>`}
async function saveBestattung(){const p=activePerson();if(!p)return;p.bestattung={type:val('funeralType'),place:val('funeralPlace'),undertaker:val('funeralUndertaker'),ceremony:val('funeralCeremony'),notes:val('funeralNotes')};await persistPersons();toast('Bestattungswünsche gespeichert');render()}

function digital(){const p=activePerson();if(!p)return noPerson('Digitaler Nachlass');const d=p.digital||{};return `<section class="screen">${appTop('Digitaler Nachlass',`Für ${personName(p)}`)}<div class="content"><div class="notice"><b>Keine Passwörter im Klartext speichern.</b> Dokumentiere stattdessen, wo ein Passwortmanager, Notfallzugang oder versiegelte Zugangsliste zu finden ist.</div><div class="form-card"><h3>Vertrauensperson</h3>${field('Verantwortliche Person','digitalContact',d.contactName)}${field('Telefon / Kontakt','digitalContactPhone',d.contactPhone)}${field('Ort der Zugangsinformationen','digitalStorage',d.storageLocation,'text','Zum Beispiel: Passwortmanager mit Notfallzugriff, versiegelter Umschlag im Tresor.')}</div><div class="form-card"><h3>Konten & Geräte</h3>${textareaField('Wichtige Dienste','digitalServices',d.services,'Zum Beispiel E-Mail, Apple/Google, Social Media, PayPal, Domains, Cloudspeicher.')}${textareaField('Geräte / Zugangshinweise','digitalDevices',d.devices,'Nur Hinweise, keine PINs oder Passwörter.')}${textareaField('Wünsche','digitalWishes',d.wishes,'Konten löschen, memorialisieren, Daten sichern, Domains übertragen …')}</div><button class="cta teal full" onclick="saveDigital()">Speichern</button></div></section>`}
async function saveDigital(){const p=activePerson();p.digital={contactName:val('digitalContact'),contactPhone:val('digitalContactPhone'),storageLocation:val('digitalStorage'),services:val('digitalServices'),devices:val('digitalDevices'),wishes:val('digitalWishes')};await persistPersons();toast('Digitaler Nachlass gespeichert');render()}


function emergencyCardData(){
  const p=activePerson();if(!p)return null;
  normalizePerson(p);
  const x=p.profile||{},m=p.medical||{},docs=p.documents||{},ecs=(p.contacts||[]).filter(c=>c.isEmergency).slice(0,3);
  return {
    personName:personName(p),
    birthDate:fmtDate(x.birthDate),
    insurance:x.healthInsurance||'Nicht hinterlegt',
    doctor:m.doctorName||'Nicht hinterlegt',
    doctorPhone:m.doctorPhone||'',
    allergies:m.allergies||'Keine Angaben',
    medications:m.medications||'Keine Angaben',
    patienten:isDocDone(p,'patienten')?'Vorhanden':'Nicht hinterlegt',
    patientenStorage:docs.patienten?.storageLocation||'Nicht hinterlegt',
    vorsorge:isDocDone(p,'vorsorge')?'Vorhanden':'Nicht hinterlegt',
    zvr:p.zvr?.registered?'Registriert':'Nicht als registriert markiert',
    contacts:ecs.map(c=>({name:c.name||'',role:c.role||'',phone:c.phone||''})),
    created:new Date().toLocaleDateString('de-DE')
  };
}
function emergency(){
  const p=activePerson();if(!p)return noPerson('Notfallkarte');
  const d=emergencyCardData();
  return `<section class="emergency"><div class="emergency-actions no-print">
    <button class="cta ghost" onclick="go('home')">‹ Zurück</button>
    <button class="cta teal" onclick="printEmergencyCard()">🖨 Drucken</button>
    <button class="cta ghost" onclick="shareEmergencyCardImage()">🖼 Bild teilen</button>
    <button class="cta ghost" onclick="downloadEmergencyCardImage()">💾 Bild speichern</button>
  </div><div class="emergency-print-note no-print">Die Notfallkarte kann direkt gedruckt oder als PNG-Bild gespeichert und geteilt werden.</div>
  <div id="emergencyCardPrintable"><div class="emergency-head"><div class="emergency-symbol">⚠</div><h1>NOTFALL</h1><p>Wichtige Informationen für ${esc(personName(p))}</p></div>
  <div class="emergency-card"><h3>Notfallkontakte</h3>${d.contacts.length?d.contacts.map(c=>`<div class="contact-line"><div><b>${esc(c.name)}</b><div class="muted">${esc(c.role||'')}</div></div><span>${esc(c.phone||'')}</span></div>`).join(''):'<p>Noch kein Notfallkontakt hinterlegt.</p>'}</div>
  <div class="emergency-card"><h3>Vorsorge</h3><div class="kv"><b>Patientenverfügung</b><span>${esc(d.patienten)}</span><b>Aufbewahrungsort</b><span>${esc(d.patientenStorage)}</span><b>Vorsorgevollmacht</b><span>${esc(d.vorsorge)}</span><b>ZVR</b><span>${esc(d.zvr)}</span></div></div>
  <div class="emergency-card"><h3>Medizin</h3><div class="kv"><b>Hausarzt</b><span>${esc(d.doctor)}</span><b>Telefon</b><span>${esc(d.doctorPhone)}</span><b>Allergien</b><span>${esc(d.allergies)}</span><b>Medikamente</b><span>${esc(d.medications)}</span></div></div>
  <div class="emergency-card"><h3>Person</h3><div class="kv"><b>Name</b><span>${esc(d.personName)}</span><b>Geburtsdatum</b><span>${esc(d.birthDate)}</span><b>Krankenkasse</b><span>${esc(d.insurance)}</span></div></div>
  <div class="emergency-footer">Erstellt am ${esc(d.created)} · Sterbefall Assistent Deutschland</div></div></section>`;
}
function emergencyImageName(){
  const p=activePerson(),name=(personName(p)||'notfallkarte').toLowerCase().replace(/[^a-z0-9äöüß]+/gi,'-').replace(/^-+|-+$/g,'');
  return `${name||'notfallkarte'}-notfallkarte.png`;
}
function wrapCanvasText(ctx,text,maxWidth){
  const words=String(text||'').split(/\s+/).filter(Boolean); if(!words.length) return [''];
  const lines=[]; let line=words[0];
  for(let i=1;i<words.length;i++){
    const test=line+' '+words[i];
    if(ctx.measureText(test).width<=maxWidth) line=test; else {lines.push(line); line=words[i];}
  }
  lines.push(line); return lines;
}
function drawCanvasLabelValue(ctx,label,value,x,y,w){
  ctx.font='700 28px system-ui, Arial'; ctx.fillStyle='#2e3b40'; ctx.fillText(label,x,y);
  ctx.font='28px system-ui, Arial'; ctx.fillStyle='#44545b';
  const lines=wrapCanvasText(ctx,value||'—',w);
  let yy=y+36;
  lines.forEach(line=>{ctx.fillText(line,x,yy); yy+=34;});
  return yy+8;
}
async function renderEmergencyCardCanvas(){
  const d=emergencyCardData(); if(!d) throw new Error('Keine aktive Person');
  const canvas=document.createElement('canvas'); canvas.width=1240; canvas.height=1754;
  const ctx=canvas.getContext('2d'); const W=canvas.width,H=canvas.height;
  ctx.fillStyle='#f5f7f8'; ctx.fillRect(0,0,W,H);

  const roundRect=(x,y,w,h,r,fill,stroke)=>{
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
    if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
  };
  roundRect(55,55,W-110,H-110,36,'#ffffff','#d8e0e4');
  roundRect(95,95,W-190,210,28,'#d9473e',null);
  ctx.fillStyle='#fff'; ctx.font='bold 64px system-ui, Arial'; ctx.fillText('NOTFALL',145,180);
  ctx.font='34px system-ui, Arial'; ctx.fillText(`Wichtige Informationen für ${d.personName}`,145,235);
  ctx.font='24px system-ui, Arial'; ctx.fillText('Zum Vorzeigen bei Notfällen / Krankenhaus / Angehörigenkontakt',145,275);

  const section=(title,yStart,height)=>{
    roundRect(95,yStart,W-190,height,24,'#fbfbfc','#e4e8eb');
    ctx.fillStyle='#233238'; ctx.font='700 34px system-ui, Arial'; ctx.fillText(title,125,yStart+52);
    return yStart+98;
  };

  let y=355;
  let yy=section('Notfallkontakte',y,260);
  if(d.contacts.length){
    d.contacts.forEach(c=>{
      ctx.font='700 28px system-ui, Arial'; ctx.fillStyle='#2e3b40'; ctx.fillText(c.name||'—',125,yy);
      ctx.font='24px system-ui, Arial'; ctx.fillStyle='#647279'; ctx.fillText(c.role||'',125,yy+30);
      ctx.font='700 28px system-ui, Arial'; ctx.fillStyle='#2e3b40'; ctx.textAlign='right'; ctx.fillText(c.phone||'',W-125,yy+12); ctx.textAlign='left';
      yy+=62;
    });
  } else {
    ctx.font='28px system-ui, Arial'; ctx.fillStyle='#647279'; ctx.fillText('Noch kein Notfallkontakt hinterlegt.',125,yy);
  }

  y=635; yy=section('Vorsorge',y,295);
  yy=drawCanvasLabelValue(ctx,'Patientenverfügung',d.patienten,125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Aufbewahrungsort',d.patientenStorage,125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Vorsorgevollmacht',d.vorsorge,125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Zentrales Vorsorgeregister',d.zvr,125,yy,W-250);

  y=960; yy=section('Medizin',y,395);
  yy=drawCanvasLabelValue(ctx,'Hausarzt',d.doctor + (d.doctorPhone?` (${d.doctorPhone})`:''),125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Allergien',d.allergies,125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Medikamente',d.medications,125,yy,W-250);

  y=1385; yy=section('Person',y,215);
  yy=drawCanvasLabelValue(ctx,'Name',d.personName,125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Geburtsdatum',d.birthDate,125,yy,W-250);
  yy=drawCanvasLabelValue(ctx,'Krankenkasse',d.insurance,125,yy,W-250);

  ctx.font='22px system-ui, Arial'; ctx.fillStyle='#708087'; ctx.fillText(`Erstellt am ${d.created} · Sterbefall Assistent Deutschland`,125,H-105);
  return canvas;
}
async function emergencyCardBlob(){
  const canvas=await renderEmergencyCardCanvas();
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Bild konnte nicht erstellt werden')),'image/png'));
}
function printEmergencyCard(){window.print()}
async function downloadEmergencyCardImage(){
  try{
    const blob=await emergencyCardBlob(),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=emergencyImageName();document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){toast('Bild konnte nicht erstellt werden')}
}
async function shareEmergencyCardImage(){
  try{
    const blob=await emergencyCardBlob(),file=new File([blob],emergencyImageName(),{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share){
      await navigator.share({title:`Notfallkarte ${personName(activePerson())}`,text:'Notfallkarte aus dem Sterbefall Assistent Deutschland',files:[file]});
      return;
    }
    await downloadEmergencyCardImage();
    toast('Bild gespeichert – bitte anschließend manuell teilen');
  }catch(e){
    if(e?.name!=='AbortError')toast('Bild konnte nicht geteilt werden');
  }
}

function serious(){const p=activePerson();if(!p)return noPerson('Schwere Erkrankung');normalizePerson(p);const tasks=[['Patientenverfügung auffindbar?',isDocDone(p,'patienten'),'documents'],['Vorsorgevollmacht vorhanden?',isDocDone(p,'vorsorge'),'documents'],['Vertrauenspersonen erreichbar?',(p.contacts||[]).length>0,'trusted'],['Hausarzt / Behandler hinterlegt?',!!p.medical?.doctorName,'medical'],['Medikamentenplan und Hinweise geklärt?',!!p.medical?.medPlan||!!p.medical?.medications,'medical'],['Bestattungswünsche bei Bedarf besprochen?',!!p.bestattung?.type||!!p.bestattung?.notes,'bestattung']];return `<section class="screen">${appTop('Schwere Erkrankung',`Für ${personName(p)}`)}<div class="content">${personSwitch(p)}<div class="notice"><b>Dieser Bereich ist eine Organisationshilfe.</b> Akute medizinische Beschwerden gehören in professionelle medizinische Versorgung; im Notfall 112.</div><div class="section-title"><h2>Jetzt prüfen</h2></div><div class="list">${tasks.map(t=>task(t[0],t[1],t[1]?'Erledigt / hinterlegt':'Noch offen',t[2])).join('')}</div><div class="form-card mt16"><h3>Gesprächs- und Organisationspunkte</h3><ul class="plain-list"><li>Wer soll medizinische Gespräche begleiten?</li><li>Wo liegen Vollmachten und Originaldokumente?</li><li>Welche Pflege- oder Unterstützungsangebote werden benötigt?</li><li>Welche Verträge, Haustiere, Kinder oder laufenden Verpflichtungen müssen organisiert werden?</li><li>Wer soll informiert werden, wenn sich die Situation verschlechtert?</li></ul></div></div></section>`}



const APPLICATIONS={
  sterbevierteljahr:{
    title:'Vorschuss für das Sterbevierteljahr',
    short:'Sterbevierteljahr',
    authority:'Renten Service der Deutschen Post',
    officialForm:'Änderungsanzeige und Anträge im Renten Service – Teil 7',
    sourceStand:'Deutsche Post, Stand 03/2026',
    applyUrl:'https://www.deutschepost.de/dam/jcr:ccb44b2b-ade2-4956-975a-6b6627f5e17f/dp-rs-aenderungsformular-rentenservice.pdf',
    applyLabel:'Original-Antrag (PDF) öffnen',
    infoUrl:'https://www.deutschepost.de/de/r/rentenservice/downloadcenter.html',
    infoLabel:'Renten Service: Hinweise & Formulare',
    pdf:'https://www.deutschepost.de/dam/jcr:ccb44b2b-ade2-4956-975a-6b6627f5e17f/dp-rs-aenderungsformular-rentenservice.pdf',
    note:'Für Ehe- oder Lebenspartner. Der schnelle Vorschuss wird beim Renten Service beantragt; der reguläre Antrag auf Witwen-/Witwerrente bei der Deutschen Rentenversicherung bleibt zusätzlich erforderlich.'
  },
  widowPension:{
    title:'Witwen-/Witwerrente',
    short:'Hinterbliebenenrente',
    authority:'Deutsche Rentenversicherung',
    officialForm:'R0500 – Antrag auf Hinterbliebenenrente',
    sourceStand:'R0500 Version 33, Stand 01.07.2026',
    applyUrl:'https://www.eservice-drv.de/eantrag/hinweis-ohne-karte-direkt.seam?formular=r0500',
    applyLabel:'DRV eAntrag R0500 starten',
    infoUrl:'https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0500.html',
    infoLabel:'DRV Informationen zu R0500',
    pdf:'https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0500.pdf?__blob=publicationFile',
    note:'Die App bereitet die häufig benötigten Kernangaben vor. Das offizielle R0500 enthält zusätzliche individuelle Fragen, insbesondere zu Versicherungszeiten, Einkommen und Sonderfällen.'
  },
  orphanPension:{
    title:'Halb-/Vollwaisenrente',
    short:'Waisenrente',
    authority:'Deutsche Rentenversicherung',
    officialForm:'R0500 plus Anlage R0610',
    sourceStand:'R0500 / R0610',
    applyUrl:'https://www.eservice-drv.de/eantrag/hinweis-ohne-karte-direkt.seam?formular=r0500',
    applyLabel:'DRV eAntrag Hinterbliebenenrente starten',
    infoUrl:'https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0610.html',
    infoLabel:'DRV Informationen zu R0610',
    pdf:'https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0610.pdf?__blob=publicationFile',
    note:'Für einen Erstantrag wird der Antrag auf Hinterbliebenenrente R0500 zusammen mit der Anlage R0610 benötigt. Bei bereits gezahlter Waisenrente können andere Formulare einschlägig sein.'
  },
  funeralCosts:{
    title:'Übernahme erforderlicher Bestattungskosten',
    short:'Bestattungskosten § 74 SGB XII',
    authority:'Zuständiges Sozialamt',
    officialForm:'Kein bundeseinheitliches Formular',
    sourceStand:'§ 74 SGB XII',
    applyUrl:'',
    applyLabel:'',
    infoUrl:'https://www.gesetze-im-internet.de/sgb_12/__74.html',
    infoLabel:'Gesetzliche Grundlage § 74 SGB XII',
    pdf:'',
    note:'Die Formulare unterscheiden sich je nach Sozialamt. Die App erstellt deshalb einen vollständigen Antragsdatensatz und ein druckbares Anschreiben, das zusammen mit einem örtlichen Formular verwendet werden kann.'
  }
};

function genderedRelation(base,p){
  const sal=(p?.profile?.salutation||'').toLowerCase();
  if(base==='child') return sal==='herr'?'Sohn':sal==='frau'?'Tochter':'Kind';
  if(base==='parent') return sal==='herr'?'Vater':sal==='frau'?'Mutter':'Elternteil';
  if(base==='sibling') return sal==='herr'?'Bruder':sal==='frau'?'Schwester':'Geschwister';
  if(base==='partner') return sal==='herr'?'Partner':sal==='frau'?'Partnerin':'Partner/in';
  return base;
}
function relationBetween(subject,other){
  if(!subject||!other)return '';
  if(subject.id===other.id)return 'dieselbe Person';
  // Wenn die Bezugsperson "Ich" ist, ist die gespeicherte Beziehung direkt nutzbar.
  if(subject.relation==='self'){
    if(other.relation==='partner')return genderedRelation('partner',other);
    if(other.relation==='mother')return 'Mutter';
    if(other.relation==='father')return 'Vater';
    if(other.relation==='child')return genderedRelation('child',other);
    if(other.relation==='sibling')return genderedRelation('sibling',other);
    if(other.relation==='other')return 'Andere Person';
  }
  // Wenn die ausgewählte Person "Ich" ist, wird die Beziehung zur Bezugsperson umgedreht.
  if(other.relation==='self'){
    if(subject.relation==='partner')return genderedRelation('partner',other);
    if(subject.relation==='mother'||subject.relation==='father')return genderedRelation('child',other);
    if(subject.relation==='child')return genderedRelation('parent',other);
    if(subject.relation==='sibling')return genderedRelation('sibling',other);
    return 'Angehörige Person';
  }
  // Zwischen zwei anderen gespeicherten Personen nicht raten.
  return 'Beziehung auswählen';
}
function applicantRelationOptions(selected=''){
  const vals=['Ehepartner/in','Lebenspartner/in','Partner/in','Mutter','Vater','Sohn','Tochter','Kind','Bruder','Schwester','Geschwister','Enkel/in','Großmutter','Großvater','Schwiegersohn/-tochter','Sonstige angehörige Person'];
  return vals.map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(v)}</option>`).join('');
}
function applicationSupported(id){return !!APPLICATIONS[id]}
function openApplication(id){
  if(!APPLICATIONS[id]){toast('Für diesen Punkt ist noch kein Antragsassistent hinterlegt');return}
  state.applicationTaskId=id;go('application')
}
function currentCase(){return state.cases[0]||null}
function deceasedForCase(c=currentCase()){return c?state.persons.find(p=>p.id===c.personId)||null:null}
function appStore(c,id){c.applications=c.applications||{};c.applications[id]=c.applications[id]||{};return c.applications[id]}
function personAddress(p){const x=p?.profile||{};return [x.street,[x.zip,x.city].filter(Boolean).join(' '),x.country&&x.country!=='Deutschland'?x.country:''].filter(Boolean).join(', ')}
function personSelectOptions(selected='',filterFn=null,subject=null){return state.persons.filter(p=>!filterFn||filterFn(p)).map(p=>{const rel=subject?relationBetween(subject,p):relationLabel(p.relation);return `<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(personName(p))} – ${esc(rel)}</option>`}).join('')}
function defaultApplicant(c,id){
  const dead=deceasedForCase(c);
  if(!dead)return state.persons.find(p=>p.relation==='self'&&p.id!==c?.personId)?.id||'';
  const others=state.persons.filter(p=>p.id!==dead.id);
  if(id==='sterbevierteljahr'||id==='widowPension')return others.find(p=>p.relation==='partner')?.id||others.find(p=>p.relation==='self')?.id||others[0]?.id||'';
  if(id==='orphanPension')return others.find(p=>p.relation==='child')?.id||others[0]?.id||'';
  return others.find(p=>p.relation==='self')?.id||others[0]?.id||'';
}
function applicationApplicant(c,id,data){return state.persons.find(p=>p.id===(data?.applicantId||defaultApplicant(c,id)))||null}
function applicantAutofillCard(p){
  if(!p)return `<div class="notice">Noch keine antragstellende Person gewählt.</div>`;
  const x=p.profile||{},dead=deceasedForCase(),rel=relationBetween(dead,p);
  return `<div class="autofill-card"><div><b>${esc(personName(p))}</b><div class="small muted">${esc(rel)} · ${esc(personAddress(p)||'Adresse noch nicht vollständig')} · ${esc(x.phone||'Telefon fehlt')}</div></div><span>✓ Stammdaten</span></div>`;
}
function sharedApplicantFields(p,data={}){
  const x=p?.profile||{},fin=p?.finance||{};
  return `<div class="form-card"><h3>Antragstellende Person</h3>${applicantAutofillCard(p)}
    <div class="two">${field('Telefon','appPhone',data.phone??x.phone??'','tel')}${field('E-Mail','appEmail',data.email??x.email??'','email')}</div>
    <div class="two">${field('Rentenversicherungsnummer','appPensionNo',data.pensionNo??x.pensionNo??'')}${field('Steuer-ID','appTaxId',data.taxId??x.taxId??'')}</div>
    ${field('Krankenkasse','appHealthInsurance',data.healthInsurance??x.healthInsurance??'')}
  </div>
  <div class="form-card"><h3>Zahlungsweg</h3>
    ${field('IBAN','appIban',data.iban??fin.iban??'')}
    <div class="two">${field('Geldinstitut','appBankName',data.bankName??fin.bankName??'')}${field('Kontoinhaber/in','appAccountHolder',data.accountHolder??fin.accountHolder??personName(p))}</div>
    <label class="checkline"><input type="checkbox" id="saveFinance" checked> Zahlungsdaten bei dieser Person für weitere Anträge merken</label>
  </div>`;
}
function attachmentChecks(data,items){
  const have=data.attachments||{};
  return `<div class="form-card"><h3>Unterlagen-Checkliste</h3>${items.map(([k,l])=>`<label class="checkline"><input type="checkbox" id="att_${k}" ${have[k]?'checked':''}> ${esc(l)}</label>`).join('')}</div>`;
}
function applicationCompleteness(id,c,data,applicant){
  const dead=deceasedForCase(c),dx=dead?.profile||{},ax=applicant?.profile||{};
  let vals=[];
  if(id==='sterbevierteljahr')vals=[dead?.id,c?.deathDate,dx.pensionNo||data.postPensionNo,applicant?.id,data.marriageDate,data.iban||applicant?.finance?.iban];
  if(id==='widowPension')vals=[dead?.id,c?.deathDate,dx.pensionNo,applicant?.id,ax.birthDate,data.marriageDate,data.iban||applicant?.finance?.iban,data.taxId||ax.taxId,data.healthInsurance||ax.healthInsurance];
  if(id==='orphanPension')vals=[dead?.id,c?.deathDate,dx.pensionNo,applicant?.id,ax.birthDate,data.childRelationship,data.iban||applicant?.finance?.iban];
  if(id==='funeralCosts')vals=[dead?.id,c?.deathDate,applicant?.id,data.socialOffice,data.funeralCostTotal,data.reason];
  const complete=vals.filter(Boolean).length,total=vals.length;
  return {complete,total,pct:total?Math.round(complete/total*100):0};
}
function applicationProgress(id,c,data,applicant){
  const q=applicationCompleteness(id,c,data,applicant);
  return `<div class="application-progress"><div><b>${q.pct}%</b><span>Kernangaben vorbereitet</span></div><progress max="100" value="${q.pct}"></progress><small>${q.complete} von ${q.total} Kernangaben vorhanden</small></div>`;
}
const DEATH_TASKS={
  doctor:{
    phase:'first',title:'Ärztliche Feststellung / Todesbescheinigung',kind:'Dokument',
    urgency:'sofort',where:'Arzt bzw. ärztlicher Dienst; bei ungeklärtem oder nicht natürlichem Tod gelten besondere Abläufe.',
    info:'Die Todesbescheinigung ist Grundlage für die Beurkundung beim Standesamt. Im Krankenhaus oder Pflegeheim wird der Ablauf in der Regel von der Einrichtung angestoßen.',
    docs:['Personalausweis der verstorbenen Person, soweit verfügbar','ggf. medizinische Unterlagen'],
    links:[]
  },
  undertaker:{
    phase:'first',title:'Bestatter beauftragen',kind:'Organisation',urgency:'zeitnah',
    where:'Bestattungsunternehmen deiner Wahl.',
    info:'Der Bestatter kann häufig die Anzeige beim Standesamt, Sterbeurkunden und die Vorschusszahlung für das Sterbevierteljahr mit vorbereiten.',
    docs:['Personalausweis','Personenstandsurkunden','Todesbescheinigung'],links:[]
  },
  cert:{
    phase:'first',title:'Sterbeurkunden beantragen',kind:'Antrag',urgency:'frühzeitig',
    where:'Standesamt des Sterbeortes. Krankenhäuser, Pflegeeinrichtungen oder Bestatter übernehmen häufig die Sterbefallanzeige.',
    info:'Sterbeurkunden werden später unter anderem für Renten-, Versicherungs-, Bank- und Nachlassangelegenheiten benötigt.',
    docs:['je nach Fall Todesbescheinigung','Personalausweis','Geburts-/Heiratsurkunde oder weitere Personenstandsurkunden'],
    links:[['Bundesportal: Sterbeurkunde','https://verwaltung.bund.de/leistungsverzeichnis/de/leistung/99000000007397']]
  },
  sterbevierteljahr:{
    phase:'benefits',title:'Vorschuss Sterbevierteljahr beantragen',kind:'Antrag',urgency:'30 Tage',
    where:'Renten Service der Deutschen Post, ggf. über das Bestattungsinstitut.',
    info:'Das ist nicht einfach die Rente des Verstorbenen. Es ist ein Vorschuss auf die Witwen-/Witwerrente. Wenn der verstorbene Ehe- oder Lebenspartner bereits eine gesetzliche Rente bezog, kann der hinterbliebene Ehe-/Lebenspartner innerhalb von 30 Tagen einen Vorschuss beantragen. Er entspricht grundsätzlich dem Dreifachen der für den Sterbemonat gezahlten Monatsrente. Zusätzlich muss anschließend der formelle Antrag auf Witwen-/Witwerrente bei der Deutschen Rentenversicherung gestellt werden.',
    docs:['Original der Sterbeurkunde mit Ehe-/Lebenspartnerangabe','Bankverbindung (IBAN)','Angaben zum verstorbenen Rentenbezieher','Tag der Eheschließung / Lebenspartnerschaft'],
    links:[['ANTRAG: Vorschuss Sterbevierteljahr (PDF)','https://www.deutschepost.de/dam/jcr:ccb44b2b-ade2-4956-975a-6b6627f5e17f/dp-rs-aenderungsformular-rentenservice.pdf'],['Renten Service: Hinweise & Formulare','https://www.deutschepost.de/de/r/rentenservice/downloadcenter.html'],['Info: DRV zum Sterbevierteljahr','https://www.deutsche-rentenversicherung.de/SharedDocs/Glossareintraege/DE/S/sterbevierteljahr']]
  },
  widowPension:{
    phase:'benefits',title:'Witwen-/Witwerrente beantragen',kind:'Antrag',urgency:'zeitnah',
    where:'Deutsche Rentenversicherung; online per eAntrag, Beratungsstelle oder Versicherungsamt.',
    info:'Die Hinterbliebenenrente wird nicht automatisch gezahlt. Der reguläre Antrag ist auch dann nötig, wenn bereits der Vorschuss für das Sterbevierteljahr beantragt wurde. Hinterbliebenenrenten können grundsätzlich bis zu zwölf Kalendermonate rückwirkend gezahlt werden.',
    docs:['Sterbeurkunde','Heirats-/Lebenspartnerschaftsurkunde','Bankverbindung','Krankenkasse','Steuer-ID','ggf. letzter Rentenbescheid des Verstorbenen','Angaben zu eigenem Einkommen'],
    links:[['DRV: Antrag R0500','https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0500.html']]
  },
  orphanPension:{
    phase:'benefits',title:'Halb-/Vollwaisenrente beantragen',kind:'Antrag',urgency:'zeitnah',
    where:'Deutsche Rentenversicherung.',
    info:'Kinder können Waisenrente erhalten. Für volljährige Waisen gelten zusätzliche Voraussetzungen, etwa Schule, Ausbildung, Studium oder bestimmte Freiwilligendienste. Für den Antrag werden R0500 und die Anlage R0610 verwendet.',
    docs:['Geburts-/Abstammungsurkunde des Kindes','Sterbeurkunde','Steuer-ID','Bankverbindung','Krankenkasse','bei über 18-Jährigen ggf. Schul-/Ausbildungs-/Studiennachweis'],
    links:[['DRV: Waisenrenten-Unterlagen','https://www.deutsche-rentenversicherung.de/DRV/DE/Beratung-und-Kontakt/Beratung-suchen-und-buchen/Welche-Unterlagen-werden-benoetigt/welche-unterlagen-werden-benoetigt_node'],['DRV: Anlage R0610','https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0610.pdf']]
  },
  educationPension:{
    phase:'benefits',title:'Erziehungsrente prüfen / beantragen',kind:'Antrag',urgency:'prüfen',
    where:'Deutsche Rentenversicherung.',
    info:'Relevant insbesondere für Geschiedene, die nach dem Tod des früheren Ehe-/Lebenspartners ein Kind erziehen und die rentenrechtlichen Voraussetzungen erfüllen. Die Erziehungsrente wird aus der eigenen Versicherung gezahlt. Für einen rückwirkenden Beginn sollte der Antrag nicht unnötig verzögert werden.',
    docs:['Sterbeurkunde des früheren Partners','Scheidungsurteil bzw. Nachweis der Auflösung','Geburtsurkunde des Kindes','eigene Versicherungsnummer','Einkommensnachweise'],
    links:[['DRV: Infos zur Erziehungsrente','https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2026/260408-erziehungsrente-unterstuetzung-geschiedene'],['DRV: Anlage R0220','https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/R0220.html']]
  },
  accidentBenefits:{
    phase:'benefits',title:'Leistungen der gesetzlichen Unfallversicherung beantragen',kind:'Antrag',urgency:'prüfen',
    where:'Zuständige Berufsgenossenschaft oder Unfallkasse.',
    info:'Wenn der Tod Folge eines Arbeitsunfalls, Wegeunfalls oder einer Berufskrankheit war, kommen Sterbegeld, Überführungskosten und Hinterbliebenenrenten in Betracht.',
    docs:['Sterbeurkunde','Unterlagen zum Arbeits-/Wegeunfall oder zur Berufskrankheit','Nachweise über Bestattungskosten','Verwandtschafts-/Familiennachweise'],
    links:[['DGUV: Leistungen an Hinterbliebene','https://www.dguv.de/de/reha_leistung/hinterbliebene/index.jsp']]
  },
  funeralCosts:{
    phase:'benefits',title:'Übernahme von Bestattungskosten nach § 74 SGB XII prüfen',kind:'Antrag',urgency:'frühzeitig',
    where:'Zuständiges Sozialamt.',
    info:'Wenn die zur Bestattung verpflichtete Person die erforderlichen Bestattungskosten nicht zumutbar tragen kann, kann eine Kostenübernahme nach § 74 SGB XII in Betracht kommen.',
    docs:['Bestattungsrechnung/Kostenvoranschlag','Nachweise zu Einkommen und Vermögen','Nachlassübersicht','Sterbeurkunde','Nachweis der Verpflichtung zur Kostentragung'],
    links:[['Gesetz: § 74 SGB XII','https://www.gesetze-im-internet.de/sgb_12/__74.html']]
  },
  occupationalPension:{
    phase:'benefits',title:'Betriebsrente / Zusatzversorgung: Hinterbliebenenleistung beantragen',kind:'Antrag',urgency:'prüfen',
    where:'Ehemaliger Arbeitgeber, Pensionskasse, Direktversicherung, Zusatzversorgungskasse oder Versorgungsträger.',
    info:'Bei betrieblicher Altersversorgung können Witwen-/Witwer- oder Waisenleistungen bestehen. Die Voraussetzungen hängen vom jeweiligen Versorgungssystem ab.',
    docs:['Sterbeurkunde','Versorgungs-/Policennummer','Heirats-/Geburtsurkunden','Bankverbindung'],links:[]
  },
  civilService:{
    phase:'benefits',title:'Witwen-/Waisengeld bei Beamtenversorgung prüfen',kind:'Antrag',urgency:'prüfen',
    where:'Dienstherr bzw. zuständige Versorgungsstelle.',
    info:'War die verstorbene Person Beamtin/Beamter oder Versorgungsempfänger, können beamtenrechtliche Hinterbliebenenleistungen in Betracht kommen. Zuständigkeit und Formulare hängen vom Dienstherrn ab.',
    docs:['Sterbeurkunde','Heirats-/Geburtsurkunden','Versorgungsaktenzeichen','Bankverbindung'],links:[]
  },
  lifeInsurance:{
    phase:'benefits',title:'Lebens-/Sterbegeldversicherung geltend machen',kind:'Leistung',urgency:'zeitnah',
    where:'Jeweiliges Versicherungsunternehmen.',
    info:'Versicherer verlangen häufig eine Sterbeurkunde und die Versicherungsunterlagen; bei Lebensversicherungen kann je nach Vertrag zusätzlich ein ärztlicher Nachweis verlangt werden.',
    docs:['Sterbeurkunde','Versicherungsschein/Policennummer','Nachweis der Bezugsberechtigung','Bankverbindung'],links:[]
  },
  inheritanceReject:{
    phase:'estate',title:'Erbausschlagung prüfen',kind:'Frist',urgency:'meist 6 Wochen',
    where:'Nachlassgericht oder Amtsgericht am eigenen Wohnort; alternativ Notar.',
    info:'Wer eine Erbschaft nicht annehmen möchte, muss sie ausdrücklich ausschlagen. Die Frist beträgt normalerweise sechs Wochen ab Kenntnis davon, dass und aus welchem Grund man Erbe ist. Ein einfacher Brief reicht nicht.',
    docs:['Personalausweis/Reisepass','ggf. Schreiben des Nachlassgerichts','Angaben zum Erbfall'],
    links:[['Justiz: Erbe ausschlagen','https://www.service.justiz.de/erbausschlagung']]
  },
  inheritanceCertificate:{
    phase:'estate',title:'Erbschein nur bei Bedarf beantragen',kind:'Antrag',urgency:'kein fester Termin',
    where:'Nachlassgericht am letzten gewöhnlichen Aufenthalt der verstorbenen Person.',
    info:'Ein Erbschein ist nicht immer nötig. Er dient als Nachweis der Erbenstellung, z. B. wenn kein ausreichender anderer Erbnachweis vorliegt. Er kostet Gebühren und sollte daher nicht vorschnell beantragt werden.',
    docs:['Personalausweis','Sterbeurkunde','Personenstandsurkunden','ggf. Testament/Erbvertrag bzw. Angaben zur gesetzlichen Erbfolge'],
    links:[['Justiz: Erbschein-Wegweiser','https://www.service.justiz.de/erbschein']]
  },
  inheritanceTax:{
    phase:'estate',title:'Erwerb beim Erbschaftsteuer-Finanzamt anzeigen',kind:'Meldung',urgency:'3 Monate',
    where:'Für die Erbschaftsteuer zuständiges Finanzamt.',
    info:'Ein erbschaftsteuerpflichtiger Erwerb ist grundsätzlich innerhalb von drei Monaten nach Kenntnis anzuzeigen. Es gibt Ausnahmen, etwa wenn ein deutsches Gericht oder ein Notar eine Verfügung von Todes wegen eröffnet hat; bei Grundbesitz, Betriebsvermögen oder bestimmten weiteren Vermögenswerten können Ausnahmen wiederum nicht greifen.',
    docs:['Angaben zu Erblasser und Erwerber','Todestag/Sterbeort','Art und Wert des Erwerbs','Verwandtschaftsverhältnis','frühere Zuwendungen'],
    links:[['Gesetz: § 30 ErbStG','https://www.gesetze-im-internet.de/erbstg_1974/__30.html'],['Justiz: Nachlass regeln','https://service.justiz.de/nachlass']]
  },
  landRegister:{
    phase:'estate',title:'Grundbuch nach Erbfall berichtigen',kind:'Antrag',urgency:'innerhalb 2 Jahren günstig',
    where:'Zuständiges Grundbuchamt.',
    info:'Bei geerbtem Grundbesitz sollte das Grundbuch berichtigt werden. Für die Eintragung der Erben wird keine Grundbuchgebühr erhoben, wenn der ordnungsgemäße Antrag innerhalb von zwei Jahren seit dem Erbfall eingeht.',
    docs:['Erbnachweis, z. B. Erbschein oder geeignete notarielle Verfügung von Todes wegen','Antrag auf Grundbuchberichtigung'],
    links:[['Bayerische Justiz: Grundbuchberichtigung nach Erbfall','https://www.justiz.bayern.de/gerichte-und-behoerden/amtsgerichte/muenchen/verfahren_08.php']]
  },
  familyBenefits:{
    phase:'later',title:'Kindergeld / Kinderzuschlag neu zuordnen oder Änderungen melden',kind:'Antrag/Meldung',urgency:'prüfen',
    where:'Familienkasse.',
    info:'Wenn die verstorbene Person Kindergeld oder Kinderzuschlag bezogen hat oder sich die Haushalts- und Einkommensverhältnisse geändert haben, sollte die Familienkasse direkt informiert werden. Ggf. ist ein neuer Antrag durch die nun berechtigte Person nötig.',
    docs:['Kindergeldnummer','Sterbeurkunde','Steuer-IDs','Bankverbindung','ggf. Einkommensnachweise'],
    links:[['Familienkasse: Veränderungen mitteilen','https://www.arbeitsagentur.de/familie-und-kinder/veraenderungen-mitteilen'],['Kindergeld-Antrag/Formulare','https://www.arbeitsagentur.de/familie-und-kinder/downloads-familie-und-kinder/formulare-kindergeld']]
  },
  housingBenefits:{
    phase:'later',title:'Wohngeld / Bürgergeld / Grundsicherung neu prüfen',kind:'Antrag',urgency:'bei Einkommensänderung',
    where:'Je nach Leistung Wohngeldstelle, Jobcenter oder Sozialamt.',
    info:'Durch den Tod kann sich das Haushaltseinkommen erheblich ändern. Bestehende Leistungen müssen ggf. angepasst werden; ein neuer Anspruch kann entstehen. Diese Prüfung ist individuell.',
    docs:['Einkommens- und Vermögensnachweise','Miet-/Wohnkosten','Sterbeurkunde','Bescheide bestehender Leistungen'],links:[]
  },
  health:{
    phase:'later',title:'Krankenkasse / Pflegekasse informieren',kind:'Meldung',urgency:'zeitnah',
    where:'Krankenkasse der verstorbenen Person.',
    info:'Die Kasse sollte über den Tod informiert werden, sofern dies nicht bereits über andere Stellen geschehen ist. Offene Leistungs-, Beitrags- oder Pflegefragen können dabei geklärt werden.',
    docs:['Sterbeurkunde','Versichertennummer'],links:[]
  },
  employer:{
    phase:'later',title:'Arbeitgeber / Dienstherr informieren und Ansprüche klären',kind:'Meldung',urgency:'zeitnah',
    where:'Arbeitgeber, Personalstelle oder Dienstherr.',
    info:'Zu klären sind z. B. Restentgelt, Urlaubsabgeltung, betriebliche Versicherungen, Versorgung, Sterbegeld nach Tarif-/Dienstrecht oder Ansprechpartner für Zusatzversorgung.',
    docs:['Sterbeurkunde','Personalnummer','ggf. Vollmacht/Erbnachweis'],links:[]
  },
  digital:{
    phase:'later',title:'Digitalen Nachlass bearbeiten',kind:'Organisation',urgency:'später',
    where:'E-Mail-, Cloud-, Social-Media-, Zahlungs- und Plattformanbieter.',
    info:'Zugänge sichern, Verträge beenden oder Konten in einen Gedenkstatus versetzen. Vorher Erbenstellung und datenschutzrechtliche/vertragliche Voraussetzungen prüfen.',
    docs:['Sterbeurkunde','ggf. Erbnachweis','Kontodaten/Nutzernamen'],links:[]
  },
  contracts:{
    phase:'later',title:'Verträge, Abos, Energie, Telefon, Vereine bearbeiten',kind:'Organisation',urgency:'nach Sichtung',
    where:'Jeweilige Vertragspartner.',
    info:'Nicht jeder Vertrag endet automatisch mit dem Tod. Je nach Vertrag kommt Kündigung, Sonderkündigung, Übernahme oder Umschreibung in Betracht.',
    docs:['Sterbeurkunde','Kunden-/Vertragsnummer','ggf. Erbnachweis'],links:[]
  }
};

function factYes(c,key){return (c.facts||{})[key]==='yes'}
function factNo(c,key){return (c.facts||{})[key]==='no'}
function taskRelevance(c,id){
  if(id==='sterbevierteljahr' && (factNo(c,'pensioner')||factNo(c,'spouse'))) return 'hide';
  if(id==='widowPension' && factNo(c,'spouse')) return 'hide';
  if(id==='orphanPension' && factNo(c,'children')) return 'hide';
  if(id==='educationPension' && factNo(c,'divorcedChild')) return 'hide';
  if(id==='accidentBenefits' && factNo(c,'workAccident')) return 'hide';
  if(id==='funeralCosts' && factNo(c,'funeralHelp')) return 'hide';
  if(id==='civilService' && factNo(c,'civilServant')) return 'hide';
  if(id==='landRegister' && factNo(c,'realEstate')) return 'hide';
  if(id==='familyBenefits' && factNo(c,'children')) return 'hide';
  if(id==='inheritanceReject' && factNo(c,'inheritanceRisk')) return 'optional';
  return 'show';
}
function taskStatus(c,id){const v=(c.tasks||{})[id];if(v===true)return 'done';if(v===false||!v)return 'open';return v}
function statusLabel(s){return s==='done'?'Erledigt':s==='applied'?'Beantragt / gemeldet':s==='prepared'?'Vorbereitet':'Offen'}
function deathTaskCard(c,id){
  const t=DEATH_TASKS[id],rel=taskRelevance(c,id);if(rel==='hide')return '';
  const st=taskStatus(c,id),cls=st==='done'?'done':st==='applied'?'applied':st==='prepared'?'prepared':'';
  const optional=rel==='optional'?'<span class="death-badge optional">nur falls nötig</span>':'';
  const links=(t.links||[]).map(([lab,url])=>`<button class="cta ghost small-btn" onclick="event.preventDefault();event.stopPropagation();window.open('${url}','_blank','noopener')">${esc(lab)} ↗</button>`).join('');
  const prep=applicationSupported(id)?`<button class="cta application-btn" onclick="event.preventDefault();event.stopPropagation();openApplication('${id}')">📝 Antrag vorbereiten</button>`:'';
  return `<details class="death-task ${cls}">
    <summary><div class="death-check">${st==='done'?'✓':st==='applied'?'↗':st==='prepared'?'✎':'○'}</div><div class="grow"><b>${esc(t.title)}</b><div class="meta">${esc(t.kind)} · ${esc(t.urgency)}</div></div><span class="death-status">${statusLabel(st)}</span>${optional}</summary>
    <div class="death-detail">
      <div class="death-info"><b>Was bedeutet das?</b><p>${esc(t.info)}</p></div>
      <div class="death-info"><b>Wo?</b><p>${esc(t.where)}</p></div>
      <div class="death-info"><b>Typische Unterlagen</b><ul>${(t.docs||[]).map(d=>`<li>${esc(d)}</li>`).join('')}</ul></div>
      ${prep}
      ${links?`<div class="death-links">${links}</div>`:''}
      <div class="death-actions">
        <button class="cta ghost" onclick="event.preventDefault();setCaseTaskStatus('${id}','open')">Offen</button>
        ${applicationSupported(id)?`<button class="cta ghost" onclick="event.preventDefault();setCaseTaskStatus('${id}','prepared')">Vorbereitet</button>`:''}
        <button class="cta ghost" onclick="event.preventDefault();setCaseTaskStatus('${id}','applied')">Beantragt</button>
        <button class="cta teal" onclick="event.preventDefault();setCaseTaskStatus('${id}','done')">Erledigt</button>
      </div>
    </div>
  </details>`;
}
async function setCaseTaskStatus(id,status){const c=state.cases[0];if(!c)return;c.tasks=c.tasks||{};c.tasks[id]=status;await idbSet('cases','main',state.cases);render()}
function factSelect(label,key,val0='unknown'){return selectField(label,'fact_'+key,val0,[`unknown|Weiß ich noch nicht`,`yes|Ja`,`no|Nein`])}
function caseScreen(){const current=state.cases[0]||{},f=current.facts||{},opts=state.persons.map(p=>`<option value="${p.id}" ${current.personId===p.id?'selected':''}>${esc(personName(p))} – ${esc(relationLabel(p.relation))}</option>`).join('');return `<section class="screen">${appTop('Sterbefall','Schritt für Schritt durch Aufgaben, Anträge und Fristen')}<div class="content"><div class="form-card"><h3>Fall</h3><div class="field"><label>Verstorbene Person</label><select id="casePerson"><option value="">Bitte auswählen</option>${opts}</select></div>${field('Sterbedatum','cDeath',current.deathDate,'date')}${selectField('Sterbeort','cPlace',current.place||'',['|Bitte auswählen','Zuhause','Krankenhaus','Pflegeheim','Hospiz','Ausland','Sonstiges'])}<details class="case-facts"><summary>Welche Anträge könnten relevant sein? <span>kurze Fragen</span></summary><div class="mt16">${factSelect('Hat die verstorbene Person bereits gesetzliche Rente bezogen?','pensioner',f.pensioner)}${factSelect('Gibt es einen hinterbliebenen Ehe-/Lebenspartner?','spouse',f.spouse)}${factSelect('Gibt es Kinder / mögliche Waisenrentenberechtigte?','children',f.children)}${factSelect('Erzieht ein geschiedener früherer Partner ein gemeinsames Kind?','divorcedChild',f.divorcedChild)}${factSelect('Könnte der Tod Folge eines Arbeits-/Wegeunfalls oder einer Berufskrankheit sein?','workAccident',f.workAccident)}${factSelect('War die verstorbene Person Beamter/Beamtin oder Versorgungsempfänger?','civilServant',f.civilServant)}${factSelect('Sind die Bestattungskosten finanziell schwer tragbar?','funeralHelp',f.funeralHelp)}${factSelect('Gibt es eine Immobilie / Grundbesitz?','realEstate',f.realEstate)}${factSelect('Besteht das Risiko eines überschuldeten Nachlasses?','inheritanceRisk',f.inheritanceRisk)}</div></details><button class="cta teal full" onclick="saveCase()">Fall speichern / aktualisieren</button></div>${current.personId?caseDashboard(current):'<div class="empty-card"><div class="empty-icon">🕯️</div><h3>Noch kein Fall angelegt</h3><p>Wähle eine bereits vorhandene Person aus. Stammdaten werden automatisch übernommen.</p></div>'}</div></section>`}

function caseDashboard(c){const p=state.persons.find(x=>x.id===c.personId);if(!p)return '';const sections=[
  ['first','Jetzt zuerst','Dokumente und erste Schritte',['doctor','undertaker','cert']],
  ['benefits','Anträge & finanzielle Leistungen','Hier kann Geld verloren gehen, wenn wichtige Anträge übersehen werden.',['sterbevierteljahr','widowPension','orphanPension','educationPension','accidentBenefits','funeralCosts','occupationalPension','civilService','lifeInsurance']],
  ['estate','Erbe & Nachlass','Fristen und Nachweise',['inheritanceReject','inheritanceCertificate','inheritanceTax','landRegister']],
  ['later','Weitere Stellen','Danach systematisch abarbeiten',['familyBenefits','housingBenefits','health','employer','contracts','digital']]
];return `<div class="case-hero"><small>Fallakte</small><h2>${esc(personName(p))}</h2><div>${c.deathDate?`† ${fmtDate(c.deathDate)}`:''}${c.place?` · ${esc(c.place)}`:''}</div></div>
<div class="notice mt16"><b>Wichtig zum Sterbevierteljahr:</b> Die „drei Monate Rente“ sind eine Witwen-/Witwerrente in Höhe der Versichertenrente während des Sterbevierteljahres – nicht einfach eine Weiterzahlung der Rente des Verstorbenen. Der schnelle Vorschuss muss bei erfüllten Voraussetzungen innerhalb von 30 Tagen beim Renten Service beantragt werden; der reguläre Hinterbliebenenrentenantrag ist zusätzlich nötig.</div>
${sections.map(([key,title,sub,ids])=>{const cards=ids.map(id=>deathTaskCard(c,id)).join('');return cards?`<div class="section-title death-section"><div><h2>${title}</h2><div class="small muted">${sub}</div></div></div><div class="death-list">${cards}</div>`:''}).join('')}
<button class="cta ghost full mt16" onclick="go('generator')">✍ Schreiben aus Falldaten erstellen</button>`}

async function saveCase(){const personId=val('casePerson');if(!personId){toast('Bitte Person auswählen');return}const old=state.cases[0]||{};const facts={};['pensioner','spouse','children','divorcedChild','workAccident','civilServant','funeralHelp','realEstate','inheritanceRisk'].forEach(k=>facts[k]=val('fact_'+k)||'unknown');state.cases=[{...old,id:old.id||uid('case'),personId,deathDate:val('cDeath'),place:val('cPlace'),facts,tasks:old.tasks||{}}];await idbSet('cases','main',state.cases);toast('Fall gespeichert');render()}
async function toggleCaseTask(id){const c=state.cases[0];if(!c)return;const s=taskStatus(c,id);await setCaseTaskStatus(id,s==='done'?'open':'done')}


function applicationScreen(){
  const c=currentCase(),id=state.applicationTaskId,def=APPLICATIONS[id];
  if(!c||!def)return `<section class="screen">${appTop('Antrag vorbereiten')}<div class="content"><div class="notice">Bitte zuerst einen Sterbefall und einen unterstützten Antrag auswählen.</div></div></section>`;
  const dead=deceasedForCase(c),data=appStore(c,id),applicant=applicationApplicant(c,id,data);
  const selected=applicant?.id||'';
  const options=personSelectOptions(selected,p=>p.id!==c.personId,dead);
  return `<section class="screen">${appTop(def.title,def.authority)}<div class="content">
    <div class="application-source"><div><b>${esc(def.officialForm)}</b><div class="small">${esc(def.sourceStand)}</div></div><span>offizielle Grundlage</span></div>
    ${applicationProgress(id,c,data,applicant)}
    <div class="form-card"><h3>Verstorbene Person</h3>
      <div class="autofill-card"><div><b>${esc(personName(dead))}</b><div class="small muted">${esc(personAddress(dead))}</div></div><span>✓ Fallakte</span></div>
      <div class="two">${field('Sterbedatum','appDeathDate',c.deathDate,'date')}${field('Rentenversicherungsnummer','appDeceasedPensionNo',data.deceasedPensionNo??dead?.profile?.pensionNo??'')}</div>
      ${id==='sterbevierteljahr'?field('Postabrechnungs-/Postrentennummer (falls bekannt)','appPostPensionNo',data.postPensionNo||''):''}
    </div>
    <div class="form-card"><h3>Wer stellt den Antrag?</h3>
      <div class="field"><label>Gespeicherte Person</label><select id="applicationApplicant" onchange="changeApplicationApplicant()"><option value="">Bitte auswählen</option>${options}</select></div>
      <div class="field"><label>Beziehung zur verstorbenen Person</label><select id="applicantRelation"><option value="">Bitte auswählen</option>${applicantRelationOptions(data.applicantRelation||relationBetween(dead,applicant))}</select></div>
      <div class="small muted">Die Beziehung wird soweit möglich vorgeschlagen und kann geändert werden. In den Antragsunterlagen erscheint z. B. Partner/in, Vater, Mutter, Sohn oder Tochter – nicht „Ich“.</div>
    </div>
    ${sharedApplicantFields(applicant,data)}
    ${applicationSpecificForm(id,c,data,applicant)}
    <div class="notice"><b>Hinweis:</b> ${esc(def.note)}</div>
    <button class="cta teal full mt16" onclick="saveApplication()">Antragsdaten speichern</button>
    <button class="cta ghost full mt10" onclick="saveApplication(true)">Vorschau / Antragsmappe</button>
    <div class="application-link-grid mt10">
      ${def.applyUrl?`<button class="cta teal full" onclick="window.open('${def.applyUrl}','_blank','noopener')">${esc(def.applyLabel||'Antrag öffnen')} ↗</button>`:''}
      ${def.pdf && def.pdf!==def.applyUrl?`<button class="cta ghost full" onclick="window.open('${def.pdf}','_blank','noopener')">Original-PDF ↗</button>`:''}
      ${def.infoUrl?`<button class="cta ghost full" onclick="window.open('${def.infoUrl}','_blank','noopener')">${esc(def.infoLabel||'Informationen')} ↗</button>`:''}
    </div>
  </div></section>`;
}

function applicationSpecificForm(id,c,data,applicant){
  if(id==='sterbevierteljahr')return applicationSterbevierteljahr(data,applicant);
  if(id==='widowPension')return applicationWidow(data,applicant);
  if(id==='orphanPension')return applicationOrphan(data,applicant);
  if(id==='funeralCosts')return applicationFuneralCosts(data,applicant);
  return '';
}
function applicationSterbevierteljahr(data,applicant){
  return `<div class="form-card"><h3>Voraussetzungen & Angaben zum Vorschuss</h3>
    ${field('Tag der Eheschließung / Begründung Lebenspartnerschaft','appMarriageDate',data.marriageDate||'','date')}
    ${selectField('Partnerschaft','appPartnership',data.partnership||'marriage',['marriage|Ehe','civil|Eingetragene Lebenspartnerschaft'])}
    <label class="checkline"><input type="checkbox" id="appResidenceGermany" ${data.residenceGermany!==false?'checked':''}> Wohnsitz / gewöhnlicher Aufenthalt im Inland</label>
    <label class="checkline"><input type="checkbox" id="appDeathCertificateOriginal" ${data.deathCertificateOriginal?'checked':''}> Sterbeurkunde im Original liegt für die Antragstellung bereit</label>
    <label class="checkline"><input type="checkbox" id="appMarriageOneYear" ${data.marriageOneYear!==false?'checked':''}> Ehe/Lebenspartnerschaft bestand beim Tod mindestens ein Jahr</label>
  </div>
  ${attachmentChecks(data,[['deathCertificate','Sterbeurkunde im Original, in der Ehe-/Lebenspartner bezeichnet ist'],['id','Personalausweis/Reisepass der hinterbliebenen Person'],['pensionDocument','Rentenmitteilung / Postrentennummer, falls vorhanden']])}`;
}
function applicationWidow(data,applicant){
  return `<div class="form-card"><h3>R0500 – Ehe/Lebenspartnerschaft</h3>
    ${selectField('Beantragte Rente','appPensionType',data.pensionType||'unknown',['unknown|Noch nicht sicher','small|Kleine Witwen-/Witwerrente','largeAge|Große Witwen-/Witwerrente wegen Alter','largeChild|Große Witwen-/Witwerrente wegen Kindererziehung','largeDisability|Große Witwen-/Witwerrente wegen Erwerbsminderung'])}
    ${selectField('Partnerschaft','appPartnership',data.partnership||'marriage',['marriage|Ehe','civil|Eingetragene Lebenspartnerschaft'])}
    ${field('Tag der Eheschließung / Begründung Lebenspartnerschaft','appMarriageDate',data.marriageDate||'','date')}
    ${selectField('Bestand die Ehe/Lebenspartnerschaft bis zum Tod?','appMarriageUntilDeath',data.marriageUntilDeath||'yes',['yes|Ja','no|Nein'])}
    ${selectField('Nach dem Tod erneut geheiratet / neue Lebenspartnerschaft?','appRemarried',data.remarried||'no',['no|Nein','yes|Ja'])}
  </div>
  <div class="form-card"><h3>Einkommen & Versicherungsfragen</h3>
    ${selectField('Eigene deutsche gesetzliche Rentenversicherung?','appOwnPensionInsured',data.ownPensionInsured||'unknown',['unknown|Weiß ich nicht','yes|Ja','no|Nein'])}
    ${textareaField('Eigene Einkünfte (Rente, Beschäftigung, Selbstständigkeit usw.)','appIncome',data.income||'','Nur Übersicht. Das offizielle Verfahren fragt Einkommen detaillierter ab.')}
    ${selectField('Werden Sozialleistungen bezogen?','appSocialBenefit',data.socialBenefit||'unknown',['unknown|Weiß ich nicht','yes|Ja','no|Nein'])}
    ${selectField('Fehlen im Versicherungsverlauf des Verstorbenen möglicherweise Zeiten?','appMissingPeriods',data.missingPeriods||'unknown',['unknown|Weiß ich nicht','yes|Ja','no|Nein'])}
    ${selectField('Gab es Versicherungs-/Beschäftigungszeiten im Ausland?','appForeignPeriods',data.foreignPeriods||'unknown',['unknown|Weiß ich nicht','yes|Ja','no|Nein'])}
  </div>
  ${attachmentChecks(data,[['deathCertificate','Sterbeurkunde'],['marriageCertificate','Heirats-/Lebenspartnerschaftsurkunde'],['id','Gültiges Personaldokument'],['pensionHistory','Versicherungsverlauf / Rentenunterlagen des Verstorbenen'],['incomeProof','Nachweise zu eigenen Einkünften'],['healthInsurance','Angaben/Nachweise Kranken- und Pflegeversicherung']])}`;
}
function applicationOrphan(data,applicant){
  const age=applicant?.profile?.birthDate?Math.floor((Date.now()-new Date(applicant.profile.birthDate+'T00:00:00'))/31557600000):null;
  return `<div class="form-card"><h3>R0610 – Angaben zur Waise</h3>
    ${selectField('Waisenrente','appOrphanType',data.orphanType||'half',['half|Halbwaisenrente','full|Vollwaisenrente'])}
    ${selectField('Kindschaftsverhältnis','appChildRelationship',data.childRelationship||'biological',['biological|Leibliches Kind','step|Stiefkind','foster|Pflegekind','grandchild|Enkelkind','sibling|Bruder/Schwester','other|Sonstiges'])}
    <div class="notice">${age===null?'Alter wird aus dem Geburtsdatum der ausgewählten Person ermittelt.':`Alter laut Stammdaten: <b>${age} Jahre</b>. ${age>=18?'Für volljährige Waisen sind zusätzliche Nachweise erforderlich.':'Für minderjährige Waisen ist die Begründung über Ausbildung in der Regel noch nicht erforderlich.'}`}</div>
    ${selectField('Falls 18 oder älter: Grund für weiteren Anspruch','appAdultReason',data.adultReason||'none',['none|Nicht zutreffend / unter 18','education|Schule / Ausbildung / Studium','voluntary|Freiwilligendienst','disability|Behinderung','transition|Übergangszeit'])}
    ${field('Ausbildung / Schule / Studium – von','appEducationFrom',data.educationFrom||'','date')}
    ${field('voraussichtlich bis','appEducationUntil',data.educationUntil||'','date')}
    ${selectField('Kindergeldanspruch / Kindergeld beantragt?','appChildBenefit',data.childBenefit||'unknown',['unknown|Weiß ich nicht','yes|Ja','no|Nein'])}
  </div>
  ${attachmentChecks(data,[['birthCertificate','Geburts-/Abstammungsurkunde der Waise'],['deathCertificate','Sterbeurkunde(n) des/der verstorbenen Elternteils/Elternteile'],['educationProof','Bei über 18: Schul-/Ausbildungs-/Studiennachweis bzw. R0616'],['childBenefitProof','Falls relevant: Kindergeldbescheid'],['relationshipProof','Falls erforderlich: Nachweis zum Stief-/Pflege-/Enkel-/Geschwisterverhältnis']])}`;
}
function applicationFuneralCosts(data,applicant){
  return `<div class="form-card"><h3>Zuständigkeit & Kosten</h3>
    ${field('Sozialamt / Behörde','appSocialOffice',data.socialOffice||'')}
    ${field('Anschrift der Behörde','appSocialOfficeAddress',data.socialOfficeAddress||'')}
    <div class="two">${field('Bestattungskosten gesamt (€)','appFuneralCostTotal',data.funeralCostTotal||'','number')}${field('Wert/Nachlass verfügbar (€)','appEstateValue',data.estateValue||'','number')}</div>
    <div class="two">${field('Versicherungs-/Sterbegeldleistungen (€)','appInsuranceBenefits',data.insuranceBenefits||'','number')}${field('Weitere Kostenübernahmen (€)','appOtherBenefits',data.otherBenefits||'','number')}</div>
  </div>
  <div class="form-card"><h3>Wirtschaftliche Situation der verpflichteten Person</h3>
    <div class="two">${field('Monatliches Nettoeinkommen (€)','appMonthlyIncome',data.monthlyIncome||'','number')}${field('Verwertbares Vermögen (€)','appAssets',data.assets||'','number')}</div>
    ${field('Monatliche Wohnkosten (€)','appHousingCosts',data.housingCosts||'','number')}
    ${field('Unterhaltspflichten / Personen im Haushalt','appDependants',data.dependants||'')}
    ${textareaField('Warum ist die Kostentragung nicht zumutbar?','appReason',data.reason||'','Kurz und sachlich schildern.')}
  </div>
  ${attachmentChecks(data,[['deathCertificate','Sterbeurkunde'],['funeralInvoice','Bestattungsrechnung bzw. Kostenvoranschlag'],['income','Einkommensnachweise'],['assets','Vermögensnachweise / Kontoauszüge nach Vorgabe des Sozialamts'],['estate','Nachlassübersicht / Nachweise zum Nachlass'],['insurance','Nachweise zu Sterbegeld-/Versicherungsleistungen'],['obligation','Nachweis, warum du zur Kostentragung verpflichtet bist']])}`;
}
function readAttachments(keys){
  const o={};for(const k of keys)o[k]=checked('att_'+k);return o;
}
function collectApplicationData(id){
  const base={
    applicantId:val('applicationApplicant'),
    phone:val('appPhone'),email:val('appEmail'),pensionNo:val('appPensionNo'),taxId:val('appTaxId'),
    healthInsurance:val('appHealthInsurance'),iban:val('appIban'),bankName:val('appBankName'),accountHolder:val('appAccountHolder'),
    deceasedPensionNo:val('appDeceasedPensionNo'),deathDate:val('appDeathDate'),applicantRelation:val('applicantRelation')
  };
  if(id==='sterbevierteljahr')return {...base,postPensionNo:val('appPostPensionNo'),marriageDate:val('appMarriageDate'),partnership:val('appPartnership'),residenceGermany:checked('appResidenceGermany'),deathCertificateOriginal:checked('appDeathCertificateOriginal'),marriageOneYear:checked('appMarriageOneYear'),attachments:readAttachments(['deathCertificate','id','pensionDocument'])};
  if(id==='widowPension')return {...base,pensionType:val('appPensionType'),partnership:val('appPartnership'),marriageDate:val('appMarriageDate'),marriageUntilDeath:val('appMarriageUntilDeath'),remarried:val('appRemarried'),ownPensionInsured:val('appOwnPensionInsured'),income:val('appIncome'),socialBenefit:val('appSocialBenefit'),missingPeriods:val('appMissingPeriods'),foreignPeriods:val('appForeignPeriods'),attachments:readAttachments(['deathCertificate','marriageCertificate','id','pensionHistory','incomeProof','healthInsurance'])};
  if(id==='orphanPension')return {...base,orphanType:val('appOrphanType'),childRelationship:val('appChildRelationship'),adultReason:val('appAdultReason'),educationFrom:val('appEducationFrom'),educationUntil:val('appEducationUntil'),childBenefit:val('appChildBenefit'),attachments:readAttachments(['birthCertificate','deathCertificate','educationProof','childBenefitProof','relationshipProof'])};
  if(id==='funeralCosts')return {...base,socialOffice:val('appSocialOffice'),socialOfficeAddress:val('appSocialOfficeAddress'),funeralCostTotal:val('appFuneralCostTotal'),estateValue:val('appEstateValue'),insuranceBenefits:val('appInsuranceBenefits'),otherBenefits:val('appOtherBenefits'),monthlyIncome:val('appMonthlyIncome'),assets:val('appAssets'),housingCosts:val('appHousingCosts'),dependants:val('appDependants'),reason:val('appReason'),attachments:readAttachments(['deathCertificate','funeralInvoice','income','assets','estate','insurance','obligation'])};
  return base;
}
async function saveApplication(openPreview=false){
  const c=currentCase(),id=state.applicationTaskId;if(!c||!id)return;
  const data=collectApplicationData(id);if(!data.applicantId){toast('Bitte antragstellende Person auswählen');return}
  c.applications=c.applications||{};c.applications[id]={...(c.applications[id]||{}),...data,updatedAt:new Date().toISOString()};
  const applicant=state.persons.find(p=>p.id===data.applicantId);
  if(applicant&&checked('saveFinance')){
    applicant.finance=applicant.finance||{};
    applicant.finance.iban=data.iban;applicant.finance.bankName=data.bankName;applicant.finance.accountHolder=data.accountHolder;
    applicant.profile=applicant.profile||{};
    if(data.pensionNo)applicant.profile.pensionNo=data.pensionNo;
    if(data.taxId)applicant.profile.taxId=data.taxId;
    if(data.healthInsurance)applicant.profile.healthInsurance=data.healthInsurance;
    await persistPersons();
  }
  if(data.deceasedPensionNo){const dead=deceasedForCase(c);if(dead){dead.profile=dead.profile||{};dead.profile.pensionNo=data.deceasedPensionNo;await persistPersons()}}
  c.tasks=c.tasks||{};if(!['applied','done'].includes(c.tasks[id]))c.tasks[id]='prepared';
  await idbSet('cases','main',state.cases);toast('Antragsdaten lokal gespeichert');
  if(openPreview)go('application-preview');else render();
}
function changeApplicationApplicant(){
  const c=currentCase(),id=state.applicationTaskId,data=appStore(c,id);
  data.applicantId=val('applicationApplicant');render();
}
function boolText(v){return v===true?'Ja':v===false?'Nein':v==='yes'?'Ja':v==='no'?'Nein':v||'—'}
function moneyText(v){if(v===''||v===undefined||v===null)return '—';const n=Number(v);return Number.isFinite(n)?n.toLocaleString('de-DE',{style:'currency',currency:'EUR'}):esc(v)}
function applicationPreview(){
  const c=currentCase(),id=state.applicationTaskId,def=APPLICATIONS[id];
  if(!c||!def)return `<section class="screen">${appTop('Antragsmappe')}<div class="content"><div class="notice">Keine Antragsdaten vorhanden.</div></div></section>`;
  const data=appStore(c,id),dead=deceasedForCase(c),applicant=applicationApplicant(c,id,data);
  return `<section class="screen"><div class="topbar no-print"><button class="cta ghost back-btn" onclick="back()">‹</button><div class="grow"><h1>Antragsmappe</h1><div class="sub">${esc(def.title)}</div></div></div>
    <div class="content application-print">
      ${renderApplicationPreview(id,c,data,dead,applicant)}
      <div class="no-print application-preview-actions">
        <button class="cta teal full" onclick="window.print()">Drucken / als PDF speichern</button>
        <button class="cta ghost full mt10" onclick="shareApplicationSummary()">Teilen / versenden</button>
        ${def.applyUrl?`<button class="cta ghost full mt10" onclick="window.open('${def.applyUrl}','_blank','noopener')">${esc(def.applyLabel||'Offiziellen Antrag öffnen')} ↗</button>`:''}
        ${def.infoUrl?`<button class="cta ghost full mt10" onclick="window.open('${def.infoUrl}','_blank','noopener')">${esc(def.infoLabel||'Informationen')} ↗</button>`:''}
      </div>
    </div>
  </section>`;
}
function previewTable(rows){return `<table class="application-table">${rows.map(([a,b])=>`<tr><th>${esc(a)}</th><td>${esc(b===undefined||b===null||b===''?'—':String(b))}</td></tr>`).join('')}</table>`}
function checkedAttachments(data,labels){const a=data.attachments||{};return `<ul class="application-checklist">${labels.map(([k,l])=>`<li>${a[k]?'☑':'☐'} ${esc(l)}</li>`).join('')}</ul>`}
function renderApplicationPreview(id,c,d,dead,applicant){
  const def=APPLICATIONS[id],dx=dead?.profile||{},ax=applicant?.profile||{};
  const header=`<article class="application-sheet"><header><div class="form-brand">Sterbefall Assistent Deutschland</div><h1>${esc(def.title)}</h1><p>Vorbereitete Antragsdaten · ${esc(def.authority)}</p></header>
  <h2>Verstorbene Person</h2>${previewTable([['Name',personName(dead)],['Geburtsdatum',fmtDate(dx.birthDate)],['Adresse',personAddress(dead)],['Sterbedatum',fmtDate(d.deathDate||c.deathDate)],['Rentenversicherungsnummer',d.deceasedPensionNo||dx.pensionNo||'']])}
  <h2>Antragstellende Person</h2>${previewTable([['Name',personName(applicant)],['Beziehung zur verstorbenen Person',d.applicantRelation||relationBetween(dead,applicant)],['Geburtsdatum',fmtDate(ax.birthDate)],['Adresse',personAddress(applicant)],['Telefon',d.phone||ax.phone||''],['E-Mail',d.email||ax.email||''],['Rentenversicherungsnummer',d.pensionNo||ax.pensionNo||''],['Steuer-ID',d.taxId||ax.taxId||''],['Krankenkasse',d.healthInsurance||ax.healthInsurance||''],['IBAN',d.iban||''],['Geldinstitut',d.bankName||''],['Kontoinhaber/in',d.accountHolder||'']])}`;
  let body='';
  if(id==='sterbevierteljahr')body=`<h2>Vorschussangaben</h2>${previewTable([['Postrentennummer',d.postPensionNo],['Tag der Eheschließung / Lebenspartnerschaft',fmtDate(d.marriageDate)],['Partnerschaft',d.partnership==='civil'?'Eingetragene Lebenspartnerschaft':'Ehe'],['Wohnsitz im Inland',boolText(d.residenceGermany)],['Sterbeurkunde Original liegt bereit',boolText(d.deathCertificateOriginal)],['Mindestens 1 Jahr bestanden',boolText(d.marriageOneYear)]])}<h2>Unterlagen</h2>${checkedAttachments(d,[['deathCertificate','Sterbeurkunde im Original'],['id','Personalausweis/Reisepass'],['pensionDocument','Rentenunterlagen / Postrentennummer']])}`;
  if(id==='widowPension')body=`<h2>R0500 – Kernangaben</h2>${previewTable([['Beantragte Rentenart',d.pensionType],['Partnerschaft',d.partnership==='civil'?'Eingetragene Lebenspartnerschaft':'Ehe'],['Tag der Eheschließung',fmtDate(d.marriageDate)],['Bestand bis zum Tod',boolText(d.marriageUntilDeath)],['Erneut geheiratet',boolText(d.remarried)],['Eigene gesetzliche Rentenversicherung',boolText(d.ownPensionInsured)],['Sozialleistungen',boolText(d.socialBenefit)],['Fehlende Versicherungszeiten möglich',boolText(d.missingPeriods)],['Auslandszeiten möglich',boolText(d.foreignPeriods)]])}<p><b>Eigene Einkünfte:</b><br>${esc(d.income||'—')}</p><h2>Unterlagen</h2>${checkedAttachments(d,[['deathCertificate','Sterbeurkunde'],['marriageCertificate','Heirats-/Lebenspartnerschaftsurkunde'],['id','Personaldokument'],['pensionHistory','Versicherungsverlauf/Rentenunterlagen'],['incomeProof','Einkommensnachweise'],['healthInsurance','Kranken-/Pflegeversicherung']])}`;
  if(id==='orphanPension')body=`<h2>R0610 – Angaben zur Waise</h2>${previewTable([['Art',d.orphanType==='full'?'Vollwaisenrente':'Halbwaisenrente'],['Kindschaftsverhältnis',d.childRelationship],['Grund bei Volljährigkeit',d.adultReason],['Ausbildung von',fmtDate(d.educationFrom)],['Ausbildung bis',fmtDate(d.educationUntil)],['Kindergeld',boolText(d.childBenefit)]])}<h2>Unterlagen</h2>${checkedAttachments(d,[['birthCertificate','Geburts-/Abstammungsurkunde'],['deathCertificate','Sterbeurkunde(n)'],['educationProof','Ausbildungs-/Studiennachweis bzw. R0616'],['childBenefitProof','Kindergeldbescheid'],['relationshipProof','ggf. Nachweis Kindschaftsverhältnis']])}`;
  if(id==='funeralCosts')body=`<h2>Antrag an das Sozialamt</h2><p><b>${esc(d.socialOffice||'[zuständiges Sozialamt]')}</b><br>${esc(d.socialOfficeAddress||'')}</p><p>Hiermit beantrage ich die Übernahme der erforderlichen Kosten der Bestattung nach § 74 SGB XII, soweit mir die Kostentragung nicht zugemutet werden kann.</p>${previewTable([['Bestattungskosten gesamt',moneyText(d.funeralCostTotal)],['Verfügbarer Nachlass',moneyText(d.estateValue)],['Versicherungs-/Sterbegeldleistungen',moneyText(d.insuranceBenefits)],['Weitere Kostenübernahmen',moneyText(d.otherBenefits)],['Monatliches Nettoeinkommen',moneyText(d.monthlyIncome)],['Verwertbares Vermögen',moneyText(d.assets)],['Wohnkosten',moneyText(d.housingCosts)],['Unterhalt/Haushalt',d.dependants]])}<p><b>Begründung:</b><br>${esc(d.reason||'—')}</p><h2>Unterlagen</h2>${checkedAttachments(d,[['deathCertificate','Sterbeurkunde'],['funeralInvoice','Bestattungsrechnung/Kostenvoranschlag'],['income','Einkommensnachweise'],['assets','Vermögensnachweise'],['estate','Nachlassübersicht'],['insurance','Versicherungsleistungen'],['obligation','Nachweis der Kostentragungspflicht']])}`;
  return `${header}${body}<div class="signature"><div>Ort, Datum</div><div>Unterschrift</div></div><footer>${esc(def.officialForm)} · Daten lokal vorbereitet am ${new Date().toLocaleDateString('de-DE')}</footer></article>`;
}
async function shareApplicationSummary(){
  const def=APPLICATIONS[state.applicationTaskId];if(!def)return;
  const text=`${def.title}\n\nDie Antragsdaten wurden im Sterbefall Assistent Deutschland vorbereitet. Bitte für die Einreichung das offizielle Verfahren/Formular verwenden.`;
  if(navigator.share){try{await navigator.share({title:def.title,text});return}catch(e){if(e?.name==='AbortError')return}}
  try{await navigator.clipboard.writeText(text);toast('Zusammenfassung kopiert')}catch(e){toast('Teilen wird auf diesem Gerät nicht unterstützt')}
}
function generator(){const c=state.cases[0],deceased=c?state.persons.find(x=>x.id===c.personId):null,sender=activePerson()||state.persons.find(p=>p.relation==='self')||deceased;if(!deceased)return `<section class="screen">${appTop('Schreiben erstellen')}<div class="content"><div class="notice">Bitte zuerst einen Sterbefall anlegen.</div><button class="cta teal full mt10" onclick="go('case')">Sterbefall öffnen</button></div></section>`;return `<section class="screen">${appTop('Schreiben erstellen',`Falldaten von ${personName(deceased)}`)}<div class="content"><div class="form-card"><h3>Vorlage</h3>${selectField('Schreiben','template','death',['death|Mitteilung über Sterbefall','cancel|Kündigung wegen Todesfall','record|Bitte um schriftliche Bestätigung'])}${field('Empfänger / Organisation','recipient','')}${field('Vertrags- / Kundennummer','contractNo','')}<button class="cta teal full" onclick="updatePreview()">Vorschau aktualisieren</button></div><div class="section-title"><h2>Vorschau</h2><button onclick="window.print()">Drucken / PDF</button></div><div id="preview" class="preview">${esc(buildLetter('death','', '',deceased,c,sender))}</div><div class="notice mt10">Das Schreiben ist eine editierbare Organisationshilfe und keine rechtliche Einzelfallberatung.</div></div></section>`}
function buildLetter(type,recipient,contractNo,p,c,sender){const sx=sender?.profile||{},senderName=personName(sender),senderBlock=[senderName,sx.street,[sx.zip,sx.city].filter(Boolean).join(' ')].filter(Boolean).join('\n'),deathDate=fmtDate(c?.deathDate),birth=fmtDate(p.profile?.birthDate);let body='';if(type==='death')body=`hiermit teile ich Ihnen mit, dass ${personName(p)}${birth?`, geboren am ${birth}`:''}${deathDate?`, am ${deathDate}`:''} verstorben ist.\n\nBitte teilen Sie mir mit, welche Unterlagen Sie für die Bearbeitung benötigen.`;if(type==='cancel')body=`hiermit bitte ich um Beendigung des bestehenden Vertrags${contractNo?` mit der Nummer ${contractNo}`:''} aufgrund des Todes von ${personName(p)}${deathDate?` zum ${deathDate}`:''}.\n\nBitte bestätigen Sie die Bearbeitung schriftlich und informieren Sie mich über noch benötigte Nachweise.`;if(type==='record')body=`bezugnehmend auf den Sterbefall von ${personName(p)} bitte ich um eine schriftliche Bestätigung des Bearbeitungsstands und um Mitteilung, falls noch Unterlagen erforderlich sind.`;return `${senderBlock}\n\n${recipient||'[Empfänger]'}\n\nBetreff: ${type==='cancel'?'Vertrag wegen Todesfall':'Mitteilung Sterbefall'}\n\nSehr geehrte Damen und Herren,\n\n${body}\n\nMit freundlichen Grüßen\n\n${senderName}`}
function updatePreview(){const c=state.cases[0],p=c?state.persons.find(x=>x.id===c.personId):null,s=activePerson()||state.persons.find(x=>x.relation==='self')||p;if(!p)return;document.getElementById('preview').textContent=buildLetter(val('template')||'death',val('recipient'),val('contractNo'),p,c,s)}


function openOfficialPdf(key){state.officialPdfKey=key;go('official-pdf')}
function officialPdfScreen(){
 const p=activePerson();if(!p)return noPerson('Amtliches PDF');
 const key=state.officialPdfKey||'vorsorge',def=OFFICIAL_PDFS[key];if(!def)return noPerson('Amtliches PDF');
 return `<section class="screen">${appTop('Blanko-PDF',`Für ${personName(p)}`)}<div class="content">
 <div class="info-card"><div class="big-icon">📄</div><h2>${esc(def.title)}</h2><p>${esc(def.source)} · Vorlagenstand ${esc(def.stand)}</p></div>
 <div class="notice"><b>Offline & local first:</b> Die App verwendet bevorzugt die im App-Paket gespeicherte Blanko-PDF unter <code>${esc(def.local)}</code>. Personen- und Formulardaten verlassen den Browser nicht.</div>
 <div class="form-card mt16"><h3>Blanko-Vorlage aus der App</h3><p class="muted small">Die Blanko-PDF ist direkt im App-Paket enthalten und funktioniert auch ohne Internet.</p><button class="cta teal full" onclick="fillOfficialPdfBundled()">Blanko-PDF öffnen & automatisch befüllen</button><button class="cta ghost full mt10" onclick="openBundledBlank()">Blanko anzeigen</button></div>
 <div class="form-card"><h3>Vorlage prüfen / aktualisieren</h3><p class="muted small">Über die Quellen-Schaltfläche kann die aktuelle offizielle Information bzw. Originalvorlage kontrolliert werden.</p><button class="cta ghost full" onclick="window.open('${def.url}','_blank','noopener')">Quelle / Original prüfen ↗</button></div>
 <div class="form-card"><h3>Eigene Original-PDF verwenden</h3><div class="field"><label>PDF auswählen</label><input type="file" id="officialPdfFile" accept="application/pdf,.pdf"></div><button class="cta ghost full" onclick="fillOfficialPdfFromFile()">Ausgewählte PDF befüllen</button><button class="cta ghost full mt10" onclick="installTemplateFromFile()">Als lokale Blanko-Vorlage speichern</button></div>
 <div id="pdfStatus" class="pdf-status">Noch keine PDF verarbeitet.</div>
 </div></section>`
}
function openBundledBlank(){const def=OFFICIAL_PDFS[state.officialPdfKey||'vorsorge'];window.open(def.local,'_blank','noopener')}
async function installTemplateFromFile(){
 const key=state.officialPdfKey||'vorsorge',f=document.getElementById('officialPdfFile')?.files?.[0];
 if(!f){toast('Bitte zuerst eine PDF auswählen');return}
 if(f.type && f.type!=='application/pdf'){toast('Bitte eine PDF-Datei auswählen');return}
 const bytes=await f.arrayBuffer();
 await idbSet('templates',key,{name:f.name,bytes,installedAt:new Date().toISOString(),size:f.size});
 toast('Blanko-Vorlage lokal gespeichert');
 const status=document.getElementById('pdfStatus');if(status)status.innerHTML=`<b>Vorlage lokal installiert.</b><br>${esc(f.name)} · ${Math.round(f.size/1024)} KB`;
}
async function getInstalledTemplate(key){return await idbGet('templates',key)}
async function fillOfficialPdfBundled(){
 const key=state.officialPdfKey||'vorsorge',def=OFFICIAL_PDFS[key],status=document.getElementById('pdfStatus');
 try{
   if(status)status.textContent='Lokale Blanko-Vorlage wird geladen …';
   const installed=await getInstalledTemplate(key);
   if(installed?.bytes){await fillOfficialPdfBytes(installed.bytes,installed.name||def.title);return}
   const r=await fetch(def.local,{cache:'no-store'});if(!r.ok)throw new Error(`Lokale Vorlage fehlt (${r.status})`);
   await fillOfficialPdfBytes(await r.arrayBuffer(),def.title)
 } catch(e){if(status)status.innerHTML=`<b>Lokale Blanko-PDF konnte nicht geladen werden.</b><br>Datei: <code>${esc(def.local)}</code><br>Bitte prüfen, ob beim Upload auf GitHub auch der Ordner <b>forms</b> vollständig übernommen wurde.`}
}
async function ensurePdfLib(){
 if(window.PDFLib)return true;
 const status=document.getElementById('pdfStatus');if(status)status.textContent='PDF-Modul wird geladen …';
 return new Promise(resolve=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';sc.integrity='sha512-z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ==';sc.crossOrigin='anonymous';sc.onload=()=>resolve(!!window.PDFLib);sc.onerror=()=>resolve(false);document.head.appendChild(sc);});
}
function splitStreet(v=''){const m=String(v).trim().match(/^(.*?)(?:\s+(\d+[a-zA-Z]?[-\/]?\d*[a-zA-Z]?))?$/);return {street:(m?.[1]||v).trim(),house:(m?.[2]||'').trim()}}
function chosenAgent(p,key=state.docKey){const fd=p.documents?.[key]?.formData||{};let selected=null;if(key==='zvrP'&&p.zvr?.contactId)selected=resolveSelectedContact(p,p.zvr.contactId);if(!selected)selected=resolveSelectedContact(p,fd.contactId);if(selected)return {name:selected.name||'',role:selected.role||'',phone:selected.phone||'',email:selected.email||'',address:selected.address||'',birth:selected.birthDate||'',birthPlace:selected.birthPlace||'',salutation:selected.salutation||'',title:selected.title||'',birthName:selected.birthName||'',country:selected.country||'Deutschland',addressAddition:selected.addressAddition||''};const c=(p.contacts||[]).find(x=>x.isAgent)||(p.contacts||[])[0];if(c)return {name:c.name||'',role:c.role||'',phone:c.phone||'',email:c.email||'',address:c.address||'',birth:c.birthDate||'',birthPlace:c.birthPlace||'',salutation:c.salutation||'',title:c.title||'',birthName:c.birthName||'',country:c.country||'Deutschland',addressAddition:c.addressAddition||''};return {name:fd.agentName||'',role:fd.agentRole||'',phone:fd.agentPhone||'',email:fd.agentEmail||'',address:fd.agentAddress||'',birth:fd.agentBirth||'',birthPlace:fd.agentBirthPlace||'',salutation:'',title:'',birthName:'',country:'Deutschland',addressAddition:''}}
function semanticPdfData(key,p){
 const x=p.profile||{},fd=p.documents?.[key]?.formData||{},a=chosenAgent(p,key),st=splitStreet(x.street||''),ast=splitStreet(a.address||'');
 const an=(a.name||'').trim().split(/\s+/),aFirst=an.length>1?an.slice(0,-1).join(' '):'',aLast=an.length>1?an.at(-1):(a.name||'');
 let docDate='';if(key==='zvrP'){docDate=p.documents?.vorsorge?.date||p.documents?.betreuung?.date||p.documents?.patienten?.date||''}
 return {owner:{first:x.firstName||'',last:x.lastName||'',name:[x.firstName,x.lastName].filter(Boolean).join(' '),birth:x.birthDate||'',birthPlace:x.birthPlace||'',birthName:x.birthName||'',salutation:x.salutation||'',title:x.title||'',street:st.street,house:st.house,zip:x.zip||'',city:x.city||'',phone:x.phone||'',email:x.email||'',country:x.country||'Deutschland',addressAddition:x.addressAddition||'',address:[x.street,[x.zip,x.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),contact:[x.phone,x.email].filter(Boolean).join(' / ')},agent:{first:aFirst,last:aLast,name:a.name||'',birth:fd.agentBirth||a.birth||'',birthPlace:fd.agentBirthPlace||a.birthPlace||'',birthName:a.birthName||'',salutation:a.salutation||'',title:a.title||'',street:ast.street,house:ast.house,zip:'',city:'',phone:a.phone||'',email:a.email||'',country:a.country||'Deutschland',addressAddition:a.addressAddition||'',address:a.address||'',contact:[a.phone,a.email].filter(Boolean).join(' / ')},docDate,fd,zvr:p.zvr||{}};
}
function normFieldName(n=''){return String(n).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ')}
function pickTextValue(name,data,counters){
 const n=normFieldName(name),fd=data.fd||{},z=data.zvr||{};
 const has=(...xs)=>xs.some(x=>n.includes(x));
 // Eindeutige Felder der lokal eingebetteten, quellennahen Vorlagen.
 if(has('vollmachtgeber name anschrift'))return [data.owner.name,data.owner.address].filter(Boolean).join(', ');
 if(has('vollmachtgeber name'))return data.owner.name;
 if(has('vollmachtgeber geburtsdatum'))return data.owner.birth;
 if(has('vollmachtgeber geburtsort'))return data.owner.birthPlace;
 if(has('vollmachtgeber adresse'))return data.owner.address;
 if(has('vollmachtgeber kontakt'))return data.owner.contact;
 if(has('vorsorgender name'))return data.owner.name;
 if(has('vorsorgender geburtsdatum'))return data.owner.birth;
 if(has('vorsorgender geburtsort'))return data.owner.birthPlace;
 if(has('vorsorgender adresse'))return data.owner.address;
 if(has('vorsorgender kontakt'))return data.owner.contact;
 if(has('vorsorgender strasse'))return [data.owner.street,data.owner.house].filter(Boolean).join(' ');
 if(has('vorsorgender plz ort'))return [data.owner.zip,data.owner.city].filter(Boolean).join(' ');
 if(has('bevollmaechtigter name'))return data.agent.name||[data.agent.first,data.agent.last].filter(Boolean).join(' ');
 if(has('bevollmaechtigter geburtsdatum'))return data.agent.birth;
 if(has('bevollmaechtigter geburtsort'))return data.agent.birthPlace;
 if(has('bevollmaechtigter adresse'))return data.agent.address;
 if(has('bevollmaechtigter kontakt'))return data.agent.contact;
 if(has('bevollmaechtigter telefon'))return data.agent.phone;
 if(has('bank anschrift'))return fd.bankAddress||'';
 if(has('weitere regelungen'))return fd.vFurther||'';
 if(has('ausgeschlossene geschaefte'))return fd.vExcludedBusiness||'';
 if(has('organ ausnahmen'))return fd.organLimits||'';
 if(has('organ hinweise'))return fd.organNotes||'';
 if(has('patient situation own'))return fd.pSituationOwn||'';
 if(has('patient place'))return fd.pPlace||'';
 if(has('patient confidentiality'))return fd.pConfidentiality||'';
 if(has('patient directives'))return fd.pOtherDirectives||'';
 if(has('patient organ'))return fd.pOrgan||'';
 if(has('patient values'))return fd.values||'';
 // Betreuungsverfügung: drei getrennte Personen + vier Wunschfelder.
 for(const [tag,pre] of [['primary','ffBPrimary'],['fallback','ffBFallback'],['exclude','ffBExclude']]){
   if(n.startsWith(tag+' ')){
     if(has(' name'))return fd[pre+'Name']||'';
     if(has(' birth'))return [fmtDate(fd[pre+'Birth']),fd[pre+'BirthPlace']].filter(Boolean).join(' / ');
     if(has(' adresse'))return fd[pre+'Address']||'';
     if(has(' kontakt'))return fd[pre+'Contact']||'';
   }
 }
 const wm=n.match(/^wunsch (\d+)$/);if(wm)return fd['ffBWish'+wm[1]]||'';
 // ZVR-spezifische Daten.
 if(has('zvr datum vorsorge'))return data.docDate||'';
 if(has('zvr iban'))return z.iban||'';
 if(has('zvr kontoinhaber'))return z.accountHolder||data.owner.name;
 if(has('zvr einrichtung strasse'))return z.storageStreet||'';
 if(has('zvr einrichtung ort'))return z.storageCity||'';
 if(has('zvr einrichtung'))return z.storageInstitution||'';
 const agent=/bevoll|vertrauens|betreuer|vollmachtnehmer|agent/.test(n),person=agent?data.agent:data.owner;
 if(has('geburtsname'))return person.birthName||'';
 if(has('anrede'))return person.salutation||'';
 if(has('titel'))return person.title||'';
 if(has('adresszusatz'))return person.addressAddition||'';
 if(has('vorname'))return person.first||'';
 if(has('nachname','familienname'))return person.last||'';
 if((/\bname\b/.test(n)||n.endsWith(' name'))&&!has('vorname','geburtsname','kontoinhaber'))return person.name||[person.first,person.last].filter(Boolean).join(' ');
 if(has('geburtsdatum'))return person.birth||'';
 if(has('geburtsort'))return person.birthPlace||'';
 if(has('strasse','straße'))return person.street||'';
 if(has('hausnummer','hausnr'))return person.house||'';
 if(has('postleitzahl','plz'))return person.zip||'';
 if(/\bort\b/.test(n)&&!has('geburtsort','aufbewahrungsort'))return person.city||'';
 if(has('telefon','telefonnummer','rufnummer'))return person.phone||'';
 if(has('mail','email','e mail'))return person.email||'';
 if(has('land'))return person.country||'Deutschland';
 if(has('datum der vorsorge','datum vorsorge','vorsorgeverfugung'))return data.docDate||'';
 return '';
}
function checkboxWanted(key,name,data,p){
 const n=normFieldName(name),fd=data.fd||{},z=data.zvr||{};
 const yes=(v)=>v==='yes';
 if(key==='vorsorge'){
   const map=[['v health all',fd.vHealthAll],['v health risk',fd.vHealthRisk],['v records',fd.vRecords],['v detention',fd.vDetention],['v restriction',fd.vRestriction],['v forced treatment',fd.vForcedTreatment],['v hospital transfer',fd.vHospitalTransfer],['v residence',fd.vResidence],['v rental rights',fd.vRentalRights],['v new rental',fd.vNewRental],['v wbvg',fd.vWBVG],['v authorities',fd.vAuthorities],['v assets all',fd.vAssetsAll],['v asset dispose',fd.vAssetDispose],['v payments',fd.vPayments],['v debts',fd.vDebts],['v bank',fd.vBank],['v gifts',fd.vGifts],['v post',fd.vPost],['v court',fd.vCourt],['v sub power',fd.vSubPower],['v guardianship',fd.vGuardianship],['v after death',fd.vAfterDeath]];
   for(const [tag,v] of map)if(n.includes(tag)){if(n.endsWith(' no'))return v==='no';if(n.endsWith(' yes'))return yes(v);return yes(v)}
 }
 if(key==='patienten'){
   const direct=[['patient situation dying',fd.pSituationDying],['patient situation terminal',fd.pSituationTerminal],['patient situation brain',fd.pSituationBrain],['patient situation dementia',fd.pSituationDementia]];
   for(const [tag,v] of direct)if(n.includes(tag))return !!v;
   const two=(tag,v,aVals,bVals)=>n.includes(tag+' a')?aVals.includes(v):n.includes(tag+' b')?bVals.includes(v):false;
   if(two('patient life',fd.pLife,['all'],['omit']))return true;
   if(two('patient pain',fd.pPain,['clear'],['sedating']))return true;
   if(two('patient nutrition',fd.pNutrition,['continue'],['palliative','none']))return true;
   if(two('patient resuscitation',fd.pResuscitation,['yes'],['no']))return true;
   if(two('patient ventilation',fd.pVentilation,['yes'],['no']))return true;
   if(two('patient dialysis',fd.pDialysis,['yes'],['no']))return true;
   if(two('patient antibiotics',fd.pAntibiotics,['yes'],['palliative','no']))return true;
   if(two('patient blood',fd.pBlood,['yes'],['palliative','no']))return true;
 }
 if(key==='organe')for(const v of ['yesAll','yesExcept','yesOnly','no','delegate'])if(n.includes(normFieldName('organ '+v)))return fd.organDecision===v;
 if(key==='zvrP'){
   const vf=p.documents?.vorsorge?.formData||{};
   if(n.includes('zvr vorsorgevollmacht'))return isDocDone(p,'vorsorge');
   if(n.includes('zvr vermoegen'))return vf.vAssetsAll==='yes';
   if(n.includes('zvr gesundheit'))return vf.vHealthAll==='yes';
   if(n.includes('zvr 1829'))return vf.vHealthRisk==='yes';
   if(n.includes('zvr 1832'))return vf.vForcedTreatment==='yes'||vf.vHospitalTransfer==='yes';
   if(n.includes('zvr aufenthalt'))return vf.vResidence==='yes';
   if(n.includes('zvr 1831'))return vf.vDetention==='yes'||vf.vRestriction==='yes';
   if(n.includes('zvr betreuungsverfuegung'))return isDocDone(p,'betreuung');
   if(n.includes('zvr patientenverfuegung'))return isDocDone(p,'patienten');
   if(n.includes('zvr storage self'))return z.storageType==='self';
   if(n.includes('zvr storage trusted'))return z.storageType==='trusted';
   if(n.includes('zvr storage other'))return z.storageType==='other';
   if(n.includes('zvr storage facility'))return z.storageType==='facility';
   if(n.includes('zvr zahlung lastschrift'))return z.paymentMethod==='lastschrift';
   if(n.includes('zvr zahlung ueberweisung'))return z.paymentMethod==='ueberweisung';
   if(n.includes('zvr trust einzel'))return z.trustRole==='single';
   if(n.includes('zvr trust gesamt'))return z.trustRole==='joint';
   if(n.includes('zvr trust betreuer'))return z.trustGuardian===true;
 }
 return false;
}
async function fillOfficialPdfBytes(bytes,sourceName='Original-PDF'){
 const status=document.getElementById('pdfStatus');
 try{
  if(!await ensurePdfLib())throw new Error('PDF-Modul konnte nicht geladen werden. Bitte Internetverbindung prüfen.');
  const {PDFDocument}=window.PDFLib,pdf=await PDFDocument.load(bytes,{ignoreEncryption:true}),form=pdf.getForm(),fields=form.getFields(),p=activePerson(),key=state.officialPdfKey||'vorsorge',data=semanticPdfData(key,p),counters={name:0};
  let filled=0,checks=0,unknown=[];
  for(const f of fields){
   const name=f.getName();
   try{
    if(typeof f.setText==='function'){
      const v=pickTextValue(name,data,counters);if(v){f.setText(String(v));filled++}else unknown.push(name);
    } else if(typeof f.check==='function'){
      if(checkboxWanted(key,name,data,p)){f.check();checks++}
    }
   }catch(e){}
  }
  try{form.updateFieldAppearances()}catch(e){}
  const out=await pdf.save(),blob=new Blob([out],{type:'application/pdf'}),filename=`${key}-${(personName(p)||'person').replace(/[^a-z0-9äöüß]+/gi,'-')}-ausgefüllt.pdf`;state.lastPdf={blob,filename};
  if(status)status.innerHTML=`<b>Fertig.</b> ${filled} Textfelder und ${checks} Auswahlfelder wurden automatisch befüllt. ${unknown.length?`${unknown.length} Felder konnten nicht eindeutig zugeordnet werden und bleiben zur Kontrolle offen.`:'Alle erkannten Felder wurden verarbeitet.'}<div class="pdf-actions"><button class="cta teal" onclick="downloadLastPdf()">PDF herunterladen</button><button class="cta ghost" onclick="shareLastPdf()">Teilen / versenden</button></div><div class="small muted mt10">Auf Android kann im Teilen-Menü z. B. Google Drive gewählt werden, sofern verfügbar.</div>`;
 }catch(e){if(status)status.innerHTML=`<b>PDF konnte nicht verarbeitet werden.</b><br>${esc(e.message||String(e))}`;}
}
async function fillOfficialPdfFromWeb(){const def=OFFICIAL_PDFS[state.officialPdfKey||'vorsorge'],status=document.getElementById('pdfStatus');try{if(status)status.textContent='Amtliche Originalvorlage wird geladen …';const r=await fetch(def.url,{mode:'cors',cache:'no-store'});if(!r.ok)throw new Error(`Abruf fehlgeschlagen (${r.status})`);await fillOfficialPdfBytes(await r.arrayBuffer(),def.title)}catch(e){if(status)status.innerHTML=`<b>Direkter Abruf wurde vom Behördenserver oder Browser blockiert.</b><br>Bitte über „Original öffnen“ die PDF speichern und anschließend unten auswählen. Deine Daten wurden nicht übertragen.`}}
async function fillOfficialPdfFromFile(){const f=document.getElementById('officialPdfFile')?.files?.[0];if(!f){toast('Bitte zuerst eine PDF auswählen');return}await fillOfficialPdfBytes(await f.arrayBuffer(),f.name)}
function downloadLastPdf(){if(!state.lastPdf){toast('Bitte zuerst eine PDF erzeugen');return}const u=URL.createObjectURL(state.lastPdf.blob),a=document.createElement('a');a.href=u;a.download=state.lastPdf.filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),4000)}
async function shareLastPdf(){if(!state.lastPdf){toast('Bitte zuerst eine PDF erzeugen');return}const file=new File([state.lastPdf.blob],state.lastPdf.filename,{type:'application/pdf'});if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:state.lastPdf.filename,text:'Dokument aus Sterbefall Assistent Deutschland'});return}catch(e){if(e?.name==='AbortError')return}}downloadLastPdf();toast('Direktes Teilen nicht unterstützt – PDF wurde heruntergeladen')}


function openShare(scope='person'){
  const p=activePerson();if(!p){toast('Bitte zuerst eine Person auswählen');return}
  state.shareScope=scope;
  state.shareLink='';state.sharePin='';
  go('share');
}
function shareDocLabel(){return DOCS[state.docKey]?.title||'Dokument'}
function shareScreen(){
  const p=activePerson();if(!p)return noPerson('Daten weitergeben');
  const docMode=state.shareScope==='document';
  return `<section class="screen">${appTop('Daten weitergeben',docMode?shareDocLabel():personName(p))}<div class="content">
    <div class="info-card"><div class="big-icon">↗</div><h2>${docMode?'Ausgefüllte Formulardaten teilen':'Personendaten teilen'}</h2>
      <p>Die Empfängerin oder der Empfänger öffnet den Link in der PWA und kann die übertragenen Daten nach einer Vorschau lokal übernehmen.</p>
    </div>
    <div class="form-card"><h3>Was soll übertragen werden?</h3>
      ${docMode
        ? `<label class="checkline"><input type="checkbox" checked disabled> Stammdaten der Person</label>
           <label class="checkline"><input type="checkbox" checked disabled> ${esc(shareDocLabel())} – ausgefüllte Felder und Status</label>
           <label class="checkline"><input type="checkbox" id="shareContacts" checked> Vertrauens-/Kontaktpersonen</label>`
        : `<label class="checkline"><input type="checkbox" id="shareProfile" checked> Stammdaten</label>
           <label class="checkline"><input type="checkbox" id="shareContacts" checked> Vertrauens- und Notfallkontakte</label>
           <label class="checkline"><input type="checkbox" id="shareDocuments" checked> Dokumentstatus und ausgefüllte Formulare</label>
           <label class="checkline"><input type="checkbox" id="shareMedical"> Medizinische Angaben</label>
           <label class="checkline"><input type="checkbox" id="shareBestattung" checked> Bestattungswünsche</label>
           <label class="checkline"><input type="checkbox" id="shareDigital"> Digitaler Nachlass / Zugangshinweise</label>`}
      <div class="small muted mt10">Fotos, Scans, hochgeladene PDFs und andere große Dateianhänge werden nicht in den Link eingebettet.</div>
    </div>
    <div class="form-card"><h3>Schutz des Freigabelinks</h3>
      <label class="checkline"><input type="checkbox" id="shareEncrypted" checked onchange="toggleSharePin()"> Mit PIN verschlüsseln <b>(empfohlen)</b></label>
      <div id="sharePinWrap">
        <div class="two">${field('PIN (4–12 Zeichen)','sharePinInput',state.sharePin||'','password','PIN getrennt vom Link mitteilen.') }
        <div class="field"><label>&nbsp;</label><button class="cta ghost full" type="button" onclick="generateSharePin()">PIN erzeugen</button></div></div>
      </div>
      <div class="notice"><b>Datenschutz:</b> Der Datenteil wird nach dem <code>#</code> im Link gespeichert und deshalb nicht an GitHub Pages übertragen. E-Mail-Anbieter und jede Person, die den vollständigen Link erhält, können ihn jedoch sehen. Mit PIN ist der Inhalt verschlüsselt; die PIN sollte über einen anderen Weg mitgeteilt werden.</div>
    </div>
    <button class="cta teal full" onclick="createShareLink()">Freigabelink erzeugen</button>
    <div id="shareResult">${state.shareLink?shareResultHtml():''}</div>
  </div></section>`;
}
function toggleSharePin(){
  const w=document.getElementById('sharePinWrap'),on=checked('shareEncrypted');if(w)w.style.display=on?'block':'none';
}
function generateSharePin(){
  const n=crypto.getRandomValues(new Uint32Array(1))[0]%1000000;
  const pin=String(n).padStart(6,'0');state.sharePin=pin;setVal('sharePinInput',pin);
}
function stripAttachments(documents={}){
  const out={};
  for(const [k,v] of Object.entries(documents||{})){
    if(!v||typeof v!=='object'){out[k]=v;continue}
    const c={...v};delete c.attachments;out[k]=c;
  }
  return out;
}
function cleanContacts(list=[]){return list.map(c=>{const x={...c};delete x.dataUrl;return x})}
function buildSharePayload(){
  const p=activePerson(),docMode=state.shareScope==='document';
  const person={relation:p.relation};
  if(docMode){
    person.profile={...(p.profile||{})};
    person.contacts=checked('shareContacts')?cleanContacts(p.contacts||[]):[];
    person.documents={};
    const k=state.docKey||'vorsorge';
    const d=p.documents?.[k]||{};
    person.documents[k]={...d};delete person.documents[k].attachments;
    if(k==='bestattung')person.bestattung={...(p.bestattung||{})};
  }else{
    if(checked('shareProfile'))person.profile={...(p.profile||{})};
    if(checked('shareContacts'))person.contacts=cleanContacts(p.contacts||[]);
    if(checked('shareDocuments'))person.documents=stripAttachments(p.documents||{});
    if(checked('shareMedical'))person.medical={...(p.medical||{})};
    person.zvr={...(p.zvr||{})};
    if(checked('shareBestattung'))person.bestattung={...(p.bestattung||{})};
    if(checked('shareDigital'))person.digital={...(p.digital||{})};
  }
  return {app:'Sterbefall Assistent Deutschland',shareVersion:1,createdAt:new Date().toISOString(),scope:state.shareScope,docKey:docMode?(state.docKey||'vorsorge'):null,person};
}
function bytesToB64u(bytes){
  let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64uToBytes(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';
  const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;
}
async function compressShare(bytes){
  if(typeof CompressionStream==='undefined')return {flag:'r',bytes};
  try{
    const cs=new CompressionStream('gzip'),w=cs.writable.getWriter();w.write(bytes);w.close();
    return {flag:'g',bytes:new Uint8Array(await new Response(cs.readable).arrayBuffer())};
  }catch(e){return {flag:'r',bytes}}
}
async function decompressShare(flag,bytes){
  if(flag!=='g')return bytes;
  if(typeof DecompressionStream==='undefined')throw new Error('Dieser Browser kann den komprimierten Link nicht öffnen.');
  const ds=new DecompressionStream('gzip'),w=ds.writable.getWriter();w.write(bytes);w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}
async function deriveShareKey(pin,salt,usage){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,[usage]);
}
async function encodeSharePayload(payload,pin=''){
  const raw=new TextEncoder().encode(JSON.stringify(payload)),packed=await compressShare(raw);
  if(!pin)return `p.${packed.flag}.${bytesToB64u(packed.bytes)}`;
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveShareKey(pin,salt,'encrypt');
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,packed.bytes));
  return `e.${packed.flag}.${bytesToB64u(salt)}.${bytesToB64u(iv)}.${bytesToB64u(encrypted)}`;
}
async function decodeShareToken(token,pin=''){
  const parts=token.split('.');
  if(parts[0]==='p'){
    const bytes=await decompressShare(parts[1],b64uToBytes(parts.slice(2).join('.')));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  if(parts[0]==='e'){
    if(!pin)throw new Error('PIN_REQUIRED');
    const flag=parts[1],salt=b64uToBytes(parts[2]),iv=b64uToBytes(parts[3]),cipher=b64uToBytes(parts[4]);
    const key=await deriveShareKey(pin,salt,'decrypt');
    let plain;
    try{plain=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher))}
    catch(e){throw new Error('PIN_FALSCH')}
    plain=await decompressShare(flag,plain);
    return JSON.parse(new TextDecoder().decode(plain));
  }
  throw new Error('Ungültiger Freigabelink');
}
function shareBaseUrl(){return `${location.origin}${location.pathname}`}
async function createShareLink(){
  const encrypted=checked('shareEncrypted'),pin=val('sharePinInput');
  if(encrypted&&pin.length<4){toast('Bitte mindestens 4 Zeichen als PIN verwenden');return}
  const btn=event?.currentTarget;if(btn){btn.disabled=true;btn.textContent='Link wird erstellt …'}
  try{
    const token=await encodeSharePayload(buildSharePayload(),encrypted?pin:'');
    const link=`${shareBaseUrl()}#share=${token}`;
    if(link.length>45000){toast('Die Datenmenge ist für einen Link zu groß. Bitte weniger Bereiche auswählen.');return}
    state.shareLink=link;state.sharePin=encrypted?pin:'';
    const r=document.getElementById('shareResult');if(r)r.innerHTML=shareResultHtml();
  }catch(e){toast('Freigabelink konnte nicht erstellt werden')}
  finally{if(btn){btn.disabled=false;btn.textContent='Freigabelink erzeugen'}}
}
function shareResultHtml(){
  return `<div class="share-result mt16"><h3>Freigabelink fertig</h3>
    <div class="share-link-box">${esc(state.shareLink)}</div>
    ${state.sharePin?`<div class="pin-box"><span>PIN</span><b>${esc(state.sharePin)}</b><small>Bitte getrennt vom Link mitteilen.</small></div>`:''}
    <div class="share-actions">
      <button class="cta teal" onclick="emailShareLink()">✉ E-Mail erstellen</button>
      <button class="cta ghost" onclick="nativeShareLink()">↗ Teilen</button>
      <button class="cta ghost" onclick="copyShareLink()">Link kopieren</button>
    </div>
  </div>`;
}
function shareSubject(){const p=activePerson();return state.shareScope==='document'?`${shareDocLabel()} – Daten zur Übernahme`:`Vorsorgedaten von ${personName(p)}`}
function shareBody(){
  const pinNote=state.sharePin?'\n\nDie Daten sind mit einer PIN geschützt. Ich teile dir die PIN getrennt mit.':'';
  return `Ich habe Daten im Sterbefall Assistent Deutschland für dich vorbereitet.\n\nÖffne diesen Link:\n${state.shareLink}${pinNote}\n\nDie Daten werden erst nach deiner Bestätigung lokal in der PWA gespeichert.`;
}
function emailShareLink(){
  if(!state.shareLink){toast('Bitte zuerst einen Link erzeugen');return}
  const href=`mailto:?subject=${encodeURIComponent(shareSubject())}&body=${encodeURIComponent(shareBody())}`;
  location.href=href;
}
async function nativeShareLink(){
  if(!state.shareLink){toast('Bitte zuerst einen Link erzeugen');return}
  if(navigator.share){try{await navigator.share({title:shareSubject(),text:shareBody(),url:state.shareLink});return}catch(e){if(e?.name==='AbortError')return}}
  copyShareLink();
}
async function copyShareLink(){
  if(!state.shareLink)return;
  try{await navigator.clipboard.writeText(state.shareLink);toast('Link kopiert')}catch(e){toast('Link konnte nicht kopiert werden')}
}
function setVal(id,v){const el=document.getElementById(id);if(el)el.value=v??''}
async function detectSharedLink(){
  const m=location.hash.match(/^#share=(.+)$/);if(!m)return false;
  state.pendingShareToken=m[1];state.pendingShare=null;state.route='share-import';
  if(m[1].startsWith('p.')){
    try{state.pendingShare=await decodeShareToken(m[1],'')}catch(e){state.pendingShare={error:'Der Freigabelink konnte nicht gelesen werden.'}}
  }
  return true;
}
function sharedPersonName(payload){
  const x=payload?.person?.profile||{};return [x.firstName,x.lastName].filter(Boolean).join(' ')||'Übertragene Person';
}
function sharedSummary(payload){
  const p=payload?.person||{},docs=Object.keys(p.documents||{});
  const rows=[];
  if(p.profile)rows.push(['Stammdaten','enthalten']);
  if(p.contacts?.length)rows.push(['Kontakte',`${p.contacts.length}`]);
  if(docs.length)rows.push(['Dokumentdaten',docs.map(k=>DOCS[k]?.title||k).join(', ')]);
  if(p.medical)rows.push(['Medizinische Angaben','enthalten']);
  if(p.bestattung)rows.push(['Bestattungswünsche','enthalten']);
  if(p.digital)rows.push(['Digitaler Nachlass','enthalten']);
  return rows;
}
function shareImportScreen(){
  const token=state.pendingShareToken||'',encrypted=token.startsWith('e.');
  if(state.pendingShare?.error)return `<section class="screen">${appTop('Daten übernehmen')}<div class="content"><div class="notice">${esc(state.pendingShare.error)}</div><button class="cta ghost full" onclick="cancelSharedImport()">Zur App</button></div></section>`;
  if(!state.pendingShare && encrypted)return `<section class="screen">${appTop('Geschützte Daten übernehmen')}<div class="content">
    <div class="info-card"><div class="big-icon">🔐</div><h2>PIN erforderlich</h2><p>Der Link enthält verschlüsselte Vorsorgedaten. Die PIN sollte dir getrennt mitgeteilt worden sein.</p></div>
    <div class="form-card">${field('PIN','importSharePin','','password')}<button class="cta teal full" onclick="unlockSharedImport()">Daten entschlüsseln</button></div>
    <button class="cta ghost full" onclick="cancelSharedImport()">Abbrechen</button>
  </div></section>`;
  const d=state.pendingShare;if(!d)return '';
  const rows=sharedSummary(d);
  const match=findSharedPersonMatch(d.person);
  return `<section class="screen">${appTop('Daten übernehmen','Vor dem Import prüfen')}<div class="content">
    <div class="info-card"><div class="big-icon">📥</div><h2>${esc(sharedPersonName(d))}</h2><p>Diese Daten wurden über einen Freigabelink vorbereitet. Nichts wird automatisch übernommen.</p></div>
    <div class="form-card"><h3>Enthalten</h3>${rows.map(([a,b])=>`<div class="summary-row"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')||'<p>Keine importierbaren Daten gefunden.</p>'}</div>
    <div class="notice"><b>Keine Dateianhänge:</b> Fotos, Scans und hochgeladene PDFs werden über Freigabelinks nicht übertragen.</div>
    ${match?`<button class="cta teal full" onclick="importSharedPerson('merge')">Daten zu ${esc(personName(match))} ergänzen</button><button class="cta ghost full mt10" onclick="importSharedPerson('new')">Trotzdem als neue Person anlegen</button>`:`<button class="cta teal full" onclick="importSharedPerson('new')">Als neue Person übernehmen</button>`}
    <button class="cta ghost full mt10" onclick="cancelSharedImport()">Nicht übernehmen</button>
  </div></section>`;
}
async function unlockSharedImport(){
  const pin=val('importSharePin');if(!pin){toast('Bitte PIN eingeben');return}
  try{state.pendingShare=await decodeShareToken(state.pendingShareToken,pin);render()}
  catch(e){toast(e.message==='PIN_FALSCH'?'PIN ist falsch':'Daten konnten nicht entschlüsselt werden')}
}
function findSharedPersonMatch(sp){
  const x=sp?.profile||{};if(!x.firstName&&!x.lastName)return null;
  return state.persons.find(p=>{
    const y=p.profile||{};
    return (x.firstName||'').toLowerCase()===(y.firstName||'').toLowerCase() &&
           (x.lastName||'').toLowerCase()===(y.lastName||'').toLowerCase() &&
           (!x.birthDate||!y.birthDate||x.birthDate===y.birthDate);
  })||null;
}
function deepMergeShared(target,source){
  if(!source||typeof source!=='object')return target;
  for(const [k,v] of Object.entries(source)){
    if(v===undefined||v===null||v==='')continue;
    if(Array.isArray(v)){target[k]=v.map(x=>typeof x==='object'?{...x,id:x.id||uid('item')}:x);continue}
    if(typeof v==='object'){target[k]=deepMergeShared(target[k]&&typeof target[k]==='object'&&!Array.isArray(target[k])?target[k]:{},v);continue}
    target[k]=v;
  }
  return target;
}
async function importSharedPerson(mode='new'){
  const sp=state.pendingShare?.person;if(!sp){toast('Keine Daten vorhanden');return}
  let p;
  if(mode==='merge'){
    p=findSharedPersonMatch(sp);if(!p){toast('Passende Person nicht mehr gefunden');return}
    deepMergeShared(p,sp);
  }else{
    p=JSON.parse(JSON.stringify(sp));
    p.id=uid('person');
    p.contacts=(p.contacts||[]).map(c=>({...c,id:uid('contact')}));
    p=normalizePerson(p);
    state.persons.push(p);
  }
  state.activePersonId=p.id;await persistPersons();
  history.replaceState(null,'',shareBaseUrl());
  state.pendingShare=null;state.pendingShareToken=null;
  toast('Daten lokal übernommen');go('vorsorge-person');
}
function cancelSharedImport(){
  history.replaceState(null,'',shareBaseUrl());
  state.pendingShare=null;state.pendingShareToken=null;go(state.persons.length?'home':'welcome');
}

function backup(){return `<section class="screen">${appTop('Datensicherung','Local-first bleibt nur sicher, wenn es ein Backup gibt')}<div class="content"><div class="info-card"><div class="big-icon">💾</div><h2>Lokales Backup</h2><p>Exportiere regelmäßig eine Sicherungsdatei. Sie enthält persönliche und möglicherweise sensible Daten.</p></div><button class="cta teal full" onclick="exportData()">Backup exportieren</button><button class="cta ghost full mt10" onclick="openShare('person')">↗ Aktive Person per Link weitergeben</button><div class="form-card mt16"><h3>Backup wiederherstellen</h3><div class="field"><label>JSON-Sicherungsdatei</label><input type="file" id="importFile" accept="application/json,.json"></div><button class="cta ghost full" onclick="importData()">Backup importieren</button></div><div class="notice"><b>Sicherheit:</b> Die exportierte Datei ist in dieser Version noch nicht verschlüsselt. Bewahre sie geschützt auf. Eine passwortgeschützte verschlüsselte Sicherung ist für die nächste Ausbaustufe vorgesehen.</div></div></section>`}
function exportData(){const data={app:'Sterbefall Assistent Deutschland',version:6,exportedAt:new Date().toISOString(),persons:state.persons,cases:state.cases,settings:state.settings};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`sterbefall-assistent-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);toast('Backup erstellt')}
async function importData(){const f=document.getElementById('importFile')?.files?.[0];if(!f){toast('Bitte Backup-Datei auswählen');return}try{const data=JSON.parse(await f.text());if(!Array.isArray(data.persons))throw new Error('Ungültiges Backup');if(!confirm('Vorhandene lokale Daten durch dieses Backup ersetzen?'))return;state.persons=data.persons.map(normalizePerson);state.cases=Array.isArray(data.cases)?data.cases:[];state.settings=data.settings||state.settings;state.activePersonId=state.persons[0]?.id||null;await persistAll();toast('Backup wiederhergestellt');go('home')}catch(e){toast('Backup konnte nicht gelesen werden')}}

function val(id){return document.getElementById(id)?.value?.trim()||''}
function checked(id){return !!document.getElementById(id)?.checked}
async function persistPersons(){state.persons=state.persons.map(normalizePerson);await idbSet('persons','main',state.persons);await saveMeta()}
async function persistAll(){await persistPersons();await idbSet('cases','main',state.cases);await idbSet('settings','main',state.settings)}
async function saveMeta(){await idbSet('meta','main',{activePersonId:state.activePersonId,dataVersion:6})}
async function migrateLegacy(){let existing=await idbGet('persons','main');if(existing?.length){state.persons=existing.map(normalizePerson);return}const oldProfile=await idbGet('profile','main')||{},oldDocs=await idbGet('docs','main')||{};if(Object.keys(oldProfile).length||Object.keys(oldDocs).length){const p=normalizePerson({id:uid('person'),relation:'self',profile:{...oldProfile},documents:{...oldDocs},contacts:[]});if(oldProfile.emergencyName||oldProfile.emergencyPhone)p.contacts=[{id:uid('contact'),name:oldProfile.emergencyName||'',role:oldProfile.emergencyRelation||'',phone:oldProfile.emergencyPhone||'',isEmergency:true,isAgent:false}];delete p.profile.emergencyName;delete p.profile.emergencyRelation;delete p.profile.emergencyPhone;state.persons=[p];state.activePersonId=p.id;await persistPersons()}}
async function init(){db=await openDB();await migrateLegacy();if(!state.persons.length)state.persons=(await idbGet('persons','main')||[]).map(normalizePerson);const meta=await idbGet('meta','main')||{};state.activePersonId=meta.activePersonId||state.activePersonId||state.persons[0]?.id||null;state.cases=await idbGet('cases','main')||[];state.settings=await idbGet('settings','main')||state.settings;await detectSharedLink();render();if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}

window.toggleFormHelp=toggleFormHelp;
Object.assign(window,{openShare,toggleSharePin,generateSharePin,createShareLink,emailShareLink,nativeShareLink,copyShareLink,unlockSharedImport,importSharedPerson,cancelSharedImport,printEmergencyCard,shareEmergencyCardImage,downloadEmergencyCardImage,go,back,newPerson,editPerson,selectPerson,deletePerson,savePersonBasic,saveProfile,addContact,removeContact,applyTrustedPerson,openDoc,saveDocumentDetail,addDocumentAttachments,viewDocumentAttachment,shareDocumentAttachment,removeDocumentAttachment,openOfficial,openOfficialPdf,openBundledBlank,fillOfficialPdfBundled,installTemplateFromFile,fillOfficialPdfFromWeb,fillOfficialPdfFromFile,applyFormContact,saveFilledForm,refreshFormPreview,printFilledForm,shareCurrentDocumentInfo,downloadLastPdf,shareLastPdf,saveMedical,saveZvr,saveBestattung,saveDigital,saveCase,toggleCaseTask,updatePreview,exportData,importData});
window.addEventListener('DOMContentLoaded',init);
