# Complete API Reference

**Project**: Privacy-Preserving Student Attendance System  
**Base URL**: `/api`  
**Author**: [Your Name]  
**Date**: January 2026  
**Version**: 1.0

---

## API Overview

I designed a RESTful API with 15+ endpoints organized into 7 main categories. All endpoints follow consistent patterns for requests, responses, and error handling.

---

## Base URL Structure

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
Testing: http://localhost:3001/api
```

---

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response (4xx - Client Error)
```json
{
  "status": "fail",
  "message": "Invalid input or unauthorized"
}
```

### Error Response (5xx - Server Error)
```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Complete Endpoint List

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/login` | Universal login | None |
| POST | `/admin/signin/teacher` | Create teacher | Admin |
| POST | `/admin/signin/student` | Create student | Admin |
| POST | `/student/change-password/:id` | Change student password | Student |
| POST | `/teacher/change-password/:id` | Change teacher password | Teacher |
| POST | `/student/reset-password/:id` | Reset student password | Admin |

**Documentation**: [Authentication API](./01-authentication-api.md)

---

### 🏢 Department Management (`/api/departments`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all departments | Any |
| GET | `/:id` | Get department by ID | Any |
| POST | `/` | Create department | Admin |
| PUT | `/:id` | Update department | Admin |
| DELETE | `/:id` | Delete department | Admin |

**Implementation**: `controllers/DepartmentController.ts`

**Example Request** (Create Department):
```json
POST /api/departments
{
  "name": "Computer Science"
}
```

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "id": "123",
    "name": "Computer Science",
    "created_at": "2026-01-18T00:00:00.000Z"
  }
}
```

---

### 📚 Stage Management (`/api/stages`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all stages | Any |
| GET | `/:id` | Get stage by ID | Any |
| POST | `/` | Create stage | Admin |
| PUT | `/:id` | Update stage | Admin |
| DELETE | `/:id` | Delete stage | Admin |

**Implementation**: `controllers/StageController.ts`

**Example Request** (Create Stage):
```json
POST /api/stages
{
  "name": "First Year",
  "level": 1
}
```

---

### 👨‍🏫 Teacher Management (`/api/teachers`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all teachers | Admin |
| GET | `/:id` | Get teacher by ID | Admin/Teacher |
| PUT | `/:id` | Update teacher | Admin/Teacher |
| DELETE | `/:id` | Delete teacher | Admin |

**Implementation**: `controllers/TeacherController.ts`

**Example Request** (Update Teacher):
```json
PUT /api/teachers/123
{
  "name": "Dr. Ahmed Ali Updated",
  "departmentId": "456"
}
```

---

### 👨‍🎓 Student Management (`/api/students`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all students | Admin/Teacher |
| GET | `/:id` | Get student by ID | Admin/Teacher/Student |
| PUT | `/:id` | Update student | Admin/Student |
| DELETE | `/:id` | Delete student | Admin |

**Note**: Students can only view/update their own data

---

### 📖 Material Management (`/api/materials`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all materials | Any |
| GET | `/:id` | Get material by ID | Any |
| POST | `/` | Create material | Admin |
| PUT | `/:id` | Update material | Admin |
| DELETE | `/:id` | Delete material | Admin |

**Implementation**: `controllers/MaterialController.ts`

**Example Request** (Create Material):
```json
POST /api/materials
{
  "name": "Data Structures",
  "departmentId": "123",
  "stageId": "456"
}
```

---

### 📍 Geofence Management (`/api/geofences`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all geofences | Admin/Teacher |
| GET | `/:id` | Get geofence by ID | Admin/Teacher |
| POST | `/` | Create geofence | Admin |
| PUT | `/:id` | Update geofence | Admin |
| DELETE | `/:id` | Delete geofence | Admin |

**Implementation**: `controllers/GeofenceController.ts`

**Example Request** (Create Geofence):
```json
POST /api/geofences
{
  "name": "Building A - Room 101",
  "latitude": 33.3152,
  "longitude": 44.3661,
  "radius_meters": 50
}
```

---

### 🎓 Session Management (`/api/sessions`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all sessions | Teacher |
| GET | `/:id` | Get session by ID | Teacher |
| POST | `/` | Create session | Teacher |
| PUT | `/:id` | Update session | Teacher |
| DELETE | `/:id` | Delete session | Teacher |
| POST | `/:id/close` | Close session | Teacher |

**Implementation**: `controllers/SessionController.ts`

**Example Request** (Create Session):
```json
POST /api/sessions
{
  "materialId": "123",
  "geofenceId": "456",
  "duration": 120 // minutes
}
```

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "id": "789",
    "session_date": "2026-01-18T10:00:00.000Z",
    "qr_secret": "encrypted-secret",
    "is_active": true,
    "expires_at": "2026-01-18T12:00:00.000Z"
  }
}
```

---

### 📱 QR Code Management (`/api/qrcode`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/generate` | Generate QR code | Teacher |
| POST | `/validate` | Validate QR code | Student |
| GET | `/session/:sessionId` | Get session QR codes | Teacher |

