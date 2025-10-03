<?php
class User {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // إنشاء مستخدم جديد
    public function create($userData) {
        $data = [
            'username' => Security::sanitize($userData['username']),
            'email' => Security::sanitize($userData['email']),
            'password_hash' => Security::hashPassword($userData['password']),
            'full_name' => Security::sanitize($userData['full_name']),
            'phone' => Security::sanitize($userData['phone'] ?? ''),
            'role' => $userData['role'] ?? 'viewer',
            'status' => 'active'
        ];
        
        return $this->db->insert('users', $data);
    }
    
    // جلب مستخدم بالمعرف
    public function getById($id) {
        return $this->db->fetch("SELECT * FROM users WHERE id = :id", ['id' => $id]);
    }
    
    // تحديث بيانات المستخدم
    public function update($id, $data) {
        $allowedFields = ['full_name', 'phone', 'role', 'status'];
        $updateData = [];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateData[$field] = Security::sanitize($data[$field]);
            }
        }
        
        if (!empty($updateData)) {
            $this->db->update('users', $updateData, 'id = :id', ['id' => $id]);
        }
    }
    
    // جلب جميع المستخدمين
    public function getAll($filters = []) {
        $sql = "SELECT id, username, email, full_name, phone, role, status, created_at FROM users WHERE 1=1";
        $params = [];
        
        if (isset($filters['role'])) {
            $sql .= " AND role = :role";
            $params['role'] = $filters['role'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND status = :status";
            $params['status'] = $filters['status'];
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        return $this->db->fetchAll($sql, $params);
    }
}
?>