# WordPress Integration Guide - BARI Chatbot Widget

Complete guide untuk mengintegrasikan BARI Chatbot ke WordPress dengan floating button & auto-show bubble.

---

## 📋 Quick Overview

Kamu akan membuat:
- ✅ Floating Action Button (FAB) dengan **animated GIF BARI robot**
- ✅ Auto-show bubble setelah **10 detik** user idle
- ✅ Auto-hide bubble setelah **3 detik**
- ✅ Modal iframe yang load chatbot Vercel
- ✅ Responsive di semua device

---

## 🎯 Step-by-Step Installation

### **Option 1: WordPress Plugin (Recommended)** ⭐

#### Step 1: Prepare Plugin Files

Struktur folder yang sudah dibuat:

```
wordpress-plugin/bajaringan-chatbot/
├── bajaringan-chatbot.php    # Main plugin file (PHP)
├── js/
│   └── bari-chatbot-widget.js # Widget JavaScript
└── README.md                  # Documentation
```

#### Step 2: Create ZIP File

```bash
cd wordpress-plugin
zip -r bajaringan-chatbot.zip bajaringan-chatbot/
```

Atau manual:
1. Select folder `bajaringan-chatbot`
2. Right-click → Compress
3. Rename menjadi `bajaringan-chatbot.zip`

#### Step 3: Upload to WordPress

1. Login ke **WordPress Admin**
2. Go to **Plugins → Add New**
3. Click **Upload Plugin**
4. Choose `bajaringan-chatbot.zip`
5. Click **Install Now**
6. Click **Activate Plugin**

#### Step 4: Configure Settings

1. Go to **Settings → BARI Chatbot**
2. **General Settings Tab:**
   - ✅ Enable Widget: Checked
   - Chatbot URL: `https://bajaringan-chatbot.vercel.app/chat`
   - Icon URL: `https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif`
   - Header Title: `BARI`
   - Header Subtitle: `Asisten Atap & Baja Ringan`

3. **Bubble Notification Tab:**
   - Bubble Delay: `10000` (10 seconds)
   - Bubble Duration: `3000` (3 seconds)
   - Bubble Text: `Butuh hitung & cek atap? Klik Bari.`

4. Click **Save Settings**

#### Step 5: Test on Website

1. Open your website in **incognito/private mode**
2. Wait 10 seconds → Bubble should appear
3. Wait 3 more seconds → Bubble auto-hides
4. Click FAB → Modal opens with chatbot
5. Test on mobile device

**Done! ✅**

---

### **Option 2: Manual Theme Integration**

If you prefer adding directly to your theme:

#### Step 1: Upload JavaScript File

1. Upload `bari-chatbot-widget.js` to:
   ```
   /wp-content/themes/YOUR-THEME/js/bari-chatbot-widget.js
   ```

#### Step 2: Edit `functions.php`

Add this code to your theme's `functions.php`:

```php
<?php
// Enqueue BARI Chatbot Widget
function bari_chatbot_enqueue() {
    if (!is_admin()) {
        wp_enqueue_script(
            'bari-chatbot-widget',
            get_template_directory_uri() . '/js/bari-chatbot-widget.js',
            array(),
            '2.0.0',
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'bari_chatbot_enqueue');
```

#### Step 3: Clear Cache & Test

1. Clear WordPress cache (if using caching plugin)
2. Clear browser cache
3. Test on website

---

## 🔧 Vercel Configuration

### Update `next.config.ts`

Add CORS headers to allow embedding:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/chat',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://bajaringan.com https://*.bajaringan.com"
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

### Deploy to Vercel

```bash
cd /path/to/bajaringan-calculator
git add .
git commit -m "Add iframe CORS headers"
git push origin main

# Vercel auto-deploys from main branch
```

---

## 🎨 Customization Guide

### Change Widget Position

**Bottom Left:**

Edit `bari-chatbot-widget.js` line ~42:

```javascript
.bari-fab {
  bottom: 24px;
  left: 24px;    // Change from 'right'
  right: auto;
}

.bari-modal {
  bottom: 115px;
  left: 24px;    // Change from 'right'
  right: auto;
}

.bari-bubble {
  bottom: 115px;
  left: 24px;    // Change from 'right'
  right: auto;
}

.bari-bubble::after {
  left: 32px;    // Change from 'right'
  right: auto;
}
```

