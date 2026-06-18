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
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { Property, PropertyFilters } from '../types';
import { Toaster } from 'react-hot-toast';
import { Phone, MessageCircle } from 'lucide-react';
import { PageLoader } from '../components/PageLoader';
import { Footer } from './components/Footer';

type Page =
  | 'home'
  | 'properties'
  | 'property-details'
  | 'admin-login'
  | 'about'
  | 'contact'
  | 'dashboard'
  | 'add-property'
  | 'manage-properties'
  | 'leads'
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({});
  const [showPageLoader, setShowPageLoader] = useState(true);

  const handleNavigate = (page: string) => {
    if (page === 'properties') {
      setPropertyFilters({});
    }
    if (page === 'add-property') {
      setEditingProperty(null);
    }
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

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setCurrentPage('add-property');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;

      case 'contact':
        return <ContactPage />;

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
        return <AdminPage onNavigate={handleNavigate} editingProperty={editingProperty} />;
      case 'manage-properties':
        return <ManagePropertiesPage onEditProperty={handleEditProperty} />;
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
        showPageLoader={showPageLoader}
        setShowPageLoader={setShowPageLoader}
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
  showPageLoader: boolean;
  setShowPageLoader: (show: boolean) => void;
  renderPage: () => React.ReactNode;
  renderAdminContent: () => React.ReactNode;
}> = ({
  currentPage,
  showNavbar,
  isAdminPage,
  showMobileNav,
  handleNavigate,
  handleSearch,
  showPageLoader,
  setShowPageLoader,
  renderPage,
  renderAdminContent,
}) => {
  const { logout, isAuthenticated } = useAuth();
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919845418570';
  const floatingWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi, I am interested in your properties')}`;

  // Auth guard for admin pages
  if (isAdminPage && !isAuthenticated) {
    handleNavigate('admin-login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showPageLoader && <PageLoader onDone={() => setShowPageLoader(false)} />}

      {!isAdminPage && (
        <Navbar
          onNavigate={handleNavigate}
          onSearch={handleSearch}
          currentPage={currentPage}
        />
      )}

      {isAdminPage ? (
        <div className="min-h-screen bg-[#F8F6F1]">
          <AdminSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={async () => {
              await logout();
              handleNavigate('home');
            }}
          />
          <div className="min-h-screen bg-[#F8F6F1] p-4 pb-24 md:ml-64 md:p-8">
            <div key={currentPage} className="animate-[fadeUp_0.4s_ease-out]">
              {renderAdminContent()}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div key={currentPage} className="animate-[fadeUp_0.4s_ease-out]">
            {renderPage()}
          </div>
          {showNavbar && currentPage !== 'property-details' && (
            <Footer onNavigate={handleNavigate} onSearch={handleSearch} />
          )}
          {showMobileNav && (
            <MobileBottomNav
              currentPage={currentPage}
              onNavigate={handleNavigate}
              isAuthenticated={isAuthenticated}
            />
          )}
        </>
      )}

      {!isAdminPage && currentPage !== 'admin-login' && (
        <div className="fixed bottom-6 right-5 z-50 flex flex-col items-center gap-3 sm:right-6">
          <a
            href="tel:+919845418570"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#C9922A] text-white shadow-lg transition-transform duration-200 hover:scale-110"
            aria-label="Call us"
          >
            <Phone size={22} />
          </a>
          <a
            href={floatingWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-110"
            aria-label="Contact on WhatsApp"
          >
            <MessageCircle size={23} />
          </a>
        </div>
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
