# Widget Positioning Guide - BARI Chatbot

## Desktop Layout (1024px+)

```
┌─────────────────────────────────────────────────────┐
│                  Header/Navigation                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│                    Page Content                      │
│                                                      │
│                                                      │
│                                              ┌─────┐ │
│                                              │     │ │
│                                              │ 🤖  │ │ ← Widget at "Sweet Spot"
│                                              │BARI│ │   bottom: 120px
│                                              └─────┘ │   right: 32px
│                                                      │
│                                                      │
│                                                      │
├─────────────────────────────────────────────────────┤
│                      Footer                          │
│                   (120px height)                     │
└─────────────────────────────────────────────────────┘
```

## Positioning Breakdown

### Desktop (1024px - 1920px+)
```css
.bari-fab {
  bottom: 120px;  /* Above footer */
  right: 32px;    /* From right edge */
  width: 80px;
  height: 80px;
}

.bari-bubble {
  bottom: 215px;  /* 95px above FAB */
  right: 32px;
}

.bari-modal {
  bottom: 215px;  /* Same as bubble */
  right: 32px;
  width: 420px;
  height: 640px;
}
```

### Tablet (768px - 1023px)
```css
.bari-fab {
  bottom: 100px;  /* Slightly lower */
  right: 24px;    /* Less margin */
  width: 68px;    /* Smaller */
  height: 68px;
}

.bari-bubble {
  bottom: 180px;  /* 80px above FAB */
  right: 24px;
}

.bari-modal {
  bottom: 0;      /* Full screen */
  right: 0;
  left: 0;
  width: 100%;
  height: 85vh;
}
```

### Mobile (320px - 767px)
```css
.bari-fab {
  bottom: 90px;   /* Above mobile nav */
  right: 20px;
  width: 62px;    /* Smallest */
  height: 62px;
}

.bari-bubble {
  bottom: 162px;  /* 72px above FAB */
  right: 20px;
  max-width: calc(100vw - 100px);
}

.bari-modal {
  bottom: 0;
  right: 0;
  left: 0;
  width: 100%;
  height: 90vh;
}
```

## Why "Sweet Spot" Position?

### Benefits:
✅ **More Visible**: Higher up the page, catches user attention earlier
✅ **Non-Intrusive**: Doesn't block footer links or copyright info
✅ **Thumb-Friendly**: On mobile, positioned in natural thumb reach zone
✅ **Consistent**: Maintains same relative position across breakpoints
✅ **Accessible**: Never covered by footer or bottom navigation

### Spacing Logic:
```
Footer Height: ~120px (typical)
Widget Height: 80px (desktop)
Safe Margin: 0px (widget bottom edge aligns with footer top)

Total from bottom: 120px
```

## Visual States

### State 1: Idle (Default)
```
┌─────┐
│ 🤖  │  ← Animated GIF
│BARI│     Transparent background
└─────┘     Floating with shadow
```

### State 2: With Bubble
```
  ┌──────────────────────────┐
  │ Butuh hitung & cek atap? │
  │ Klik Bari.          ✕   │
  └────────────┬─────────────┘
               ▼
            ┌─────┐
            │ 🤖  │  ← Pulsing animation
            │BARI│
            └─────┘
```

### State 3: Modal Open
```
┌───────────────────────────────────┐
│ 🤖 BARI                        ✕ │ ← Blue gradient
│   Asisten Atap & Baja Ringan     │   Static PNG
├───────────────────────────────────┤
│                                   │
│       Chatbot Interface          │
│         (iframe)                 │
│                                   │
│                                   │
│                                   │
└───────────────────────────────────┘
```

## Collision Avoidance

### Elements to Avoid:
- ❌ Footer content (links, social icons, copyright)
- ❌ Mobile bottom navigation bars
- ❌ Cookie consent banners (typically bottom: 0)
- ❌ Floating action buttons from other plugins

### Safe Zones:
- ✅ Right side padding (32px desktop, 20px mobile)
- ✅ Bottom clearance (120px desktop, 90px mobile)
- ✅ Modal doesn't cover entire viewport (leaves top margin)

## Testing Scenarios

### Scenario 1: Long Page (Footer Visible)
```
Page scrolled down → Footer visible → Widget above footer
✅ Widget doesn't overlap footer
✅ Widget clickable
✅ Modal opens correctly
```

### Scenario 2: Short Page (No Scroll)
```
Single viewport page → No scroll → Widget in bottom-right
✅ Widget visible on load
✅ Doesn't cover main CTA buttons
✅ Speech bubble has room to display
```

### Scenario 3: Mobile with Bottom Nav
```
Mobile device → Bottom nav bar (50-60px) → Widget above nav
✅ Widget above nav bar (90px clearance)
✅ Thumb-reachable
✅ Modal slides up from bottom
```

## Responsive Breakpoint Summary

| Screen Size | FAB Bottom | FAB Right | FAB Size | Bubble Bottom |
|------------|-----------|-----------|----------|--------------|
| Desktop    | 120px     | 32px      | 80px     | 215px        |
| Tablet     | 100px     | 24px      | 68px     | 180px        |
| Mobile     | 90px      | 20px      | 62px     | 162px        |

## Z-Index Layers

```
10000 - Modal
 9999 - Modal Overlay
 9998 - FAB Button
 9997 - Speech Bubble
```

All z-index values ensure widget appears above:
- Page content (z-index: auto)
- Footer elements (z-index: 1-100)
- Most third-party widgets (z-index: 1000-5000)

## Accessibility Notes

- **Keyboard Navigation**: Modal closes with ESC key
- **Screen Readers**: Proper ARIA labels on all buttons
- **Focus Management**: Focus trapped in modal when open
- **Color Contrast**: WCAG AA compliant (white text on blue: 7.21:1)
- **Touch Targets**: Minimum 44x44px (FAB exceeds this)
- **Reduced Motion**: No animations for users with prefers-reduced-motion
