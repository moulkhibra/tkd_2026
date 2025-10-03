<?php
class Score {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // تسجيل نقاط Kyorugi
    public function addKyorugiScore($scoreData) {
        $data = [
            'match_id' => $scoreData['match_id'],
            'round_id' => $scoreData['round_id'],
            'athlete_id' => $scoreData['athlete_id'],
            'referee_id' => $scoreData['referee_id'],
            'score_type' => $scoreData['score_type'],
            'points' => $scoreData['points'],
            'timestamp' => date('Y-m-d H:i:s'),
            'confirmed' => $scoreData['confirmed'] ?? true
        ];
        
        return $this->db->insert('kyorugi_scores', $data);
    }
    
    // تسجيل عقوبة
    public function addPenalty($penaltyData) {
        $data = [
            'match_id' => $penaltyData['match_id'],
            'round_id' => $penaltyData['round_id'],
            'athlete_id' => $penaltyData['athlete_id'],
            'referee_id' => $penaltyData['referee_id'],
            'penalty_type' => $penaltyData['penalty_type'],
            'reason' => Security::sanitize($penaltyData['reason'] ?? ''),
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->insert('penalties', $data);
    }
    
    // جلب نقاط المباراة
    public function getMatchScores($matchId) {
        // نقاط Kyorugi
        $kyorugiScores = $this->db->fetchAll(
            "SELECT ks.*, a.first_name, a.last_name, r.full_name as referee_name 
             FROM kyorugi_scores ks 
             JOIN athletes a ON ks.athlete_id = a.id 
             JOIN referees ref ON ks.referee_id = ref.id 
             JOIN users r ON ref.user_id = r.id 
             WHERE ks.match_id = :match_id 
             ORDER BY ks.timestamp",
            ['match_id' => $matchId]
        );
        
        // العقوبات
        $penalties = $this->db->fetchAll(
            "SELECT p.*, a.first_name, a.last_name, r.full_name as referee_name 
             FROM penalties p 
             JOIN athletes a ON p.athlete_id = a.id 
             JOIN referees ref ON p.referee_id = ref.id 
             JOIN users r ON ref.user_id = r.id 
             WHERE p.match_id = :match_id 
             ORDER BY p.timestamp",
            ['match_id' => $matchId]
        );
        
        // حساب النقاط الإجمالية
        $totalScores = $this->db->fetchAll(
            "SELECT athlete_id, 
                    SUM(points) as total_points,
                    COUNT(*) as score_count
             FROM kyorugi_scores 
             WHERE match_id = :match_id AND confirmed = 1 
             GROUP BY athlete_id",
            ['match_id' => $matchId]
        );
        
        return [
            'kyorugi_scores' => $kyorugiScores,
            'penalties' => $penalties,
            'total_scores' => $totalScores
        ];
    }
    
    // تسجيل نقاط Poomsae
    public function addPoomsaeScore($scoreData) {
        $data = [
            'performance_id' => $scoreData['performance_id'],
            'referee_id' => $scoreData['referee_id'],
            'accuracy_score' => $scoreData['accuracy_score'],
            'presentation_score' => $scoreData['presentation_score'],
            'total_score' => $scoreData['total_score'],
            'submitted_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->insert('poomsae_scores', $data);
    }
    
    // حساب المتوسط لـ Poomsae
    public function calculatePoomsaeAverage($performanceId) {
        $scores = $this->db->fetchAll(
            "SELECT total_score FROM poomsae_scores WHERE performance_id = :performance_id",
            ['performance_id' => $performanceId]
        );
        
        if (count($scores) < 3) {
            throw new Exception("يحتاج على الأقل 3 حكام لتقييم الأداء");
        }
        
        $totalScores = array_column($scores, 'total_score');
        
        // حذف أعلى وأقل درجة إذا كان هناك 5 حكام أو أكثر
        if (count($totalScores) >= 5) {
            sort($totalScores);
            array_shift($totalScores); // حذف أقل درجة
            array_pop($totalScores);   // حذف أعلى درجة
        }
        
        $average = array_sum($totalScores) / count($totalScores);
        
        return round($average, 2);
    }
}
?>