import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import UserForm from '../../components/UserForm';

// Mock axios
const mockAxios = axios;
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>),
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('UserForm Component - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Creating New User', () => {
    it('should render form for creating new user', () => {
      renderWithRouter(<UserForm />);
      
      expect(screen.getByText('Add New User')).toBeInTheDocument();
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
      expect(screen.getByLabelText('Password *')).toBeInTheDocument();
      expect(screen.getByLabelText('Role *')).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      renderWithRouter(<UserForm />);
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderWithRouter(<UserForm />);
      
      const emailInput = screen.getByLabelText('Email *');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should validate password length', async () => {
      renderWithRouter(<UserForm />);
      
      const passwordInput = screen.getByLabelText('Password *');
      fireEvent.change(passwordInput, { target: { value: '123' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    it('should successfully create a user', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { id: '123', name: 'Test User' } }
      });
      
      renderWithRouter(<UserForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Role *'), { target: { value: 'user' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith(
          'http://localhost:5000/api/users',
          {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'user',
            isActive: true
          }
        );
        expect(mockNavigate).toHaveBeenCalledWith('/users');
      });
    });

    it('should handle API errors when creating user', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Email already exists' } }
      });
      
      renderWithRouter(<UserForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Editing Existing User', () => {
    const mockUser = {
      _id: '123',
      name: 'Existing User',
      email: 'existing@example.com',
      role: 'admin',
      isActive: true
    };

    beforeEach(() => {
      // Mock useParams to return an ID for editing
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '123' }),
        Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>),
      }));
    });

    it('should load existing user data when editing', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockUser }
      });
      
      renderWithRouter(<UserForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('existing@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
      });
    });

    it('should not require password when editing', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockUser }
      });
      
      renderWithRouter(<UserForm />);
      
      await waitFor(() => {
        const passwordLabel = screen.getByText('Password');
        expect(passwordLabel).toBeInTheDocument();
        expect(passwordLabel).not.toHaveTextContent('*');
      });
    });

    it('should update user successfully', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockUser }
      });
      
      mockAxios.put.mockResolvedValueOnce({
        data: { success: true, data: { ...mockUser, name: 'Updated User' } }
      });
      
      renderWithRouter(<UserForm />);
      
      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Existing User');
        fireEvent.change(nameInput, { target: { value: 'Updated User' } });
        
        const submitButton = screen.getByText('Update User');
        fireEvent.click(submitButton);
      });
      
      await waitFor(() => {
        expect(mockAxios.put).toHaveBeenCalledWith(
          'http://localhost:5000/api/users/123',
          {
            name: 'Updated User',
            email: 'existing@example.com',
            role: 'admin',
            isActive: true
          }
        );
        expect(mockNavigate).toHaveBeenCalledWith('/users');
      });
    });

    it('should handle loading errors when fetching user', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<UserForm />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should clear validation errors when user starts typing', async () => {
      renderWithRouter(<UserForm />);
      
      // Trigger validation error
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      
      // Start typing in name field
      const nameInput = screen.getByLabelText('Name *');
      fireEvent.change(nameInput, { target: { value: 'Test' } });
      
      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });

    it('should handle cancel button', () => {
      renderWithRouter(<UserForm />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/users');
    });

    it('should show loading state during submission', async () => {
      mockAxios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithRouter(<UserForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<UserForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to save user. Please try again.')).toBeInTheDocument();
      });
    });

    it('should handle validation errors from server', async () => {
      mockAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Validation failed' } }
      });
      
      renderWithRouter(<UserForm />);
      
      // Fill out the form
      fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } });
      
      const submitButton = screen.getByText('Create User');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });
  });
}); 