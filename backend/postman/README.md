# 🚀 Postman Collection - دليل الاستخدام

## 📁 الملفات المتوفرة

1. **Privacy-Preserving-Attendance-API.postman_collection.json**  
   Collection كامل يحتوي على جميع الـ API endpoints

2. **Development.postman_environment.json**  
   Environment variables للـ Development

---

## 📥 كيفية الاستيراد

### الخطوة 1: استيراد Collection

1. افتح Postman
2. اضغط **Import** (أعلى اليسار)
3. اسحب ملف `Privacy-Preserving-Attendance-API.postman_collection.json` أو اضغط **Upload Files**
4. اضغط **Import**

### الخطوة 2: استيراد Environment

1. اضغط على أيقونة **Environments** (يسار الشاشة)
2. اضغط **Import**
3. اختر ملف `Development.postman_environment.json`
4. اضغط **Import**

### الخطوة 3: تفعيل Environment

1. في أعلى اليمين، اختر **Development** من القائمة المنسدلة
2. الآن جاهز للاستخدام! ✅

---

## 🎯 كيفية الاستخدام

### 1️⃣ البداية: تسجيل الدخول

**ابدأ هنا دائماً!**

1. افتح **Authentication** folder
2. افتح request **Login (Universal)**
3. اضغط **Send**
4. ✅ الـ token سيُحفظ تلقائياً في Environment!

**Body الافتراضي:**
```json
{
    "email": "admin@test.com",
    "password": "Admin123!"
}
```

> [!IMPORTANT]
> يجب عليك تسجيل الدخول أولاً قبل أي request آخر!

---

### 2️⃣ اختبار Departments

1. افتح **Departments** folder
2. ابدأ بـ **Create Department**
3. اضغط **Send**
4. احفظ الـ `id` من Response
5. جرّب باقي الـ requests (Get All, Update, Delete)

---

### 3️⃣ اختبار Stages

مشابه للـ Departments:
1. Create Stage
2. Get All Stages
3. Update Stage
4. Delete Stage

---

### 4️⃣ اختبار Materials

1. Create Material (تحتاج `stageId`)
2. Get Materials by Stage
3. Assign Teacher to Material
4. Remove Teacher from Material

---

### 5️⃣ اختبار Sessions

1. Create Session (تحتاج `materialId`, `teacherId`, `geofenceId`)
2. احفظ الـ `sessionId`
3. Close Session

---

### 6️⃣ اختبار QR Codes

1. **Generate QR Code** - سيحفظ الـ token تلقائياً
2. **Validate QR Code** - سيستخدم الـ token المحفوظ
3. **Get QR Code by Session**

---

### 7️⃣ اختبار Attendance

1. **Record Attendance** - يستخدم QR token المحفوظ
2. **Get Attendance by Session**
3. **Get Attendance by Student**

---

## 🔧 تعديل Variables

### في Collection:
- `baseUrl`: عنوان الـ API (افتراضياً: `http://localhost:3000/api/v1`)

### في Environment:
- `token`: يُحفظ تلقائياً بعد Login
- `qrToken`: يُحفظ تلقائياً بعد توليد QR Code
- `departmentId`, `stageId`, etc.: عدّلها حسب الـ IDs الفعلية

**لتعديل Environment:**
1. اضغط على أيقونة العين 👁️ بجانب Environment name
2. اضغط **Edit**
3. عدّل القيم
4. **Save**

---

## 📊 هيكل Collection

```
Privacy-Preserving Student Attendance API
├── Authentication (6 requests)
│   ├── Login (Universal)
│   ├── Create Teacher (Admin Only)
│   ├── Create Student (Admin Only)
│   ├── Change Student Password
│   ├── Reset Student Password (Admin Only)
│   └── Change Teacher Password
│
├── Departments (4 requests)
│   ├── Get All Departments
│   ├── Create Department
│   ├── Update Department
│   └── Delete Department
│
├── Stages (5 requests)
│   ├── Get All Stages
│   ├── Get Stage by ID
│   ├── Create Stage
│   ├── Update Stage
│   └── Delete Stage
│
├── Materials (8 requests)
│   ├── Get All Materials
│   ├── Get Material by ID
│   ├── Get Materials by Stage
│   ├── Create Material
│   ├── Update Material
│   ├── Delete Material
│   ├── Assign Teacher to Material
│   └── Remove Teacher from Material
│
├── Geofences (5 requests)
│   ├── Get All Geofences
│   ├── Get Geofence by ID
│   ├── Create Geofence
│   ├── Update Geofence
│   └── Delete Geofence
│
├── Sessions (5 requests)
│   ├── Get All Sessions
│   ├── Get Session by ID
│   ├── Create Session
│   ├── Update Session
│   └── Close Session
│
├── QR Codes (3 requests)
│   ├── Generate QR Code
│   ├── Validate QR Code
│   └── Get QR Code by Session
│
└── Attendance (4 requests)
    ├── Record Attendance
    ├── Get All Attendance Records
    ├── Get Attendance by Session
    └── Get Attendance by Student
```

