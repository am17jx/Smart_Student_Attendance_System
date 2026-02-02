# Stage API Documentation

**Last Updated**: January 20, 2026  
**Author**: Ameer Ahmed  
**Version**: 1.0

---

## Overview

The Stage API provides endpoints for managing academic stages/years in the attendance system. Stages represent different academic levels (e.g., First Year, Second Year) and are used to organize students and materials.

**Base URL**: `/api/stages`

**Authentication**: All endpoints require admin authentication

---

## Endpoints

### 1. Get All Stages

Retrieves all stages sorted by level.

**Endpoint**: `GET /api/stages`

**Authentication**: Required (Admin only)

**Request Headers**:
```http
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "stages": [
      {
        "id": "1",
        "name": "First Year",
        "level": 1,
        "created_at": "2026-01-20T10:00:00.000Z",
        "updated_at": "2026-01-20T10:00:00.000Z"
      },
      {
        "id": "2",
        "name": "Second Year",
        "level": 2,
        "created_at": "2026-01-20T10:00:00.000Z",
        "updated_at": "2026-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

**Features**:
- Returns empty array if no stages exist
- Automatically sorted by level (ascending)
- BigInt IDs converted to strings

---

### 2. Create Stage

Creates a new academic stage.

**Endpoint**: `POST /api/stages`

**Authentication**: Required (Admin only)

**Request Headers**:
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "First Year",
  "level": 1
}
```

**Validation Rules**:
- `name`: Required, non-empty string
- `level`: Required, must be a number
- Combination of name and level must be unique

**Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "stage": {
      "id": "1",
      "name": "First Year",
      "level": 1,
      "created_at": "2026-01-20T10:00:00.000Z",
      "updated_at": "2026-01-20T10:00:00.000Z"
    }
  }
}
```

**Error Responses**:

**400 Bad Request** - Empty name:
```json
{
  "status": "fail",
  "message": "Stage name is required"
}
```

**400 Bad Request** - Missing level:
```json
{
  "status": "fail",
  "message": "Stage level is required and must be a number"
}
```

**400 Bad Request** - Invalid level type:
```json
{
  "status": "fail",
  "message": "Stage level is required and must be a number"
}
```

**400 Bad Request** - Duplicate:
```json
{
  "status": "fail",
  "message": "Stage with this name and level already exists"
}
```

**Note**: You can have the same name with different levels (e.g., "Computer Science - Level 1" and "Computer Science - Level 2")

---

### 3. Update Stage

Updates an existing stage.

**Endpoint**: `PUT /api/stages/:id`

**Authentication**: Required (Admin only)

**URL Parameters**:
- `id`: Stage ID (BigInt as string)

**Request Headers**:
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Updated Name",
  "level": 2
}
```

**Validation Rules**:
- `name`: Required, non-empty string
- `level`: Optional, must be a number if provided
- Stage must exist

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "stage": {
      "id": "1",
      "name": "Updated Name",
      "level": 2,
      "created_at": "2026-01-20T10:00:00.000Z",
      "updated_at": "2026-01-20T10:05:00.000Z"
    }
  }
}
```

**Partial Update**:
You can update only the name without changing the level:
```json
{
  "name": "New Name Only"
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "status": "fail",
  "message": "Stage not found"
}
```

**400 Bad Request** - Empty name:
```json
{
  "status": "fail",
  "message": "Stage name is required"
}
```

**400 Bad Request** - Invalid level:
```json
{
  "status": "fail",
  "message": "Stage level must be a number"
}
```

---

### 4. Delete Stage

Deletes a stage from the system.

**Endpoint**: `DELETE /api/stages/:id`

**Authentication**: Required (Admin only)

**URL Parameters**:
- `id`: Stage ID (BigInt as string)

**Request Headers**:
```http
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "status": "success",
  "data": {
    "stage": {
      "id": "1",
      "name": "First Year",
      "level": 1,
      "created_at": "2026-01-20T10:00:00.000Z",
      "updated_at": "2026-01-20T10:00:00.000Z"
    }
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "status": "fail",
  "message": "Stage not found"
}
```

**Warning**: Deleting a stage may affect related students and materials. Ensure proper cascade handling or prevent deletion if stage is in use.

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "status": "fail",
  "message": "You are not logged in! Please log in to get access"
}
```

