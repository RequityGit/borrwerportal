-- ============================================================
-- SEED PAGE LAYOUTS FROM EXISTING FIELD CONFIGURATIONS
-- ============================================================
-- This migration creates default page layouts based on the current
-- field_configurations table, ensuring detail pages look identical
-- before and after the Page Layout Manager is enabled.

-- ============================================================
-- 1. CONTACT layout
-- ============================================================
INSERT INTO page_layouts (object_type, name, is_active)
VALUES ('contact', 'Contact Detail — Default', true);

-- Tabs
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'overview', 'Overview', 'layout-dashboard', 0 FROM page_layouts WHERE object_type = 'contact' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'activity', 'Activity', 'activity', 1 FROM page_layouts WHERE object_type = 'contact' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'documents', 'Documents', 'file-text', 2 FROM page_layouts WHERE object_type = 'contact' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'notes', 'Notes', 'sticky-note', 3 FROM page_layouts WHERE object_type = 'contact' AND role IS NULL;

-- Section: Contact Information
INSERT INTO page_layout_sections (layout_id, section_key, title, icon, column_layout, sort_order, tab_group)
SELECT id, 'contact_info', 'Contact Information', 'user', '2-col', 0, 'overview'
FROM page_layouts WHERE object_type = 'contact' AND role IS NULL;

-- Fields for Contact Information
INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'first_name', 0, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'last_name', 1, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'email', 2, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'phone', 3, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'lifecycle_stage', 4, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'status', 5, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'source', 6, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'company_name', 7, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'contact_info';

-- Section: Address
INSERT INTO page_layout_sections (layout_id, section_key, title, icon, column_layout, sort_order, tab_group)
SELECT id, 'address', 'Address', 'map-pin', '2-col', 1, 'overview'
FROM page_layouts WHERE object_type = 'contact' AND role IS NULL;

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, span, display_format)
SELECT s.id, 'address', 0, 1, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'address';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'city', 1, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'address';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'state', 2, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'address';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'zip', 3, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'contact' AND s.section_key = 'address';

-- ============================================================
-- 2. OPPORTUNITY layout (maps to loan_details + borrower_entity + property modules)
-- ============================================================
INSERT INTO page_layouts (object_type, name, is_active)
VALUES ('opportunity', 'Opportunity Detail — Default', true);

-- Tabs
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'overview', 'Overview', 'layout-dashboard', 0 FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'underwriting', 'Underwriting', 'calculator', 1 FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'documents', 'Documents', 'file-text', 2 FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'activity', 'Activity', 'activity', 3 FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'notes', 'Notes', 'sticky-note', 4 FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;

-- Section: Loan Details
INSERT INTO page_layout_sections (layout_id, section_key, title, icon, column_layout, sort_order, tab_group)
SELECT id, 'loan_details', 'Loan Details', 'banknote', '2-col', 0, 'overview'
FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format, is_read_only)
SELECT s.id, 'loan_number', 0, 1, 'text', true
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'type', 1, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'purpose', 2, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'funding_channel', 'Channel', 3, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'strategy', 4, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'financing', 5, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'debt_tranche', 6, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'deal_programs', 7, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'loan_amount', 8, 1, 'currency'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'interest_rate', 'Rate', 9, 2, 'percentage'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'ltv', 'LTV', 10, 1, 'percentage'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'dscr_ratio', 'DSCR', 11, 2, 'number'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format, help_text)
SELECT s.id, 'loan_term_months', 'Term', 12, 1, 'number', 'Term in months'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'points', 13, 2, 'percentage'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'loan_details';

-- Section: Borrower / Entity
INSERT INTO page_layout_sections (layout_id, section_key, title, icon, column_layout, sort_order, tab_group)
SELECT id, 'borrower_entity', 'Borrower / Entity', 'user', '2-col', 1, 'overview'
FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'entity_name', 0, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'borrower_entity';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'entity_type', 1, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'borrower_entity';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'first_name', 'Guarantor', 2, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'borrower_entity';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'credit_score', 'FICO', 3, 2, 'number'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'borrower_entity';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'verified_liquidity', 'Liquidity', 4, 1, 'currency'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'borrower_entity';

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, display_format)
SELECT s.id, 'experience_count', 'Experience', 5, 2, 'number'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'borrower_entity';

-- Section: Subject Property
INSERT INTO page_layout_sections (layout_id, section_key, title, icon, column_layout, sort_order, tab_group)
SELECT id, 'property', 'Subject Property', 'home', '2-col', 2, 'overview'
FROM page_layouts WHERE object_type = 'opportunity' AND role IS NULL;

INSERT INTO page_layout_fields (section_id, field_key, label_override, sort_order, column_position, span, display_format)
SELECT s.id, 'property_address_line1', 'Address', 0, 1, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'property_city', 1, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'property_state', 2, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'property_type', 3, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'property_units', 4, 2, 'number'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'appraised_value', 5, 1, 'currency'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'purchase_price', 6, 2, 'currency'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'opportunity' AND s.section_key = 'property';

-- ============================================================
-- 3. COMPANY layout
-- ============================================================
INSERT INTO page_layouts (object_type, name, is_active)
VALUES ('company', 'Company Detail — Default', true);

INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'overview', 'Overview', 'layout-dashboard', 0 FROM page_layouts WHERE object_type = 'company' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'contacts', 'Contacts', 'users', 1 FROM page_layouts WHERE object_type = 'company' AND role IS NULL;
INSERT INTO page_layout_tabs (layout_id, tab_key, title, icon, sort_order)
SELECT id, 'activity', 'Activity', 'activity', 2 FROM page_layouts WHERE object_type = 'company' AND role IS NULL;

-- Section: Company Information
INSERT INTO page_layout_sections (layout_id, section_key, title, icon, column_layout, sort_order, tab_group)
SELECT id, 'company_info', 'Company Information', 'building-2', '2-col', 0, 'overview'
FROM page_layouts WHERE object_type = 'company' AND role IS NULL;

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'legal_name', 0, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'dba_names', 1, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'company_type', 2, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'subtype', 3, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'phone', 4, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'email', 5, 2, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'website', 6, 1, 'text'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'source', 7, 2, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'status', 8, 1, 'dropdown'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';

INSERT INTO page_layout_fields (section_id, field_key, sort_order, column_position, display_format)
SELECT s.id, 'is_title_co_verified', 9, 2, 'boolean'
FROM page_layout_sections s JOIN page_layouts l ON s.layout_id = l.id
WHERE l.object_type = 'company' AND s.section_key = 'company_info';
