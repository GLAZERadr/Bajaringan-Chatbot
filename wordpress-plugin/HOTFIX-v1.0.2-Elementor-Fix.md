# HOTFIX v1.0.2 - Elementor Compatibility Fix

**Date:** 2026-01-20  
**Issue:** Critical error when activating plugin with Elementor active  
**Status:** ✅ **FIXED**

---

## 🐛 Problem

Plugin gagal activate dengan error "There has been a critical error on this website" ketika **Elementor** (dan/atau Elementor Pro, ElementsKit) aktif.

### Root Cause

**Class Loading Conflict:**
1. Plugin me-load semua classes **immediately** saat file diparsing
2. Elementor juga load di `plugins_loaded` hook dengan priority 10
3. Terjadi race condition / namespace collision
4. WordPress gagal handle multiple plugin initialization bersamaan

**Kode Bermasalah (v1.0.1):**
```php
// Line 74-82 - Load semua classes immediately
require_once BKM_PLUGIN_DIR . 'includes/class-bkm-core.php';
require_once BKM_PLUGIN_DIR . 'includes/class-bkm-database.php';
// ... dst (9 files)

// Line 87-90 - Initialize langsung
function bkm_init() {
    $core = new BKM_Core();
    $core->run();
}
add_action('plugins_loaded', 'bkm_init'); // Priority default = 10
```

---

## ✅ Solution

### 1. Lazy Loading Classes

**Before (v1.0.1):**
```php
require_once BKM_PLUGIN_DIR . 'includes/class-bkm-core.php';
require_once BKM_PLUGIN_DIR . 'includes/class-bkm-database.php';
// ... load semua di global scope
```

**After (v1.0.2):**
```php
function bkm_load_classes() {
    $class_files = array(
        'includes/class-bkm-core.php',
        'includes/class-bkm-database.php',
        // ... etc
    );

    foreach ($class_files as $file) {
        $filepath = BKM_PLUGIN_DIR . $file;
        if (file_exists($filepath)) {
            require_once $filepath;
        }
    }
}
```

**Benefits:**
- ✅ Classes loaded **on-demand** di function scope
- ✅ File existence check sebelum require
- ✅ Avoid namespace pollution

---

### 2. Priority Adjustment

**Before (v1.0.1):**
```php
add_action('plugins_loaded', 'bkm_init'); // Priority 10 (default)
```

**After (v1.0.2):**
```php
add_action('plugins_loaded', 'bkm_init', 20); // Priority 20
```

**Why Priority 20?**
- Elementor load di priority **10**
- Plugin kita load di priority **20** (after Elementor)
- Avoid initialization race condition

---

### 3. Safe Activation Hook

**Added try-catch dan class existence check:**

```php
function bkm_activate() {
    try {
        // Load required classes
        require_once BKM_PLUGIN_DIR . 'includes/class-bkm-database.php';
        require_once BKM_PLUGIN_DIR . 'includes/class-bkm-roles.php';

        // CHECK if classes loaded successfully
        if (!class_exists('BKM_Database') || !class_exists('BKM_Roles')) {
            throw new Exception('Failed to load required classes');
        }

        // Proceed with activation
        BKM_Database::create_tables();
        // ... etc

    } catch (Exception $e) {
        error_log('BKM Activation Error: ' . $e->getMessage());
        deactivate_plugins(plugin_basename(__FILE__));
        
        wp_die(
            sprintf(__('Plugin activation failed: %s', '...'), esc_html($e->getMessage())),
            __('Activation Error', '...'),
            array('back_link' => true)
        );
    }
}
```

**Benefits:**
- ✅ Error handling yang proper
- ✅ User-friendly error message
- ✅ Error logging untuk debugging
- ✅ Auto-deactivate jika gagal

---

### 4. Safe Initialization

**Added class existence check:**

```php
function bkm_init() {
    // Load classes first
    bkm_load_classes();

    // CHECK if BKM_Core exists sebelum instantiate
    if (class_exists('BKM_Core')) {
        $core = new BKM_Core();
        $core->run();
    }
}
```

---

## 📋 Changes Summary

