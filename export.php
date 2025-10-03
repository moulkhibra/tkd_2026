<?php
require_once '../config/config.php';
require_once '../core/Database.php';
require_once '../core/Auth.php';
require_once '../core/Security.php';

class ExportSystem {
    private $db;
    private $auth;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->auth = new Auth();
    }
    
    // تصدير التقرير
    public function exportReport($format, $reportType, $filters = []) {
        if (!$this->auth->hasPermission('admin')) {
            throw new Exception("ليس لديك صلاحية التصدير");
        }
        
        switch ($format) {
            case 'pdf':
                return $this->exportToPDF($reportType, $filters);
            case 'excel':
                return $this->exportToExcel($reportType, $filters);
            case 'csv':
                return $this->exportToCSV($reportType, $filters);
            default:
                throw new Exception("صيغة غير مدعومة");
        }
    }
    
    // تصدير إلى PDF
    private function exportToPDF($reportType, $filters) {
        // استخدام مكتبة مثل TCPDF أو Dompdf
        $data = $this->getReportData($reportType, $filters);
        
        // إنشاء محتوى PDF
        $html = $this->generatePDFContent($reportType, $data);
        
        // في نظام حقيقي، سيتم استخدام مكتبة PDF
        // هذا مثال مبسط
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="report.pdf"');
        
        // محاكاة إنشاء PDF
        return "PDF Content for {$reportType}";
    }
    
    // تصدير إلى Excel
    private function exportToExcel($reportType, $filters) {
        $data = $this->getReportData($reportType, $filters);
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="report.xlsx"');
        
        // استخدام مكتبة مثل PhpSpreadsheet
        return $this->generateExcelContent($reportType, $data);
    }
    
    // إنشاء نسخة احتياطية
    public function createBackup($type = 'full') {
        if (!$this->auth->hasPermission('admin')) {
            throw new Exception("ليس لديك صلاحية إنشاء نسخ احتياطية");
        }
        
        $backupData = [
            'metadata' => [
                'created_at' => date('Y-m-d H:i:s'),
                'type' => $type,
                'version' => '1.0'
            ],
            'data' => []
        ];
        
        if ($type === 'full' || $type === 'data') {
            $backupData['data'] = $this->backupDatabase();
        }
        
        if ($type === 'full' || $type === 'files') {
            $backupData['files'] = $this->backupFiles();
        }
        
        $filename = "backup_" . date('Y-m-d_H-i-s') . ".json";
        $backupPath = "../backups/" . $filename;
        
        file_put_contents($backupPath, json_encode($backupData, JSON_PRETTY_PRINT));
        
        return $filename;
    }
    
    // استعادة نسخة احتياطية
    public function restoreBackup($filename) {
        if (!$this->auth->hasPermission('admin')) {
            throw new Exception("ليس لديك صلاحية استعادة النسخ الاحتياطية");
        }
        
        $backupPath = "../backups/" . $filename;
        
        if (!file_exists($backupPath)) {
            throw new Exception("النسخة الاحتياطية غير موجودة");
        }
        
        $backupData = json_decode(file_get_contents($backupPath), true);
        
        if ($backupData['metadata']['version'] !== '1.0') {
            throw new Exception("إصدار النسخة الاحتياطية غير مدعوم");
        }
        
        // استعادة البيانات
        if (isset($backupData['data'])) {
            $this->restoreDatabase($backupData['data']);
        }
        
        return true;
    }
    
    // نسخ قاعدة البيانات احتياطياً
    private function backupDatabase() {
        $tables = ['users', 'tournaments', 'athletes', 'matches', 'scores', 'payments'];
        $backup = [];
        
        foreach ($tables as $table) {
            $backup[$table] = $this->db->fetchAll("SELECT * FROM $table");
        }
        
        return $backup;
    }
    
    // استعادة قاعدة البيانات
    private function restoreDatabase($data) {
        $this->db->beginTransaction();
        
        try {
            // تفريغ الجداول
            $tables = array_keys($data);
            foreach ($tables as $table) {
                $this->db->query("DELETE FROM $table");
            }
            
            // إعادة تعبئة البيانات
            foreach ($data as $table => $records) {
                foreach ($records as $record) {
                    $this->db->insert($table, $record);
                }
            }
            
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
?>