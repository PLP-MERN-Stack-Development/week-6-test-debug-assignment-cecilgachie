import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    tags: []
  });

  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchUsers();
    if (isEditing) {
      fetchTask();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrors({ general: 'Failed to load users' });
    }
  };

  const fetchTask = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`http://localhost:5000/api/tasks/${id}`);
      
      if (response.data.success) {
        const task = response.data.data;
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          assignedTo: task.assignedTo?._id || '',
          tags: task.tags || []
        });
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      setErrors({ general: 'Failed to load task data' });
    } finally {
      setFetching(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot be more than 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description cannot be more than 500 characters';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Please assign the task to a user';
    }

    if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(formData.status)) {
      newErrors.status = 'Please select a valid status';
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(formData.priority)) {
      newErrors.priority = 'Please select a valid priority';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const submitData = {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString()
      };

      const url = isEditing 
        ? `http://localhost:5000/api/tasks/${id}`
        : 'http://localhost:5000/api/tasks';
      
      const method = isEditing ? 'put' : 'post';
      
      const response = await axios[method](url, submitData);

      if (response.data.success) {
        navigate('/tasks');
      } else {
        setErrors({ general: 'Failed to save task' });
      }
    } catch (err) {
      console.error('Error saving task:', err);
      
      if (err.response?.data?.error) {
        setErrors({ general: err.response.data.error });
      } else {
        setErrors({ general: 'Failed to save task. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (fetching) {
    return (
      <div className="loading">
        <h2>Loading Task...</h2>
      </div>
    );
  }

  return (
    <div className="task-form fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="form-label">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`form-control ${errors.title ? 'error' : ''}`}
              placeholder="Enter task title"
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-control ${errors.description ? 'error' : ''}`}
              placeholder="Enter task description"
              rows="4"
            />
            {errors.description && <div className="error-message">{errors.description}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="status" className="form-label">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`form-control ${errors.status ? 'error' : ''}`}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && <div className="error-message">{errors.status}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">Priority *</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`form-control ${errors.priority ? 'error' : ''}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              {errors.priority && <div className="error-message">{errors.priority}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="dueDate" className="form-label">Due Date *</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`form-control ${errors.dueDate ? 'error' : ''}`}
              />
              {errors.dueDate && <div className="error-message">{errors.dueDate}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="assignedTo" className="form-label">Assigned To *</label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className={`form-control ${errors.assignedTo ? 'error' : ''}`}
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.assignedTo && <div className="error-message">{errors.assignedTo}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                className="form-control"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-secondary"
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge badge-medium"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Task' : 'Create Task')}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 