-- ============================================================================
-- BAJARINGAN KNOWLEDGE MANAGER - INSTALLATION VERIFICATION SCRIPT
-- ============================================================================
-- Version: 1.0.3
-- Date: 2026-01-21
--
-- Run this script in phpMyAdmin or MySQL client to verify installation
-- ============================================================================

-- 1. CHECK ALL TABLES EXIST
-- Expected: 7 tables
SELECT 'Step 1: Checking Tables...' AS step;
SHOW TABLES LIKE 'wp0b_bari_%';

-- 2. COUNT TABLES
-- Expected: 7
SELECT 'Step 2: Table Count...' AS step;
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'wp0b_bari_%';

-- 3. CHECK KNOWLEDGE TABLE STRUCTURE
-- Expected: All columns present
SELECT 'Step 3: Knowledge Table Structure...' AS step;
DESCRIBE wp0b_bari_knowledge;

-- 4. CHECK DEFAULT CATEGORIES
-- Expected: 5 categories
SELECT 'Step 4: Default Categories...' AS step;
SELECT id, name, slug, description, knowledge_count
FROM wp0b_bari_categories
ORDER BY id;

-- 5. COUNT CATEGORIES
-- Expected: 5
SELECT 'Step 5: Category Count...' AS step;
SELECT COUNT(*) AS total_categories
FROM wp0b_bari_categories;

-- 6. CHECK KNOWLEDGE COUNT
-- Expected: 0 (if fresh install) or N (if data exists)
SELECT 'Step 6: Knowledge Entries...' AS step;
SELECT
    COUNT(*) AS total_knowledge,
    SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
    SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
    SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived
FROM wp0b_bari_knowledge;

-- 7. CHECK API KEYS
-- Expected: 0 (if not generated yet)
SELECT 'Step 7: API Keys...' AS step;
SELECT
    id,
    name,
    key_prefix,
    is_active,
    created_at,
    last_used_at
FROM wp0b_bari_api_keys
WHERE is_active = 1;

-- 8. CHECK CONVERSATIONS
-- Expected: 0 (if fresh install)
SELECT 'Step 8: Conversations...' AS step;
SELECT COUNT(*) AS total_conversations
FROM wp0b_bari_conversations;

-- 9. CHECK TAGS
-- Expected: 0 (if fresh install)
SELECT 'Step 9: Tags...' AS step;
SELECT COUNT(*) AS total_tags
FROM wp0b_bari_tags;

-- 10. CHECK KNOWLEDGE VERSIONS (Version History)
-- Expected: 0 (if no edits yet)
SELECT 'Step 10: Version History...' AS step;
SELECT COUNT(*) AS total_versions
FROM wp0b_bari_knowledge_versions;

-- 11. VERIFY TABLE RELATIONSHIPS
-- Expected: Foreign key constraints exist
SELECT 'Step 11: Table Relationships...' AS step;
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'wp0b_bari_%'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 12. CHECK INDEXES
-- Expected: Multiple indexes for performance
SELECT 'Step 12: Table Indexes...' AS step;
SELECT
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'wp0b_bari_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- 13. CHECK WORDPRESS OPTIONS
-- Expected: 3 options (version, webhook_url, webhook_secret)
SELECT 'Step 13: WordPress Options...' AS step;
SELECT option_name, option_value
FROM wp0b_options
WHERE option_name LIKE 'bkm_%'
ORDER BY option_name;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 'INSTALLATION SUMMARY' AS report_title;

SELECT
    'Tables' AS check_item,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name LIKE 'wp0b_bari_%') AS result,
    '7' AS expected,
    CASE
        WHEN (SELECT COUNT(*) FROM information_schema.tables
              WHERE table_schema = DATABASE() AND table_name LIKE 'wp0b_bari_%') = 7
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END AS status

UNION ALL

SELECT
    'Categories' AS check_item,
    (SELECT COUNT(*) FROM wp0b_bari_categories) AS result,
    '5' AS expected,
    CASE
        WHEN (SELECT COUNT(*) FROM wp0b_bari_categories) = 5
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END AS status

UNION ALL

SELECT
    'Plugin Version' AS check_item,
    (SELECT option_value FROM wp0b_options WHERE option_name = 'bkm_version') AS result,
    '1.0.3' AS expected,
    CASE
        WHEN (SELECT option_value FROM wp0b_options WHERE option_name = 'bkm_version') = '1.0.3'
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END AS status

UNION ALL

SELECT
    'Webhook Secret' AS check_item,
    CASE
        WHEN (SELECT option_value FROM wp0b_options WHERE option_name = 'bkm_webhook_secret') IS NOT NULL
        THEN 'Generated'
        ELSE 'Not Found'
    END AS result,
    'Generated' AS expected,
    CASE
        WHEN (SELECT option_value FROM wp0b_options WHERE option_name = 'bkm_webhook_secret') IS NOT NULL
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END AS status;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

-- INSTRUCTIONS:
--
-- 1. All checks should return '✓ PASS' in the summary
-- 2. If any check shows '✗ FAIL', review the detailed output above
-- 3. Expected results are noted in comments before each query
-- 4. Save this output for troubleshooting if needed
--
-- ============================================================================
