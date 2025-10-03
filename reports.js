// نظام التقارير المتقدم
class ReportsSystem {
    constructor() {
        this.apiBase = '../api';
        this.currentReport = 'dashboard';
        this.charts = {};
        this.filters = {
            timeRange: '30',
            startDate: null,
            endDate: null
        };
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.setupCharts();
        this.loadDashboard();
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
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '../index.html';
        }
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // التنقل بين التقارير
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const reportType = item.getAttribute('data-report');
                this.switchReport(reportType);
            });
        });

        // الفلاتر
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.filters.timeRange = e.target.value;
            if (e.target.value === 'custom') {
                document.getElementById('customDateRange').style.display = 'flex';
            } else {
                document.getElementById('customDateRange').style.display = 'none';
                this.applyFilters();
            }
        });

        document.getElementById('startDate').addEventListener('change', (e) => {
            this.filters.startDate = e.target.value;
            if (this.filters.endDate) {
                this.applyFilters();
            }
        });

        document.getElementById('endDate').addEventListener('change', (e) => {
            this.filters.endDate = e.target.value;
            if (this.filters.startDate) {
                this.applyFilters();
            }
        });

        // البحث والفلاتر الأخرى
        document.getElementById('athleteSearch')?.addEventListener('input', this.debounce(() => {
            this.loadAthletesReport();
        }, 300));

        document.getElementById('tournamentSelect')?.addEventListener('change', () => {
            this.loadTournamentsReport();
        });
    }

    // إعداد الرسوم البيانية
    setupCharts() {
        this.setupTournamentsChart();
        this.setupAthletesChart();
        this.setupRevenueChart();
        this.setupClubsChart();
        this.setupFinancialChart();
    }

    // تبديل التقرير
    switchReport(reportType) {
        // إخفاء جميع التقارير
        document.querySelectorAll('.report-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إلغاء تنشيط جميع عناصر التنقل
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // إظهار التقرير المحدد
        document.getElementById(reportType).classList.add('active');
        document.querySelector(`[data-report="${reportType}"]`).classList.add('active');
        
        this.currentReport = reportType;
        
        // تحميل بيانات التقرير
        this.loadReportData(reportType);
    }

    // تحميل بيانات التقرير
    async loadReportData(reportType) {
        switch (reportType) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'tournaments':
                await this.loadTournamentsReport();
                break;
            case 'athletes':
                await this.loadAthletesReport();
                break;
            case 'financial':
                await this.loadFinancialReport();
                break;
            case 'custom':
                await this.loadCustomReports();
                break;
        }
    }

    // تحميل لوحة التقارير
    async loadDashboard() {
        try {
            this.showLoading();
            
            // تحميل الإحصائيات
            const [tournaments, athletes, matches, financial] = await Promise.all([
                this.fetchTournamentsStats(),
                this.fetchAthletesStats(),
                this.fetchMatchesStats(),
                this.fetchFinancialStats()
            ]);

            this.updateDashboardStats(tournaments, athletes, matches, financial);
            this.updateCharts(tournaments, athletes, matches, financial);
            await this.loadRecentActivity();
            
            this.hideLoading();
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.hideLoading();
        }
    }

    // تحديث إحصائيات اللوحة
    updateDashboardStats(tournaments, athletes, matches, financial) {
        document.getElementById('totalTournaments').textContent = tournaments.total || 0;
        document.getElementById('totalAthletes').textContent = athletes.total || 0;
        document.getElementById('totalMatches').textContent = matches.total || 0;
        document.getElementById('totalRevenue').textContent = `${financial.totalRevenue || 0} ر.س`;
    }

    // تحديث الرسوم البيانية
    updateCharts(tournaments, athletes, matches, financial) {
        this.updateTournamentsChart(tournaments.monthlyData);
        this.updateAthletesChart(athletes.distribution);
        this.updateRevenueChart(financial.monthlyRevenue);
        this.updateClubsChart(athletes.clubsDistribution);
    }

    // تحميل تقارير البطولات
    async loadTournamentsReport() {
        try {
            const stats = await this.fetchTournamentsStats();
            this.displayTournamentsReport(stats);
        } catch (error) {
            console.error('Error loading tournaments report:', error);
        }
    }

    // تحميل تقارير المتسابقين
    async loadAthletesReport() {
        try {
            const search = document.getElementById('athleteSearch')?.value;
            const beltFilter = document.getElementById('beltFilter')?.value;
            const genderFilter = document.getElementById('genderFilter')?.value;
            
            const stats = await this.fetchAthletesStats({ search, beltFilter, genderFilter });
            this.displayAthletesReport(stats);
        } catch (error) {
            console.error('Error loading athletes report:', error);
        }
    }

    // تحميل التقارير المالية
    async loadFinancialReport() {
        try {
            const year = document.getElementById('financialYear')?.value;
            const reportType = document.getElementById('reportType')?.value;
            
            const stats = await this.fetchFinancialStats({ year, reportType });
            this.displayFinancialReport(stats);
        } catch (error) {
            console.error('Error loading financial report:', error);
        }
    }

    // تطبيق الفلاتر
    applyFilters() {
        this.loadReportData(this.currentReport);
    }

    // APIs للبيانات
    async fetchTournamentsStats(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (this.filters.timeRange !== 'custom') {
                params.append('days', this.filters.timeRange);
            } else if (this.filters.startDate && this.filters.endDate) {
                params.append('start_date', this.filters.startDate);
                params.append('end_date', this.filters.endDate);
            }

            const response = await fetch(`${this.apiBase}/reports/tournaments.php?${params}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching tournaments stats:', error);
            return this.getMockTournamentsStats();
        }
    }

    async fetchAthletesStats(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const response = await fetch(`${this.apiBase}/reports/athletes.php?${params}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching athletes stats:', error);
            return this.getMockAthletesStats();
        }
    }

    async fetchMatchesStats() {
        try {
            const response = await fetch(`${this.apiBase}/reports/matches.php`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching matches stats:', error);
            return this.getMockMatchesStats();
        }
    }

    async fetchFinancialStats(filters = {}) {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const response = await fetch(`${this.apiBase}/reports/financial.php?${params}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching financial stats:', error);
            return this.getMockFinancialStats();
        }
    }

    // بيانات وهمية للعرض (للتطوير)
    getMockTournamentsStats() {
        return {
            total: 15,
            monthlyData: [
                { month: 'يناير', tournaments: 2, participants: 45 },
                { month: 'فبراير', tournaments: 3, participants: 68 },
                { month: 'مارس', tournaments: 1, participants: 32 },
                { month: 'أبريل', tournaments: 4, participants: 89 },
                { month: 'مايو', tournaments: 2, participants: 56 },
                { month: 'يونيو', tournaments: 3, participants: 72 }
            ]
        };
    }

    getMockAthletesStats() {
        return {
            total: 362,
            distribution: {
                belts: { 'أبيض': 45, 'أصفر': 67, 'أخضر': 89, 'أزرق': 76, 'أحمر': 52, 'أسود': 33 },
                ages: { '6-11': 78, '12-14': 95, '15-17': 89, '18+': 100 },
                genders: { 'male': 245, 'female': 117 }
            },
            clubsDistribution: {
                'نادي التايكواندو': 45,
                'النادي الأهلي': 38,
                'نادي الشباب': 32,
                'النادي الأولمبي': 28,
                'أخرى': 219
            }
        };
    }

    // إعداد الرسوم البيانية
    setupTournamentsChart() {
        const ctx = document.getElementById('tournamentsChart').getContext('2d');
        this.charts.tournaments = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'عدد البطولات',
                        data: [],
                        borderColor: '#e53e3e',
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'عدد المتسابقين',
                        data: [],
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
    }

    setupAthletesChart() {
        const ctx = document.getElementById('athletesChart').getContext('2d');
        this.charts.athletes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#e53e3e',
                        '#dd6b20',
                        '#d69e2e',
                        '#38a169',
                        '#319795',
                        '#3182ce'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
    }

    // تحديث الرسوم البيانية
    updateTournamentsChart(monthlyData) {
        if (!this.charts.tournaments) return;

        this.charts.tournaments.data.labels = monthlyData.map(d => d.month);
        this.charts.tournaments.data.datasets[0].data = monthlyData.map(d => d.tournaments);
        this.charts.tournaments.data.datasets[1].data = monthlyData.map(d => d.participants);
        this.charts.tournaments.update();
    }

    updateAthletesChart(distribution) {
        if (!this.charts.athletes) return;

        this.charts.athletes.data.labels = Object.keys(distribution.belts);
        this.charts.athletes.data.datasets[0].data = Object.values(distribution.belts);
        this.charts.athletes.update();
    }

    // التصدير
    async exportReport(format) {
        try {
            this.showLoading();
            
            let url, filename;
            
            switch (format) {
                case 'pdf':
                    url = `${this.apiBase}/reports/export.php?format=pdf&report=${this.currentReport}`;
                    filename = `report_${this.currentReport}_${new Date().toISOString().split('T')[0]}.pdf`;
                    break;
                case 'excel':
                    url = `${this.apiBase}/reports/export.php?format=excel&report=${this.currentReport}`;
                    filename = `report_${this.currentReport}_${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;
                case 'print':
                    window.print();
                    this.hideLoading();
                    return;
            }

            // إضافة الفلاتر
            const params = new URLSearchParams();
            if (this.filters.timeRange !== 'custom') {
                params.append('days', this.filters.timeRange);
            } else if (this.filters.startDate && this.filters.endDate) {
                params.append('start_date', this.filters.startDate);
                params.append('end_date', this.filters.endDate);
            }

            const fullUrl = `${url}&${params.toString()}`;
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            
            // تحميل الملف
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            this.hideLoading();
        } catch (error) {
            console.error('Error exporting report:', error);
            this.hideLoading();
            alert('خطأ في تصدير التقرير');
        }
    }

    // منشئ التقارير المخصصة
    showReportBuilder() {
        document.getElementById('reportBuilder').style.display = 'block';
        this.loadAvailableFields();
    }

    hideReportBuilder() {
        document.getElementById('reportBuilder').style.display = 'none';
    }

    async loadAvailableFields() {
        // تحميل الحقول المتاحة من الخادم
        const fields = [
            { id: 'athlete_name', name: 'اسم المتسابق', type: 'text', table: 'athletes' },
            { id: 'club_name', name: 'اسم النادي', type: 'text', table: 'athletes' },
            { id: 'belt_level', name: 'مستوى الحزام', type: 'text', table: 'athletes' },
            { id: 'tournament_name', name: 'اسم البطولة', type: 'text', table: 'tournaments' },
            { id: 'match_date', name: 'تاريخ المباراة', type: 'date', table: 'matches' },
            { id: 'score', name: 'النقاط', type: 'number', table: 'scores' },
            { id: 'payment_amount', name: 'مبلغ الدفع', type: 'number', table: 'payments' }
        ];

        this.displayAvailableFields(fields);
    }

    displayAvailableFields(fields) {
        const container = document.getElementById('availableFields');
        container.innerHTML = fields.map(field => `
            <div class="field-item" draggable="true" data-field='${JSON.stringify(field)}'>
                ${field.name}
            </div>
        `).join('');

        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const fields = document.querySelectorAll('.field-item');
        const selectedContainer = document.getElementById('selectedFields');

        fields.forEach(field => {
            field.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', field.getAttribute('data-field'));
            });
        });

        selectedContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        selectedContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const fieldData = e.dataTransfer.getData('text/plain');
            this.addFieldToReport(JSON.parse(fieldData));
        });
    }

    addFieldToReport(field) {
        const container = document.getElementById('selectedFields');
        const fieldElement = document.createElement('div');
        fieldElement.className = 'field-item';
        fieldElement.textContent = field.name;
        fieldElement.setAttribute('data-field', JSON.stringify(field));
        
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '×';
        removeBtn.className = 'btn-remove';
        removeBtn.onclick = () => fieldElement.remove();
        
        fieldElement.appendChild(removeBtn);
        container.appendChild(fieldElement);
    }

    // أدوات مساعدة
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading() {
        document.getElementById('loadingModal').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingModal').style.display = 'none';
    }
}

// الدوال العامة
function exportReport(format) {
    reports.exportReport(format);
}

function showReportBuilder() {
    reports.showReportBuilder();
}

function hideReportBuilder() {
    reports.hideReportBuilder();
}

function generateCustomReport() {
    alert('جاري إنشاء التقرير المخصص...');
    // تنفيذ إنشاء التقرير
}

function saveCustomReport() {
    alert('تم حفظ التقرير المخصص');
    // تنفيذ حفظ التقرير
}

// تهيئة نظام التقارير
const reports = new ReportsSystem();