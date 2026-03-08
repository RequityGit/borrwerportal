-- ============================================================
-- FIX: field_configurations & page_layout_fields key mismatches
-- ============================================================
-- field_configurations was seeded with field_keys that don't match
-- actual database column names. This migration corrects them so
-- the DynamicPageRenderer can read record[field_key] correctly.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Fix field_configurations: contact_profile module
-- ============================================================
-- crm_contacts.address_line1 was registered as 'address'
UPDATE field_configurations
SET field_key = 'address_line1'
WHERE module = 'contact_profile' AND field_key = 'address';

-- ============================================================
-- 2. Fix field_configurations: company_info module
-- ============================================================
-- companies.name was registered as 'legal_name'
UPDATE field_configurations
SET field_key = 'name'
WHERE module = 'company_info' AND field_key = 'legal_name';

-- companies.other_names was registered as 'dba_names'
UPDATE field_configurations
SET field_key = 'other_names'
WHERE module = 'company_info' AND field_key = 'dba_names';

-- companies.company_subtype was registered as 'subtype'
UPDATE field_configurations
SET field_key = 'company_subtype'
WHERE module = 'company_info' AND field_key = 'subtype';

-- companies.title_company_verified was registered as 'is_title_co_verified'
UPDATE field_configurations
SET field_key = 'title_company_verified'
WHERE module = 'company_info' AND field_key = 'is_title_co_verified';

-- companies has no 'status' column; the equivalent is 'is_active' (boolean)
UPDATE field_configurations
SET field_key = 'is_active',
    field_label = 'Active',
    field_type = 'boolean'
WHERE module = 'company_info' AND field_key = 'status';

-- ============================================================
-- 3. Fix page_layout_fields for Contact layout
-- ============================================================
UPDATE page_layout_fields
SET field_key = 'address_line1'
WHERE field_key = 'address'
  AND section_id IN (
    SELECT s.id
    FROM page_layout_sections s
    JOIN page_layouts l ON s.layout_id = l.id
    WHERE l.object_type = 'contact'
  );

-- ============================================================
-- 4. Fix page_layout_fields for Company layout
-- ============================================================
UPDATE page_layout_fields
SET field_key = 'name'
WHERE field_key = 'legal_name'
  AND section_id IN (
    SELECT s.id
    FROM page_layout_sections s
    JOIN page_layouts l ON s.layout_id = l.id
    WHERE l.object_type = 'company'
  );

UPDATE page_layout_fields
SET field_key = 'other_names'
WHERE field_key = 'dba_names'
  AND section_id IN (
    SELECT s.id
    FROM page_layout_sections s
    JOIN page_layouts l ON s.layout_id = l.id
    WHERE l.object_type = 'company'
  );

UPDATE page_layout_fields
SET field_key = 'company_subtype'
WHERE field_key = 'subtype'
  AND section_id IN (
    SELECT s.id
    FROM page_layout_sections s
    JOIN page_layouts l ON s.layout_id = l.id
    WHERE l.object_type = 'company'
  );

UPDATE page_layout_fields
SET field_key = 'title_company_verified'
WHERE field_key = 'is_title_co_verified'
  AND section_id IN (
    SELECT s.id
    FROM page_layout_sections s
    JOIN page_layouts l ON s.layout_id = l.id
    WHERE l.object_type = 'company'
  );

UPDATE page_layout_fields
SET field_key = 'is_active',
    display_format = 'boolean'
WHERE field_key = 'status'
  AND section_id IN (
    SELECT s.id
    FROM page_layout_sections s
    JOIN page_layouts l ON s.layout_id = l.id
    WHERE l.object_type = 'company'
  );

-- ============================================================
-- 5. Add missing contact_profile fields for commonly used columns
-- ============================================================
INSERT INTO field_configurations
  (module, field_key, field_label, field_type, column_position, display_order, is_visible, is_locked, is_admin_created)
VALUES
  ('contact_profile', 'contact_type',  'Contact Type', 'dropdown', 'left',  12, true, false, false),
  ('contact_profile', 'assigned_to',   'Assigned To',  'relationship', 'right', 13, true, false, false),
  ('contact_profile', 'notes',         'Notes',        'textarea', 'left',  14, true, false, false),
  ('contact_profile', 'rating',        'Rating',       'dropdown', 'right', 15, true, false, false),
  ('contact_profile', 'country',       'Country',      'text',     'left',  16, true, false, false)
ON CONFLICT (module, field_key) DO NOTHING;

COMMIT;
