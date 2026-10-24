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

  /* ====== música (Spotify) ======
     Para cambiar la canción: reemplaza el ID de la pista (lo que va después de /track/ en el link). */
  var TRACK = '1dGr1c8CrMLDpV6mPbImSI';

  var pp = document.getElementById('pp'), mbtn = document.getElementById('mbtn'), splink = document.getElementById('splink');
  var prog = document.getElementById('prog'), tcur = document.getElementById('tcur'), tdur = document.getElementById('tdur'), bar = document.getElementById('bar');
  var fmt = function(t){ t = Math.floor(t||0); return Math.floor(t/60)+':'+pad(t%60); };
  var playing = false, wantPlay = false, ctrl = null, failed = false, durMs = 0, posMs = 0;
  tdur.textContent = '0:30';

  function ui(){
    pp.classList.toggle('paused', !playing);
    mbtn.classList.toggle('muted', !playing);
    mbtn.classList.toggle('on', playing);
  }
  function fail(){ if (failed) return; failed = true; wantPlay = false; splink.hidden = false; }
  function play(){
    if (failed){ splink.hidden = false; return; }
    wantPlay = true; if (ctrl){ try{ ctrl.play(); }catch(e){} }
  }
  function pause(){ wantPlay = false; if (ctrl){ try{ ctrl.pause(); }catch(e){} } }
  function toggle(){
    if (failed){ var w = null; try{ w = window.open(splink.href, '_blank', 'noopener'); }catch(e){} if (!w) splink.hidden = false; return; }
    playing ? pause() : play();
  }

  window.onSpotifyIframeApiReady = function(API){
    API.createController(document.getElementById('sp'), { uri:'spotify:track:'+TRACK, width:'300', height:'80' }, function(c){
      ctrl = c;
      c.addListener('ready', function(){ if (wantPlay) c.play(); });
      c.addListener('playback_update', function(e){
        var d = e.data || {};
        playing = !d.isPaused; durMs = d.duration || durMs; posMs = d.position || 0;
        if (durMs){
          prog.style.width = Math.min(100, posMs/durMs*100)+'%';
          tcur.textContent = fmt(posMs/1000); tdur.textContent = fmt(durMs/1000);
        }
        if (d.isPaused && durMs && posMs >= durMs-400 && wantPlay){ c.restart(); }  // la vista previa dura 30 s: se repite
        ui();
      });
    });
  };
  var s = document.createElement('script'); s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
  s.onerror = fail; document.head.appendChild(s);
  setTimeout(function(){ if (!ctrl) fail(); }, 7000);

  pp.addEventListener('click', toggle); mbtn.addEventListener('click', toggle);
  document.getElementById('prev').addEventListener('click', function(){ if (ctrl) ctrl.seek(0); });
  document.getElementById('next').addEventListener('click', function(){ if (ctrl && durMs) ctrl.seek(Math.min(durMs/1000-1, posMs/1000+10)); });
  bar.addEventListener('click', function(e){
    var r = bar.getBoundingClientRect(); if (ctrl && durMs) ctrl.seek((e.clientX-r.left)/r.width*durMs/1000);
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