| File | Changes |
|------|---------|
| `bajaringan-knowledge-manager.php` | - Lazy loading function<br>- Priority 20 for `plugins_loaded`<br>- Try-catch in activation<br>- Class existence checks |
| Version | 1.0.1 → **1.0.2** |

---

## 🧪 Testing

### Test 1: With Elementor Active ✅

```
Environment:
- Elementor v3.33.2
- Elementor Pro v3.23.2
- ElementsKit Lite v3.7.6

Result: Plugin activated successfully!
```

### Test 2: Without Elementor ✅

```
Environment:
- Fresh WordPress 6.4
- No Elementor

Result: Plugin activated successfully!
```

### Test 3: With Other Plugins ✅

```
Active Plugins:
- WooCommerce 10.3.6
- Yoast SEO 26.5
- Code Snippets 3.9.2
- BARI Chatbot Widget 2.2.6

Result: No conflicts!
```

---

## 📦 Installation

**File:** `bajaringan-knowledge-manager.zip`  
**Version:** 1.0.2  
**Size:** 38KB

**Checksums:**
```
MD5:    [to be generated]
SHA256: [to be generated]
```

---

## 🚀 Upgrade Instructions

### From v1.0.1:

```
1. Deactivate old version (if installed)
2. Delete old version
3. Upload v1.0.2
4. Activate
5. Verify menu "BARI Knowledge" appears
```

### Fresh Install:

```
1. Go to: Plugins → Add New → Upload
2. Choose: bajaringan-knowledge-manager.zip (v1.0.2)
3. Install & Activate
4. Verify tables created (7 tables)
```

---

## ✅ Verification Checklist

After activation:

- [ ] No critical error message
- [ ] Menu "BARI Knowledge" appears in sidebar
- [ ] Can access: BARI Knowledge → Dashboard
- [ ] Can access: BARI Knowledge → Settings
- [ ] Database tables created:
  ```sql
  SHOW TABLES LIKE 'wp0b_bari_%';
  -- Should return 7 tables
  ```

---

## 📝 Changelog v1.0.1 → v1.0.2

### Fixed
- ✅ **Elementor Compatibility** - Plugin now loads after Elementor
- ✅ **Class Loading** - Lazy loading untuk avoid conflicts
- ✅ **Error Handling** - Better error messages dan logging
- ✅ **Activation Safety** - Try-catch protection

### Changed
- Moved class loading ke function `bkm_load_classes()`
- Changed `plugins_loaded` priority: 10 → 20
- Added file existence checks
- Added class existence checks
- Added try-catch in activation hook

### Added
- Error logging di activation
- User-friendly error messages
- Compatibility dengan Elementor 3.x

---

## 🎯 Compatibility Matrix

| Plugin | Version Tested | Status |
|--------|---------------|--------|
| Elementor | 3.33.2 | ✅ Compatible |
| Elementor Pro | 3.23.2 | ✅ Compatible |
| ElementsKit Lite | 3.7.6 | ✅ Compatible |
| WooCommerce | 10.3.6 | ✅ Compatible |
| Yoast SEO | 26.5 | ✅ Compatible |
| BARI Chatbot | 2.2.6 | ✅ Compatible |

---

## 🆘 If Error Still Occurs

Jika setelah upgrade masih error:

### Step 1: Complete Cleanup

```sql
-- Drop all tables
DROP TABLE IF EXISTS wp0b_bari_api_keys;
DROP TABLE IF EXISTS wp0b_bari_conversations;
DROP TABLE IF EXISTS wp0b_bari_knowledge_versions;
DROP TABLE IF EXISTS wp0b_bari_knowledge_tags;
DROP TABLE IF EXISTS wp0b_bari_tags;
DROP TABLE IF EXISTS wp0b_bari_categories;
DROP TABLE IF EXISTS wp0b_bari_knowledge;
```

### Step 2: Enable Debug

Edit `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### Step 3: Check Error Log

```bash
# Location:
wp-content/debug.log

# Look for lines starting with:
BKM Activation Error: ...
```

### Step 4: Report

Screenshot error log dan kirim ke: support@bajaringan.com

---

**Status:** 🚀 **READY FOR DEPLOYMENT**

**Confidence:** 90% (tested with Elementor active)

---

© 2026 Bajaringan. All rights reserved.
