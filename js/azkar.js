/* Morning Azkar v19.6. Phrase-synchronized browser speech; uploaded recordings show text unless cues are provided. */
(function () { 'use strict';
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
var doc=document, state={index:0,playing:false,paused:false,mode:'voice',token:0,cues:[],url:null,audio:null,blob:null}, synth=window.speechSynthesis;
function el(id){return doc.getElementById(id);} function node(tag,cl,txt){var n=doc.createElement(tag);if(cl)n.className=cl;if(txt)n.textContent=txt;return n;}
var overlay=node('div','az-overlay');overlay.id='az-overlay';overlay.hidden=true;
var card=node('div','az-card');overlay.appendChild(card);
var head=node('div','az-head');head.appendChild(node('h2','', '☀ أذكار الصباح — Morning Azkar'));
var close=node('button','', 'Close');head.appendChild(close);card.appendChild(head);
var list=node('div','az-entries');list.id='az-list';card.appendChild(list);
entries.forEach(function(txt,i){var row=node('div','az-entry',txt);row.id='az-entry-'+i;row.setAttribute('tabindex','0');row.addEventListener('click',function(){stop();state.index=i;render();});row.appendChild(node('small','',String(i+1)+' / '+entries.length));list.appendChild(row);});
var hint=node('div','az-hint','Voice mode reads each text entry aloud and highlights it. Uploaded MP3 uses exact highlighting only with a matching cue file.');card.appendChild(hint);
var controls=node('div','az-controls');card.appendChild(controls);
var mode=node('select');[['voice','Arabic device voice'],['file','Uploaded MP3']].forEach(function(pair){var o=node('option','',pair[1]);o.value=pair[0];mode.appendChild(o);});controls.appendChild(mode);
var file=node('input');file.type='file';file.accept='audio/*';file.setAttribute('aria-label','Upload Azkar audio');controls.appendChild(file);
var cues=node('input');cues.type='file';cues.accept='.json,application/json';cues.setAttribute('aria-label','Upload timing cues JSON');controls.appendChild(cues);
var prev=node('button','', '◀ Previous'), play=node('button','az-primary','▶ Play'),next=node('button','', 'Next'),stopBtn=node('button','', '■ Stop');
[prev,play,next,stopBtn].forEach(function(b){controls.appendChild(b);});
var status=node('span','az-status','Ready');controls.appendChild(status);
var scheduleLabel=node('label','', 'Play 10 min after Fajr (while dashboard is awake)');
var scheduleCheck=node('input');scheduleCheck.type='checkbox';scheduleCheck.checked=localStorage.getItem('dash_azkar_schedule')==='1';scheduleLabel.insertBefore(scheduleCheck,scheduleLabel.firstChild);card.appendChild(scheduleLabel);scheduleLabel.style.cssText='padding:10px 22px;font:400 .82rem system-ui;display:flex;align-items:center;gap:9px';
scheduleCheck.addEventListener('change',function(){try{localStorage.setItem('dash_azkar_schedule',scheduleCheck.checked?'1':'0');}catch(e){}});

var mini=node('div','az-mini');mini.id='az-mini';mini.hidden=true;var miniOpen=node('button','', '☀ Morning Azkar'),miniStop=node('button','', '■ Stop');mini.appendChild(miniOpen);mini.appendChild(miniStop);
doc.body.appendChild(overlay);doc.body.appendChild(mini);
function render(){for(var i=0;i<entries.length;i++){var row=el('az-entry-'+i);row.className='az-entry'+(i===state.index&&state.playing?' active':'');}play.textContent=state.playing&&!state.paused?'Ⅱ Pause':'▶ Play';status.textContent=(state.playing?(state.paused?'Paused':'Playing'):'Ready')+' · '+(state.index+1)+'/'+entries.length;mini.hidden=!state.playing;file.hidden=mode.value!=='file';cues.hidden=mode.value!=='file';if(state.playing){var active=el('az-entry-'+state.index);if(active&& !overlay.hidden)active.scrollIntoView({block:'nearest'});}}
function stop(){state.token++;if(synth){try{synth.cancel();}catch(e){}}if(state.audio){state.audio.pause();}state.playing=false;state.paused=false;render();}
function audioConflict(){// Existing players are stopped through their own user-facing controls where available.
 var qs=el('qmStop');if(qs&& !el('qmini').hidden) qs.click();
 // For radio the runtime keeps an internal player; v19.6 provides a stop hook there.
 if(window.DashboardStopRadio)window.DashboardStopRadio();
}
function speak(){var token=state.token; if(!state.playing || state.paused || state.mode!=='voice')return;
 if(!synth || !window.SpeechSynthesisUtterance){status.textContent='Arabic speech unavailable on this iPad';stop();return;}
 var u=new SpeechSynthesisUtterance(entries[state.index]);u.lang='ar-SA';u.rate=0.88;
 var voices=synth.getVoices();for(var k=0;k<voices.length;k++)if(/^ar([-_]|$)/i.test(voices[k].lang)){u.voice=voices[k];break;}
 u.onend=function(){if(token!==state.token||!state.playing||state.paused)return;if(state.index<entries.length-1){state.index++;render();speak();}else stop();};
 u.onerror=function(){if(token===state.token){status.textContent='Speech failed; choose an Arabic system voice or upload MP3';state.playing=false;render();}};
 try{synth.speak(u);}catch(e){stop();status.textContent='Audio could not start';}
}
function updateCue(){if(!state.audio||!state.playing||state.mode!=='file')return;
 var current=state.audio.currentTime;for(var i=0;i<state.cues.length;i++)if(current>=state.cues[i].start&&current<state.cues[i].end){if(state.index!==i){state.index=i;render();}break;}}
function start(){audioConflict();state.token++;state.playing=true;state.paused=false;state.mode=mode.value;
 if(state.mode==='voice'){if(state.audio)state.audio.pause();try{synth.cancel();}catch(e){}render();speak();}
 else{if(!state.audio||!state.url){stop();status.textContent='Please upload an MP3 first';return;}state.audio.currentTime=0;state.audio.play().catch(function(){stop();status.textContent='Tap Play to enable audio';});render();}}
play.addEventListener('click',function(){if(!state.playing){start();return;}if(state.paused){state.paused=false;if(state.mode==='voice')speak();else state.audio.play().catch(function(){});render();return;}state.paused=true;state.token++;if(state.mode==='voice')synth.cancel();else state.audio.pause();render();});
prev.addEventListener('click',function(){stop();state.index=Math.max(0,state.index-1);start();});next.addEventListener('click',function(){stop();state.index=Math.min(entries.length-1,state.index+1);start();});stopBtn.addEventListener('click',stop);
mode.addEventListener('change',function(){stop();render();});file.addEventListener('change',function(){if(state.url)URL.revokeObjectURL(state.url);state.blob=file.files&&file.files[0];if(!state.blob)return;state.url=URL.createObjectURL(state.blob);state.audio=new Audio(state.url);state.audio.addEventListener('timeupdate',updateCue);state.audio.addEventListener('ended',stop);status.textContent='Audio ready (text sync requires cues)';});
cues.addEventListener('change',function(){var f=cues.files&&cues.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var val=JSON.parse(r.result);if(!Array.isArray(val)||val.length!==entries.length)throw Error();var end=0;val.forEach(function(c){if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<end||c.end<=c.start)throw Error();end=c.end;});state.cues=val;status.textContent='Timed text synchronization loaded';}catch(e){state.cues=[];status.textContent='Invalid cues: expected one {start,end} entry per Azkar text';}};r.readAsText(f);});
close.addEventListener('click',function(){overlay.hidden=true;});overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.hidden=true;});miniOpen.addEventListener('click',function(){overlay.hidden=false;render();});miniStop.addEventListener('click',stop);
el('azbtn').addEventListener('click',function(){overlay.hidden=false;render();});
// Stop Azkar if adhan overlay becomes active; never interrupt adhan.
setInterval(function(){var alert=el('alert');if(state.playing&&alert&&!alert.hidden)stop();},1000);
function startFromRemote(){if(!overlay.hidden){start();}else{overlay.hidden=false;start();}}
function pauseFromRemote(){if(state.playing&&!state.paused)play.click();}
function checkSchedule(){if(!scheduleCheck.checked||state.playing||!window.DashboardTodayFajr)return;
 var fajr=window.DashboardTodayFajr();if(!fajr)return;var target=fajr+10*60000,now=Date.now();
 var key='dash_azkar_last_schedule',today=new Date(target).toDateString();
 if(now>=target&&now<target+120000&&localStorage.getItem(key)!==today){try{localStorage.setItem(key,today);}catch(e){} startFromRemote();}}
setInterval(checkSchedule,30000);
window.DashboardAzkar={stop:stop,play:startFromRemote,pause:pauseFromRemote,open:function(){overlay.hidden=false;render();},isPlaying:function(){return state.playing;}};
render();
})();
