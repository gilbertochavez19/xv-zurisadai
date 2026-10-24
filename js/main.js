(function(){
  document.body.classList.add('locked');
  /* ====== DATOS DEL EVENTO (editar aquí) ====== */
  var EVENT = { year:2026, month:11, day:14, hour:13, minute:0, tz:'-06:00' };
  var MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  var pad = function(n){ return String(n).padStart(2,'0'); };
  var target = Date.parse(EVENT.year+'-'+pad(EVENT.month)+'-'+pad(EVENT.day)+'T'+pad(EVENT.hour)+':'+pad(EVENT.minute)+':00'+EVENT.tz);

  /* ====== calendario ====== */
  (function(){
    var first = new Date(Date.UTC(EVENT.year, EVENT.month-1, 1)).getUTCDay();
    var days  = new Date(Date.UTC(EVENT.year, EVENT.month, 0)).getUTCDate();
    var h = '<h3>'+MESES[EVENT.month-1]+' '+EVENT.year+'</h3><div class="g">';
    'DLMMJVS'.split('').forEach(function(l){ h += '<b>'+l+'</b>'; });
    for (var i=0;i<first;i++) h += '<span></span>';
    for (var d=1; d<=days; d++) h += '<span'+(d===EVENT.day?' class="day"':'')+'>'+d+'</span>';
    document.getElementById('cal').innerHTML = h + '</div>';
  })();

  /* ====== cuenta regresiva ====== */
  var el = {d:cd('d'),h:cd('h'),m:cd('m'),s:cd('s')}; function cd(k){ return document.getElementById('cd-'+k); }
  function tick(){
    var diff = Math.max(0, target - Date.now()), s = Math.floor(diff/1000);
    el.d.textContent = pad(Math.floor(s/86400));
    el.h.textContent = pad(Math.floor(s%86400/3600));
    el.m.textContent = pad(Math.floor(s%3600/60));
    el.s.textContent = pad(s%60);
    if (diff === 0) document.getElementById('faltan').textContent = '¡ES HOY!';
  }
  tick(); setInterval(tick, 1000);

  /* ====== música ======
     Para cambiar la canción: pega aquí el link de YouTube de la canción (cualquier formato:
     youtube.com/watch?v=..., youtu.be/..., music.youtube.com/...). Si el primer video no deja
     incrustarse, se prueba automáticamente con los de BACKUP.                                  */
  var MUSIC_URL = 'https://www.youtube.com/watch?v=GPx4YTsZz_w';
  var BACKUP    = ['https://www.youtube.com/watch?v=-BjZmE2gtdo'];

  var pp = document.getElementById('pp'), mbtn = document.getElementById('mbtn');
  var prog = document.getElementById('prog'), tcur = document.getElementById('tcur'), tdur = document.getElementById('tdur'), bar = document.getElementById('bar');
  var fmt = function(t){ t = Math.floor(t||0); return Math.floor(t/60)+':'+pad(t%60); };
  function ytId(u){ var m = String(u||'').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : ''; }
  var ids = [MUSIC_URL].concat(BACKUP).map(ytId).filter(Boolean);
  var playing = false, wantPlay = false, yt = null, ytReady = false, idx = 0;

  function ui(){
    pp.classList.toggle('paused', !playing);
    mbtn.classList.toggle('muted', !playing);
    mbtn.classList.toggle('on', playing);
  }
  function cur(){ try{ return ytReady ? yt.getCurrentTime() : 0; }catch(e){ return 0; } }
  function dur(){ try{ return ytReady ? yt.getDuration() : 0; }catch(e){ return 0; } }
  function play(){ wantPlay = true; if (ytReady){ try{ yt.playVideo(); }catch(e){} } }
  function pause(){ wantPlay = false; if (ytReady){ try{ yt.pauseVideo(); }catch(e){} } }
  function toggle(){ playing ? pause() : play(); }          // el mismo comportamiento en el botón de arriba y en el play de la tarjeta
  function seek(t){ try{ if (ytReady) yt.seekTo(t, true); }catch(e){} }

  if (ids.length){
    window.onYouTubeIframeAPIReady = function(){
      yt = new YT.Player('yt', {
        width:'220', height:'220', videoId:ids[0],
        playerVars:{ playsinline:1, controls:0, disablekb:1, rel:0, modestbranding:1, loop:1, playlist:ids[0] },
        events:{
          onReady:function(){ ytReady = true; if (dur()) tdur.textContent = fmt(dur()); if (wantPlay) yt.playVideo(); },
          onStateChange:function(e){
            playing = (e.data === 1 || e.data === 3); ui();
            if (e.data === 1 && dur()) tdur.textContent = fmt(dur());
            if (e.data === 0 && wantPlay){ yt.seekTo(0); yt.playVideo(); }   // al terminar, vuelve a empezar
          },
          onError:function(){                              // video que no permite incrustarse: probar el siguiente
            if (idx < ids.length-1){ idx++; yt.loadVideoById(ids[idx]); if (!wantPlay) setTimeout(function(){ try{ yt.pauseVideo(); }catch(e){} }, 400); }
            else { playing = false; wantPlay = false; ui(); }
          }
        }
      });
    };
    var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; document.head.appendChild(s);
  }
  setInterval(function(){
    var d = dur(); if (!d || !isFinite(d)) return;
    prog.style.width = (cur()/d*100)+'%'; tcur.textContent = fmt(cur());
  }, 400);

  pp.addEventListener('click', toggle); mbtn.addEventListener('click', toggle);
  document.getElementById('prev').addEventListener('click', function(){ seek(0); });
  document.getElementById('next').addEventListener('click', function(){ seek(Math.min((dur()||0)-1, cur()+15)); });
  bar.addEventListener('click', function(e){
    var r = bar.getBoundingClientRect(), d = dur(); if (d) seek((e.clientX-r.left)/r.width*d);
  });
  document.getElementById('like').addEventListener('click', function(){ this.classList.toggle('on'); });
  var resume = false;
  document.addEventListener('visibilitychange', function(){
    if (document.hidden && playing){ pause(); resume = true; }
    else if (!document.hidden && resume){ resume = false; play(); }
  });

  /* ====== abrir invitación + revelado al hacer scroll ====== */
  var opened = false;
  function reveal(){
    var items = document.querySelectorAll('.rv');
    if (!('IntersectionObserver' in window)){ items.forEach(function(n){ n.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold:.05, rootMargin:'0px' });
    items.forEach(function(n){ io.observe(n); });
  }
  function open(){
    if (opened) return; opened = true;
    play(); ui();
    document.getElementById('cover').classList.add('gone');
    document.body.classList.add('opened'); document.body.classList.remove('locked');
    window.scrollTo(0,0);
    setTimeout(reveal, 450);
  }
  document.getElementById('open').addEventListener('click', open);
  ui();
})();
