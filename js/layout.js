// js/layout.js — injects the shared sidebar + header HTML, then calls requireAuth

async function initLayout(allowedRoles = null) {
    // Inject loader
    document.body.insertAdjacentHTML('afterbegin', `
        <div id="pageLoader" class="page-loader">
            <div class="spinner"></div>
            <span>Loading GStaxOfy…</span>
        </div>
    `);

    // Auth check
    const profile = await requireAuth(allowedRoles);
    if (!profile) return null;

    // Toast container
    document.body.insertAdjacentHTML('beforeend', '<div id="toast-container"></div>');

    // Populate header
    populateHeader(profile);

    // Store profile in sessionStorage for quick access within the page
    sessionStorage.setItem('gst_profile', JSON.stringify(profile));

    // Hide master-only elements if not master
    if (profile.role !== 'master') {
        document.querySelectorAll('[data-role="master"]').forEach(el => el.remove());
    }

    hideLoader();
    return profile;
}

// Retrieve cached profile without an async call
function getCachedProfile() {
    const raw = sessionStorage.getItem('gst_profile');
    return raw ? JSON.parse(raw) : null;
}
