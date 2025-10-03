<?php
class Auth {
    private $db;
    private $session;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->session = new Session();
    }
    
    // تسجيل الدخول
    public function login($username, $password) {
        // تنظيف المدخلات
        $username = Security::sanitize($username);
        
        // جلب بيانات المستخدم
        $user = $this->db->fetch(
            "SELECT * FROM users WHERE username = :username AND status = 'active'",
            ['username' => $username]
        );
        
        if (!$user || !Security::verifyPassword($password, $user['password_hash'])) {
            throw new Exception("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
        
        // تحديث آخر دخول
        $this->db->update(
            'users',
            ['last_login' => date('Y-m-d H:i:s')],
            'id = :id',
            ['id' => $user['id']]
        );
        
        // إنشاء جلسة
        $sessionData = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'full_name' => $user['full_name'],
            'login_time' => time()
        ];
        
        $this->session->set('user', $sessionData);
        
        return $sessionData;
    }
    
    // تسجيل الخروج
    public function logout() {
        $this->session->destroy();
        return true;
    }
    
    // التحقق من تسجيل الدخول
    public function isLoggedIn() {
        $user = $this->session->get('user');
        return !empty($user) && isset($user['user_id']);
    }
    
    // جلب بيانات المستخدم الحالي
    public function getCurrentUser() {
        return $this->session->get('user');
    }
    
    // التحقق من الصلاحية
    public function hasPermission($requiredRole) {
        $user = $this->getCurrentUser();
        if (!$user) return false;
        
        return Security::checkPermission($requiredRole, $user['role']);
    }
}
?>