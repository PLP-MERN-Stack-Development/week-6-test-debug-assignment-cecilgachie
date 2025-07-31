const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const User = require('../../src/models/User');

describe('User Routes Integration Tests', () => {
  let testUser;

  beforeEach(async () => {
    // Clear users collection
    await User.deleteMany({});

    // Create a test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test User');
      expect(response.body.data[0].email).toBe('test@example.com');
      expect(response.body.data[0]).not.toHaveProperty('password');
    });

    it('should handle pagination', async () => {
      // Create additional users
      for (let i = 1; i <= 15; i++) {
        await User.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'password123'
        });
      }

      const response = await request(app)
        .get('/api/users?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.total).toBe(16);
    });

    it('should return empty array when no users exist', async () => {
      await User.deleteMany({});

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a single user by ID', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newUser.name);
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.role).toBe(newUser.role);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail to create user with duplicate email', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'test@example.com', // Same as testUser
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should fail to create user with invalid email format', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create user with short password', async () => {
      const shortPasswordUser = {
        name: 'Short Password User',
        email: 'short@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(shortPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create user without required fields', async () => {
      const incompleteUser = {
        name: 'Incomplete User'
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/users')
        .send(incompleteUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const updateData = {
        name: 'Updated User',
        email: 'updated@example.com',
        role: 'admin'
      };

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.role).toBe(updateData.role);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/users/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });

    it('should fail to update with duplicate email', async () => {
      // Create another user
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .put(`/api/users/${testUser._id}`)
        .send({ email: 'another@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email is already taken');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete a user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify user is soft deleted (isActive = false)
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/users/stats', () => {
    it('should get user statistics', async () => {
      // Create additional users with different roles
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });

      await User.create({
        name: 'Another User',
        email: 'user2@example.com',
        password: 'password123',
        role: 'user'
      });

      const response = await request(app)
        .get('/api/users/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalUsers).toBe(3);
      expect(response.body.data.stats).toHaveLength(2); // user and admin roles
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock User.find to throw an error
      const originalFind = User.find;
      User.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Server Error');

      // Restore original function
      User.find = originalFind;
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 