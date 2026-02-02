# 🚀 دليل التثبيت والتشغيل (Installation Guide)

## 📋 المتطلبات المسبقة

### البرامج المطلوبة

| البرنامج | الإصدار الأدنى | الرابط |
|---------|---------------|--------|
| Node.js | v18.0.0 | [nodejs.org](https://nodejs.org) |
| PostgreSQL | v14.0 | [postgresql.org](https://postgresql.org) |
| Git | أي إصدار | [git-scm.com](https://git-scm.com) |
| npm | v9.0.0 | (يأتي مع Node.js) |

### التحقق من التثبيت

```bash
node --version    # يجب أن يكون v18+
npm --version     # يجب أن يكون v9+
psql --version    # يجب أن يكون v14+
git --version
```

---

## 📥 الخطوة 1: استنساخ المشروع

```bash
# استنساخ المشروع
git clone https://github.com/username/Student-Attendance-System.git

# الدخول للمجلد
cd Student-Attendance-System
```

---

## ⚙️ الخطوة 2: إعداد قاعدة البيانات

### إنشاء قاعدة البيانات

```bash
# تسجيل الدخول لـ PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات
CREATE DATABASE attendance_system;

# إنشاء مستخدم (اختياري)
CREATE USER attendance_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_system TO attendance_admin;

# الخروج
\q
```

---

## 🔧 الخطوة 3: إعداد الخادم الخلفي (Backend)

### 3.1 تثبيت الاعتمادات

```bash
cd Back-end
npm install
```

### 3.2 إعداد متغيرات البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env
```

تعديل ملف `.env`:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance_system"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV=development

# Email (للتحقق وإعادة تعيين كلمة المرور)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM="Attendance System <noreply@example.com>"

# Frontend URL (لروابط البريد)
FRONTEND_URL=http://localhost:5173
```

### 3.3 تشغيل Migrations

```bash
# توليد Prisma Client
npx prisma generate

# تطبيق Migrations
npx prisma migrate dev

# (اختياري) عرض قاعدة البيانات
npx prisma studio
```

### 3.4 إنشاء أول مدير

```bash
# تشغيل سكريبت إنشاء المدير
node create-first-admin.js
```

سيُنشئ مدير بالبيانات التالية:
- **البريد**: admin@example.com
- **كلمة المرور**: Admin123!

⚠️ **مهم**: غيّر كلمة المرور فوراً بعد أول تسجيل دخول!

### 3.5 تشغيل الخادم

```bash
# وضع التطوير
npm run dev

# أو وضع الإنتاج
npm run build
npm start
```

الخادم يعمل على: `http://localhost:3000`

---

## 💻 الخطوة 4: إعداد الواجهة الأمامية (Frontend)

### 4.1 تثبيت الاعتمادات

```bash
cd front-end/smooth-frontend
npm install
```

### 4.2 إعداد متغيرات البيئة

```bash
# إنشاء ملف البيئة
echo "VITE_API_URL=http://localhost:3000/api/v1" > .env
```

### 4.3 تشغيل التطبيق

```bash
# وضع التطوير
npm run dev

# أو بناء للإنتاج
npm run build
npm run preview
```

التطبيق يعمل على: `http://localhost:5173`

---

## 🔐 الخطوة 5: تسجيل الدخول الأول

1. افتح `http://localhost:5173`
2. سجل الدخول:
   - **البريد**: admin@example.com
   - **كلمة المرور**: Admin123!
   - **الدور**: Admin
3. غيّر كلمة المرور من الإعدادات

---

## 📱 الخطوة 6: إعداد البيانات الأولية

### من لوحة التحكم:

1. **أضف الأقسام** (مثل: هندسة البرمجيات، علوم الحاسوب)
2. **أضف المراحل** (مثل: المرحلة الأولى، الثانية، ...)
3. **أضف المواقع الجغرافية** (القاعات والمختبرات)
4. **أضف المواد الدراسية**
5. **أضف الأساتذة**
6. **أضف الطلاب**

---

## 🏭 النشر للإنتاج (Production Deployment)

### متطلبات الإنتاج

- خادم VPS أو Cloud (AWS, GCP, Azure, DigitalOcean)
- دومين مع SSL
- PostgreSQL مُدار أو مستضاف

### خطوات النشر

#### 1. إعداد الخادم

```bash
# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# تثبيت PM2 لإدارة العمليات
npm install -g pm2
```

#### 2. إعداد قاعدة البيانات

```bash
# تثبيت PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# إعداد قاعدة البيانات
sudo -u postgres psql
CREATE DATABASE attendance_system;
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE attendance_system TO app_user;
```

#### 3. نشر الخادم الخلفي

```bash
cd Back-end

# إعداد البيئة
cp .env.example .env
# تعديل .env بإعدادات الإنتاج

# تثبيت وبناء
npm install
npm run build

# تطبيق الـ migrations
npx prisma migrate deploy

# تشغيل بـ PM2
pm2 start dist/src/server.js --name "attendance-api"
pm2 save
pm2 startup
```

#### 4. نشر الواجهة الأمامية

```bash
cd front-end/smooth-frontend

# إعداد البيئة
echo "VITE_API_URL=https://api.your-domain.com/api/v1" > .env

# بناء التطبيق
npm run build

# نسخ الملفات للخادم
# استخدم Nginx أو Apache لتقديم الملفات الثابتة
```

#### 5. إعداد Nginx

```nginx
# /etc/nginx/sites-available/attendance

# API Backend
server {
    listen 443 ssl;
    server_name api.your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/attendance/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🔍 استكشاف الأخطاء

### مشاكل شائعة

#### 1. خطأ اتصال قاعدة البيانات

```
Error: P1001: Can't reach database server
```

**الحل:**
- تأكد أن PostgreSQL يعمل
- تحقق من DATABASE_URL في `.env`
- تأكد أن المنفذ 5432 مفتوح

#### 2. خطأ Prisma Client

```
Error: @prisma/client did not initialize yet
```

**الحل:**
```bash
npx prisma generate
```

#### 3. خطأ CORS

```
Access-Control-Allow-Origin error
```

**الحل:**
- تأكد أن FRONTEND_URL صحيح في `.env`
- أعد تشغيل الخادم

#### 4. مشكلة البريد الإلكتروني

```
Error: Invalid login
```

**الحل:**
- استخدم App Password لـ Gmail
- تأكد من تفعيل "Less secure apps" أو استخدم OAuth

---

## 📞 الدعم

للمساعدة:
- 📧 support@example.com
- 📱 +964-XXX-XXX-XXXX
