# GStaxOfy — CA Firm Management System

A full-featured CA firm management web app built with **Vanilla JS + Supabase**.  
Hosted on **GitHub Pages**. No build step, no framework, no server needed.

## 🚀 Live Demo
> `https://<your-username>.github.io/GStaxOfy/`

---

## ✅ Features
- 🔐 Supabase Auth login (email + password)
- 👥 Role-based access: Master / Manager / Staff / Intern
- 🔑 Change Password + Forgot Password (email reset)
- 🏢 Firm Details management
- 👤 Full User CRUD with soft-delete + reason tracking
- 📋 Audit Log — every action tracked with before/after data
- 📊 Dashboard with recent activity
- 📁 Tasks, Invoices, Receipts, Reports (structure ready)

---

## ⚙️ Setup

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/GStaxOfy.git
cd GStaxOfy
```

### 2. Configure Supabase
Open `js/supabase-config.js` and fill in:
```js
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
const BASE              = '/GStaxOfy';  // your repo name
```

### 3. Run the SQL schema
Copy `supabase-setup.sql` → paste in Supabase SQL Editor → Run.

### 4. Create the Master user
See `SETUP-GUIDE.html` → Step 4 for full instructions.

### 5. Enable GitHub Pages
Repo Settings → Pages → Source: **main branch / root** → Save.

---

## 📁 Project Structure
```
GStaxOfy/
├── index.html                  ← Login page
├── supabase-setup.sql          ← Run once in Supabase SQL Editor
├── SETUP-GUIDE.html            ← Full setup guide
├── .nojekyll                   ← Required for GitHub Pages
├── css/
│   └── style.css
├── js/
│   ├── supabase-config.js      ← ⚠️ Edit: add your keys + BASE path
│   ├── app.js
│   ├── layout.js
│   └── sidebar.js
└── pages/
    ├── dashboard.html
    ├── change-password.html
    ├── audit-log.html
    ├── Masters/
    │   ├── firm-details.html
    │   ├── users.html
    │   ├── clients.html
    │   └── services.html
    ├── Tasks/
    ├── Invoices/
    ├── Receipts/
    └── Reports/
```

---

## 🛠️ Local Development

```bash
# Option A — Python
python -m http.server 5500

# Option B — Node
npx serve . -p 5500
```

For local dev, set `BASE = ''` in `js/supabase-config.js`.

---

## 🔒 Security
- All DB access protected by Supabase Row Level Security (RLS)
- Master role required for firm edits, user management, audit log
- Soft-delete only — no user data permanently lost
- Full audit trail of every write operation
