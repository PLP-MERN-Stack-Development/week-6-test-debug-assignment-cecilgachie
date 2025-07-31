import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-fallback" style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="card">
        <h2>Something went wrong!</h2>
        <p style={{ color: '#666', margin: '1rem 0' }}>
          An error occurred while rendering this component. This is a test of our error boundary.
        </p>
        <details style={{ margin: '1rem 0', textAlign: 'left' }}>
          <summary>Error Details</summary>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '4px', 
            overflow: 'auto',
            fontSize: '0.875rem'
          }}>
            {error.message}
          </pre>
        </details>
        <button 
          onClick={resetErrorBoundary}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback; 