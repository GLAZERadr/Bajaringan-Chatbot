<?php
/**
 * Roles and capabilities management
 *
 * @package Bajaringan_Knowledge_Manager
 */

if (!defined('ABSPATH')) {
    exit;
}

class BKM_Roles {
    /**
     * Capability definitions
     */
    const CAPABILITIES = array(
        'administrator' => array(
            'bkm_manage_settings',
            'bkm_manage_api_keys',
            'bkm_view_analytics',
            'bkm_create_knowledge',
            'bkm_edit_knowledge',
            'bkm_edit_others_knowledge',
            'bkm_publish_knowledge',
            'bkm_delete_knowledge',
            'bkm_delete_others_knowledge',
            'bkm_export_data',
            'bkm_import_data'
        ),
        'editor' => array(
            'bkm_view_analytics',
            'bkm_create_knowledge',
            'bkm_edit_knowledge',
            'bkm_edit_others_knowledge',
            'bkm_publish_knowledge',
            'bkm_delete_knowledge',
            'bkm_export_data'
        ),
        'author' => array(
            'bkm_create_knowledge',
            'bkm_edit_knowledge',
            'bkm_delete_knowledge'
        ),
        'contributor' => array(
            'bkm_create_knowledge'
        )
    );

    /**
     * Add capabilities to roles
     */
    public static function add_capabilities() {
        foreach (self::CAPABILITIES as $role_name => $capabilities) {
            $role = get_role($role_name);
            if ($role) {
                foreach ($capabilities as $cap) {
                    $role->add_cap($cap);
                }
            }
        }
    }

    /**
     * Remove capabilities from roles
     */
    public static function remove_capabilities() {
        foreach (self::CAPABILITIES as $role_name => $capabilities) {
            $role = get_role($role_name);
            if ($role) {
                foreach ($capabilities as $cap) {
                    $role->remove_cap($cap);
                }
            }
        }
    }
}
