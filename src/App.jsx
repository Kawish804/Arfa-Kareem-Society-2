import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../src/components/Toast/ToastProvider';
import { SettingsProvider } from '../src/context/SettingsContext.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import ProtectedRoute from '../src/components/ProtectedRoute.jsx';

// Layouts & Public
import DashboardLayout from '../src/components/DashboardLayout.jsx';
import Home from '../src/pages/Home.jsx';
import StudentPortal from '../src/pages/StudentPortal.jsx';
import Login from '../src/pages/Login.jsx';
import Signup from '../src/pages/Signup.jsx';
import MemberSignup from '../src/pages/MembersSignUp.jsx';
import Contribute from '../src/pages/Contribute.jsx';
import NotFound from '../src/pages/NotFound.jsx';

// Dashboards & Pages
import Dashboard from '../src/pages/Dashboard.jsx';
import Members from '../src/pages/Members.jsx';
import Funds from '../src/pages/Funds.jsx';
import Expenses from '../src/pages/Expenses.jsx';
import Events from '../src/pages/Events.jsx';
import AllRequests from '../src/pages/AllRequests.jsx';
import Requests from '../src/pages/Requests.jsx';
import ParticipantRequests from '../src/pages/ParticipantRequests.jsx';
import FundRequests from '../src/pages/FundRequests.jsx';
import Announcements from '../src/pages/Announcements.jsx';
import Gallery from '../src/pages/Gallery.jsx';
import Reports from '../src/pages/Reports.jsx';
import Settings from '../src/pages/Settings.jsx';
import Participants from '../src/pages/Participants.jsx';
import Chat from '../src/pages/Chat.jsx';
import Notifications from '../src/pages/Notifications.jsx';
import StudentManagement from '../src/pages/StudentManagement.jsx';
import ActivityLog from '../src/pages/ActivityLog.jsx';

// Role-Specific
import CRDashboard from '../src/pages/CRDashboard.jsx';
import JointGSDashboard from '../src/pages/JointGSDashboard.jsx';
import AssistantFinanceDashboard from '../src/pages/AssistantFinanceDashboard.jsx';
import CoMediaDashboard from '../src/pages/CoMediaDashboard.jsx';
import EventManagerDashboard from '../src/pages/EventManagerDashboard.jsx'; // Kept import if needed later
import FinanceSecretaryDashboard from '../src/pages/FinanceSecretaryDashboard.jsx';
import MediaPRDashboard from '../src/pages/MediaPRDashboard.jsx';
import GeneralSecretary from '../src/pages/GeneralSecretaryDashboard.jsx';
import FinanceDashboard from '../src/pages/FinanceDashboard.jsx';

const App = () => (
  <ToastProvider>
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/member-signup" element={<MemberSignup />} />
            <Route path="/contribute" element={<Contribute />} />

            {/* ========================================== */}
            {/* STRICT ROLE DASHBOARDS                     */}
            {/* ========================================== */}


            <Route element={<ProtectedRoute allowedRoles={['Class Representative', 'President']} />}>
              <Route path="/cr-dashboard" element={<CRDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['General Secretary', 'President']} />}>
              <Route path="/gs-dashboard" element={<GeneralSecretary />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Joint General Secretary', 'President']} />}>
              <Route path="/joint-gs-dashboard" element={<JointGSDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Finance Head', 'President']} />}>
              <Route path="/finance-dashboard" element={<FinanceDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Assistant Finance Head', 'President']} />}>
              <Route path="/assistant-finance-dashboard" element={<AssistantFinanceDashboard />} />
            </Route>

            {/* 🔴 FIXED: Was previously 'Media PR' */}
            <Route element={<ProtectedRoute allowedRoles={['Media Manager', 'President']} />}>
              <Route path="/media-pr-dashboard" element={<MediaPRDashboard />} />
            </Route>

            {/* 🔴 FIXED: Was previously 'Co Media' */}
            <Route element={<ProtectedRoute allowedRoles={['Co-Media Manager', 'President']} />}>
              <Route path="/co-media-dashboard" element={<CoMediaDashboard />} />
            </Route>

            {/* ========================================== */}
            {/* PRESIDENT DASHBOARD (The Hub)              */}
            {/* ========================================== */}
            <Route element={<ProtectedRoute allowedRoles={['President']} />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="funds" element={<Funds />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="events" element={<Events />} />
                <Route path="all-requests" element={<AllRequests />} />
                <Route path="requests" element={<Requests />} />
                <Route path="participant-requests" element={<ParticipantRequests />} />
                <Route path="fund-requests" element={<FundRequests />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="participants" element={<Participants />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="studentmanagement" element={<StudentManagement />} />
                <Route path="activity-log" element={<ActivityLog />} />
              </Route>
            </Route>

            {/* ========================================== */}
            {/* SHARED ROUTES (Chat & Notifications)       */}
            {/* ========================================== */}
            {/* 🔴 FIXED: Stripped all old aliases to enforce strict 8 roles (plus basic Student/Member) */}
           <Route element={<ProtectedRoute allowedRoles={[
              'President', 'General Secretary', 'Finance Head', 'Assistant Finance Head',
              'Joint General Secretary', 'Media Manager', 'Co-Media Manager', 'Class Representative',
              'Student'
            ]} />}>
              <Route path="/student" element={<StudentPortal />} /> F
              <Route path="/chat" element={<Chat />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  </ToastProvider>
);

export default App;