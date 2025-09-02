import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Navbar, Nav, Badge } from 'react-bootstrap';
import { ref, listAll, getDownloadURL, getBytes } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function RRTDashboard() {
  const [rrtData, setRrtData] = useState([]);
  const [rrtImages, setRrtImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [corsError, setCorsError] = useState(false);
  const [failedFiles, setFailedFiles] = useState([]);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  async function testJSONReading() {
    try {
      console.log('🧪 Testing basic JSON reading using direct byte reading...');

      // Try to read a simple JSON file first using direct byte reading
      const testRef = ref(storage, 'index.json');
      const bytes = await getBytes(testRef);
      console.log('📏 index.json file size:', bytes.length, 'bytes');

      const text = new TextDecoder().decode(bytes);
      console.log('📄 index.json content (first 500 chars):', text.substring(0, 500));
      console.log('📏 Total length:', text.length);

      // Try to parse it
      try {
        const parsed = JSON.parse(text);
        console.log('✅ Successfully parsed index.json:', parsed);
      } catch (parseError) {
        console.error('❌ Failed to parse index.json:', parseError);
        console.log('🔍 Raw content:', text);
      }

    } catch (error) {
      console.error('❌ Error reading test file:', error);
      console.log('💡 This might be normal if index.json doesn\'t exist');
    }
  }

  useEffect(() => {
    loadRRTData();
    loadRRTImages();
    testJSONReading(); // Add this test
  }, []);

  async function loadRRTData() {
    try {
      setCorsError(false);
      setFailedFiles([]); // Clear failed files on new load
      console.log('🔍 Starting to load RRT data...');

      // Read from Firebase Storage - RRT JSON files
      const rrtStorageRef = ref(storage, 'RRT-JSONS');
      console.log('📁 Looking in RRT-JSONS folder...');

      const result = await listAll(rrtStorageRef);
      console.log(`📊 Found ${result.items.length} items in RRT-JSONS folder:`, result.items.map(item => item.name));

      const rrtFiles = await Promise.all(
        result.items.map(async (item) => {
          try {
            console.log(`📄 Processing file: ${item.name}`);

            // Use direct byte reading (avoids CORS issues)
            const bytes = await getBytes(item);
            console.log(`📏 File size: ${bytes.length} bytes`);

            const jsonText = new TextDecoder().decode(bytes);
            console.log(`📝 Raw text (first 200 chars):`, jsonText.substring(0, 200));

            const jsonData = JSON.parse(jsonText);
            console.log(`✅ Successfully parsed JSON for ${item.name}:`, jsonData);

            return {
              name: item.name,
              path: item.fullPath,
              data: jsonData,
              size: item.size || 0,
              updated: item.updated || new Date()
            };
          } catch (error) {
            console.error(`❌ Error parsing JSON from ${item.name}:`, error);
            
            // Check if it's a CORS error
            if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
              setCorsError(true);
              console.error('🚨 CORS error detected - bucket needs CORS configuration');
            }
            
            // Track failed files for debugging
            const failedFile = {
              name: item.name,
              path: item.fullPath,
              error: error.message,
              size: item.size || 0
            };
            setFailedFiles(prev => [...prev, failedFile]);
            
            console.error(`🔍 Error details:`, {
              message: error.message,
              stack: error.stack,
              fileName: item.name
            });
            return null;
          }
        })
      );

      // Filter out any failed parses and set the data
      const validRRTs = rrtFiles.filter(rrt => rrt !== null);
      console.log(`🎯 Successfully loaded ${validRRTs.length} out of ${result.items.length} RRT files`);
      
      if (validRRTs.length === 0 && result.items.length > 0) {
        setCorsError(true);
      }
      
      setRrtData(validRRTs);

    } catch (error) {
      console.error('❌ Error loading RRT data from Storage:', error);
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('Access-Control-Allow-Origin')) {
        setCorsError(true);
        console.error('🚨 CORS error detected - bucket needs CORS configuration');
      }

      // If RRT-JSONS folder doesn't exist, try the root storage
      try {
        console.log('🔄 Trying root storage as fallback...');
        const rootRef = ref(storage);
        const result = await listAll(rootRef);
        console.log(`📊 Found ${result.items.length} total items in root storage:`, result.items.map(item => item.name));

        // Look for JSON files in root
        const jsonFiles = result.items.filter(item =>
          item.name.endsWith('.json') &&
          !item.name.includes('firebase') &&
          !item.name.includes('config')
        );
        console.log(`📄 Found ${jsonFiles.length} JSON files in root:`, jsonFiles.map(item => item.name));

        const rrtFiles = await Promise.all(
          jsonFiles.map(async (item) => {
            try {
              console.log(`📄 Processing root file: ${item.name}`);

              const bytes = await getBytes(item);
              const jsonText = new TextDecoder().decode(bytes);
              const jsonData = JSON.parse(jsonText);

              console.log(`✅ Successfully parsed root JSON for ${item.name}:`, jsonData);

              return {
                name: item.name,
                path: item.fullPath,
                data: jsonData,
                size: item.size || 0,
                updated: item.updated || new Date()
              };
            } catch (error) {
              console.error(`❌ Error parsing JSON from ${item.name}:`, error);
              
              // Check if it's a CORS error
              if (error.message.includes('CORS') || error.message.includes('Access-Control-Origin')) {
                setCorsError(true);
                console.error('🚨 CORS error detected - bucket needs CORS configuration');
              }
              
              // Track failed files for debugging
              const failedFile = {
                name: item.name,
                path: item.fullPath,
                error: error.message,
                size: item.size || 0
              };
              setFailedFiles(prev => [...prev, failedFile]);
              
              return null;
            }
          })
        );

        const validRRTs = rrtFiles.filter(rrt => rrt !== null);
        console.log(`🎯 Successfully loaded ${validRRTs.length} out of ${jsonFiles.length} root JSON files`);
        
        if (validRRTs.length === 0 && jsonFiles.length > 0) {
          setCorsError(true);
        }
        
        setRrtData(validRRTs);

      } catch (rootError) {
        console.error('❌ Error loading from root storage:', rootError);
        
        // Check if it's a CORS error
        if (rootError.message.includes('CORS') || rootError.message.includes('Access-Control-Allow-Origin')) {
          setCorsError(true);
          console.error('🚨 CORS error detected - bucket needs CORS configuration');
        }
        
        toast.error('Failed to load RRT data from Storage');
      }
    }
  }

  async function loadRRTImages() {
    try {
      setLoading(true);
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleRetry = () => {
    setCorsError(false);
    loadRRTData();
  };

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
              <h1>🎫 RRT Management</h1>
              <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </Button>
            </div>
            <p className="lead">Manage Ranger Rover Travelcard data and images</p>
          </Col>
        </Row>

        {/* CORS Error Alert */}
        {corsError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>⚠️ CORS Configuration Required</Alert.Heading>
            <p>
              The RRT JSON files are not loading due to CORS (Cross-Origin Resource Sharing) configuration issues 
              on your Firebase Storage bucket. This is a common issue that requires server-side configuration.
            </p>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>To fix this:</strong>
                <ol className="mb-0 mt-2">
                  <li>Install Google Cloud SDK: <a href="https://cloud.google.com/sdk/docs/install" target="_blank" rel="noopener noreferrer">Download here</a></li>
                  <li>Run: <code>gcloud auth login</code></li>
                  <li>Run: <code>python upload_cors.py</code> (from the project root)</li>
                  <li>Wait 2-3 minutes for changes to take effect</li>
                </ol>
              </div>
              <Button variant="outline-warning" onClick={handleRetry}>
                🔄 Retry
              </Button>
            </div>
          </Alert>
        )}

        {/* Failed Files Debug Section */}
        {failedFiles.length > 0 && (
          <Alert variant="info" className="mb-4">
            <Alert.Heading>🔍 Debug: Failed Files ({failedFiles.length})</Alert.Heading>
            <p>
              The following {failedFiles.length} files failed to parse. This explains why you're seeing {rrtData.length} out of {rrtData.length + failedFiles.length} total files.
            </p>
            <div className="mt-3">
              <h6>Failed Files:</h6>
              <div className="list-group">
                {failedFiles.map((file, index) => (
                  <div key={index} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{file.name}</strong>
                        <br />
                        <small className="text-muted">
                          Path: {file.path} | Size: {file.size} bytes
                        </small>
                      </div>
                      <Badge bg="danger" className="ms-2">
                        {file.error.length > 50 ? file.error.substring(0, 50) + '...' : file.error}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <hr />
            <small className="text-muted">
              💡 These files may have invalid JSON syntax, encoding issues, or other parsing problems.
            </small>
          </Alert>
        )}

        <Row>
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  📊 RRT Data Files
                  <Badge bg="primary" className="ms-2">{rrtData.length}</Badge>
                </h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading RRT data...</p>
                  </div>
                ) : rrtData.length > 0 ? (
                  <div>
                    <p className="text-success">✅ Successfully loaded {rrtData.length} RRT files</p>
                    <div className="list-group">
                      {rrtData.slice(0, 5).map((rrt, index) => (
                        <div key={index} className="list-group-item">
                          <h6 className="mb-1">{rrt.name}</h6>
                          <small className="text-muted">
                            Size: {rrt.size} bytes | 
                            Updated: {rrt.updated.toLocaleDateString()}
                          </small>
                        </div>
                      ))}
                      {rrtData.length > 5 && (
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            ... and {rrtData.length - 5} more files
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted">No RRT data files found</p>
                    {corsError && (
                      <small className="text-warning">
                        This may be due to CORS configuration issues
                      </small>
                    )}
                  </div>
                )}
                <div className="mt-3">
                  <Button 
                    variant="outline-primary" 
                    onClick={() => {
                      console.log('View All RRTs card button clicked');
                      navigate('/rrt/list');
                    }}
                    className="me-2"
                  >
                    View All RRTs
                  </Button>
                  <Button 
                    variant="success" 
                    onClick={() => {
                      console.log('Add New RRT card button clicked');
                      navigate('/rrt-form');
                    }}
                  >
                    Add New RRT
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-4">
            <Card>
              <Card.Header>
                <h5 className="mb-0">
                  🖼️ RRT Area Images
                  <Badge bg="info" className="ms-2">{rrtImages.length}</Badge>
                </h5>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading images...</p>
                  </div>
                ) : rrtImages.length > 0 ? (
                  <div>
                    <p className="text-success">✅ Successfully loaded {rrtImages.length} images</p>
                    <div className="row">
                      {rrtImages.slice(0, 4).map((img, index) => (
                        <div key={index} className="col-6 mb-2">
                          <img 
                            src={img.url} 
                            alt={img.name}
                            className="img-fluid rounded"
                            style={{ maxHeight: '100px', objectFit: 'cover' }}
                          />
                          <small className="d-block text-muted text-truncate">
                            {img.name}
                          </small>
                        </div>
                      ))}
                    </div>
                    {rrtImages.length > 4 && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          ... and {rrtImages.length - 4} more images
                        </small>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted">No RRT area images found</p>
                  </div>
                )}
                <div className="mt-3">
                  <Button 
                    variant="outline-info" 
                    onClick={() => navigate('/rrt-images')}
                  >
                    Manage Images
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">🚀 Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="primary" 
                      className="w-100"
                      onClick={() => {
                        console.log('Add New RRT Quick Action button clicked');
                        navigate('/rrt-form');
                      }}
                    >
                      ➕ Add New RRT
                    </Button>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="secondary" 
                      className="w-100"
                      onClick={() => {
                        console.log('View All RRTs Quick Action button clicked');
                        navigate('/rrt/list');
                      }}
                    >
                      📋 View All RRTs
                    </Button>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="info" 
                      className="w-100"
                      onClick={() => {
                        console.log('Manage Images Quick Action button clicked');
                        navigate('/rrt/images');
                      }}
                    >
                      🖼️ Manage Images
                    </Button>
                  </Col>
                  <Col md={3} className="mb-2">
                    <Button 
                      variant="success" 
                      className="w-100"
                      onClick={() => {
                        console.log('Back to Dashboard Quick Action button clicked');
                        navigate('/dashboard');
                      }}
                    >
                      🏠 Back to Dashboard
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
