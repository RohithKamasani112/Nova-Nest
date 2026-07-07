import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useUrlSync } from '../hooks/useUrlSync';
import type { AppPage } from '../utils/seo';
import { Navbar } from './components/Navbar';
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
import { Phone } from 'lucide-react';
import { WhatsAppIcon } from './components/icons/WhatsAppIcon';
import { WhatsAppContactModal } from './components/WhatsAppContactModal';
import { createLead } from '../services/storageService';
import { PageLoader } from '../components/PageLoader';
import { Footer } from './components/Footer';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { pageTransition } from '../lib/animation';
import { trackPropertyView, trackWhatsAppClick, trackPhoneClick } from '../utils/analytics';

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
    // Single choke point for every property card click across the app.
    trackPropertyView({
      id: property.id,
      title: property.title,
      location: property.location,
      status: property.status,
    });
    setSelectedProperty(property);
    setCurrentPage('property-details');
    // Always land on the image gallery at the top of the detail page, not wherever
    // the user happened to be scrolled in the listing. Instant (not smooth) so the
    // images are the first thing visible.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

  // Keep the URL in sync with the current page/property (real, shareable,
  // crawlable URLs) without changing how anything renders. See useUrlSync.
  const applyRoute = useCallback(
    ({ page, property }: { page: AppPage; property: Property | null }) => {
      if (property) setSelectedProperty(property);
      setCurrentPage(page as Page);
    },
    []
  );
  useUrlSync({ currentPage, selectedProperty, applyRoute });

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onPropertyClick={handlePropertyClick}
            onSearch={handleSearch}
            appReady={!showPageLoader}
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
  handleNavigate,
  handleSearch,
  showPageLoader,
  setShowPageLoader,
  renderPage,
  renderAdminContent,
}) => {
  const { logout, isAuthenticated } = useAuth();
  const reduce = useReducedMotion();
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '919845418570';
  const floatingWhatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi, I am interested in your properties')}`;
  // Capture the visitor's number as a lead before sending them to WhatsApp.
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const submitWhatsappLead = (phone: string) => {
    void createLead({
      propertyId: 'general',
      userId: 'guest',
      name: 'WhatsApp Enquiry',
      email: '',
      phone,
      message: 'WhatsApp enquiry from floating contact button',
      type: 'contact-owner',
    }).catch((error) => {
      console.error('Failed to save WhatsApp lead:', error);
    });
    setShowWhatsappModal(false);
    window.open(floatingWhatsappUrl, '_blank', 'noopener,noreferrer');
  };

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
        <div className="min-h-screen bg-surface">
          <AdminSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={async () => {
              await logout();
              handleNavigate('home');
            }}
          />
          <div className="min-h-screen bg-surface px-3 py-5 pb-12 pt-16 sm:px-5 md:ml-64 md:p-8 md:pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                variants={pageTransition}
                initial={reduce ? false : 'hidden'}
                animate="visible"
                exit={reduce ? undefined : 'exit'}
              >
                {renderAdminContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <>
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={currentPage}
                variants={pageTransition}
                initial={reduce ? false : 'hidden'}
                animate="visible"
                exit={reduce ? undefined : 'exit'}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
          {showNavbar && currentPage !== 'property-details' && (
            <Footer onNavigate={handleNavigate} onSearch={handleSearch} />
          )}
        </>
      )}

      {currentPage === 'home' && (
        <div className="fixed bottom-6 right-4 z-50 flex flex-col items-center gap-3 sm:right-6">
          <motion.a
            href="tel:+919845418570"
            aria-label="Call us"
            onClick={() => trackPhoneClick('floating_button')}
            whileHover={reduce ? undefined : { scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            animate={reduce ? undefined : { y: [0, -4, 0] }}
            transition={reduce ? undefined : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
          >
            <Phone size={22} />
          </motion.a>
          <motion.button
            type="button"
            onClick={() => {
              trackWhatsAppClick('floating_button');
              setShowWhatsappModal(true);
            }}
            aria-label="Contact on WhatsApp"
            whileHover={reduce ? undefined : { scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
            transition={reduce ? undefined : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
          >
            {!reduce && (
              <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />
            )}
            <WhatsAppIcon size={26} className="relative z-10" />
          </motion.button>
        </div>
      )}

      <WhatsAppContactModal
        open={showWhatsappModal}
        onClose={() => setShowWhatsappModal(false)}
        onSubmit={submitWhatsappLead}
      />

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
