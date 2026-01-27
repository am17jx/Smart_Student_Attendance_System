# 🧪 دليل الاختبارات التلقائية (Automated Testing Guide)

## 📦 التثبيت (Installation)

### 1. تثبيت المكتبات المطلوبة

بسبب قيود PowerShell، استخدم أحد الحلول التالية:

**الحل الأول: تشغيل PowerShell كمسؤول**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**الحل الثاني: استخدام CMD بدلاً من PowerShell**
```cmd
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

**الحل الثالث: استخدام npx مباشرة**
```powershell
npx --yes npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### 2. إنشاء قاعدة بيانات الاختبار

قم بإنشاء قاعدة بيانات منفصلة للاختبارات:

```sql
CREATE DATABASE attendance_system_test;
```

### 3. تشغيل Migrations على قاعدة البيانات التجريبية

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:ameer@localhost:5432/attendance_system_test"
npx prisma migrate deploy

# أو استخدم dotenv
dotenv -e .env.test -- npx prisma migrate deploy
```

## 🚀 تشغيل الاختبارات

### تشغيل جميع الاختبارات
```bash
npm test
```

### تشغيل الاختبارات مع التفاصيل
```bash
npm run test:verbose
```

### تشغيل الاختبارات مع تقرير التغطية
```bash
npm run test:coverage
```

### تشغيل الاختبارات في وضع المراقبة (للتطوير)
```bash
npm run test:watch
```

## 📁 هيكل ملفات الاختبار

```
Privacy-Preserving-Student-Attendance-1/
├── tests/
│   ├── setup.ts                    # إعداد بيئة الاختبار
│   ├── helpers/
│   │   └── testHelpers.ts         # أدوات مساعدة للاختبارات
│   └── auth/
│       └── auth.test.ts           # اختبارات المصادقة
├── jest.config.js                  # إعدادات Jest
└── .env.test                       # متغيرات بيئة الاختبار
```

## ✅ الاختبارات المتوفرة

### اختبارات تسجيل الدخول (Login Tests)
- ✅ تسجيل دخول Admin بنجاح
- ✅ تسجيل دخول Teacher بنجاح
- ✅ تسجيل دخول Student مع fingerprint
- ✅ حفظ fingerprint عند أول تسجيل دخول
- ❌ فشل مع بيانات خاطئة
- ❌ فشل مع fingerprint غير متطابق
- ✅ طلب تغيير كلمة المرور للطالب الجديد

### اختبارات إنشاء المعلمين (Teacher Signup)
- ✅ إنشاء معلم كـ Admin
- ❌ فشل بدون صلاحيات Admin
- ❌ فشل مع email مكرر

### اختبارات إنشاء الطلاب (Student Signup)
- ✅ إنشاء طالب كـ Admin
- ❌ فشل بدون صلاحيات Admin
- ❌ فشل مع email مكرر
- ❌ فشل مع Student ID مكرر

### اختبارات تغيير كلمة المرور (Password Change)
- ✅ تغيير كلمة مرور الطالب
- ✅ تغيير كلمة مرور المعلم
- ❌ فشل بدون مصادقة
- ❌ فشل مع كلمة مرور قديمة خاطئة
- ❌ فشل عند محاولة تغيير كلمة مرور مستخدم آخر

### اختبارات إعادة تعيين كلمة المرور (Password Reset)
- ✅ إعادة تعيين كلمة مرور الطالب كـ Admin
- ❌ فشل بدون صلاحيات Admin
- ❌ فشل لطالب غير موجود

## 🔧 استخدام Test Helpers

```typescript
import {
    createTestAdmin,
    createTestTeacher,
    createTestStudent,
    generateAuthToken,
    hashFingerprint,
} from '../helpers/testHelpers';

// إنشاء admin للاختبار
const admin = await createTestAdmin({
    email: 'admin@test.com',
    password: 'admin123',
});

// إنشاء token للمصادقة
const token = generateAuthToken({
    id: admin.id.toString(),
    email: admin.email,
    role: 'admin',
});

// استخدام token في الطلب
const response = await request(app)
    .post('/api/auth/admin/signin/teacher')
    .set('Authorization', `Bearer ${token}`)
    .send({ ... });
```

## 📊 تقرير التغطية (Coverage Report)

بعد تشغيل `npm run test:coverage`، ستجد التقرير في:
- `coverage/lcov-report/index.html` - تقرير HTML تفاعلي
- `coverage/lcov.info` - ملف LCOV للأدوات الخارجية

## ⚠️ ملاحظات مهمة

> [!IMPORTANT]
> قاعدة بيانات الاختبار منفصلة تماماً عن قاعدة البيانات الرئيسية لتجنب فقدان البيانات.

> [!TIP]
> استخدم `npm run test:watch` أثناء التطوير لإعادة تشغيل الاختبارات تلقائياً عند تغيير الملفات.

> [!WARNING]
> تأكد من تشغيل migrations على قاعدة بيانات الاختبار قبل تشغيل الاختبارات لأول مرة.

## 🎯 إضافة اختبارات جديدة

لإضافة اختبار جديد:

1. أنشئ ملف جديد في `tests/` مع امتداد `.test.ts`
2. استورد `request` من `supertest` و `app` من `src/app`
3. استخدم `describe` و `it` لتنظيم الاختبارات
4. استخدم Test Helpers لإنشاء بيانات الاختبار

مثال:
```typescript
import request from 'supertest';
import app from '../../src/app';
import { createTestStudent } from '../helpers/testHelpers';

describe('My New Feature', () => {
    it('should work correctly', async () => {
        const student = await createTestStudent();
        
        const response = await request(app)
            .get('/api/my-endpoint')
            .send();
        
        expect(response.status).toBe(200);
    });
});
```

## 🐛 استكشاف الأخطاء

### خطأ: "Cannot find module 'jest'"
```bash
npm install --save-dev jest @types/jest ts-jest
```

### خطأ: "Database connection failed"
تأكد من:
1. قاعدة البيانات التجريبية موجودة
2. ملف `.env.test` يحتوي على DATABASE_URL الصحيح
3. تم تشغيل migrations على قاعدة البيانات التجريبية

### خطأ: "Tests are failing"
1. تأكد من تنظيف قاعدة البيانات بين الاختبارات
2. تحقق من أن `beforeEach` في `setup.ts` يعمل بشكل صحيح
3. استخدم `npm run test:verbose` لرؤية التفاصيل
