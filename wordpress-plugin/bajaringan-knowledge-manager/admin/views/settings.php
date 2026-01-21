<?php
/**
 * Settings Page
 */

if (!defined('ABSPATH')) exit;

if (!current_user_can('bkm_manage_settings')) {
    wp_die(__('Access Denied', 'bajaringan-knowledge-manager'), 'Access Denied', array('response' => 403));
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('bkm_settings', 'bkm_settings_nonce')) {
    update_option('bkm_nextjs_webhook_url', esc_url_raw($_POST['nextjs_webhook_url']));

    if (!empty($_POST['regenerate_webhook_secret'])) {
        update_option('bkm_webhook_secret', wp_generate_password(32, false));
        echo '<div class="notice notice-success is-dismissible"><p>' . __('Webhook secret regenerated!', 'bajaringan-knowledge-manager') . '</p></div>';
    }

    echo '<div class="notice notice-success is-dismissible"><p>' . __('Settings saved!', 'bajaringan-knowledge-manager') . '</p></div>';
}

// Handle API key generation
if (isset($_POST['generate_api_key']) && check_admin_referer('bkm_generate_api_key', 'bkm_api_key_nonce')) {
    $key_name = sanitize_text_field($_POST['api_key_name']);
    $api_key = 'bari_sk_' . bin2hex(random_bytes(32));
    $key_prefix = substr($api_key, 0, 15);
    $key_hash = password_hash($api_key, PASSWORD_DEFAULT);

    global $wpdb;
    $wpdb->insert(
        $wpdb->prefix . 'bari_api_keys',
        array(
            'name' => $key_name,
            'key_prefix' => $key_prefix,
            'key_hash' => $key_hash,
            'permissions' => json_encode(array('read', 'write')),
            'is_active' => 1,
            'created_by' => get_current_user_id()
        ),
        array('%s', '%s', '%s', '%s', '%d', '%d')
    );

    $new_api_key = $api_key;
}

// Get settings
$nextjs_webhook_url = get_option('bkm_nextjs_webhook_url', '');
$webhook_secret = get_option('bkm_webhook_secret', '');

// Get API keys
global $wpdb;
$api_keys = $wpdb->get_results(
    "SELECT * FROM {$wpdb->prefix}bari_api_keys ORDER BY created_at DESC"
);

?>

