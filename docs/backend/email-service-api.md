# 📧 Email Service API Documentation

## Overview

This document describes the new email-based authentication endpoints added to the Privacy-Preserving Student Attendance system.

---

## 🔐 Authentication Endpoints

### 1. Forgot Password

Request a password reset email.

**Endpoint:** `POST /api/auth/forgot-password`

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة التعيين"
}
```

**Notes:**
- Always returns success even if email doesn't exist (security measure)
- Reset token expires in 30 minutes
- Email contains a link to reset password page with token

---

### 2. Reset Password

Reset password using token from email.

**Endpoint:** `POST /api/auth/reset-password`

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "token": "abc123def456...",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "الرمز غير صحيح أو منتهي الصلاحية"
}
```

**Notes:**
- Token must be valid and not expired
- Password is hashed before storage
- `must_change_password` flag is set to false

---

### 3. Verify Email

Verify student email address using token.

**Endpoint:** `GET /api/auth/verify-email/:token`

**Access:** Public (no authentication required)

**URL Parameters:**
- `token` - Verification token from email

**Success Response (200):**
```json
{
  "status": "success",
  "message": "تم تأكيد البريد الإلكتروني بنجاح"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "الرمز غير صحيح أو منتهي الصلاحية"
}
```

**Notes:**
- Token expires in 24 hours
- Sets `is_verified` to true
- Sets `email_verified_at` timestamp

---

### 4. Resend Verification Email

Request a new verification email.

**Endpoint:** `POST /api/auth/resend-verification`

**Access:** Public (no authentication required)

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "تم إرسال رابط التحقق إلى بريدك الإلكتروني"
}
```

**Error Response (400):**
```json
{
  "status": "error",
  "message": "البريد الإلكتروني مؤكد بالفعل"
}
```

**Notes:**
- Only works if email is not already verified
- Generates new verification token
- Always returns success if email doesn't exist (security)

---

## 📨 Email Templates

### Welcome Email
- **Sent when:** Student account is created by admin
- **Contains:** 
  - Temporary password
  - Login link
  - Warning to change password on first login

### Password Reset Email
- **Sent when:** Student requests password reset
- **Contains:**
  - Reset link with token (valid 30 minutes)
  - Security warning
  - Alternative text link if button doesn't work

### Email Verification Email
- **Sent when:** 
  - Student account is created
  - Student requests resend verification
- **Contains:**
  - Verification link with token (valid 24 hours)
  - Instructions

### Login Notification Email
- **Sent when:** Student successfully logs in
- **Contains:**
  - Login timestamp
  - IP address
  - Link to change password
  - Security warning

---

## 🔧 Configuration

### Environment Variables

Required variables in `.env`:

```env
# Email Service Type
EMAIL_SERVICE=gmail

# Email Credentials
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=نظام الحضور الإلكتروني
EMAIL_PASSWORD=your-gmail-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### Gmail App Password Setup

1. Go to Google Account Settings
2. Security → 2-Step Verification (enable it)
3. App Passwords → Generate new password
4. Copy the password to `.env` as `EMAIL_PASSWORD`

---

## 🧪 Testing with Postman

### Test Forgot Password
```bash
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```

### Test Reset Password
```bash
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "token-from-email",
  "newPassword": "newPassword123"
}
```

### Test Email Verification
```bash
GET http://localhost:3000/api/auth/verify-email/token-from-email
```

### Test Resend Verification
```bash
POST http://localhost:3000/api/auth/resend-verification
Content-Type: application/json

{
  "email": "student@example.com"
}
```

---

## 🔒 Security Features

1. **Token Hashing:** All tokens are hashed with SHA-256 before storage
2. **Token Expiration:** 
   - Password reset: 30 minutes
   - Email verification: 24 hours
3. **No Email Disclosure:** API doesn't reveal if email exists
4. **Rate Limiting:** Built-in protection against abuse
5. **Automatic Cleanup:** Expired tokens are cleared after use

---

## 📊 Database Schema Changes

New fields added to `Student` table:

```sql
email_verification_token   String?   @unique
email_verification_expires DateTime?
password_reset_token       String?   @unique
password_reset_expires     DateTime?
email_verified_at          DateTime?
```

---

## 🎯 Integration with Existing System

### Modified Endpoints

**Student Signup (`POST /api/auth/admin/signin/student`):**
- Now sends welcome email with temporary password
- Sends verification email
- Response includes success message about email

**Student Login (`POST /api/auth/login`):**
- Now sends login notification email
- Includes IP address and timestamp
- Non-blocking (login succeeds even if email fails)

---

## ⚠️ Important Notes

1. **Email Failures:** Email sending failures don't block critical operations (signup/login)
2. **Logging:** All email operations are logged to console
3. **Error Handling:** Proper error messages in Arabic
4. **Non-Interactive:** All operations work without user interaction
5. **Production Ready:** Ready for deployment with proper configuration
