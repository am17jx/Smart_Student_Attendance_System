# 🧪 دليل اختبار API - خطوة بخطوة

**آخر تحديث**: 21 يناير 2026  
**الهدف**: اختبار جميع API endpoints يدوياً قبل تطوير Frontend

---

## 📋 المتطلبات الأساسية

### 1. تثبيت أدوات الاختبار

**الخيار 1: Postman** (موصى به)
- تنزيل من: https://www.postman.com/downloads/
- سهل الاستخدام
- يدعم Collections و Environments
- يحفظ التاريخ

**الخيار 2: Thunder Client** (VS Code Extension)
- افتح VS Code
- اذهب إلى Extensions
- ابحث عن "Thunder Client"
- اضغط Install

### 2. تشغيل السيرفر

```bash
# افتح Terminal في مجلد المشروع
cd C:\Users\Lenovo\Desktop\myproject\Privacy-Preserving-Student-Attendance-1

# شغّل السيرفر
npm run dev
```

**يجب أن ترى:**
```
🚀 Server running on port 3000
✅ Database connected successfully
```

### 3. إعداد Environment Variables

تأكد من وجود ملف `.env` مع هذه القيم:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="90d"
PORT=3000
NODE_ENV="development"
```

---

## 🎯 خطة الاختبار

### المرحلة 1: اختبار Authentication (الأولوية!)

يجب أن تبدأ هنا لأنك تحتاج JWT Token للوصول لباقي الـ endpoints.

#### 1.1 إنشاء Admin Account

**Endpoint**: `POST http://localhost:3000/api/v1/auth/register`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "email": "admin@test.com",
  "password": "Admin123!",
  "role": "ADMIN",
  "firstName": "Admin",
  "lastName": "User"
}
```

**النتيجة المتوقعة**: 
- Status: 201 Created
- Response: يحتوي على `token` و `user` object

**احفظ الـ token**! ستحتاجه لباقي الطلبات.

---

#### 1.2 تسجيل الدخول

**Endpoint**: `POST http://localhost:3000/api/v1/auth/login`

**Body**:
```json
{
  "email": "admin@test.com",
  "password": "Admin123!"
}
```

**النتيجة المتوقعة**: 
- Status: 200 OK
- Response: token + user info

---

#### 1.3 إنشاء Teacher

**Endpoint**: `POST http://localhost:3000/api/v1/auth/import-teachers`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <YOUR_TOKEN_HERE>
```

**Body**:
```json
{
  "teachers": [
    {
      "email": "teacher1@university.edu",
      "firstName": "محمد",
      "lastName": "أحمد",
      "departmentId": null
    }
  ]
}
```

**النتيجة المتوقعة**: 
- Status: 201 Created
- Response: قائمة بالـ teachers المنشأة

---

#### 1.4 إنشاء Student

**Endpoint**: `POST http://localhost:3000/api/v1/auth/import-students`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
Content-Type: application/json
```

**Body**:
```json
{
  "students": [
    {
      "email": "student1@university.edu",
      "firstName": "علي",
      "lastName": "حسن",
      "studentId": "202301001",
      "fingerprintHash": null,
      "stageId": null
    }
  ]
}
```

---

### المرحلة 2: اختبار Department Management

#### 2.1 إنشاء Department جديد

**Endpoint**: `POST http://localhost:3000/api/v1/departments`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
Content-Type: application/json
```

**Body**:
```json
{
  "name": "قسم علوم الحاسوب",
  "code": "CS"
}
```

**احفظ الـ `id` من Response!**

---

#### 2.2 عرض جميع Departments

**Endpoint**: `GET http://localhost:3000/api/v1/departments`

**Headers**:
```
Authorization: Bearer <YOUR_TOKEN_HERE>
```

**النتيجة المتوقعة**: قائمة بجميع الأقسام

---

#### 2.3 عرض Department محدد

**Endpoint**: `GET http://localhost:3000/api/v1/departments/:id`

مثال: `GET http://localhost:3000/api/v1/departments/1`

---

#### 2.4 تحديث Department

**Endpoint**: `PUT http://localhost:3000/api/v1/departments/:id`

**Body**:
```json
{
  "name": "قسم علوم الحاسوب - محدّث",
  "code": "CS-UPDATED"
}
```

---

