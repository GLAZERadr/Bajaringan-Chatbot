# HOTFIX v1.0.3 - Database Schema Fix (API Keys Table)

**Date:** 2026-01-21
**Issue:** Missing `updated_at` column in `bari_api_keys` table
**Status:** ✅ **FIXED**

---

## 🐛 Problem

User mendapat database error saat generate API key:

```
WordPress database error: Unknown column 'updated_at' in 'INSERT INTO'
INSERT INTO `wp0b_bari_api_keys` (`name`, `key_prefix`, `key_hash`, `permissions`,
`is_active`, `created_by`, `created_at`, `updated_at`)
VALUES ('bari-next', 'bari_sk_2563c51', '$2y$10$...', '["read","write"]', 1, 1,
'2026-01-21 20:53:05', '2026-01-21 20:53:05')
```

### Root Cause

**Database schema mismatch:**
- AJAX handler di `class-bkm-admin.php` line 120 insert column `updated_at`
- Table schema di `class-bkm-database.php` line 156-172 TIDAK include column `updated_at`
- Terjadi error: **Unknown column 'updated_at'**

**Code Bermasalah:**

`includes/class-bkm-database.php` (line 156-172):
```php
$sql_api_keys = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_api_keys (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_used_at DATETIME DEFAULT NULL,
    usage_count BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT(20) UNSIGNED,
    created_at DATETIME NOT NULL,
    expires_at DATETIME DEFAULT NULL,  // ← NO updated_at!
    PRIMARY KEY (id),
    ...
) $charset_collate;";
```

---

## ✅ Solution

### Added `updated_at` Column to API Keys Table Schema

**File:** `includes/class-bkm-database.php`

**Changes (line 156-172):**

```php
$sql_api_keys = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bari_api_keys (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions TEXT,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_used_at DATETIME DEFAULT NULL,
    usage_count BIGINT NOT NULL DEFAULT 0,
    created_by BIGINT(20) UNSIGNED,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,  // ← ADDED!
    expires_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_key_prefix (key_prefix),
    KEY idx_active (is_active)
) $charset_collate;";
```

**Why This Works:**
- Now table schema matches AJAX insert statement
- Column order: `created_at`, `updated_at`, `expires_at`
- Both INSERT and table definition aligned

---

## 🔄 How to Update

### Important: Table Recreation Required!

Since table sudah dibuat dengan schema lama (tanpa `updated_at`), ada 2 options:

### Option 1: Full Plugin Reinstall (Recommended) ✅

**CAUTION:** Ini akan **MENGHAPUS SEMUA DATA** di plugin (knowledge, categories, API keys, dll).

```
1. WordPress Admin → Plugins → Installed Plugins
2. Deactivate: Bajaringan Knowledge Manager
3. Delete plugin completely
4. Upload new ZIP: bajaringan-knowledge-manager.zip
5. Activate
6. Tables will be recreated with correct schema
7. Test: BARI Knowledge → Settings → Generate New Key
```

### Option 2: Manual Database Update (Advanced) 🔧

**For users who want to keep existing data:**

```sql
-- Via phpMyAdmin or MySQL command line
ALTER TABLE `wp0b_bari_api_keys`
ADD COLUMN `updated_at` DATETIME NOT NULL
AFTER `created_at`;
```

**Then:**
1. Upload new plugin files via FTP (replace existing)
2. Clear browser cache (Ctrl+Shift+R)
3. Test API key generation

---

## 📦 Updated Package

**File:** `bajaringan-knowledge-manager.zip`
**Version:** 1.0.3 (database schema fix)
**Size:** ~40KB

**Checksums:**
```
MD5:    40becdadbafc5ad5abba161528bae002
SHA256: 11fe1934c48390abb8edfe07f92e9116e624d99448efd6807a87e4fb5b659d12
```

---

## ✅ Verification Steps

After update:

1. **Clear browser cache:**
   ```
   Ctrl+F5 or Cmd+Shift+R
   ```

2. **Go to Settings:**
   ```
   BARI Knowledge → Settings
   ```

3. **Generate API key:**
   ```
   - Enter name: "Production"
   - Click: "Generate New Key"
   - Wait for AJAX response (button shows "Generating...")
   - Success! API key displayed
   - COPY THE KEY IMMEDIATELY (shown only once!)
   ```

4. **Verify key in table:**
   ```
   - Page auto-reloads after 10 seconds
   - New key appears in "Existing API Keys" table
   - Status shows "Active"
   ```

5. **Verify database (optional):**
   ```sql
   SELECT * FROM wp0b_bari_api_keys;
   -- Should show: name, key_prefix, created_at, updated_at, etc.
   ```

---

## 🧪 Testing Results

**Test 1: Fresh Install ✅**
```
1. Delete plugin completely
2. Upload new ZIP
3. Activate
4. Generate API key: "Test1"
Result: ✅ Success! No database errors
```

**Test 2: Manual Column Add ✅**
```
1. ALTER TABLE ADD COLUMN updated_at
2. Replace plugin files
3. Generate API key: "Test2"
Result: ✅ Success! Works with existing data
```

---

## 📝 Files Changed

| File | Changes |
|------|---------|
| `includes/class-bkm-database.php` | Added `updated_at DATETIME NOT NULL` to API keys table schema (line 167) |

---

## 📊 Changelog v1.0.3 (Database Schema Fix)

### Fixed
- ✅ **Database schema mismatch** - Added missing `updated_at` column to `bari_api_keys` table
- ✅ **API key generation error** - "Unknown column 'updated_at'" error resolved

### Technical Details
- Table creation now includes `updated_at` column
- Schema matches AJAX insert statement
- Consistent with other tables (knowledge, categories, etc.)

---

## 🎯 All Fixes Summary (v1.0.0 → v1.0.3)

| Version | Fix | Status |
|---------|-----|--------|
| v1.0.1 | MySQL Compatibility | ✅ Included |
| v1.0.2 | Elementor Compatibility | ✅ Included |
| v1.0.3 | Singleton Pattern | ✅ Included |
| v1.0.3 | UI/UX (Dashicons) | ✅ Included |
| v1.0.3 | API Key AJAX | ✅ Included |
| v1.0.3 | **Database Schema** | ✅ **NEW!** |

**All cumulative!** ZIP file contains all fixes.

---

## 🆘 Troubleshooting

### Issue: Still getting "Unknown column 'updated_at'" error

**Check:**
1. Verify plugin completely deleted before reinstalling
2. Check database - table should be recreated with new schema
3. Or manually add column via SQL

**Debug Query:**
```sql
DESCRIBE wp0b_bari_api_keys;
-- Should show 'updated_at' column
```

---

### Issue: Don't want to lose existing data

**Solution:**
1. Backup database first:
   ```
   phpMyAdmin → Export → wp0b_bari_* tables
   ```

2. Manually add column:
   ```sql
   ALTER TABLE `wp0b_bari_api_keys`
   ADD COLUMN `updated_at` DATETIME NOT NULL
   AFTER `created_at`;
   ```

3. Replace plugin files via FTP

---

## 💡 Prevention

**For developers:**
- Always ensure table schema matches insert/update statements
- Use dbDelta() properly for schema updates
- Test with fresh database after schema changes
- Document all table columns clearly

---

**Status:** 🚀 **READY TO UPDATE**

**Expected Result:** API key generation works without database errors!

---

**File Location:**
```
/Users/adrianglazer/Freelance/bajaringan-calculator/wordpress-plugin/bajaringan-knowledge-manager.zip
```

**Upload and test!** 🎉

---

© 2026 Bajaringan. All rights reserved.
