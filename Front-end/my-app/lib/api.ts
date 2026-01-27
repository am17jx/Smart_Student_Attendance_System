import axios from "axios";

// إنشاء instance من axios مع الإعدادات الأساسية
export const api = axios.create({
    baseURL: "http://localhost:4000/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});

// إضافة interceptor لإرسال الـ token مع كل طلب
api.interceptors.request.use(
    (config) => {
        // محاولة قراءة الـ token من localStorage
        const authStorage = localStorage.getItem('auth-storage');

        if (authStorage) {
            try {
                const { state } = JSON.parse(authStorage);
                const token = state?.token;

                // إذا كان الـ token موجود، أضفه للـ headers
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (error) {
                console.error('Error parsing auth storage:', error);
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// إضافة interceptor لمعالجة الأخطاء
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // إذا كان الخطأ 401 (Unauthorized)، امسح البيانات
        if (error.response?.status === 401) {
            localStorage.removeItem('auth-storage');
            // يمكن إضافة redirect للـ login page هنا
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);