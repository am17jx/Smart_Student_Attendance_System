# 🔒 دليل الأمان# Security Policy

## Recent Improvements (Feb 2026)

### 1. API Security
-   **Credential Leaks Fixed**: The API no longer returns temporary passwords in JSON responses. All credentials are sent via secure side-channels (email).
-   **Input Validation**: Strict validation on all public endpoints using `express-validator`.

### 2. Network Security (CORS)
-   **Restricted Origins**: CORS is configured to only allow requests from:
    -   Production Domain (via `FRONTEND_URL`)
    -   Localhost (Ports 3000, 5173)
    -   Local Network IPs (192.168.x.x, 10.x.x.x, 172.x.x.x)
-   **Logging**: Blocked cross-origin requests are logged to the server console for monitoring.

### 3. Frontend Access Control
-   **Role-Based Access Control (RBAC)**: Implemented `ProtectedRoute` component to restrict access to pages based on user roles (`admin`, `teacher`, `student`).
-   **Authentication State**: Managed via secure Context API, checking valid tokens before rendering sensitive content.

## Authentication

يتضمن النظام عدة طبقات من الحماية لضمان أمان البيانات والمستخدمين.

---

## 🛡️ تدابير الأمان المطبقة

### 1. Rate Limiting (تحديد معدل الطلبات)

حماية من هجمات DDoS والـ Brute Force.

| نوع العملية | الحد الأقصى | النافذة الزمنية |
|-------------|-------------|-----------------|
| تسجيل الدخول | 5 محاولات | 15 دقيقة |
| مسح QR Code | 10 محاولات | 1 دقيقة |
| إعادة تعيين كلمة المرور | 5 محاولات | 15 دقيقة |
| API العام | 100 طلب | 15 دقيقة |
| إنشاء البيانات | 30 طلب | 1 دقيقة |

**الملف:** `middleware/rateLimiter.ts`

```typescript
// مثال على authLimiter
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // 5 محاولات
    message: 'تم تجاوز عدد محاولات تسجيل الدخول',
    skipSuccessfulRequests: true
});
```

---

### 2. Helmet.js (رؤوس الأمان)

حماية من الثغرات الشائعة في HTTP.

| الحماية | الوصف |
|---------|-------|
| Content-Security-Policy | منع XSS |
| X-Frame-Options | منع Clickjacking |
| X-Content-Type-Options | منع MIME Sniffing |
| Strict-Transport-Security | فرض HTTPS |
| X-DNS-Prefetch-Control | حماية DNS |
| X-Download-Options | حماية IE |
| X-Permitted-Cross-Domain-Policies | حماية Flash |
| Referrer-Policy | حماية الإحالة |

**الملف:** `src/app.ts`

```typescript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
```

---

### 3. CORS (مشاركة الموارد عبر الأصول)

تحكم في الأصول المسموح لها الوصول للـ API.

```typescript
const corsOptions = {
    origin: true, // أو قائمة محددة من الأصول
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Fingerprint'],
    exposedHeaders: ['X-Request-ID', 'Content-Disposition'],
    maxAge: 86400,
};
```

---

### 4. JWT Authentication (مصادقة JWT)

نظام مصادقة آمن باستخدام JSON Web Tokens.

**الخصائص:**
- صلاحية Token: 24 ساعة
- تشفير: HS256
- تخزين آمن في الـ Frontend

```typescript
// توليد Token
const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

---

### 5. Password Hashing (تشفير كلمات المرور)

تشفير كلمات المرور باستخدام bcrypt.

```typescript
// تشفير كلمة المرور
const hashedPassword = await bcrypt.hash(password, 12);

