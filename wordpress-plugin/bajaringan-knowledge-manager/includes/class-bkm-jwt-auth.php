<?php
/**
 * JWT Authentication
 */

if (!defined('ABSPATH')) exit;

class BKM_JWT_Auth {
    private $secret_key;

    public function __construct() {
        $this->secret_key = defined('JWT_SECRET_KEY') ? JWT_SECRET_KEY : AUTH_KEY;
    }

    public function generate_token($user) {
        $issued_at = time();
        $expiration = $issued_at + (60 * 60 * 24); // 24 hours

        $payload = array(
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expiration,
            'data' => array(
                'user_id' => $user->ID,
                'user_login' => $user->user_login
            )
        );

        return $this->encode_jwt($payload);
    }

    public function determine_current_user($user_id) {
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';

        if (empty($auth_header)) {
            return $user_id;
        }

        list($token) = sscanf($auth_header, 'Bearer %s');

        if (!$token) {
            return $user_id;
        }

        $payload = $this->decode_jwt($token);

        if (!$payload || !isset($payload->data->user_id)) {
            return $user_id;
        }

        return $payload->data->user_id;
    }

    public function rest_authentication_errors($error) {
        if (!empty($error)) {
            return $error;
        }

        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';

        if (empty($auth_header)) {
            return $error;
        }

        list($token) = sscanf($auth_header, 'Bearer %s');

        if (!$token) {
            return new WP_Error('jwt_invalid', __('Invalid token', 'bajaringan-knowledge-manager'), array('status' => 401));
        }

        $payload = $this->decode_jwt($token);

        if (!$payload) {
            return new WP_Error('jwt_invalid', __('Invalid or expired token', 'bajaringan-knowledge-manager'), array('status' => 401));
        }

        return $error;
    }

    private function encode_jwt($payload) {
        $header = json_encode(array('typ' => 'JWT', 'alg' => 'HS256'));
        $payload = json_encode($payload);

        $base64_header = $this->base64url_encode($header);
        $base64_payload = $this->base64url_encode($payload);

        $signature = hash_hmac('sha256', "$base64_header.$base64_payload", $this->secret_key, true);
        $base64_signature = $this->base64url_encode($signature);

        return "$base64_header.$base64_payload.$base64_signature";
    }

    private function decode_jwt($token) {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return false;
        }

        list($base64_header, $base64_payload, $base64_signature) = $parts;

        $signature = $this->base64url_decode($base64_signature);
        $expected_signature = hash_hmac('sha256', "$base64_header.$base64_payload", $this->secret_key, true);

        if (!hash_equals($signature, $expected_signature)) {
            return false;
        }

        $payload = json_decode($this->base64url_decode($base64_payload));

        if (!$payload || !isset($payload->exp) || $payload->exp < time()) {
            return false;
        }

        return $payload;
    }

    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