#### 2.5 حذف Department

**Endpoint**: `DELETE http://localhost:3000/api/v1/departments/:id`

---

### المرحلة 3: اختبار Stage Management

#### 3.1 إنشاء Stage

**Endpoint**: `POST http://localhost:3000/api/v1/stages`

**Body**:
```json
{
  "name": "المرحلة الأولى",
  "code": "STAGE1",
  "departmentId": 1
}
```

#### 3.2 باقي CRUD Operations

مشابهة للـ Departments:
- `GET /api/v1/stages` - عرض الكل
- `GET /api/v1/stages/:id` - عرض واحد
- `PUT /api/v1/stages/:id` - تحديث
- `DELETE /api/v1/stages/:id` - حذف

---

### المرحلة 4: اختبار Material Management

#### 4.1 إنشاء Material

**Endpoint**: `POST http://localhost:3000/api/v1/materials`

**Body**:
```json
{
  "name": "البرمجة الكائنية",
  "code": "CS201",
  "stageId": 1
}
```

#### 4.2 باقي Operations

- `GET /api/v1/materials` - الكل
- `GET /api/v1/materials/:id` - واحد
- `GET /api/v1/materials/stage/:stageId` - حسب المرحلة
- `PUT /api/v1/materials/:id` - تحديث
- `DELETE /api/v1/materials/:id` - حذف
- `POST /api/v1/materials/:id/assign-teacher` - ربط أستاذ
- `DELETE /api/v1/materials/:id/remove-teacher` - إزالة أستاذ

---

### المرحلة 5: اختبار Geofence Management

#### 5.1 إنشاء Geofence

**Endpoint**: `POST http://localhost:3000/api/v1/geofences`

**Body**:
```json
{
  "name": "قاعة 101",
  "latitude": 33.3152,
  "longitude": 44.3661,
  "radius": 50.0
}
```

---

### المرحلة 6: اختبار Session Management

#### 6.1 إنشاء Session

**Endpoint**: `POST http://localhost:3000/api/v1/sessions`

**Body**:
```json
{
  "sessionDate": "2026-01-22T10:00:00Z",
  "materialId": 1,
  "teacherId": 1,
  "geofenceId": 1
}
```

**احفظ الـ `id`!**

#### 6.2 بدء Session

**Endpoint**: `POST http://localhost:3000/api/v1/sessions/:id/start`

#### 6.3 إنهاء Session

**Endpoint**: `POST http://localhost:3000/api/v1/sessions/:id/end`

#### 6.4 عرض جميع Sessions

**Endpoint**: `GET http://localhost:3000/api/v1/sessions`

#### 6.5 عرض Session محدد

**Endpoint**: `GET http://localhost:3000/api/v1/sessions/:id`

---

### المرحلة 7: اختبار QR Code Generation

#### 7.1 توليد QR Code

**Endpoint**: `POST http://localhost:3000/api/v1/qrcodes/generate`

**Body**:
```json
{
  "sessionId": 1
}
```

**النتيجة**: ستحصل على `token` (QR code token)

#### 7.2 التحقق من QR Code

**Endpoint**: `POST http://localhost:3000/api/v1/qrcodes/validate`

**Body**:
```json
{
  "token": "TOKEN_FROM_PREVIOUS_STEP"
}
```

#### 7.3 عرض QR Code لـ Session

**Endpoint**: `GET http://localhost:3000/api/v1/qrcodes/session/:sessionId`

---

### المرحلة 8: اختبار Attendance Recording

#### 8.1 تسجيل حضور

**Endpoint**: `POST http://localhost:3000/api/v1/attendance/record`

**Body**:
```json
{
  "studentId": 1,
  "sessionId": 1,
  "qrToken": "TOKEN_HERE",
  "latitude": 33.3152,
  "longitude": 44.3661
}
```

#### 8.2 عرض سجلات الحضور لـ Session

**Endpoint**: `GET http://localhost:3000/api/v1/attendance/session/:sessionId`

#### 8.3 عرض سجلات الحضور لطالب

**Endpoint**: `GET http://localhost:3000/api/v1/attendance/student/:studentId`

#### 8.4 عرض جميع سجلات الحضور

**Endpoint**: `GET http://localhost:3000/api/v1/attendance`

---

## ✅ Checklist للاختبار

