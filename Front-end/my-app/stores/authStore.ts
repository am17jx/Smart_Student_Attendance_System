import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// تعريف نوع البيانات للمستخدم
interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
}

// تعريف نوع البيانات للـ AuthStore
interface AuthState {
    // الحالة
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;

    // الدوال
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    updateUser: (user: Partial<User>) => void;
}

// إنشاء الـ store مع حفظ البيانات في localStorage
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // القيم الابتدائية
            user: null,
            token: null,
            isAuthenticated: false,

            // دالة تسجيل الدخول - تحفظ بيانات المستخدم والـ token
            setAuth: (user, token) =>
                set({
                    user,
                    token,
                    isAuthenticated: true,
                }),

            // دالة تسجيل الخروج - تمسح كل البيانات
            logout: () =>
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                }),

            // دالة تحديث بيانات المستخدم
            updateUser: (updatedData) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updatedData } : null,
                })),
        }),
        {
            name: 'auth-storage', // اسم المفتاح في localStorage
        }
    )
);
