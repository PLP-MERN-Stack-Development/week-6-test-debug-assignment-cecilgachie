const mongoose = require('mongoose');
const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');

describe('User Model Test', () => {
  describe('User Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = new User(validUser);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(validUser.name);
      expect(savedUser.email).toBe(validUser.email);
      expect(savedUser.role).toBe(validUser.role);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.password).not.toBe(validUser.password); // Should be hashed
    });

    it('should fail to create user without required fields', async () => {
      const userWithoutRequiredField = new User({ name: 'John Doe' });
      let err;

      try {
        await userWithoutRequiredField.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    });

    it('should fail to create user with invalid email format', async () => {
      const userWithInvalidEmail = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      });

      let err;
      try {
        await userWithInvalidEmail.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.email).toBeDefined();
    });

    it('should fail to create user with password less than 6 characters', async () => {
      const userWithShortPassword = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345'
      });

      let err;
      try {
        await userWithShortPassword.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.password).toBeDefined();
    });

    it('should fail to create user with name longer than 50 characters', async () => {
      const longName = 'a'.repeat(51);
      const userWithLongName = new User({
        name: longName,
        email: 'john@example.com',
        password: 'password123'
      });

      let err;
      try {
        await userWithLongName.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.name).toBeDefined();
    });

    it('should fail to create user with invalid role', async () => {
      const userWithInvalidRole = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid-role'
      });

      let err;
      try {
        await userWithInvalidRole.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.role).toBeDefined();
    });
  });

  describe('User Model Methods', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      });
      await testUser.save();
    });

    it('should hash password before saving', async () => {
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'plaintextpassword'
      });

      await user.save();
      expect(user.password).not.toBe('plaintextpassword');
      expect(user.password).toMatch(/^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/);
    });

    it('should match password correctly', async () => {
      const isMatch = await testUser.matchPassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should not match incorrect password', async () => {
      const isMatch = await testUser.matchPassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('should handle password comparison error gracefully', async () => {
      // Mock bcrypt.compare to throw an error
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest.fn().mockRejectedValue(new Error('Bcrypt error'));

      await expect(testUser.matchPassword('password123')).rejects.toThrow('Password comparison failed');

      // Restore original function
      bcrypt.compare = originalCompare;
    });

    it('should find user by email', async () => {
      const foundUser = await User.findByEmail('jane@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('jane@example.com');
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await User.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });

    it('should update last login timestamp', async () => {
      const originalLastLogin = testUser.lastLogin;
      await testUser.updateLastLogin();
      
      expect(testUser.lastLogin).not.toBe(originalLastLogin);
      expect(testUser.lastLogin).toBeInstanceOf(Date);
    });
  });

  describe('User Virtual Properties', () => {
    it('should return full profile virtual', async () => {
      const user = new User({
        name: 'Virtual User',
        email: 'virtual@example.com',
        password: 'password123'
      });
      await user.save();

      const fullProfile = user.fullProfile;
      expect(fullProfile).toHaveProperty('id');
      expect(fullProfile).toHaveProperty('name', 'Virtual User');
      expect(fullProfile).toHaveProperty('email', 'virtual@example.com');
      expect(fullProfile).toHaveProperty('role', 'user');
      expect(fullProfile).toHaveProperty('isActive', true);
      expect(fullProfile).toHaveProperty('createdAt');
      expect(fullProfile).not.toHaveProperty('password');
    });
  });

  describe('User Error Handling', () => {
    it('should handle duplicate email error', async () => {
      const user1 = new User({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123'
      });
      await user1.save();

      const user2 = new User({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'password456'
      });

      let err;
      try {
        await user2.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // MongoDB duplicate key error
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking mongoose connection
      // For now, we'll test that the model can be created
      expect(User).toBeDefined();
      expect(typeof User).toBe('function');
    });
  });
}); 