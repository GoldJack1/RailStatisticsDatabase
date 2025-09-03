import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in: ' + error.message);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Background with gradient */}
      <div className="login-background"></div>
      
      {/* Dark mode toggle */}
      <Button 
        variant="link" 
        onClick={toggleDarkMode}
        className="position-absolute top-0 end-0 m-4 text-white"
        style={{ zIndex: 1000, background: 'rgba(0,0,0,0.2)', borderRadius: '50%', width: '50px', height: '50px' }}
        title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
      >
        {darkMode ? '☀️' : '🌙'}
      </Button>

      <Container className="d-flex align-items-center justify-content-center position-relative" style={{ minHeight: '100vh', zIndex: 10 }}>
        <Row className="justify-content-center w-100">
          <Col xs={11} sm={8} md={6} lg={5} xl={4}>
            <Card className="login-card border-0 shadow-lg">
              <Card.Body className="p-5">
                {/* Logo and Title */}
                <div className="text-center mb-5">
                  <div className="login-icon mb-3">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white" 
                         style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                      🚂
                    </div>
                  </div>
                  <h2 className="fw-bold mb-2">Rail Statistics</h2>
                  <p className="text-muted mb-0">Welcome back! Please sign in to continue</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="border-0 rounded-3 mb-4">
                    <div className="d-flex align-items-center">
                      <span className="me-2">⚠️</span>
                      {error}
                    </div>
                  </Alert>
                )}

                {/* Login Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-muted small mb-2">EMAIL ADDRESS</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      size="lg"
                      placeholder="Enter your email"
                      className="border-2 rounded-3 py-3"
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-medium text-muted small mb-2">PASSWORD</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      size="lg"
                      placeholder="Enter your password"
                      className="border-2 rounded-3 py-3"
                      style={{ fontSize: '1rem' }}
                    />
                  </Form.Group>

                  <Button 
                    disabled={loading} 
                    className="w-100 py-3 fw-medium rounded-3 border-0" 
                    type="submit"
                    size="lg"
                    style={{ fontSize: '1.1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Form>

                {/* Footer */}
                <div className="text-center mt-4 pt-3 border-top">
                  <small className="text-muted">
                    Need an account? <span className="fw-medium">Contact your administrator</span>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
