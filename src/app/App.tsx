import React, { useState, useCallback, useEffect } from 'react';
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
import { GenerateBillPage } from '../pages/GenerateBillPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { ServicesPage } from '../pages/ServicesPage';
import { LocalityPage } from '../pages/LocalityPage';
import { BlogListPage } from '../pages/BlogListPage';
import { BlogPostPage } from '../pages/BlogPostPage';
import { Property, PropertyFilters } from '../types';
import { Toaster } from 'react-hot-toast';
import { Phone, X } from 'lucide-react';
import { WhatsAppIcon } from './components/icons/WhatsAppIcon';
import { WhatsAppContactModal } from './components/WhatsAppContactModal';
import { createLead } from '../services/storageService';
import { PageLoader } from '../components/PageLoader';
import { Footer } from './components/Footer';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { pageTransition } from '../lib/animation';
import { trackPropertyView, trackWhatsAppClick, trackPhoneClick } from '../utils/analytics';
import { BUSINESS_WHATSAPP_NUMBER } from '../utils/siteSettings';

type Page =
  | 'home'
  | 'properties'
  | 'property-details'
  | 'admin-login'
  | 'about'
  | 'contact'
  | 'services'
  | 'locality'
  | 'blog'
  | 'blog-post'
  | 'dashboard'
  | 'add-property'
  | 'manage-properties'
  | 'leads'
  | 'generate-bill'
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({});
  // Content slug for locality / blog-post pages (null for everything else).
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showPageLoader, setShowPageLoader] = useState(true);

  // `slug` carries the locality / blog-post identifier for those pages. Every
  // other navigation clears it so a stale slug can never leak into the URL.
  const handleNavigate = (page: string, slug?: string | null) => {
    if (page === 'properties') {
      setPropertyFilters({});
    }
    if (page === 'add-property') {
      setEditingProperty(null);
    }
    setActiveSlug(slug ?? null);
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
    ({
      page,
      property,
      slug,
    }: {
      page: AppPage;
      property: Property | null;
      slug?: string | null;
    }) => {
      if (property) setSelectedProperty(property);
      setActiveSlug(slug ?? null);
      setCurrentPage(page as Page);
    },
    []
  );
  useUrlSync({ currentPage, selectedProperty, activeSlug, applyRoute });

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onPropertyClick={handlePropertyClick}
            onSearch={handleSearch}
            onNavigate={handleNavigate}
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
            onNavigate={handleNavigate}
          />
        );

      case 'admin-login':
        return <LoginPage onNavigate={handleNavigate} />;

      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;

      case 'contact':
        return <ContactPage />;

      case 'services':
        return <ServicesPage onNavigate={handleNavigate} />;

      case 'locality':
        return <LocalityPage slug={activeSlug} onNavigate={handleNavigate} />;

      case 'blog':
        return <BlogListPage onNavigate={handleNavigate} />;

      case 'blog-post':
        return <BlogPostPage slug={activeSlug} onNavigate={handleNavigate} />;

      default:
        return (
          <HomePage
            onPropertyClick={handlePropertyClick}
            onSearch={handleSearch}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  const showNavbar = currentPage !== 'admin-login' && currentPage !== 'property-details';
  const isAdminPage = ['dashboard', 'add-property', 'manage-properties', 'leads', 'generate-bill', 'settings'].includes(currentPage);

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
      case 'generate-bill':
        return <GenerateBillPage />;
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
  const { logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const reduce = useReducedMotion();
  const floatingWhatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I am interested in your properties')}`;
  // Capture the visitor's number as a lead before sending them to WhatsApp.
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  // The homepage hero is tall enough (min-h-680px+) that on short viewports
  // the fixed floating contact button can visually overlap the hero's search
  // bar / chips row. Only reveal it once the visitor has scrolled a bit,
  // rather than trying to guess a "safe" pixel offset for every screen size.
  const [showFloatingContact, setShowFloatingContact] = useState(false);
  useEffect(() => {
    if (currentPage !== 'home') return;
    const handleScroll = () => setShowFloatingContact(window.scrollY > 280);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);
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

  // Auth guard for admin pages. Session restore (getCurrentAuthUser reading
  // localStorage) is async, so on a fresh page refresh isAuthenticated is
  // briefly false before authLoading flips to false — redirecting on that
  // transient state would kick an already-logged-in admin straight back out
  // to the login page every time they reload.
  if (isAdminPage && !authLoading && !isAuthenticated) {
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

      <AnimatePresence>
      {currentPage === 'home' && showFloatingContact && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-6 right-4 z-50 flex flex-col items-center gap-3 sm:right-6"
        >
          <AnimatePresence>
            {showContactOptions && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.9 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3"
              >
                <motion.a
                  href="tel:+919845418570"
                  aria-label="Call us"
                  onClick={() => trackPhoneClick('floating_button')}
                  whileHover={reduce ? undefined : { scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"
                >
                  <Phone size={20} />
                </motion.a>
                <motion.button
                  type="button"
                  onClick={() => {
                    trackWhatsAppClick('floating_button');
                    setShowWhatsappModal(true);
                    setShowContactOptions(false);
                  }}
                  aria-label="Contact on WhatsApp"
                  whileHover={reduce ? undefined : { scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
                >
                  <WhatsAppIcon size={20} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => setShowContactOptions((v) => !v)}
            aria-label={showContactOptions ? 'Close contact options' : 'Contact us'}
            aria-expanded={showContactOptions}
            whileHover={reduce ? undefined : { scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            animate={reduce || showContactOptions ? undefined : { scale: [1, 1.08, 1] }}
            transition={reduce || showContactOptions ? undefined : { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
          >
            {!reduce && !showContactOptions && (
              <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />
            )}
            <span className="relative z-10">
              {showContactOptions ? <X size={24} /> : <WhatsAppIcon size={26} />}
            </span>
          </motion.button>
        </motion.div>
      )}
      </AnimatePresence>

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
