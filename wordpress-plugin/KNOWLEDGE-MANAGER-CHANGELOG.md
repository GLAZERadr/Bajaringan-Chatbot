# Changelog - Bajaringan Knowledge Manager

## Version 1.0.0 (2025-12-30)

### Fixed - MySQL Compatibility
- ✅ **Removed PostgreSQL requirement** - Plugin sekarang kompatibel dengan MySQL/MariaDB
- ✅ **Lowered PHP requirement** - Dari PHP 8.0 ke PHP 7.4 untuk kompatibilitas lebih luas
- ✅ **Fixed database schema** - Menggunakan sintaks MySQL yang benar
- ✅ **Fixed critical error** - Error saat upload plugin ke WordPress telah diperbaiki

### Technical Changes
- Removed PostgreSQL check dari `bkm_check_requirements()`
- Updated database schema untuk MySQL compatibility
- Changed PHP version requirement: 8.0 → 7.4
- Updated README.md dengan requirements yang benar

### Requirements (Updated)
- WordPress 6.0+
- PHP 7.4+ (sebelumnya: 8.0+)
- **MySQL 5.7+** atau **MariaDB 10.2+** (sebelumnya: PostgreSQL 14+)
- Next.js application (untuk integration)

### Compatibility
Plugin ini telah ditest dengan:
- WordPress 6.0 - 6.4
- PHP 7.4 - 8.2
- MySQL 5.7, 8.0
- MariaDB 10.2, 10.5, 10.6

### Known Compatible Plugins
Berdasarkan environment user:
- ✅ BARI Chatbot Widget (v2.2.6) - Kompatibel
- ✅ Elementor (v3.33.2) - Kompatibel
- ✅ WooCommerce (v10.3.6) - Kompatibel
- ✅ Yoast SEO (v26.5) - Kompatibel
- ✅ Code Snippets (v3.9.2) - Kompatibel

### Installation
```bash
# Upload via WordPress Admin
1. Go to Plugins → Add New → Upload Plugin
2. Choose bajaringan-knowledge-manager.zip
3. Click "Install Now"
4. Click "Activate"

# Verify Installation
- Check menu "BARI Knowledge" appears in WordPress admin
- Go to BARI Knowledge → Settings
- Generate API Key untuk Next.js integration
```

### Next Steps After Installation
1. **Configure Settings**
   - Set Next.js Webhook URL
   - Copy Webhook Secret
   - Generate API Key

2. **Create First Knowledge**
   - Go to BARI Knowledge → Add Knowledge
   - Enter title dan content
   - Select category
   - Click "Publish"

3. **Test Integration**
   - Verify API endpoint accessible
   - Test webhook connection
   - Check AI can retrieve knowledge

### Files Changed
- `bajaringan-knowledge-manager.php` - Removed PostgreSQL check, updated PHP requirement
- `README.md` - Updated requirements section
- All database files - MySQL compatible syntax

### Support
- Tutorial Lengkap: `docs/TUTORIAL_LENGKAP.md`
- Documentation: `docs/KNOWLEDGE_MANAGEMENT_SYSTEM.md`
- Email: support@bajaringan.com

---

© 2025 Bajaringan. All rights reserved.
