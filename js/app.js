// js/app.js — shared utilities loaded on every page

// ── Toast ──────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = 'all .3s';
        setTimeout(() => toast.remove(), 320);
    }, duration);
}

// ── Modal helpers ──────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// Close modal on overlay click
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('show');
    }
});

// ── Sidebar toggle ─────────────────────────────────────────
function toggleDropdown(id) {
    const allMenus   = document.querySelectorAll('.sub-menu');
    const allArrows  = document.querySelectorAll('.dropdown-arrow');
    allMenus.forEach((m, i) => {
        if (m.id !== id + '-menu') {
            m.classList.remove('open');
            if (allArrows[i]) allArrows[i].classList.remove('rotate');
        }
    });
    const menu  = document.getElementById(id + '-menu');
    const arrow = document.getElementById(id + '-arrow');
    if (menu)  menu.classList.toggle('open');
    if (arrow) arrow.classList.toggle('rotate');
}

// Highlight active nav item by current page path
function setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.sub-menu-item, .nav-link').forEach(el => {
        const href = el.getAttribute('href');
        if (href && path.endsWith(href.replace(/^.*\//, ''))) {
            el.classList.add('active');
            // also open parent sub-menu
            const parent = el.closest('.sub-menu');
            if (parent) {
                parent.classList.add('open');
                const arrowId = parent.id.replace('-menu', '-arrow');
                const arrow = document.getElementById(arrowId);
                if (arrow) arrow.classList.add('rotate');
            }
        }
    });
}

// ── User dropdown ──────────────────────────────────────────
function toggleUserDropdown() {
    document.getElementById('userDropdown').classList.toggle('show');
}
document.addEventListener('click', e => {
    const ui = document.querySelector('.user-info');
    const dd = document.getElementById('userDropdown');
    if (ui && dd && !ui.contains(e.target)) dd.classList.remove('show');
});

// ── Logout modal ───────────────────────────────────────────
function logout() {
    openModal('logoutModal');
}

// ── Page loader ────────────────────────────────────────────
function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity .35s';
        setTimeout(() => loader.remove(), 380);
    }
}

// ── Format date ────────────────────────────────────────────
function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// Run on every page
document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
});

// ── SW message listener ────────────────────────────────────
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'RELOAD_NOW') {
            location.reload(true);
        }
    });
}
