# 🚀 Email Service Setup Guide

## Quick Start - Gmail Configuration

### Step 1: Enable 2-Step Verification

1. Go to [Google Account](https://myaccount.google.com/)
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Generate App Password

1. Go back to **Security** page
2. Under "Signing in to Google", click **App passwords**
3. Select app: **Mail**
4. Select device: **Other (Custom name)**
5. Enter name: `Student Attendance System`
6. Click **Generate**
7. **Copy the 16-character password** (you won't see it again!)

### Step 3: Update .env File

Open `.env` and update these values:

```env
EMAIL_SERVICE=gmail
EMAIL_FROM=your-actual-email@gmail.com
EMAIL_FROM_NAME=نظام الحضور الإلكتروني
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Paste the 16-character password here
FRONTEND_URL=http://localhost:3001
```

**Important:** Remove spaces from the app password!

---

## Testing the Email Service

### Test 1: Create Student (Welcome Email)

```bash
POST http://localhost:3000/api/auth/admin/signin/student
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Test Student",
  "email": "test@example.com",
  "studentId": "S12345",
  "departmentId": 1,
  "stageId": 1
}
```

**Expected:**
- ✅ Student created successfully
- ✅ Welcome email sent with temporary password
- ✅ Verification email sent

### Test 2: Forgot Password

```bash
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Expected:**
- ✅ Success response
- ✅ Password reset email sent

### Test 3: Reset Password

```bash
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "token-from-email",
  "newPassword": "newPassword123"
}
```

**Expected:**
- ✅ Password changed successfully
- ✅ Can login with new password

### Test 4: Login (Notification Email)

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "newPassword123",
  "fingerprint": "test-fingerprint"
}
```

**Expected:**
- ✅ Login successful
- ✅ Login notification email sent

---

## Troubleshooting

### Error: "Failed to send email"

**Possible causes:**

1. **Wrong email/password:**
   - Double-check `EMAIL_FROM` and `EMAIL_PASSWORD` in `.env`
   - Make sure you're using App Password, not your regular password

2. **2-Step Verification not enabled:**
   - App Passwords only work with 2-Step Verification enabled

3. **Less secure app access:**
   - Gmail may block the app if it detects suspicious activity
   - Check your email for security alerts

4. **Network issues:**
   - Check your internet connection
   - Some networks block SMTP ports

### Error: "Invalid credentials"

- Make sure you copied the App Password correctly
- Remove any spaces from the password
- Try generating a new App Password

### Emails not arriving

1. **Check spam folder**
2. **Check email address is correct**
3. **Check Gmail "Sent" folder** to confirm emails were sent
4. **Wait a few minutes** - sometimes there's a delay

---

## Alternative: SendGrid (Recommended for Production)

### Why SendGrid?

- ✅ More reliable than Gmail
- ✅ Better deliverability
- ✅ Professional sender reputation
- ✅ Free tier: 100 emails/day

### Setup SendGrid

1. Create account at [sendgrid.com](https://sendgrid.com)
2. Verify your email
3. Create API Key:
   - Settings → API Keys → Create API Key
   - Name: `Student Attendance`
   - Permissions: **Full Access**
   - Copy the API key

4. Update `.env`:
```env
EMAIL_SERVICE=sendgrid
EMAIL_FROM=your-verified-email@domain.com
EMAIL_FROM_NAME=نظام الحضور الإلكتروني
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3001
```

---

## Email Templates Preview

### Welcome Email
- 🎓 Header: "مرحباً بك في نظام الحضور الذكي"
- 📧 Contains temporary password
- 🔗 Login button
- ⚠️ Warning to change password

### Password Reset Email
- 🔐 Header: "إعادة تعيين كلمة المرور"
- 🔗 Reset password button
- ⏰ Expires in 30 minutes
- 🛡️ Security notice

### Email Verification Email
- ✉️ Header: "تأكيد البريد الإلكتروني"
- 🔗 Verification button
- ⏰ Expires in 24 hours

### Login Notification Email
- 🔔 Header: "تنبيه تسجيل دخول جديد"
- ⏰ Login timestamp
- 🌐 IP address
- 🔗 Change password button

---

## Production Checklist

Before deploying to production:

- [ ] Use SendGrid instead of Gmail
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Use strong `EMAIL_PASSWORD` or API key
- [ ] Test all email flows
- [ ] Monitor email delivery rates
- [ ] Set up email logging
- [ ] Configure SPF/DKIM records for domain
- [ ] Add unsubscribe links (if required)

---

## Support

If you encounter any issues:

1. Check console logs for error messages
2. Verify `.env` configuration
3. Test with a simple email first
4. Check Gmail security settings
5. Try SendGrid as alternative