// التحقق من كلمة المرور
const isValid = await bcrypt.compare(password, hashedPassword);
```

**الخصائص:**
- Rounds: 12
- خوارزمية: bcrypt

---

### 6. Geofencing (التحقق من الموقع)

التحقق من موقع الطالب عند تسجيل الحضور.

```typescript
// حساب المسافة بين الطالب والقاعة
function isWithinGeofence(
    studentLat: number,
    studentLng: number,
    geofence: Geofence
): boolean {
    const distance = calculateDistance(
        studentLat, studentLng,
        geofence.latitude, geofence.longitude
    );
    return distance <= geofence.radius_meters;
}
```

---

### 7. QR Code Security (أمان رمز QR)

حماية رموز QR من إعادة الاستخدام والتزوير.

| الخاصية | القيمة |
|---------|--------|
| صلاحية QR | 30 ثانية |
| استخدام مرة واحدة | نعم |
| تجديد تلقائي | نعم |
| تشفير | SHA-256 |

**Format:**
```
ATT:{qr_secret}:{timestamp}:{token}
```

---

### 8. Input Validation (التحقق من المدخلات)

التحقق من صحة البيانات المدخلة.

```typescript
// مثال على التحقق
validateRequest(
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['student', 'teacher', 'admin'])
);
```

---

### 9. Error Handling (معالجة الأخطاء)

إخفاء التفاصيل التقنية في رسائل الخطأ.

```typescript
// في الإنتاج
res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // لا يتم إرسال stack trace
});

// في التطوير فقط
res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack // فقط في التطوير
});
```

---

### 10. Logging (التسجيل)

تسجيل جميع العمليات الحساسة.

**الملفات:**
- `logs/combined.log` - جميع السجلات
- `logs/error.log` - الأخطاء فقط
- `logs/exceptions.log` - الاستثناءات

```typescript
// تسجيل محاولة فاشلة
logger.warn('❌ Failed login attempt', {
    email: req.body.email,
    ip: req.ip,
    userAgent: req.headers['user-agent']
});
```

---

## ⚠️ أنواع الهجمات المحمي منها

| نوع الهجوم | الحماية | الحالة |
|-----------|---------|--------|
| DDoS | Rate Limiting | ✅ |
| Brute Force | authLimiter | ✅ |
| XSS | Helmet CSP | ✅ |
| CSRF | SameSite Cookies | ✅ |
| Clickjacking | X-Frame-Options | ✅ |
| SQL Injection | Prisma ORM | ✅ |
| NoSQL Injection | لا ينطبق | - |
| MIME Sniffing | X-Content-Type-Options | ✅ |
| Location Spoofing | Geofencing + Device ID | ⚠️ جزئي |

---

## 🔐 توصيات إضافية للإنتاج

### 1. استخدم HTTPS فقط

```nginx
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### 2. استخدم متغيرات بيئة آمنة

```bash
# لا تضع أسرار في الكود
JWT_SECRET=generate-strong-random-secret
DATABASE_URL=use-connection-with-ssl
```

### 3. فعّل Database SSL

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 4. استخدم Firewall

```bash
# فتح المنافذ الضرورية فقط
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

### 5. حدّث الاعتمادات بانتظام

```bash
npm audit
npm update
```

### 6. استخدم نسخ احتياطية

```bash
# نسخ احتياطي يومي
pg_dump attendance_system > backup_$(date +%Y%m%d).sql
```

---

## 📋 قائمة فحص الأمان

قبل النشر للإنتاج:

- [ ] JWT_SECRET قوي وفريد
- [ ] DATABASE_URL مع SSL
- [ ] HTTPS مفعّل
- [ ] Rate Limiting مضبوط
- [ ] Logs مُفعّلة
- [ ] Error messages آمنة
- [ ] Password policy قوي
- [ ] Firewall مُعد
- [ ] Backups مُجدولة
- [ ] Dependencies محدّثة

---

## 📞 الإبلاغ عن ثغرات

إذا وجدت ثغرة أمنية:

1. **لا تنشرها علناً**
2. أرسل تقريراً إلى: security@example.com
3. انتظر الرد خلال 48 ساعة
4. نقدّر مساهمتك! 🙏
