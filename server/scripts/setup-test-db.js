const mongoose = require('mongoose');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

const setupTestDatabase = async () => {
  try {
    console.log('🔧 Setting up test database...');
    
    // Connect to test database
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-testing-test';
    await mongoose.connect(testDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to test database');
    
    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    console.log('🧹 Cleared existing test data');
    
    // Create test users
    const testUsers = [
      {
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        isActive: true
      },
      {
        name: 'Test User',
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
        isActive: true
      },
      {
        name: 'Inactive User',
        email: 'inactive@test.com',
        password: 'password123',
        role: 'user',
        isActive: false
      }
    ];
    
    const createdUsers = await User.create(testUsers);
    console.log(`👥 Created ${createdUsers.length} test users`);
    
    // Create test tasks
    const testTasks = [
      {
        title: 'Complete Testing Assignment',
        description: 'Implement comprehensive testing for MERN application',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedTo: createdUsers[0]._id,
        createdBy: createdUsers[0]._id,
        tags: ['testing', 'assignment', 'important']
      },
      {
        title: 'Review Code Coverage',
        description: 'Ensure 70% code coverage is achieved',
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        assignedTo: createdUsers[1]._id,
        createdBy: createdUsers[0]._id,
        tags: ['coverage', 'review']
      },
      {
        title: 'Write Documentation',
        description: 'Document testing strategies and debugging techniques',
        status: 'completed',
        priority: 'low',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        assignedTo: createdUsers[1]._id,
        createdBy: createdUsers[0]._id,
        tags: ['documentation', 'completed']
      },
      {
        title: 'Overdue Task',
        description: 'This task is overdue for testing purposes',
        status: 'pending',
        priority: 'urgent',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        assignedTo: createdUsers[0]._id,
        createdBy: createdUsers[0]._id,
        tags: ['overdue', 'urgent']
      }
    ];
    
    const createdTasks = await Task.create(testTasks);
    console.log(`📋 Created ${createdTasks.length} test tasks`);
    
    // Add some comments to tasks
    const taskWithComments = createdTasks[0];
    await taskWithComments.addComment(createdUsers[0]._id, 'Starting work on this task');
    await taskWithComments.addComment(createdUsers[1]._id, 'Great progress so far!');
    
    console.log('💬 Added test comments to tasks');
    
    // Display test data summary
    console.log('\n📊 Test Database Summary:');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Tasks: ${createdTasks.length}`);
    console.log(`Comments: 2`);
    
    console.log('\n🔗 Test Data Access:');
    console.log(`Admin User ID: ${createdUsers[0]._id}`);
    console.log(`Regular User ID: ${createdUsers[1]._id}`);
    console.log(`Sample Task ID: ${createdTasks[0]._id}`);
    
    console.log('\n✅ Test database setup completed successfully!');
    console.log('🚀 You can now run tests with: npm test');
    
  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = setupTestDatabase; 