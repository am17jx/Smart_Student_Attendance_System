# 🔐 كيفية إنشاء أول Admin

## المشكلة
لا يمكن إنشاء Admin جديد لأنك تحتاج Admin موجود للتصريح!

---

## ✅ الحل: الـ Seed Script موجود!

عندك seed script جاهز في `prisma/seed.ts` يسوي Admin تلقائياً!

### الطريقة 1: تشغيل Seed (الأفضل)

```bash
# في PowerShell - قد تحتاج تشغيل كـ Admin
npm run seed
```

إذا ما اشتغل (execution policy), جرب:

```powershell
# في PowerShell كـ Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
npm run seed
```

---

### الطريقة 2: Prisma Studio (يدوياً)

إذا الـ seed ما اشتغل، سوي يدوياً:

```bash
# افتح Prisma Studio
npx prisma studio
```

ثم:
1. افتح جدول `Admin`
2. اضغط **Add record**
3. أدخل البيانات:
   ```
   name: System Admin
   email: admin@test.com  
   password: (استخدم أداة bcrypt hash)
   ```

**مشكلة**: تحتاج hash الـ password!

---

### الطريقة 3: استخدام Admin الموجود في Seed! ✅

**الـ seed script يسوي admin افتراضي:**

```
📧 Email: admin@university.edu
🔑 Password: admin123
```

### جرّب Login الآن في Postman:

```json
POST http://localhost:3000/api/v1/auth/login

{
    "email": "admin@university.edu",
    "password": "admin123"
}
```

---

## 🚨 إذا ما في admin في Database أبداً

### قم بالتالي:

#### الخطوة 1: أنشئ ملف مؤقت

أنشئ ملف `create-admin.js` في المجلد الرئيسي:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        
        const admin = await prisma.admin.create({
            data: {
                name: 'System Administrator',
                email: 'admin@test.com',
                password: hashedPassword,
            },
        });

        console.log('✅ Admin created successfully!');
        console.log('Email:', admin.email);
        console.log('Password: Admin123!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
```

#### الخطوة 2: شغّله

```bash
node create-admin.js
```

#### الخطوة 3: Login

```json
POST http://localhost:3000/api/v1/auth/login

{
    "email": "admin@test.com",
    "password": "Admin123!"
}
```

---

## 📋 ملخص سريع

### الأسهل: استخدم الـ Admin الموجود
```
Email: admin@university.edu
Password: admin123
```

### إذا مو موجود: شغّل seed
```bash
npm run seed
```

### إذا seed ما اشتغل: سوي ملف JS مؤقت
```bash
node create-admin.js
```

---

## ⚠️ بعد أول Login

1. ✅ سوي Login
2. ✅ احصل على Token
3. ✅ استخدم Token لإنشاء Admin جديد
4. ✅ غيّر password الـ admin الافتراضي!

---

## 🔄 بيانات الـ Seed الكاملة

إذا شغلت `npm run seed`, ستحصل على:

### Admin
- Email: `admin@university.edu`
- Password: `admin123`

### Teachers
- `ahmed.ali@university.edu` / `teacher123`
- `sara.mohammed@university.edu` / `teacher123`

### Students  
- `ali.hassan@student.edu` / `student123`
- `fatima.karim@student.edu` / `student123`
- `omar.saleh@student.edu` / `temppass`

---

**جرّب الآن!** 🚀
