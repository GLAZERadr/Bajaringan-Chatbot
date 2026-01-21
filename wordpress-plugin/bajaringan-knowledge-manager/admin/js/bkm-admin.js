/**
 * BARI Knowledge Manager - Admin JavaScript
 */

(function($) {
    'use strict';

    const BKMAdmin = {
        /**
         * Initialize
         */
        init: function() {
            this.bindEvents();
            this.initComponents();
        },

        /**
         * Bind events
         */
        bindEvents: function() {
            // Tab switching (if needed)
            $('.bkm-tabs').on('click', '.bkm-tab', this.handleTabSwitch);

            // Confirm dialogs
            $('.bkm-confirm').on('click', this.handleConfirm);

            // Copy to clipboard
            $('.bkm-copy-btn').on('click', this.handleCopy);

            // API Key generation via AJAX
            $('.bkm-generate-key-form').on('submit', this.handleGenerateApiKey);
        },

        /**
         * Initialize components
         */
        initComponents: function() {
            // Initialize tag input if exists
            if ($('#tags').length) {
                this.initTagInput('#tags');
            }

            // Initialize tooltips if needed
            if (typeof $.fn.tooltip === 'function') {
                $('[data-tooltip]').tooltip();
            }
        },

        /**
         * Handle tab switching
         */
        handleTabSwitch: function(e) {
            e.preventDefault();
            const $tab = $(this);
            const target = $tab.data('tab');

            $('.bkm-tab').removeClass('active');
            $tab.addClass('active');

            $('.bkm-tab-content').removeClass('active');
            $(target).addClass('active');
        },

        /**
         * Handle confirm dialogs
         */
        handleConfirm: function(e) {
            const message = $(this).data('confirm') || 'Are you sure?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        },

        /**
         * Handle copy to clipboard
         */
        handleCopy: function(e) {
            e.preventDefault();
            const $btn = $(this);
            const text = $btn.data('copy') || $btn.prev('input, code').text();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    BKMAdmin.showNotice($btn, 'Copied!', 'success');
                }).catch(function(err) {
                    console.error('Failed to copy:', err);
                });
            } else {
                // Fallback for older browsers
                const $temp = $('<textarea>');
                $('body').append($temp);
                $temp.val(text).select();
                document.execCommand('copy');
                $temp.remove();
                BKMAdmin.showNotice($btn, 'Copied!', 'success');
            }
        },

        /**
         * Show temporary notice
         */
        showNotice: function($element, message, type) {
            const $notice = $('<span class="bkm-notice bkm-notice-' + type + '">' + message + '</span>');
            $element.after($notice);

            setTimeout(function() {
                $notice.fadeOut(function() {
                    $(this).remove();
                });
            }, 2000);
        },

        /**
         * Initialize tag input
         */
        initTagInput: function(selector) {
            const $input = $(selector);

            if (!$input.length) return;

            // Simple tag input implementation
            const $container = $('<div class="bkm-tag-input"></div>');
            const $tagsList = $('<div class="bkm-tags-list"></div>');
            const $newInput = $('<input type="text" class="bkm-tag-field" placeholder="Add tag...">');

            $input.hide().after($container);
            $container.append($tagsList, $newInput);

            // Parse existing tags
            const tags = $input.val().split(',').map(t => t.trim()).filter(t => t);
            tags.forEach(tag => this.addTag($tagsList, tag));

            // Add tag on Enter or comma
            $newInput.on('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const tag = $(this).val().trim();
                    if (tag) {
                        BKMAdmin.addTag($tagsList, tag);
                        $(this).val('');
                        BKMAdmin.updateTagsInput($input, $tagsList);
                    }
                }
            });

            // Remove tag on click
            $tagsList.on('click', '.bkm-tag-remove', function() {
                $(this).parent().remove();
                BKMAdmin.updateTagsInput($input, $tagsList);
            });

            // Update input on blur
            $newInput.on('blur', function() {
                const tag = $(this).val().trim();
                if (tag) {
                    BKMAdmin.addTag($tagsList, tag);
                    $(this).val('');
                    BKMAdmin.updateTagsInput($input, $tagsList);
                }
            });
        },

        /**
         * Add tag to list
         */
        addTag: function($tagsList, tag) {
            // Check if tag already exists
            const exists = $tagsList.find('.bkm-tag').filter(function() {
                return $(this).data('tag') === tag;
            }).length > 0;

            if (!exists) {
                const $tag = $('<span class="bkm-tag" data-tag="' + tag + '">' +
                    tag +
                    '<button type="button" class="bkm-tag-remove">&times;</button>' +
                    '</span>');
                $tagsList.append($tag);
            }
        },

        /**
         * Update hidden tags input
         */
        updateTagsInput: function($input, $tagsList) {
            const tags = $tagsList.find('.bkm-tag').map(function() {
                return $(this).data('tag');
            }).get();

            $input.val(tags.join(', '));
        },

        /**
         * Handle API Key generation via AJAX
         */
        handleGenerateApiKey: function(e) {
            e.preventDefault();

            const $form = $(this);
            const $button = $form.find('button[type="submit"]');
            const $input = $form.find('input[name="api_key_name"]');
            const keyName = $input.val().trim();

            if (!keyName) {
                alert('Please enter a name for the API key.');
                return;
            }

            // Disable button
            $button.prop('disabled', true).text('Generating...');

            // Send AJAX request
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'bkm_generate_api_key',
                    key_name: keyName,
                    nonce: bkmAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Show success message with API key
                        const $notice = $('<div class="notice notice-warning is-dismissible">' +
                            '<h3>⚠️ Save Your API Key</h3>' +
                            '<p>This key will only be shown once. Please copy it now:</p>' +
                            '<div class="bkm-api-key-display">' +
                            '<code id="new-api-key">' + response.data.api_key + '</code>' +
                            '<button type="button" class="button" onclick="navigator.clipboard.writeText(\'' + response.data.api_key + '\'); alert(\'Copied!\');">Copy</button>' +
                            '</div>' +
                            '</div>');

                        $('.wrap.bkm-settings h1').after($notice);

                        // Clear input
                        $input.val('');

                        // Reload page after 10 seconds to show new key in table
                        setTimeout(function() {
                            location.reload();
                        }, 10000);

                        // Or add to table immediately
                        BKMAdmin.addApiKeyToTable(response.data.key_info);
                    } else {
                        alert('Error: ' + (response.data.message || 'Failed to generate API key'));
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX Error:', xhr.responseText);

                    // Try to parse error message
                    let errorMessage = 'AJAX Error: ' + error;

                    try {
                        const response = JSON.parse(xhr.responseText);
                        if (response.data && response.data.message) {
                            errorMessage = response.data.message;
                        }
                    } catch (e) {
                        // If response is HTML (error page), show generic message
                        if (xhr.responseText && xhr.responseText.indexOf('<') === 0) {
                            errorMessage = 'Server error. Please check:\n\n' +
                                '1. WordPress admin is logged in\n' +
                                '2. Plugin is activated\n' +
                                '3. Check browser console for details\n\n' +
                                'Error code: ' + xhr.status;
                        }
                    }

                    alert(errorMessage);
                },
                complete: function() {
                    // Re-enable button
                    $button.prop('disabled', false).text('Generate New Key');
                }
            });
        },

        /**
         * Add API key to table (optional - for live update)
         */
        addApiKeyToTable: function(keyInfo) {
            const $table = $('.wp-list-table tbody');
            if (!$table.length) {
                // Table doesn't exist yet (first key)
                return;
            }

            const $row = $('<tr>' +
                '<td><strong>' + keyInfo.name + '</strong></td>' +
                '<td><code>' + keyInfo.key_prefix + '...</code></td>' +
                '<td>' + keyInfo.created_at + '</td>' +
                '<td><span class="bkm-text-muted">Never</span></td>' +
                '<td><span class="bkm-badge bkm-badge-success">Active</span></td>' +
                '<td><a href="#" class="bkm-link-danger" onclick="return confirm(\'Are you sure?\');">Revoke</a></td>' +
                '</tr>');

            $table.prepend($row);
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        BKMAdmin.init();
    });

    // Expose to global scope if needed
    window.BKMAdmin = BKMAdmin;

})(jQuery);
