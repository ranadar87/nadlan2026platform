import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OnboardingRedirect from '@/components/OnboardingRedirect';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Scrape from './pages/Scrape';
import Campaigns from './pages/Campaigns';
import CampaignNew from './pages/CampaignNew';
import Reports from './pages/Reports';
import Credits from './pages/Credits';
import Settings from './pages/Settings';
import CampaignLog from './pages/CampaignLog';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import Billing from './pages/Billing';
import LandingPage from './pages/LandingPage';
import PaymentPlansManager from './pages/admin/PaymentPlansManager';
import Pricing from './pages/Pricing';
import Checkout from './pages/Checkout';
import PurchaseSuccess from './pages/PurchaseSuccess';
import SubscriptionDashboard from './pages/SubscriptionDashboard';
import UserManagement from './pages/admin/UserManagement';
import CreditManagement from './pages/admin/CreditManagement';
import SiteSettings from './pages/admin/SiteSettings';
import AutomationManagement from './pages/admin/AutomationManagement';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <OnboardingRedirect>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/purchase-success" element={<PurchaseSuccess />} />
      
      {/* Authenticated routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/scrape" element={<Scrape />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<CampaignNew />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/campaigns/log" element={<CampaignLog />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/credits" element={<CreditManagement />} />
        <Route path="/admin/settings" element={<SiteSettings />} />
        <Route path="/admin/automations" element={<AutomationManagement />} />
        <Route path="/admin/payment-plans" element={<PaymentPlansManager />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/subscription" element={<SubscriptionDashboard />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
    </OnboardingRedirect>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App