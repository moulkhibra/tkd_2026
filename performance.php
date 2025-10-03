<?php
class PerformanceMonitor {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // تسجيل مقاييس الأداء
    public function logMetric($data) {
        $logData = [
            'metric' => $data['metric'],
            'value' => $data['value'],
            'context' => $data['context'] ?? '',
            'user_agent' => $data['userAgent'] ?? '',
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        return $this->db->insert('performance_logs', $logData);
    }
    
    // الحصول على تقرير الأداء
    public function getPerformanceReport($days = 7) {
        $sql = "
            SELECT 
                metric,
                AVG(value) as avg_value,
                MAX(value) as max_value,
                MIN(value) as min_value,
                COUNT(*) as request_count,
                DATE(created_at) as date
            FROM performance_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY metric, DATE(created_at)
            ORDER BY date DESC, metric
        ";
        
        return $this->db->fetchAll($sql, [$days]);
    }
    
    // تحليل بطء API
    public function analyzeSlowRequests($threshold = 1000) {
        $sql = "
            SELECT 
                context,
                AVG(value) as avg_response_time,
                COUNT(*) as request_count,
                MAX(created_at) as last_occurrence
            FROM performance_logs 
            WHERE metric = 'api_call' AND value > ?
            GROUP BY context
            HAVING COUNT(*) > 5
            ORDER BY avg_response_time DESC
        ";
        
        return $this->db->fetchAll($sql, [$threshold]);
    }
}
?>