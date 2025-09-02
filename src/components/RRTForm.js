import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Navbar, Nav, Modal } from 'react-bootstrap';
import { ref, getBytes, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function RRTForm() {
  const { rrtId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [rrt, setRrt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonError, setJsonError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    code: '',
    price: '',
    validity: '',
    description: '',
    restrictions: '',
    notes: ''
  });
  
  // JSON editor state
  const [jsonData, setJsonData] = useState('');

  const isEditing = !!rrtId;

  useEffect(() => {
    if (rrtId) {
      loadRRT();
    } else {
      setLoading(false);
    }
  }, [rrtId]);

  async function loadRRT() {
    try {
      setLoading(true);
      
      // Read from Firebase Storage
      const fileName = decodeURIComponent(rrtId);
      const fileRef = ref(storage, `RRT-JSONS/${fileName}`);
      
      try {
        const bytes = await getBytes(fileRef);
        const jsonText = new TextDecoder().decode(bytes);
        const jsonData = JSON.parse(jsonText);
        
        setRrt({
          name: fileName,
          data: jsonData
        });
        
        // Populate form with existing data
        setFormData({
          name: jsonData.name || '',
          area: jsonData.area || '',
          code: jsonData.code || '',
          price: jsonData.price || '',
          validity: jsonData.validity || '',
          description: jsonData.description || '',
          restrictions: jsonData.restrictions || '',
          notes: jsonData.notes || ''
        });
        
        // Set JSON data
        setJsonData(JSON.stringify(jsonData, null, 2));
        
      } catch (error) {
        // Try root storage if RRT-JSONS folder doesn't exist
        const rootRef = ref(storage, fileName);
        const bytes = await getBytes(rootRef);
        const jsonText = new TextDecoder().decode(bytes);
        const jsonData = JSON.parse(jsonText);
        
        setRrt({
          name: fileName,
          data: jsonData
        });
        
        // Populate form with existing data
        setFormData({
          name: jsonData.name || '',
          area: jsonData.area || '',
          code: jsonData.code || '',
          price: jsonData.price || '',
          validity: jsonData.validity || '',
          description: jsonData.description || '',
          restrictions: jsonData.restrictions || '',
          notes: jsonData.notes || ''
        });
        
        // Set JSON data
        setJsonData(JSON.stringify(jsonData, null, 2));
      }
      
    } catch (error) {
      toast.error('Failed to load RRT: ' + error.message);
      navigate('/rrt');
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
  }

  function validateForm() {
    if (!formData.name.trim()) {
      toast.error('RRT name is required');
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const rrtData = {
        name: formData.name.trim(),
        area: formData.area.trim() || null,
        code: formData.code.trim() || null,
        price: formData.price.trim() || null,
        validity: formData.validity.trim() || null,
        description: formData.description.trim() || null,
        restrictions: formData.restrictions.trim() || null,
        notes: formData.notes.trim() || null,
        updatedAt: new Date().toISOString()
      };

      if (isEditing) {
        // Update existing file
        const fileName = rrt.name;
        const fileRef = ref(storage, `RRT-JSONS/${fileName}`);
        
        // Create JSON blob
        const jsonBlob = new Blob([JSON.stringify(rrtData, null, 2)], {
          type: 'application/json'
        });
        
        await uploadBytes(fileRef, jsonBlob);
        toast.success('RRT updated successfully!');
      } else {
        // Create new file
        const fileName = `${formData.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        const fileRef = ref(storage, `RRT-JSONS/${fileName}`);
        
        // Add creation timestamp
        rrtData.createdAt = new Date().toISOString();
        
        // Create JSON blob
        const jsonBlob = new Blob([JSON.stringify(rrtData, null, 2)], {
          type: 'application/json'
        });
        
        await uploadBytes(fileRef, jsonBlob);
        toast.success('RRT added successfully!');
      }
      
      navigate('/rrt');
      
    } catch (error) {
      toast.error('Failed to save RRT: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleJsonUpdate() {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Update form data with JSON
      setFormData({
        name: parsed.name || '',
        area: parsed.area || '',
        code: parsed.code || '',
        price: parsed.price || '',
        validity: parsed.validity || '',
        description: parsed.description || '',
        restrictions: parsed.restrictions || '',
        notes: parsed.notes || ''
      });
      
      setShowJsonModal(false);
      setJsonError('');
      toast.success('JSON data applied to form');
      
    } catch (error) {
      setJsonError('Invalid JSON: ' + error.message);
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
          <p className="mt-2">Loading RRT details from Firebase Storage...</p>
        </div>
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
            🚂 Rail Statistics Database
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={() => navigate('/stations')}>All Stations</Nav.Link>
              <Nav.Link onClick={() => navigate('/add-station')}>Add Station</Nav.Link>
              <Nav.Link onClick={() => navigate('/search')}>Search</Nav.Link>
              <Nav.Link onClick={() => navigate('/rrt')} active>RRT Management</Nav.Link>
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
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>{isEditing ? '✏️ Edit RRT' : '➕ Add New RRT'}</h1>
              <div>
                <Button 
                  variant="outline-info" 
                  className="me-2"
                  onClick={() => setShowJsonModal(true)}
                >
                  📝 Edit JSON
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/rrt')}
                >
                  ← Back to RRT Dashboard
                </Button>
              </div>
            </div>
            <p className="lead">
              {isEditing ? `Editing: ${rrt?.data?.name || rrt?.name}` : 'Create a new Ranger Rover Travelcard'}
            </p>
            {isEditing && (
              <Alert variant="info">
                <strong>File:</strong> <code>{rrt?.name}</code> in Firebase Storage
              </Alert>
            )}
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">RRT Information</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>RRT Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., Freedom of the South West"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Area</Form.Label>
                        <Form.Control
                          type="text"
                          name="area"
                          value={formData.area}
                          onChange={handleChange}
                          placeholder="e.g., South West England"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          placeholder="e.g., FSW"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Price</Form.Label>
                        <Form.Control
                          type="text"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="e.g., 45.00"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Validity</Form.Label>
                    <Form.Control
                      type="text"
                      name="validity"
                      value={formData.validity}
                      onChange={handleChange}
                      placeholder="e.g., 3 days, 7 days, 1 month"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the travelcard..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Restrictions</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="restrictions"
                      value={formData.restrictions}
                      onChange={handleChange}
                      placeholder="Any travel restrictions or conditions..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional notes or information..."
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      size="lg"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : (isEditing ? '💾 Update RRT' : '➕ Add RRT')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => navigate('/rrt')}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">ℹ️ Help</h6>
              </Card.Header>
              <Card.Body>
                <h6>Required Fields:</h6>
                <ul className="small">
                  <li><strong>RRT Name:</strong> Official travelcard name</li>
                </ul>
                
                <h6>Optional Fields:</h6>
                <ul className="small">
                  <li><strong>Area:</strong> Geographic coverage</li>
                  <li><strong>Code:</strong> Short identifier</li>
                  <li><strong>Price:</strong> Cost of travelcard</li>
                  <li><strong>Validity:</strong> Duration/period</li>
                  <li><strong>Description:</strong> Brief overview</li>
                  <li><strong>Restrictions:</strong> Travel limitations</li>
                  <li><strong>Notes:</strong> Additional info</li>
                </ul>
                
                <Alert variant="info" className="mt-3">
                  <strong>Storage:</strong> RRT data is saved as JSON files in Firebase Storage.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* JSON Editor Modal */}
      <Modal show={showJsonModal} onHide={() => setShowJsonModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📝 Edit RRT JSON Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>JSON Data</Form.Label>
            <Form.Control
              as="textarea"
              rows={15}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="font-monospace"
            />
            {jsonError && (
              <Alert variant="danger" className="mt-2">
                {jsonError}
              </Alert>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowJsonModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleJsonUpdate}>
            Apply JSON to Form
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
