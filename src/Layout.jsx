import React from 'react';

export default function Layout({ children, currentPageName }) {
  // No layout wrapper needed for landing page
  if (currentPageName === 'Home') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}