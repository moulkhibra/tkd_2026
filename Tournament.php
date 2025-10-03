<?php
class Tournament {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // إنشاء بطولة جديدة
    public function create($tournamentData) {
        $data = [
            'name' => Security::sanitize($tournamentData['name']),
            'description' => Security::sanitize($tournamentData['description'] ?? ''),
            'start_date' => $tournamentData['start_date'],
            'end_date' => $tournamentData['end_date'],
            'location' => Security::sanitize($tournamentData['location']),
            'organizer_id' => $tournamentData['organizer_id'],
            'status' => 'draft'
        ];
        
        return $this->db->insert('tournaments', $data);
    }
    
    // جلب جميع البطولات
    public function getAll($filters = []) {
        $sql = "SELECT t.*, u.full_name as organizer_name 
                FROM tournaments t 
                LEFT JOIN users u ON t.organizer_id = u.id 
                WHERE 1=1";
        $params = [];
        
        if (isset($filters['status'])) {
            $sql .= " AND t.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['organizer_id'])) {
            $sql .= " AND t.organizer_id = :organizer_id";
            $params['organizer_id'] = $filters['organizer_id'];
        }
        
        $sql .= " ORDER BY t.start_date DESC";
        
        return $this->db->fetchAll($sql, $params);
    }
    
    // جلب بطولة بالمعرف
    public function getById($id) {
        $sql = "SELECT t.*, u.full_name as organizer_name 
                FROM tournaments t 
                LEFT JOIN users u ON t.organizer_id = u.id 
                WHERE t.id = :id";
        
        return $this->db->fetch($sql, ['id' => $id]);
    }
    
    // تحديث حالة البطولة
    public function updateStatus($id, $status) {
        $allowedStatuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];
        
        if (in_array($status, $allowedStatuses)) {
            $this->db->update('tournaments', ['status' => $status], 'id = :id', ['id' => $id]);
            return true;
        }
        
        return false;
    }
}
?>