**إجمالي الـ Requests**: 40 endpoint

---

## 🔐 Authentication

### تلقائي (Automatic):
- بعد Login، الـ token يُحفظ تلقائياً
- جميع الـ requests التالية ستستخدمه

### يدوي (Manual):
إذا أردت تغيير الـ token يدوياً:
1. اذهب إلى Environment variables
2. عدّل قيمة `token`
3. Save

---

## 💡 نصائح مهمة

> [!TIP]
> **اختبر بالترتيب!**
> 1. Login أولاً
> 2. Create Department
> 3. Create Stage (يحتاج department)
> 4. Create Material (يحتاج stage)
> 5. Create Geofence
> 6. Create Session (يحتاج material + geofence)
> 7. Generate QR Code (يحتاج session)
> 8. Record Attendance

> [!WARNING]
> **قبل الاختبار:**
> - تأكد من تشغيل السيرفر: `npm run dev`
> - تأكد من الاتصال بالـ Database
> - تأكد من اختيار Environment الصحيح

> [!NOTE]
> **حفظ الـ IDs:**
> - بعد إنشاء أي resource، احفظ الـ `id` من Response
> - استخدمه في الـ requests التالية
> - أو عدّل Environment variables

---

## 🧪 سيناريو اختبار كامل

### السيناريو: تسجيل حضور طالب

1. **Login as Admin**
   ```
   POST /auth/login
   ```

2. **Create Department**
   ```
   POST /departments
   Body: { "name": "علوم الحاسوب", "code": "CS" }
   احفظ department_id
   ```

3. **Create Stage**
   ```
   POST /stages
   Body: { "name": "المرحلة الأولى", "code": "STAGE1", "departmentId": 1 }
   احفظ stage_id
   ```

4. **Create Material**
   ```
   POST /materials
   Body: { "name": "البرمجة", "code": "CS101", "stageId": 1 }
   احفظ material_id
   ```

5. **Create Teacher**
   ```
   POST /auth/admin/signin/teacher
   Body: { "email": "...", "password": "...", ... }
   احفظ teacher_id
   ```

6. **Create Student**
   ```
   POST /auth/admin/signin/student
   Body: { "email": "...", "studentId": "...", "stageId": 1, ... }
   احفظ student_id
   ```

7. **Assign Teacher to Material**
   ```
   POST /materials/:id/assign-teacher
   Body: { "teacherId": 1 }
   ```

8. **Create Geofence**
   ```
   POST /geofences
   Body: { "name": "قاعة 101", "latitude": 33.3152, ... }
   احفظ geofence_id
   ```

9. **Create Session**
   ```
   POST /sessions
   Body: { "materialId": 1, "teacherId": 1, "geofenceId": 1, ... }
   احفظ session_id
   ```

10. **Generate QR Code**
    ```
    POST /qrcodes/generate
    Body: { "sessionId": 1 }
    qrToken يُحفظ تلقائياً
    ```

11. **Record Attendance**
    ```
    POST /attendance/record
    Body: { 
      "studentId": 1, 
      "sessionId": 1, 
      "qrToken": "{{qrToken}}",
      "latitude": 33.3152,
      "longitude": 44.3661
    }
    ```

12. **Get Attendance by Session**
    ```
    GET /attendance/session/1
    ```

✅ **مبروك!** اختبرت الـ Workflow كامل!

---

## 🆘 استكشاف الأخطاء

### الخطأ: "Unauthorized"
- **السبب**: لم تسجل الدخول أو الـ token منتهي
- **الحل**: سجّل دخول مرة أخرى

### الخطأ: "Validation Error"
- **السبب**: بيانات مدخلة خاطئة
- **الحل**: راجع الـ Body ومطابقته مع المطلوب

### الخطأ: "Not Found"
- **السبب**: الـ ID المستخدم غير موجود
- **الحل**: تحقق من الـ ID في الـ Database

### الخطأ: "Connection Refused"
- **السبب**: السيرفر لم يشتغل
- **الحل**: شغّل السيرفر: `npm run dev`

---

## 📝 التوثيق

بعد الاختبار، يمكنك:
1. إضافة Examples للـ Responses
2. كتابة Descriptions للـ requests
3. إنشاء Tests (في الـ Tests tab)
4. مشاركة الـ Collection مع الفريق

---

## 🎉 جاهز!

الآن لديك كل ما تحتاج لاختبار الـ API بشكل كامل!

**ابدأ الآن:**
1. Import الملفين
2. شغّل السيرفر
3. Login
4. ابدأ الاختبار!

**بالتوفيق! 💪**
