import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import './App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UserList from './components/UserList';
import TaskList from './components/TaskList';
import UserForm from './components/UserForm';
import TaskForm from './components/TaskForm';
import ErrorFallback from './components/ErrorFallback';

function App() {
  const handleError = (error, errorInfo) => {
    console.error('App Error:', error, errorInfo);
    // In a real app, you would send this to an error reporting service
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
    >
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id/edit" element={<UserForm />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/new" element={<TaskForm />} />
              <Route path="/tasks/:id/edit" element={<TaskForm />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App; 