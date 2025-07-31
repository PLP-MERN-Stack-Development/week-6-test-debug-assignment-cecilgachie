import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../components/Header';

// Mock useLocation to test different active states
const mockUseLocation = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockUseLocation(),
  Link: ({ children, to, className, ...props }) => (
    <a href={to} className={className} {...props}>{children}</a>
  ),
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    mockUseLocation.mockReturnValue({ pathname: '/' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the header with title', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('MERN Testing App')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithRouter(<Header />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('should mark Dashboard as active when on home page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/' });
    renderWithRouter(<Header />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('active');
  });

  it('should mark Users as active when on users page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/users' });
    renderWithRouter(<Header />);
    
    const usersLink = screen.getByText('Users').closest('a');
    expect(usersLink).toHaveClass('active');
  });

  it('should mark Tasks as active when on tasks page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/tasks' });
    renderWithRouter(<Header />);
    
    const tasksLink = screen.getByText('Tasks').closest('a');
    expect(tasksLink).toHaveClass('active');
  });

  it('should mark Users as active when on user edit page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/users/123/edit' });
    renderWithRouter(<Header />);
    
    const usersLink = screen.getByText('Users').closest('a');
    expect(usersLink).toHaveClass('active');
  });

  it('should mark Tasks as active when on task edit page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/tasks/123/edit' });
    renderWithRouter(<Header />);
    
    const tasksLink = screen.getByText('Tasks').closest('a');
    expect(tasksLink).toHaveClass('active');
  });

  it('should have correct href attributes for navigation links', () => {
    renderWithRouter(<Header />);
    
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const usersLink = screen.getByText('Users').closest('a');
    const tasksLink = screen.getByText('Tasks').closest('a');
    
    expect(dashboardLink).toHaveAttribute('href', '/');
    expect(usersLink).toHaveAttribute('href', '/users');
    expect(tasksLink).toHaveAttribute('href', '/tasks');
  });

  it('should have header structure with proper classes', () => {
    renderWithRouter(<Header />);
    
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('header');
    
    const headerContent = header.querySelector('.header-content');
    expect(headerContent).toBeInTheDocument();
    
    const nav = header.querySelector('.nav');
    expect(nav).toBeInTheDocument();
  });

  it('should handle unknown routes gracefully', () => {
    mockUseLocation.mockReturnValue({ pathname: '/unknown-route' });
    renderWithRouter(<Header />);
    
    // Should not have any active links
    const activeLinks = document.querySelectorAll('.nav-link.active');
    expect(activeLinks).toHaveLength(0);
  });
}); 