استخدم هذه القائمة للتأكد من اختبار كل شيء:

### Authentication
- [ ] إنشاء Admin
- [ ] تسجيل دخول Admin
- [ ] إنشاء Teacher
- [ ] إنشاء Student
- [ ] تسجيل دخول Teacher
- [ ] تسجيل دخول Student
- [ ] تغيير Password
- [ ] Force Password Reset

### Departments
- [ ] إنشاء Department
- [ ] عرض جميع Departments
- [ ] عرض Department محدد
- [ ] تحديث Department
- [ ] حذف Department

### Stages
- [ ] إنشاء Stage
- [ ] عرض جميع Stages
- [ ] عرض Stage محدد
- [ ] تحديث Stage
- [ ] حذف Stage

### Materials
- [ ] إنشاء Material
- [ ] عرض جميع Materials
- [ ] عرض Material محدد
- [ ] عرض Materials حسب Stage
- [ ] تحديث Material
- [ ] حذف Material
- [ ] ربط Teacher بـ Material
- [ ] إزالة Teacher من Material

### Geofences
- [ ] إنشاء Geofence
- [ ] عرض جميع Geofences
- [ ] عرض Geofence محدد
- [ ] تحديث Geofence
- [ ] حذف Geofence

### Sessions
- [ ] إنشاء Session
- [ ] بدء Session
- [ ] إنهاء Session
- [ ] عرض جميع Sessions
- [ ] عرض Session محدد

### QR Codes
- [ ] توليد QR Code
- [ ] التحقق من QR Code
- [ ] عرض QR Code لـ Session

### Attendance
- [ ] تسجيل حضور
- [ ] عرض حضور Session
- [ ] عرض حضور Student
- [ ] عرض جميع سجلات الحضور

---

## 🎨 إنشاء Postman Collection

### خطوات الإنشاء:

1. **إنشاء Collection جديد**
   - افتح Postman
   - اضغط "New Collection"
   - سمّه: "Privacy-Preserving Attendance System"

2. **إنشاء Environment**
   - اذهب إلى Environments
   - أنشئ environment جديد: "Development"
   - أضف المتغيرات:
     ```
     baseUrl: http://localhost:3000/api/v1
     token: (سيتم ملؤه بعد Login)
     ```

3. **إنشاء Folders**
   - Authentication
   - Departments
   - Stages
   - Materials
   - Geofences
   - Sessions
   - QR Codes
   - Attendance

4. **إضافة Requests**
   - أضف كل endpoint في الـ folder المناسب
   - استخدم `{{baseUrl}}` و `{{token}}`

5. **حفظ Collection**
   - اضغط "Export"
   - احفظه في: `docs/postman/`

---

## 📊 توثيق النتائج

أنشئ ملف `test-results.md` وسجّل:

1. **Endpoints المختبرة**: ✅ أو ❌
2. **Responses الفعلية**: نسخ من الـ JSON
3. **الأخطاء المكتشفة**: إن وجدت
4. **ملاحظات**: أي شيء مهم

مثال:
```markdown
## Authentication Tests

### POST /auth/register
- ✅ يعمل بشكل صحيح
- Response Time: 245ms
- Response:
  ```json
  {
    "status": "success",
    "data": {
      "user": {...},
      "token": "..."
    }
  }
  ```

### POST /auth/login
- ❌ خطأ: البريد الإلكتروني غير صحيح
- يجب إصلاح validation message
```

---

## 🚀 بعد الانتهاء من الاختبار

1. ✅ تأكد من أن كل Endpoints تعمل
2. ✅ احفظ Postman Collection
3. ✅ وثّق أي مشاكل وجدتها
4. ✅ جاهز للبدء بـ Frontend! 🎉

---

## 📝 النصائح

> [!TIP]
> - اختبر الـ endpoints بالترتيب المذكور
> - احفظ الـ IDs و Tokens
> - استخدم Environment Variables في Postman
> - وثّق كل شيء!

> [!WARNING]
> - لا تنسى الـ Authorization Header
> - تأكد من أن السيرفر يعمل
> - تحقق من الـ Database connection

---

**جاهز؟ ابدأ الآن! 💪**

بعد الانتهاء، ستكون جاهزاً لبناء Frontend وربطه بهذه الـ API! 🚀
