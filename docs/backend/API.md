# 📡 توثيق واجهة برمجة التطبيقات (API Documentation)

## 🔗 Base URL

```
http://localhost:3000/api/v1
```

## 🔐 المصادقة (Authentication)

جميع الطلبات المحمية تتطلب إرسال Token في الـ Header:

```
Authorization: Bearer <token>
```

---

## 📚 نقاط النهاية (Endpoints)

---

### 🔑 المصادقة `/auth`

#### تسجيل الدخول
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "role": "student"  // student | teacher | admin
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "id": 1,
      "name": "أحمد محمد",
      "email": "student@example.com",
      "role": "student"
    }
  }
}
```

**Rate Limit:** 5 محاولات / 15 دقيقة

---

#### تسجيل الخروج
```http
POST /auth/logout
Authorization: Bearer <token>
```

---

#### الملف الشخصي
```http
GET /auth/profile
Authorization: Bearer <token>
```

---

#### نسيت كلمة المرور
```http
POST /auth/forgot-password
```

**Body:**
```json
{
  "email": "student@example.com",
  "role": "student"
}
```

**Rate Limit:** 5 محاولات / 15 دقيقة

---

#### إعادة تعيين كلمة المرور
```http
POST /auth/reset-password
```

**Body:**
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123",
  "passwordConfirm": "newPassword123"
}
```

---

#### تغيير كلمة مرور الطالب
```http
POST /auth/student/change-password/:studentId
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

---

### 📋 الجلسات `/sessions`

#### جلب جميع الجلسات
```http
GET /sessions
Authorization: Bearer <token>
```

**Query Parameters:**
| المعامل | النوع | الوصف |
|---------|------|-------|
| `active` | boolean | فلترة حسب الحالة |
| `material_id` | number | فلترة حسب المادة |
| `date` | string | فلترة حسب التاريخ |

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "session_date": "2026-02-02T10:00:00Z",
      "is_active": true,
      "material": {
        "id": "1",
        "name": "البرمجة المتقدمة"
      },
      "teacher": {
        "id": "1",
        "name": "د. محمد علي"
      },
      "geofence": {
        "name": "القاعة 101",
        "latitude": 33.312805,
        "longitude": 44.366096,
        "radius_meters": 100
      }
    }
  ]
}
```

---

#### إنشاء جلسة جديدة
```http
POST /sessions
Authorization: Bearer <token> (Teacher only)
```

**Body:**
```json
{
  "material_id": 1,
  "geofence_id": 1,
  "duration_minutes": 90
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "1",
    "session_date": "2026-02-02T10:00:00Z",
    "is_active": true,
    "expires_at": "2026-02-02T11:30:00Z",
    "qr_secret": "abc123..."
  }
}
```

---

#### تفاصيل جلسة
```http
GET /sessions/:id
Authorization: Bearer <token>
```

---

#### إنهاء جلسة
```http
PATCH /sessions/:id/end
Authorization: Bearer <token> (Teacher only)
```

---

### 📱 QR Code `/qrcodes`

#### توليد QR Code
```http
POST /qrcodes/generate/:session_id
Authorization: Bearer <token> (Teacher only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "qr_string": "ATT:abc123:1738501200:xyz789",
    "token_hash": "sha256hash...",
    "expires_at": "2026-02-02T10:00:30Z",
    "expires_in_seconds": 30
  }
}
```

**Rate Limit:** 100 طلب / 15 دقيقة

---

#### مسح QR Code (تسجيل الحضور)
```http
POST /qrcodes/validate
Authorization: Bearer <token> (Student only)
```

**Body:**
```json
{
  "qr_data": "ATT:abc123:1738501200:xyz789",
  "latitude": 33.312805,
  "longitude": 44.366096
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "تم تسجيل حضورك بنجاح!",
  "data": {
    "attendance_id": "1",
    "session": {
      "material_name": "البرمجة المتقدمة"
    },
    "marked_at": "2026-02-02T10:05:00Z"
  }
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "أنت خارج نطاق القاعة المحددة"
}
```

**Rate Limit:** 10 محاولات / دقيقة

---

### 📊 الحضور `/attendance`

#### جلب سجلات حضور الطالب
```http
GET /attendance/my-records
Authorization: Bearer <token> (Student only)
```

---

#### جلب حضور جلسة معينة
```http
GET /attendance/session/:session_id
Authorization: Bearer <token> (Teacher/Admin)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalStudents": 30,
    "presentCount": 25,
    "absentCount": 5,
    "attendees": [
      {
        "student": {
          "id": "1",
          "name": "أحمد محمد",
          "student_id": "STU001"
        },
        "status": "PRESENT",
        "marked_at": "2026-02-02T10:05:00Z"
      }
    ]
  }
}
```

