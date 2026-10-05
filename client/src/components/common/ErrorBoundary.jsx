import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[UI Render Error]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6 text-center" role="alert">
        <AlertTriangle className="mb-3 h-10 w-10 text-rose-600" />
        <h1 className="text-xl font-bold text-stone-900">This page could not be displayed</h1>
        <p className="mt-2 max-w-md text-sm text-stone-600">Refresh the portal to try again. Your saved account data has not been changed.</p>
        <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Refresh page
        </button>
      </main>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
