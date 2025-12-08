# BARI Chatbot Widget - Changelog

## Version 2.1 - December 4, 2025

### 🎨 Visual Improvements

#### Close Button
- ✅ Removed background circle and border
- ✅ Increased icon size: 18px → 24px
- ✅ Transparent background blends with gradient header
- ✅ Thicker stroke (2px) for better visibility
- ✅ Minimal hover effect (subtle background tint)

#### Floating Button
- ✅ Removed all backgrounds and shadows
- ✅ Shows only the GIF animation (pure, no circle)
- ✅ Clean, modern appearance

#### Modal Header
- ✅ Changed gradient: Yellow → Blue (#2E3A59 → #52689F)
- ✅ Matches footer design
- ✅ Static PNG image instead of GIF
- ✅ White text for better contrast
- ✅ Transparent image backgrounds

### 📍 Position Updates

| Device  | Bottom | Right  | Size |
|---------|--------|--------|------|
| Desktop | 120px  | 80px   | 80px |
| Tablet  | 100px  | 40px   | 68px |
| Mobile  | 90px   | 30px   | 62px |

**Benefits:**
- More visible (higher position)
- Better spacing from edge (moved left)
- Doesn't overlap footer
- Optimized for all screen sizes

### 🔧 Technical Changes

**Configuration:**
```javascript
bariIconUrl: 'BARI-Gif.gif'        // For floating button
bariStaticIconUrl: 'BARI-scaled.png' // For modal header
```

**CSS Updates:**
- Floating button: `background: none`, `box-shadow: none`, `border-radius: 0`
- Close button: `background: transparent`, `border: none`, size: `40px`, icon: `24px`
- Positioning: Moved right offset from 32px → 80px (desktop)

### 📦 Files Modified
- `/wordpress-plugin/bajaringan-chatbot/js/bari-chatbot-widget.js`

### 🚀 Deployment Steps

1. **Upload** updated `bari-chatbot-widget.js` to:
   ```
   /wp-content/plugins/bajaringan-chatbot/js/
   ```

2. **Clear cache**:
   - Browser cache (Ctrl+Shift+R / Cmd+Shift+R)
   - WordPress cache (if using caching plugin)
   - CDN cache (if applicable)

3. **Test** on:
   - Desktop (Chrome, Firefox, Safari)
   - Tablet (iPad, Android tablet)
   - Mobile (iPhone, Android phone)

4. **Verify images are accessible**:
   - https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif
   - https://bajaringan.com/wp-content/uploads/2025/12/BARI-scaled.png

### ✅ Quality Checklist

**Visual:**
- [ ] GIF displays without background circle
- [ ] Close button visible and clickable
- [ ] Modal gradient matches footer
- [ ] Text is readable

**Functional:**
- [ ] Widget opens/closes smoothly
- [ ] Hover effects work
- [ ] Responsive on all devices
- [ ] No console errors

**Position:**
- [ ] Widget not too close to edge
- [ ] Doesn't overlap footer
- [ ] Speech bubble aligned correctly
- [ ] Modal opens in right position

---

## Previous Versions

### Version 2.0 - Initial Redesign
- Implemented blue gradient header
- Added static PNG for modal
- Repositioned to "sweet spot"

### Version 1.0 - Initial Release
- Basic floating button widget
- Yellow gradient header
- Simple positioning
