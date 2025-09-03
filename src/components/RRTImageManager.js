import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Navbar, Nav, Modal, Image } from 'react-bootstrap';
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function RRTImageManager() {
  const [rrtImages, setRrtImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    loadRRTImages();
  }, []);

  async function loadRRTImages() {
    try {
      const imagesRef = ref(storage, 'RRT-Area-IMGS');
      const result = await listAll(imagesRef);
      
      const imageUrls = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            path: item.fullPath,
            url: url,
            size: item.size || 0,
            updated: item.updated || new Date()
          };
        })
      );
      
      setRrtImages(imageUrls);
    } catch (error) {
      console.error('Error loading RRT images:', error);
      // Try to find images in root storage
      try {
        const rootRef = ref(storage);
        const result = await listAll(rootRef);
        
        const imageFiles = result.items.filter(item => 
          item.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
        );
        
        const imageUrls = await Promise.all(
          imageFiles.map(async (item) => {
            const url = await getDownloadURL(item);
            return {
              name: item.name,
              path: item.fullPath,
              url: url,
              size: item.size || 0,
              updated: item.updated || new Date()
            };
          })
        );
        
        setRrtImages(imageUrls);
      } catch (rootError) {
        console.error('Error loading images from root:', rootError);
        toast.error('Failed to load RRT images');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate name from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setImageName(nameWithoutExt);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !imageName.trim()) {
      toast.error('Please select a file and enter a name');
      return;
    }

    try {
      setUploading(true);
      
      // Create storage reference
      const imageRef = ref(storage, `RRT-Area-IMGS/${imageName.trim()}`);
      
      // Upload file
      await uploadBytes(imageRef, selectedFile);
      
      toast.success('Image uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setImageName('');
      
      // Reload images
      loadRRTImages();
      
    } catch (error) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteImage(imageName) {
    try {
      const imageRef = ref(storage, `RRT-Area-IMGS/${imageName}`);
      await deleteObject(imageRef);
      
      toast.success('Image deleted successfully');
      setShowDeleteModal(false);
      setImageToDelete(null);
      
      // Reload images
      loadRRTImages();
      
    } catch (error) {
      toast.error('Failed to delete image: ' + error.message);
    }
  }

  function confirmDelete(image) {
    setImageToDelete(image);
    setShowDeleteModal(true);
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <p className="mt-2">Loading RRT images...</p>
        </div>
      </Container>
    );
  }

  // Add error boundary for render errors
  try {
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
                <h1>🖼️ RRT Image Management</h1>
                <div>
                  <Button 
                    variant="primary" 
                    className="me-2"
                    onClick={() => setShowUploadModal(true)}
                  >
                    📤 Upload New Image
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/rrt')}
                  >
                    ← Back to RRT Dashboard
                  </Button>
                </div>
              </div>
              <p className="lead">Manage area images for your Ranger Rover Travelcards</p>
            </Col>
          </Row>

          {rrtImages.length === 0 ? (
            <Alert variant="info">
              <h5>No RRT Images Found</h5>
              <p>Upload your first area image to get started!</p>
              <Button 
                variant="primary" 
                onClick={() => setShowUploadModal(true)}
              >
                📤 Upload First Image
              </Button>
            </Alert>
          ) : (
            <Row>
              {rrtImages.map((image, index) => (
                <Col key={index} lg={4} md={6} className="mb-4">
                  <Card>
                    <Card.Img 
                      variant="top" 
                      src={image.url} 
                      alt={image.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <Card.Body>
                      <Card.Title className="text-truncate">{image.name}</Card.Title>
                      <Card.Text className="small text-muted">
                        Size: {formatFileSize(image.size)}
                        <br />
                        Updated: {new Date(image.updated).toLocaleDateString()}
                      </Card.Text>
                      <div className="d-grid gap-2">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => window.open(image.url, '_blank')}
                        >
                          👁️ View Full Size
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          onClick={() => setShowUploadModal(true)}
                        >
                          🔄 Replace
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => confirmDelete(image)}
                        >
                          🗑️ Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>

        {/* Upload Modal */}
        <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>📤 Upload RRT Image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Select Image File</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  required
                />
                <Form.Text className="text-muted">
                  Supported formats: JPG, PNG, GIF, WebP
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Image Name</Form.Label>
                <Form.Control
                  type="text"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="e.g., south-west-area"
                  required
                />
                <Form.Text className="text-muted">
                  This will be the filename in Firebase Storage
                </Form.Text>
              </Form.Group>

              {selectedFile && (
                <Alert variant="info">
                  <strong>Selected File:</strong> {selectedFile.name}
                  <br />
                  <strong>Size:</strong> {formatFileSize(selectedFile.size)}
                  <br />
                  <strong>Type:</strong> {selectedFile.type}
                </Alert>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpload}
              disabled={!selectedFile || !imageName.trim() || uploading}
            >
              {uploading ? 'Uploading...' : '📤 Upload Image'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to delete "{imageToDelete?.name}"?
            <br />
            <strong>This action cannot be undone.</strong>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteImage(imageToDelete?.name)}
            >
              Delete Image
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  } catch (error) {
    console.error('Error rendering RRTImageManager:', error);
    return (
      <Container>
        <div className="text-center py-5">
          <h1>Error Loading RRT Images</h1>
          <p>Failed to load RRT images. Please try again later.</p>
          <Button onClick={loadRRTImages}>Retry</Button>
        </div>
      </Container>
    );
  }
}
