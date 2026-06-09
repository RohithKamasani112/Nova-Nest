import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminSidebar } from './components/AdminSidebar';
import { HomePage } from '../pages/HomePage';
import { PropertiesPage } from '../pages/PropertiesPage';
import { PropertyDetailsPage } from '../pages/PropertyDetailsPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminPage } from '../pages/AdminPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { ManagePropertiesPage } from '../pages/ManagePropertiesPage';
import { LeadsManagementPage } from '../pages/LeadsManagementPage';
import { Property, PropertyFilters } from '../types';
import { Toaster } from 'react-hot-toast';

type Page =
  | 'home'
  | 'properties'
  | 'property-details'
  | 'admin-login'
  | 'dashboard'
  | 'add-property'
  | 'manage-properties'
  | 'leads'
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({});

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setCurrentPage('property-details');
  };

  const handleSearch = (filters: PropertyFilters) => {
    setPropertyFilters(filters);
    setCurrentPage('properties');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onPropertyClick={handlePropertyClick}
            onSearch={handleSearch}
          />
        );

      case 'properties':
        return (
          <PropertiesPage
            onPropertyClick={handlePropertyClick}
            initialFilters={propertyFilters}
          />
        );

      case 'property-details':
        return selectedProperty ? (
          <PropertyDetailsPage
            property={selectedProperty}
            onClose={() => setCurrentPage('properties')}
            onPropertyClick={handlePropertyClick}
          />
        ) : (
          <HomePage
            onPropertyClick={handlePropertyClick}
            onSearch={handleSearch}
          />
        );

      case 'admin-login':
        return <LoginPage onNavigate={handleNavigate} />;

      default:
        return (
          <HomePage
            onPropertyClick={handlePropertyClick}
            onSearch={handleSearch}
          />
        );
    }
  };

  const showNavbar = currentPage !== 'admin-login' && currentPage !== 'property-details';
  const isAdminPage = ['dashboard', 'add-property', 'manage-properties', 'leads', 'settings'].includes(currentPage);
  const showMobileNav = showNavbar && !isAdminPage;

  const renderAdminContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      case 'add-property':
        return <AdminPage onNavigate={handleNavigate} editingProperty={null} />;
      case 'manage-properties':
        return <ManagePropertiesPage onNavigate={handleNavigate} />;
      case 'leads':
        return <LeadsManagementPage onNavigate={handleNavigate} />;
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Configure your application settings</p>
          </div>
        );
      default:
        return <AdminDashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <AppContent
        currentPage={currentPage}
        showNavbar={showNavbar}
        isAdminPage={isAdminPage}
        showMobileNav={showMobileNav}
        handleNavigate={handleNavigate}
        handleSearch={handleSearch}
        renderPage={renderPage}
        renderAdminContent={renderAdminContent}
      />
    </AuthProvider>
  );
}

// Separate component to use auth context
const AppContent: React.FC<{
  currentPage: Page;
  showNavbar: boolean;
  isAdminPage: boolean;
  showMobileNav: boolean;
  handleNavigate: (page: string) => void;
  handleSearch: (filters: PropertyFilters) => void;
  renderPage: () => React.ReactNode;
  renderAdminContent: () => React.ReactNode;
}> = ({
  currentPage,
  showNavbar,
  isAdminPage,
  showMobileNav,
  handleNavigate,
  handleSearch,
  renderPage,
  renderAdminContent,
}) => {
  const { logout, isAuthenticated } = useAuth();

  // Auth guard for admin pages
  if (isAdminPage && !isAuthenticated) {
    handleNavigate('admin-login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && !isAdminPage && (
        <Navbar
          onNavigate={handleNavigate}
          onSearch={handleSearch}
          currentPage={currentPage}
        />
      )}

      {isAdminPage ? (
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={async () => {
              await logout();
              handleNavigate('home');
            }}
          />
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {renderAdminContent()}
          </div>
        </div>
      ) : (
        <>
          {renderPage()}
          {showMobileNav && (
            <MobileBottomNav
              currentPage={currentPage}
              onNavigate={handleNavigate}
              isAuthenticated={isAuthenticated}
            />
          )}
        </>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;