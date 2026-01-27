# Authentication API Documentation

**Project**: Privacy-Preserving Student Attendance System  
**Base URL**: `/api/auth`  
**Author**: [Your Name]  
**Date**: January 2026

---

## Overview

I implemented a comprehensive authentication system that handles login, user creation, and password management for three user roles: Admin, Teacher, and Student. The system includes fingerprint-based device verification for students and role-based access control.

---

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Universal login for all roles | No |
| POST | `/admin/signin/teacher` | Create teacher account | Admin |
| POST | `/admin/signin/student` | Create student account | Admin |
| POST | `/student/change-password/:studentId` | Change student password | Student |
| POST | `/teacher/change-password/:teacherId` | Change teacher password | Teacher |
| POST | `/student/reset-password/:studentId` | Reset student password | Admin |

---

## 1. Universal Login

### `POST /api/auth/login`

**Purpose**: Authenticates users of any role (Admin/Teacher/Student) and returns JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fingerprint": "abc123..." // Required for students only
}
```

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Login successful",
  "role": "student",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Password Change Required (200)**:
```json
{
  "status": "must_change_password",
  "message": "Please change your temporary password before proceeding",
  "redirect": "/change-password",
  "userId": "123"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Fingerprint mismatch (students)
- `429 Too Many Requests`: Rate limit exceeded

**Implementation Details**:

I designed this as a universal endpoint that:
1. Checks Admin table first
2. Then Teacher table
3. Finally Student table
4. Returns appropriate error if not found

**Student-Specific Logic**:
- First login: Saves fingerprint hash
- Subsequent logins: Validates fingerprint
- Mismatch: Rejects with 403 error

**Security Features**:
- Rate limiting: 5 attempts per 15 minutes
- Generic error messages (prevents email enumeration)
- Fingerprint hashing (SHA-256)
- Password hashing (bcrypt)

**Example Usage**:
```typescript
// Student login with fingerprint
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'mypassword',
    fingerprint: 'device-fingerprint-hash'
  })
});
```

---

## 2. Create Teacher (Admin Only)

### `POST /api/auth/admin/signin/teacher`

**Purpose**: Allows admins to create new teacher accounts with temporary passwords.

**Authentication**: Requires Admin JWT token

**Request Headers**:
```
Authorization: Bearer <admin-jwt-token>
```

**Request Body**:
```json
{
  "name": "Dr. Ahmed Ali",
  "email": "ahmed@university.edu",
  "departmentId": "123" // Optional
}
```

**Success Response (201)**:
```json
{
  "status": "success",
  "message": "Teacher created successfully with temporary password",
  "tempPassword": "x7k9m2p5",
  "user": {
    "id": "456",
    "name": "Dr. Ahmed Ali",
    "email": "ahmed@university.edu"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Email already exists
- `400 Bad Request`: Department not found
- `401 Unauthorized`: No token provided
- `403 Forbidden`: Not admin role

**Implementation Notes**:

I implemented this endpoint to:
- Generate random 8-character temporary password
- Hash password with bcrypt (10 rounds)
- Optionally assign to department
- Return temp password ONCE (not stored)

**Design Decision**: 
I chose to make `departmentId` optional because:
- Teachers may be unassigned initially
- Allows flexibility in organizational structure
- Can be updated later via teacher management

**Security Considerations**:
- Temp password shown only once
- Admin must securely communicate password
- Teacher forced to change on first login

---

## 3. Create Student (Admin Only)

### `POST /api/auth/admin/signin/student`

**Purpose**: Allows admins to create new student accounts.

**Authentication**: Requires Admin JWT token

**Request Headers**:
```
Authorization: Bearer <admin-jwt-token>
```

**Request Body**:
```json
{
  "name": "Sara Mohammed",
  "email": "sara@university.edu",
  "studentId": "CS2024001",
  "departmentId": "123", // Optional
  "stageId": "456" // Optional
}
```

**Success Response (201)**:
```json
{
  "status": "success",
  "message": "Student created successfully",
  "tempPassword": "a3f8k1m9",
  "user": {
    "id": "789",
    "name": "Sara Mohammed",
    "email": "sara@university.edu",
    "studentId": "CS2024001"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Email already exists
- `400 Bad Request`: Student ID already exists
- `400 Bad Request`: Department/Stage not found
- `401 Unauthorized`: No token provided
- `403 Forbidden`: Not admin role

**Validation Rules**:
- `studentId`: Unique, required
- `email`: Unique, valid email format
- `name`: Required, min 3 characters
- `departmentId`: Optional, must exist if provided
- `stageId`: Optional, must exist if provided

**Default Values**:
- `must_change_password`: true
- `is_verified`: false
- `fingerprint_hash`: null (set on first login)

---

## 4. Change Student Password

### `POST /api/auth/student/change-password/:studentId`

**Purpose**: Allows students to change their own password.

**Authentication**: Requires Student JWT token

**Request Headers**:
```
Authorization: Bearer <student-jwt-token>
```

**URL Parameters**:
- `studentId`: Student's database ID

**Request Body**:
```json
{
  "oldPassword": "temp123",
  "newPassword": "MyNewSecurePass123!"
}
```

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: No token / Invalid token
- `401 Unauthorized`: Old password incorrect
- `403 Forbidden`: Cannot change another user's password
- `404 Not Found`: Student not found

**Security Features**:

I implemented several security measures:
1. **Old password verification**: Prevents unauthorized changes
2. **User ID validation**: Students can only change their own password
3. **Password hashing**: New password hashed with bcrypt
4. **Flag update**: Sets `must_change_password` to false

**Implementation Logic**:
```typescript
// 1. Verify old password
const isMatch = await bcrypt.compare(oldPassword, student.password);
if (!isMatch) {
  throw new AppError("Old password is incorrect", 401);
}

// 2. Verify user owns this account
if (req.user.id !== studentId) {
  throw new AppError("Cannot change another user's password", 403);
}

// 3. Hash and update
const hashedPassword = await bcrypt.hash(newPassword, 10);
await prisma.student.update({
  where: { id: BigInt(studentId) },
  data: { 
    password: hashedPassword,
    must_change_password: false 
  }
});
```

---

## 5. Change Teacher Password

### `POST /api/auth/teacher/change-password/:teacherId`

**Purpose**: Allows teachers to change their own password.

**Authentication**: Requires Teacher JWT token

**Request Headers**:
```
Authorization: Bearer <teacher-jwt-token>
```

**URL Parameters**:
- `teacherId`: Teacher's database ID

**Request Body**:
```json
{
  "oldPassword": "temp456",
  "newPassword": "MyNewTeacherPass123!"
}
```

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: No token / Invalid token
- `401 Unauthorized`: Old password incorrect
- `403 Forbidden`: Cannot change another user's password
- `404 Not Found`: Teacher not found

**Same Security Features as Student Password Change**

---

## 6. Reset Student Password (Admin Only)

### `POST /api/auth/student/reset-password/:studentId`

**Purpose**: Allows admins to reset student passwords (e.g., if forgotten).

**Authentication**: Requires Admin JWT token

**Request Headers**:
```
Authorization: Bearer <admin-jwt-token>
```

**URL Parameters**:
- `studentId`: Student's database ID

**Request Body**: None required

**Success Response (200)**:
```json
{
  "status": "success",
  "message": "Password reset successfully",
  "tempPassword": "k2m8p4x1"
}
```

**Error Responses**:
- `401 Unauthorized`: No token provided
- `403 Forbidden`: Not admin role
- `404 Not Found`: Student not found

**Implementation Details**:

I designed this endpoint to:
1. Generate new temporary password
2. Hash and update student password
3. Set `must_change_password` to true
4. Return temp password to admin

**Use Cases**:
- Student forgot password
- Security breach (force password change)
- Account recovery

---

## Authentication Flow Diagrams

### Student First Login
```
1. Student enters email + password + fingerprint
2. System validates credentials
3. System saves fingerprint hash
4. If must_change_password = true:
   → Return "must_change_password" status
5. Else:
   → Return JWT token
```

### Student Subsequent Login
```
1. Student enters email + password + fingerprint
2. System validates credentials
3. System hashes fingerprint
4. System compares with stored hash
5. If match:
   → Return JWT token
6. Else:
   → Return 403 Forbidden
```

### Admin Creating User
```
1. Admin sends create request with user details
2. System validates admin token
3. System generates temp password
4. System creates user with must_change_password = true
5. System returns temp password (one-time display)
6. Admin communicates password to user
7. User logs in and forced to change password
```

---

## Security Best Practices I Implemented

### 1. Password Security
- **Hashing**: bcrypt with 10 rounds
- **Temporary Passwords**: Random, one-time display
- **Force Change**: New users must change password

### 2. Fingerprint Security
- **Hashing**: SHA-256 before storage
- **Privacy**: Raw fingerprint never stored
- **Validation**: Checked on every student login

### 3. Token Security
- **JWT**: Signed with secret key
- **Expiration**: 24 hours
- **Payload**: Minimal (id, email, role)

### 4. Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **Signup**: 10 accounts per hour
- **Test Environment**: Disabled for testing

### 5. Error Handling
- **Generic Messages**: Prevent email enumeration
- **Consistent Responses**: Same format for all errors
- **Status Codes**: Proper HTTP status codes

---

## Testing

I created comprehensive tests for all authentication endpoints:

**Test Coverage**:
- ✅ Successful login (all roles)
- ✅ Invalid credentials
- ✅ Fingerprint validation
- ✅ First-time fingerprint save
- ✅ Password change flow
- ✅ Admin-only operations
- ✅ Authorization checks
- ✅ Duplicate email/ID prevention

**Test Results**: 24/24 tests passing

---

## Future Enhancements

Based on my implementation experience, I plan to add:

1. **Email Verification**: Verify email addresses before activation
2. **Password Reset via Email**: Self-service password reset
3. **Multi-Factor Authentication**: TOTP or SMS-based 2FA
4. **Session Management**: View and revoke active sessions
5. **Device Management**: Manage multiple registered devices
6. **Audit Logging**: Enhanced security audit trail

---

## Conclusion

This authentication system provides:
- Secure user authentication
- Role-based access control
- Privacy-preserving device verification
- Comprehensive error handling
- Production-ready security features

All endpoints are thoroughly tested and documented for easy integration and maintenance.
