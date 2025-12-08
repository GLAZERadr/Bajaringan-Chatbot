# BARI Chatbot Widget for WordPress

Floating chatbot widget dengan animated GIF icon dan auto-show bubble notification.

## 🚀 Features

- ✅ **Animated GIF Icon** - Menggunakan BARI robot GIF yang eye-catching
- ✅ **Auto-show Bubble** - Bubble notification muncul otomatis setelah 10 detik
- ✅ **Auto-hide** - Bubble auto-hide setelah 3 detik
- ✅ **Responsive Design** - Mobile & desktop friendly
- ✅ **Fully Customizable** - Settings panel di WordPress admin
- ✅ **Zero Dependencies** - Pure vanilla JavaScript
- ✅ **Performance Optimized** - Lazy load iframe, minimal overhead

## 📦 Installation

### Method 1: Manual Upload

1. **Download** folder `bajaringan-chatbot`
2. **Zip** folder tersebut menjadi `bajaringan-chatbot.zip`
3. Login ke **WordPress Admin**
4. Navigate ke **Plugins → Add New → Upload Plugin**
5. **Upload** file zip dan klik **Install Now**
6. **Activate** plugin

### Method 2: FTP Upload

1. **Upload** folder `bajaringan-chatbot` ke `/wp-content/plugins/`
2. Login ke **WordPress Admin**
3. Navigate ke **Plugins**
4. **Activate** "BARI Chatbot Widget"

## ⚙️ Configuration

### 1. Go to Settings

Navigate to: **Settings → BARI Chatbot**

### 2. General Settings Tab

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Widget** | Show/hide widget on website | Enabled |
| **Chatbot URL** | URL chatbot Vercel kamu | `https://bajaringan-chatbot.vercel.app/chat` |
| **Icon URL (GIF)** | URL BARI robot animated GIF | `https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif` |
| **Header Title** | Judul di header modal | BARI |
| **Header Subtitle** | Subtitle di header modal | Asisten Atap & Baja Ringan |

### 3. Bubble Notification Tab

| Setting | Description | Default |
|---------|-------------|---------|
| **Bubble Delay** | Waktu sebelum bubble muncul (ms) | 10000 (10 detik) |
| **Bubble Duration** | Waktu bubble tampil (ms) | 3000 (3 detik) |
| **Bubble Text** | Text notification | Butuh hitung & cek atap? Klik Bari. |

### 4. Preview Tab

Lihat preview widget sebelum live di website.

## 🎨 Customization

### Change Colors

Edit file `js/bari-chatbot-widget.js`:

```javascript
// Line ~50: FAB gradient
background: linear-gradient(135deg, #FDB913 0%, #F59E0B 100%);

// Line ~250: Modal header gradient
background: linear-gradient(135deg, #FDB913 0%, #F59E0B 100%);

// Line ~380: Spinner color
border-top-color: #FDB913;
```

### Change Position

Default: Bottom right corner

For bottom left, edit CSS:

```javascript
// Line ~42
.bari-fab {
  bottom: 24px;
  left: 24px;  // Change from 'right'
  right: auto;
}
```

### Change Size

```javascript
// Line ~45
.bari-fab {
  width: 80px;   // Increase/decrease
  height: 80px;
}
```

## 🔧 Advanced Usage

### Programmatic Control

Access widget instance:

```javascript
// Open modal
window.bariChatbotWidget.openModal();

// Close modal
window.bariChatbotWidget.closeModal();

// Show bubble
window.bariChatbotWidget.showBubble();

// Hide bubble
window.bariChatbotWidget.hideBubble();
```

### PostMessage Communication

Send messages from chatbot to widget:

```javascript
// In chatbot iframe
window.parent.postMessage({
  action: 'close'
}, 'https://your-wordpress-site.com');
```

Widget listens for:
- `{ action: 'close' }` - Close modal

### Custom Events

```javascript
// Listen for widget open
document.addEventListener('bariChatbotOpened', function() {
  console.log('Chatbot opened');
});

// Listen for widget close
document.addEventListener('bariChatbotClosed', function() {
  console.log('Chatbot closed');
});
```

## 🧪 Testing

### Desktop

- [ ] FAB muncul dengan GIF animasi
- [ ] Setelah 10 detik → bubble muncul
- [ ] Bubble auto-hide setelah 3 detik
- [ ] FAB pulse animation saat bubble visible
- [ ] Click FAB → modal terbuka
- [ ] Click X atau overlay → modal tertutup
- [ ] ESC key → modal tertutup

### Mobile

- [ ] FAB responsive size (68px)
- [ ] Modal fullscreen
- [ ] Bubble tidak overflow
- [ ] Touch gestures work

## 🔒 Security

### CORS Headers Required

Add to `next.config.ts` (Vercel chatbot):

```typescript
const nextConfig = {
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
            value: "frame-ancestors 'self' https://your-wordpress-site.com"
          }
        ]
      }
    ];
  }
};
```

### Iframe Sandbox

Widget uses secure sandbox attributes:

```html
<iframe sandbox="allow-same-origin allow-scripts allow-forms allow-popups">
```

## 📱 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | ✅ Latest |
| Firefox | ✅ Latest |
| Safari | ✅ Latest |
| Edge | ✅ Latest |
| Mobile Safari | ✅ iOS 12+ |
| Chrome Mobile | ✅ Latest |

## 🐛 Troubleshooting

### Widget Not Showing

1. Check plugin is **activated**
2. Check **Enable Widget** is checked in settings
3. Clear browser cache
4. Check for JavaScript errors in console

### Iframe Not Loading

1. Verify **Chatbot URL** is correct
2. Check CORS headers on Vercel
3. Check `X-Frame-Options` header
4. Open browser console for errors

### Bubble Not Appearing

1. Check **Bubble Delay** setting
2. Try manually: `window.bariChatbotWidget.showBubble()`
3. Check if user already dismissed it (reload page)

### GIF Not Animating

1. Verify GIF URL is correct
2. Check GIF file is valid
3. Test URL in new tab
4. Try different GIF URL

## 📄 File Structure

```
bajaringan-chatbot/
├── bajaringan-chatbot.php    # Main plugin file
├── js/
│   └── bari-chatbot-widget.js # Widget JavaScript
└── README.md                  # This file
```

## 🔄 Updates

### Version 2.0.0 (Current)
- ✅ Animated GIF support
- ✅ Auto-show bubble notification
- ✅ WordPress settings panel
- ✅ Responsive design
- ✅ Activity tracking

### Future Features
- [ ] Multiple chatbot instances
- [ ] A/B testing for bubble text
- [ ] Analytics integration
- [ ] Custom CSS editor
- [ ] Shortcode support

## 💡 Tips

1. **Use Small GIF** - Keep GIF under 500KB for fast loading
2. **Optimize Bubble Text** - Keep it short (max 50 characters)
3. **Test Timing** - 10-15 seconds works best for most sites
4. **Mobile First** - Always test on mobile devices
5. **Track Engagement** - Monitor conversion rates

## 📞 Support

- **Website**: https://bajaringan.com
- **Email**: support@bajaringan.com
- **Documentation**: https://docs.bajaringan.com

## 📜 License

GPL v2 or later

---

Built with ❤️ by Bajaringan Team
