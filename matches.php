<?php
require_once '../config/config.php';
require_once '../core/Database.php';
require_once '../core/Auth.php';
require_once '../models/Match.php';
require_once '../controllers/MatchController.php';

header('Content-Type: application/json; charset=utf-8');
$response = ['success' => false, 'message' => ''];

try {
    $auth = new Auth();
    
    if (!$auth->isLoggedIn()) {
        throw new Exception("يجب تسجيل الدخول أولاً");
    }
    
    $matchController = new MatchController();
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['tournament_id'])) {
                $filters = [];
                if (isset($_GET['category_id'])) $filters['category_id'] = $_GET['category_id'];
                if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
                if (isset($_GET['round_number'])) $filters['round_number'] = $_GET['round_number'];
                
                $response = $matchController->getTournamentMatches($_GET['tournament_id'], $filters);
            } else {
                throw new Exception("معرف البطولة مطلوب");
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (isset($input['action'])) {
                switch ($input['action']) {
                    case 'create':
                        $response = $matchController->createMatch($input);
                        break;
                        
                    case 'generate_bracket':
                        if (!isset($input['tournament_id']) || !isset($input['category_id'])) {
                            throw new Exception("معرف البطولة والفئة مطلوبان");
                        }
                        $response = $matchController->generateBracket($input['tournament_id'], $input['category_id']);
                        break;
                        
                    case 'add_score':
                        $response = $matchController->addScore($input);
                        break;
                        
                    case 'update_status':
                        if (!isset($input['match_id']) || !isset($input['status'])) {
                            throw new Exception("معرف المباراة والحالة مطلوبان");
                        }
                        $response = $matchController->updateMatchStatus($input['match_id'], $input['status']);
                        break;
                        
                    default:
                        throw new Exception("إجراء غير معروف");
                }
            } else {
                throw new Exception("الإجراء مطلوب");
            }
            break;
            
        default:
            throw new Exception("طريقة غير مدعومة");
    }
    
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>