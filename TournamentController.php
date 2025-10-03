<?php
class TournamentController {
    private $tournamentModel;
    private $auth;
    
    public function __construct() {
        $this->tournamentModel = new Tournament();
        $this->auth = new Auth();
    }
    
    // إنشاء بطولة جديدة
    public function createTournament($request) {
        try {
            if (!$this->auth->hasPermission('organizer')) {
                throw new Exception("ليس لديك صلاحية إنشاء بطولات");
            }
            
            $user = $this->auth->getCurrentUser();
            $request['organizer_id'] = $user['user_id'];
            
            $tournamentId = $this->tournamentModel->create($request);
            
            return [
                'success' => true,
                'message' => "تم إنشاء البطولة بنجاح",
                'tournament_id' => $tournamentId
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // جلب جميع البطولات
    public function getAllTournaments($filters = []) {
        try {
            $tournaments = $this->tournamentModel->getAll($filters);
            
            return [
                'success' => true,
                'data' => $tournaments
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // جلب بطولة محددة
    public function getTournament($id) {
        try {
            $tournament = $this->tournamentModel->getById($id);
            
            if (!$tournament) {
                throw new Exception("البطولة غير موجودة");
            }
            
            return [
                'success' => true,
                'data' => $tournament
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // تحديث حالة البطولة
    public function updateTournamentStatus($id, $status) {
        try {
            if (!$this->auth->hasPermission('organizer')) {
                throw new Exception("ليس لديك صلاحية تعديل البطولة");
            }
            
            $this->tournamentModel->updateStatus($id, $status);
            
            return [
                'success' => true,
                'message' => "تم تحديث حالة البطولة"
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