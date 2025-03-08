import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { getRoleBasedDashboard } from './utils/roleRoutes';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
 
// Pages
import LoginPage from './pages/Login/Login';
import UserManagement from './pages/UserManagement/UserManagement';
import Unauthorized from './pages/Unauthorized';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import SecurityGuardDashboard from './pages/dashboard/SecurityGuardDashboard';
import SupervisorDashboard from './pages/dashboard/SupervisorDashboard';
import UserDashboard from './pages/dashboard/UserDashboard';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';


// Background Pages
import NewBackground from './pages/background/NewBackground';
import UpdateBackground from './pages/background/UpdateBackground';
import InternshipOverview from './pages/background/InternshipOverview';

// GuardShift Pages
import GuardShiftForm from './pages/guardshift/GuardShiftForm';
import GuardShiftReport from './pages/report/GuardShiftReport';


// Contact Page
import Contact from './pages/Contact';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role?.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const AuthenticatedLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />
    <main className="pt-10 pb-10">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={user ? <Navigate to={getRoleBasedDashboard(user.role)} replace /> : <LoginPage />} />

      {/* Dashboard routes */}
      <Route path="/admindashboard" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/securityguarddashboard" element={<ProtectedRoute requiredRoles={['admin','security_guard']}><AuthenticatedLayout><SecurityGuardDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/supervisordashboard" element={<ProtectedRoute requiredRoles={['admin','supervisor']}><AuthenticatedLayout><SupervisorDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/userdashboard" element={<ProtectedRoute requiredRoles={['admin','user', 'user1', 'user2']}><AuthenticatedLayout><UserDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/managerdashboard" element={<ProtectedRoute requiredRoles={['admin','manager']}><AuthenticatedLayout><ManagerDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* Background Check routes */}
      <Route path="/newbackground" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><NewBackground /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/internshipoverview" element={<ProtectedRoute requiredRoles={['admin','user']}><AuthenticatedLayout><InternshipOverview /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/updatebackground" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><UpdateBackground /></AuthenticatedLayout></ProtectedRoute>} />

      {/* User Management routes */}
      <Route path="/user-management" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><UserManagement /></AuthenticatedLayout></ProtectedRoute>} />

     {/* GuardShift  routes */}
     <Route path="/GuardShiftForm" element={<ProtectedRoute requiredRoles={['admin', 'security_guard', 'supervisor']}><AuthenticatedLayout><GuardShiftForm /></AuthenticatedLayout></ProtectedRoute>} />
     <Route path="/GuardShiftReport" element={<ProtectedRoute requiredRoles={['admin', 'supervisor']}><AuthenticatedLayout><GuardShiftReport /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* Contact route */}
      <Route path="/contact" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><Contact /></AuthenticatedLayout></ProtectedRoute>} />

      

      {/* Root route redirect */}
      <Route path="/" element={<Navigate to={user ? getRoleBasedDashboard(user.role) : "/login"} replace />} />

      {/* Unauthorized and catch-all routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/unauthorized" replace />} />
    </Routes>
  );
};

export default App;