### 403 Forbidden
```json
{
  "status": "fail",
  "message": "You do not have permission to perform this action"
}
```

### 429 Too Many Requests
```json
{
  "status": "fail",
  "message": "Too many requests from this IP, please try again later"
}
```

---

## Implementation Details

### Controller: `StageController.ts`

**Key Features**:
1. **Validation**:
   - Name cannot be empty
   - Level must be a number
   - Duplicate checking (name + level combination)

2. **Error Handling**:
   - 404 for non-existent stages
   - 400 for validation errors
   - Proper error messages using `AppError`

3. **BigInt Handling**:
   - All IDs converted to strings in responses
   - Proper BigInt conversion in database queries

4. **Sorting**:
   - Stages automatically sorted by level (ascending)

### Routes: `stageRoutes.ts`

**Middleware Stack**:
1. `apiLimiter` - Rate limiting
2. `adminAuthMiddleware` - Admin authentication
3. `validateRequest` - Request validation (POST/PUT only)
4. Controller function

---

## Testing

### Test File: `tests/stages/stages.test.ts`

**Test Coverage**: 25+ test cases

**Test Categories**:

1. **GET /api/stages** (5 tests)
   - Empty array when no stages
   - Returns all stages
   - Correct sorting by level
   - Correct data structure
   - Authentication required

2. **POST /api/stages** (8 tests)
   - Creates with valid data
   - Validates empty name
   - Validates missing name
   - Validates missing level
   - Validates invalid level type
   - Prevents duplicates
   - Allows same name with different level
   - Requires authentication

3. **PUT /api/stages/:id** (6 tests)
   - Updates with valid data
   - Partial update (name only)
   - 404 for non-existent stage
   - Validates empty name
   - Validates invalid level type
   - Requires authentication

4. **DELETE /api/stages/:id** (4 tests)
   - Deletes existing stage
   - 404 for non-existent stage
   - Requires authentication
   - Verifies actual deletion

**Run Tests**:
```bash
npm test stages.test.ts
npm test stages.test.ts -- --coverage
```

---

## Usage Examples

### Example 1: Create Academic Year Structure

```javascript
// Create all academic years
const years = [
  { name: 'First Year', level: 1 },
  { name: 'Second Year', level: 2 },
  { name: 'Third Year', level: 3 },
  { name: 'Fourth Year', level: 4 }
];

for (const year of years) {
  await fetch('http://localhost:3000/api/stages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(year)
  });
}
```

### Example 2: Get All Stages for Dropdown

```javascript
const response = await fetch('http://localhost:3000/api/stages', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const { data } = await response.json();
const stageOptions = data.stages.map(stage => ({
  value: stage.id,
  label: `${stage.name} (Level ${stage.level})`
}));
```

### Example 3: Update Stage Name

```javascript
await fetch(`http://localhost:3000/api/stages/${stageId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Freshman Year'
  })
});
```

---

## Database Schema

```prisma
model Stage {
  id         BigInt   @id @default(autoincrement())
  name       String
  level      Int
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  students   Student[]
  materials  Material[]
  
  @@unique([name, level])
  @@map("stages")
}
```

**Key Points**:
- `name` and `level` combination must be unique
- `level` is used for sorting
- Related to `Student` and `Material` models

---

## Security Considerations

1. **Admin Only**: All endpoints require admin authentication
2. **Rate Limiting**: API limiter applied to prevent abuse
3. **Input Validation**: All inputs sanitized and validated
4. **SQL Injection**: Prisma ORM prevents SQL injection
5. **Error Messages**: Don't expose sensitive information

---

## Future Enhancements

- [ ] Add pagination for large datasets
- [ ] Add search/filter by name or level
- [ ] Add bulk create/update operations
- [ ] Add cascade delete protection
- [ ] Add stage activation/deactivation
- [ ] Add academic year association
- [ ] Add student count per stage

---

## Related Documentation

- [Department API](./02-department-api.md)
- [Material API](./03-material-api.md)
- [Student API](./04-student-api.md)
- [Database Schema](../03-database/schema-documentation.md)

---

**Questions or Issues?** Contact the development team or check the main [API Reference](./endpoint-reference.md).
