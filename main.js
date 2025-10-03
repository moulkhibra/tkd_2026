// الملف الرئيسي للوظائف العامة
class TaekwondoSystem {
    constructor() {
        this.apiBase = '../api';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadStats();
        this.setupEventListeners();
        this.updateCurrentTime();
    }

    // التحقق من حالة المصادقة
    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBase}/auth.php`);
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.updateAuthUI();
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    // تحديث واجهة المستخدم حسب حالة المصادقة
    updateAuthUI() {
        const authSection = document.getElementById('authSection');
        if (this.currentUser) {
            authSection.innerHTML = `
                <div class="user-menu">
                    <span>مرحباً، ${this.currentUser.full_name}</span>
                    <button class="btn-logout" onclick="system.logout()">تسجيل الخروج</button>
                </div>
            `;
        }
    }

    // تسجيل الدخول
    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.updateAuthUI();
                this.hideLoginModal();
                this.showAlert('تم تسجيل الدخول بنجاح', 'success');
                return true;
            } else {
                this.showAlert(data.message, 'error');
                return false;
            }
        } catch (error) {
            this.showAlert('خطأ في الاتصال بالخادم', 'error');
            return false;
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            await fetch(`${this.apiBase}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });

            this.currentUser = null;
            this.updateAuthUI();
            this.showAlert('تم تسجيل الخروج بنجاح', 'success');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }

    // تحميل الإحصائيات
    async loadStats() {
        try {
            // تحميل إحصائيات البطولات
            const tournamentsResponse = await fetch(`${this.apiBase}/tournaments.php`);
            const tournamentsData = await tournamentsResponse.json();
            
            if (tournamentsData.success) {
                document.getElementById('tournamentsCount').textContent = tournamentsData.data.length;
            }

            // تحميل إحصائيات المتسابقين
            const athletesResponse = await fetch(`${this.apiBase}/athletes.php`);
            const athletesData = await athletesResponse.json();
            
            if (athletesData.success) {
                document.getElementById('athletesCount').textContent = athletesData.data.length;
            }

            // تحميل إحصائيات المباريات
            const matchesResponse = await fetch(`${this.apiBase}/matches.php?tournament_id=1`);
            const matchesData = await matchesResponse.json();
            
            if (matchesData.success) {
                document.getElementById('matchesCount').textContent = matchesData.data.length;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // نموذج تسجيل الدخول
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                this.login(username, password);
            });
        }
    }

    // عرض نافذة تسجيل الدخول
    showLogin() {
        document.getElementById('loginModal').style.display = 'block';
    }

    // إخفاء نافذة تسجيل الدخول
    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
    }

    // عرض تنبيه
    showAlert(message, type = 'info') {
        const alert = document.getElementById('alert');
        alert.textContent = message;
        alert.className = `alert ${type} show`;
        
        setTimeout(() => {
            alert.classList.remove('show');
        }, 3000);
    }

    // تحديث الوقت الحالي
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ar-SA');
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }
    }
}

// الدوال العامة
function showLogin() {
    system.showLogin();
}

function closeLogin() {
    system.hideLoginModal();
}

// تهيئة النظام
const system = new TaekwondoSystem();

// تحديث الوقت كل ثانية
setInterval(() => {
    system.updateCurrentTime();
}, 1000);

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        system.hideLoginModal();
    }
}