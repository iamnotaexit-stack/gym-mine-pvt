import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // If a chunk fails to load (often happens after a new deployment), reload the page automatically
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error?.message.includes('Failed to fetch dynamically imported module')) {
        return <div style={{ padding: '20px', color: 'white', backgroundColor: '#dc2626' }}>Updating app version...</div>;
      }
      
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: 'black' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px', background: 'white', color: 'black', border: 'none', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
