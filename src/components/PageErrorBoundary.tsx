import React from 'react';
export class PageErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center">
      <h1 className="mb-3 font-serif text-2xl">This page could not be loaded</h1>
      <p className="mb-5 text-sm text-gray-500">Check your connection and reload. Saved searches and property drafts remain in this browser.</p>
      <button type="button" onClick={() => window.location.reload()} className="premium-button px-5 py-3">Reload page</button>
    </div>;
    return this.props.children;
  }
}
