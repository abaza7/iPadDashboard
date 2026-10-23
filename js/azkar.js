/* v19.7 — Morning Azkar: native per-dhikr recordings with matching text; full reciter tracks unsynchronized. */
(function(){'use strict';
var entries = [
  'آية الكرسي: اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ.',
  'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ.',
  'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ.',
  'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ.',
  'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ.',
  'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.',
  'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا.',
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ.'
];
var items=entries.map(function(s,i){return {text:s,count:1,audio:'',id:i+1};});
var sources=[
 {id:'hisn',label:'Hisnul Muslim — per-dhikr audio (synchronized)'},
 {id:'mishary',label:'Mishary Alafasy — full recording (reading only)',url:'https://archive.org/download/makkah-live.-net-athkar-01/MakkahLive.Net_athkar_03.mp3'},
 {id:'fares',label:'Fares Abbad — full recording (reading only)',url:'https://archive.org/download/makkah-live.-net-athkar-01/MakkahLive.Net_athkar_05.mp3'},
 {id:'jibril',label:'Muhammad Jibril — full recording (reading only)',url:'https://archive.org/download/makkah-live.-net-athkar-01/MakkahLive.Net_athkar_07.mp3'}
];
var root=document,playing=false,paused=false,position=0,repeated=0,loaded=false,audio=new Audio(), activeUrl='',token=0;
audio.preload='none';
function el(id){return root.getElementById(id);}function n(tag,c,t){var e=root.createElement(tag);if(c)e.className=c;if(t)e.textContent=t;return e;}
var backdrop=n('div','az-overlay');backdrop.id='az-overlay';backdrop.hidden=true;
var card=n('div','az-card');backdrop.appendChild(card);
var heading=n('div','az-head'),headingLabel=n('h2','', 'أذكار الصباح — Morning Azkar');heading.appendChild(headingLabel);
var close=n('button','','Close');heading.appendChild(close);card.appendChild(heading);
var selector=n('select','az-audio-selector');sources.forEach(function(src){var op=n('option','',src.label);op.value=src.id;selector.appendChild(op);});
var hint=n('div','az-source-note','The Hisnul Muslim collection matches each recording to the displayed dhikr. Other reciters offer full-length recordings: text is readable but not time-synchronized.');card.appendChild(hint);
var list=n('div','az-entries');list.id='az-list';card.appendChild(list);
var controls=n('div','az-controls');card.appendChild(controls);controls.appendChild(selector);
var prev=n('button','','◀ Previous'),play=n('button','az-primary','▶ Play'),next=n('button','','Next'),stopBtn=n('button','','■ Stop');
[prev,play,next,stopBtn].forEach(function(x){controls.appendChild(x);});
var status=n('span','az-status','Choose a recording');controls.appendChild(status);
var schedule=n('label','','Play 10 min after Fajr (while dashboard is awake)'),check=n('input');check.type='checkbox';
try{check.checked=localStorage.getItem('dash_azkar_schedule')==='1';}catch(e){}
schedule.insertBefore(check,schedule.firstChild);schedule.style.cssText='padding:10px 22px;font:400 .82rem Jost,system-ui;display:flex;align-items:center;gap:9px';card.appendChild(schedule);
check.addEventListener('change',function(){try{localStorage.setItem('dash_azkar_schedule',check.checked?'1':'0');}catch(e){}});
var mini=n('div','az-mini');mini.hidden=true;var miniOpen=n('button','','Morning Azkar'),miniStop=n('button','','■ Stop');mini.appendChild(miniOpen);mini.appendChild(miniStop);
root.body.appendChild(backdrop);root.body.appendChild(mini);
function draw(){list.textContent='';items.forEach(function(item,i){var row=n('div','az-entry'+(playing&&selector.value==='hisn'&&position===i?' active':''),item.text);row.dir='rtl';row.appendChild(n('small','',(i+1)+' / '+items.length+(item.count>1?' · Repeat ×'+item.count:'')));
row.addEventListener('click',function(){stop();position=i;draw();});list.appendChild(row);});
play.textContent=playing&&!paused?'Ⅱ Pause':'▶ Play';mini.hidden=!playing;
status.textContent=(playing?(paused?'Paused':'Playing'):'Ready')+' · '+(selector.value==='hisn'?(position+1)+'/'+items.length:'Full recording');
if(playing&&selector.value==='hisn'&&!backdrop.hidden){var row=list.children[position];if(row)row.scrollIntoView({block:'nearest'});}}
function stop(){++token;audio.pause();playing=false;paused=false;repeated=0;draw();}
function conflict(){var q=el('qmStop');if(q&&el('qmini')&&!el('qmini').hidden)q.click();if(window.DashboardStopRadio)window.DashboardStopRadio();}
function selected(){return sources.filter(function(s){return s.id===selector.value;})[0];}
function playTrack(){if(!playing||paused)return;var src=selected(),target=src.id==='hisn'?(items[position]&&items[position].audio):src.url;
if(!target){status.textContent='Recording unavailable — try a different source';stop();status.textContent='Recording unavailable — try a different source';return;}
if(activeUrl!==target){audio.src=target;activeUrl=target;audio.load();}
var current=token;audio.play().then(function(){if(current===token)draw();}).catch(function(){if(current===token){stop();status.textContent='Could not play stream; check internet or select another source';}});draw();}
function start(){conflict();stop();playing=true;paused=false;draw();playTrack();}
audio.addEventListener('ended',function(){if(!playing)return;
if(selector.value!=='hisn'){stop();return;}
var count=Math.max(1,Math.min(100,+(items[position]&&items[position].count)||1));
if(++repeated<count){audio.currentTime=0;playTrack();return;}
repeated=0;if(position<items.length-1){position++;draw();playTrack();}else stop();});
audio.addEventListener('error',function(){if(playing){stop();status.textContent='Stream unavailable; select another source';}});
play.addEventListener('click',function(){if(!playing){start();return;}if(paused){paused=false;audio.play().catch(function(){stop();});draw();}else{paused=true;audio.pause();draw();}});
prev.addEventListener('click',function(){if(selector.value==='hisn'){stop();position=Math.max(0,position-1);start();}else{audio.currentTime=0;}});
next.addEventListener('click',function(){if(selector.value==='hisn'){stop();position=Math.min(items.length-1,position+1);start();}else{audio.currentTime=0;}});
stopBtn.addEventListener('click',stop);selector.addEventListener('change',function(){stop();position=0;draw();});
close.addEventListener('click',function(){backdrop.hidden=true;});backdrop.addEventListener('click',function(e){if(e.target===backdrop)backdrop.hidden=true;});
miniOpen.addEventListener('click',function(){backdrop.hidden=false;draw();});miniStop.addEventListener('click',stop);
el('azbtn').addEventListener('click',function(){backdrop.hidden=false;draw();});
// Load text and matching per-dhikr audio from a published Hisnul Muslim dataset.
// Content is handled as untrusted input, never injected as HTML.
var catalog='https://raw.githubusercontent.com/SalehGNUTUX/GT_HISNMUSLIM/main/hisnmuslim.json';
fetch(catalog).then(function(r){if(!r.ok)throw Error('catalog status '+r.status);return r.json();}).then(function(data){
 var chapters=Array.isArray(data)?data:(Array.isArray(data.data)?data.data:[]);
 var ch=chapters.filter(function(x){return x&&/أذكار الصباح/.test(x.category||'')&&Array.isArray(x.array);})[0];
 if(!ch||!ch.array.length)throw Error('Morning chapter missing');
 var converted=ch.array.filter(function(x){return x&&typeof x.text==='string'&&/^https:\/\//.test(x.audio||'');}).map(function(x,i){return {id:x.id||i+1,text:x.text,audio:x.audio,count:Math.max(1,Math.min(100,+x.count||1))};});
 if(!converted.length)throw Error('No individual recordings');items=converted;loaded=true;draw();
}).catch(function(){status.textContent='Recorded collection unavailable; reading text remains available';});
function checkSchedule(){if(!check.checked||playing||!window.DashboardTodayFajr)return;
var fajr=window.DashboardTodayFajr();if(!fajr)return;var target=fajr+600000,now=Date.now(),key='dash_azkar_last_schedule',today=new Date(target).toDateString();
try{if(now>=target&&now<target+120000&&localStorage.getItem(key)!==today){localStorage.setItem(key,today);start();}}catch(e){}
}
setInterval(checkSchedule,30000);setInterval(function(){var alert=el('alert');if(playing&&alert&&!alert.hidden)stop();},1000);
window.DashboardAzkar={stop:stop,play:function(){backdrop.hidden=false;start();},pause:function(){if(playing&&!paused)play.click();},open:function(){backdrop.hidden=false;draw();},isPlaying:function(){return playing;}};
draw();
})();
