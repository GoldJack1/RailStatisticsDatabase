import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function Header({ activeSection = '', showSearch = true }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <Navbar bg={darkMode ? "dark" : "light"} variant={darkMode ? "dark" : "light"} expand="lg" className="mb-4 shadow-sm">
      <Container>
        <Navbar.Brand 
          onClick={() => navigate('/dashboard')} 
          style={{ cursor: 'pointer' }}
          className="d-flex align-items-center fw-bold"
        >
          Rail Statistics
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              onClick={() => navigate('/stations')} 
              className={`fw-medium ${activeSection === 'stations' ? 'active' : ''}`}
            >
              Stations
            </Nav.Link>
            <Nav.Link 
              onClick={() => navigate('/operators')} 
              className={`fw-medium ${activeSection === 'operators' ? 'active' : ''}`}
            >
              Operators
            </Nav.Link>
            <Nav.Link 
              onClick={() => navigate('/rrt')} 
              className={`fw-medium ${activeSection === 'rrt' ? 'active' : ''}`}
            >
              RRTs
            </Nav.Link>
          </Nav>
          <Nav className="align-items-center">
            {showSearch && (
              <Form className="d-flex me-3" onSubmit={handleSearchSubmit}>
                <Form.Control
                  type="search"
                  placeholder="Search..."
                  size="sm"
                  style={{ width: '200px' }}
                  className="me-2"
                />
                <Button variant="outline-secondary" size="sm" type="submit">
                  Search
                </Button>
              </Form>
            )}
            {!showSearch && (
              <span className="nav-link text-muted me-3" style={{ cursor: 'default' }}>
                {activeSection === 'search' ? 'Search Page' : 
                 activeSection === 'add-station' ? 'Add Station' :
                 activeSection === 'add-operator' ? 'Add Operator' :
                 activeSection === 'edit-station' ? 'Edit Station' :
                 activeSection === 'edit-operator' ? 'Edit Operator' :
                 activeSection === 'view-station' ? 'Station Details' :
                 activeSection === 'view-operator' ? 'Operator Details' :
                 activeSection}
              </span>
            )}
            <Button 
              variant="link" 
              onClick={toggleDarkMode}
              className="nav-link border-0 p-2 me-2"
              style={{ background: 'none' }}
              title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            >
              {darkMode ? '☀️' : '🌙'}
            </Button>
            <div className="nav-link text-muted small me-2" style={{ cursor: 'default' }}>
              {currentUser?.email}
            </div>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleLogout}
              className="ms-2"
            >
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
