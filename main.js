/* ============================================================
   AUTOZONA — main.js
   Shared JavaScript for all pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initCounters();
  initTabs();
  initFavorites();
  initTooltips();
});

/* ---- Navbar scroll effect ---- */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const update = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('transparent');
    } else {
      navbar.classList.remove('scrolled');
      if (navbar.dataset.transparent === 'true') navbar.classList.add('transparent');
    }
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---- Mobile menu ---- */
function initMobileMenu() {
  const btn  = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ---- IntersectionObserver scroll animations ---- */
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-up, .fade-in, .slide-left, .slide-right, .scale-in');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

/* ---- Animated counters ---- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
}

function animateCounter(el) {
  const target  = parseInt(el.dataset.count, 10);
  const suffix  = el.dataset.suffix || '';
  const prefix  = el.dataset.prefix || '';
  const duration = 1600;
  const step     = 16;
  const steps    = duration / step;
  let current    = 0;
  const inc      = target / steps;

  const timer = setInterval(() => {
    current += inc;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = prefix + Math.floor(current).toLocaleString('es-AR') + suffix;
  }, step);
}

/* ---- Tabs ---- */
function initTabs() {
  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const triggers = group.querySelectorAll('[data-tab]');
    const panels   = group.querySelectorAll('[data-tab-panel]');

    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const target = trigger.dataset.tab;
        triggers.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        trigger.classList.add('active');
        const panel = group.querySelector(`[data-tab-panel="${target}"]`);
        if (panel) panel.classList.add('active');
      });
    });
  });
}

/* ---- Favorites toggle ---- */
function initFavorites() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.listing-fav');
    if (!btn) return;
    e.preventDefault();
    const icon = btn.querySelector('i');
    const isActive = btn.classList.toggle('active');
    if (icon) {
      icon.className = isActive ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    }
    const msg = isActive ? 'Guardado en favoritos' : 'Eliminado de favoritos';
    showToast(msg, isActive ? 'success' : 'info');
  });
}

/* ---- Tooltips (title attr) ---- */
function initTooltips() {
  // Handled by CSS title attribute — placeholder for custom tooltips
}

/* ---- Toast notifications ---- */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      display:flex; flex-direction:column; gap:10px; pointer-events:none;
    `;
    document.body.appendChild(container);
  }

  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const colors = { success: '#16A34A', error: '#DC2626', warning: '#D97706', info: '#1563FF' };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#fff; border:1px solid #E2E8F0; border-left:3px solid ${colors[type] || colors.info};
    border-radius:10px; padding:12px 18px; box-shadow:0 4px 16px rgba(0,0,0,0.12);
    display:flex; align-items:center; gap:10px; pointer-events:auto;
    font-family:Inter,sans-serif; font-size:0.88rem; color:#1E293B; font-weight:500;
    animation:fade-in-up 0.3s ease; max-width:320px;
  `;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" style="color:${colors[type] || colors.info};flex-shrink:0"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(16px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---- Gallery (detail page) ---- */
function initGallery() {
  const main   = document.querySelector('.gallery-main img');
  const thumbs = document.querySelectorAll('.gallery-thumb');
  const prev   = document.querySelector('.gallery-prev');
  const next   = document.querySelector('.gallery-next');
  if (!main || !thumbs.length) return;

  let current = 0;

  function go(i) {
    thumbs[current].classList.remove('active');
    current = (i + thumbs.length) % thumbs.length;
    thumbs[current].classList.add('active');
    main.style.opacity = '0';
    setTimeout(() => {
      main.src = thumbs[current].querySelector('img').src;
      main.style.opacity = '1';
    }, 180);
  }

  thumbs.forEach((t, i) => t.addEventListener('click', () => go(i)));
  if (prev) prev.addEventListener('click', () => go(current - 1));
  if (next) next.addEventListener('click', () => go(current + 1));

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') go(current - 1);
    if (e.key === 'ArrowRight') go(current + 1);
  });
}

/* ---- Dashboard sidebar ---- */
function initDashboardSidebar() {
  const items = document.querySelectorAll('.sidebar-item');
  const sections = document.querySelectorAll('.dash-section');

  items.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      items.forEach(i => i.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      const sec = document.getElementById(target);
      if (sec) sec.classList.add('active');
    });
  });
}

/* ---- Filter tags (listings page) ---- */
function initFilterTags() {
  document.querySelectorAll('.filter-tags .tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const group = tag.closest('.filter-tags');
      if (group.dataset.multi === 'true') {
        tag.classList.toggle('active');
      } else {
        group.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
      }
    });
  });
}

/* ---- Password toggle ---- */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

/* ---- Password strength ---- */
function checkPasswordStrength(value) {
  const bar   = document.querySelector('.strength-bar-fill');
  const label = document.querySelector('.strength-label');
  if (!bar) return;

  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;

  const levels = [
    { pct: '0%',   color: '#e2e8f0', text: '' },
    { pct: '25%',  color: '#DC2626', text: 'Muy débil' },
    { pct: '50%',  color: '#D97706', text: 'Débil' },
    { pct: '75%',  color: '#1563FF', text: 'Buena' },
    { pct: '100%', color: '#16A34A', text: 'Excelente' },
  ];
  const lvl = levels[score];
  bar.style.width  = lvl.pct;
  bar.style.background = lvl.color;
  if (label) { label.textContent = lvl.text; label.style.color = lvl.color; }
}
