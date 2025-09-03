import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Navbar, Nav } from 'react-bootstrap';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function EditOperator() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [operator, setOperator] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    operatortype: 'Rail Operator',
    operatorregion: '',
    colorHex: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (operatorId) {
      loadOperator();
    }
  }, [operatorId]);

  async function loadOperator() {
    try {
      setLoading(true);
      
      const docRef = doc(db, 'toc_operators', operatorId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        toast.error('Train operator not found');
        navigate('/operators');
        return;
      }
      
      const operatorData = docSnap.data();
      
      setOperator({
        id: docSnap.id,
        ...operatorData
      });
      
      // Populate form with existing data
      setFormData({
        name: operatorData.name || '',
        operatortype: operatorData.operatortype || 'Rail Operator',
        operatorregion: operatorData.operatorregion || '',
        colorHex: operatorData.colorHex || ''
      });
      
    } catch (error) {
      toast.error('Failed to load operator: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
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
  }

  function validateForm() {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Operator name is required';
    }
    
    if (!formData.operatorregion.trim()) {
      newErrors.operatorregion = 'Operating region is required';
    }
    
    if (formData.colorHex && !formData.colorHex.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.colorHex = 'Color must be in hex format (e.g., #FF0000)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        name: formData.name.trim(),
        operatortype: formData.operatortype.trim(),
        operatorregion: formData.operatorregion.trim(),
        updatedAt: new Date().toISOString()
      };

      // Add color if provided, or remove if empty
      if (formData.colorHex.trim()) {
        updateData.colorHex = formData.colorHex.trim().toUpperCase();
      }

      const docRef = doc(db, 'toc_operators', operator.id);
      await updateDoc(docRef, updateData);
      
      toast.success('Train operator updated successfully!');
      navigate(`/operator/${operator.id}`);
      
    } catch (error) {
      toast.error('Failed to update operator: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out: ' + error.message);
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading operator details...</p>
        </div>
      </Container>
    );
  }

  if (!operator) {
    return (
      <Container>
        <Alert variant="danger">
          <h4>Operator Not Found</h4>
          <p>The train operator you're trying to edit was not found.</p>
          <Button variant="outline-danger" onClick={() => navigate('/operators')}>
            ← Back to Operators
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand 
            onClick={() => navigate('/dashboard')} 
            style={{ cursor: 'pointer' }}
            className="d-flex align-items-center"
          >
            Rail Statistics
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/stations')}>All Stations</Nav.Link>
              <Nav.Link onClick={() => navigate('/operators')}>All Operators</Nav.Link>
              <Nav.Link onClick={() => navigate('/add-station')}>Add Station</Nav.Link>
              <Nav.Link onClick={() => navigate('/add-operator')}>Add Operator</Nav.Link>
              <Nav.Link onClick={() => navigate('/search')}>Search</Nav.Link>
              <Nav.Link onClick={() => navigate('/rrt')}>RRT Management</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link disabled>
                👤 {currentUser?.email}
              </Nav.Link>
              <Nav.Link onClick={handleLogout}>
                🚪 Logout
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card>
              <Card.Header>
                <h3 className="mb-0">🚄 Edit Train Operator</h3>
                <small className="text-muted">Editing: {operator.name}</small>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Operator Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          isInvalid={!!errors.name}
                          placeholder="e.g., Avanti West Coast"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Operator Type</Form.Label>
                        <Form.Select
                          name="operatortype"
                          value={formData.operatortype}
                          onChange={handleChange}
                        >
                          <option value="Rail Operator">Rail Operator</option>
                          <option value="Freight Operator">Freight Operator</option>
                          <option value="Light Rail">Light Rail</option>
                          <option value="Heritage Railway">Heritage Railway</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Operating Region *</Form.Label>
                        <Form.Select
                          name="operatorregion"
                          value={formData.operatorregion}
                          onChange={handleChange}
                          isInvalid={!!errors.operatorregion}
                        >
                          <option value="">Select a region...</option>
                          <option value="England">England</option>
                          <option value="Scotland">Scotland</option>
                          <option value="Wales">Wales</option>
                          <option value="England, Scotland">England, Scotland</option>
                          <option value="England, Wales">England, Wales</option>
                          <option value="Scotland, Wales">Scotland, Wales</option>
                          <option value="England, Scotland, Wales">England, Scotland, Wales</option>
                          <option value="Northern Ireland">Northern Ireland</option>
                          <option value="International">International</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.operatorregion}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Brand Color (Hex)</Form.Label>
                        <div className="d-flex">
                          <Form.Control
                            type="text"
                            name="colorHex"
                            value={formData.colorHex}
                            onChange={handleChange}
                            isInvalid={!!errors.colorHex}
                            placeholder="#004354"
                            maxLength={7}
                          />
                          {formData.colorHex && formData.colorHex.match(/^#[0-9A-Fa-f]{6}$/) && (
                            <div 
                              style={{
                                width: '40px',
                                height: '38px',
                                backgroundColor: formData.colorHex,
                                border: '1px solid #ddd',
                                borderRadius: '0 0.375rem 0.375rem 0',
                                marginLeft: '-1px'
                              }}
                            ></div>
                          )}
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {errors.colorHex}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Optional. Enter hex color code (e.g., #004354)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Alert variant="info">
                    <strong>Note:</strong> All required fields are marked with an asterisk (*). 
                    Changes will be saved immediately when you click "Update Operator".
                  </Alert>

                  <div className="d-flex justify-content-between">
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        className="me-2"
                        onClick={() => navigate(`/operator/${operator.id}`)}
                        disabled={saving}
                      >
                        ← Back to View
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        onClick={() => navigate('/operators')}
                        disabled={saving}
                      >
                        📋 All Operators
                      </Button>
                    </div>
                    <div>
                      <Button 
                        variant="outline-warning" 
                        className="me-2"
                        onClick={() => {
                          setFormData({
                            name: operator.name || '',
                            operatortype: operator.operatortype || 'Rail Operator',
                            operatorregion: operator.operatorregion || '',
                            colorHex: operator.colorHex || ''
                          });
                          setErrors({});
                        }}
                        disabled={saving}
                      >
                        🔄 Reset Changes
                      </Button>
                      <Button 
                        type="submit" 
                        variant="success"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Saving...
                          </>
                        ) : (
                          '💾 Update Operator'
                        )}
                      </Button>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Access */}
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">⚡ Quick Access</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Button 
                      variant="primary" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/operators')}
                    >
                      📋 All Operators
                    </Button>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="success" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/add-operator')}
                    >
                      ➕ Add New Operator
                    </Button>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="info" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/search')}
                    >
                      🔍 Search
                    </Button>
                  </Col>
                  <Col md={3}>
                    <Button 
                      variant="secondary" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/dashboard')}
                    >
                      📊 Dashboard
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
