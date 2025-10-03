<?php
require_once '../config/config.php';
require_once '../core/Database.php';
require_once '../core/Auth.php';
require_once '../core/Security.php';

header('Content-Type: application/json');
$response = ['success' => false, 'message' => ''];

try {
    $auth = new Auth();
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action'])) {
                switch ($input['action']) {
                    case 'login':
                        if (!isset($input['username']) || !isset($input['password'])) {
                            throw new Exception("يجب إدخال اسم المستخدم وكلمة المرور");
                        }
                        
                        $userData = $auth->login($input['username'], $input['password']);
                        $response['success'] = true;
                        $response['message'] = "تم تسجيل الدخول بنجاح";
                        $response['user'] = $userData;
                        break;
                        
                    case 'logout':
                        $auth->logout();
                        $response['success'] = true;
                        $response['message'] = "تم تسجيل الخروج بنجاح";
                        break;
                        
                    default:
                        throw new Exception("إجراء غير معروف");
                }
            }
            break;
            
        case 'GET':
            if ($auth->isLoggedIn()) {
                $response['success'] = true;
                $response['user'] = $auth->getCurrentUser();
            } else {
                $response['message'] = "غير مسجل الدخول";
            }
            break;
            
        default:
            throw new Exception("طريقة غير مدعومة");
    }
    
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>