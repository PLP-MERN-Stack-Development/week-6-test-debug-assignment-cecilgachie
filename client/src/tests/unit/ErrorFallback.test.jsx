import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorFallback from '../../components/ErrorFallback';

describe('ErrorFallback Component', () => {
  const mockError = new Error('Test error message');
  const mockResetErrorBoundary = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render error message', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
  });

  it('should display the error message in details', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    const details = screen.getByText('Error Details');
    expect(details).toBeInTheDocument();
    
    // Check if error message is in the pre element
    const preElement = screen.getByText('Test error message');
    expect(preElement).toBeInTheDocument();
  });

  it('should call resetErrorBoundary when Try Again button is clicked', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);
    
    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
  });

  it('should have proper styling classes', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    const errorFallback = screen.getByText('Something went wrong!').closest('.error-fallback');
    expect(errorFallback).toBeInTheDocument();
    
    const card = errorFallback.querySelector('.card');
    expect(card).toBeInTheDocument();
  });

  it('should display explanatory text', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    expect(screen.getByText(/An error occurred while rendering this component/)).toBeInTheDocument();
    expect(screen.getByText(/This is a test of our error boundary/)).toBeInTheDocument();
  });

  it('should handle different error types', () => {
    const customError = new TypeError('Custom type error');
    
    render(
      <ErrorFallback 
        error={customError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    expect(screen.getByText('Custom type error')).toBeInTheDocument();
  });

  it('should have accessible button with proper role', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Try Again' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('btn', 'btn-primary');
  });

  it('should have collapsible error details', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    const details = screen.getByText('Error Details').closest('details');
    expect(details).toBeInTheDocument();
    
    const summary = details.querySelector('summary');
    expect(summary).toBeInTheDocument();
  });

  it('should handle empty error message gracefully', () => {
    const emptyError = new Error('');
    
    render(
      <ErrorFallback 
        error={emptyError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    );
    
    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    // Should still render the pre element even with empty message
    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
  });
}); 