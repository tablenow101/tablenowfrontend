import React, { type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080912] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center space-y-3">
              <AlertCircle className="text-red-400" size={36} />
              <p className="text-red-400 font-medium text-sm">Application Error</p>
              <p className="text-xs text-[#555]">{this.state.error?.message || 'An unexpected error occurred'}</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="mt-4 px-4 py-2 bg-[#b8f000] text-black font-semibold rounded-xl hover:opacity-90"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
