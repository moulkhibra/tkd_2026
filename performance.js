// نظام تحسين الأداء
class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.init();
    }

    init() {
        this.setupServiceWorker();
        this.setupLazyLoading();
        this.setupCaching();
        this.setupPerformanceMonitoring();
    }

    // إعداد Service Worker للتخزين المؤقت
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('../sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // التحميل البطيء للصور والمحتوى
    setupLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // نظام التخزين المؤقت
    setupCaching() {
        // تخزين نتائج API مؤقتاً
        this.cache = new Map();
    }

    // طلب مع تخزين مؤقت
    async cachedFetch(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // التحقق من التخزين المؤقت
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 دقائق
                return cached.data;
            }
        }

        // جلب البيانات الجديدة
        const response = await fetch(url, options);
        const data = await response.json();

        // التخزين المؤقت
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });

        return data;
    }

    // مراقبة الأداء
    setupPerformanceMonitoring() {
        // مراقبة وقت التحميل
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.logPerformance('page_load', loadTime);
        });

        // مراقبة سرعة API
        this.monitorAPIPerformance();
    }

    // مراقبة أداء API
    monitorAPIPerformance() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const start = performance.now();
            const response = await originalFetch(...args);
            const end = performance.now();
            
            this.logPerformance('api_call', end - start, args[0]);
            return response;
        };
    }

    // تسجيل مقاييس الأداء
    logPerformance(metric, value, context = '') {
        const data = {
            metric,
            value: Math.round(value),
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // إرسال البيانات للخادم (في بيئة الإنتاج)
        if (process.env.NODE_ENV === 'production') {
            fetch('../api/performance.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).catch(console.error);
        }

        console.log(`Performance: ${metric} - ${value}ms`, context);
    }

    // تحسين الذاكرة
    setupMemoryManagement() {
        // تنظيف التخزين المؤقت تلقائياً
        setInterval(() => {
            const now = Date.now();
            for (let [key, value] of this.cache) {
                if (now - value.timestamp > 10 * 60 * 1000) { // 10 دقائق
                    this.cache.delete(key);
                }
            }
        }, 60 * 1000);
    }

    // ضغط البيانات
    compressData(data) {
        // استخدام خوارزميات الضغط المناسبة
        return LZString.compressToUTF16(JSON.stringify(data));
    }

    decompressData(compressedData) {
        return JSON.parse(LZString.decompressFromUTF16(compressedData));
    }

    // إلغاء الازدحام (Debounce)
    debounce(func, wait, immediate = false) {
        const key = func.toString();
        
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            if (immediate && !this.debounceTimers.has(key)) {
                func.apply(this, args);
            }
            
            this.debounceTimers.set(key, setTimeout(() => {
                this.debounceTimers.delete(key);
                if (!immediate) {
                    func.apply(this, args);
                }
            }, wait));
        };
    }
}

// Service Worker
const CACHE_NAME = 'taekwondo-v1';
const urlsToCache = [
    '/',
    '/assets/css/main.css',
    '/assets/js/main.js',
    '/assets/images/logo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});