import { PageErrorBoundary } from '../components/PageErrorBoundary';
import { writePropertySearch } from '../utils/propertySearchState';
import React, { lazy, Suspense, useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useUrlSync } from '../hooks/useUrlSync';
import type { AppPage } from '../utils/seo';
import { Navbar } from './components/Navbar';
import { AdminSidebar } from './components/AdminSidebar';
import { HomePage } from '../pages/HomePage';
const PropertiesPage = lazy(() => import('../pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const PropertyDetailsPage = lazy(() => import('../pages/PropertyDetailsPage').then(m => ({ default: m.PropertyDetailsPage })));
const SalesHomePage = lazy(() => import('../pages/SalesHomePage').then(m => ({ default: m.SalesHomePage })));
const SalesLeadsPage = lazy(() => import('../pages/SalesLeadsPage').then(m => ({ default: m.SalesLeadsPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import('../pages/AdminPage').then(m => ({ default: m.AdminPage })));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const ManagePropertiesPage = lazy(() => import('../pages/ManagePropertiesPage').then(m => ({ default: m.ManagePropertiesPage })));
const CrmPage = lazy(() => import('../pages/crm/CrmPage').then(m => ({ default: m.CrmPage })));
const GenerateBillPage = lazy(() => import('../pages/GenerateBillPage').then(m => ({ default: m.GenerateBillPage })));
const SharePropertiesPage = lazy(() => import('../pages/SharePropertiesPage').then(m => ({ default: m.SharePropertiesPage })));
const AboutPage = lazy(() => import('../pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('../pages/ContactPage').then(m => ({ default: m.ContactPage })));
const ServicesPage = lazy(() => import('../pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const LocalityPage = lazy(() => import('../pages/LocalityPage').then(m => ({ default: m.LocalityPage })));
const BlogListPage = lazy(() => import('../pages/BlogListPage').then(m => ({ default: m.BlogListPage })));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
import { Property, PropertyFilters } from '../types';
import { Toaster } from 'react-hot-toast';
import { Instagram, Phone, X, Youtube } from 'lucide-react';
import { WhatsAppIcon } from './components/icons/WhatsAppIcon';
import { WhatsAppContactModal } from './components/WhatsAppContactModal';
import { createLead } from '../services/storageService';
import { PageLoader } from '../components/PageLoader';
import { Footer } from './components/Footer';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { pageTransition } from '../lib/animation';
import { trackPropertyView, trackWhatsAppClick, trackPhoneClick, trackSocialClick } from '../utils/analytics';
import { BUSINESS_WHATSAPP_NUMBER } from '../utils/siteSettings';
const INSTAGRAM_URL = 'https://www.instagram.com/nova_nest_rentals?igsh=MXVxbHowcmQwNzZiNg%3D%3D';
const YOUTUBE_URL = 'https://www.youtube.com/@novanestrentals';

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
  | 'crm'
  | 'generate-bill'
  | 'share-properties'
  | 'sales-home'
  | 'sales-leads'
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyFilters, setPropertyFilters] = useState<PropertyFilters>({});
  // Pre-fill for Share Properties when opened from a CRM lead's drawer —
  // mirrors the existing editingProperty pattern used for add-property.
  const [shareContext, setShareContext] = useState<{ clientName?: string; clientPhone?: string; leadId?: string } | null>(null);
  const handleShareFromLead = (clientName: string, clientPhone: string | null, leadId: string) => {
    setShareContext({ clientName, clientPhone: clientPhone ?? undefined, leadId });
    setCurrentPage('share-properties');
  };
  // Content slug for locality / blog-post pages (null for everything else).
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showPageLoader, setShowPageLoader] = useState(() => window.location.pathname === '/' && !sessionStorage.getItem('nova-visited'));

  // `slug` carries the locality / blog-post identifier for those pages. Every
  // other navigation clears it so a stale slug can never leak into the URL.
  const handleNavigate = (page: string, slug?: string | null) => {
    if (!window.dispatchEvent(new Event('nova-before-navigate', { cancelable: true }))) return;
    if (page === 'properties') {
      sessionStorage.removeItem('nova-browse-query'); sessionStorage.removeItem('nova-browse-scroll');
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
    sessionStorage.setItem('nova-browse-query', writePropertySearch(filters, '', 'newest'));
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
  const isAdminPage = ['dashboard', 'add-property', 'manage-properties', 'leads', 'crm', 'generate-bill', 'share-properties', 'settings', 'sales-home', 'sales-leads'].includes(currentPage);

  const renderAdminContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      case 'add-property':
        return <AdminPage onNavigate={handleNavigate} editingProperty={editingProperty} />;
      case 'manage-properties':
        return <ManagePropertiesPage onEditProperty={handleEditProperty} />;
      case 'leads':
        return <CrmPage onShareProperties={handleShareFromLead} />;
      case 'crm':
        return <CrmPage onShareProperties={handleShareFromLead} />;
      case 'generate-bill':
        return <GenerateBillPage />;
      case 'share-properties':
        return (
          <SharePropertiesPage
            initialClientName={shareContext?.clientName}
            initialClientPhone={shareContext?.clientPhone}
            leadId={shareContext?.leadId}
            onShared={() => setShareContext(null)}
          />
        );
      case 'sales-home': return <SalesHomePage onNavigate={handleNavigate} />;
      case 'sales-leads': return <SalesLeadsPage onNavigate={handleNavigate} />;
      case 'settings': return <SettingsPage />;
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
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const isCrmOnly = user?.role !== 'admin';
  useEffect(() => {
    if (authLoading || !isAdminPage) return;
    if (!isAuthenticated) handleNavigate('admin-login');
    else if (isCrmOnly && currentPage !== 'crm') handleNavigate('crm');
  }, [authLoading, isAuthenticated, isAdminPage, isCrmOnly, currentPage]);
  const reduce = useReducedMotion();
  const floatingWhatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi, I am interested in your properties')}`;
  // Capture the visitor's number as a lead before sending them to WhatsApp.
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showContactOptions, setShowContactOptions] = useState(false);
  // The homepage hero is tall enough (min-h-680px+) that on short viewports
  // the fixed floating contact button can visually overlap the hero's search
  // bar / chips row. Only reveal it once the visitor has scrolled a bit there,
  // rather than trying to guess a "safe" pixel offset for every screen size.
  // Every other (non-admin) page shows it immediately.
  const [showFloatingContact, setShowFloatingContact] = useState(false);
  useEffect(() => {
    if (currentPage !== 'home') {
      setShowFloatingContact(true);
      return;
    }
    const handleScroll = () => setShowFloatingContact(window.scrollY > 280);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);
  const submitWhatsappLead = async (phone: string) => {
    const chat = window.open('about:blank', '_blank');
    if (chat) chat.opener = null;
    try { await createLead({
      propertyId: 'general',
      userId: 'guest',
      name: 'WhatsApp Enquiry',
      email: '',
      phone,
      message: 'WhatsApp enquiry from floating contact button',
      type: 'contact-owner',
    });
    setShowWhatsappModal(false);
    if (chat) chat.location.href = floatingWhatsappUrl; else window.location.href = floatingWhatsappUrl;
    } catch (error) { chat?.close(); throw error; }
  };

  // Auth guard for admin pages. Session restore (getCurrentAuthUser reading
  // localStorage) is async, so on a fresh page refresh isAuthenticated is
  // briefly false before authLoading flips to false — redirecting on that
  // transient state would kick an already-logged-in admin straight back out
  // to the login page every time they reload.
  if (isAdminPage && (authLoading || !isAuthenticated || (isCrmOnly && currentPage !== 'crm'))) {
    return <div className="p-6">Loading your workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:p-3 focus:text-primary">Skip to content</a>
      {showPageLoader && <PageLoader onDone={() => { sessionStorage.setItem('nova-visited', '1'); setShowPageLoader(false); }} />}

      {!isAdminPage && (
        <Navbar
          onNavigate={handleNavigate}
          onSearch={handleSearch}
          currentPage={currentPage}
        />
      )}

      {isAdminPage ? (
        <div className="min-h-screen bg-surface">
          {!isCrmOnly && <AdminSidebar
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={async () => {
              await logout();
              handleNavigate('home');
            }}
          />}
          <div className={isCrmOnly ? 'min-h-screen bg-surface px-3 py-5 sm:px-5' : `${currentPage === 'crm' ? 'crm-admin-content' : 'bg-surface'} min-h-screen px-3 py-5 pb-12 pt-16 sm:px-5 md:ml-64 md:p-8 md:pt-8`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                variants={pageTransition}
                initial={reduce ? false : 'hidden'}
                animate="visible"
                exit={reduce ? undefined : 'exit'}
              >
                <main id="main-content" tabIndex={-1}><PageErrorBoundary key={currentPage}><Suspense fallback={<div role="status" className="p-8 text-gray-500">Loading workspace...</div>}>{renderAdminContent()}</Suspense></PageErrorBoundary></main>
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
                <main id="main-content" tabIndex={-1}><PageErrorBoundary key={currentPage}><Suspense fallback={<div role="status" className="min-h-[40vh] p-8 text-center text-gray-500">Loading page...</div>}>{renderPage()}</Suspense></PageErrorBoundary></main>
              </motion.div>
            </AnimatePresence>
          </LayoutGroup>
          {showNavbar && currentPage !== 'property-details' && (
            <Footer onNavigate={handleNavigate} onSearch={handleSearch} />
          )}
        </>
      )}

      <AnimatePresence>
      {!isAdminPage && showFloatingContact && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`fixed right-4 z-50 flex flex-col items-center sm:right-6 ${
            // The property page has its own full-width sticky WhatsApp bar on
            // mobile — sit above it there instead of overlapping it.
            currentPage === 'property-details' ? 'bottom-24 lg:bottom-6' : 'bottom-6'
          }`}
        >
          {/* Social — always visible, looping gifs (not gated behind the
              call/WhatsApp expand toggle) so they stay noticeable on every page.
              Built from a real icon + text label (not a flattened image) so
              icon size, padding, vertical alignment and gaps are each
              independently controllable. */}
          {/* Sized at ~70% of the original pill (icon/padding/text all scaled
              down together) so proportions stay the same, just smaller. */}
          <div className={`hidden flex-col items-center gap-[6px] sm:flex ${currentPage !== 'property-details' ? 'mb-[11px]' : ''}`}>
            <motion.a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Nova Nest on Instagram"
              onClick={() => trackSocialClick('Instagram', INSTAGRAM_URL)}
              whileHover={reduce ? undefined : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-[6px] rounded-full bg-gradient-to-r from-[#4f1d7a] to-[#1a0e2e] py-[7px] pl-[7px] pr-[11px] shadow-lg"
            >
              <span className="relative flex h-[31px] w-[31px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]">
                {!reduce && (
                  <span className="absolute inset-0 rounded-full bg-[#d62976] opacity-60 animate-ping" />
                )}
                <Instagram size={15} className="relative text-white" />
              </span>
              <span className="whitespace-nowrap text-[10px] font-semibold leading-none text-white">
                @NovaNest
              </span>
            </motion.a>
            <motion.a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Subscribe to Nova Nest on YouTube"
              onClick={() => trackSocialClick('YouTube', YOUTUBE_URL)}
              whileHover={reduce ? undefined : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-[6px] rounded-full bg-black py-[7px] pl-[7px] pr-[11px] shadow-lg"
            >
              <span className="relative flex h-[31px] w-[31px] flex-shrink-0 items-center justify-center rounded-full bg-[#FF0000]">
                {!reduce && (
                  <span className="absolute inset-0 rounded-full bg-[#FF0000] opacity-60 animate-ping" />
                )}
                <Youtube size={15} className="relative text-white" />
              </span>
              <span className="whitespace-nowrap text-[10px] font-semibold leading-none text-white">
                @NovaNest
              </span>
            </motion.a>
          </div>

          {/* The property details page already has its own dedicated WhatsApp
              CTA (sidebar + sticky mobile bar) — showing this one too would be
              a redundant second WhatsApp entry point on that page, so it's
              skipped there. Instagram/YouTube above are unaffected. */}
          {currentPage !== 'property-details' && (
            <>
              <AnimatePresence>
                {showContactOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.9 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="mb-3 flex flex-col items-center gap-3"
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
            </>
          )}
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
