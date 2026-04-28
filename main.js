/* ============================================================
   GONZAPP — Shared JavaScript
   ============================================================ */

// ---- Navbar scroll effect ----
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile hamburger ----
(function initMobileMenu() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    btn.classList.remove('open');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }));
})();

// ---- Scroll animations (IntersectionObserver) ----
(function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-up, .fade-in, .slide-left, .slide-right, .scale-in');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();

// ---- Animated counter ----
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1500;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target).toLocaleString('es-AR');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString('es-AR');
  };
  requestAnimationFrame(step);
}
(function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.counted) {
        e.target.dataset.counted = '1';
        animateCounter(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => io.observe(el));
})();

// ---- Tabs (login page / reusable) ----
function initTabs(containerSelector) {
  const containers = document.querySelectorAll(containerSelector);
  containers.forEach(container => {
    const tabs    = container.querySelectorAll('[data-tab]');
    const panels  = container.querySelectorAll('[data-panel]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = container.querySelector('[data-panel="' + tab.dataset.tab + '"]');
        if (target) target.classList.add('active');
      });
    });
  });
}
document.addEventListener('DOMContentLoaded', () => initTabs('.tabs-container'));

// ---- Favorite toggle ----
document.addEventListener('click', (e) => {
  const fav = e.target.closest('.listing-fav');
  if (!fav) return;
  e.preventDefault(); e.stopPropagation();
  fav.classList.toggle('active');
  const icon = fav.querySelector('i');
  if (icon) {
    icon.className = fav.classList.contains('active') ? 'fas fa-heart' : 'far fa-heart';
    fav.style.color = fav.classList.contains('active') ? 'var(--accent)' : '';
    fav.style.borderColor = fav.classList.contains('active') ? 'var(--accent)' : '';
  }
});

// ---- Toast notification ----
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// Add toast styles dynamically
(function addToastStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #1E293B; border: 1px solid rgba(124,58,237,0.3);
      color: #F1F5F9; padding: 14px 20px;
      border-radius: 12px; font-size: 0.9rem; font-weight: 500;
      display: flex; align-items: center; gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transform: translateY(20px); opacity: 0;
      transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      max-width: 340px;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast-success i { color: #10B981; }
    .toast-error i { color: #EF4444; }
    .toast-warning i { color: #F59E0B; }
  `;
  document.head.appendChild(style);
})();
