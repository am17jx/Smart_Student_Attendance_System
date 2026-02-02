# Jest & Supertest - Complete Learning Guide for Junior Developers

**Author**: Ameer Ahmed  
**Level**: Junior → Intermediate  
**Duration**: 2-3 weeks  
**Last Updated**: January 19, 2026

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Hands-On Tutorial](#hands-on-tutorial)
4. [Best Practices](#best-practices)
5. [Learning Resources](#learning-resources)
6. [Practice Challenges](#practice-challenges)
7. [Quiz & Assessment](#quiz--assessment)

---

## 🎯 Introduction

### What is Testing?

Testing is writing code to verify that your application code works correctly. Think of it like this:
- **Your App Code**: The car you built
- **Test Code**: The safety inspector checking if the car works

### Why Test?

1. **Catch Bugs Early**: Find problems before users do
2. **Confidence**: Change code without fear of breaking things
3. **Documentation**: Tests show how your code should work
4. **Better Design**: Writing testable code = writing better code

### What You'll Learn

- ✅ Write unit tests with Jest
- ✅ Test HTTP endpoints with Supertest
- ✅ Mock databases and external services
- ✅ Achieve high test coverage
- ✅ Debug failing tests
- ✅ Write maintainable test code

---

## 🧠 Core Concepts

### 1. Jest Basics

**Jest** is a JavaScript testing framework. It provides:
- Test runner (runs your tests)
- Assertion library (checks if things are correct)
- Mocking capabilities (fake external dependencies)

#### Key Jest Functions

```typescript
// describe: Groups related tests
describe('Calculator', () => {
  
  // test/it: Individual test case
  test('adds 1 + 2 to equal 3', () => {
    
    // expect: Make an assertion
    expect(1 + 2).toBe(3);
  });
  
  it('subtracts 5 - 2 to equal 3', () => {
    expect(5 - 2).toBe(3);
  });
});
```

#### Common Matchers

```typescript
// Equality
expect(value).toBe(3);           // Strict equality (===)
expect(value).toEqual({a: 1});   // Deep equality (for objects)

// Truthiness
expect(value).toBeTruthy();      // Truthy value
expect(value).toBeFalsy();       // Falsy value
expect(value).toBeNull();        // Null
expect(value).toBeUndefined();   // Undefined

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThan(5);
expect(value).toBeCloseTo(0.3);  // For floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({a: 1});

// Exceptions
expect(() => fn()).toThrow();
expect(() => fn()).toThrow('error message');
```

### 2. Supertest Basics

**Supertest** tests HTTP endpoints. It simulates HTTP requests to your API.

```typescript
import request from 'supertest';
import app from './app';

test('GET /api/users returns 200', async () => {
  const response = await request(app)
    .get('/api/users')
    .expect(200);
    
  expect(response.body).toHaveProperty('users');
});
```

#### HTTP Methods

```typescript
// GET request
await request(app).get('/api/users');

// POST request with body
await request(app)
  .post('/api/users')
  .send({ name: 'John', email: 'john@example.com' });

// PUT request
await request(app)
  .put('/api/users/123')
  .send({ name: 'Updated Name' });

// DELETE request
await request(app).delete('/api/users/123');

// Set headers
await request(app)
  .get('/api/users')
  .set('Authorization', 'Bearer token123');

// Expect status code
await request(app).get('/api/users').expect(200);

// Expect header
await request(app)
  .get('/api/users')
  .expect('Content-Type', /json/);
```

### 3. Test Structure (AAA Pattern)

Every good test follows the **Arrange-Act-Assert** pattern:

```typescript
test('creates a new user', async () => {
  // 1. ARRANGE: Set up test data
  const userData = {
    name: 'Test User',
    email: 'test@example.com'
  };
  
  // 2. ACT: Perform the action
  const response = await request(app)
    .post('/api/users')
    .send(userData);
  
  // 3. ASSERT: Check the results
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  expect(response.body.name).toBe(userData.name);
});
```

---

## 🛠️ Hands-On Tutorial

### Level 1: Your First Test

Let's write a simple test for a utility function:

```typescript
// utils/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}
```

```typescript
// tests/utils/math.test.ts
import { add, multiply } from '../../utils/math';

describe('Math Utilities', () => {
  describe('add', () => {
    test('adds two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
    
    describe('add,()=>{
    test('test this function for testing purpose',()=>{
     expect(add(2,3).toBe(5)) 
    }) 
    })
    



    test('adds negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });
    
    test('adds zero', () => {
      expect(add(5, 0)).toBe(5);
    });
  });
  
  describe('multiply', () => {
    test('multiplies two numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });
    
    test('multiplies by zero', () => {
      expect(multiply(5, 0)).toBe(0);
    });
  });
});
```

**Run it**: `npm test math.test.ts`

---

### Level 2: Testing API Endpoints

Let's test a simple GET endpoint:

```typescript
// tests/api/departments.test.ts
import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Department API', () => {
  // Clean up before each test
  beforeEach(async () => {
    await prisma.department.deleteMany();
  });
  
  // Disconnect after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  describe('GET /api/departments', () => {
    test('returns empty array when no departments', async () => {
      const response = await request(app)
        .get('/api/departments')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });
    
    test('returns all departments', async () => {
      // Arrange: Create test data
      await prisma.department.create({
        data: { name: 'Computer Science' }
      });
      await prisma.department.create({
        data: { name: 'Mathematics' }
      });
      
      // Act: Make request
      const response = await request(app)
        .get('/api/departments')
        .expect(200);
      
      // Assert: Check response
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
    });
  });
});
```

---

### Level 3: Testing with Authentication

```typescript
describe('Protected Endpoints', () => {
  let adminToken: string;
  
  beforeAll(async () => {
    // Create admin and get token
    const admin = await prisma.admin.create({
      data: {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: await bcrypt.hash('password', 10)
      }
    });
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password'
      });
    
    adminToken = loginResponse.body.token;
  });
  
  test('creates department with valid token', async () => {
    const response = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Department' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
  
  test('rejects request without token', async () => {
    await request(app)
      .post('/api/departments')
      .send({ name: 'New Department' })
      .expect(401);
  });
});
```

---

### Level 4: Testing Error Cases

```typescript
describe('Error Handling', () => {
  test('returns 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' }) // Empty name
      .expect(400);
    
    expect(response.body).toHaveProperty('status', 'fail');
    expect(response.body).toHaveProperty('message');
  });
  
  test('returns 404 for non-existent department', async () => {
    await request(app)
      .get('/api/departments/999999')
      .expect(404);
  });
  
  test('returns 409 for duplicate department', async () => {
    // Create first department
    await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Computer Science' });
    
    // Try to create duplicate
    const response = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Computer Science' })
      .expect(409);
    
    expect(response.body.message).toContain('already exists');
  });
});
```

---

## ✅ Best Practices

### 1. Test Organization

```
tests/
├── unit/              # Unit tests (pure functions)
│   └── utils/
├── integration/       # Integration tests (API endpoints)
│   ├── auth/
│   ├── departments/
│   └── students/
└── helpers/          # Test utilities
    └── testHelpers.ts
```

### 2. Use Helper Functions

```typescript
// tests/helpers/testHelpers.ts
export async function createTestAdmin() {
  return await prisma.admin.create({
    data: {
      name: 'Test Admin',
      email: `admin-${Date.now()}@test.com`,
      password: await bcrypt.hash('password', 10)
    }
  });
}

export async function getAdminToken(email: string, password: string) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
}
```

### 3. Clean Up After Tests

```typescript
beforeEach(async () => {
  // Clean database before each test
  await prisma.department.deleteMany();
});

afterAll(async () => {
  // Disconnect after all tests
  await prisma.$disconnect();
});
```

### 4. Test Names Should Be Descriptive

```typescript
// ❌ Bad
test('test 1', () => {});

// ✅ Good
test('creates department with valid admin token', () => {});
test('returns 401 when token is missing', () => {});
test('returns 400 when department name is empty', () => {});
```

### 5. One Assertion Per Test (When Possible)

```typescript
// ❌ Testing too many things
test('department CRUD', async () => {
  // Create
  const created = await request(app).post('/api/departments')...
  // Update
  const updated = await request(app).put(`/api/departments/${created.id}`)...
  // Delete
  await request(app).delete(`/api/departments/${created.id}`)...
});

// ✅ Separate tests
test('creates department', async () => { ... });
test('updates department', async () => { ... });
test('deletes department', async () => { ... });
```

---

## 📖 Learning Resources

### Official Documentation
1. **Jest**: https://jestjs.io/docs/getting-started
2. **Supertest**: https://github.com/ladjs/supertest#readme
3. **Testing Library**: https://testing-library.com/

### Video Tutorials (Arabic)
1. **Traversy Media - Jest Crash Course**: https://www.youtube.com/watch?v=7r4xVDI2vho
2. **The Net Ninja - Jest Testing**: https://www.youtube.com/playlist?list=PL4cUxeGkcC9gm4_-5UsNmLqMosM-dzuvQ

### Articles & Guides
1. **Jest Cheat Sheet**: https://github.com/sapegin/jest-cheat-sheet
2. **Testing Best Practices**: https://github.com/goldbergyoni/javascript-testing-best-practices
3. **Supertest Examples**: https://www.albertgao.xyz/2017/05/24/how-to-test-expressjs-with-jest-and-supertest/

### Books
1. **"Testing JavaScript Applications"** by Lucas da Costa
2. **"JavaScript Testing Best Practices"** (Free GitHub repo)

---

## 🎮 Practice Challenges

### Challenge 1: Basic Test (Beginner)

**Task**: Write tests for this function:

```typescript
// utils/validators.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Requirements**:
- Test with valid email
- Test with invalid email (no @)
- Test with invalid email (no domain)
- Test with empty string

<details>
<summary>💡 Solution</summary>

```typescript
import { isValidEmail } from '../../utils/validators';

describe('isValidEmail', () => {
  test('returns true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });
  
  test('returns false for email without @', () => {
    expect(isValidEmail('testexample.com')).toBe(false);
  });
  
  test('returns false for email without domain', () => {
    expect(isValidEmail('test@')).toBe(false);
  });
  
  test('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});
```
</details>

---

### Challenge 2: API Test (Intermediate)

**Task**: Write tests for GET /api/stages endpoint

**Requirements**:
- Test successful retrieval of all stages
- Test empty array when no stages exist
- Test that each stage has required fields (id, name, level)
- Test sorting by level

<details>
<summary>💡 Hint</summary>

1. Create test stages in beforeEach
2. Use .toHaveLength() matcher
3. Use .toHaveProperty() for field checks
4. Check array order for sorting
</details>

---

### Challenge 3: Authentication Test (Advanced)

**Task**: Write comprehensive tests for POST /api/auth/login

**Requirements**:
- Test successful login with correct credentials
- Test failed login with wrong password
- Test failed login with non-existent email
- Test that response includes token
- Test that token is valid JWT
- Test rate limiting (after 5 failed attempts)

<details>
<summary>💡 Hint</summary>

1. Create test user in beforeAll
2. Use jwt.verify() to validate token
3. Make 6 requests to test rate limiting
4. Check for 429 status code
</details>

---

## 📝 Quiz & Assessment

### Quiz 1: Jest Basics

**Q1**: What's the difference between `toBe()` and `toEqual()`?

<details>
<summary>Answer</summary>

- `toBe()`: Strict equality (===), for primitives
- `toEqual()`: Deep equality, for objects/arrays
</details>

**Q2**: What does `beforeEach()` do?

<details>
<summary>Answer</summary>

Runs before each test in the describe block. Used for setup/cleanup.
</details>

**Q3**: How do you test async functions?

<details>
<summary>Answer</summary>

```typescript
test('async test', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```
</details>

---

### Quiz 2: Supertest

**Q1**: How do you send JSON data in a POST request?

<details>
<summary>Answer</summary>

```typescript
await request(app)
  .post('/api/endpoint')
  .send({ key: 'value' });
```
</details>

**Q2**: How do you set authorization header?

<details>
<summary>Answer</summary>

```typescript
await request(app)
  .get('/api/endpoint')
  .set('Authorization', 'Bearer token');
```
</details>

---

## 🎯 Your Learning Path

### Week 1: Foundations
- [ ] Read Jest documentation (Getting Started)
- [ ] Complete Challenge 1
- [ ] Write 5 unit tests for utility functions
- [ ] Watch Jest crash course video

### Week 2: API Testing
- [ ] Read Supertest documentation
- [ ] Complete Challenge 2
- [ ] Write tests for all Department endpoints
- [ ] Achieve 80%+ coverage on one controller

### Week 3: Advanced
- [ ] Complete Challenge 3
- [ ] Write tests for authentication flow
- [ ] Learn mocking with Jest
- [ ] Write integration tests

---

## 🏆 Success Criteria

You've mastered testing when you can:

- ✅ Write tests without looking at examples
- ✅ Debug failing tests quickly
- ✅ Achieve 80%+ code coverage
- ✅ Write tests before code (TDD)
- ✅ Mock external dependencies
- ✅ Test edge cases and errors

---

## 💪 Next Steps

1. **Practice Daily**: Write at least 3 tests every day
2. **Read Others' Tests**: Study test code in popular repos
3. **TDD**: Try writing tests before code
4. **Refactor**: Improve existing tests
5. **Share**: Teach someone else what you learned

---

**Remember**: Testing is a skill that improves with practice. Don't get discouraged by failing tests - they're teaching you! 🚀

**Questions?** Review this guide, try the challenges, and keep practicing!
