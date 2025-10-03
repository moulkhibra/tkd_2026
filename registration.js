// نظام التسجيل
class RegistrationSystem {
    constructor() {
        this.apiBase = '../api';
        this.currentStep = 1;
        this.athleteData = {};
        this.selectedTournament = null;
        this.selectedCategory = null;
        this.beltLevels = [];
        this.tournaments = [];
        this.init();
    }

    async init() {
        await this.loadBeltLevels();
        await this.loadTournaments();
        this.setupEventListeners();
        this.showStep(1);
    }

    // تحميل مستويات الأحزمة
    async loadBeltLevels() {
        try {
            // في نظام حقيقي، سيكون هناك API للأحزمة
            this.beltLevels = [
                { id: 1, name: 'أبيض', color: '#FFFFFF' },
                { id: 2, name: 'أصفر', color: '#FFFF00' },
                { id: 3, name: 'أخضر', color: '#008000' },
                { id: 4, name: 'أزرق', color: '#0000FF' },
                { id: 5, name: 'أحمر', color: '#FF0000' },
                { id: 6, name: 'أسود - دان 1', color: '#000000' }
            ];

            this.populateBeltSelect();
        } catch (error) {
            console.error('Error loading belt levels:', error);
            this.showError('خطأ في تحميل بيانات الأحزمة');
        }
    }

    // تعبئة قائمة الأحزمة
    populateBeltSelect() {
        const select = document.getElementById('beltLevel');
        select.innerHTML = '<option value="">اختر مستوى الحزام</option>' +
            this.beltLevels.map(belt => 
                `<option value="${belt.id}">${belt.name}</option>`
            ).join('');
    }

    // تحميل البطولات
    async loadTournaments() {
        try {
            const response = await fetch(`${this.apiBase}/tournaments.php?status=published`);
            const data = await response.json();
            
            if (data.success) {
                this.tournaments = data.data;
                this.populateTournamentSelect();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
            this.showError('خطأ في تحميل البطولات');
        }
    }

    // تعبئة قائمة البطولات
    populateTournamentSelect() {
        const select = document.getElementById('tournamentSelect');
        select.innerHTML = '<option value="">اختر البطولة</option>' +
            this.tournaments.map(tournament => 
                `<option value="${tournament.id}">${tournament.name} - ${tournament.location}</option>`
            ).join('');
    }

    // تحميل فئات البطولة
    async loadTournamentCategories(tournamentId) {
        try {
            // في نظام حقيقي، سيكون هناك API للفئات
            // هذا مثال للبيانات الوهمية
            const categories = [
                {
                    id: 1,
                    name: 'كبار ذكور - وزن 54kg',
                    type: 'kyorugi',
                    age_category: 'كبار',
                    gender: 'male',
                    max_weight: 54,
                    fee: 100
                },
                {
                    id: 2,
                    name: 'كبار ذكور - وزن 58kg',
                    type: 'kyorugi',
                    age_category: 'كبار',
                    gender: 'male',
                    max_weight: 58,
                    fee: 100
                },
                {
                    id: 3,
                    name: 'ناشئين ذكور - وزن 63kg',
                    type: 'kyorugi',
                    age_category: 'ناشئين',
                    gender: 'male',
                    max_weight: 63,
                    fee: 80
                },
                {
                    id: 4,
                    name: 'كبار إناث - وزن 49kg',
                    type: 'kyorugi',
                    age_category: 'كبار',
                    gender: 'female',
                    max_weight: 49,
                    fee: 100
                }
            ];

            this.displayCategories(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('خطأ في تحميل فئات البطولة');
        }
    }

    // عرض الفئات
    displayCategories(categories) {
        const container = document.getElementById('categoriesSection');
        const athleteGender = this.athleteData.gender;
        
        // تصفية الفئات حسب جنس المتسابق
        const filteredCategories = categories.filter(cat => 
            cat.gender === athleteGender || cat.gender === 'mixed'
        );

        container.innerHTML = filteredCategories.map(category => `
            <div class="category-card" onclick="registration.selectCategory(${category.id})" 
                 data-category-id="${category.id}">
                <h3>${category.name}</h3>
                <div class="category-meta">
                    <span>${category.type === 'kyorugi' ? 'قتال' : 'عروض'}</span>
                    <span>${category.age_category}</span>
                </div>
                <div class="category-price">${category.fee} ر.س</div>
                ${this.isCategoryEligible(category) ? 
                    '<div class="category-badge">مناسب</div>' : 
                    '<div class="category-badge" style="background: #e53e3e;">غير مناسب</div>'
                }
            </div>
        `).join('');

        container.style.display = 'grid';
    }

    // التحقق من أهلية الفئة
    isCategoryEligible(category) {
        // التحقق من العمر
        const age = this.calculateAge(this.athleteData.date_of_birth);
        const ageCategory = this.getAgeCategory(age);
        
        // التحقق من الوزن
        const weight = parseFloat(this.athleteData.weight);
        if (weight && category.max_weight && weight > category.max_weight) {
            return false;
        }

        return ageCategory === category.age_category;
    }

    // حساب العمر
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    // تحديد فئة العمر
    getAgeCategory(age) {
        if (age >= 18) return 'كبار';
        if (age >= 15) return 'ناشئين';
        if (age >= 12) return 'كاديت';
        return 'أطفال';
    }

    // اختيار الفئة
    selectCategory(categoryId) {
        // إلغاء تحديد جميع الفئات
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('selected');
        });

        // تحديد الفئة المختارة
        const selectedCard = document.querySelector(`[data-category-id="${categoryId}"]`);
        selectedCard.classList.add('selected');

        this.selectedCategory = categoryId;
        this.updateRegistrationSummary();
        this.enableStep2Next();
    }

