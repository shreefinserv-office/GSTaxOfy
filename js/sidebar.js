// js/sidebar.js — inject sidebar HTML into #sidebar-placeholder
// Uses BASE and ROUTES from supabase-config.js (loaded before this file)

function renderSidebar(activePage) {
    const r = ROUTES;
    const html = `
    <nav class="nav-menu">
        <li class="nav-item">
            <a class="nav-link${activePage==='dashboard'?' active':''}" href="${r.dashboard()}">
                <i class="fas fa-tachometer-alt"></i><span>Dashboard</span>
            </a>
        </li>
        <li class="nav-item" data-role="master">
            <div class="nav-link" onclick="toggleDropdown('masters')">
                <i class="fas fa-cog"></i><span>Masters</span>
                <i class="fas fa-chevron-down dropdown-arrow" id="masters-arrow"></i>
            </div>
            <div class="sub-menu" id="masters-menu">
                <a class="sub-menu-item" href="${r.firmDetails()}"><i class="fas fa-building"></i>Firm Details</a>
                <a class="sub-menu-item" href="${r.users()}"><i class="fas fa-users"></i>Users</a>
                <a class="sub-menu-item" href="${r.clients()}"><i class="fas fa-user-tie"></i>Clients</a>
                <a class="sub-menu-item" href="${r.services()}"><i class="fas fa-list-check"></i>Services</a>
            </div>
        </li>
        <li class="nav-item">
            <div class="nav-link" onclick="toggleDropdown('tasks')">
                <i class="fas fa-tasks"></i><span>Tasks</span>
                <i class="fas fa-chevron-down dropdown-arrow" id="tasks-arrow"></i>
            </div>
            <div class="sub-menu" id="tasks-menu">
                <a class="sub-menu-item" href="${r.createTask()}"><i class="fas fa-plus-circle"></i>Create Task</a>
                <a class="sub-menu-item" href="${r.manageTasks()}"><i class="fas fa-list"></i>Manage Tasks</a>
            </div>
        </li>
        <li class="nav-item">
            <div class="nav-link" onclick="toggleDropdown('invoices')">
                <i class="fas fa-file-invoice"></i><span>Invoices</span>
                <i class="fas fa-chevron-down dropdown-arrow" id="invoices-arrow"></i>
            </div>
            <div class="sub-menu" id="invoices-menu">
                <a class="sub-menu-item" href="${r.generateInvoice()}"><i class="fas fa-plus-circle"></i>Generate Invoice</a>
                <a class="sub-menu-item" href="${r.invoiceList()}"><i class="fas fa-list"></i>All Invoices</a>
            </div>
        </li>
        <li class="nav-item">
            <div class="nav-link" onclick="toggleDropdown('receipts')">
                <i class="fas fa-receipt"></i><span>Receipts</span>
                <i class="fas fa-chevron-down dropdown-arrow" id="receipts-arrow"></i>
            </div>
            <div class="sub-menu" id="receipts-menu">
                <a class="sub-menu-item" href="${r.generateReceipt()}"><i class="fas fa-plus-circle"></i>Generate Receipt</a>
                <a class="sub-menu-item" href="${r.receiptList()}"><i class="fas fa-list"></i>All Receipts</a>
            </div>
        </li>
        <li class="nav-item">
            <div class="nav-link" onclick="toggleDropdown('reports')">
                <i class="fas fa-chart-bar"></i><span>Reports</span>
                <i class="fas fa-chevron-down dropdown-arrow" id="reports-arrow"></i>
            </div>
            <div class="sub-menu" id="reports-menu">
                <a class="sub-menu-item" href="${r.accountLedger()}"><i class="fas fa-book"></i>Account Ledger</a>
                <a class="sub-menu-item" href="${r.workLog()}"><i class="fas fa-clock"></i>Work Log</a>
                <a class="sub-menu-item" href="${r.receivables()}"><i class="fas fa-money-bill-wave"></i>Receivables</a>
                <a class="sub-menu-item" href="${r.profitability()}"><i class="fas fa-chart-line"></i>Profitability</a>
            </div>
        </li>
        <li class="nav-item" data-role="master">
            <a class="nav-link${activePage==='audit'?' active':''}" href="${r.auditLog()}">
                <i class="fas fa-history"></i><span>Audit Log</span>
            </a>
        </li>
    </nav>`;

    const placeholder = document.getElementById('sidebar-placeholder');
    if (placeholder) placeholder.innerHTML = html;
}
