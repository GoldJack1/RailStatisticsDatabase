import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Alert, Spinner, Badge } from 'react-bootstrap';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';

export default function AllOperators() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const operatorsPerPage = 20;

  useEffect(() => {
    loadOperators();
  }, []);

  async function loadOperators() {
    try {
      setLoading(true);
      
      let q = query(
        collection(db, 'toc_operators'),
        orderBy('name'),
        limit(operatorsPerPage)
      );

      if (lastDoc) {
        q = query(
          collection(db, 'toc_operators'),
          orderBy('name'),
          startAfter(lastDoc),
          limit(operatorsPerPage)
        );
      }

      const snapshot = await getDocs(q);
      const newOperators = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        newOperators.push({
          id: doc.id,
          ...data
        });
      });

      if (lastDoc) {
        setOperators(prev => [...prev, ...newOperators]);
      } else {
        setOperators(newOperators);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === operatorsPerPage);
      
    } catch (error) {
      toast.error('Failed to load operators: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    // For now, just filter existing operators
    // In a real app, you'd implement server-side search
  }

  function filteredOperators() {
    if (!searchTerm) return operators;
    
    return operators.filter(operator => 
      operator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.operatortype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.operatorregion?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  function loadMore() {
    if (hasMore && !loading) {
      loadOperators();
    }
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
      <Header activeSection="operators" />

      <Container>
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1>🚄 All Train Operators</h1>
                <p className="text-muted">
                  Showing {filteredOperators().length} operator{filteredOperators().length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button 
                variant="success" 
                onClick={() => navigate('/add-operator')}
              >
                ➕ Add New Operator
              </Button>
            </div>
          </Col>
        </Row>

        {/* Search Form */}
        <Row className="mb-4">
          <Col lg={6}>
            <Card>
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Row>
                    <Col>
                      <Form.Control
                        type="text"
                        placeholder="Search by operator name, type, or region..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button type="submit" variant="primary">
                        🔍 Search
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Operators Table */}
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">🚄 Train Operators</h5>
              </Card.Header>
              <Card.Body>
                {loading && operators.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p className="mt-2">Loading operators...</p>
                  </div>
                ) : filteredOperators().length === 0 ? (
                  <Alert variant="info">
                    <Alert.Heading>No operators found</Alert.Heading>
                    <p>No train operators match your search criteria.</p>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => navigate('/add-operator')}
                    >
                      Add the first operator
                    </Button>
                  </Alert>
                ) : (
                  <div className="table-responsive">
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Operator Name</th>
                          <th>Type</th>
                          <th>Region</th>
                          <th>Brand Color</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOperators().map((operator) => (
                          <tr key={operator.id}>
                            <td>
                              <strong>{operator.name}</strong>
                            </td>
                            <td>
                              <Badge bg="primary">{operator.operatortype || 'N/A'}</Badge>
                            </td>
                            <td>
                              <Badge bg="secondary">{operator.operatorregion || 'N/A'}</Badge>
                            </td>
                            <td>
                              {operator.colorHex ? (
                                <div className="d-flex align-items-center">
                                  <div 
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: operator.colorHex,
                                      border: '1px solid #ddd',
                                      borderRadius: '3px',
                                      marginRight: '8px'
                                    }}
                                  ></div>
                                  <span className="small">{operator.colorHex}</span>
                                </div>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group" role="group" size="sm">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => viewOperator(operator.id)}
                                >
                                  👁️ View
                                </Button>
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() => editOperator(operator.id)}
                                >
                                  ✏️ Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Load More Button */}
                {hasMore && !loading && filteredOperators().length > 0 && (
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary" 
                      onClick={loadMore}
                    >
                      Load More Operators
                    </Button>
                  </div>
                )}

                {loading && operators.length > 0 && (
                  <div className="text-center mt-3">
                    <Spinner animation="border" size="sm" />
                    <span className="ms-2">Loading more operators...</span>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">⚡ Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <Button 
                      variant="success" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/add-operator')}
                    >
                      ➕ Add Operator
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
                      variant="primary" 
                      className="w-100 mb-2"
                      onClick={() => navigate('/stations')}
                    >
                      🚉 View Stations
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
