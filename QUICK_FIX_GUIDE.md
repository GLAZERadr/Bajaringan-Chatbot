# Quick Fix Guide - BARI Chatbot Widget

## ✅ Fixes Applied

### 1. **Icon Bulat (Rounded FAB)**
**Problem:** Icon berbentuk kotak
**Solution:** Ditambahkan `border-radius: 50% !important;`

### 2. **Modal Tidak Fullscreen di Mobile**
**Problem:** Modal menutup seluruh layar di mobile
**Solution:** Modal sekarang hanya 85-90% tinggi layar dengan rounded top corners

---

## 🚀 Cara Update Plugin di WordPress

### Option 1: Replace File via FTP/cPanel

1. **Download file baru:**
   - `wordpress-plugin/bajaringan-chatbot/js/bari-chatbot-widget.js`

2. **Upload via FTP/cPanel:**
   - Login ke hosting
   - Navigate ke: `/wp-content/plugins/bajaringan-chatbot/js/`
   - Replace file `bari-chatbot-widget.js`
   - Clear cache

3. **Test:**
   - Reload website (Ctrl+Shift+R)
   - Check icon sekarang bulat
   - Test di mobile - modal sekarang tidak fullscreen

### Option 2: Re-upload Plugin

1. **Create new ZIP:**
   ```bash
   cd wordpress-plugin
   zip -r bajaringan-chatbot-v2.0.1.zip bajaringan-chatbot/
   ```

2. **Upload ke WordPress:**
   - Plugins → Add New → Upload Plugin
   - Choose `bajaringan-chatbot-v2.0.1.zip`
   - Install & Activate

3. **Deactivate old version first** (jika perlu)

### Option 3: Quick CSS Fix (Temporary)

Jika belum bisa upload file, tambahkan CSS ini sementara:

**WordPress Admin → Appearance → Customize → Additional CSS:**

```css
/* Force FAB to be rounded */
.bari-fab,
button.bari-fab,
#bariChatbotFAB {
  border-radius: 50% !important;
  overflow: hidden !important;
}

.bari-fab img {
  border-radius: 50% !important;
}

/* Modal responsive fix for mobile */
@media (max-width: 768px) {
  .bari-modal {
    height: 85vh !important;
    max-height: 85vh !important;
    border-radius: 20px 20px 0 0 !important;
    bottom: 0 !important;
    top: auto !important;
  }
}

@media (max-width: 480px) {
  .bari-modal {
    height: 90vh !important;
    max-height: 90vh !important;
  }
}
```

---

## 📱 What Changed

### Desktop (> 768px)
- **No changes** - Modal tetap 420×640px di pojok kanan bawah

### Tablet/Mobile (≤ 768px)
- **Before:** Modal 100vh (fullscreen)
- **After:** Modal 85vh (85% screen height)
- **Border:** Rounded top corners (20px)
- **Position:** Bottom of screen, not covering navbar area

### Small Mobile (≤ 480px)
- **Height:** 90vh (sedikit lebih tinggi)
- **FAB size:** 62×62px (lebih kecil)

---

## 🧪 Testing Checklist

### Desktop
- [ ] Icon bulat (circle)
- [ ] GIF animasi jalan
- [ ] Modal muncul di pojok kanan bawah
- [ ] Modal ukuran 420×640px

### Mobile (iPhone/Android)
- [ ] Icon bulat
- [ ] Icon ukuran 62-68px
- [ ] Modal 85-90% tinggi layar
- [ ] Top corners rounded
- [ ] Navbar tetap terlihat di atas modal
- [ ] Bisa scroll chatbot di dalam modal
- [ ] Close button berfungsi

### Cross-Device
- [ ] Chrome mobile
- [ ] Safari iOS
- [ ] Firefox mobile
- [ ] Chrome desktop
- [ ] Safari desktop

---

## 🐛 Troubleshooting

### Icon Masih Kotak

**Cause:** Cache browser atau CDN
**Fix:**
```bash
# 1. Hard reload browser
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

# 2. Clear WordPress cache
WP Super Cache: Settings → Delete Cache
W3 Total Cache: Performance → Purge All Caches

# 3. Clear CDN cache (jika pakai Cloudflare/CloudFront)

# 4. Check console untuk errors
F12 → Console tab → Look for CSS errors
```

### Modal Masih Fullscreen di Mobile

**Cause:** Old CSS cached
**Fix:**
```javascript
// Test di browser console:
document.querySelector('.bari-modal').style.height = '85vh';
document.querySelector('.bari-modal').style.maxHeight = '85vh';
document.querySelector('.bari-modal').style.borderRadius = '20px 20px 0 0';

// Jika berhasil, berarti CSS belum terupdate
// → Clear cache & upload file baru
```

### Multiple Widgets Muncul

**Cause:** Plugin ter-load 2x
**Fix:**
```javascript
// Check di console:
console.log(window.bariChatbotWidget);

// Jika undefined → Widget tidak ter-init
// Jika object → Widget sudah ter-init

// Clear double widgets:
const widgets = document.querySelectorAll('#bariChatbotWidget');
if (widgets.length > 1) {
  for (let i = 1; i < widgets.length; i++) {
    widgets[i].remove();
  }
}
```

### GIF Tidak Animasi

**Cause:** GIF URL salah atau file rusak
**Fix:**
```bash
# 1. Verify URL works
https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif

# 2. Test di new tab - should show animated GIF

# 3. Check file size (should be < 1MB)

# 4. Re-upload GIF if corrupted
```

---

## 📊 Performance Impact

### Before vs After

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| FAB CSS | OK | OK | ✅ No change |
| Modal CSS | 100vh | 85vh | ⬇️ Lighter |
| JavaScript | Same | Same | ✅ No change |
| Load time | ~500ms | ~500ms | ✅ No change |

---

## 🔄 Version History

### v2.0.1 (Latest)
- ✅ Fixed: FAB forced to be rounded (`!important`)
- ✅ Fixed: Mobile modal 85vh instead of fullscreen
- ✅ Fixed: Rounded top corners for modal on mobile

### v2.0.0
- Initial release with GIF support
- Auto-show bubble feature
- Responsive design

---

## 📞 Need Help?

**Email:** support@bajaringan.com
**Screenshot:** Kirim screenshot issue ke email
**Browser:** Include browser & device info

---

## ✅ Final Steps

After update:

1. **Clear all caches**
   - WordPress cache
   - Browser cache
   - CDN cache (if any)

2. **Test on real devices**
   - Your own phone
   - Desktop browser
   - Tablet (if available)

3. **Verify functionality**
   - Icon is round ✅
   - GIF animates ✅
   - Modal not fullscreen on mobile ✅
   - Bubble auto-shows after 10s ✅
   - Everything clickable ✅

---

**Update completed!** 🎉

Widget sekarang:
- ✅ Icon bulat di semua device
- ✅ Modal responsive di mobile (tidak fullscreen)
- ✅ Smooth animations
- ✅ Professional appearance

**Built by Bajaringan Team with ❤️**
