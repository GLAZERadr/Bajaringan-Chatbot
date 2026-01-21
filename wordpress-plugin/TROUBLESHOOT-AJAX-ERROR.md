# Troubleshooting: AJAX Error "Unexpected token '<'"

**Error Message:**
```
AJAX Error: SyntaxError: Unexpected token '<', "<div id="e"... is not valid JSON
```

**What This Means:**
Server is returning HTML (error page) instead of JSON response. This usually indicates a PHP error or plugin conflict.

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Browser Console

1. Open browser console: `F12` or `Right-click → Inspect → Console`
2. Click "Generate New Key" again
3. Look for the AJAX request in Network tab
4. Click on the `admin-ajax.php` request
5. Check the **Response** tab

**What to look for:**
- If response starts with `<!DOCTYPE html>` or `<div` → PHP Error
- If response is valid JSON → Different issue

---

### Step 2: Enable WordPress Debug Mode

**Edit `wp-config.php`:**
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
@ini_set('display_errors', 0);
```

**Then check:** `wp-content/debug.log`

---

### Step 3: Common Causes & Solutions

#### Cause 1: PHP Error in Plugin Code

**Symptom:** Response starts with PHP error message

**Solution:**
1. Check `wp-content/debug.log` for error details
2. Look for errors mentioning `BKM_Admin` or `ajax_generate_api_key`
3. Report error to developer

---

#### Cause 2: Plugin Not Fully Activated

**Symptom:** "Call to undefined method" error

**Solution:**
```
1. WordPress Admin → Plugins
2. Deactivate: Bajaringan Knowledge Manager
3. Delete plugin completely
4. Upload fresh bajaringan-knowledge-manager.zip
5. Activate
6. Hard refresh browser: Ctrl+Shift+R
7. Try generate API key again
```

---

#### Cause 3: AJAX Hook Not Registered

**Symptom:** Response is blank or WordPress login page

**Check in browser console:**
```javascript
console.log(bkmAdmin);
// Should show: {nonce: "xxxxx"}
```

**If undefined:**
```
1. Clear browser cache completely
2. Hard refresh: Ctrl+Shift+R or Cmd+Shift+R
3. If still undefined, plugin JS not loaded
```

**Solution:**
1. Verify plugin is activated
2. Check if you're on BARI Knowledge Settings page
3. View page source, search for `bkmAdmin`
4. Should see: `var bkmAdmin = {"nonce":"..."};`

---

#### Cause 4: Server Configuration Issue

**Symptom:** Server returns 500 error

**Check:**
1. PHP version: Must be 7.4+
2. Memory limit: At least 128MB
3. max_execution_time: At least 30 seconds

**In wp-config.php:**
```php
define('WP_MEMORY_LIMIT', '256M');
```

---

#### Cause 5: Caching Plugin Conflict

**Symptom:** Old JavaScript being served

**Solution:**
```
1. Clear all caches:
   - WordPress cache (if using cache plugin)
   - Server cache (Varnish, Redis, etc.)
   - CDN cache (Cloudflare, etc.)
2. Purge browser cache
3. Try in Incognito/Private window
```

---

#### Cause 6: Security Plugin Blocking AJAX

**Symptom:** 403 Forbidden error

**Solution:**
```
1. Temporarily disable security plugins:
   - Wordfence
   - iThemes Security
   - Sucuri
