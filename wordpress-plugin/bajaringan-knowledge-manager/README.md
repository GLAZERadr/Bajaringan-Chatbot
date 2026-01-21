# BARI Knowledge Manager

WordPress plugin untuk mengelola knowledge base AI Assistant "Si Bari".

## Overview

Plugin ini menyediakan interface CMS yang user-friendly untuk mengelola knowledge base yang digunakan oleh BARI AI Assistant. Terintegrasi dengan Next.js melalui REST API.

## Features

✅ **Knowledge Management**
- Create, edit, publish knowledge entries
- WYSIWYG editor untuk easy content creation
- Categories dan tags untuk organization
- Version history dan rollback capability
- AI Preview untuk test responses sebelum publish

✅ **Role-Based Access Control**
- Administrator: Full access
- Editor: Create, edit, publish
- Author: Create, edit own entries
- Contributor: Create drafts only

✅ **REST API**
- Search knowledge
- Track usage (analytics)
- JWT authentication
- API key authentication

✅ **Integration**
- Webhook untuk real-time sync dengan Next.js
- Cache invalidation otomatis
- Usage tracking dan analytics

✅ **No Query Limits**
- Unlimited queries untuk semua users
- Analytics untuk insights saja

## Requirements

- WordPress 6.0+
- PHP 7.4+
- MySQL 5.7+ atau MariaDB 10.2+
- Next.js application (untuk integration)

## Installation

### 1. Upload Plugin

```bash
# Via WordPress Admin
1. Go to Plugins → Add New
2. Click "Upload Plugin"
3. Choose bajaringan-knowledge-manager.zip
4. Click "Install Now"
5. Click "Activate"

# Via Command Line
cd /path/to/wordpress
wp plugin install bajaringan-knowledge-manager.zip
wp plugin activate bajaringan-knowledge-manager
```

### 2. Verify Database Tables

```bash
wp db query "SHOW TABLES LIKE 'wp_bari_%';"
```

Expected tables:
- `wp_bari_knowledge`
- `wp_bari_categories`
- `wp_bari_tags`
- `wp_bari_knowledge_tags`
- `wp_bari_knowledge_versions`
- `wp_bari_conversations`
- `wp_bari_api_keys`

### 3. Configure Settings

1. Go to **BARI Knowledge → Settings**
2. Set **Next.js Webhook URL**: `https://your-nextjs-app.com`
3. Copy **Webhook Secret** (untuk .env Next.js)
4. Generate **API Key** (untuk .env Next.js)

### 4. Create Default Content

The plugin automatically creates 5 default categories:
- Kalkulator
- Produk
- Teknis
- Maintenance
- Garansi

## Configuration

### WordPress Settings

Navigate to **BARI Knowledge → Settings**:

| Setting | Description | Example |
|---------|-------------|---------|
| Next.js Webhook URL | URL of your Next.js app | `https://your-app.com` |
| Webhook Secret | Secret for webhook authentication | Auto-generated (32 chars) |
| API Keys | Keys for REST API authentication | Generate via UI |

### Next.js Environment Variables

Add to `.env.local`:

```bash
WORDPRESS_API_URL=https://your-wordpress-site.com
WORDPRESS_API_KEY=bari_sk_...  # From Settings → API Keys
WEBHOOK_SECRET=...              # From Settings → Webhook Secret
```

## Usage

### Creating Knowledge

1. Go to **BARI Knowledge → Add Knowledge**
2. Enter **Title** (e.g., "Cara menghitung baja ringan")
3. Write **Content** using WYSIWYG editor
4. Select **Category**
5. Add **Tags** (comma-separated)
6. Add **Keywords** untuk better matching
7. (Optional) Test with **AI Preview**
8. Click **Publish** or **Save as Draft**

### Managing Knowledge

1. Go to **BARI Knowledge → All Knowledge**
2. Filter by status, category, or search
3. Bulk actions: Publish, Draft, Delete
4. Click row to edit

### API Keys Management

1. Go to **BARI Knowledge → Settings**
2. Scroll to **API Keys** section
3. Enter key name (e.g., "Production")
4. Click **Generate New Key**
5. **Copy the key** (shown only once!)
6. Add to Next.js `.env.local`

## REST API Documentation

### Base URL

```
https://your-wordpress-site.com/wp-json/bari/v1/
```

### Authentication

Use one of these methods:

**API Key (Recommended for Next.js)**
```http
GET /knowledge/search?q=baja+ringan
Headers:
  X-API-Key: bari_sk_1a2b3c4d5e6f7g8h9i0j...
```

**JWT Token (For user sessions)**
```http
GET /knowledge
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoints

#### GET /knowledge

List all published knowledge.

**Query Parameters:**
- `status` - Filter by status (default: `published`)
- `category` - Filter by category ID
- `limit` - Number of items (default: 20, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Cara menghitung kebutuhan baja ringan",
      "content": "Untuk menghitung...",
      "category": {"id": 1, "name": "Kalkulator"},
      "keywords": ["kalkulator", "hitung"],
      "usage_count": 1234
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

#### GET /knowledge/search

Search knowledge by query.

**Query Parameters:**
- `q` - Search query (required)
- `limit` - Number of results (default: 5, max: 20)

**Response:**
```json
{
  "success": true,
  "query": "baja ringan",
  "data": [
    {
      "id": 1,
      "title": "Cara menghitung kebutuhan baja ringan",
      "content": "...",
      "category_name": "Kalkulator",
      "relevance": 0.95
    }
  ],
  "total_results": 15
}
```

#### GET /knowledge/{id}

Get single knowledge by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "...",
    "content": "...",
    "category": {...},
    "tags": [...],
    "version": 3,
    "usage_count": 1234
  }
}
```

