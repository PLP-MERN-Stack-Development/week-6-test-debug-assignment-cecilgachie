import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    tasks: { total: 0, pending: 0, completed: 0, overdue: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user stats
        const userStatsResponse = await axios.get('http://localhost:5000/api/users/stats');
        
        // Fetch task stats (we'll simulate this since we don't have a stats endpoint for tasks)
        const tasksResponse = await axios.get('http://localhost:5000/api/tasks');
        const overdueResponse = await axios.get('http://localhost:5000/api/tasks/overdue');

        const tasks = tasksResponse.data.data || [];
        const overdueTasks = overdueResponse.data.data || [];

        const taskStats = {
          total: tasks.length,
          pending: tasks.filter(task => task.status === 'pending').length,
          completed: tasks.filter(task => task.status === 'completed').length,
          overdue: overdueTasks.length
        };

        setStats({
          users: userStatsResponse.data.data,
          tasks: taskStats
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <h1>Dashboard</h1>
      
      <div className="grid grid-3">
        {/* User Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Users</h3>
            <Link to="/users" className="btn btn-primary btn-sm">
              View All
            </Link>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Total Users:</span>
              <span className="stat-value">{stats.users.totalUsers || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Users:</span>
              <span className="stat-value">{stats.users.activeUsers || 0}</span>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tasks</h3>
            <Link to="/tasks" className="btn btn-primary btn-sm">
              View All
            </Link>
          </div>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">Total Tasks:</span>
              <span className="stat-value">{stats.tasks.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pending:</span>
              <span className="stat-value">{stats.tasks.pending}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Completed:</span>
              <span className="stat-value">{stats.tasks.completed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Overdue:</span>
              <span className="stat-value">{stats.tasks.overdue}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <Link to="/users/new" className="btn btn-success" style={{ width: '100%', marginBottom: '0.5rem' }}>
              Add New User
            </Link>
            <Link to="/tasks/new" className="btn btn-primary" style={{ width: '100%' }}>
              Create New Task
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
          Recent activity will be displayed here. This is a placeholder for demonstration purposes.
        </p>
      </div>

      <style jsx>{`
        .stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        
        .stat-item:last-child {
          border-bottom: none;
        }
        
        .stat-label {
          font-weight: 500;
          color: #666;
        }
        
        .stat-value {
          font-weight: 600;
          color: #333;
          font-size: 1.1rem;
        }
        
        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 