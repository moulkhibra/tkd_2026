<?php
class AuthController {
    private $auth;
    private $userModel;
    
    public function __construct() {
        $this->auth = new Auth();
        $this->userModel = new User();
    }
    
    // معالجة تسجيل الدخول
    public function login($request) {
        try {
            if (!$request['username'] || !$request['password']) {
                throw new Exception("يجب إدخال اسم المستخدم وكلمة المرور");
            }
            
            $userData = $this->auth->login($request['username'], $request['password']);
            
            return [
                'success' => true,
                'message' => "تم تسجيل الدخول بنجاح",
                'user' => $userData
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // معالجة تسجيل الخروج
    public function logout() {
        try {
            $this->auth->logout();
            
            return [
                'success' => true,
                'message' => "تم تسجيل الخروج بنجاح"
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // التحقق من حالة المستخدم
    public function checkAuth() {
        try {
            if ($this->auth->isLoggedIn()) {
                return [
                    'success' => true,
                    'user' => $this->auth->getCurrentUser()
                ];
            } else {
                return [
                    'success' => false,
                    'message' => "غير مسجل الدخول"
                ];
            }
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // إنشاء مستخدم جديد (للمسؤولين فقط)
    public function createUser($request) {
        try {
            if (!$this->auth->hasPermission('admin')) {
                throw new Exception("ليس لديك صلاحية إنشاء مستخدمين");
            }
            
            $userId = $this->userModel->create($request);
            
            return [
                'success' => true,
                'message' => "تم إنشاء المستخدم بنجاح",
                'user_id' => $userId
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
?>