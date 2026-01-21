# Knowledge Management System - BARI AI Assistant

**Version:** 1.0.0
**Last Updated:** 2025-12-21
**Project:** Bajaringan Calculator - AI Assistant

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [User Personas](#user-personas)
4. [UI/UX Design](#uiux-design)
5. [WordPress Authentication](#wordpress-authentication)
6. [Database Schema](#database-schema)
7. [User Workflows](#user-workflows)
8. [API Integration](#api-integration)
9. [Implementation Guide](#implementation-guide)
10. [Security Considerations](#security-considerations)

---

## 1. Executive Summary

### 1.1 Overview

Knowledge Management System adalah sistem pengelolaan basis pengetahuan untuk BARI AI Assistant yang memungkinkan admin untuk menambah, mengedit, dan mengelola konten pengetahuan yang digunakan oleh AI chatbot.

### 1.2 Key Features

✅ **WordPress-Based CMS** - Interface yang familiar untuk non-technical users
✅ **No Query Limits** - Unlimited queries untuk semua user (guest dan logged-in)
✅ **Role-Based Access Control** - Granular permissions berdasarkan WordPress roles
✅ **WYSIWYG Editor** - Rich text editor untuk kemudahan editing
✅ **Versioning System** - Track semua perubahan dengan rollback capability
✅ **AI Preview** - Test response AI sebelum publish
✅ **Analytics Dashboard** - Insight tentang popular topics dan usage patterns
✅ **REST API** - Seamless integration dengan Next.js AI system

### 1.3 Technology Stack

**Frontend (Admin Panel):**
- WordPress 6.0+
- PHP 8.0+
- JavaScript (ES6+)
- CSS3 with custom design system

**Backend:**
- PostgreSQL 14+ with pgvector extension
- WordPress REST API
- JWT Authentication

**AI Integration:**
- Next.js 16.0.7
- React 19.2.0
- Google Gemini 2.5 Flash
- BGE-M3 Embeddings

### 1.4 User Benefits

| User Type | Benefits |
|-----------|----------|
| **Guest Users** | ✅ Unlimited queries<br>✅ 7-day conversation history<br>✅ No registration required<br>✅ Fast responses |
| **Logged-In Users** | ✅ Unlimited queries<br>✅ Cross-device history<br>✅ Personalized responses<br>✅ Procurement whisper (if applicable) |
| **Admins** | ✅ Easy knowledge management<br>✅ Analytics & insights<br>✅ Bulk operations<br>✅ Version control |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         END USER INTERACTION                        │
│                                                                     │
│  ┌──────────────────┐                    ┌──────────────────┐      │
│  │  GUEST USER      │                    │  LOGGED-IN USER  │      │
│  │                  │                    │                  │      │
│  │ • Unlimited      │                    │ • Unlimited      │      │
│  │   queries        │                    │   queries        │      │
│  │ • localStorage   │                    │ • Cross-device   │      │
│  │   history        │                    │   history        │      │
│  │ • 7-day expiry   │                    │ • Personalized   │      │
│  │                  │                    │ • Procurement    │      │
│  └────────┬─────────┘                    └────────┬─────────┘      │
│           │                                       │                │
│           └───────────────┬───────────────────────┘                │
│                           │                                        │
└───────────────────────────┼────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS AI SYSTEM (Port 3000)                    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ API Route: /api/query                                          ││
│  │                                                                ││
│  │ 1. Intent Detection (NLU)                                      ││
│  │ 2. Q&A Knowledge Matching                                      ││
│  │ 3. WordPress Knowledge Search ─────────┐                       ││
│  │ 4. RAG with Vector Search              │                       ││
│  │ 5. LLM Generation (Gemini 2.5 Flash)   │                       ││
│  │ 6. Stream Response                     │                       ││
│  └────────────────────────────────────────┼───────────────────────┘│
│                                            │                        │
│  ┌────────────────────────────────────────┼───────────────────────┐│
│  │ Services                               │                       ││
│  │ • IntentDetector                       │                       ││
│  │ • IntentHandlers                       │                       ││
│  │ • QAMatcher                            │                       ││
│  │ • WordPressKnowledgeService ◄──────────┘                       ││
│  │ • VectorDB (NeonDB + pgvector)                                 ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                            │
                            │ REST API
                            │ GET /wp-json/bari/v1/knowledge/search
                            │ POST /wp-json/bari/v1/knowledge/{id}/track
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              WORDPRESS CMS (Knowledge Management)                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Admin Panel - Knowledge Management                             ││
│  │                                                                ││
│  │ ✅ Login Required (WordPress Authentication)                   ││
│  │ ✅ Role-Based Access (Administrator, Editor, Author)           ││
│  │                                                                ││
│  │ Features:                                                      ││
│  │ • Dashboard with analytics (popular knowledge, total usage)    ││
│  │ • Create/Edit Knowledge (WYSIWYG editor)                       ││
│  │ • Categories & Tags                                            ││
│  │ • Versioning & History                                         ││
│  │ • Bulk Import/Export                                           ││
│  │ • AI Preview (test before publish)                             ││
│  │ • API Key Management                                           ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ REST API Endpoints                                             ││
│  │                                                                ││
│  │ GET  /wp-json/bari/v1/knowledge                                ││
│  │ GET  /wp-json/bari/v1/knowledge/search?q=...                   ││
│  │ POST /wp-json/bari/v1/knowledge/{id}/track                     ││
│  │ POST /wp-json/bari/v1/knowledge/preview                        ││
│  │                                                                ││
│  │ Authentication:                                                ││
│  │ • JWT Token (for logged-in users)                              ││
│  │ • API Key (for Next.js ↔ WordPress)                            ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ PostgreSQL Database                                            ││
│  │                                                                ││
│  │ • wp_bari_knowledge (knowledge base)                           ││
│  │ • wp_bari_categories                                           ││
│  │ • wp_bari_knowledge_tags                                       ││
│  │ • wp_bari_knowledge_versions                                   ││
│  │ • wp_bari_conversations (analytics only, NOT for limiting)     ││
│  │ • wp_bari_api_keys                                             ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
┌──────────┐      ┌──────────────┐      ┌─────────────┐
│   User   │─────▶│   Next.js    │─────▶│  WordPress  │
│  Query   │      │  AI System   │      │     CMS     │
└──────────┘      └──────────────┘      └─────────────┘
                         │
                         │ 1. Intent Detection
                         │ 2. WordPress Knowledge Search (API)
                         │ 3. Vector Search (NeonDB)
                         │ 4. LLM Generation
                         │
                         ▼
                  ┌──────────────┐
                  │   Response   │
                  │  (Streamed)  │
                  └──────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │  Save to DB  │
                  │ (Analytics)  │
                  └──────────────┘
```

### 2.3 Component Breakdown

#### WordPress Plugin Components:

```
bajaringan-knowledge-manager/
├── bajaringan-knowledge-manager.php     # Main plugin file
├── includes/
│   ├── class-bkm-core.php               # Core plugin logic
│   ├── class-bkm-admin.php              # Admin interface
│   ├── class-bkm-database.php           # Database operations
│   ├── class-bkm-rest-api.php           # REST API endpoints
│   ├── class-bkm-roles.php              # Role & capability management
│   ├── class-bkm-auth.php               # Authentication handlers
│   ├── class-bkm-jwt-auth.php           # JWT token management
│   └── class-bkm-sync.php               # Sync with Next.js
├── admin/
│   ├── views/
│   │   ├── dashboard.php                # Main dashboard
│   │   ├── knowledge-list.php           # Knowledge list view
│   │   ├── knowledge-edit.php           # Create/Edit form
│   │   ├── settings.php                 # Plugin settings
│   │   └── api-keys.php                 # API key management
│   ├── css/
│   │   └── bkm-admin.css                # Admin styles
│   └── js/
│       └── bkm-admin.js                 # Admin JavaScript
└── assets/
    └── icons/                            # UI icons
```

#### Next.js Integration Components:

```
src/
├── services/
│   └── wordpress-knowledge.service.ts   # WordPress API client
├── types/
│   └── wordpress-knowledge.ts           # TypeScript definitions
└── utils/
    └── session-storage.ts               # localStorage management
```

---

## 3. User Personas

### 3.1 Mas Adi - IT Admin (Administrator Role)

**Profile:**
- Umur: 32 tahun
- Jabatan: IT Manager di Bajaringan
- Tech-savvy: Medium-High
- Goals: Mengelola knowledge base, monitoring performa AI, generate reports

**User Needs:**
- Dashboard analytics yang komprehensif
- Bulk operations untuk efficiency
- API key management untuk integration
- User management dan access control
- Export data untuk reporting

**Pain Points:**
- Terlalu banyak manual work untuk update knowledge
- Sulit track mana knowledge yang paling sering digunakan
- Perlu cara mudah untuk backup dan restore data

### 3.2 Bu Sinta - Content Manager (Editor Role)

**Profile:**
- Umur: 28 tahun
- Jabatan: Content Specialist
- Tech-savvy: Medium
- Goals: Membuat dan update knowledge content yang akurat

**User Needs:**
- WYSIWYG editor yang mudah digunakan
- Preview AI response sebelum publish
- Versioning untuk track changes
- Collaboration features (comments, drafts)
- Search dan filter yang powerful

**Pain Points:**
- Takut salah update dan break AI responses
- Perlu review process sebelum publish
- Sulit organize knowledge dengan banyak categories

### 3.3 Pak Budi - Subject Matter Expert (Author/Contributor Role)

**Profile:**
- Umur: 45 tahun
- Jabatan: Senior Technical Consultant
- Tech-savvy: Low-Medium
- Goals: Contribute domain knowledge tentang baja ringan dan atap

**User Needs:**
- Simple form untuk submit knowledge
- Tidak perlu tahu technical details
- Clear guidance tentang format content
- Draft mode untuk submit tanpa publish

**Pain Points:**
- Tidak familiar dengan CMS interface
- Takut "rusak" sesuatu kalau salah klik
- Perlu bantuan untuk formatting text

---

## 4. UI/UX Design

### 4.1 Design System

#### Color Palette

```css
/* Primary Colors */
--bari-primary: #2563EB;      /* Blue - Main brand color */
--bari-primary-dark: #1E40AF; /* Dark blue for hover states */
--bari-primary-light: #DBEAFE; /* Light blue for backgrounds */

/* Semantic Colors */
--bari-success: #10B981;      /* Green - Success states */
--bari-warning: #F59E0B;      /* Orange - Warning states */
--bari-danger: #EF4444;       /* Red - Error states */
--bari-info: #3B82F6;         /* Blue - Info states */

/* Neutral Colors */
--bari-gray-50: #F9FAFB;
--bari-gray-100: #F3F4F6;
--bari-gray-200: #E5E7EB;
--bari-gray-300: #D1D5DB;
--bari-gray-400: #9CA3AF;
--bari-gray-500: #6B7280;
--bari-gray-600: #4B5563;
--bari-gray-700: #374151;
--bari-gray-800: #1F2937;
--bari-gray-900: #111827;

/* Status Colors */
--bari-status-draft: #6B7280;    /* Gray */
--bari-status-published: #10B981; /* Green */
--bari-status-archived: #F59E0B;  /* Orange */
```

#### Typography

```css
/* Font Family */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Courier New', monospace;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

#### Spacing

```css
/* Spacing Scale (based on 4px grid) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

#### Components

```css
/* Border Radius */
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-full: 9999px;  /* Full rounded */

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 4.2 Page Layouts

#### 4.2.1 Dashboard

```
┌────────────────────────────────────────────────────────────────┐
│  BARI Knowledge Management        [🔍 Search] [@] Mas Adi ▼   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 Dashboard                                                  │
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ 📚 Total     │ │ 👁️  Views     │ │ 💬 Questions │          │
│  │ Knowledge    │ │ This Month   │ │ Answered     │          │
│  │              │ │              │ │              │          │
│  │     248      │ │   12,453     │ │   8,921      │          │
│  │   +12 new    │ │   +23%       │ │   +15%       │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📈 Popular Knowledge (Last 7 Days)                     │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ 1. Cara menghitung kebutuhan baja ringan    1,234 views│   │
│  │ 2. Harga genteng metal per meter              892 views│   │
│  │ 3. Perbedaan rangka canal C dan reng          654 views│   │
│  │ 4. Cara mengatasi atap bocor                  543 views│   │
│  │ 5. Estimasi biaya pemasangan atap             432 views│   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📝 Recent Activity                                     │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ 🟢 Bu Sinta updated "Harga Genteng Metal"  2 mins ago  │   │
│  │ 🟡 Pak Budi created draft "Perawatan Atap" 1 hour ago  │   │
│  │ 🔵 Mas Adi published "Garansi Produk"      3 hours ago │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ⚡ Quick Actions                                        │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ [+ Add Knowledge] [📤 Import] [📊 View Reports]        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Knowledge List

```
┌────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base                      [+ Add Knowledge]      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [🔍 Search...] [📁 Category ▼] [🏷️ Tag ▼] [📊 Status ▼]      │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │ ☑️ Bulk Actions ▼                    Showing 1-20/248│     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ □ Cara menghitung kebutuhan baja ringan              │     │
│  │   Category: Kalkulator | 🟢 Published | 1,234 views  │     │
│  │   [✏️ Edit] [👁️ View] [📋 Duplicate] [🗑️ Delete]      │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ □ Harga genteng metal per meter                      │     │
│  │   Category: Produk | 🟢 Published | 892 views        │     │
│  │   [✏️ Edit] [👁️ View] [📋 Duplicate] [🗑️ Delete]      │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ □ Perbedaan rangka canal C dan reng                  │     │
│  │   Category: Teknis | 🟢 Published | 654 views        │     │
│  │   [✏️ Edit] [👁️ View] [📋 Duplicate] [🗑️ Delete]      │     │
│  ├──────────────────────────────────────────────────────┤     │
│  │ □ Perawatan atap baja ringan                         │     │
│  │   Category: Maintenance | 🟡 Draft | 0 views         │     │
│  │   [✏️ Edit] [👁️ View] [📋 Duplicate] [🗑️ Delete]      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  [← Prev] [1] [2] [3] ... [13] [Next →]                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 Create/Edit Knowledge Form

```
┌────────────────────────────────────────────────────────────────┐
│  ✏️ Edit Knowledge                                              │
│  [💾 Save Draft] [🚀 Publish] [👁️ Preview AI] [📜 History]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Title *                                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Cara menghitung kebutuhan baja ringan                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Category *                                                    │
│  [Kalkulator ▼]                                                │
│                                                                │
│  Tags (press Enter to add)                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [kalkulator ×] [baja ringan ×] [rangka ×]                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Content *                                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ [B] [I] [U] [🔗] [📷] [•] [#]                             │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Untuk menghitung kebutuhan baja ringan, Anda perlu:     │ │
│  │                                                          │ │
│  │ 1. Ukur panjang dan lebar bangunan                      │ │
│  │ 2. Tentukan model atap (pelana, limas, dll)             │ │
│  │ 3. Tentukan sudut kemiringan atap                       │ │
│  │ 4. Hitung overstek (umumnya 80-120cm)                   │ │
│  │                                                          │ │
│  │ Gunakan kalkulator BARI untuk estimasi otomatis:        │ │
│  │ [Link to calculator]                                     │ │
│  │                                                          │ │
│  │ Hasil akan mencakup:                                     │ │
│  │ • Rangka utama (Canal C)                                │ │
│  │ • Rangka sekunder (Reng)                                │ │
│  │ • Penutup atap                                           │ │
│  │ • Sekrup dan aksesoris                                   │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ☑️ Requires Image (AI expects user to upload image)          │
│                                                                │
│  Keywords (for better matching)                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ kalkulator, hitung, estimasi, material, baja ringan      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Status: 🟢 Published | Last updated: 2 hours ago by Bu Sinta │
│  Version: 3 | [View Version History]                          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 💡 AI Preview                                            │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Test Query: "gimana cara hitung kebutuhan baja ringan?"  │ │
│  │ [🔍 Test AI Response]                                     │ │
│  │                                                          │ │
│  │ AI Response:                                             │ │
│  │ Untuk menghitung kebutuhan baja ringan, saya bisa bantu! │ │
│  │ Pertama, saya perlu info:                                │ │
│  │ 1. Berapa panjang bangunan?                              │ │
│  │ 2. Berapa lebar bangunan?                                │ │
│  │ ...                                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [💾 Save Draft] [🚀 Publish] [❌ Cancel]                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 Mobile Responsive Design

#### Mobile Dashboard (375px width)

```
┌──────────────────────────┐
│ ☰  BARI KB    [@] Adi ▼  │
├──────────────────────────┤
│                          │
│ 📊 Dashboard             │
│                          │
│ ┌──────────────────────┐ │
│ │ 📚 Total Knowledge   │ │
│ │      248             │ │
│ │    +12 new           │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 👁️ Views This Month  │ │
│ │     12,453           │ │
│ │    +23%              │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ 💬 Questions Answered│ │
│ │     8,921            │ │
│ │    +15%              │ │
│ └──────────────────────┘ │
│                          │
│ 📈 Popular Knowledge     │
│ ┌──────────────────────┐ │
│ │ 1. Cara menghitung   │ │
│ │    kebutuhan baja... │ │
│ │    1,234 views       │ │
│ ├──────────────────────┤ │
│ │ 2. Harga genteng...  │ │
│ │    892 views         │ │
│ └──────────────────────┘ │
│                          │
│ [+ Add Knowledge]        │
│                          │
└──────────────────────────┘
```

---

## 5. WordPress Authentication

### 5.1 User Roles & Capabilities

#### Role Hierarchy

```
Administrator (Super Admin)
├── Full access to all features
├── User management
├── Plugin settings
├── API key management
└── System-level operations

Editor (Content Manager)
├── Create/Edit/Publish knowledge
├── View analytics
├── Bulk operations
└── Cannot manage users or settings

Author (Subject Matter Expert)
├── Create knowledge (draft)
├── Edit own knowledge
├── Submit for review
└── Cannot publish directly

Contributor (Limited Author)
├── Create knowledge (draft)
├── Cannot edit after submission
└── Read-only access to published content
```

#### Capability Mapping

```php
// Administrator Capabilities
'bkm_manage_settings'          // Manage plugin settings
'bkm_manage_users'             // Manage user access
'bkm_manage_api_keys'          // Generate/revoke API keys
'bkm_view_analytics'           // View analytics dashboard
'bkm_create_knowledge'         // Create new knowledge
'bkm_edit_knowledge'           // Edit own knowledge
'bkm_edit_others_knowledge'    // Edit others' knowledge
'bkm_publish_knowledge'        // Publish knowledge
'bkm_delete_knowledge'         // Delete own knowledge
'bkm_delete_others_knowledge'  // Delete others' knowledge
'bkm_export_data'              // Export knowledge data
'bkm_import_data'              // Import knowledge data

// Editor Capabilities
'bkm_view_analytics'
'bkm_create_knowledge'
'bkm_edit_knowledge'
'bkm_edit_others_knowledge'
'bkm_publish_knowledge'
'bkm_delete_knowledge'
'bkm_export_data'

// Author Capabilities
'bkm_create_knowledge'
'bkm_edit_knowledge'
'bkm_delete_knowledge'

// Contributor Capabilities
'bkm_create_knowledge'
```

### 5.2 Authentication Flow

#### Login Flow

```
┌─────────────────────────────────────────────┐
│ USER VISITS ADMIN PANEL                     │
│ /wp-admin/admin.php?page=bari-knowledge     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ CHECK AUTHENTICATION                        │
│                                             │
│ is_user_logged_in() === true?              │
└──────────┬──────────────┬───────────────────┘
           │              │
          NO             YES
           │              │
           ▼              ▼
┌──────────────────┐   ┌─────────────────────┐
│ REDIRECT TO      │   │ CHECK CAPABILITY    │
│ LOGIN PAGE       │   │                     │
│                  │   │ current_user_can(   │
│ wp-login.php     │   │  'bkm_create_knowledge'
│ ?redirect_to=    │   │ )                   │
│ admin.php?page=  │   └──────┬──────────┬───┘
│ bari-knowledge   │          │          │
└──────────────────┘         YES        NO
           │                  │          │
           ▼                  ▼          ▼
┌──────────────────┐   ┌──────────┐   ┌────────┐
│ SHOW LOGIN FORM  │   │ SHOW     │   │ SHOW   │
│                  │   │ ADMIN    │   │ ERROR  │
│ Username: ____   │   │ PANEL    │   │ 403    │
│ Password: ____   │   │          │   │        │
│ [Login]          │   │ (Access  │   │ Access │
└──────────────────┘   │ Granted) │   │ Denied │
           │            └──────────┘   └────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ SUBMIT CREDENTIALS                           │
│                                              │
│ wp_authenticate($username, $password)        │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│ VALIDATE & CREATE SESSION                   │
│                                              │
│ 1. Verify credentials against database      │
│ 2. Check user status (active/blocked)       │
│ 3. Create WordPress session cookie          │
│ 4. Redirect to original requested page      │
└──────────────────────────────────────────────┘
```

#### Permission Check at Every Page

```php
// At the top of every admin page
if (!is_user_logged_in()) {
    wp_redirect(wp_login_url(admin_url('admin.php?page=bari-knowledge')));
    exit;
}

if (!current_user_can('bkm_create_knowledge')) {
    wp_die(
        '<h1>Access Denied</h1><p>You do not have permission to access this page.</p>',
        'Access Denied',
        array('response' => 403)
    );
}
```

### 5.3 API Authentication

#### JWT Token Authentication (For Logged-In Users)

```
┌─────────────────────────────────────────────┐
│ USER LOGS IN VIA WORDPRESS                  │
│                                             │
│ POST /wp-json/bari/v1/auth/login            │
│ {                                           │
│   "username": "bu.sinta",                   │
│   "password": "********"                    │
│ }                                           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ GENERATE JWT TOKEN                          │
│                                             │
│ $payload = [                                │
│   'iss' => get_bloginfo('url'),             │
│   'iat' => time(),                          │
│   'exp' => time() + (60 * 60 * 24),         │
│   'data' => [                               │
│     'user_id' => 123,                       │
│     'user_login' => 'bu.sinta',             │
│     'user_role' => 'editor'                 │
│   ]                                         │
│ ];                                          │
│                                             │
│ $token = JWT::encode($payload, SECRET_KEY); │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ RETURN TOKEN TO CLIENT                      │
│                                             │
│ {                                           │
│   "token": "eyJhbGciOiJIUzI1NiIsInR5...",   │
│   "user": {                                 │
│     "id": 123,                              │
│     "login": "bu.sinta",                    │
│     "role": "editor",                       │
│     "capabilities": [...]                   │
│   },                                        │
│   "expires_at": "2025-12-22T10:30:00Z"      │
│ }                                           │
└─────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ CLIENT USES TOKEN FOR API REQUESTS          │
│                                             │
│ GET /wp-json/bari/v1/knowledge              │
│ Headers:                                    │
│   Authorization: Bearer eyJhbGciOiJIUzI1... │
└─────────────────────────────────────────────┘
```

#### API Key Authentication (For Next.js ↔ WordPress)

```
┌─────────────────────────────────────────────┐
│ ADMIN GENERATES API KEY                     │
│                                             │
│ Settings → API Keys → [Generate New Key]   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ CREATE API KEY                              │
│                                             │
│ $api_key = wp_generate_password(32, false); │
│ $hashed = password_hash($api_key, ...)      │
│                                             │
│ INSERT INTO wp_bari_api_keys                │
│ (name, key_hash, permissions, ...)          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ SHOW API KEY ONCE                           │
│                                             │
│ ⚠️ Copy this key now - it won't be shown    │
│    again!                                   │
│                                             │
│ Key: bari_sk_1a2b3c4d5e6f7g8h9i0j...        │
│                                             │
│ [Copy to Clipboard]                         │
└─────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ CONFIGURE NEXT.JS                           │
│                                             │
│ .env.local:                                 │
│ WORDPRESS_API_URL=https://wp.example.com    │
│ WORDPRESS_API_KEY=bari_sk_1a2b3c4d5e...     │
└─────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ NEXT.JS USES API KEY                        │
│                                             │
│ GET /wp-json/bari/v1/knowledge/search       │
│ Headers:                                    │
│   X-API-Key: bari_sk_1a2b3c4d5e6f7g8h9i0j   │
└─────────────────────────────────────────────┘
```

---

## 6. Database Schema

### 6.1 Full Schema Definition

```sql
-- ============================================
-- KNOWLEDGE BASE TABLE
-- ============================================
CREATE TABLE wp_bari_knowledge (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Content
    title VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    category_id BIGINT(20) UNSIGNED,
    keywords TEXT COMMENT 'JSON array of keywords for matching',

    -- Status & Publishing
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        COMMENT 'draft, published, archived',
    requires_image TINYINT(1) NOT NULL DEFAULT 0
        COMMENT 'Whether AI expects user to provide image',

    -- Versioning
    version INT NOT NULL DEFAULT 1,

    -- Analytics (NOT for limiting)
    usage_count BIGINT NOT NULL DEFAULT 0
        COMMENT 'For analytics only - tracks popularity',

    -- Authorship
    created_by BIGINT(20) UNSIGNED,
    updated_by BIGINT(20) UNSIGNED,

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    FULLTEXT KEY idx_search (title, content),
    INDEX idx_status (status),
    INDEX idx_category (category_id),
    INDEX idx_created_at (created_at),
    INDEX idx_usage (usage_count DESC),

    FOREIGN KEY (category_id)
        REFERENCES wp_bari_categories(id)
        ON DELETE SET NULL,
    FOREIGN KEY (created_by)
        REFERENCES wp_users(ID)
        ON DELETE SET NULL,
    FOREIGN KEY (updated_by)
        REFERENCES wp_users(ID)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE wp_bari_categories (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT(20) UNSIGNED DEFAULT NULL,
    display_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY idx_slug (slug),
    INDEX idx_parent (parent_id),

    FOREIGN KEY (parent_id)
        REFERENCES wp_bari_categories(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TAGS TABLE (Many-to-Many with Knowledge)
-- ============================================
CREATE TABLE wp_bari_tags (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY idx_name (name),
    UNIQUE KEY idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- KNOWLEDGE-TAG RELATIONSHIP TABLE
-- ============================================
CREATE TABLE wp_bari_knowledge_tags (
    knowledge_id BIGINT(20) UNSIGNED NOT NULL,
    tag_id BIGINT(20) UNSIGNED NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (knowledge_id, tag_id),
    INDEX idx_tag (tag_id),

    FOREIGN KEY (knowledge_id)
        REFERENCES wp_bari_knowledge(id)
        ON DELETE CASCADE,
    FOREIGN KEY (tag_id)
        REFERENCES wp_bari_tags(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VERSION HISTORY TABLE
-- ============================================
CREATE TABLE wp_bari_knowledge_versions (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    knowledge_id BIGINT(20) UNSIGNED NOT NULL,
    version INT NOT NULL,

    -- Snapshot of content at this version
    title VARCHAR(500),
    content LONGTEXT,
    category_id BIGINT(20) UNSIGNED,
    keywords TEXT,
    status VARCHAR(20),

    -- Change tracking
    changed_fields TEXT COMMENT 'JSON array of changed field names',
    change_summary VARCHAR(500) COMMENT 'User-provided summary of changes',

    -- Metadata
    created_by BIGINT(20) UNSIGNED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_knowledge (knowledge_id, version),

    FOREIGN KEY (knowledge_id)
        REFERENCES wp_bari_knowledge(id)
        ON DELETE CASCADE,
    FOREIGN KEY (created_by)
        REFERENCES wp_users(ID)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CONVERSATIONS TABLE (Analytics Only)
-- ============================================
CREATE TABLE wp_bari_conversations (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- User identification
    user_id BIGINT(20) UNSIGNED DEFAULT NULL
        COMMENT 'NULL for guest users',
    session_id VARCHAR(100) NOT NULL,

    -- Query & Response
    query TEXT NOT NULL,
    response LONGTEXT NOT NULL,

    -- Metadata (JSON)
    metadata JSON COMMENT 'intent, confidence, latency, knowledge_id, etc',

    -- Timestamp
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at),

    FOREIGN KEY (user_id)
        REFERENCES wp_users(ID)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purpose of wp_bari_conversations:
-- ✅ Analytics for admin (most asked questions, popular topics)
-- ✅ Cross-device conversation history for logged-in users
-- ✅ Quality monitoring and improvement
-- ❌ NOT for limiting queries

-- ============================================
-- API KEYS TABLE
-- ============================================
CREATE TABLE wp_bari_api_keys (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT 'Friendly name for the key',
    key_prefix VARCHAR(20) NOT NULL COMMENT 'First 8 chars for identification',
    key_hash VARCHAR(255) NOT NULL COMMENT 'Hashed API key',

    -- Permissions
    permissions JSON COMMENT 'Array of allowed operations',

    -- Status
    is_active TINYINT(1) NOT NULL DEFAULT 1,

    -- Usage tracking
    last_used_at DATETIME DEFAULT NULL,
    usage_count BIGINT NOT NULL DEFAULT 0,

    -- Metadata
    created_by BIGINT(20) UNSIGNED,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL COMMENT 'NULL = never expires',

    PRIMARY KEY (id),
    UNIQUE KEY idx_key_prefix (key_prefix),
    INDEX idx_active (is_active),

    FOREIGN KEY (created_by)
        REFERENCES wp_users(ID)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6.2 Sample Data

```sql
-- Insert sample categories
INSERT INTO wp_bari_categories (name, slug, description, display_order) VALUES
('Kalkulator', 'kalkulator', 'Pertanyaan tentang kalkulasi material', 1),
('Produk', 'produk', 'Informasi produk dan harga', 2),
('Teknis', 'teknis', 'Pertanyaan teknis pemasangan', 3),
('Maintenance', 'maintenance', 'Perawatan dan perbaikan', 4),
('Garansi', 'garansi', 'Informasi garansi produk', 5);

-- Insert sample knowledge
INSERT INTO wp_bari_knowledge
(title, content, category_id, keywords, status, requires_image, created_by)
VALUES
(
    'Cara menghitung kebutuhan baja ringan',
    'Untuk menghitung kebutuhan baja ringan, Anda perlu:\n\n1. Ukur panjang dan lebar bangunan\n2. Tentukan model atap (pelana, limas, dll)\n3. Tentukan sudut kemiringan atap\n4. Hitung overstek (umumnya 80-120cm)\n\nGunakan kalkulator BARI untuk estimasi otomatis.',
    1,
    '["kalkulator", "hitung", "estimasi", "material", "baja ringan"]',
    'published',
    0,
    1
),
(
    'Harga genteng metal per meter',
    'Harga genteng metal bervariasi tergantung jenis:\n\n- Genteng Metal Pasir: Rp 45.000 - Rp 60.000/lembar\n- Genteng Metal Polos: Rp 35.000 - Rp 50.000/lembar\n- Genteng Metal Premium: Rp 70.000 - Rp 100.000/lembar\n\nHarga sudah termasuk PPN. Untuk harga terkini, hubungi sales.',
    2,
    '["harga", "genteng metal", "biaya", "produk"]',
    'published',
    0,
    1
);

-- Insert sample tags
INSERT INTO wp_bari_tags (name, slug) VALUES
('kalkulator', 'kalkulator'),
('baja ringan', 'baja-ringan'),
('genteng metal', 'genteng-metal'),
('harga', 'harga'),
('pemasangan', 'pemasangan');

-- Link tags to knowledge
INSERT INTO wp_bari_knowledge_tags (knowledge_id, tag_id) VALUES
(1, 1), (1, 2),  -- Knowledge 1: kalkulator, baja ringan
(2, 3), (2, 4);  -- Knowledge 2: genteng metal, harga
```

### 6.3 Database Indexes & Performance

```sql
-- Composite index for common query patterns
CREATE INDEX idx_status_category_created
ON wp_bari_knowledge (status, category_id, created_at DESC);

-- Fulltext search optimization
ALTER TABLE wp_bari_knowledge
ADD FULLTEXT INDEX idx_fulltext_search (title, content, keywords);

-- Query to use fulltext search
SELECT id, title,
       MATCH(title, content) AGAINST ('baja ringan' IN NATURAL LANGUAGE MODE) AS relevance
FROM wp_bari_knowledge
WHERE status = 'published'
  AND MATCH(title, content) AGAINST ('baja ringan' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC
LIMIT 10;
```

---

## 7. User Workflows

### 7.1 Guest User Flow (No Limits)

```
┌─────────────────────────────────────────┐
│ USER OPENS CHATBOT WIDGET               │
│ (Not logged in to WordPress)            │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ INITIALIZE SESSION                      │
│                                         │
│ 1. Generate sessionId                   │
│    sessionId = 'guest_' + timestamp     │
│                                         │
│ 2. Load conversation from localStorage  │
│    {                                    │
│      sessionId: 'guest_xxx',            │
│      messages: [],                      │
│      createdAt: Date.now()              │
│    }                                    │
│                                         │
│ 3. Show welcome message                 │
│    "Selamat datang di BARI Assistant!"  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ USER SENDS QUERY                        │
│ (text or text + image)                  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ PROCESS WITH AI                         │
│                                         │
│ 1. POST /api/query                      │
│    {                                    │
│      query: "...",                      │
│      conversationHistory: [...],        │
│      stream: true                       │
│    }                                    │
│                                         │
│ 2. AI Pipeline:                         │
│    ├─ Intent Detection                  │
│    ├─ Q&A Knowledge Matching            │
│    ├─ WordPress Knowledge Search        │
│    └─ RAG with Vector Search            │
│                                         │
│ 3. Stream response to user              │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ DISPLAY RESPONSE                        │
│                                         │
│ - Show streaming text                   │
│ - Show citations (if available)         │
│ - Show calculator results (if triggered)│
│                                         │
│ - Save to localStorage:                 │
│   messages.push({                       │
│     role: 'user',                       │
│     content: query,                     │
│     timestamp: Date.now()               │
│   })                                    │
│   messages.push({                       │
│     role: 'assistant',                  │
│     content: response,                  │
│     timestamp: Date.now()               │
│   })                                    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ USER CONTINUES CONVERSATION             │
│                                         │
│ ✅ User can ask UNLIMITED questions     │
│                                         │
│ Loop back to "USER SENDS QUERY"         │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ SESSION ENDS                            │
│                                         │
│ - User closes widget                    │
│ - Conversation saved in localStorage    │
│ - Can resume later (7 days expiry)      │
└─────────────────────────────────────────┘
```

**Key Points:**
- ❌ No query limits
- ✅ Unlimited questions
- ✅ 7-day conversation history in localStorage
- ✅ Fast responses without authentication overhead

### 7.2 Logged-In User Flow (No Limits)

```
┌─────────────────────────────────────────┐
│ USER LOGGED IN TO WORDPRESS             │
│ (Has active session)                    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ INITIALIZE AUTHENTICATED SESSION        │
│                                         │
│ 1. Detect WordPress login state         │
│    - Check wp_get_current_user()        │
│    - Get user ID, role, name            │
│                                         │
│ 2. Load user profile from WordPress     │
│    GET /wp-json/bari/v1/user/profile    │
│    {                                    │
│      userId: 123,                       │
│      name: "Bu Sinta",                  │
│      role: "editor",                    │
│      isProcurement: false,              │
│      preferences: {...}                 │
│    }                                    │
│                                         │
│ 3. Load conversation history            │
│    - From WordPress database            │
│    - Last 20 messages                   │
│                                         │
│ 4. Show personalized welcome            │
│    "Halo Bu Sinta! Ada yang bisa saya   │
│     bantu hari ini?"                    │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ USER SENDS QUERY                        │
│ (text or text + image)                  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ PROCESS WITH AI + USER CONTEXT          │
│                                         │
│ 1. POST /api/query                      │
│    {                                    │
│      query: "...",                      │
│      userId: 123,                       │
│      userRole: "editor",                │
│      isProcurement: false,              │
│      conversationHistory: [...]         │
│    }                                    │
│                                         │
│ 2. AI Pipeline with Personalization:    │
│    ├─ Intent Detection                  │
│    ├─ Procurement Whisper (if applicable)│
│    ├─ Q&A Knowledge Matching            │
│    ├─ WordPress Knowledge Search        │
│    └─ RAG with User History Context     │
│                                         │
│ 3. Stream response                      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ SAVE TO WORDPRESS DATABASE              │
│                                         │
│ INSERT INTO wp_bari_conversations       │
│ (user_id, query, response, metadata)    │
│ VALUES (                                │
│   123,                                  │
│   'query text',                         │
│   'response text',                      │
│   JSON_OBJECT(                          │
│     'intent': 'kalkulator',             │
│     'confidence': 0.95,                 │
│     'latency_ms': 1234                  │
│   )                                     │
│ )                                       │
│                                         │
│ Purpose:                                │
│ ✅ Analytics and insights               │
│ ✅ User history across devices          │
│ ✅ Support and quality monitoring       │
│ ❌ NOT for limiting queries             │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ DISPLAY RESPONSE                        │
│                                         │
│ - Show streaming text                   │
│ - Show personalized greeting            │
│ - Show citations                        │
│ - Show calculator (if triggered)        │
│ - Show procurement whisper (if applicable)│
│                                         │
│ - Save to localStorage + WordPress DB   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ USER CONTINUES CONVERSATION             │
│                                         │
│ ✅ User can ask UNLIMITED questions     │
│                                         │
│ Benefits of being logged in:            │
│ ✅ Conversation history across devices  │
│ ✅ Personalized responses               │
│ ✅ Procurement whisper (if applicable)  │
│ ✅ Analytics for admin                  │
│                                         │
│ Loop back to "USER SENDS QUERY"         │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ SESSION CONTINUES                       │
│                                         │
│ - User closes widget                    │
│ - History saved in WordPress DB         │
│ - Can resume on any device              │
└─────────────────────────────────────────┘
```

**Key Points:**
- ❌ No daily query limit (removed 50/day limit)
- ✅ Unlimited questions
- ✅ Cross-device conversation history
- ✅ Personalized responses based on user profile
- ✅ Procurement whisper for procurement team
- ✅ Analytics saved for admin insights

### 7.3 Admin Knowledge Management Flow

```
┌─────────────────────────────────────────┐
│ ADMIN LOGS IN TO WORDPRESS              │
│                                         │
│ 1. Navigate to wp-login.php             │
│ 2. Enter credentials                    │
│ 3. WordPress validates & creates session│
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ ACCESS KNOWLEDGE MANAGEMENT             │
│                                         │
│ Navigate to:                            │
│ /wp-admin/admin.php?page=bari-knowledge │
│                                         │
│ Permission Check:                       │
│ ✅ is_user_logged_in()                  │
│ ✅ current_user_can('bkm_create_knowledge')│
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ DASHBOARD VIEW                          │
│                                         │
│ - View statistics                       │
│ - See popular knowledge                 │
│ - Recent activity                       │
│ - Quick actions                         │
│                                         │
│ Admin can:                              │
│ [+ Add Knowledge]                       │
│ [📤 Import]                             │
│ [📊 View Reports]                       │
└──────────┬──────────────────────────────┘
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐   ┌──────────┐
│ CREATE  │   │   EDIT   │
│  NEW    │   │ EXISTING │
└────┬────┘   └────┬─────┘
     │             │
     └──────┬──────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ KNOWLEDGE EDIT FORM                     │
│                                         │
│ 1. Fill in details:                     │
│    - Title *                            │
│    - Content (WYSIWYG editor)           │
│    - Category                           │
│    - Tags                               │
│    - Keywords                           │
│    - Requires Image checkbox            │
│                                         │
│ 2. AI Preview (optional):               │
│    - Test query input                   │
│    - [Test AI Response]                 │
│    - See how AI will respond            │
│                                         │
│ 3. Save options:                        │
│    [💾 Save Draft]                      │
│    [🚀 Publish]                         │
└──────────┬──────────────────────────────┘
           │
           ▼
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐   ┌──────────┐
│  SAVE   │   │ PUBLISH  │
│ DRAFT   │   │          │
└────┬────┘   └────┬─────┘
     │             │
     └──────┬──────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ SAVE TO DATABASE                        │
│                                         │
│ 1. Validate data                        │
│ 2. Save to wp_bari_knowledge            │
│ 3. Create version snapshot              │
│ 4. Process tags                         │
│ 5. Trigger sync webhook (if published)  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ SYNC WITH NEXT.JS (if published)        │
│                                         │
│ POST webhook to Next.js:                │
│ /api/webhooks/knowledge-updated         │
│ {                                       │
│   "event": "knowledge.published",       │
│   "knowledge_id": 123,                  │
│   "action": "update_cache"              │
│ }                                       │
│                                         │
│ Next.js updates its cache               │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ SHOW SUCCESS MESSAGE                    │
│                                         │
│ ✅ Knowledge saved successfully!        │
│                                         │
│ [← Back to List] [✏️ Edit] [👁️ View]    │
└─────────────────────────────────────────┘
```

### 7.4 Bulk Operations Flow

```
┌─────────────────────────────────────────┐
│ ADMIN ON KNOWLEDGE LIST PAGE            │
│                                         │
│ Select multiple knowledge items:        │
│ ☑️ Knowledge 1                          │
│ ☑️ Knowledge 2                          │
│ ☑️ Knowledge 3                          │
│                                         │
│ [Bulk Actions ▼]                        │
└──────────┬──────────────────────────────┘
           │
           ▼
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
    ▼             ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
│ PUBLISH │ │ ARCHIVE │ │ DELETE │ │ EXPORT │
└────┬────┘ └────┬────┘ └───┬────┘ └───┬────┘
     │           │           │          │
     └───────────┴───────────┴──────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ CONFIRM ACTION                          │
│                                         │
│ ⚠️ Are you sure you want to [action]    │
│    3 knowledge items?                   │
│                                         │
│ This action cannot be undone.           │
│                                         │
│ [Cancel] [Confirm]                      │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ PROCESS BULK ACTION                     │
│                                         │
│ FOR EACH selected knowledge:            │
│   1. Validate permission                │
│   2. Perform action                     │
│   3. Log activity                       │
│   4. Trigger sync (if needed)           │
│                                         │
│ Progress: [████████░░] 80% (8/10)       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ SHOW RESULTS                            │
│                                         │
│ ✅ Successfully processed 10 items      │
│    - Published: 8                       │
│    - Failed: 2 (permission denied)      │
│                                         │
│ [View Error Log] [Close]                │
└─────────────────────────────────────────┘
```

---

## 8. API Integration

### 8.1 WordPress REST API Endpoints

#### 8.1.1 Knowledge Endpoints

**GET /wp-json/bari/v1/knowledge**

List all published knowledge

```http
GET /wp-json/bari/v1/knowledge
Headers:
  X-API-Key: bari_sk_1a2b3c4d5e6f7g8h9i0j

Query Parameters:
  - status (optional): draft, published, archived (default: published)
  - category (optional): category slug
  - limit (optional): number of items (default: 20, max: 100)
  - offset (optional): pagination offset (default: 0)

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Cara menghitung kebutuhan baja ringan",
      "content": "Untuk menghitung kebutuhan...",
      "category": {
        "id": 1,
        "name": "Kalkulator",
        "slug": "kalkulator"
      },
      "tags": ["kalkulator", "baja ringan"],
      "keywords": ["kalkulator", "hitung", "estimasi"],
      "requires_image": false,
      "usage_count": 1234,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 248,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**GET /wp-json/bari/v1/knowledge/search**

Search knowledge by query

```http
GET /wp-json/bari/v1/knowledge/search?q=baja%20ringan&limit=5
Headers:
  X-API-Key: bari_sk_1a2b3c4d5e6f7g8h9i0j

Query Parameters:
  - q (required): search query
  - limit (optional): number of results (default: 5, max: 20)
  - category (optional): filter by category slug

Response (200 OK):
{
  "success": true,
  "query": "baja ringan",
  "data": [
    {
      "id": 1,
      "title": "Cara menghitung kebutuhan baja ringan",
      "content": "Untuk menghitung kebutuhan...",
      "category": "Kalkulator",
      "relevance": 0.95,
      "match_type": "title_and_content"
    },
    {
      "id": 3,
      "title": "Perbedaan rangka canal C dan reng",
      "content": "Rangka baja ringan terdiri...",
      "category": "Teknis",
      "relevance": 0.82,
      "match_type": "content"
    }
  ],
  "total_results": 15
}
```

**GET /wp-json/bari/v1/knowledge/{id}**

Get single knowledge by ID

```http
GET /wp-json/bari/v1/knowledge/123
Headers:
  X-API-Key: bari_sk_1a2b3c4d5e6f7g8h9i0j

Response (200 OK):
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Cara menghitung kebutuhan baja ringan",
    "content": "Untuk menghitung kebutuhan...",
    "category": {
      "id": 1,
      "name": "Kalkulator",
      "slug": "kalkulator"
    },
    "tags": ["kalkulator", "baja ringan"],
    "keywords": ["kalkulator", "hitung", "estimasi"],
    "requires_image": false,
    "version": 3,
    "usage_count": 1234,
    "created_by": {
      "id": 2,
      "name": "Bu Sinta",
      "role": "editor"
    },
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:20:00Z"
  }
}

Response (404 Not Found):
{
  "success": false,
  "error": {
    "code": "knowledge_not_found",
    "message": "Knowledge with ID 123 not found"
  }
}
```

**POST /wp-json/bari/v1/knowledge/{id}/track**

Track knowledge usage

```http
POST /wp-json/bari/v1/knowledge/123/track
Headers:
  X-API-Key: bari_sk_1a2b3c4d5e6f7g8h9i0j
  Content-Type: application/json

Body:
{
  "session_id": "guest_1703001234567",
  "user_id": null,
  "query": "bagaimana cara hitung baja ringan?",
  "matched": true
}

Response (200 OK):
{
  "success": true,
  "message": "Usage tracked successfully",
  "new_usage_count": 1235
}
```

**POST /wp-json/bari/v1/knowledge/preview**

Preview AI response (for testing before publish)

```http
POST /wp-json/bari/v1/knowledge/preview
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json

Body:
{
  "title": "Cara menghitung kebutuhan baja ringan",
  "content": "Untuk menghitung kebutuhan...",
  "test_query": "bagaimana cara hitung baja ringan?"
}

Response (200 OK):
{
  "success": true,
  "ai_response": {
    "answer": "Untuk menghitung kebutuhan baja ringan...",
    "confidence": 0.95,
    "matched": true,
    "latency_ms": 1234
  }
}
```

#### 8.1.2 Authentication Endpoints

**POST /wp-json/bari/v1/auth/login**

Login and get JWT token

```http
POST /wp-json/bari/v1/auth/login
Content-Type: application/json

Body:
{
  "username": "bu.sinta",
  "password": "********"
}

Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "login": "bu.sinta",
    "email": "sinta@bajaringan.com",
    "display_name": "Bu Sinta",
    "role": "editor",
    "capabilities": [
      "bkm_view_analytics",
      "bkm_create_knowledge",
      "bkm_edit_knowledge",
      "bkm_publish_knowledge"
    ]
  },
  "expires_at": "2025-12-22T10:30:00Z"
}

Response (401 Unauthorized):
{
  "success": false,
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid username or password"
  }
}
```

**POST /wp-json/bari/v1/auth/refresh**

Refresh JWT token

```http
POST /wp-json/bari/v1/auth/refresh
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2025-12-23T10:30:00Z"
}
```

**POST /wp-json/bari/v1/auth/validate**

Validate JWT token

```http
POST /wp-json/bari/v1/auth/validate
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "success": true,
  "valid": true,
  "user": {
    "id": 123,
    "login": "bu.sinta"
  }
}

Response (401 Unauthorized):
{
  "success": false,
  "valid": false,
  "error": "Token expired"
}
```

#### 8.1.3 Analytics Endpoints

**GET /wp-json/bari/v1/analytics/popular**

Get popular knowledge

```http
GET /wp-json/bari/v1/analytics/popular?days=7&limit=10
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Query Parameters:
  - days (optional): time period (default: 7)
  - limit (optional): number of results (default: 10)

Response (200 OK):
{
  "success": true,
  "period": "last_7_days",
  "data": [
    {
      "id": 1,
      "title": "Cara menghitung kebutuhan baja ringan",
      "category": "Kalkulator",
      "views": 1234,
      "trend": "+15%"
    },
    {
      "id": 2,
      "title": "Harga genteng metal per meter",
      "category": "Produk",
      "views": 892,
      "trend": "+8%"
    }
  ]
}
```

**GET /wp-json/bari/v1/analytics/queries**

Get query statistics

```http
GET /wp-json/bari/v1/analytics/queries?days=30
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response (200 OK):
{
  "success": true,
  "period": "last_30_days",
  "total_queries": 8921,
  "avg_per_day": 297,
  "top_intents": [
    { "intent": "kalkulator", "count": 3245 },
    { "intent": "pertanyaan_produk", "count": 2134 },
    { "intent": "hubungi_sales", "count": 1456 }
  ],
  "satisfaction_rate": 0.87
}
```

### 8.2 Next.js Service Integration

#### 8.2.1 WordPress Knowledge Service

```typescript
// src/services/wordpress-knowledge.service.ts

export interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  tags: string[];
  keywords: string[];
  requires_image: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: number;
  title: string;
  content: string;
  category: string;
  relevance: number;
  match_type: 'exact' | 'title' | 'content' | 'keywords';
}

export class WordPressKnowledgeService {
  private apiUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiUrl = process.env.WORDPRESS_API_URL || '';
    this.apiKey = process.env.WORDPRESS_API_KEY || '';
    this.cache = new Map();

    if (!this.apiUrl || !this.apiKey) {
      console.warn('⚠️  WordPress API not configured');
    }
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(
    query: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    try {
      const cacheKey = `search:${query}:${limit}`;

      // Check cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('✨ Using cached search results');
        return cached;
      }

      console.log(`🔍 Searching WordPress knowledge: "${query}"`);

      const response = await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.setCache(cacheKey, result.data);
        console.log(`✅ Found ${result.data.length} results from WordPress`);
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('❌ Error searching WordPress knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge by ID
   */
  async getKnowledge(id: number): Promise<KnowledgeItem | null> {
    try {
      const cacheKey = `knowledge:${id}`;

      // Check cache
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge/${id}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`WordPress API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        this.setCache(cacheKey, result.data);
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching knowledge:', error);
      return null;
    }
  }

  /**
   * Track knowledge usage
   */
  async trackUsage(
    knowledgeId: number,
    sessionId: string,
    userId: number | null,
    query: string
  ): Promise<void> {
    try {
      await fetch(
        `${this.apiUrl}/wp-json/bari/v1/knowledge/${knowledgeId}/track`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId,
            query,
            matched: true,
          }),
        }
      );

      console.log(`📊 Tracked usage for knowledge #${knowledgeId}`);
    } catch (error) {
      console.error('❌ Error tracking usage:', error);
      // Don't throw - tracking failure shouldn't break the flow
    }
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // LRU eviction (keep max 100 items)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  WordPress knowledge cache cleared');
  }
}

// Singleton instance
let instance: WordPressKnowledgeService | null = null;

export function getWordPressKnowledgeService(): WordPressKnowledgeService {
  if (!instance) {
    instance = new WordPressKnowledgeService();
  }
  return instance;
}
```

#### 8.2.2 Integration with Query Route

```typescript
// src/app/api/query/route.ts (partial update)

import { getWordPressKnowledgeService } from '@/services/wordpress-knowledge.service';

export async function POST(request: NextRequest) {
  // ... existing code ...

  // After Q&A matching and before RAG
  console.log('🔍 Checking WordPress knowledge base...');
  const wpKnowledge = getWordPressKnowledgeService();
  const wpResults = await wpKnowledge.searchKnowledge(query, 3);

  if (wpResults.length > 0 && wpResults[0].relevance >= 0.8) {
    const topResult = wpResults[0];
    console.log(`✅ WordPress match found: ${topResult.title} (relevance: ${topResult.relevance})`);

    // Track usage
    await wpKnowledge.trackUsage(
      topResult.id,
      sessionId,
      userId,
      query
    );

    // Return WordPress knowledge as answer
    return NextResponse.json({
      answer: topResult.content,
      citations: [{
        source: 'wordpress_knowledge',
        title: topResult.title,
        category: topResult.category
      }],
      metadata: {
        source: 'wordpress_knowledge',
        knowledge_id: topResult.id,
        relevance: topResult.relevance,
        latency_ms: Date.now() - startTime
      }
    });
  }

  // Proceed with RAG if no WordPress match
  console.log('📚 No WordPress match, proceeding with RAG...');

  // ... rest of RAG flow ...
}
```

### 8.3 Webhook Integration

#### 8.3.1 WordPress → Next.js Webhook

When knowledge is published/updated in WordPress, trigger webhook to Next.js:

```php
// WordPress plugin: includes/class-bkm-sync.php

class BKM_Sync {
    /**
     * Trigger sync webhook after knowledge publish/update
     */
    public function trigger_sync_webhook($knowledge_id, $action = 'update') {
        $webhook_url = get_option('bkm_nextjs_webhook_url');

        if (empty($webhook_url)) {
            error_log('BKM: Webhook URL not configured');
            return;
        }

        $knowledge = $this->get_knowledge($knowledge_id);

        $payload = array(
            'event' => 'knowledge.' . $action,
            'timestamp' => current_time('mysql'),
            'data' => array(
                'id' => $knowledge->id,
                'title' => $knowledge->title,
                'content' => $knowledge->content,
                'category' => $knowledge->category,
                'status' => $knowledge->status
            )
        );

        $response = wp_remote_post($webhook_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Webhook-Secret' => get_option('bkm_webhook_secret')
            ),
            'body' => json_encode($payload),
            'timeout' => 10
        ));

        if (is_wp_error($response)) {
            error_log('BKM: Webhook failed - ' . $response->get_error_message());
        } else {
            error_log('BKM: Webhook sent successfully for knowledge #' . $knowledge_id);
        }
    }
}

// Hook into save_post
add_action('bkm_knowledge_published', array($sync, 'trigger_sync_webhook'), 10, 2);
add_action('bkm_knowledge_updated', array($sync, 'trigger_sync_webhook'), 10, 2);
```

#### 8.3.2 Next.js Webhook Handler

```typescript
// src/app/api/webhooks/knowledge-updated/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getWordPressKnowledgeService } from '@/services/wordpress-knowledge.service';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    console.log('🔔 Webhook received:', payload.event);

    // Clear cache for updated knowledge
    const wpKnowledge = getWordPressKnowledgeService();
    wpKnowledge.clearCache();

    console.log('✅ Cache cleared, fresh data will be fetched on next query');

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

## 9. Implementation Guide

### 9.1 WordPress Plugin Installation

#### Step 1: Upload Plugin

```bash
# Via FTP/SFTP
1. Upload `bajaringan-knowledge-manager` folder to `/wp-content/plugins/`

# Via WordPress Admin
1. Navigate to Plugins → Add New
2. Click "Upload Plugin"
3. Choose `bajaringan-knowledge-manager.zip`
4. Click "Install Now"
```

#### Step 2: Activate Plugin

```bash
1. Navigate to Plugins → Installed Plugins
2. Find "Bajaringan Knowledge Manager"
3. Click "Activate"
```

#### Step 3: Configure Database

Plugin will auto-create tables on activation. Verify with:

```sql
-- Check if tables exist
SHOW TABLES LIKE 'wp_bari_%';

-- Expected tables:
-- wp_bari_knowledge
-- wp_bari_categories
-- wp_bari_tags
-- wp_bari_knowledge_tags
-- wp_bari_knowledge_versions
-- wp_bari_conversations
-- wp_bari_api_keys
```

#### Step 4: Configure Settings

```bash
1. Navigate to BARI Knowledge → Settings
2. Configure:
   - Next.js API URL: https://your-nextjs-app.com
   - Webhook Secret: (generate random string)
   - API Key: (will be generated)
3. Save settings
```

#### Step 5: Set User Permissions

```bash
1. Navigate to Users → All Users
2. For each user, assign appropriate role:
   - Administrator: Full access
   - Editor: Can create, edit, publish
   - Author: Can create, edit own
   - Contributor: Can create drafts only
```

### 9.2 Next.js Configuration

#### Step 1: Environment Variables

```bash
# .env.local

# WordPress API Configuration
WORDPRESS_API_URL=https://your-wordpress-site.com
WORDPRESS_API_KEY=bari_sk_1a2b3c4d5e6f7g8h9i0j...

# Webhook Secret (must match WordPress setting)
WEBHOOK_SECRET=your-random-secret-string

# Existing environment variables
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
```

#### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

#### Step 3: Create Service Files

```bash
# Create WordPress knowledge service
src/services/wordpress-knowledge.service.ts

# Create TypeScript types
src/types/wordpress-knowledge.ts

# Create webhook handler
src/app/api/webhooks/knowledge-updated/route.ts
```

#### Step 4: Update Query Route

```bash
# Update src/app/api/query/route.ts
# Add WordPress knowledge search before RAG
# See section 8.2.2 for implementation
```

#### Step 5: Test Integration

```bash
# Start Next.js dev server
npm run dev

# Test WordPress API connection
curl -H "X-API-Key: bari_sk_..." \
  https://your-wordpress-site.com/wp-json/bari/v1/knowledge

# Should return list of knowledge
```

### 9.3 Testing Checklist

#### WordPress Plugin Testing

```
✅ Plugin activates without errors
✅ Database tables created correctly
✅ Admin panel accessible at /wp-admin/admin.php?page=bari-knowledge
✅ Can create new knowledge
✅ Can edit existing knowledge
✅ Can publish knowledge
✅ WYSIWYG editor works correctly
✅ Tags and categories work
✅ Version history saved correctly
✅ AI preview works
✅ Bulk operations work
✅ API endpoints return correct data
✅ Authentication works (login required)
✅ Permissions work (role-based access)
✅ API key generation works
```

#### Next.js Integration Testing

```
✅ WordPress knowledge service connects successfully
✅ Search knowledge returns results
✅ Cache works correctly
✅ Webhook clears cache on update
✅ Query route integrates WordPress knowledge
✅ Conversation saved to database
✅ Analytics tracked correctly
✅ No query limits enforced
```

#### End-to-End Testing

```
✅ User asks question
✅ AI searches WordPress knowledge
✅ Returns correct answer
✅ Usage tracked in WordPress
✅ Admin sees analytics
✅ Knowledge update reflects immediately (via webhook)
✅ Guest user has unlimited queries
✅ Logged-in user has unlimited queries
✅ Cross-device history works for logged-in users
```

### 9.4 Deployment

#### WordPress Plugin Deployment

```bash
# Production deployment
1. Backup WordPress database
2. Upload plugin to production server
3. Activate plugin
4. Verify database tables created
5. Configure settings (API keys, webhooks)
6. Test API endpoints
7. Monitor error logs
```

#### Next.js Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel/other hosting
# Ensure environment variables are set

# Verify deployment
curl https://your-nextjs-app.com/api/query \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "stream": false}'
```

#### SSL Configuration

```bash
# WordPress wp-config.php
define('FORCE_SSL_ADMIN', true);

# Ensure SSL certificates are valid
# Update database URLs to use HTTPS
UPDATE wp_options
SET option_value = 'https://your-site.com'
WHERE option_name IN ('siteurl', 'home');
```

---

## 10. Security Considerations

### 10.1 Authentication Security

#### Password Policy

```php
// Enforce strong passwords
add_filter('password_policy_requirements', function($requirements) {
    return array(
        'min_length' => 12,
        'require_uppercase' => true,
        'require_lowercase' => true,
        'require_numbers' => true,
        'require_special' => true
    );
});
```

#### Session Security

```php
// wp-config.php

// Session timeout (2 hours)
define('WP_SESSION_TIMEOUT', 7200);

// Force logout after inactivity
add_filter('auth_cookie_expiration', function($expiration) {
    return 7200; // 2 hours
}, 10, 3);

// Secure cookies (HTTPS only)
define('COOKIE_DOMAIN', 'your-domain.com');
define('COOKIEPATH', '/');
define('SITECOOKIEPATH', '/');
define('ADMIN_COOKIE_PATH', '/wp-admin');
```

#### JWT Token Security

```php
// Use strong secret key
define('JWT_SECRET_KEY', wp_generate_password(64, true, true));

// Token expiration (24 hours)
$token_expiration = time() + (60 * 60 * 24);

// Refresh token rotation
// Old tokens invalidated after refresh
```

### 10.2 API Security

#### Rate Limiting

```php
// Implement rate limiting for API requests
class BKM_Rate_Limiter {
    private $max_requests = 100; // per minute
    private $cache_key_prefix = 'bkm_rate_limit_';

    public function check_rate_limit($identifier) {
        $cache_key = $this->cache_key_prefix . md5($identifier);
        $requests = wp_cache_get($cache_key);

        if ($requests === false) {
            wp_cache_set($cache_key, 1, '', 60);
            return true;
        }

        if ($requests >= $this->max_requests) {
            return false; // Rate limit exceeded
        }

        wp_cache_incr($cache_key);
        return true;
    }
}

// Apply to API endpoints
add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if (strpos($request->get_route(), '/bari/v1/') === 0) {
        $limiter = new BKM_Rate_Limiter();
        $identifier = $request->get_header('x-api-key') ?? $_SERVER['REMOTE_ADDR'];

        if (!$limiter->check_rate_limit($identifier)) {
            return new WP_Error(
                'rate_limit_exceeded',
                'Too many requests. Please try again later.',
                array('status' => 429)
            );
        }
    }

    return $result;
}, 10, 3);
```

#### Input Validation

```php
// Sanitize all inputs
class BKM_Validator {
    public static function sanitize_knowledge_input($data) {
        return array(
            'title' => sanitize_text_field($data['title']),
            'content' => wp_kses_post($data['content']),
            'category_id' => absint($data['category_id']),
            'keywords' => array_map('sanitize_text_field', (array)$data['keywords']),
            'requires_image' => (bool)$data['requires_image']
        );
    }

    public static function validate_knowledge_input($data) {
        $errors = array();

        if (empty($data['title']) || strlen($data['title']) > 500) {
            $errors[] = 'Title must be between 1 and 500 characters';
        }

        if (empty($data['content'])) {
            $errors[] = 'Content is required';
        }

        if (!empty($data['category_id']) && !term_exists($data['category_id'])) {
            $errors[] = 'Invalid category';
        }

        return $errors;
    }
}
```

#### SQL Injection Prevention

```php
// Always use prepared statements
global $wpdb;

// ❌ NEVER do this:
$query = "SELECT * FROM wp_bari_knowledge WHERE id = " . $_GET['id'];

// ✅ ALWAYS do this:
$query = $wpdb->prepare(
    "SELECT * FROM wp_bari_knowledge WHERE id = %d",
    $_GET['id']
);
```

### 10.3 XSS Prevention

```php
// Escape all output
// ❌ NEVER do this:
echo $knowledge->title;

// ✅ ALWAYS do this:
echo esc_html($knowledge->title);

// For HTML content (already sanitized with wp_kses_post):
echo wp_kses_post($knowledge->content);

// For attributes:
echo '<div data-id="' . esc_attr($knowledge->id) . '">';

// For URLs:
echo '<a href="' . esc_url($knowledge->link) . '">';

// For JavaScript:
echo '<script>var title = ' . wp_json_encode($knowledge->title) . ';</script>';
```

### 10.4 CSRF Protection

```php
// Add nonce to forms
<form method="post" action="">
    <?php wp_nonce_field('bkm_save_knowledge', 'bkm_nonce'); ?>
    <!-- form fields -->
</form>

// Verify nonce on submission
if (!isset($_POST['bkm_nonce']) || !wp_verify_nonce($_POST['bkm_nonce'], 'bkm_save_knowledge')) {
    wp_die('Security check failed', 'Security Error', array('response' => 403));
}
```

### 10.5 File Upload Security

```php
// Validate file uploads
class BKM_File_Upload {
    private $allowed_types = array('image/jpeg', 'image/png', 'image/gif');
    private $max_size = 5 * 1024 * 1024; // 5MB

    public function validate_upload($file) {
        // Check file size
        if ($file['size'] > $this->max_size) {
            return new WP_Error('file_too_large', 'File size exceeds 5MB limit');
        }

        // Check MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $this->allowed_types)) {
            return new WP_Error('invalid_file_type', 'Only JPG, PNG, and GIF files are allowed');
        }

        // Check magic bytes (prevent MIME type spoofing)
        $file_contents = file_get_contents($file['tmp_name'], false, null, 0, 12);
        $valid_image = false;

        // JPEG magic bytes
        if (substr($file_contents, 0, 2) === "\xFF\xD8") {
            $valid_image = true;
        }
        // PNG magic bytes
        elseif (substr($file_contents, 0, 8) === "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A") {
            $valid_image = true;
        }
        // GIF magic bytes
        elseif (substr($file_contents, 0, 3) === "GIF") {
            $valid_image = true;
        }

        if (!$valid_image) {
            return new WP_Error('invalid_image', 'File is not a valid image');
        }

        return true;
    }
}
```

### 10.6 API Key Security

```php
// Generate cryptographically secure API keys
function bkm_generate_api_key() {
    $prefix = 'bari_sk_'; // Secret Key prefix
    $random_bytes = random_bytes(32);
    $key = $prefix . bin2hex($random_bytes);
    return $key;
}

// Hash API keys before storing
function bkm_hash_api_key($key) {
    return password_hash($key, PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,
        'time_cost' => 4,
        'threads' => 3
    ]);
}

// Verify API key
function bkm_verify_api_key($provided_key, $stored_hash) {
    return password_verify($provided_key, $stored_hash);
}

// Store only hash, never plaintext
// Show full key only once during generation
```

### 10.7 Database Security

```php
// Encrypt sensitive data
class BKM_Encryption {
    private $cipher = 'aes-256-gcm';
    private $key;

    public function __construct() {
        // Use WordPress secret keys
        $this->key = hash('sha256', AUTH_KEY . SECURE_AUTH_KEY, true);
    }

    public function encrypt($data) {
        $iv = random_bytes(openssl_cipher_iv_length($this->cipher));
        $encrypted = openssl_encrypt(
            $data,
            $this->cipher,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );

        return base64_encode($iv . $tag . $encrypted);
    }

    public function decrypt($data) {
        $data = base64_decode($data);
        $iv_len = openssl_cipher_iv_length($this->cipher);
        $iv = substr($data, 0, $iv_len);
        $tag = substr($data, $iv_len, 16);
        $encrypted = substr($data, $iv_len + 16);

        return openssl_decrypt(
            $encrypted,
            $this->cipher,
            $this->key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
    }
}
```

### 10.8 Security Headers

```php
// Add security headers
add_action('send_headers', function() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

    // Content Security Policy
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
});
```

### 10.9 Audit Logging

```php
// Log all admin actions
class BKM_Audit_Logger {
    public static function log_action($action, $details = array()) {
        global $wpdb;

        $wpdb->insert(
            $wpdb->prefix . 'bari_audit_log',
            array(
                'user_id' => get_current_user_id(),
                'action' => $action,
                'details' => json_encode($details),
                'ip_address' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'],
                'created_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s', '%s', '%s')
        );
    }
}

// Log knowledge actions
add_action('bkm_knowledge_created', function($knowledge_id) {
    BKM_Audit_Logger::log_action('knowledge_created', array(
        'knowledge_id' => $knowledge_id
    ));
});

add_action('bkm_knowledge_updated', function($knowledge_id, $changes) {
    BKM_Audit_Logger::log_action('knowledge_updated', array(
        'knowledge_id' => $knowledge_id,
        'changes' => $changes
    ));
}, 10, 2);

add_action('bkm_knowledge_deleted', function($knowledge_id) {
    BKM_Audit_Logger::log_action('knowledge_deleted', array(
        'knowledge_id' => $knowledge_id
    ));
});
```

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation - AI technique combining search with text generation |
| **NLU** | Natural Language Understanding - AI's ability to understand human language |
| **WYSIWYG** | What You See Is What You Get - Visual editor for content |
| **JWT** | JSON Web Token - Secure authentication token format |
| **RBAC** | Role-Based Access Control - Permission system based on user roles |
| **pgvector** | PostgreSQL extension for vector similarity search |
| **Embedding** | Numerical representation of text for semantic search |
| **Intent** | The goal or purpose behind a user's query |
| **Slot** | Specific piece of information extracted from a query |
| **Webhook** | HTTP callback for real-time event notifications |

### B. References

- [WordPress Plugin Development](https://developer.wordpress.org/plugins/)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [Next.js Documentation](https://nextjs.org/docs)
- [PostgreSQL pgvector](https://github.com/pgvector/pgvector)
- [Google Gemini API](https://ai.google.dev/docs)

### C. Support

**For technical support:**
- Email: support@bajaringan.com
- Documentation: https://docs.bajaringan.com
- GitHub Issues: https://github.com/bajaringan/knowledge-manager/issues

**For feature requests:**
- Submit via GitHub Issues
- Contact product team: product@bajaringan.com

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-21
**Next Review:** 2026-01-21

---

© 2025 Bajaringan. All rights reserved.