### Change Colors

**Custom Brand Colors:**

```javascript
// FAB gradient (line ~47)
background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);

// Example: Blue theme
background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);

// Example: Green theme
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
```

### Change Size

**Larger FAB:**

```javascript
// Line ~45
.bari-fab {
  width: 100px;   // Bigger
  height: 100px;
}

// Adjust mobile too (line ~450)
@media (max-width: 768px) {
  .bari-fab {
    width: 75px;
    height: 75px;
  }
}
```

### Change Timing

**Show bubble faster (5 seconds):**

```javascript
// In WordPress admin: Settings → BARI Chatbot
Bubble Delay: 5000
```

Or edit code directly:

```javascript
// Line ~15
bubbleDelay: 5000, // 5 seconds instead of 10
```

---

## 📱 Responsive Behavior

### Desktop (> 768px)
- FAB: 80×80px, bottom-right corner
- Modal: 420×640px, positioned above FAB
- Bubble: Max 240px width

### Tablet (768px - 480px)
- FAB: 68×68px
- Modal: Fullscreen
- Bubble: Max calc(100vw - 120px)

### Mobile (< 480px)
- FAB: 62×62px
- Modal: Fullscreen
- Bubble: Max calc(100vw - 100px)

---

## 🧪 Testing Checklist

### Desktop Testing

- [ ] Open website in browser
- [ ] FAB muncul di pojok kanan bawah dengan GIF animasi
- [ ] Wait 10 seconds → Bubble muncul dengan text
- [ ] FAB shows pulse animation
- [ ] Wait 3 seconds → Bubble auto-hides
- [ ] Click FAB → Modal terbuka
- [ ] Chatbot iframe loads successfully
- [ ] Click X button → Modal closes
- [ ] Click overlay (background) → Modal closes
- [ ] Press ESC key → Modal closes
- [ ] Scroll page → Bubble timer resets

### Mobile Testing

- [ ] Open on mobile device
- [ ] FAB size responsive (smaller)
- [ ] Bubble tidak overflow screen
- [ ] Click FAB → Modal fullscreen
- [ ] Chatbot usable on mobile
- [ ] Swipe gestures work
- [ ] Keyboard doesn't break layout

### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🐛 Troubleshooting

### Issue 1: Widget Not Showing

**Possible causes:**
- Plugin not activated
- JavaScript error in console
- Cache not cleared

**Solutions:**
```bash
# 1. Check plugin status
WordPress Admin → Plugins → Check "BARI Chatbot Widget" is active

# 2. Clear cache
- Clear WordPress cache (WP Super Cache, W3 Total Cache, etc)
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private mode

# 3. Check console
- Open DevTools (F12)
- Check Console tab for errors
- Look for "BARI Chatbot Widget initialized" message
```

### Issue 2: Iframe Not Loading

**Possible causes:**
- CORS blocked
- Wrong chatbot URL
- X-Frame-Options blocking

**Solutions:**
```javascript
// 1. Check chatbot URL in settings
Settings → BARI Chatbot → Chatbot URL
Should be: https://bajaringan-chatbot.vercel.app/chat

// 2. Verify CORS headers on Vercel
// Check next.config.ts has correct headers

// 3. Test iframe directly
// Open browser console:
var iframe = document.createElement('iframe');
iframe.src = 'https://bajaringan-chatbot.vercel.app/chat';
document.body.appendChild(iframe);
// Check for errors
```

### Issue 3: GIF Not Animating

**Possible causes:**
- Wrong URL
- GIF file corrupted
- Browser cache

**Solutions:**
```bash
# 1. Verify GIF URL
https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif

# 2. Test URL directly
Open in new tab - should show animated GIF

# 3. Clear cache
Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Issue 4: Bubble Not Appearing

**Possible causes:**
- Bubble already shown
- User clicked close
- Timer not started

**Solutions:**
```javascript
// 1. Reload page in incognito mode
// This clears any "dismissed" state

// 2. Manually trigger bubble
// Open console:
window.bariChatbotWidget.showBubble();

// 3. Check timer setting
Settings → BARI Chatbot → Bubble Delay
Should be 10000 (10 seconds)
```

### Issue 5: Modal Not Closing

**Possible causes:**
- JavaScript error
- Event listener not working

**Solutions:**
```javascript
// 1. Check console for errors

