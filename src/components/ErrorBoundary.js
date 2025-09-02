import React from 'react';
import { Container, Alert, Button } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>🚨 Something went wrong</Alert.Heading>
            <p>
              An error occurred while loading this page. This might be due to:
            </p>
            <ul>
              <li>Network connectivity issues</li>
              <li>Firebase configuration problems</li>
              <li>JavaScript errors in the component</li>
            </ul>
            <hr />
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Error Details:</strong>
                <pre className="mt-2 small">
                  {this.state.error && this.state.error.toString()}
                </pre>
              </div>
              <Button 
                variant="outline-danger" 
                onClick={() => window.location.reload()}
              >
                🔄 Reload Page
              </Button>
            </div>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
