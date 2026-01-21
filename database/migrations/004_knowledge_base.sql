-- Migration: Knowledge Base Tables
-- Created: 2025-12-14

-- ============================================================================
-- 1. USERS TABLE (Extended)
-- ============================================================================

-- Add columns to existing users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS wp_user_id BIGINT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_limit INTEGER DEFAULT 8;
ALTER TABLE users ADD COLUMN IF NOT EXISTS queries_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Create users table if doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_user_id BIGINT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  position TEXT DEFAULT '',
  role TEXT DEFAULT 'viewer', -- admin, editor, viewer
  daily_limit INTEGER DEFAULT 8,
  queries_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_wp_user_id ON users(wp_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 2. KNOWLEDGE BASE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  content_html TEXT NOT NULL,
  meta_description TEXT,

  -- Status & Versioning
  status TEXT DEFAULT 'draft', -- draft, published, archived
  version INTEGER DEFAULT 1,

  -- AI Preview
  preview_tested BOOLEAN DEFAULT FALSE,
  preview_score REAL DEFAULT 0,
  preview_feedback JSONB DEFAULT '{}',

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id),

  -- Embedding for RAG
  embedding VECTOR(1024),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kb_status ON knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_created_by ON knowledge_base(created_by);
CREATE INDEX IF NOT EXISTS idx_kb_created_at ON knowledge_base(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_updated_at ON knowledge_base(updated_at DESC);

-- Vector index for RAG
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON knowledge_base
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_kb_search ON knowledge_base
USING GIN(to_tsvector('indonesian', title || ' ' || content));

-- ============================================================================
-- 3. KNOWLEDGE BASE VERSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Snapshot of content at this version
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT NOT NULL,
  tags TEXT[],
  category TEXT,

  -- Change tracking
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_summary TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  UNIQUE(kb_id, version)
);

CREATE INDEX IF NOT EXISTS idx_kb_versions_kb_id ON knowledge_base_versions(kb_id);
CREATE INDEX IF NOT EXISTS idx_kb_versions_changed_at ON knowledge_base_versions(changed_at DESC);

-- ============================================================================
-- 4. KB ACTIVITY LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  kb_id UUID REFERENCES knowledge_base(id) ON DELETE SET NULL,

  -- Action tracking
  action TEXT NOT NULL, -- created, updated, deleted, published, unpublished, archived
  details JSONB DEFAULT '{}',

  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kb_activity_user_id ON kb_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_activity_kb_id ON kb_activity_log(kb_id);
CREATE INDEX IF NOT EXISTS idx_kb_activity_action ON kb_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_kb_activity_created_at ON kb_activity_log(created_at DESC);

-- ============================================================================
-- 5. KB PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS kb_permissions (
  id SERIAL PRIMARY KEY,
  role TEXT UNIQUE NOT NULL,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_edit_others BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_delete_others BOOLEAN DEFAULT FALSE,
  can_publish BOOLEAN DEFAULT FALSE,
  can_manage_categories BOOLEAN DEFAULT FALSE,
  can_manage_tags BOOLEAN DEFAULT FALSE,
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_import BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  can_manage_settings BOOLEAN DEFAULT FALSE
);

-- Insert default permissions
INSERT INTO kb_permissions (
  role, can_create, can_edit, can_edit_others, can_delete, can_delete_others,
  can_publish, can_manage_categories, can_manage_tags, can_manage_users,
  can_view_analytics, can_import, can_export, can_manage_settings
) VALUES
  ('admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
  ('editor', TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, FALSE),
  ('viewer', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE)
ON CONFLICT (role) DO NOTHING;

-- ============================================================================
-- 6. TRIGGERS FOR AUTO-VERSIONING
-- ============================================================================

-- Function to save version on update
CREATE OR REPLACE FUNCTION save_kb_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save version if content changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.content != NEW.content OR
    OLD.title != NEW.title OR
    OLD.tags != NEW.tags OR
    OLD.category != NEW.category
  )) THEN

    -- Insert version snapshot
    INSERT INTO knowledge_base_versions (
      kb_id, version, title, content, content_html, tags, category,
      changed_by, change_summary
    ) VALUES (
      NEW.id,
      OLD.version,
      OLD.title,
      OLD.content,
      OLD.content_html,
      OLD.tags,
      OLD.category,
      NEW.updated_by,
      COALESCE(NEW.metadata->>'change_summary', 'Auto-saved version')
    );

    -- Increment version number
    NEW.version = OLD.version + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS kb_versioning_trigger ON knowledge_base;
CREATE TRIGGER kb_versioning_trigger
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION save_kb_version();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS kb_update_timestamp ON knowledge_base;
CREATE TRIGGER kb_update_timestamp
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_updated_at();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_kb_activity()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  user_id_val UUID;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type = 'created';
    user_id_val = NEW.created_by;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status AND NEW.status = 'published' THEN
      action_type = 'published';
    ELSIF OLD.status != NEW.status AND NEW.status = 'archived' THEN
      action_type = 'archived';
    ELSE
      action_type = 'updated';
    END IF;
    user_id_val = NEW.updated_by;
  ELSIF TG_OP = 'DELETE' THEN
    action_type = 'deleted';
    user_id_val = OLD.updated_by;
  END IF;

  -- Insert activity log
  INSERT INTO kb_activity_log (user_id, kb_id, action, details)
  VALUES (
    user_id_val,
    COALESCE(NEW.id, OLD.id),
    action_type,
    jsonb_build_object(
      'title', COALESCE(NEW.title, OLD.title),
      'status', COALESCE(NEW.status, OLD.status)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for activity logging
DROP TRIGGER IF EXISTS kb_activity_trigger ON knowledge_base;
CREATE TRIGGER kb_activity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION log_kb_activity();

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_kb_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  final_slug := base_slug;

  -- Check for uniqueness, append number if needed
  WHILE EXISTS (SELECT 1 FROM knowledge_base WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. SEED DATA (Optional - for testing)
-- ============================================================================

-- Create a test admin user (only if no users exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users LIMIT 1) THEN
    INSERT INTO users (email, name, role, daily_limit) VALUES
      ('admin@bajaringan.com', 'Admin Bajaringan', 'admin', 50);
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
SELECT 'knowledge_base' as table_name, count(*) as row_count FROM knowledge_base
UNION ALL
SELECT 'knowledge_base_versions', count(*) FROM knowledge_base_versions
UNION ALL
SELECT 'kb_activity_log', count(*) FROM kb_activity_log
UNION ALL
SELECT 'kb_permissions', count(*) FROM kb_permissions;