    // تحديث ملخص التسجيل
    updateRegistrationSummary() {
        const tournament = this.tournaments.find(t => t.id == this.selectedTournament);
        const athleteName = `${this.athleteData.first_name} ${this.athleteData.last_name}`;
        
        document.getElementById('summaryAthleteName').textContent = athleteName;
        document.getElementById('summaryTournament').textContent = tournament?.name || '-';
        document.getElementById('summaryCategory').textContent = this.getCategoryName(this.selectedCategory) || '-';
        document.getElementById('summaryFee').textContent = '100 ر.س'; // سعر افتراضي

        document.getElementById('registrationSummary').style.display = 'block';
    }

    // تمكين زر التالي في الخطوة 2
    enableStep2Next() {
        document.getElementById('btnStep2Next').disabled = !this.selectedCategory;
    }

    // تحديث تأكيد التسجيل
    updateConfirmationStep() {
        const tournament = this.tournaments.find(t => t.id == this.selectedTournament);
        
        document.getElementById('confirmFullName').textContent = 
            `${this.athleteData.first_name} ${this.athleteData.last_name}`;
        document.getElementById('confirmBirthDate').textContent = 
            this.formatDate(this.athleteData.date_of_birth);
        document.getElementById('confirmClub').textContent = this.athleteData.club_name;
        document.getElementById('confirmBelt').textContent = 
            this.getBeltName(this.athleteData.belt_level_id);
        document.getElementById('confirmTournament').textContent = tournament?.name || '-';
        document.getElementById('confirmCategory').textContent = 
            this.getCategoryName(this.selectedCategory) || '-';
    }

