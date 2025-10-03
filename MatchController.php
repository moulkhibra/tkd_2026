<?php
class MatchController {
    private $matchModel;
    private $scoreModel;
    private $auth;
    
    public function __construct() {
        $this->matchModel = new matchModel();
        $this->scoreModel = new Score();
        $this->auth = new Auth();
    }
    
    // إنشاء مباراة جديدة
    public function createMatch($request) {
        try {
            if (!$this->auth->hasPermission('organizer')) {
                throw new Exception("ليس لديك صلاحية إنشاء مباريات");
            }
            
            $matchId = $this->matchModel->create($request);
            
            return [
                'success' => true,
                'message' => "تم إنشاء المباراة بنجاح",
                'match_id' => $matchId
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // جلب مباريات البطولة
    public function getTournamentMatches($tournamentId, $filters = []) {
        try {
            $matches = $this->matchModel->getByTournament($tournamentId, $filters);
            
            return [
                'success' => true,
                'data' => $matches
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // تحديث حالة المباراة
    public function updateMatchStatus($matchId, $status) {
        try {
            if (!$this->auth->hasPermission('referee')) {
                throw new Exception("ليس لديك صلاحية إدارة المباريات");
            }
            
            $this->matchModel->updateStatus($matchId, $status);
            
            return [
                'success' => true,
                'message' => "تم تحديث حالة المباراة"
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // تسجيل نقاط
    public function addScore($scoreData) {
        try {
            if (!$this->auth->hasPermission('referee')) {
                throw new Exception("ليس لديك صلاحية تسجيل النقاط");
            }
            
            // إضافة معرف الحكم من الجلسة
            $user = $this->auth->getCurrentUser();
            $scoreData['referee_id'] = $user['user_id'];
            
            $scoreId = $this->scoreModel->addKyorugiScore($scoreData);
            
            return [
                'success' => true,
                'message' => "تم تسجيل النقاط بنجاح",
                'score_id' => $scoreId
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // توليد bracket تلقائي
    public function generateBracket($tournamentId, $categoryId) {
        try {
            if (!$this->auth->hasPermission('organizer')) {
                throw new Exception("ليس لديك صلاحية توليد Bracket");
            }
            
            $result = $this->matchModel->generateBracket($tournamentId, $categoryId);
            
            return [
                'success' => true,
                'message' => "تم توليد Bracket بنجاح",
                'data' => $result
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