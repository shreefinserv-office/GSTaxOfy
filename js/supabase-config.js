// js/supabase-config.js
// ─────────────────────────────────────────────
// REPLACE these two values with your own from:
// Supabase Dashboard → Project Settings → API
// ─────────────────────────────────────────────

const SUPABASE_URL     = 'https://ghpgwnygnvawikhjybvq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGd3bnlnbnZhd2lraGp5YnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTE1MjksImV4cCI6MjA5NjcyNzUyOX0.Jz7q4j8uM3CPQsAQrDLusmC68tgDOmhfaOZVv49OIHw';

// ─────────────────────────────────────────────
// BASE PATH — for GitHub Pages hosting
//
// Set this to your GitHub Pages repo name:
//   e.g. if hosted at  https://username.github.io/GStaxOfy/
//   set BASE = '/GStaxOfy'
//
// For local development (Live Server / python -m http.server):
//   set BASE = ''
// ─────────────────────────────────────────────
const BASE = '/GSTaxOfy';   // ← change to '' for local dev

// Supabase JS v2 client
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

// ─────────────────────────────────────────────
// Navigation helper — use this everywhere
// instead of hardcoded paths
// ─────────────────────────────────────────────
const ROUTES = {
    login:          () => BASE + '/index.html',
    dashboard:      () => BASE + '/pages/dashboard.html',
    changePassword: () => BASE + '/pages/change-password.html',
    auditLog:       () => BASE + '/pages/audit-log.html',
    firmDetails:    () => BASE + '/pages/Masters/firm-details.html',
    users:          () => BASE + '/pages/Masters/users.html',
    clients:        () => BASE + '/pages/Masters/clients.html',
    services:       () => BASE + '/pages/Masters/services.html',
    backup:         () => BASE + '/pages/Masters/backup.html',
    createTask:     () => BASE + '/pages/Tasks/create-task.html',
    manageTasks:    () => BASE + '/pages/Tasks/manage-tasks.html',
    generateInvoice:() => BASE + '/pages/Invoices/generate.html',
    invoiceList:    () => BASE + '/pages/Invoices/list.html',
    generateReceipt:() => BASE + '/pages/Receipts/generate.html',
    receiptList:    () => BASE + '/pages/Receipts/list.html',
    accountLedger:  () => BASE + '/pages/Reports/account-ledger.html',
    workLog:        () => BASE + '/pages/Reports/work-log.html',
    receivables:    () => BASE + '/pages/Reports/receivables.html',
    profitability:  () => BASE + '/pages/Reports/profitability.html',
    itClients:      () => BASE + '/pages/ITax/it-clients.html',
};

function goTo(route) { window.location.href = route; }

// ─────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────
async function getCurrentUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    return user;
}

async function getCurrentProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data } = await _supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    return data;
}

// Guard: call at top of every protected page
async function requireAuth(allowedRoles = null) {
    const user = await getCurrentUser();
    if (!user) {
        window.location.href = ROUTES.login();
        return null;
    }
    const profile = await getCurrentProfile();
    if (!profile || !profile.is_active) {
        await _supabase.auth.signOut();
        window.location.href = ROUTES.login();
        return null;
    }
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
        alert('Access denied. Insufficient permissions.');
        window.location.href = ROUTES.dashboard();
        return null;
    }
    return profile;
}

// ─────────────────────────────────────────────
// Audit log helper
// ─────────────────────────────────────────────
async function logAudit(action, tableName = null, recordId = null, oldData = null, newData = null) {
    try {
        await _supabase.rpc('log_audit', {
            p_action:      action,
            p_table_name:  tableName,
            p_record_id:   String(recordId),
            p_old_data:    oldData,
            p_new_data:    newData
        });
    } catch (e) {
        console.warn('Audit log failed:', e.message);
    }
}

// ─────────────────────────────────────────────
// Populate header
// ─────────────────────────────────────────────
function populateHeader(profile) {
    const nameEl   = document.getElementById('headerUserName');
    const roleEl   = document.getElementById('headerUserRole');
    const avatarEl = document.getElementById('headerAvatar');
    if (nameEl)   nameEl.textContent   = profile.full_name;
    if (roleEl)   roleEl.textContent   = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
    if (avatarEl) avatarEl.textContent = profile.full_name.charAt(0).toUpperCase();
}

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────
async function confirmLogout() {
    await logAudit('LOGOUT');
    await _supabase.auth.signOut();
    window.location.href = ROUTES.login();
}