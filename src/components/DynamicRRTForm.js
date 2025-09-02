import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Navbar, Nav, Modal, Badge } from 'react-bootstrap';
import { ref, getBytes, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function DynamicRRTForm() {
  const { rrtId } = useParams();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [rrt, setRrt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonError, setJsonError] = useState('');
  
  // Dynamic form state
  const [formData, setFormData] = useState({});
  const [originalJsonData, setOriginalJsonData] = useState({});
  
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
        
        // Store original data
        setOriginalJsonData(jsonData);
        
        // Initialize form data with all fields from JSON
        const initialFormData = {};
        flattenObject(jsonData, initialFormData);
        setFormData(initialFormData);
        
        // Set JSON data for editor
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
        
        // Store original data
        setOriginalJsonData(jsonData);
        
        // Initialize form data with all fields from JSON
        const initialFormData = {};
        flattenObject(jsonData, initialFormData);
        setFormData(initialFormData);
        
        // Set JSON data for editor
        setJsonData(JSON.stringify(jsonData, null, 2));
      }
      
    } catch (error) {
      console.error('Error loading RRT:', error);
      toast.error('Failed to load RRT data');
    } finally {
      setLoading(false);
    }
  }

  // Flatten nested objects for form display
  function flattenObject(obj, result = {}, prefix = '') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (obj[key] !== null && typeof obj[key] === 'object') {
          if (Array.isArray(obj[key])) {
            // Handle arrays - store the whole array as a single field
            // This way we can detect and specially handle object arrays in the UI
            result[newKey] = obj[key];
          } else {
            // Handle regular objects by recursively flattening
            flattenObject(obj[key], result, newKey);
          }
        } else {
          result[newKey] = obj[key];
        }
      }
    }
  }

  // Unflatten form data back to nested structure
  function unflattenObject(flatObj) {
    const result = {};
    
    for (const key in flatObj) {
      if (flatObj.hasOwnProperty(key)) {
        const keys = key.split('.');
        let current = result;
        
        // Navigate through the nested structure
        for (let i = 0; i < keys.length - 1; i++) {
          const currentKey = keys[i];
          
          if (!current[currentKey]) {
            current[currentKey] = {};
          }
          current = current[currentKey];
        }
        
        // Set the final value (could be primitive, object, or array)
        const finalKey = keys[keys.length - 1];
        current[finalKey] = flatObj[key];
      }
    }
    
    return result;
  }

  // Handle form field changes
  function handleFieldChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  // Generate form field based on value type
  function renderField(field, value) {
    const fieldType = typeof value;
    
    if (Array.isArray(value)) {
      // Check if this is an array of objects (like railcards)
      const isObjectArray = value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
      
      if (isObjectArray) {
        // Handle arrays of objects (like railcards)
        const displayValue = Array.isArray(formData[field]) 
          ? formData[field].map(item => 
              typeof item === 'object' 
                ? JSON.stringify(item, null, 2)
                : item
            ).join('\n---\n')
          : value.map(item => JSON.stringify(item, null, 2)).join('\n---\n');
        
        return (
          <Form.Group key={field} className="mb-3">
            <Form.Label>
              <strong>{field.replace(/\./g, ' → ')}</strong>
              <Badge bg="warning" className="ms-2">Object Array</Badge>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={Math.min(value.length * 4 + 2, 15)}
              value={displayValue}
              onChange={(e) => {
                try {
                  const arrayValue = e.target.value
                    .split('\n---\n')
                    .filter(item => item.trim() !== '')
                    .map(item => {
                      try {
                        return JSON.parse(item);
                      } catch {
                        return item;
                      }
                    });
                  handleFieldChange(field, arrayValue);
                } catch (error) {
                  // If parsing fails, just set as string array
                  const arrayValue = e.target.value.split('\n').filter(item => item.trim() !== '');
                  handleFieldChange(field, arrayValue);
                }
              }}
              placeholder="Enter JSON objects, separated by '---' lines"
              className="font-monospace"
            />
            <Form.Text className="text-muted">
              {value.length} objects. Edit JSON objects separated by '---' lines.
              {field.includes('railcard') && (
                <div className="mt-1">
                  <small>💡 Railcards should have "code" and "name" properties</small>
                </div>
              )}
            </Form.Text>
          </Form.Group>
        );
      } else {
        // Handle simple arrays (strings, numbers, etc.)
        return (
          <Form.Group key={field} className="mb-3">
            <Form.Label>
              <strong>{field.replace(/\./g, ' → ')}</strong>
              <Badge bg="info" className="ms-2">Array</Badge>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={Math.min(value.length + 1, 6)}
              value={Array.isArray(formData[field]) ? formData[field].join('\n') : value.join('\n')}
              onChange={(e) => {
                const arrayValue = e.target.value.split('\n').filter(item => item.trim() !== '');
                handleFieldChange(field, arrayValue);
              }}
              placeholder="Enter values, one per line"
            />
            <Form.Text className="text-muted">
              {value.length} items. Enter one value per line.
            </Form.Text>
          </Form.Group>
        );
      }
    }
    
    if (fieldType === 'string') {
      if (value.length > 100) {
        return (
          <Form.Group key={field} className="mb-3">
            <Form.Label>
              <strong>{field.replace(/\./g, ' → ')}</strong>
              <Badge bg="secondary" className="ms-2">Long Text</Badge>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={Math.min(Math.ceil(value.length / 50), 8)}
              value={formData[field] || value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.replace(/\./g, ' → ')}`}
            />
          </Form.Group>
        );
      } else {
        return (
          <Form.Group key={field} className="mb-3">
            <Form.Label>
              <strong>{field.replace(/\./g, ' → ')}</strong>
              <Badge bg="primary" className="ms-2">Text</Badge>
            </Form.Label>
            <Form.Control
              type="text"
              value={formData[field] || value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              placeholder={`Enter ${field.replace(/\./g, ' → ')}`}
            />
          </Form.Group>
        );
      }
    }
    
    if (fieldType === 'number') {
      return (
        <Form.Group key={field} className="mb-3">
          <Form.Label>
            <strong>{field.replace(/\./g, ' → ')}</strong>
            <Badge bg="success" className="ms-2">Number</Badge>
          </Form.Label>
          <Form.Control
            type="number"
            value={formData[field] || value}
            onChange={(e) => handleFieldChange(field, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${field.replace(/\./g, ' → ')}`}
          />
        </Form.Group>
      );
    }
    
    if (fieldType === 'boolean') {
      return (
        <Form.Group key={field} className="mb-3">
          <Form.Check
            type="checkbox"
            id={field}
            label={
              <span>
                <strong>{field.replace(/\./g, ' → ')}</strong>
                <Badge bg="warning" className="ms-2">Boolean</Badge>
              </span>
            }
            checked={formData[field] !== undefined ? formData[field] : value}
            onChange={(e) => handleFieldChange(field, e.target.checked)}
          />
        </Form.Group>
      );
    }
    
    // Default fallback
    return (
      <Form.Group key={field} className="mb-3">
        <Form.Label>
          <strong>{field.replace(/\./g, ' → ')}</strong>
          <Badge bg="dark" className="ms-2">{fieldType}</Badge>
        </Form.Label>
        <Form.Control
          type="text"
          value={formData[field] || String(value)}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={`Enter ${field.replace(/\./g, ' → ')}`}
        />
      </Form.Group>
    );
  }

  async function handleSave() {
    try {
      setSaving(true);
      
      // Validate JSON
      let updatedJson;
      try {
        updatedJson = unflattenObject(formData);
        JSON.stringify(updatedJson); // Test if valid JSON
      } catch (error) {
        setJsonError('Invalid JSON structure: ' + error.message);
        setShowJsonModal(true);
        return;
      }
      
      // Upload to Firebase Storage
      const fileName = rrt.name;
      const fileRef = ref(storage, `RRT-JSONS/${fileName}`);
      const jsonBlob = new Blob([JSON.stringify(updatedJson, null, 2)], { type: 'application/json' });
      
      await uploadBytes(fileRef, jsonBlob);
      
      toast.success('RRT updated successfully!');
      navigate('/rrt/list');
      
    } catch (error) {
      console.error('Error saving RRT:', error);
      toast.error('Failed to save RRT: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading RRT data...</p>
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
                  📄 View JSON
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/rrt/list')}
                >
                  ← Back to RRT List
                </Button>
              </div>
            </div>
            <p className="lead">
              {isEditing 
                ? `Editing: ${rrt?.name}` 
                : 'Create a new Ranger Rover Travelcard entry'
              }
            </p>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  {isEditing ? 'Edit RRT Data' : 'RRT Information'}
                </h5>
              </Card.Header>
              <Card.Body>
                <Form>
                  {Object.keys(originalJsonData).length > 0 ? (
                    Object.entries(originalJsonData).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        // Handle nested objects
                        const nestedFields = {};
                        flattenObject(value, nestedFields, key);
                        return Object.entries(nestedFields).map(([nestedKey, nestedValue]) => 
                          renderField(nestedKey, nestedValue)
                        );
                      } else {
                        // Handle simple fields
                        return renderField(key, value);
                      }
                    }).flat()
                  ) : (
                    <Alert variant="info">
                      No RRT data found. Please add some fields to get started.
                    </Alert>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      '💾 Save Changes'
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline-secondary"
                    onClick={() => navigate('/rrt/list')}
                  >
                    ❌ Cancel
                  </Button>
                </div>
                
                {isEditing && (
                  <div className="mt-3">
                    <hr />
                    <h6>File Information</h6>
                    <p className="small text-muted mb-1">
                      <strong>File:</strong> {rrt?.name}
                    </p>
                    <p className="small text-muted mb-1">
                      <strong>Fields:</strong> {Object.keys(formData).length}
                    </p>
                    <p className="small text-muted">
                      <strong>Last Modified:</strong> {new Date().toLocaleDateString()}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* JSON View Modal */}
      <Modal show={showJsonModal} onHide={() => setShowJsonModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>JSON Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {jsonError ? (
            <Alert variant="danger">
              <strong>JSON Error:</strong> {jsonError}
            </Alert>
          ) : (
            <Form.Control
              as="textarea"
              rows={20}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Enter JSON data..."
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowJsonModal(false)}>
            Close
          </Button>
          {!jsonError && (
            <Button 
              variant="primary" 
              onClick={() => {
                try {
                  const parsed = JSON.parse(jsonData);
                  setFormData({});
                  flattenObject(parsed, setFormData);
                  setOriginalJsonData(parsed);
                  setShowJsonModal(false);
                  toast.success('JSON data updated successfully!');
                } catch (error) {
                  setJsonError('Invalid JSON: ' + error.message);
                }
              }}
            >
              Update from JSON
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
