<?php
/**
 * KB Roles Management Class
 * Handles custom roles and capabilities for Knowledge Base
 *
 * @package Bajaringan_KB_Connector
 * @since 1.0.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

class BKB_Roles {

    /**
     * Create custom KB roles
     */
    public static function create_roles() {

        // Remove existing roles first (clean slate)
        self::remove_roles();

        // =====================================================================
        // 1. KB ADMINISTRATOR (Full Access)
        // =====================================================================
        add_role('kb_administrator', __('KB Administrator', 'bajaringan-kb'), [
            'read' => true,

            // Knowledge Base core capabilities
            'access_knowledge_base' => true,
            'create_kb_article' => true,
            'edit_kb_articles' => true,
            'edit_others_kb_articles' => true,
            'delete_kb_articles' => true,
            'delete_others_kb_articles' => true,
            'publish_kb_articles' => true,

            // Management capabilities
            'manage_kb_categories' => true,
            'manage_kb_tags' => true,
            'manage_kb_users' => true,
            'view_kb_analytics' => true,

            // Import/Export
            'import_kb_articles' => true,
            'export_kb_articles' => true,

            // Settings
            'manage_kb_settings' => true,
        ]);

        // =====================================================================
        // 2. KB EDITOR (Create & Edit)
        // =====================================================================
        add_role('kb_editor', __('KB Editor', 'bajaringan-kb'), [
            'read' => true,

            'access_knowledge_base' => true,
            'create_kb_article' => true,
            'edit_kb_articles' => true,        // Own articles
            'edit_others_kb_articles' => true, // Others' articles
            'delete_kb_articles' => true,      // Own articles only
            'publish_kb_articles' => true,

            'manage_kb_tags' => true,
            'import_kb_articles' => true,
            'export_kb_articles' => true,
        ]);

        // =====================================================================
        // 3. KB VIEWER (Read Only)
        // =====================================================================
        add_role('kb_viewer', __('KB Viewer', 'bajaringan-kb'), [
            'read' => true,

            'access_knowledge_base' => true,
            'export_kb_articles' => true, // Can export for offline reading
        ]);

        // =====================================================================
        // 4. Add KB capabilities to WordPress Administrator
        // =====================================================================
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_caps = [
                'access_knowledge_base',
                'create_kb_article',
                'edit_kb_articles',
                'edit_others_kb_articles',
                'delete_kb_articles',
                'delete_others_kb_articles',
                'publish_kb_articles',
                'manage_kb_categories',
                'manage_kb_tags',
                'manage_kb_users',
                'view_kb_analytics',
                'import_kb_articles',
                'export_kb_articles',
                'manage_kb_settings',
            ];

            foreach ($admin_caps as $cap) {
                $admin_role->add_cap($cap);
            }
        }
    }

    /**
     * Remove custom KB roles
     */
    public static function remove_roles() {
        // Remove custom roles
        remove_role('kb_administrator');
        remove_role('kb_editor');
        remove_role('kb_viewer');

        // Remove capabilities from administrator (optional)
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $caps = [
                'access_knowledge_base',
                'create_kb_article',
                'edit_kb_articles',
                'edit_others_kb_articles',
                'delete_kb_articles',
                'delete_others_kb_articles',
                'publish_kb_articles',
                'manage_kb_categories',
                'manage_kb_tags',
                'manage_kb_users',
                'view_kb_analytics',
                'import_kb_articles',
                'export_kb_articles',
                'manage_kb_settings',
            ];

            foreach ($caps as $cap) {
                $admin_role->remove_cap($cap);
            }
        }
    }

    /**
     * Get KB role for specific user
     *
     * @param int|null $user_id User ID (default: current user)
     * @return string|null 'admin', 'editor', 'viewer', or null
     */
    public static function get_user_kb_role($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }

        $user = get_userdata($user_id);
        if (!$user) {
            return null;
        }

        // Check roles in priority order
        if (in_array('administrator', $user->roles) || in_array('kb_administrator', $user->roles)) {
            return 'admin';
        }

        if (in_array('kb_editor', $user->roles)) {
            return 'editor';
        }

        if (in_array('kb_viewer', $user->roles)) {
            return 'viewer';
        }

        return null;
    }

    /**
     * Check if user has KB access
     *
     * @param int|null $user_id User ID (default: current user)
     * @return bool
     */
    public static function user_can_access_kb($user_id = null) {
        if (!$user_id) {
            $user_id = get_current_user_id();
        }

        return user_can($user_id, 'access_knowledge_base');
    }

    /**
     * Get all users with KB access
     *
     * @return array Array of user objects
     */
    public static function get_kb_users() {
        $args = [
            'role__in' => ['administrator', 'kb_administrator', 'kb_editor', 'kb_viewer'],
            'orderby' => 'display_name',
            'order' => 'ASC',
        ];

        return get_users($args);
    }

    /**
     * Get capabilities for a role
     *
     * @param string $role Role name
     * @return array Array of capabilities
     */
    public static function get_role_capabilities($role) {
        $role_obj = get_role($role);
        if (!$role_obj) {
            return [];
        }

        return $role_obj->capabilities;
    }

    /**
     * Get role display name
     *
     * @param string $role Role slug
     * @return string Display name
     */
    public static function get_role_display_name($role) {
        $roles = [
            'admin' => __('Administrator', 'bajaringan-kb'),
            'editor' => __('Editor', 'bajaringan-kb'),
            'viewer' => __('Viewer', 'bajaringan-kb'),
        ];

        return isset($roles[$role]) ? $roles[$role] : ucfirst($role);
    }
}
