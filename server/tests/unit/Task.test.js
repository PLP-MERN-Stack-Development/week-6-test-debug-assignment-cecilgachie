const mongoose = require('mongoose');
const Task = require('../../src/models/Task');
const User = require('../../src/models/User');

describe('Task Model Test', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
  });

  describe('Task Schema Validation', () => {
    it('should create a task with valid data', async () => {
      const validTask = {
        title: 'Test Task',
        description: 'This is a test task description',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        assignedTo: testUser._id,
        createdBy: testUser._id,
        tags: ['test', 'important']
      };

      const task = new Task(validTask);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe(validTask.title);
      expect(savedTask.description).toBe(validTask.description);
      expect(savedTask.status).toBe(validTask.status);
      expect(savedTask.priority).toBe(validTask.priority);
      expect(savedTask.assignedTo.toString()).toBe(testUser._id.toString());
      expect(savedTask.tags).toEqual(validTask.tags);
    });

    it('should fail to create task without required fields', async () => {
      const taskWithoutRequiredField = new Task({ title: 'Test Task' });
      let err;

      try {
        await taskWithoutRequiredField.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.description).toBeDefined();
      expect(err.errors.dueDate).toBeDefined();
      expect(err.errors.assignedTo).toBeDefined();
      expect(err.errors.createdBy).toBeDefined();
    });

    it('should fail to create task with title longer than 100 characters', async () => {
      const longTitle = 'a'.repeat(101);
      const taskWithLongTitle = new Task({
        title: longTitle,
        description: 'Test description',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      let err;
      try {
        await taskWithLongTitle.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.title).toBeDefined();
    });

    it('should fail to create task with description longer than 500 characters', async () => {
      const longDescription = 'a'.repeat(501);
      const taskWithLongDescription = new Task({
        title: 'Test Task',
        description: longDescription,
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      let err;
      try {
        await taskWithLongDescription.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.description).toBeDefined();
    });

    it('should fail to create task with invalid status', async () => {
      const taskWithInvalidStatus = new Task({
        title: 'Test Task',
        description: 'Test description',
        status: 'invalid-status',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      let err;
      try {
        await taskWithInvalidStatus.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.status).toBeDefined();
    });

    it('should fail to create task with invalid priority', async () => {
      const taskWithInvalidPriority = new Task({
        title: 'Test Task',
        description: 'Test description',
        priority: 'invalid-priority',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });

      let err;
      try {
        await taskWithInvalidPriority.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.priority).toBeDefined();
    });

    it('should fail to create task with tag longer than 20 characters', async () => {
      const longTag = 'a'.repeat(21);
      const taskWithLongTag = new Task({
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id,
        tags: [longTag]
      });

      let err;
      try {
        await taskWithLongTag.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });
  });

  describe('Task Model Methods', () => {
    let testTask;

    beforeEach(async () => {
      testTask = new Task({
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date(Date.now() + 86400000),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });
      await testTask.save();
    });

    it('should add comment to task', async () => {
      const commentText = 'This is a test comment';
      await testTask.addComment(testUser._id, commentText);

      expect(testTask.comments).toHaveLength(1);
      expect(testTask.comments[0].text).toBe(commentText);
      expect(testTask.comments[0].user.toString()).toBe(testUser._id.toString());
      expect(testTask.comments[0].createdAt).toBeInstanceOf(Date);
    });

    it('should update task status', async () => {
      await testTask.updateStatus('in-progress');
      expect(testTask.status).toBe('in-progress');

      await testTask.updateStatus('completed');
      expect(testTask.status).toBe('completed');
      expect(testTask.completedAt).toBeInstanceOf(Date);
    });

    it('should handle multiple comments', async () => {
      await testTask.addComment(testUser._id, 'First comment');
      await testTask.addComment(testUser._id, 'Second comment');

      expect(testTask.comments).toHaveLength(2);
      expect(testTask.comments[0].text).toBe('First comment');
      expect(testTask.comments[1].text).toBe('Second comment');
    });
  });

  describe('Task Static Methods', () => {
    let overdueTask, futureTask;

    beforeEach(async () => {
      overdueTask = new Task({
        title: 'Overdue Task',
        description: 'This task is overdue',
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        assignedTo: testUser._id,
        createdBy: testUser._id
      });
      await overdueTask.save();

      futureTask = new Task({
        title: 'Future Task',
        description: 'This task is in the future',
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        assignedTo: testUser._id,
        createdBy: testUser._id
      });
      await futureTask.save();
    });

    it('should find overdue tasks', async () => {
      const overdueTasks = await Task.findOverdue();
      expect(overdueTasks).toHaveLength(1);
      expect(overdueTasks[0].title).toBe('Overdue Task');
    });

    it('should find tasks by user', async () => {
      const userTasks = await Task.findByUser(testUser._id);
      expect(userTasks).toHaveLength(2);
      expect(userTasks[0].assignedTo.name).toBe('Test User');
    });
  });

  describe('Task Virtual Properties', () => {
    let testTask;

    beforeEach(async () => {
      testTask = new Task({
        title: 'Virtual Test Task',
        description: 'Test description',
        dueDate: new Date(Date.now() + 86400000),
        assignedTo: testUser._id,
        createdBy: testUser._id,
        priority: 'high'
      });
      await testTask.save();
    });

    it('should return task summary', () => {
      const summary = testTask.summary;
      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('title', 'Virtual Test Task');
      expect(summary).toHaveProperty('status', 'pending');
      expect(summary).toHaveProperty('priority', 'high');
      expect(summary).toHaveProperty('dueDate');
      expect(summary).toHaveProperty('isOverdue', false);
    });

    it('should return correct progress for different statuses', () => {
      expect(testTask.progress).toBe(0); // pending

      testTask.status = 'in-progress';
      expect(testTask.progress).toBe(50);

      testTask.status = 'completed';
      expect(testTask.progress).toBe(100);

      testTask.status = 'cancelled';
      expect(testTask.progress).toBe(0);
    });

    it('should mark task as overdue when due date is in the past', () => {
      testTask.dueDate = new Date(Date.now() - 86400000); // Yesterday
      expect(testTask.summary.isOverdue).toBe(true);
    });
  });

  describe('Task Error Handling', () => {
    it('should handle invalid ObjectId for assignedTo', async () => {
      const taskWithInvalidId = new Task({
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date(),
        assignedTo: 'invalid-id',
        createdBy: testUser._id
      });

      let err;
      try {
        await taskWithInvalidId.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should handle comment with invalid user ID', async () => {
      const task = new Task({
        title: 'Test Task',
        description: 'Test description',
        dueDate: new Date(),
        assignedTo: testUser._id,
        createdBy: testUser._id
      });
      await task.save();

      let err;
      try {
        await task.addComment('invalid-user-id', 'Test comment');
      } catch (error) {
        err = error;
      }

      expect(err).toBeDefined();
    });
  });
}); 