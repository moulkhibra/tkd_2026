<?php
class Athlete {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // إنشاء متسابق جديد
    public function create($athleteData) {
        $data = [
            'first_name' => Security::sanitize($athleteData['first_name']),
            'last_name' => Security::sanitize($athleteData['last_name']),
            'date_of_birth' => $athleteData['date_of_birth'],
            'gender' => $athleteData['gender'],
            'nationality' => Security::sanitize($athleteData['nationality'] ?? ''),
            'club_name' => Security::sanitize($athleteData['club_name']),
            'belt_level_id' => $athleteData['belt_level_id'],
            'weight' => $athleteData['weight'] ?? null,
            'guardian_name' => Security::sanitize($athleteData['guardian_name'] ?? ''),
            'guardian_phone' => Security::sanitize($athleteData['guardian_phone'] ?? ''),
            'email' => Security::sanitize($athleteData['email'] ?? '')
        ];
        
        return $this->db->insert('athletes', $data);
    }
    
    // جلب جميع المتسابقين
    public function getAll($filters = []) {
        $sql = "SELECT a.*, b.name as belt_name, b.color as belt_color 
                FROM athletes a 
                LEFT JOIN belt_levels b ON a.belt_level_id = b.id 
                WHERE 1=1";
        $params = [];
        
        if (isset($filters['club_name'])) {
            $sql .= " AND a.club_name LIKE :club_name";
            $params['club_name'] = '%' . $filters['club_name'] . '%';
        }
        
        if (isset($filters['belt_level_id'])) {
            $sql .= " AND a.belt_level_id = :belt_level_id";
            $params['belt_level_id'] = $filters['belt_level_id'];
        }
        
        if (isset($filters['gender'])) {
            $sql .= " AND a.gender = :gender";
            $params['gender'] = $filters['gender'];
        }
        
        $sql .= " ORDER BY a.first_name, a.last_name";
        
        return $this->db->fetchAll($sql, $params);
    }
    
    // جلب متسابق بالمعرف
    public function getById($id) {
        $sql = "SELECT a.*, b.name as belt_name, b.color as belt_color 
                FROM athletes a 
                LEFT JOIN belt_levels b ON a.belt_level_id = b.id 
                WHERE a.id = :id";
        
        return $this->db->fetch($sql, ['id' => $id]);
    }
    
    // تحديث بيانات المتسابق
    public function update($id, $data) {
        $allowedFields = ['first_name', 'last_name', 'club_name', 'belt_level_id', 'weight', 'guardian_name', 'guardian_phone', 'email'];
        $updateData = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = Security::sanitize($data[$field]);
            }
        }
        
        if (!empty($updateData)) {
            $this->db->update('athletes', $updateData, 'id = :id', ['id' => $id]);
            return true;
        }
        
        return false;
    }
    
    // تسجيل متسابق في بطولة
    public function registerInTournament($athleteId, $tournamentId, $categoryId, $data = []) {
        $registrationData = [
            'tournament_id' => $tournamentId,
            'category_id' => $categoryId,
            'athlete_id' => $athleteId,
            'registration_date' => date('Y-m-d H:i:s'),
            'payment_status' => $data['payment_status'] ?? 'pending',
            'status' => 'pending',
            'seed_number' => $data['seed_number'] ?? null
        ];
        
        return $this->db->insert('tournament_registrations', $registrationData);
    }
    
    // جلب تسجيلات المتسابق
    public function getRegistrations($athleteId) {
        $sql = "SELECT tr.*, t.name as tournament_name, tc.name as category_name 
                FROM tournament_registrations tr 
                JOIN tournaments t ON tr.tournament_id = t.id 
                JOIN tournament_categories tc ON tr.category_id = tc.id 
                WHERE tr.athlete_id = :athlete_id 
                ORDER BY tr.registration_date DESC";
        
        return $this->db->fetchAll($sql, ['athlete_id' => $athleteId]);
    }
}
?>