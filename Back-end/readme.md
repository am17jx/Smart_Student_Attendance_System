# 🎓 نظام تسجيل حضور الطلاب الذكي (Smart Student Attendance System)

> Secure attendance management using rotating QR codes, JWT tokens, and browser fingerprinting

[![Security](https://img.shields.io/badge/Security-Enhanced-green)](docs/CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](.)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-brightgreen)](.)
[![Status](https://img.shields.io/badge/Status-Active%20Development-yellow)](.)

---

## 📋 حول المشروع

نظام حضور ذكي وآمن يستخدم تقنيات متقدمة لضمان صحة تسجيل الحضور ومنع الغش والتلاعب.

### 🎯 الأهداف:
- تطوير نظام حضور آمن باستخدام **QR Codes دوّارة** و **JWT Tokens قصيرة المدى**
- التحقق من موقع الطالب باستخدام **Geo-fencing**
- منع هجمات **Replay/Forwarding** عبر **Browser Fingerprinting**
- توفير لوحة تحكم للمدرسين والإداريين لمراقبة الحضور

---

## ✨ المميزات

### للطلاب:
- ✅ مسح QR Code لتسجيل الحضور
- ✅ التحقق من الموقع تلقائياً
- ✅ إشعارات فورية
- ✅ عرض سجل الحضور

### للمدرسين:
- ✅ فتح/إغلاق جلسات الحضور
- ✅ توليد QR Codes دوّارة (تتجدد كل 30 ثانية)
- ✅ تصدير تقارير (CSV/PDF)
- ✅ مراقبة المحاولات الفاشلة

### للإداريين:
- ✅ إدارة الطلاب والمدرسين
- ✅ إحصائيات شاملة
- ✅ سجل الأخطاء والمحاولات المشبوهة
- ✅ نظام Email Verification

---

## 🛠️ التقنيات المستخدمة

### Backend:
- **Runtime:** Node.js 20.x
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + bcrypt
- **Security:** Helmet, CORS, Rate Limiting

### Frontend (قيد التطوير):
- **Framework:** Next.js 14
- **UI Library:** shadcn/ui + TailwindCSS
- **State Management:** Zustand + React Query
- **Forms:** React Hook Form + Zod

### DevOps:
- **Version Control:** Git + GitHub
- **API Testing:** Postman
- **Deployment:** Docker (planned)

---

## 🚀 البدء السريع

### المتطلبات:
```bash
Node.js >= 20.x
PostgreSQL >= 14.x
npm >= 9.x
```

### التثبيت:
```bash
# 1. Clone المشروع
git clone [repository-url]
cd Privacy-Preserving-Student-Attendance-1

# 2. تثبيت Dependencies
npm install

# 3. إعداد قاعدة البيانات
npx prisma migrate dev
npx prisma generate

# 4. إعداد Environment Variables
cp .env.example .env
# ✏️ عدّل .env بمعلوماتك

# 5. تشغيل السيرفر
npm run dev
```

### التحقق من الصحة:
```bash
# فحص صحة النظام
curl http://localhost:3000/health

# الاستجابة المتوقعة:
{
  "status": "healthy",
  "database": true,
  "uptime": 123.45
}
```

---

## 📚 الوثائق

- 📖 [دليل البدء السريع](docs/quick_start.md)
- 📋 [CHANGELOG - آخر التحديثات](docs/CHANGELOG.md)
- 🔧 [API Documentation](docs/04-api-documentation/)
- 📧 [Email Service Setup](docs/email-service-setup.md)
- 🧪 [API Testing Guide](docs/api-testing-guide.md)
- 🎯 [Next Steps](docs/next-steps.md)

---

## 🔒 الأمان

تم إجراء فحص أمني شامل وتطبيق التحسينات التالية:
- ✅ CORS + Helmet Protection
- ✅ Rate Limiting على جميع Endpoints الحساسة
- ✅ Email Verification إلزامي
- ✅ Database Connection Pooling
- ✅ Request ID Tracking
- ✅ Health Check Endpoint
- ✅ Cleanup Jobs للـ Expired Tokens

**آخر مراجعة أمنية:** 25 يناير 2026  
**التفاصيل:** [كود review report](docs/CHANGELOG.md)

---

## 🎨 Screenshots (قريباً)

### Dashboard
قيد التطوير...

### QR Code Scanner
قيد التطوير...

---

## 📊 حالة المشروع

| المكون | الحالة | الإصدار |
|--------|--------|---------|
| Backend API | ✅ مكتمل | v1.1.0 |
| Database Schema | ✅ مكتمل | v1.0 |
| Authentication | ✅ مكتمل | v1.1.0 |
| Email Service | ✅ مكتمل | v1.0 |
| QR System | ✅ مكتمل | v1.0 |
| Frontend | 🟡 قيد التطوير | v0.1.0 |
| Testing | ⏸️ قيد الإعداد | - |

**آخر تحديث:** 25 يناير 2026

---

## 🤝 المساهمة

المشروع حالياً قيد التطوير النشط. للمساهمة:
1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ branch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📝 الرخصة

هذا المشروع تحت رخصة MIT - راجع ملف LICENSE للتفاصيل.

---

## 👨‍💻 المطور

**Ameer Ahmed**  
📧 ameerahmed0780@gmail.com  
🔗 [GitHub](https://github.com/am17jx)

---

## 🙏 شكر وتقدير

- Prisma Team للـ ORM الرائع
- Express.js Community
- shadcn/ui للـ UI Components

---

**⭐ إذا أعجبك المشروع، لا تنسى إعطائه نجمة!**