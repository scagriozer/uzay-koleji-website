/* ── Dynamic Yellow Grid Canvas ──
   Full-page interactive grid with mouse-tracking glow.
   Shared across all Uzay Koleji pages.
   ────────────────────────────────────────────────────── */
(function () {
  var oldCanvas = document.querySelector('canvas.hero__bg-grid');
  if (oldCanvas) oldCanvas.style.display = 'none';

  var canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:-1;';
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var CELL   = 60;
  var GLOW_R = 300;
  var LERP   = 0.11;
  var LERP_A = 0.10;

  var W = 0, H = 0;
  var mx = 0, my = 0, tmx = 0, tmy = 0;
  var glowAlpha = 0;
  var mouseActive = false;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var gc = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(1, 1)
    : document.createElement('canvas');
  var gCtx = gc.getContext('2d');

  function buildPath(c) {
    var ox = (window.scrollX || 0) % CELL;
    var oy = (window.scrollY || 0) % CELL;
    c.beginPath();
    for (var y = -oy; y <= H + CELL; y += CELL) {
      var ly = Math.round(y) + 0.5;
      c.moveTo(0, ly); c.lineTo(W, ly);
    }
    for (var x = -ox; x <= W + CELL; x += CELL) {
      var lx = Math.round(x) + 0.5;
      c.moveTo(lx, 0); c.lineTo(lx, H);
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    buildPath(ctx);
    ctx.strokeStyle = 'rgba(18,40,76,0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (prefersReduced || glowAlpha < 0.005) return;

    gCtx.clearRect(0, 0, W, H);
    buildPath(gCtx);
    gCtx.strokeStyle = 'rgba(255,255,255,0.95)';
    gCtx.lineWidth = 1.5;
    gCtx.stroke();

    gCtx.globalCompositeOperation = 'screen';
    gCtx.strokeStyle = 'rgba(106,170,227,0.70)';
    gCtx.stroke();
    gCtx.globalCompositeOperation = 'source-over';

    gCtx.globalCompositeOperation = 'destination-in';
    var grd = gCtx.createRadialGradient(mx, my, 0, mx, my, GLOW_R);
    grd.addColorStop(0,    'rgba(0,0,0,1)');
    grd.addColorStop(0.40, 'rgba(0,0,0,0.85)');
    grd.addColorStop(0.70, 'rgba(0,0,0,0.40)');
    grd.addColorStop(1,    'rgba(0,0,0,0)');
    gCtx.fillStyle = grd;
    gCtx.fillRect(0, 0, W, H);
    gCtx.globalCompositeOperation = 'source-over';

    ctx.globalAlpha = glowAlpha;
    ctx.drawImage(gc, 0, 0);
    ctx.globalAlpha = 1;
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    gc.width = W; gc.height = H;
  }

  function tick() {
    var dirty = false;
    if (mouseActive) {
      var nx = mx + (tmx - mx) * LERP;
      var ny = my + (tmy - my) * LERP;
      if (Math.abs(nx - mx) > 0.15 || Math.abs(ny - my) > 0.15) {
        mx = nx; my = ny; dirty = true;
      }
    }
    var ta = mouseActive ? 1 : 0;
    var na = glowAlpha + (ta - glowAlpha) * LERP_A;
    if (Math.abs(na - glowAlpha) > 0.004) { glowAlpha = na; dirty = true; }
    if (dirty) drawFrame();
    requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', function (e) {
    tmx = e.clientX; tmy = e.clientY;
    if (!mouseActive) { mx = tmx; my = tmy; }
    mouseActive = true;
  }, { passive: true });

  document.addEventListener('mouseleave', function () { mouseActive = false; });
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', function () { drawFrame(); }, { passive: true });

  function init() { resize(); tick(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
