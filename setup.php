<?php
require_once 'config/database.php';
require_once 'core/Database.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>إعداد نظام التايكواندو</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .success { color: green; padding: 10px; background: #f0fff0; margin: 10px 0; }
        .error { color: red; padding: 10px; background: #fff0f0; margin: 10px 0; }
        .box { border: 1px solid #ddd; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🥋 إعداد نظام إدارة بطولات التايكواندو</h1>
    
    <?php
    try {
        $db = Database::getInstance();
        echo "<div class='success'>✅ تم الاتصال بقاعدة البيانات بنجاح</div>";
        
        // إنشاء المستخدم المسؤول الافتراضي
        $userModel = new User();
        $adminData = [
            'username' => 'admin',
            'email' => 'admin@taekwondo.com',
            'password' => 'password',
            'full_name' => 'مدير النظام',
            'role' => 'admin'
        ];
        
        $adminId = $userModel->create($adminData);
        echo "<div class='success'>✅ تم إنشاء المستخدم المسؤول</div>";
        echo "<div class='box'>";
        echo "<strong>بيانات الدخول:</strong><br>";
        echo "اسم المستخدم: admin<br>";
        echo "كلمة المرور: password<br>";
        echo "البريد الإلكتروني: admin@taekwondo.com";
        echo "</div>";
        
        echo "<div class='success'>🎉 تم إعداد النظام بنجاح!</div>";
        
    } catch (Exception $e) {
        echo "<div class='error'>❌ خطأ في الإعداد: " . $e->getMessage() . "</div>";
    }
    ?>
    
    <div class="box">
        <h3>الخطوات التالية:</h3>
        <ol>
            <li>احفظ بيانات الدخول بأمان</li>
            <li>احذف ملف setup.php من السيرفر</li>
            <li>ابدأ باستخدام النظام من خلال واجهة المستخدم</li>
        </ol>
    </div>
</body>
</html>