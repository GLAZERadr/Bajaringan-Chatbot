<?php
/**
 * Plugin Name: BARI Chatbot Widget
 * Plugin URI: https://bajaringan.com
 * Description: Floating chatbot widget dengan animated GIF icon dan auto-show bubble notification
 * Version: 2.1.0
 * Author: Bajaringan Team
 * Author URI: https://bajaringan.com
 * License: GPL v2 or later
 * Text Domain: bari-chatbot
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Bajaringan_Chatbot_Widget {

    /**
     * Plugin version
     */
    const VERSION = '2.1.0';

    /**
     * Constructor
     */
    public function __construct() {
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));

        // Admin menu
        add_action('admin_menu', array($this, 'add_settings_page'));

        // Register settings
        add_action('admin_init', array($this, 'register_settings'));

        // Add settings link on plugins page
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_settings_link'));
    }

    /**
     * Enqueue frontend scripts
     */
    public function enqueue_scripts() {
        // Only load on frontend
        if (is_admin()) {
            return;
        }

        // Check if enabled
        if (!get_option('bari_chatbot_enabled', true)) {
            return;
        }

        // Enqueue widget script
        wp_enqueue_script(
            'bari-chatbot-widget',
            plugins_url('js/bari-chatbot-widget.js', __FILE__),
            array(),
            self::VERSION,
            true
        );

        // Pass settings to JavaScript
        $settings = array(
            'chatbotUrl' => get_option('bari_chatbot_url', 'https://bajaringan-chatbot.vercel.app/chat'),
            'bariIconUrl' => get_option('bari_chatbot_icon', 'https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif'),
            'bubbleDelay' => intval(get_option('bari_chatbot_bubble_delay', 10000)),
            'bubbleDuration' => intval(get_option('bari_chatbot_bubble_duration', 3000)),
            'bubbleText' => get_option('bari_chatbot_bubble_text', 'Butuh hitung & cek atap? Klik Bari.'),
            'headerTitle' => get_option('bari_chatbot_header_title', 'BARI'),
            'headerSubtitle' => get_option('bari_chatbot_header_subtitle', 'Asisten Atap & Baja Ringan')
        );

        wp_localize_script('bari-chatbot-widget', 'bariChatbotConfig', $settings);
    }

    /**
     * Add settings page to admin menu
     */
    public function add_settings_page() {
        add_options_page(
            'BARI Chatbot Settings',
            'BARI Chatbot',
            'manage_options',
            'bari-chatbot-settings',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        // General settings
        register_setting('bari_chatbot_general', 'bari_chatbot_enabled');
        register_setting('bari_chatbot_general', 'bari_chatbot_url');
        register_setting('bari_chatbot_general', 'bari_chatbot_icon');
        register_setting('bari_chatbot_general', 'bari_chatbot_header_title');
        register_setting('bari_chatbot_general', 'bari_chatbot_header_subtitle');

        // Bubble settings
        register_setting('bari_chatbot_bubble', 'bari_chatbot_bubble_delay');
        register_setting('bari_chatbot_bubble', 'bari_chatbot_bubble_duration');
        register_setting('bari_chatbot_bubble', 'bari_chatbot_bubble_text');
    }

    /**
     * Add settings link on plugins page
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="options-general.php?page=bari-chatbot-settings">Settings</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }

        // Get current settings
        $enabled = get_option('bari_chatbot_enabled', true);
        $chatbot_url = get_option('bari_chatbot_url', 'https://bajaringan-chatbot.vercel.app/chat');
        $icon_url = get_option('bari_chatbot_icon', 'https://bajaringan.com/wp-content/uploads/2025/12/BARI-Gif.gif');
        $header_title = get_option('bari_chatbot_header_title', 'BARI');
        $header_subtitle = get_option('bari_chatbot_header_subtitle', 'Asisten Atap & Baja Ringan');
        $bubble_delay = get_option('bari_chatbot_bubble_delay', 10000);
        $bubble_duration = get_option('bari_chatbot_bubble_duration', 3000);
        $bubble_text = get_option('bari_chatbot_bubble_text', 'Butuh hitung & cek atap? Klik Bari.');

        ?>
        <div class="wrap">
            <h1>⚙️ BARI Chatbot Widget Settings</h1>

            <div style="background: #fff; border: 1px solid #ccc; border-left: 4px solid #FDB913; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📝 About This Plugin</h3>
                <p>BARI Chatbot Widget menampilkan floating button dengan animated GIF yang membuka chatbot dalam modal iframe.</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>✅ Animated GIF icon (BARI robot)</li>
                    <li>✅ Auto-show bubble notification setelah 10 detik</li>
                    <li>✅ Responsive design (mobile & desktop)</li>
                    <li>✅ Easy customization</li>
                </ul>
            </div>

            <h2 class="nav-tab-wrapper">
                <a href="#general" class="nav-tab nav-tab-active" onclick="switchTab(event, 'general')">General</a>
                <a href="#bubble" class="nav-tab" onclick="switchTab(event, 'bubble')">Bubble Notification</a>
                <a href="#preview" class="nav-tab" onclick="switchTab(event, 'preview')">Preview</a>
            </h2>

            <!-- General Settings -->
            <div id="general" class="tab-content" style="display: block;">
                <form method="post" action="options.php">
                    <?php settings_fields('bari_chatbot_general'); ?>

                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_enabled">Enable Widget</label>
                            </th>
                            <td>
                                <label>
                                    <input type="checkbox" name="bari_chatbot_enabled" id="bari_chatbot_enabled" value="1" <?php checked($enabled, 1); ?>>
                                    Show chatbot widget on website
                                </label>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_url">🔗 Chatbot URL</label>
                            </th>
                            <td>
                                <input type="url" name="bari_chatbot_url" id="bari_chatbot_url" value="<?php echo esc_attr($chatbot_url); ?>" class="regular-text" required>
                                <p class="description">URL chatbot Vercel kamu (default: https://bajaringan-chatbot.vercel.app/chat)</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_icon">🤖 Icon URL (GIF)</label>
                            </th>
                            <td>
                                <input type="url" name="bari_chatbot_icon" id="bari_chatbot_icon" value="<?php echo esc_attr($icon_url); ?>" class="regular-text" required>
                                <p class="description">URL gambar BARI robot animated GIF</p>
                                <?php if ($icon_url): ?>
                                    <div style="margin-top: 10px;">
                                        <img src="<?php echo esc_url($icon_url); ?>" alt="BARI Icon Preview" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #FDB913; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    </div>
                                <?php endif; ?>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_header_title">📋 Header Title</label>
                            </th>
                            <td>
                                <input type="text" name="bari_chatbot_header_title" id="bari_chatbot_header_title" value="<?php echo esc_attr($header_title); ?>" class="regular-text">
                                <p class="description">Judul di header modal (default: BARI)</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_header_subtitle">📝 Header Subtitle</label>
                            </th>
                            <td>
                                <input type="text" name="bari_chatbot_header_subtitle" id="bari_chatbot_header_subtitle" value="<?php echo esc_attr($header_subtitle); ?>" class="regular-text">
                                <p class="description">Subtitle di header modal (default: Asisten Atap & Baja Ringan)</p>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('Save General Settings'); ?>
                </form>
            </div>

            <!-- Bubble Settings -->
            <div id="bubble" class="tab-content" style="display: none;">
                <form method="post" action="options.php">
                    <?php settings_fields('bari_chatbot_bubble'); ?>

                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_bubble_delay">⏱️ Bubble Delay (ms)</label>
                            </th>
                            <td>
                                <input type="number" name="bari_chatbot_bubble_delay" id="bari_chatbot_bubble_delay" value="<?php echo esc_attr($bubble_delay); ?>" min="1000" step="1000" class="small-text">
                                <p class="description">Berapa lama bubble muncul setelah page load (default: 10000ms = 10 detik)</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_bubble_duration">⏳ Bubble Duration (ms)</label>
                            </th>
                            <td>
                                <input type="number" name="bari_chatbot_bubble_duration" id="bari_chatbot_bubble_duration" value="<?php echo esc_attr($bubble_duration); ?>" min="1000" step="1000" class="small-text">
                                <p class="description">Berapa lama bubble tampil sebelum auto-hide (default: 3000ms = 3 detik)</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="bari_chatbot_bubble_text">💬 Bubble Text</label>
                            </th>
                            <td>
                                <input type="text" name="bari_chatbot_bubble_text" id="bari_chatbot_bubble_text" value="<?php echo esc_attr($bubble_text); ?>" class="regular-text">
                                <p class="description">Text yang muncul di bubble notification (default: Butuh hitung & cek atap? Klik Bari.)</p>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('Save Bubble Settings'); ?>
                </form>
            </div>

            <!-- Preview -->
            <div id="preview" class="tab-content" style="display: none;">
                <h3>📱 Widget Preview</h3>
                <p>Ini adalah preview tampilan widget di website kamu:</p>

                <div style="position: relative; width: 100%; max-width: 600px; height: 400px; border: 2px solid #ddd; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); margin-top: 20px;">
                    <!-- Bubble -->
                    <div style="position: absolute; bottom: 110px; right: 24px; background: white; padding: 14px 18px 14px 16px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); max-width: 240px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        <button style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; cursor: pointer; padding: 4px;">
                            <svg style="width: 14px; height: 14px; fill: #9ca3af;" viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                        <p style="margin: 0; padding-right: 24px; font-size: 14px; line-height: 1.5; color: #1f2937; font-weight: 500;">
                            <?php echo esc_html($bubble_text); ?>
                        </p>
                        <div style="position: absolute; bottom: -10px; right: 32px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 10px solid white;"></div>
                    </div>

                    <!-- FAB -->
                    <div style="position: absolute; bottom: 24px; right: 24px; width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #FDB913 0%, #F59E0B 100%); box-shadow: 0 4px 16px rgba(253, 185, 19, 0.4); display: flex; align-items: center; justify-content: center; border: 3px solid white; overflow: hidden;">
                        <?php if ($icon_url): ?>
                            <img src="<?php echo esc_url($icon_url); ?>" alt="BARI" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                        <?php else: ?>
                            <span style="color: white; font-weight: bold; font-size: 18px;">BARI</span>
                        <?php endif; ?>
                    </div>

                    <div style="position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.9); padding: 12px; border-radius: 8px; font-size: 13px;">
                        <strong>Preview Notes:</strong><br>
                        • Bubble muncul setelah <?php echo intval($bubble_delay / 1000); ?> detik<br>
                        • Auto-hide setelah <?php echo intval($bubble_duration / 1000); ?> detik<br>
                        • Click anywhere to dismiss
                    </div>
                </div>

                <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px;">
                    <h4 style="margin-top: 0;">💡 Tips:</h4>
                    <ul>
                        <li>Gunakan <strong>GIF animasi</strong> untuk FAB icon agar lebih menarik perhatian</li>
                        <li>Set bubble delay <strong>10-15 detik</strong> untuk hasil optimal</li>
                        <li>Bubble text harus <strong>singkat</strong> dan <strong>actionable</strong></li>
                        <li>Test di berbagai device (desktop, tablet, mobile)</li>
                    </ul>
                </div>
            </div>
        </div>

        <script>
        function switchTab(event, tabName) {
            event.preventDefault();

            // Hide all tabs
            var tabs = document.getElementsByClassName('tab-content');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].style.display = 'none';
            }

            // Remove active class from all nav tabs
            var navTabs = document.getElementsByClassName('nav-tab');
            for (var i = 0; i < navTabs.length; i++) {
                navTabs[i].classList.remove('nav-tab-active');
            }

            // Show selected tab
            document.getElementById(tabName).style.display = 'block';
            event.target.classList.add('nav-tab-active');
        }
        </script>

        <style>
        .tab-content {
            background: #fff;
            padding: 20px;
            margin-top: -1px;
            border: 1px solid #ccc;
            border-top: none;
        }
        </style>
        <?php
    }
}

// Initialize plugin
new Bajaringan_Chatbot_Widget();
