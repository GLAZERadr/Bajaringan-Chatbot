# 🔄 WordPress Plugin Update Instructions

## Version 2.2.0 - December 2025

### What's New in v2.2.0
- ✅ Modal position moved to bottom (seolah-olah keluar dari FAB button)
- ✅ FAB icon automatically hides when modal opens
- ✅ FAB icon reappears with smooth animation when modal closes
- ✅ Better UX with fade + scale transitions

---

## 📦 Update Steps for WordPress

### Method 1: Manual Update via FTP/SFTP

1. **Backup current plugin** (recommended):
   ```bash
   # SSH ke server
   cd /path/to/wordpress/wp-content/plugins/
   cp -r bajaringan-chatbot bajaringan-chatbot-backup-v2.1.0
   ```

2. **Upload new files**:
   - Upload folder `bajaringan-chatbot` to `/wp-content/plugins/`
   - Overwrite when prompted

3. **Clear WordPress cache**:
   - Go to WordPress Admin Dashboard
   - Navigate to: **Performance → Purge All Caches** (if using W3 Total Cache)
   - Or: **Settings → WP Fastest Cache → Delete Cache**

4. **Hard refresh browser**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - Or open incognito/private window

5. **Verify version**:
   - Go to **Plugins** page in WordPress admin
   - Check version shows **2.2.0**

---

### Method 2: Using WordPress Admin (Recommended)

1. **Deactivate plugin**:
   - Go to: **Plugins → Installed Plugins**
   - Find "BARI Chatbot Widget"
   - Click **Deactivate**

2. **Delete old plugin**:
   - Click **Delete**
   - Confirm deletion

3. **Upload new plugin**:
   - Click **Add New Plugin** → **Upload Plugin**
   - Upload `bajaringan-chatbot.zip` (create ZIP first)
   - Click **Install Now**

4. **Activate plugin**:
   - Click **Activate Plugin**

5. **Clear cache + hard refresh** (same as Method 1, step 3-4)

---

### Method 3: Using WP-CLI (Advanced)

```bash
# SSH to server
cd /path/to/wordpress

# Backup
wp plugin list
cp -r wp-content/plugins/bajaringan-chatbot wp-content/plugins/bajaringan-chatbot-backup

# Delete old files
rm -rf wp-content/plugins/bajaringan-chatbot/*

# Upload new files (using SFTP/SCP)
# Then verify
wp plugin list

# Clear cache (if using WP Rocket, W3 Total Cache, etc.)
wp cache flush
wp w3-total-cache flush all

# Hard refresh: Ctrl+Shift+R
```

---

## 🧪 Testing Checklist

After updating, test these scenarios:

### Desktop
- [ ] FAB button visible on page load
- [ ] Click FAB → modal opens, FAB disappears (smooth fade out)
- [ ] Click X button → modal closes, FAB reappears (smooth fade in)
- [ ] Click overlay → modal closes, FAB reappears
- [ ] Modal position at bottom (30px from bottom)
- [ ] No "5 Sumber" text below AI responses

### Mobile
- [ ] FAB button visible and properly sized
- [ ] Modal expands to fullscreen (85vh-90vh)
- [ ] FAB hides when modal opens
- [ ] FAB shows when modal closes
- [ ] Touch interactions work smoothly

### Browser Cache
- [ ] Test in incognito/private window
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Verify JavaScript version: Check Network tab → `bari-chatbot-widget.js?ver=2.2.0`

---

## 🐛 Troubleshooting

### Issue: Still seeing old version / FAB not hiding

**Solution 1: Clear WordPress cache**
```bash
# Via WP-CLI
wp cache flush

# Or via admin panel:
# Performance → Purge All Caches
# Settings → Clear Cache
```

**Solution 2: Clear browser cache**
- Chrome: `Ctrl+Shift+Delete` → Clear cached images and files
- Or use incognito window

**Solution 3: Verify version in HTML**
```html
<!-- View page source, search for: -->
<script src=".../bari-chatbot-widget.js?ver=2.2.0"></script>

<!-- If still shows ver=2.1.0, cache not cleared -->
```

**Solution 4: Force reload JavaScript**
```javascript
// Add this to browser console temporarily:
localStorage.clear();
location.reload(true);
```

---

### Issue: FAB position overlaps with other elements

**Solution**: Adjust FAB position in CSS
```css
/* Edit in bari-chatbot-widget.js line 31-32 */
bottom: 140px !important;  /* Increase this value */
right: 30px !important;    /* Adjust horizontal position */
```

---

### Issue: Modal too small/large on mobile

**Solution**: Adjust mobile responsive CSS
```css
/* Edit in bari-chatbot-widget.js line 349-376 */
@media (max-width: 768px) {
  .bari-modal {
    height: 85vh !important;  /* Adjust this (60vh - 95vh) */
  }
}
```

---

## 📊 Verify Update Success

Check these in browser DevTools (F12):

1. **Console**: Should see:
   ```
   ✅ BARI Chatbot Widget initialized
   📂 Modal opened
   📁 Modal closed
   ```

2. **Network tab**: JavaScript file should load:
   ```
   bari-chatbot-widget.js?ver=2.2.0
   Status: 200 OK
   ```

3. **Elements tab**: When modal opens, FAB should have class:
   ```html
   <button class="bari-fab hidden">...</button>
   ```

4. **Computed styles**: FAB when hidden:
   ```css
   opacity: 0;
   transform: scale(0.8);
   pointer-events: none;
   ```

---

## 🔄 Rollback Instructions (if needed)

If you encounter issues:

```bash
# SSH to server
cd /path/to/wordpress/wp-content/plugins/

# Remove new version
rm -rf bajaringan-chatbot

# Restore backup
mv bajaringan-chatbot-backup-v2.1.0 bajaringan-chatbot

# Clear cache
wp cache flush

# Hard refresh browser
```

---

## 📞 Support

If you still have issues after following all steps:

1. Check browser console for JavaScript errors
2. Verify server has write permissions to `/wp-content/uploads/` and `/wp-content/cache/`
3. Disable other cache plugins temporarily
4. Test in incognito window
5. Check WordPress debug log: `/wp-content/debug.log`

---

## ✅ Summary

**Quick Update Steps:**
1. Upload new plugin files → overwrite
2. Clear WordPress cache
3. Hard refresh browser (Ctrl+Shift+R)
4. Verify version shows 2.2.0
5. Test: Click FAB → should hide when modal opens

**Version**: 2.2.0
**Date**: December 2025
**Changes**: Modal repositioned, FAB auto-hide, smoother UX