<div class="wrap bkm-settings">
    <h1><?php _e('BARI Knowledge Settings', 'bajaringan-knowledge-manager'); ?></h1>

    <?php if (isset($new_api_key)): ?>
        <div class="notice notice-warning">
            <h3><?php _e('⚠️ Save Your API Key', 'bajaringan-knowledge-manager'); ?></h3>
            <p><?php _e('This key will only be shown once. Please copy it now:', 'bajaringan-knowledge-manager'); ?></p>
            <div class="bkm-api-key-display">
                <code id="new-api-key"><?php echo $new_api_key; ?></code>
                <button type="button" class="button" onclick="navigator.clipboard.writeText('<?php echo $new_api_key; ?>'); alert('Copied!');">
                    <?php _e('Copy', 'bajaringan-knowledge-manager'); ?>
                </button>
            </div>
        </div>
    <?php endif; ?>

    <div class="bkm-settings-grid">
        <!-- General Settings -->
        <div class="bkm-card">
            <div class="bkm-card-header">
                <h2><?php _e('🔗 Integration Settings', 'bajaringan-knowledge-manager'); ?></h2>
            </div>
            <div class="bkm-card-body">
                <form method="post">
                    <?php wp_nonce_field('bkm_settings', 'bkm_settings_nonce'); ?>

                    <div class="bkm-form-group">
                        <label for="nextjs_webhook_url">
                            <?php _e('Next.js Webhook URL', 'bajaringan-knowledge-manager'); ?>
                        </label>
                        <input
                            type="url"
                            id="nextjs_webhook_url"
                            name="nextjs_webhook_url"
                            class="bkm-input"
                            value="<?php echo esc_attr($nextjs_webhook_url); ?>"
                            placeholder="https://your-nextjs-app.com"
                        >
                        <p class="bkm-help-text">
                            <?php _e('URL of your Next.js application (without trailing slash)', 'bajaringan-knowledge-manager'); ?>
                        </p>
                    </div>

                    <div class="bkm-form-group">
                        <label for="webhook_secret">
                            <?php _e('Webhook Secret', 'bajaringan-knowledge-manager'); ?>
                        </label>
                        <div class="bkm-input-group">
                            <input
                                type="text"
                                id="webhook_secret"
                                class="bkm-input"
                                value="<?php echo esc_attr($webhook_secret); ?>"
                                readonly
                            >
                            <button type="button" class="button" onclick="navigator.clipboard.writeText('<?php echo esc_js($webhook_secret); ?>'); alert('Copied!');">
                                <?php _e('Copy', 'bajaringan-knowledge-manager'); ?>
                            </button>
                        </div>
                        <p class="bkm-help-text">
                            <?php _e('Use this secret in your Next.js .env.local file (WEBHOOK_SECRET)', 'bajaringan-knowledge-manager'); ?>
                        </p>
                        <label class="bkm-checkbox-label">
                            <input type="checkbox" name="regenerate_webhook_secret" value="1">
                            <?php _e('Regenerate webhook secret', 'bajaringan-knowledge-manager'); ?>
                        </label>
                    </div>

                    <button type="submit" class="button button-primary">
                        <?php _e('Save Settings', 'bajaringan-knowledge-manager'); ?>
                    </button>
                </form>
            </div>
        </div>

        <!-- API Keys Management -->
        <div class="bkm-card">
            <div class="bkm-card-header">
                <h2><?php _e('🔑 API Keys', 'bajaringan-knowledge-manager'); ?></h2>
            </div>
            <div class="bkm-card-body">
                <p><?php _e('API keys are used for authentication between WordPress and Next.js.', 'bajaringan-knowledge-manager'); ?></p>

                <!-- Generate New API Key -->
                <form method="post" class="bkm-generate-key-form">
                    <?php wp_nonce_field('bkm_generate_api_key', 'bkm_api_key_nonce'); ?>

                    <div class="bkm-form-inline">
                        <input
                            type="text"
                            name="api_key_name"
                            class="bkm-input"
                            placeholder="<?php _e('Key name (e.g., Production)', 'bajaringan-knowledge-manager'); ?>"
                            required
                        >
                        <button type="submit" name="generate_api_key" class="button button-secondary">
                            <?php _e('Generate New Key', 'bajaringan-knowledge-manager'); ?>
                        </button>
                    </div>
                </form>

                <hr>

                <!-- Existing API Keys -->
                <?php if (!empty($api_keys)): ?>
                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th><?php _e('Name', 'bajaringan-knowledge-manager'); ?></th>
                                <th><?php _e('Key Prefix', 'bajaringan-knowledge-manager'); ?></th>
                                <th><?php _e('Created', 'bajaringan-knowledge-manager'); ?></th>
                                <th><?php _e('Last Used', 'bajaringan-knowledge-manager'); ?></th>
                                <th><?php _e('Status', 'bajaringan-knowledge-manager'); ?></th>
                                <th><?php _e('Actions', 'bajaringan-knowledge-manager'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($api_keys as $key): ?>
                                <tr>
                                    <td><strong><?php echo esc_html($key->name); ?></strong></td>
                                    <td><code><?php echo esc_html($key->key_prefix); ?>...</code></td>
                                    <td><?php echo date('Y-m-d', strtotime($key->created_at)); ?></td>
                                    <td>
                                        <?php if ($key->last_used_at): ?>
                                            <?php echo human_time_diff(strtotime($key->last_used_at), current_time('timestamp')); ?> <?php _e('ago', 'bajaringan-knowledge-manager'); ?>
                                            <br><small>(<?php echo number_format($key->usage_count); ?> <?php _e('requests', 'bajaringan-knowledge-manager'); ?>)</small>
                                        <?php else: ?>
                                            <span class="bkm-text-muted"><?php _e('Never', 'bajaringan-knowledge-manager'); ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($key->is_active): ?>
                                            <span class="bkm-badge bkm-badge-success"><?php _e('Active', 'bajaringan-knowledge-manager'); ?></span>
                                        <?php else: ?>
                                            <span class="bkm-badge bkm-badge-secondary"><?php _e('Inactive', 'bajaringan-knowledge-manager'); ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=bari-knowledge-settings&action=revoke_key&key_id=' . $key->id), 'revoke-key-' . $key->id); ?>" class="bkm-link-danger" onclick="return confirm('<?php _e('Are you sure? This cannot be undone.', 'bajaringan-knowledge-manager'); ?>');">
                                            <?php _e('Revoke', 'bajaringan-knowledge-manager'); ?>
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php else: ?>
                    <p class="bkm-no-data">
                        <?php _e('No API keys yet. Generate one above to get started.', 'bajaringan-knowledge-manager'); ?>
                    </p>
                <?php endif; ?>
            </div>
        </div>

        <!-- System Info -->
        <div class="bkm-card">
            <div class="bkm-card-header">
                <h2><?php _e('ℹ️ System Information', 'bajaringan-knowledge-manager'); ?></h2>
            </div>
            <div class="bkm-card-body">
                <table class="bkm-info-table">
                    <tr>
                        <th><?php _e('Plugin Version:', 'bajaringan-knowledge-manager'); ?></th>
                        <td><?php echo BKM_VERSION; ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('WordPress Version:', 'bajaringan-knowledge-manager'); ?></th>
                        <td><?php echo get_bloginfo('version'); ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('PHP Version:', 'bajaringan-knowledge-manager'); ?></th>
                        <td><?php echo PHP_VERSION; ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('Database Type:', 'bajaringan-knowledge-manager'); ?></th>
                        <td><?php echo defined('DB_TYPE') ? DB_TYPE : 'MySQL'; ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('Total Knowledge:', 'bajaringan-knowledge-manager'); ?></th>
                        <td>
                            <?php
                            global $wpdb;
                            $total = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}bari_knowledge");
                            echo number_format($total);
                            ?>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</div>

<?php
// Handle key revocation
if (isset($_GET['action']) && $_GET['action'] === 'revoke_key' && isset($_GET['key_id'])) {
    $key_id = intval($_GET['key_id']);
    if (check_admin_referer('revoke-key-' . $key_id)) {
        $wpdb->delete(
            $wpdb->prefix . 'bari_api_keys',
            array('id' => $key_id),
            array('%d')
        );
        wp_redirect(admin_url('admin.php?page=bari-knowledge-settings'));
        exit;
    }
}
?>
