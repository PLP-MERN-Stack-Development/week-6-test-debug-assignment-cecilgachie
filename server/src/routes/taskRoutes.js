const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  updateTaskStatus,
  getOverdueTasks,
  getTasksByUser
} = require('../controllers/taskController');

const router = express.Router();

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/overdue')
  .get(getOverdueTasks);

router.route('/user/:userId')
  .get(getTasksByUser);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.route('/:id/comments')
  .post(addComment);

router.route('/:id/status')
  .patch(updateTaskStatus);

module.exports = router; 