    // إرسال التسجيل
    async submitRegistration() {
        try {
            if (!document.getElementById('agreeTerms').checked) {
                this.showError('يجب الموافقة على الشروط والأحكام');
                return;
            }

            // إنشاء المتسابق أولاً
            const athleteResponse = await fetch(`${this.apiBase}/athletes.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.athleteData)
            });

            const athleteData = await athleteResponse.json();
            
            if (!athleteData.success) {
                throw new Error(athleteData.message);
            }

            const athleteId = athleteData.athlete_id;

            // تسجيل المتسابق في البطولة
            const registrationResponse = await fetch(`${this.apiBase}/tournaments.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'register_athlete',
                    athlete_id: athleteId,
                    tournament_id: this.selectedTournament,
                    category_id: this.selectedCategory,
                    payment_status: 'pending'
                })
            });

            const registrationData = await registrationResponse.json();
            
            if (registrationData.success) {
                this.showSuccess(registrationData.registration_id, athleteId);
            } else {
                throw new Error(registrationData.message);
            }

        } catch (error) {
            console.error('Error submitting registration:', error);
            this.showError('خطأ في إتمام التسجيل: ' + error.message);
        }
    }

    // عرض نافذة النجاح
    showSuccess(registrationId, athleteId) {
        document.getElementById('registrationId').textContent = registrationId;
        document.getElementById('successMessage').textContent = 
            `تم تسجيل المتسابق ${this.athleteData.first_name} ${this.athleteData.last_name} في البطولة بنجاح`;
        
        document.getElementById('successModal').style.display = 'block';
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // تغيير البطولة
        document.getElementById('tournamentSelect').addEventListener('change', (e) => {
            this.selectedTournament = e.target.value;
            if (this.selectedTournament) {
                this.loadTournamentCategories(this.selectedTournament);
            } else {
                document.getElementById('categoriesSection').style.display = 'none';
                document.getElementById('registrationSummary').style.display = 'none';
            }
        });

        // الشروط والأحكام
        document.getElementById('agreeTerms').addEventListener('change', (e) => {
            document.getElementById('btnSubmit').disabled = !e.target.checked;
        });

        // التحقق من صحة النموذج
        document.getElementById('athleteForm').addEventListener('input', this.validateStep1.bind(this));
    }

    // التحقق من صحة الخطوة 1
    validateStep1() {
        const form = document.getElementById('athleteForm');
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value) {
                isValid = false;
            }
        });

        return isValid;
    }

    // الدوال المساعدة
    getBeltName(beltId) {
        const belt = this.beltLevels.find(b => b.id == beltId);
        return belt ? belt.name : '-';
    }

    getCategoryName(categoryId) {
        // في نظام حقيقي، سيكون هناك بيانات الفئات
        return `فئة ${categoryId}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA');
    }

    showError(message) {
        alert(`خطأ: ${message}`);
    }

    // إدارة الخطوات
    showStep(stepNumber) {
        // إخفاء جميع الخطوات
        document.querySelectorAll('.registration-step').forEach(step => {
            step.classList.remove('active');
        });

        // إظهار الخطوة المطلوبة
        document.getElementById(`step${stepNumber}`).classList.add('active');

        // تحديث خطوات التنقل
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });

        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');

        this.currentStep = stepNumber;

        // إجراءات خاصة بكل خطوة
        if (stepNumber === 3) {
            this.updateConfirmationStep();
        }
    }

    nextStep(nextStep) {
        if (nextStep === 2 && !this.validateStep1()) {
            this.showError('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        if (nextStep === 3 && !this.selectedCategory) {
            this.showError('يرجى اختيار فئة المنافسة');
            return;
        }

        this.showStep(nextStep);
    }

    prevStep(prevStep) {
        this.showStep(prevStep);
    }
}

// الدوال العامة
function nextStep(step) {
    registration.nextStep(step);
}

function prevStep(step) {
    registration.prevStep(step);
}

function submitRegistration() {
    registration.submitRegistration();
}

function printRegistration() {
    // طباعة الإيصال
    const receiptContent = `
        <div class="receipt">
            <h2>إيصال التسجيل</h2>
            <div class="receipt-details">
                <p><strong>رقم التسجيل:</strong> ${document.getElementById('registrationId').textContent}</p>
                <p><strong>اسم المتسابق:</strong> ${registration.athleteData.first_name} ${registration.athleteData.last_name}</p>
                <p><strong>البطولة:</strong> ${document.getElementById('confirmTournament').textContent}</p>
                <p><strong>الفئة:</strong> ${document.getElementById('confirmCategory').textContent}</p>
                <p><strong>حالة الدفع:</strong> بانتظار الدفع</p>
                <p><strong>تاريخ التسجيل:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
        </div>
    `;
    
    document.getElementById('receiptContent').innerHTML = receiptContent;
    document.getElementById('receiptModal').style.display = 'block';
}

function printReceipt() {
    window.print();
}

function newRegistration() {
    location.reload();
}

// تهيئة النظام
const registration = new RegistrationSystem();

// جمع بيانات المتسابق من النموذج
document.getElementById('athleteForm').addEventListener('input', function(e) {
    registration.athleteData[e.target.name] = e.target.value;
});