---

#### تصدير تقرير PDF
```http
GET /attendance/session/:session_id/report/pdf
Authorization: Bearer <token> (Teacher/Admin)
```

**Response:** ملف PDF

---

### 📈 لوحة التحكم `/dashboard`

#### لوحة تحكم الطالب
```http
GET /dashboard/student
Authorization: Bearer <token> (Student only)
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "totalSessions": 50,
      "attended": 45,
      "absent": 5,
      "percentage": "90.00"
    },
    "byMaterial": [
      {
        "material_name": "البرمجة المتقدمة",
        "total": 20,
        "attended": 19,
        "percentage": "95.00"
      }
    ],
    "recentAttendance": [...]
  }
}
```

---

#### لوحة تحكم الأستاذ
```http
GET /dashboard/teacher
Authorization: Bearer <token> (Teacher only)
```

---

#### لوحة تحكم الإداري
```http
GET /dashboard/admin
Authorization: Bearer <token> (Admin only)
```

---

### 👥 الطلاب `/students`

#### جلب جميع الطلاب
```http
GET /students
Authorization: Bearer <token> (Admin only)
```

**Query Parameters:**
| المعامل | النوع | الوصف |
|---------|------|-------|
| `page` | number | رقم الصفحة |
| `limit` | number | عدد النتائج |
| `search` | string | البحث |
| `department_id` | number | فلترة حسب القسم |
| `stage_id` | number | فلترة حسب المرحلة |

---

#### إضافة طالب
```http
POST /auth/admin/signin/student
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "student_id": "STU001",
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "password123",
  "department_id": 1,
  "stage_id": 1
}
```

---

### 👨‍🏫 الأساتذة `/teachers`

#### جلب جميع الأساتذة
```http
GET /teachers
Authorization: Bearer <token> (Admin only)
```

---

#### إضافة أستاذ
```http
POST /auth/admin/signin/teacher
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "name": "د. محمد علي",
  "email": "teacher@example.com",
  "password": "password123",
  "department_id": 1,
  "materialIds": [1, 2, 3]
}
```

---

### 📚 المواد `/materials`

#### جلب جميع المواد
```http
GET /materials
Authorization: Bearer <token>
```

---

#### إضافة مادة
```http
POST /materials
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "name": "البرمجة المتقدمة",
  "department_id": 1,
  "stage_id": 1,
  "semester": "SEMESTER_1",
  "is_core_subject": true
}
```

---

### 🏢 الأقسام `/departments`

#### جلب جميع الأقسام
```http
GET /departments
Authorization: Bearer <token>
```

---

#### إضافة قسم
```http
POST /departments
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "name": "هندسة البرمجيات"
}
```

---

### 📊 المراحل `/stages`

#### جلب جميع المراحل
```http
GET /stages
Authorization: Bearer <token>
```

---

#### إضافة مرحلة
```http
POST /stages
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "name": "المرحلة الأولى",
  "level": 1
}
```

---

### 📍 المواقع الجغرافية `/geofences`

#### جلب جميع المواقع
```http
GET /geofences
Authorization: Bearer <token>
```

---

#### إضافة موقع
```http
POST /geofences
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "name": "القاعة 101",
  "latitude": 33.312805,
  "longitude": 44.366096,
  "radius_meters": 100
}
```

---

### 🎓 الترحيل `/promotion`

#### تنفيذ الترحيل
```http
POST /promotion/execute
Authorization: Bearer <token> (Admin only)
```

**Body:**
```json
{
  "department_id": 1,
  "academic_year_from": "2025-2026",
  "academic_year_to": "2026-2027"
}
```

---

## ⚠️ رموز الأخطاء

| الرمز | الوصف |
|------|-------|
| 400 | طلب غير صالح |
| 401 | غير مصرح |
| 403 | ممنوع |
| 404 | غير موجود |
| 429 | تجاوز حد الطلبات |
| 500 | خطأ في الخادم |

---

## 🔒 Rate Limiting

| نوع العملية | الحد | النافذة الزمنية |
|-------------|------|-----------------|
| تسجيل الدخول | 5 | 15 دقيقة |
| مسح QR | 10 | 1 دقيقة |
| API العام | 100 | 15 دقيقة |
| إنشاء بيانات | 30 | 1 دقيقة |

---

## 📝 ملاحظات

1. جميع التواريخ بصيغة ISO 8601
2. الـ IDs هي BigInt وتُرسل كـ strings
3. الـ Token صالح لمدة 24 ساعة
4. QR Code صالح لمدة 30 ثانية فقط
