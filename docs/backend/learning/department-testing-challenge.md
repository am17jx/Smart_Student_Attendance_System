# 🎯 Your First Testing Challenge!

**Challenge**: Write Complete Tests for Department Routes  
**Difficulty**: Intermediate  
**Time**: 30-45 minutes  
**Your Goal**: Write tests that achieve 90%+ coverage

---

## 📋 What You Need to Test

You created `departmentRoutes.ts` with these endpoints:
- ✅ GET /api/departments (List all)
- ✅ POST /api/departments (Create - Admin only)
- ✅ PUT /api/departments/:id (Update - Admin only)
- ✅ DELETE /api/departments/:id (Delete - Admin only)

---

## 🎓 Step-by-Step Guide

### Step 1: Create Test File

Create: `tests/departments/departments.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Department API Tests', () => {
  let adminToken: string;
  let departmentId: string;

  // TODO: Add your setup code here
  beforeAll(async () => {
    // 1. Clean database
    // 2. Create admin user
    // 3. Login and get token
  });

  afterAll(async () => {
    // Cleanup and disconnect
  });

  beforeEach(async () => {
    // Clean departments before each test
  });

  // TODO: Write your tests here!
});
```

---

### Step 2: Write Tests for GET /api/departments

**Test Cases to Cover**:

1. ✅ Returns empty array when no departments
2. ✅ Returns all departments when they exist
3. ✅ Each department has correct structure (id, name, created_at, updated_at)
4. ✅ Requires authentication (401 without token)

**Example Test**:

```typescript
describe('GET /api/departments', () => {
  test('returns empty array when no departments exist', async () => {
    const response = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  // TODO: Write the other 3 tests!
});
```

---

### Step 3: Write Tests for POST /api/departments

**Test Cases to Cover**:

1. ✅ Creates department with valid data
2. ✅ Returns 400 for empty name
3. ✅ Returns 409 for duplicate department name
4. ✅ Returns 401 without authentication
5. ✅ Returns 403 for non-admin user

**Hints**:
- Check response status code
- Check response body structure
- Verify department was actually created in database
- Test error messages

---

### Step 4: Write Tests for PUT /api/departments/:id

**Test Cases to Cover**:

1. ✅ Updates department with valid data
2. ✅ Returns 404 for non-existent department
3. ✅ Returns 400 for invalid data
4. ✅ Returns 401 without authentication

---

### Step 5: Write Tests for DELETE /api/departments/:id

**Test Cases to Cover**:

1. ✅ Deletes existing department
2. ✅ Returns 404 for non-existent department
3. ✅ Returns 401 without authentication
4. ✅ Verifies department is actually deleted from database

---

## 💡 Helpful Code Snippets

### Creating Admin User

```typescript
const admin = await prisma.admin.create({
  data: {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: await bcrypt.hash('password123', 10)
  }
});
```

### Getting Admin Token

```typescript
const loginResponse = await request(app)
  .post('/api/auth/login')
  .send({
    email: 'admin@test.com',
    password: 'password123'
  });

adminToken = loginResponse.body.token;
```

### Creating Test Department

```typescript
const department = await prisma.department.create({
  data: { name: 'Computer Science' }
});
departmentId = department.id.toString();
```

### Checking Database

```typescript
const dbDepartment = await prisma.department.findUnique({
  where: { id: BigInt(departmentId) }
});
expect(dbDepartment).not.toBeNull();
```

---

## ✅ Checklist

Before you submit, make sure:

- [ ] All tests pass (`npm test departments.test.ts`)
- [ ] You have at least 15 test cases
- [ ] You test both success and failure scenarios
- [ ] You test authentication/authorization
- [ ] You verify database changes
- [ ] Your test names are descriptive
- [ ] You clean up test data properly

---

## 🏆 Bonus Challenges

If you finish early, try these:

1. **Test Pagination**: Add tests for query parameters like `?page=1&limit=10`
2. **Test Sorting**: Add tests for `?sortBy=name&order=asc`
3. **Test Filtering**: Add tests for `?search=computer`
4. **Performance Test**: Ensure endpoint responds in < 200ms
5. **Concurrent Requests**: Test multiple simultaneous requests

---

## 📊 Expected Results

When you run your tests, you should see:

```
PASS  tests/departments/departments.test.ts
  Department API Tests
    GET /api/departments
      ✓ returns empty array when no departments exist (45ms)
      ✓ returns all departments when they exist (52ms)
      ✓ each department has correct structure (38ms)
      ✓ requires authentication (25ms)
    POST /api/departments
      ✓ creates department with valid data (67ms)
      ✓ returns 400 for empty name (32ms)
      ✓ returns 409 for duplicate name (48ms)
      ✓ returns 401 without authentication (22ms)
    PUT /api/departments/:id
      ✓ updates department with valid data (55ms)
      ✓ returns 404 for non-existent department (28ms)
      ✓ returns 400 for invalid data (35ms)
    DELETE /api/departments/:id
      ✓ deletes existing department (42ms)
      ✓ returns 404 for non-existent department (26ms)

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
Time:        2.456s
```

---

## 🆘 Need Help?

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Solution**: Check your import paths

**Issue**: Database errors
**Solution**: Make sure test database is running and migrations are applied

**Issue**: Token is undefined
**Solution**: Check that login is successful in beforeAll

**Issue**: Tests pass individually but fail together
**Solution**: Make sure you're cleaning up data in beforeEach

---

## 📝 Self-Assessment Questions

After completing the challenge, answer these:

1. **What's the difference between `beforeAll` and `beforeEach`?**
2. **Why do we need to clean the database before each test?**
3. **How do you test that a request requires authentication?**
4. **What's the AAA pattern in testing?**
5. **How do you verify that data was actually saved to the database?**

---

## 🎓 Learning Outcomes

By completing this challenge, you will:

- ✅ Understand how to structure API tests
- ✅ Know how to test authentication
- ✅ Learn to test CRUD operations
- ✅ Practice writing descriptive test names
- ✅ Gain confidence in testing

---

## 🚀 Next Steps

After you complete this challenge:

1. Run `npm test -- --coverage` to see your coverage report
2. Try to achieve 90%+ coverage
3. Move on to testing Stage routes
4. Then Material routes
5. Keep practicing!

---

**Remember**: 
- Don't copy-paste solutions
- Understand each line you write
- Test should be readable like documentation
- When stuck, refer to the learning guide!

**Good luck! You got this! 💪**
