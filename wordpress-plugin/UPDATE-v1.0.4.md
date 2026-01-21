# UPDATE v1.0.4 - Automatic Database Schema Upgrade

**Date:** 2026-01-21
**Version:** 1.0.4
**Status:** ✅ **READY TO INSTALL**

---

## 🎯 What's New in v1.0.4

### ✅ Automatic Database Upgrade
- **Smart version detection**: Plugin automatically detects version changes
- **Auto-migration**: Missing `updated_at` column will be added automatically on update
- **No manual SQL required**: Just upload and activate!
- **Safe upgrade**: Checks if column exists before adding (no errors if already exists)

---

## 🚀 How to Update (EASY!)

### Step-by-Step:

1. **Go to WordPress Admin → Plugins**

2. **Deactivate** (but don't delete):
   - Find "Bajaringan Knowledge Manager"
   - Click "Deactivate"

3. **Delete the old plugin:**
   - Click "Delete"
   - Confirm deletion

4. **Upload new version:**
   - Click "Add New Plugin" → "Upload Plugin"
   - Choose: `bajaringan-knowledge-manager.zip` (v1.0.4)
   - Click "Install Now"

5. **Activate:**
   - Click "Activate Plugin"

6. **Automatic upgrade happens!** ✨
   - Plugin detects old version (1.0.3)
   - Automatically adds `updated_at` column to `bari_api_keys` table
   - Updates version to 1.0.4
   - Done!

7. **Test API Key Generation:**
   - Go to: BARI Knowledge → Settings
   - Enter name: `bari-next`
   - Click: "Generate New Key"
   - Success! ✅

---

## 📦 Package Info

**File:** `bajaringan-knowledge-manager.zip`
**Version:** 1.0.4
**Size:** 41KB

**Checksums:**
```
MD5:    38951fe766d761fe3fe8f81c8ddd580a
SHA256: 67578c72b5ce05d44d6fd85e2d515982175224bcc04319120fc9347c20f57d6a
```

---

## 🔧 Technical Changes

### 1. Version Bump
- `Version: 1.0.3` → `Version: 1.0.4`
- `BKM_VERSION` constant updated

### 2. Database Schema Fix
**File:** `includes/class-bkm-database.php`

```php
// Added to bari_api_keys table (line 167)
updated_at DATETIME NOT NULL,
```

### 3. Auto-Upgrade System
**File:** `bajaringan-knowledge-manager.php`

**New Function:** `bkm_check_version()` (line 128-139)
```php
function bkm_check_version() {
    $current_version = get_option('bkm_version', '0.0.0');

    if (version_compare($current_version, BKM_VERSION, '<')) {
        // Run upgrade routine
        bkm_upgrade_routine($current_version);

        // Update version number
        update_option('bkm_version', BKM_VERSION);
    }
}
add_action('plugins_loaded', 'bkm_check_version', 10);
```

**New Function:** `bkm_upgrade_routine()` (line 144-164)
```php
function bkm_upgrade_routine($old_version) {
    global $wpdb;

    // Upgrade to 1.0.4: Add updated_at column to bari_api_keys table
    if (version_compare($old_version, '1.0.4', '<')) {
        $table_name = $wpdb->prefix . 'bari_api_keys';

        // Check if table exists and column doesn't exist
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table_name'") === $table_name;

        if ($table_exists) {
            $column_exists = $wpdb->get_results("SHOW COLUMNS FROM $table_name LIKE 'updated_at'");

            if (empty($column_exists)) {
                // Add the missing column
                $wpdb->query("ALTER TABLE $table_name ADD COLUMN updated_at DATETIME NOT NULL AFTER created_at");
                error_log('BKM: Added updated_at column to bari_api_keys table (v1.0.4 upgrade)');
            }
        }
    }
}
```

---

## 🧪 What Happens During Update

### Before Update (v1.0.3):
```
Plugin Version: 1.0.3
bkm_version option: 1.0.3
bari_api_keys table: Missing 'updated_at' column
API Key Generation: ❌ Error
```

### During Update:
```
1. Plugin activated
2. bkm_check_version() runs
3. Detects: 1.0.3 < 1.0.4
4. Calls: bkm_upgrade_routine('1.0.3')
5. Checks: Does 'updated_at' column exist?
6. No → Runs: ALTER TABLE ADD COLUMN updated_at
7. Updates: bkm_version option to 1.0.4
8. Done! ✅
```

### After Update (v1.0.4):
```
Plugin Version: 1.0.4
bkm_version option: 1.0.4
bari_api_keys table: Has 'updated_at' column ✅
API Key Generation: ✅ Works!
```

---

## ✅ Verification Steps

After updating:

1. **Check plugin version:**
   ```
   WordPress Admin → Plugins → Bajaringan Knowledge Manager
   Should show: Version 1.0.4
   ```

2. **Check upgrade log (optional):**
   ```
   wp-content/debug.log should contain:
   "BKM: Added updated_at column to bari_api_keys table (v1.0.4 upgrade)"
   ```

3. **Test API key generation:**
   ```
   BARI Knowledge → Settings
   Enter name: "bari-next"
   Click: "Generate New Key"
   Result: ✅ Success! No errors
   ```

4. **Verify database (optional):**
   ```sql
   DESCRIBE wp0b_bari_api_keys;
   -- Should show 'updated_at' column after 'created_at'
   ```

---

## 📊 Changelog v1.0.4

### Added
- ✅ **Automatic version detection** - Plugin checks version on load
- ✅ **Auto-upgrade system** - Runs database migrations automatically
- ✅ **Smart column check** - Only adds column if missing (no duplicate errors)
- ✅ **Upgrade logging** - Logs successful migrations to debug.log

### Fixed
- ✅ **Database schema mismatch** - `updated_at` column now added automatically
- ✅ **API key generation error** - "Unknown column 'updated_at'" resolved
- ✅ **Manual SQL not required** - Upgrade happens automatically on plugin activation

### Technical
- Version bump: `1.0.3` → `1.0.4`
- New function: `bkm_check_version()`
- New function: `bkm_upgrade_routine()`
- Database schema updated in `class-bkm-database.php`

---

## 🎯 All Fixes Summary (v1.0.0 → v1.0.4)

| Version | Fix | Status |
|---------|-----|--------|
| v1.0.1 | MySQL Compatibility | ✅ Included |
| v1.0.2 | Elementor Compatibility | ✅ Included |
| v1.0.3 | Singleton Pattern | ✅ Included |
| v1.0.3 | UI/UX (Dashicons) | ✅ Included |
| v1.0.3 | API Key AJAX | ✅ Included |
| v1.0.3 | Database Schema | ✅ Included |
| v1.0.4 | **Auto-Upgrade System** | ✅ **NEW!** |

**All cumulative!** ZIP file contains all fixes from all versions.

---

## 🆘 Troubleshooting

### Issue: Still getting "Unknown column 'updated_at'" error

**Check:**
1. Verify plugin version shows **1.0.4** (not 1.0.3)
2. Check `wp-content/debug.log` for upgrade message
3. Clear browser cache: `Ctrl+Shift+R`

**Manual Check:**
```sql
-- Run in phpMyAdmin
SELECT * FROM wp_options WHERE option_name = 'bkm_version';
-- Should show: 1.0.4
```

---

### Issue: Plugin won't activate

**Solution:**
1. Enable debug mode in `wp-config.php`:
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   ```

2. Check `wp-content/debug.log` for errors

3. Try manual SQL if needed:
   ```sql
   ALTER TABLE `wp0b_bari_api_keys`
   ADD COLUMN `updated_at` DATETIME NOT NULL
   AFTER `created_at`;
   ```

---

### Issue: Update doesn't run automatically

**Force upgrade manually:**
```php
// Run in WordPress admin > Tools > Site Health > Info > Constants
delete_option('bkm_version');
// Then deactivate and reactivate plugin
```

---

## 💡 Benefits of Auto-Upgrade System

✅ **User-friendly**: No technical knowledge required
✅ **Safe**: Checks before making changes
✅ **Idempotent**: Can run multiple times without errors
✅ **Logged**: All changes tracked in debug.log
✅ **Future-proof**: Easy to add more upgrades later
✅ **WordPress standard**: Follows WP best practices

---

## 🎉 Ready to Update!

**Status:** 🚀 **READY TO INSTALL**

**Expected Result:**
- ✅ Plugin updates to v1.0.4
- ✅ Database schema updated automatically
- ✅ API key generation works without errors
- ✅ No manual SQL required!

---

**File Location:**
```
/Users/adrianglazer/Freelance/bajaringan-calculator/wordpress-plugin/bajaringan-knowledge-manager.zip
```

**Upload and activate!** The upgrade happens automatically! 🎉

---

© 2026 Bajaringan. All rights reserved.
