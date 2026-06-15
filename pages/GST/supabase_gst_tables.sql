-- Run this in Supabase SQL Editor to create GST tables

-- gst_clients: stores GST credentials + GSTR types per client per FY+Month
CREATE TABLE IF NOT EXISTS gst_clients (
    id           BIGSERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    gstin        TEXT,
    fy           TEXT,          -- e.g. "2026-27"
    month        INTEGER,       -- 1=Jan … 12=Dec (GST filing month)
    gstr_types   JSONB,         -- [{type: "GSTR-1 (Regular Monthly)", status: "Pending"}, ...]
    status       TEXT,          -- overall computed status
    gst_password TEXT,          -- AES-256-GCM encrypted
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_gst_clients_client_id ON gst_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_gst_clients_fy_month  ON gst_clients(fy, month);

-- gst_documents: document checklist per client
CREATE TABLE IF NOT EXISTS gst_documents (
    id            BIGSERIAL PRIMARY KEY,
    client_id     BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    is_received   BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gst_docs_client_id ON gst_documents(client_id);

-- Also add gstin column to clients table if not exists
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gstin TEXT;

-- Add email column to user_profiles if not exists (fixes wrong email display in Users table)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
