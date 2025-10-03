<?php
class Security {
    
    // تشفير كلمة المرور
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => AppConfig::PASSWORD_COST]);
    }
    
    // التحقق من كلمة المرور
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    // توليد توكن عشوائي
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length));
    }
    
    // تنظيف المدخلات
    public static function sanitize($input) {
        if (is_array($input)) {
            return array_map([self::class, 'sanitize'], $input);
        }
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    // التحقق من البريد الإلكتروني
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    // التحقق من الصلاحيات
    public static function checkPermission($requiredRole, $userRole) {
        $rolesHierarchy = [
            'viewer' => 1,
            'referee' => 2,
            'organizer' => 3,
            'admin' => 4
        ];
        
        return $rolesHierarchy[$userRole] >= $rolesHierarchy[$requiredRole];
    }
}
?>