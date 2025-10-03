<?php
class AppConfig {
    const APP_NAME = 'نظام إدارة بطولات التايكواندو';
    const APP_VERSION = '1.0';
    const SESSION_TIMEOUT = 3600; // 1 ساعة
    const MAX_LOGIN_ATTEMPTS = 5;
    
    // إعدادات الأمان
    const JWT_SECRET = 'taekwondo_secret_key_2024';
    const PASSWORD_COST = 12;
    
    public static function getBaseUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        return $protocol . "://" . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']);
    }
}
?>