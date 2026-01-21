<?php
/**
 * Authentication handling
 */

if (!defined('ABSPATH')) exit;

class BKM_Auth {
    public function custom_login_redirect($redirect_to, $request, $user) {
        if (isset($_GET['redirect_to']) && strpos($_GET['redirect_to'], 'bari-knowledge') !== false) {
            if (isset($user->ID) && user_can($user->ID, 'bkm_create_knowledge')) {
                return admin_url('admin.php?page=bari-knowledge');
            }
        }
        return $redirect_to;
    }

    public function custom_login_styles() {
        echo '<style>body.login { background: #f0f4f8; }</style>';
    }
}
