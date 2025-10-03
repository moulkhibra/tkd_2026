// إدارة لوحة التحكم
class AdminPanel {
    constructor() {
        this.apiBase = '../api';
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadDashboard();
        this.setupTabNavigation();
        this.setupEventListeners();
    }

    // التحقق من الصلاحيات
    async checkAuth() {
        try {
            const response = await fetch(`${this.apiBase}/auth.php`);
            const data = await response.json();
            
            if (!data.success) {
                window.location.href = '../index.html';
                return;
            }

            this.currentUser = data.user;
            this.updateUserInfo();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '../index.html';
        }
    }

    // تحديث معلومات المستخدم
    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.full_name;
        }
    }

    // إعداد التنقل بين التبويبات
    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = item.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    // تبديل التبويب
    switchTab(tabName) {
        // إخفاء جميع التبويبات
        document.querySelectorAll('.tab-pane').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // إلغاء تنشيط جميع عناصر التنقل
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // إظهار التبويب المحدد
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // تحديث عنوان الصفحة
        document.getElementById('pageTitle').textContent = 
            document.querySelector(`[data-tab="${tabName}"] span`).textContent;
        
        // تحميل بيانات التبويب
        this.loadTabData(tabName);
    }

    // تحميل بيانات التبويب
    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'tournaments':
                await this.loadTournaments();
                break;
            case 'athletes':
                await this.loadAthletes();
                break;
            case 'matches':
                await this.loadMatches();
                break;
            case 'referees':
                await this.loadReferees();
                break;
        }
    }

    // تحميل لوحة التحكم
    async loadDashboard() {
        try {
            // تحميل البطولات
            const tournamentsResponse = await fetch(`${this.apiBase}/tournaments.php`);
            const tournamentsData = await tournamentsResponse.json();
            
            if (tournamentsData.success) {
                document.getElementById('totalTournaments').textContent = tournamentsData.data.length;
                this.displayActiveTournaments(tournamentsData.data);
            }

            // تحميل المتسابقين
            const athletesResponse = await fetch(`${this.apiBase}/athletes.php`);
            const athletesData = await athletesResponse.json();
            
            if (athletesData.success) {
                document.getElementById('totalAthletes').textContent = athletesData.data.length;
            }

            // تحميل المباريات
            const matchesResponse = await fetch(`${this.apiBase}/matches.php`);
            const matchesData = await matchesResponse.json();
            
            if (matchesData.success) {
                document.getElementById('totalMatches').textContent = matchesData.data.length;
                this.displayUpcomingMatches(matchesData.data);
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    // عرض البطولات النشطة
    displayActiveTournaments(tournaments) {
        const container = document.getElementById('activeTournaments');
        const activeTournaments = tournaments.filter(t => t.status === 'ongoing').slice(0, 4);
        
        container.innerHTML = activeTournaments.map(tournament => `
            <div class="tournament-card">
                <h3>${tournament.name}</h3>
                <div class="tournament-meta">
                    <span>${tournament.start_date} - ${tournament.end_date}</span>
                    <span>${tournament.location}</span>
                </div>
                <div class="tournament-status status-${tournament.status}">
                    ${this.getStatusText(tournament.status)}
                </div>
            </div>
        `).join('');
    }

    // عرض المباريات القادمة
    displayUpcomingMatches(matches) {
        const container = document.getElementById('upcomingMatches');
        const upcomingMatches = matches.filter(m => m.status === 'scheduled').slice(0, 5);
        
        container.innerHTML = upcomingMatches.map(match => `
            <div class="match-item">
                <div class="match-info">
                    <strong>${match.athlete1_first_name} ${match.athlete1_last_name}</strong>
                    <span>vs</span>
                    <strong>${match.athlete2_first_name} ${match.athlete2_last_name}</strong>
                </div>
                <div class="match-time">
                    ${match.scheduled_time || 'غير محدد'}
                </div>
            </div>
        `).join('');
    }

    // تحميل البطولات
    async loadTournaments() {
        try {
            const statusFilter = document.getElementById('tournamentStatusFilter').value;
            let url = `${this.apiBase}/tournaments.php`;
            
            if (statusFilter) {
                url += `?status=${statusFilter}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.displayTournamentsTable(data.data);
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
        }
    }

    // عرض جدول البطولات
    displayTournamentsTable(tournaments) {
        const tbody = document.getElementById('tournamentsTable');
        
        tbody.innerHTML = tournaments.map(tournament => `
            <tr>
                <td>${tournament.name}</td>
                <td>${tournament.start_date} - ${tournament.end_date}</td>
                <td>${tournament.location}</td>
                <td>
                    <span class="tournament-status status-${tournament.status}">
                        ${this.getStatusText(tournament.status)}
                    </span>
                </td>
                <td>0</td> <!-- عدد المتسابقين - يحتاج API منفصل -->
                <td>
                    <button class="btn-action" onclick="admin.editTournament(${tournament.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="admin.deleteTournament(${tournament.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // تحميل المتسابقين
    async loadAthletes() {
        try {
            const search = document.getElementById('athleteSearch').value;
            const beltFilter = document.getElementById('beltFilter').value;
            let url = `${this.apiBase}/athletes.php`;
            
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (beltFilter) params.append('belt_level_id', beltFilter);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.displayAthletesTable(data.data);
            }
        } catch (error) {
            console.error('Error loading athletes:', error);
        }
    }

    // عرض جدول المتسابقين
    displayAthletesTable(athletes) {
        const tbody = document.getElementById('athletesTable');
        
        tbody.innerHTML = athletes.map(athlete => `
            <tr>
                <td>
                    <div class="avatar">
                        <i class="fas fa-user"></i>
                    </div>
                </td>
                <td>${athlete.first_name} ${athlete.last_name}</td>
                <td>${athlete.club_name}</td>
                <td>
                    <span class="belt-color" style="background-color: ${athlete.belt_color || '#000'}"></span>
                    ${athlete.belt_name}
                </td>
                <td>${athlete.weight || '-'} kg</td>
                <td>0</td> <!-- عدد التسجيلات - يحتاج API منفصل -->
                <td>
                    <button class="btn-action" onclick="admin.editAthlete(${athlete.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="admin.viewAthlete(${athlete.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // تحميل المباريات
    async loadMatches() {
        try {
            const tournamentFilter = document.getElementById('tournamentFilter').value;
            const statusFilter = document.getElementById('matchStatusFilter').value;
            
            let url = `${this.apiBase}/matches.php`;
            const params = new URLSearchParams();
            
            if (tournamentFilter) params.append('tournament_id', tournamentFilter);
            if (statusFilter) params.append('status', statusFilter);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.displayMatches(data.data);
            }
        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }

    // عرض المباريات
    displayMatches(matches) {
        const container = document.getElementById('matchesList');
        
        container.innerHTML = matches.map(match => `
            <div class="match-card">
                <div class="match-header">
                    <h3>${match.bracket_position}</h3>
                    <span class="match-status status-${match.status}">
                        ${this.getStatusText(match.status)}
                    </span>
                </div>
                <div class="match-competitors">
                    <div class="competitor">
                        <strong>${match.athlete1_first_name} ${match.athlete1_last_name}</strong>
                        <span>${match.athlete1_club}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="competitor">
                        <strong>${match.athlete2_first_name} ${match.athlete2_last_name}</strong>
                        <span>${match.athlete2_club}</span>
                    </div>
                </div>
                <div class="match-actions">
                    <button class="btn-action" onclick="admin.startMatch(${match.id})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-action" onclick="admin.viewMatch(${match.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // نصوص الحالات
    getStatusText(status) {
        const statusTexts = {
            'draft': 'مسودة',
            'published': 'منشورة',
            'ongoing': 'جارية',
            'completed': 'منتهية',
            'cancelled': 'ملغاة',
            'scheduled': 'مجدولة',
            'in_progress': 'جارية',
            'ready': 'جاهزة'
        };
        
        return statusTexts[status] || status;
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تحديث الفلاتر
        document.getElementById('tournamentStatusFilter')?.addEventListener('change', () => {
            this.loadTournaments();
        });

        document.getElementById('athleteSearch')?.addEventListener('input', () => {
            this.loadAthletes();
        });

        // تبديل طريقة العرض
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const view = btn.getAttribute('data-view');
                this.switchMatchesView(view);
            });
        });
    }

    // تبديل طريقة عرض المباريات
    switchMatchesView(view) {
        const listView = document.getElementById('matchesList');
        const bracketView = document.getElementById('bracketView');
        
        if (view === 'list') {
            listView.style.display = 'block';
            bracketView.style.display = 'none';
        } else {
            listView.style.display = 'none';
            bracketView.style.display = 'block';
            this.loadBracketView();
        }
    }

    // تحميل عرض Bracket
    async loadBracketView() {
        // سيتم تنفيذ هذا لاحقاً
        console.log('Loading bracket view...');
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
            
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }
}

// الدوال العامة
function showTournamentForm() {
    document.getElementById('tournamentModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function logout() {
    admin.logout();
}

// تهيئة لوحة الإدارة
const admin = new AdminPanel();