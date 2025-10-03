<?php
require_once '../config/config.php';
require_once '../core/Database.php';
require_once '../core/Auth.php';
require_once '../models/Tournament.php';
require_once '../controllers/TournamentController.php';

header('Content-Type: application/json; charset=utf-8');
$response = ['success' => false, 'message' => ''];

try {
    $auth = new Auth();
    
    if (!$auth->isLoggedIn()) {
        throw new Exception("يجب تسجيل الدخول أولاً");
    }
    
    $tournamentController = new TournamentController();
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            $filters = [];
            if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
            
            if (isset($_GET['id'])) {
                $response = $tournamentController->getTournament($_GET['id']);
            } else {
                $response = $tournamentController->getAllTournaments($filters);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            $response = $tournamentController->createTournament($input);
            break;
            
        case 'PUT':
            parse_str(file_get_contents('php://input'), $input);
            
            if (!isset($input['id']) || !isset($input['status'])) {
                throw new Exception("معرف البطولة والحالة مطلوبان");
            }
            
            $response = $tournamentController->updateTournamentStatus($input['id'], $input['status']);
            break;
            
        default:
            throw new Exception("طريقة غير مدعومة");
    }
    
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>