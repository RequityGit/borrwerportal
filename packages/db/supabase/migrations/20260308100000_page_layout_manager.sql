-- ============================================================
-- PAGE LAYOUT MANAGER SCHEMA
-- ============================================================

-- Enum for all layoutable object types
CREATE TYPE page_object_type AS ENUM (
  'contact',
  'company',
  'opportunity',
  'loan',
  'property',
  'investment',
  'borrower_profile',
  'investor_profile'
);

-- ============================================================
-- 1. page_layouts — One active layout per object type (+ optional role overrides)
-- ============================================================
CREATE TABLE page_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type page_object_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  role app_role DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active default layout per object_type (where role IS NULL)
CREATE UNIQUE INDEX idx_page_layouts_active_default
  ON page_layouts (object_type)
  WHERE is_active = true AND role IS NULL;

-- Only one active layout per object_type + role combo (where role IS NOT NULL)
CREATE UNIQUE INDEX idx_page_layouts_active_role
  ON page_layouts (object_type, role)
  WHERE is_active = true AND role IS NOT NULL;

-- ============================================================
-- 2. page_layout_sections — Ordered sections within a layout
-- ============================================================
CREATE TABLE page_layout_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT,
  column_layout TEXT DEFAULT '2-col'
    CHECK (column_layout IN ('1-col', '2-col', '3-col')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_collapsible BOOLEAN DEFAULT true,
  is_collapsed_default BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  tab_group TEXT DEFAULT NULL,
  span TEXT DEFAULT 'full'
    CHECK (span IN ('full', 'half')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(layout_id, section_key)
);

-- ============================================================
-- 3. page_layout_fields — Fields assigned to sections with ordering
-- ============================================================
CREATE TABLE page_layout_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES page_layout_sections(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label_override TEXT,
  column_position INTEGER DEFAULT 1
    CHECK (column_position BETWEEN 1 AND 3),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  is_read_only BOOLEAN DEFAULT false,
  span INTEGER DEFAULT 1
    CHECK (span BETWEEN 1 AND 3),
  display_format TEXT,
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(section_id, field_key)
);

-- ============================================================
-- 4. page_layout_tabs — Tab configuration for tabbed layouts
-- ============================================================
CREATE TABLE page_layout_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  tab_key TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  badge_field TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(layout_id, tab_key)
);

-- ============================================================
-- 5. page_layout_history — Audit trail for layout changes
-- ============================================================
CREATE TABLE page_layout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_id UUID NOT NULL REFERENCES page_layouts(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  change_type TEXT NOT NULL CHECK (change_type IN (
    'layout_created', 'layout_updated',
    'section_added', 'section_removed', 'section_reordered', 'section_updated',
    'field_added', 'field_removed', 'field_reordered', 'field_updated',
    'tab_added', 'tab_removed', 'tab_reordered'
  )),
  change_detail JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_pls_layout_id ON page_layout_sections(layout_id);
CREATE INDEX idx_pls_sort ON page_layout_sections(layout_id, sort_order);
CREATE INDEX idx_plf_section_id ON page_layout_fields(section_id);
CREATE INDEX idx_plf_sort ON page_layout_fields(section_id, sort_order);
CREATE INDEX idx_plt_layout_id ON page_layout_tabs(layout_id);
CREATE INDEX idx_plh_layout_id ON page_layout_history(layout_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE page_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_layout_history ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
CREATE POLICY "All users can read active layouts"
  ON page_layouts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All users can read sections"
  ON page_layout_sections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All users can read fields"
  ON page_layout_fields FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "All users can read tabs"
  ON page_layout_tabs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Write: admin only
CREATE POLICY "Admins can manage layouts"
  ON page_layouts FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage sections"
  ON page_layout_sections FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage fields"
  ON page_layout_fields FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can manage tabs"
  ON page_layout_tabs FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can read history"
  ON page_layout_history FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert history"
  ON page_layout_history FOR INSERT
  WITH CHECK (is_admin());

-- ============================================================
-- HELPER: Get full layout config as JSON
-- ============================================================
CREATE OR REPLACE FUNCTION get_page_layout(
  p_object_type page_object_type,
  p_role app_role DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_layout_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_layout_id
  FROM page_layouts
  WHERE object_type = p_object_type
    AND is_active = true
    AND role = p_role;

  IF v_layout_id IS NULL THEN
    SELECT id INTO v_layout_id
    FROM page_layouts
    WHERE object_type = p_object_type
      AND is_active = true
      AND role IS NULL;
  END IF;

  IF v_layout_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'layout_id', pl.id,
    'object_type', pl.object_type,
    'name', pl.name,
    'tabs', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'tab_key', t.tab_key,
          'title', t.title,
          'icon', t.icon,
          'sort_order', t.sort_order,
          'badge_field', t.badge_field
        ) ORDER BY t.sort_order
      )
      FROM page_layout_tabs t
      WHERE t.layout_id = pl.id AND t.is_visible = true
    ), '[]'::jsonb),
    'sections', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'section_key', s.section_key,
          'title', s.title,
          'subtitle', s.subtitle,
          'icon', s.icon,
          'column_layout', s.column_layout,
          'sort_order', s.sort_order,
          'is_collapsible', s.is_collapsible,
          'is_collapsed_default', s.is_collapsed_default,
          'tab_group', s.tab_group,
          'span', s.span,
          'fields', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'field_key', f.field_key,
                'label_override', f.label_override,
                'column_position', f.column_position,
                'sort_order', f.sort_order,
                'is_read_only', f.is_read_only,
                'span', f.span,
                'display_format', f.display_format,
                'placeholder', f.placeholder,
                'help_text', f.help_text
              ) ORDER BY f.sort_order
            )
            FROM page_layout_fields f
            WHERE f.section_id = s.id AND f.is_visible = true
          ), '[]'::jsonb)
        ) ORDER BY s.sort_order
      )
      FROM page_layout_sections s
      WHERE s.layout_id = pl.id AND s.is_visible = true
    ), '[]'::jsonb)
  ) INTO v_result
  FROM page_layouts pl
  WHERE pl.id = v_layout_id;

  RETURN v_result;
END;
$$;