#### POST /knowledge/{id}/track

Track knowledge usage (for analytics).

**Request Body:**
```json
{
  "session_id": "guest_1703001234567",
  "user_id": null,
  "query": "bagaimana cara hitung baja ringan?",
  "matched": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usage tracked successfully",
  "new_usage_count": 1235
}
```

#### POST /auth/login

Login and get JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "login": "admin",
    "role": "administrator",
    "capabilities": [...]
  },
  "expires_at": "2025-12-22T10:30:00Z"
}
```

## Webhook Integration

When knowledge is published/updated, plugin sends webhook to Next.js:

**Endpoint:** `POST {NEXTJS_WEBHOOK_URL}/api/webhooks/knowledge-updated`

**Headers:**
```
Content-Type: application/json
X-Webhook-Secret: {WEBHOOK_SECRET}
```

**Payload:**
```json
{
  "event": "knowledge.updated",
  "timestamp": "2025-12-21T10:30:00Z",
  "data": {
    "id": 123,
    "title": "...",
    "status": "published"
  }
}
```

## Troubleshooting

### Plugin activation fails

**Error:** "Plugin requires PostgreSQL database"

**Solution:**
- Verify `wp-config.php` has `define('DB_TYPE', 'pgsql');`
- Check database connection

### API returns 401 Unauthorized

**Error:** "Invalid API key"

**Solution:**
1. Verify API key in Next.js `.env.local`
2. Check if key exists and is active in WordPress:
   ```bash
   wp db query "SELECT * FROM wp_bari_api_keys WHERE is_active = 1;"
   ```
3. Regenerate API key if needed

### Webhook not triggering

**Error:** Cache not clearing in Next.js

**Solution:**
1. Verify webhook URL in Settings
2. Check webhook secret matches
3. Test webhook manually:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Secret: YOUR_SECRET" \
     -d '{"event": "test"}' \
     https://your-nextjs-app.com/api/webhooks/knowledge-updated
   ```

### Knowledge not appearing in AI responses

**Checklist:**
- [ ] Knowledge is **Published** (not Draft)
- [ ] WordPress API is accessible
- [ ] Next.js has valid API key
- [ ] Cache has been cleared (via webhook or manually)

## Database Schema

### wp_bari_knowledge

Main knowledge table.

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| title | VARCHAR(500) | Knowledge title |
| content | LONGTEXT | Knowledge content (HTML) |
| category_id | BIGINT | Foreign key to categories |
| keywords | TEXT | JSON array of keywords |
| status | VARCHAR(20) | draft, published, archived |
| requires_image | TINYINT | Whether AI expects image |
| version | INT | Version number |
| usage_count | BIGINT | Analytics only (not for limiting) |
| created_by | BIGINT | User ID |
| updated_by | BIGINT | User ID |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### wp_bari_conversations

Analytics table (NOT for limiting queries!).

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key |
| user_id | BIGINT | User ID (NULL for guests) |
| session_id | VARCHAR(100) | Session identifier |
| query | TEXT | User query |
| response | LONGTEXT | AI response |
| metadata | TEXT | JSON metadata |
| created_at | DATETIME | Timestamp |

**Purpose:**
- Analytics and insights
- Cross-device conversation history
- Quality monitoring
- Support and debugging

**NOT used for:**
- Limiting queries
- Blocking users
- Rate limiting

## Development

### File Structure

```
bajaringan-knowledge-manager/
├── bajaringan-knowledge-manager.php    # Main plugin file
├── includes/                           # Core PHP classes
│   ├── class-bkm-core.php
│   ├── class-bkm-database.php
│   ├── class-bkm-rest-api.php
│   └── ...
├── admin/                              # Admin interface
│   ├── views/                          # PHP templates
│   ├── css/                            # Stylesheets
│   └── js/                             # JavaScript
├── languages/                          # Translations
└── tests/                              # Unit tests (future)
```

### Coding Standards

- Follow [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- Use PHPCS for linting
- Sanitize all inputs
- Escape all outputs
- Use prepared statements for SQL

### Testing

```bash
# PHPUnit tests (to be implemented)
phpunit

# WordPress coding standards
phpcs --standard=WordPress includes/
```

## Security

### Best Practices

✅ **All inputs sanitized:**
- `sanitize_text_field()`
- `wp_kses_post()`
- `intval()` / `absint()`

✅ **All outputs escaped:**
- `esc_html()`
- `esc_attr()`
- `esc_url()`

✅ **Database queries:**
- Always use `$wpdb->prepare()`
- Never concatenate user input

✅ **AJAX requests:**
- Nonce verification: `check_ajax_referer()`
- Capability checks: `current_user_can()`

✅ **API endpoints:**
- API key authentication
- JWT token validation
- Rate limiting (recommended)

### Reporting Security Issues

Please report security issues to: security@bajaringan.com

## Support

**Documentation:** See `docs/` folder in main project:
- `KNOWLEDGE_MANAGEMENT_SYSTEM.md` - Full documentation
- `IMPLEMENTATION_PLAN.md` - Implementation guide
- `IMPLEMENTATION_SUMMARY.md` - Quick reference

**Issues:** Report via GitHub Issues

**Email:** support@bajaringan.com

## Changelog

### Version 1.0.0 (2025-12-21)

**Initial Release**
- Knowledge management (CRUD operations)
- Role-based access control
- REST API endpoints
- JWT & API key authentication
- Webhook integration
- Version history
- AI Preview feature
- Analytics tracking (no limits)

## License

GPL v2 or later

## Credits

**Developed by:** Bajaringan
**For:** BARI AI Assistant Project

---

© 2025 Bajaringan. All rights reserved.