// 2. Manually close
window.bariChatbotWidget.closeModal();

// 3. Reload page
```

---

## 🔒 Security Best Practices

### 1. Content Security Policy

Add to WordPress (via plugin or .htaccess):

```apache
# .htaccess
Header set Content-Security-Policy "frame-src 'self' https://bajaringan-chatbot.vercel.app;"
```

### 2. HTTPS Only

Ensure both sites use HTTPS:
- ✅ WordPress: `https://bajaringan.com`
- ✅ Chatbot: `https://bajaringan-chatbot.vercel.app`

### 3. Origin Validation

Widget already validates postMessage origin:

```javascript
// Line ~450
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://bajaringan-chatbot.vercel.app') return;
  // Safe to process message
});
```

---

## 📊 Analytics Tracking

### Track Widget Interactions

Add to `bari-chatbot-widget.js`:

```javascript
// Track FAB click
openModal() {
  // ... existing code ...

  // Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'chatbot_open', {
      event_category: 'engagement',
      event_label: 'BARI Chatbot'
    });
  }

  // Facebook Pixel
  if (typeof fbq !== 'undefined') {
    fbq('track', 'ChatbotOpen');
  }
}

// Track bubble dismiss
closeBubble() {
  // ... existing code ...

  if (typeof gtag !== 'undefined') {
    gtag('event', 'bubble_dismiss', {
      event_category: 'engagement',
      event_label: 'BARI Bubble'
    });
  }
}
```

---

## 🚀 Performance Optimization

### 1. Lazy Load Iframe

Widget already implements lazy loading:
- Iframe `src` is empty on page load
- Only loads when user clicks FAB
- Loaded once, cached thereafter

### 2. Optimize GIF Size

```bash
# Use online tools to compress GIF
- https://ezgif.com/optimize
- https://www.iloveimg.com/compress-image/compress-gif

# Target: < 500KB for fast loading
```

### 3. CDN for Assets

Upload GIF to CDN:
- Cloudflare
- Amazon CloudFront
- BunnyCDN

Update URL in settings.

### 4. Preload Critical Assets

Add to WordPress `<head>`:

```html
<link rel="preload" href="https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif" as="image">
```

---

## 📈 A/B Testing Ideas

### Test Different Bubble Texts

**Version A:** "Butuh hitung & cek atap? Klik Bari."
**Version B:** "Ada pertanyaan atap? Chat BARI sekarang!"
**Version C:** "Gratis konsultasi atap - Klik disini"

### Test Different Timings

**Version A:** 10 seconds delay
**Version B:** 5 seconds delay
**Version C:** 15 seconds delay

### Test Different Positions

**Version A:** Bottom right
**Version B:** Bottom left
**Version C:** Right side (middle)

---

## 🎯 Next Steps

### After Installation

1. **Monitor Performance**
   - Check page load speed
   - Monitor chatbot usage
   - Track conversion rates

2. **Gather Feedback**
   - Ask users about experience
   - A/B test variations
   - Optimize based on data

3. **Scale & Improve**
   - Add more intents
   - Improve calculator accuracy
   - Expand knowledge base

---

## 📞 Support & Resources

### Documentation
- **Plugin README:** `wordpress-plugin/bajaringan-chatbot/README.md`
- **Chatbot Docs:** `CALCULATOR_FLOW.md`, `NLU_INTEGRATION_SUMMARY.md`

### Contact
- **Website:** https://bajaringan.com
- **Email:** support@bajaringan.com

### Helpful Links
- [WordPress Plugin Development](https://developer.wordpress.org/plugins/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

## ✅ Final Checklist

Before going live:

- [ ] Plugin uploaded & activated
- [ ] Settings configured correctly
- [ ] GIF URL working
- [ ] Chatbot URL correct
- [ ] CORS headers added to Vercel
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested on all major browsers
- [ ] Bubble timing feels right
- [ ] Modal opens/closes smoothly
- [ ] No console errors
- [ ] Analytics tracking works
- [ ] Performance acceptable
- [ ] Backup created

---

**Congratulations! 🎉**

Your BARI Chatbot Widget is now live on WordPress!

Users will see:
1. Beautiful animated GIF FAB in corner
2. Helpful bubble after 10 seconds
3. Smooth modal with chatbot
4. Responsive experience on all devices

**Built with ❤️ by Bajaringan Team**
