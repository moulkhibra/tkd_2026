<?php
class Session {
    
    public function __construct() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    // تعيين قيمة في الجلسة
    public function set($key, $value) {
        $_SESSION[$key] = $value;
    }
    
    // جلب قيمة من الجلسة
    public function get($key, $default = null) {
        return $_SESSION[$key] ?? $default;
    }
    
    // حذف قيمة من الجلسة
    public function delete($key) {
        unset($_SESSION[$key]);
    }
    
    // تدمير الجلسة
    public function destroy() {
        session_destroy();
    }
    
    // تعيين رسالة مؤقتة (Flash Message)
    public function setFlash($type, $message) {
        $_SESSION['flash_' . $type] = $message;
    }
    
    // جلب رسالة مؤقتة
    public function getFlash($type) {
        $message = $_SESSION['flash_' . $type] ?? null;
        unset($_SESSION['flash_' . $type]);
        return $message;
    }
}
?>