2. Try generate API key
3. If works, add exception in security plugin
```

---

### Step 4: Manual Debugging

**Add debug output to JavaScript:**

Edit `admin/js/bkm-admin.js` (temporary):

```javascript
handleGenerateApiKey: function(e) {
    e.preventDefault();

    // Add debug
    console.log('Ajax URL:', ajaxurl);
    console.log('Nonce:', bkmAdmin.nonce);
    console.log('Action:', 'bkm_generate_api_key');

    // ... rest of code

    $.ajax({
        // ...
        success: function(response) {
            console.log('Success response:', response);
            // ...
        },
        error: function(xhr, status, error) {
            console.log('Error status:', status);
            console.log('Error:', error);
            console.log('Response Text:', xhr.responseText); // ← Key debug info!
            // ...
        }
    });
}
```

**Then:**
1. Refresh page
2. Click "Generate New Key"
3. Check console for debug output
4. Copy `xhr.responseText` and send to developer

---

### Step 5: Test AJAX Manually

**In browser console:**

```javascript
jQuery.ajax({
    url: ajaxurl,
    type: 'POST',
    data: {
        action: 'bkm_generate_api_key',
        key_name: 'test',
        nonce: bkmAdmin.nonce
    },
    success: function(response) {
        console.log('Success:', response);
    },
    error: function(xhr) {
        console.error('Error:', xhr.responseText);
    }
});
```

**Expected:** Success with API key

**If error:** Copy `xhr.responseText` for debugging

---

## 🛠️ Quick Fixes to Try

### Fix 1: Complete Plugin Reinstall

```
1. Deactivate plugin
2. Delete plugin folder via FTP:
   /wp-content/plugins/bajaringan-knowledge-manager/
3. Upload fresh ZIP
4. Activate
5. Clear browser cache (Ctrl+Shift+R)
```

### Fix 2: Clear All Caches

```
1. WordPress:
   - WP Super Cache → Delete Cache
   - W3 Total Cache → Empty All Caches

2. Server:
   - SSH: service varnish restart
   - cPanel: Clear Varnish/Redis

3. CDN:
   - Cloudflare → Purge Everything

4. Browser:
   - Chrome: Ctrl+Shift+Del → Clear All
   - Incognito mode test
```

### Fix 3: Disable Conflicting Plugins

**Temporarily deactivate:**
1. All cache plugins
2. All security plugins
3. All optimization plugins
4. Test API key generation
5. Reactivate one by one to find conflict

### Fix 4: Increase PHP Limits

**In wp-config.php:**
```php
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
```

**Or in .htaccess:**
```apache
php_value memory_limit 256M
php_value max_execution_time 300
```

### Fix 5: Check File Permissions

```bash
# Via SSH
cd /path/to/wordpress/wp-content/plugins/
chmod 755 bajaringan-knowledge-manager
chmod 644 bajaringan-knowledge-manager/includes/class-bkm-admin.php
```

---

## 📋 Information to Provide When Reporting

If issue persists, provide:

1. **Full error from browser console:**
   - Screenshot or copy full `xhr.responseText`

2. **WordPress environment:**
   ```
   - WordPress version:
   - PHP version:
   - Active plugins:
   - Active theme:
   ```

3. **From debug.log:**
   - Last 20 lines related to BKM or AJAX

4. **Steps to reproduce:**
   - Exact sequence of actions
   - When error first appeared

---

## ✅ Verification After Fix

Once fixed, verify:

1. **API key generates successfully:**
   ```
   BARI Knowledge → Settings → Enter name → Generate
   Result: Success notice with API key
   ```

2. **Key appears in table:**
   ```
   Page auto-reloads
   New key shows in "Existing API Keys" table
   Status: Active
   ```

3. **No console errors:**
   ```
   Browser console (F12) shows no red errors
   ```

---

## 🔧 Updated Plugin

**Latest version with improved error handling:**

File: `bajaringan-knowledge-manager.zip`
MD5: `af055038acfc6d52d604e9216046625a`

**Changes:**
- ✅ Better AJAX error handling
- ✅ Detailed error messages
- ✅ Console logging for debugging
- ✅ Try-catch in PHP
- ✅ Nonce validation improvements

---

## 💡 Prevention

**To prevent future issues:**

1. **Keep plugin updated**
2. **Clear cache after updates**
3. **Test in incognito mode first**
4. **Check debug.log regularly**
5. **Backup before major changes**

---

**Still having issues?** Contact support with debug information above.

---

© 2026 Bajaringan. All rights reserved.
