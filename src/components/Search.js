import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('stations');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  async function handleSearch(e) {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      let results = [];

      if (searchType === 'stations') {
        // Search by CRS code first (exact match)
        let q = query(
          collection(db, 'stations'),
          where('crsCode', '==', searchTerm.trim().toUpperCase())
        );
        
        let snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          results.push({ id: doc.id, type: 'station', ...doc.data() });
        });

        // If no exact CRS match, search by station name (contains)
        if (results.length === 0) {
          q = query(
            collection(db, 'stations'),
            orderBy('stationName')
          );
          
          snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.stationNameAlt?.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({ id: doc.id, type: 'station', ...data });
            }
          });
        }
      } else if (searchType === 'operators') {
        // Search operators by name, type, or region
        const q = query(
          collection(db, 'toc_operators'),
          orderBy('name')
        );
        
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.operatortype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.operatorregion?.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({ id: doc.id, type: 'operator', ...data });
          }
        });
      } else if (searchType === 'all') {
        // Search both stations and operators
        // Search stations
        let q = query(
          collection(db, 'stations'),
          where('crsCode', '==', searchTerm.trim().toUpperCase())
        );
        
        let snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          results.push({ id: doc.id, type: 'station', ...doc.data() });
        });

        if (results.length === 0) {
          q = query(
            collection(db, 'stations'),
            orderBy('stationName')
          );
          
          snapshot = await getDocs(q);
          
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.stationNameAlt?.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({ id: doc.id, type: 'station', ...data });
            }
          });
        }

        // Search operators
        q = query(
          collection(db, 'toc_operators'),
          orderBy('name')
        );
        
        snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.operatortype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              data.operatorregion?.toLowerCase().includes(searchTerm.toLowerCase())) {
            results.push({ id: doc.id, type: 'operator', ...data });
          }
        });
      }

      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info(`No ${searchType === 'all' ? 'results' : searchType} found matching your search`);
      } else {
        const stationCount = results.filter(r => r.type === 'station').length;
        const operatorCount = results.filter(r => r.type === 'operator').length;
        
        if (searchType === 'all') {
          toast.success(`Found ${stationCount} station(s) and ${operatorCount} operator(s)`);
        } else if (searchType === 'stations') {
          toast.success(`Found ${results.length} station(s)`);
        } else {
          toast.success(`Found ${results.length} operator(s)`);
        }
      }
      
    } catch (error) {
      toast.error('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function viewStation(crsCode) {
    navigate(`/station/${crsCode}`);
  }

  function editStation(crsCode) {
    navigate(`/edit-station/${crsCode}`);
  }

  function viewOperator(operatorId) {
    navigate(`/operator/${operatorId}`);
  }

  function editOperator(operatorId) {
    navigate(`/edit-operator/${operatorId}`);
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

  return (
    <>
      <Header activeSection="search" showSearch={false} />

      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <h1>🔍 Search Database</h1>
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/dashboard')}
              >
                ← Back to Dashboard
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="mb-4">
          <Col md={8} lg={6}>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Search Options</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Form.Group className="mb-3">
                    <Form.Label>Search Type</Form.Label>
                    <Form.Select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      disabled={loading}
                    >
                      <option value="stations">🚉 Stations Only</option>
                      <option value="operators">🚄 Train Operators Only</option>
                      <option value="all">🔍 All (Stations & Operators)</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Search Term</Form.Label>
                    <Form.Control
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={
                        searchType === 'stations' 
                          ? "Enter station name or CRS code..." 
                          : searchType === 'operators'
                          ? "Enter operator name, type, or region..."
                          : "Enter station name, CRS code, operator name, etc..."
                      }
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      {searchType === 'stations' && "Search by station name or 3-letter CRS code"}
                      {searchType === 'operators' && "Search by operator name, type, or operating region"}
                      {searchType === 'all' && "Search stations by name/CRS code or operators by name/type/region"}
                    </Form.Text>
                  </Form.Group>
                  
                  <div className="d-grid">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading || !searchTerm.trim()}
                    >
                      {loading ? 'Searching...' : '🔍 Search'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4} lg={6}>
            <Card>
              <Card.Header>
                <h6 className="mb-0">ℹ️ Search Tips</h6>
              </Card.Header>
              <Card.Body>
                <ul className="small">
                  <li><strong>Stations:</strong> Search by CRS code (exact 3-letter match) or station name (partial)</li>
                  <li><strong>Operators:</strong> Search by name, operator type, or operating region</li>
                  <li><strong>All:</strong> Search both stations and operators simultaneously</li>
                  <li><strong>Case Insensitive:</strong> Search works regardless of capitalization</li>
                </ul>
                
                <Alert variant="info" className="mt-3">
                  <strong>Tip:</strong> Use specific terms for better results. CRS codes give exact station matches.
                </Alert>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {hasSearched && (
          <Row>
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    Search Results ({searchResults.length})
                    {searchTerm && (
                      <span className="text-muted ms-2">
                        for "{searchTerm}"
                      </span>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" role="status">
                        <span className="visually-hidden">Searching...</span>
                      </Spinner>
                      <p className="mt-2">Searching {searchType === 'all' ? 'database' : searchType}...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <Alert variant="info">
                      No {searchType === 'all' ? 'results' : searchType} found matching "{searchTerm}". Try a different search term.
                    </Alert>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Name</th>
                          <th>Details</th>
                          <th>Additional Info</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((result) => (
                          <tr key={result.id}>
                            <td>
                              <Badge bg={result.type === 'station' ? 'primary' : 'warning'}>
                                {result.type === 'station' ? '🚉 Station' : '🚄 Operator'}
                              </Badge>
                            </td>
                            <td>
                              <strong>
                                {result.type === 'station' ? result.stationName : result.name}
                              </strong>
                            </td>
                            <td>
                              {result.type === 'station' ? (
                                <Badge bg="secondary">{result.crsCode}</Badge>
                              ) : (
                                <div>
                                  <Badge bg="info" className="me-1">{result.operatortype || 'N/A'}</Badge>
                                  <Badge bg="secondary">{result.operatorregion || 'N/A'}</Badge>
                                </div>
                              )}
                            </td>
                            <td>
                              {result.type === 'station' ? (
                                result.location ? (
                                  <small>
                                    {result.location.latitude?.toFixed(4)}, {result.location.longitude?.toFixed(4)}
                                  </small>
                                ) : (
                                  <small className="text-muted">No coordinates</small>
                                )
                              ) : (
                                result.colorHex ? (
                                  <div className="d-flex align-items-center">
                                    <div 
                                      style={{
                                        width: '16px',
                                        height: '16px',
                                        backgroundColor: result.colorHex,
                                        border: '1px solid #ddd',
                                        borderRadius: '3px',
                                        marginRight: '6px'
                                      }}
                                    ></div>
                                    <small>{result.colorHex}</small>
                                  </div>
                                ) : (
                                  <small className="text-muted">No brand color</small>
                                )
                              )}
                            </td>
                            <td>
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                className="me-2"
                                onClick={() => result.type === 'station' 
                                  ? viewStation(result.crsCode) 
                                  : viewOperator(result.id)
                                }
                              >
                                👁️ View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-warning"
                                onClick={() => result.type === 'station' 
                                  ? editStation(result.crsCode) 
                                  : editOperator(result.id)
                                }
                              >
                                ✏️ Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
}
