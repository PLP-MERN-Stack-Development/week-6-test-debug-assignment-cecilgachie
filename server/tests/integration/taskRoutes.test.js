const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/index');
const Task = require('../../src/models/Task');
const User = require('../../src/models/User');

describe('Task Routes Integration Tests', () => {
  let testUser, testTask;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Task.deleteMany({});

    // Create a test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();

    // Create a test task
    testTask = new Task({
      title: 'Test Task',
      description: 'This is a test task',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      assignedTo: testUser._id,
      createdBy: testUser._id,
      tags: ['test', 'important']
    });
    await testTask.save();
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Task');
      expect(response.body.data[0].assignedTo.name).toBe('Test User');
    });

    it('should filter tasks by status', async () => {
      // Create a completed task
      await Task.create({
        title: 'Completed Task',
        description: 'This task is completed',
        status: 'completed',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      const response = await request(app)
        .get('/api/tasks?status=pending')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
    });

    it('should filter tasks by priority', async () => {
      // Create a high priority task
      await Task.create({
        title: 'High Priority Task',
        description: 'This is high priority',
        priority: 'high',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      const response = await request(app)
        .get('/api/tasks?priority=high')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should handle pagination', async () => {
      // Create additional tasks
      for (let i = 1; i <= 15; i++) {
        await Task.create({
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          dueDate: new Date(),
          assignedTo: testUser._id,
          createdBy: testUser._id
        });
      }

      const response = await request(app)
        .get('/api/tasks?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a single task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data.description).toBe('This is a test task');
      expect(response.body.data.assignedTo.name).toBe('Test User');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'This is a new task',
        status: 'pending',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000),
        assignedTo: testUser._id,
        tags: ['new', 'urgent']
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newTask.title);
      expect(response.body.data.description).toBe(newTask.description);
      expect(response.body.data.priority).toBe(newTask.priority);
      expect(response.body.data.assignedTo.name).toBe('Test User');
    });

    it('should fail to create task with non-existent assigned user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const newTask = {
        title: 'New Task',
        description: 'This is a new task',
        dueDate: new Date(),
        assignedTo: fakeUserId
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Assigned user not found');
    });

    it('should fail to create task without required fields', async () => {
      const incompleteTask = {
        title: 'Incomplete Task'
        // Missing description, dueDate, assignedTo
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(incompleteTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail to create task with invalid status', async () => {
      const invalidTask = {
        title: 'Invalid Task',
        description: 'This task has invalid status',
        status: 'invalid-status',
        dueDate: new Date(),
        assignedTo: testUser._id
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update an existing task', async () => {
      const updateData = {
        title: 'Updated Task',
        description: 'This task has been updated',
        status: 'in-progress',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });

    it('should fail to update with non-existent assigned user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .send({ assignedTo: fakeUserId })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Assigned user not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify task is deleted
      const deletedTask = await Task.findById(testTask._id);
      expect(deletedTask).toBeNull();
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('POST /api/tasks/:id/comments', () => {
    it('should add comment to task', async () => {
      const commentData = {
        text: 'This is a test comment',
        userId: testUser._id
      };

      const response = await request(app)
        .post(`/api/tasks/${testTask._id}/comments`)
        .send(commentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toHaveLength(1);
      expect(response.body.data.comments[0].text).toBe(commentData.text);
      expect(response.body.data.comments[0].user.name).toBe('Test User');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/tasks/${fakeId}/comments`)
        .send({ text: 'Comment', userId: testUser._id })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('should update task status', async () => {
      const statusData = { status: 'completed' };

      const response = await request(app)
        .patch(`/api/tasks/${testTask._id}/status`)
        .send(statusData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/tasks/${fakeId}/status`)
        .send({ status: 'completed' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('GET /api/tasks/overdue', () => {
    it('should get overdue tasks', async () => {
      // Create an overdue task
      await Task.create({
        title: 'Overdue Task',
        description: 'This task is overdue',
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      const response = await request(app)
        .get('/api/tasks/overdue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Overdue Task');
    });

    it('should return empty array when no overdue tasks exist', async () => {
      const response = await request(app)
        .get('/api/tasks/overdue')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/tasks/user/:userId', () => {
    it('should get tasks by user', async () => {
      const response = await request(app)
        .get(`/api/tasks/user/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Task');
    });

    it('should return empty array for user with no tasks', async () => {
      const newUser = await User.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .get(`/api/tasks/user/${newUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Mock Task.find to throw an error
      const originalFind = Task.find;
      Task.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tasks')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Server Error');

      // Restore original function
      Task.find = originalFind;
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 