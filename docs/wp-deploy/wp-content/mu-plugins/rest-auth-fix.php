<?php
/**
 * Plugin Name: REST Auth Header Fix
 * Description: Authorization ヘッダーが PHP に届かないサーバー向け（シン・XServer 等）
 * Version: 1.0
 */

declare(strict_types=1);

add_action('plugins_loaded', static function (): void {
    if (isset($_SERVER['HTTP_AUTHORIZATION']) && $_SERVER['HTTP_AUTHORIZATION'] !== '') {
        return;
    }
    if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) && $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] !== '') {
        $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        return;
    }
    if (!function_exists('getallheaders')) {
        return;
    }
    $headers = getallheaders();
    if (!is_array($headers)) {
        return;
    }
    foreach ($headers as $key => $value) {
        if (strtolower((string) $key) === 'authorization' && $value !== '') {
            $_SERVER['HTTP_AUTHORIZATION'] = $value;
            break;
        }
    }
}, 0);
