<?php
class matchModel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // إنشاء مباراة جديدة
    public function create($matchData) {
        $data = [
            'tournament_id' => $matchData['tournament_id'],
            'category_id' => $matchData['category_id'],
            'ring_id' => $matchData['ring_id'] ?? null,
            'round_number' => $matchData['round_number'],
            'match_number' => $matchData['match_number'],
            'bracket_position' => Security::sanitize($matchData['bracket_position'] ?? ''),
            'athlete1_id' => $matchData['athlete1_id'] ?? null,
            'athlete2_id' => $matchData['athlete2_id'] ?? null,
            'scheduled_time' => $matchData['scheduled_time'] ?? null,
            'status' => $matchData['status'] ?? 'scheduled',
            'is_bye' => $matchData['is_bye'] ?? false
        ];
        
        return $this->db->insert('matches', $data);
    }
    
    // جلب مباراة بالمعرف
    public function getById($id) {
        $sql = "SELECT m.*, 
                a1.first_name as athlete1_first_name, a1.last_name as athlete1_last_name, a1.club_name as athlete1_club,
                a2.first_name as athlete2_first_name, a2.last_name as athlete2_last_name, a2.club_name as athlete2_club,
                t.name as tournament_name, tc.name as category_name, r.name as ring_name
                FROM matches m 
                LEFT JOIN athletes a1 ON m.athlete1_id = a1.id 
                LEFT JOIN athletes a2 ON m.athlete2_id = a2.id 
                JOIN tournaments t ON m.tournament_id = t.id 
                JOIN tournament_categories tc ON m.category_id = tc.id 
                LEFT JOIN rings r ON m.ring_id = r.id 
                WHERE m.id = :id";
        
        return $this->db->fetch($sql, ['id' => $id]);
    }
    
    // جلب مباريات البطولة
    public function getByTournament($tournamentId, $filters = []) {
        $sql = "SELECT m.*, 
                a1.first_name as athlete1_first_name, a1.last_name as athlete1_last_name, a1.club_name as athlete1_club,
                a2.first_name as athlete2_first_name, a2.last_name as athlete2_last_name, a2.club_name as athlete2_club,
                tc.name as category_name, r.name as ring_name
                FROM matches m 
                LEFT JOIN athletes a1 ON m.athlete1_id = a1.id 
                LEFT JOIN athletes a2 ON m.athlete2_id = a2.id 
                JOIN tournament_categories tc ON m.category_id = tc.id 
                LEFT JOIN rings r ON m.ring_id = r.id 
                WHERE m.tournament_id = :tournament_id";
        $params = ['tournament_id' => $tournamentId];
        
        if (isset($filters['category_id'])) {
            $sql .= " AND m.category_id = :category_id";
            $params['category_id'] = $filters['category_id'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND m.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['round_number'])) {
            $sql .= " AND m.round_number = :round_number";
            $params['round_number'] = $filters['round_number'];
        }
        
        $sql .= " ORDER BY m.round_number, m.match_number";
        
        return $this->db->fetchAll($sql, $params);
    }
    
    // تحديث حالة المباراة
    public function updateStatus($id, $status) {
        $allowedStatuses = ['scheduled', 'ready', 'in_progress', 'completed', 'cancelled'];
        
        if (in_array($status, $allowedStatuses)) {
            $updateData = ['status' => $status];
            
            if ($status === 'in_progress') {
                $updateData['actual_start_time'] = date('Y-m-d H:i:s');
            } elseif ($status === 'completed') {
                $updateData['actual_end_time'] = date('Y-m-d H:i:s');
            }
            
            $this->db->update('matches', $updateData, 'id = :id', ['id' => $id]);
            return true;
        }
        
        return false;
    }
    
    // تحديد الفائز
    public function setWinner($matchId, $winnerId, $winMethod = 'points') {
        $allowedMethods = ['points', 'knockout', 'disqualification', 'withdrawal', 'judges_decision'];
        
        if (in_array($winMethod, $allowedMethods)) {
            $updateData = [
                'winner_id' => $winnerId,
                'win_method' => $winMethod,
                'status' => 'completed',
                'actual_end_time' => date('Y-m-d H:i:s')
            ];
            
            $this->db->update('matches', $updateData, 'id = :id', ['id' => $matchId]);
            return true;
        }
        
        return false;
    }
    
    // توليد bracket تلقائي
    public function generateBracket($tournamentId, $categoryId) {
        try {
            // جلب المتسابقين المسجلين
            $sql = "SELECT tr.athlete_id, tr.seed_number, a.first_name, a.last_name, a.club_name 
                    FROM tournament_registrations tr 
                    JOIN athletes a ON tr.athlete_id = a.id 
                    WHERE tr.tournament_id = :tournament_id 
                    AND tr.category_id = :category_id 
                    AND tr.status = 'approved' 
                    ORDER BY tr.seed_number ASC, RAND()";
            
            $athletes = $this->db->fetchAll($sql, [
                'tournament_id' => $tournamentId,
                'category_id' => $categoryId
            ]);
            
            $totalPlayers = count($athletes);
            
            if ($totalPlayers < 2) {
                throw new Exception("يحتاج على الأقل لاعبين لتوليد Bracket");
            }
            
            // حساب حجم البطولة (أقرب قوة 2)
            $bracketSize = pow(2, ceil(log($totalPlayers, 2)));
            $byeCount = $bracketSize - $totalPlayers;
            
            // إنشاء الجولة الأولى
            $round = 1;
            $matchNumber = 1;
            
            for ($i = 0; $i < $bracketSize; $i += 2) {
                $athlete1 = isset($athletes[$i]) ? $athletes[$i] : null;
                $athlete2 = isset($athletes[$i + 1]) ? $athletes[$i + 1] : null;
                
                $matchData = [
                    'tournament_id' => $tournamentId,
                    'category_id' => $categoryId,
                    'round_number' => $round,
                    'match_number' => $matchNumber,
                    'bracket_position' => "R{$round}_M{$matchNumber}",
                    'athlete1_id' => $athlete1 ? $athlete1['athlete_id'] : null,
                    'athlete2_id' => $athlete2 ? $athlete2['athlete_id'] : null,
                    'status' => ($athlete1 && $athlete2) ? 'scheduled' : 'completed',
                    'is_bye' => !($athlete1 && $athlete2)
                ];
                
                $matchId = $this->create($matchData);
                
                // إذا كانت مباراة bye، تحديد الفائز تلقائياً
                if (!$athlete1 || !$athlete2) {
                    $winnerId = $athlete1 ? $athlete1['athlete_id'] : $athlete2['athlete_id'];
                    $this->setWinner($matchId, $winnerId, 'withdrawal');
                }
                
                $matchNumber++;
            }
            
            return ['success' => true, 'total_matches' => $matchNumber - 1, 'total_players' => $totalPlayers];
            
        } catch (Exception $e) {
            throw new Exception("فشل في توليد Bracket: " . $e->getMessage());
        }
    }
}
?>