**Implementation**: `controllers/QrcodeController.ts`

**Example Request** (Generate QR):
```json
POST /api/qrcode/generate
{
  "sessionId": "123"
}
```

**Example Response**:
```json
{
  "status": "success",
  "data": {
    "token": "encrypted-qr-token",
    "qrCodeImage": "data:image/png;base64,...",
    "expires_at": "2026-01-18T10:05:00.000Z"
  }
}
```

**Example Request** (Validate QR):
```json
POST /api/qrcode/validate
{
  "token": "encrypted-qr-token",
  "latitude": 33.3152,
  "longitude": 44.3661
}
```

---

### ✅ Attendance Management (`/api/attendance`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/mark` | Mark attendance | Student |
| GET | `/session/:sessionId` | Get session attendance | Teacher |
| GET | `/student/:studentId` | Get student attendance | Student/Teacher |
| GET | `/report` | Generate attendance report | Admin/Teacher |

**Implementation**: `controllers/AttendanceController.ts`

**Example Request** (Mark Attendance):
```json
POST /api/attendance/mark
{
  "sessionId": "123",
  "qrToken": "encrypted-token",
  "latitude": 33.3152,
  "longitude": 44.3661
}
```

**Example Response**:
```json
{
  "status": "success",
  "message": "Attendance marked successfully",
  "data": {
    "attendanceId": "456",
    "sessionId": "123",
    "studentId": "789",
    "marked_at": "2026-01-18T10:15:00.000Z",
    "marked_by": "qr_scan"
  }
}
```

---

## HTTP Status Codes

I use standard HTTP status codes consistently across all endpoints:

### Success Codes
- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST (resource created)

### Client Error Codes
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error`: Unexpected server error

---

## Rate Limiting

I implemented rate limiting on sensitive endpoints:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Login | 5 requests | 15 minutes |
| Signup | 10 requests | 1 hour |
| General API | 100 requests | 15 minutes |

**Note**: Rate limiting is disabled in test environment (`NODE_ENV=test`)

---

## Pagination

For endpoints returning lists, I support pagination:

**Query Parameters**:
```
?page=1&limit=20
```

**Response Format**:
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Filtering & Sorting

### Filtering
```
GET /api/students?departmentId=123&stageId=456
```

### Sorting
```
GET /api/students?sortBy=name&order=asc
```

---

## Error Codes Reference

| Code | Message | Description |
|------|---------|-------------|
| AUTH_001 | Invalid credentials | Email or password incorrect |
| AUTH_002 | Token expired | JWT token has expired |
| AUTH_003 | Fingerprint mismatch | Device fingerprint doesn't match |
| AUTH_004 | Must change password | Temporary password must be changed |
| VALID_001 | Validation failed | Input validation error |
| VALID_002 | Duplicate entry | Unique constraint violation |
| PERM_001 | Insufficient permissions | User lacks required role |
| RES_001 | Resource not found | Requested resource doesn't exist |
| GEO_001 | Location mismatch | Outside geofence boundary |
| QR_001 | Invalid QR code | QR code invalid or expired |
| QR_002 | QR code already used | Token already consumed |

---

## Testing

All endpoints are covered by automated tests:

**Test Coverage**:
- Authentication: 24 tests
- CRUD Operations: 40+ tests
- Authorization: 15+ tests
- Error Handling: 20+ tests

**Total**: 100+ comprehensive test cases

---

## API Versioning

Current version: `v1`

Future versions will use URL versioning:
```
/api/v1/auth/login
/api/v2/auth/login
```

---

## Security Features

### 1. Authentication
- JWT tokens with 24-hour expiration
- Bcrypt password hashing (10 rounds)
- SHA-256 fingerprint hashing

### 2. Authorization
- Role-based access control (RBAC)
- Resource ownership validation
- Middleware-based permission checks

### 3. Input Validation
- Request body validation
- SQL injection prevention (Prisma ORM)
- XSS protection (sanitization)

### 4. Rate Limiting
- IP-based rate limiting
- Endpoint-specific limits
- Configurable thresholds

### 5. Audit Logging
- Failed attempt tracking
- Security event logging
- User action history

---

## Development Tools

### Postman Collection
I created a Postman collection with all endpoints for easy testing.

### API Documentation
- Swagger/OpenAPI (planned)
- This markdown documentation
- Inline code comments

---

## Future Enhancements

1. **GraphQL API**: Alternative to REST
2. **WebSocket Support**: Real-time updates
3. **API Versioning**: v2 with breaking changes
4. **Enhanced Filtering**: Complex query support
5. **Batch Operations**: Bulk create/update/delete

---

## Conclusion

This API provides:
- ✅ Complete CRUD operations for all entities
- ✅ Secure authentication and authorization
- ✅ Privacy-preserving features
- ✅ Comprehensive error handling
- ✅ Production-ready performance
- ✅ Extensive test coverage

All endpoints are documented, tested, and ready for integration.
