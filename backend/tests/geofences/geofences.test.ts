import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Geofence API Tests', () => {
    let adminToken: string;
    let geofenceId: string;

    // Setup: Create admin before all tests
    beforeAll(async () => {
        // Clean database
        await prisma.geofence.deleteMany();
        await prisma.admin.deleteMany();

        // Create admin user
        await prisma.admin.create({
            data: {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: await bcrypt.hash('Admin@123', 10)
            }
        });

        // Login to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@test.com',
                password: 'Admin@123'
            });

        adminToken = loginResponse.body.token;
    });

    // Clean geofences before each test
    beforeEach(async () => {
        await prisma.geofence.deleteMany();
    });

    // Cleanup after all tests
    afterAll(async () => {
        await prisma.geofence.deleteMany();
        await prisma.admin.deleteMany();
        await prisma.$disconnect();
    });

    // ==================== GET /api/geofences ====================
    describe('GET /api/geofences', () => {
        test('returns empty array when no geofences exist', async () => {
            const response = await request(app)
                .get('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.geofences).toEqual([]);
        });

        test('returns all geofences when they exist', async () => {
            // Create test geofences
            await prisma.geofence.create({
                data: {
                    name: 'Main Campus',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: 100
                }
            });
            await prisma.geofence.create({
                data: {
                    name: 'Library',
                    latitude: 33.3160,
                    longitude: 44.3670,
                    radius_meters: 50
                }
            });

            const response = await request(app)
                .get('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.status).toBe('success');
            expect(response.body.data.geofences).toHaveLength(2);
            expect(response.body.data.geofences[0]).toHaveProperty('id');
            expect(response.body.data.geofences[0]).toHaveProperty('name');
            expect(response.body.data.geofences[0]).toHaveProperty('latitude');
            expect(response.body.data.geofences[0]).toHaveProperty('longitude');
            expect(response.body.data.geofences[0]).toHaveProperty('radius_meters');
        });

        test('geofences are sorted alphabetically by name', async () => {
            await prisma.geofence.create({
                data: { name: 'Zebra Building', latitude: 33.3152, longitude: 44.3661, radius_meters: 100 }
            });
            await prisma.geofence.create({
                data: { name: 'Alpha Building', latitude: 33.3160, longitude: 44.3670, radius_meters: 50 }
            });

            const response = await request(app)
                .get('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const geofences = response.body.data.geofences;
            expect(geofences[0].name).toBe('Alpha Building');
            expect(geofences[1].name).toBe('Zebra Building');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/geofences')
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== POST /api/geofences ====================
    describe('POST /api/geofences', () => {
        test('creates geofence with valid data', async () => {
            const geofenceData = {
                name: 'Main Campus',
                latitude: 33.3152,
                longitude: 44.3661,
                radius_meters: 100
            };

            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(geofenceData)
                .expect(201);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.geofence).toHaveProperty('id');
            expect(response.body.data.geofence.name).toBe(geofenceData.name);
            expect(response.body.data.geofence.latitude).toBe(geofenceData.latitude);
            expect(response.body.data.geofence.longitude).toBe(geofenceData.longitude);
            expect(response.body.data.geofence.radius_meters).toBe(geofenceData.radius_meters);

            // Verify in database
            const dbGeofence = await prisma.geofence.findFirst({
                where: { name: geofenceData.name }
            });
            expect(dbGeofence).not.toBeNull();
        });

        test('returns 400 for empty geofence name', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: 100
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('name is required');
        });

        test('returns 400 for missing latitude', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    longitude: 44.3661,
                    radius_meters: 100
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Latitude is required');
        });

        test('returns 400 for missing longitude', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    latitude: 33.3152,
                    radius_meters: 100
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Longitude is required');
        });

        test('returns 400 for missing radius', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    latitude: 33.3152,
                    longitude: 44.3661
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Radius is required');
        });

        test('returns 400 for invalid latitude (> 90)', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    latitude: 95,
                    longitude: 44.3661,
                    radius_meters: 100
                })
                .expect(400);

            expect(response.body.message).toContain('Latitude must be between -90 and 90');
        });

        test('returns 400 for invalid latitude (< -90)', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    latitude: -95,
                    longitude: 44.3661,
                    radius_meters: 100
                })
                .expect(400);

            expect(response.body.message).toContain('Latitude must be between -90 and 90');
        });

        test('returns 400 for invalid longitude (> 180)', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    latitude: 33.3152,
                    longitude: 185,
                    radius_meters: 100
                })
                .expect(400);

            expect(response.body.message).toContain('Longitude must be between -180 and 180');
        });

        test('returns 400 for negative radius', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Geofence',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: -50
                })
                .expect(400);

            expect(response.body.message).toContain('Radius must be a positive number');
        });

        test('returns 400 for duplicate geofence name', async () => {
            // Create first geofence
            await prisma.geofence.create({
                data: {
                    name: 'Main Campus',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: 100
                }
            });

            // Try to create duplicate
            const response = await request(app)
                .post('/api/geofences')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Main Campus',
                    latitude: 33.3160,
                    longitude: 44.3670,
                    radius_meters: 50
                })
                .expect(400);

            expect(response.body.message).toContain('already exists');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/geofences')
                .send({
                    name: 'Test Geofence',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: 100
                })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== PUT /api/geofences/:id ====================
    describe('PUT /api/geofences/:id', () => {
        beforeEach(async () => {
            const geofence = await prisma.geofence.create({
                data: {
                    name: 'Original Name',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: 100
                }
            });
            geofenceId = geofence.id.toString();
        });

        test('updates geofence with valid data', async () => {
            const updatedData = {
                name: 'Updated Name',
                latitude: 33.3160,
                longitude: 44.3670,
                radius_meters: 150
            };

            const response = await request(app)
                .put(`/api/geofences/${geofenceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updatedData)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data.geofence.name).toBe(updatedData.name);
            expect(response.body.data.geofence.latitude).toBe(updatedData.latitude);
            expect(response.body.data.geofence.longitude).toBe(updatedData.longitude);
            expect(response.body.data.geofence.radius_meters).toBe(updatedData.radius_meters);

            // Verify in database
            const dbGeofence = await prisma.geofence.findUnique({
                where: { id: BigInt(geofenceId) }
            });
            expect(dbGeofence?.name).toBe(updatedData.name);
        });

        test('returns 404 for non-existent geofence', async () => {
            const response = await request(app)
                .put('/api/geofences/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated Name',
                    latitude: 33.3160,
                    longitude: 44.3670,
                    radius_meters: 150
                })
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Geofence not found');
        });

        test('returns 400 for empty name', async () => {
            const response = await request(app)
                .put(`/api/geofences/${geofenceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '',
                    latitude: 33.3160,
                    longitude: 44.3670,
                    radius_meters: 150
                })
                .expect(400);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('returns 400 for invalid coordinates', async () => {
            const response = await request(app)
                .put(`/api/geofences/${geofenceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Updated',
                    latitude: 95,
                    longitude: 44.3670,
                    radius_meters: 150
                })
                .expect(400);

            expect(response.body.message).toContain('Latitude must be between -90 and 90');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .put(`/api/geofences/${geofenceId}`)
                .send({
                    name: 'Updated Name',
                    latitude: 33.3160,
                    longitude: 44.3670,
                    radius_meters: 150
                })
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });
    });

    // ==================== DELETE /api/geofences/:id ====================
    describe('DELETE /api/geofences/:id', () => {
        beforeEach(async () => {
            const geofence = await prisma.geofence.create({
                data: {
                    name: 'To Be Deleted',
                    latitude: 33.3152,
                    longitude: 44.3661,
                    radius_meters: 100
                }
            });
            geofenceId = geofence.id.toString();
        });

        test('deletes existing geofence', async () => {
            const response = await request(app)
                .delete(`/api/geofences/${geofenceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('status', 'success');
            expect(response.body.data).toHaveProperty('geofence');

            // Verify deletion
            const dbGeofence = await prisma.geofence.findUnique({
                where: { id: BigInt(geofenceId) }
            });
            expect(dbGeofence).toBeNull();
        });

        test('returns 404 for non-existent geofence', async () => {
            const response = await request(app)
                .delete('/api/geofences/999999')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('status', 'fail');
            expect(response.body.message).toContain('Geofence not found');
        });

        test('returns 401 without authentication token', async () => {
            const response = await request(app)
                .delete(`/api/geofences/${geofenceId}`)
                .expect(401);

            expect(response.body).toHaveProperty('status', 'fail');
        });

        test('verifies geofence is actually deleted from database', async () => {
            // Delete the geofence
            await request(app)
                .delete(`/api/geofences/${geofenceId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            // Verify count is zero
            const count = await prisma.geofence.count();
            expect(count).toBe(0);
        });
    });
});
