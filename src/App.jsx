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

// Role-Specific
import CRDashboard from '../src/pages/CRDashboard.jsx';
import JointGSDashboard from '../src/pages/JointGSDashboard.jsx';
import AssistantFinanceDashboard from '../src/pages/AssistantFinanceDashboard.jsx';
import CoMediaDashboard from '../src/pages/CoMediaDashboard.jsx'; 
import EventManagerDashboard from '../src/pages/EventManagerDashboard.jsx';
import FinanceSecretaryDashboard from '../src/pages/FinanceSecretaryDashboard.jsx';
import MediaPRDashboard from '../src/pages/MediaPRDashboard.jsx';
import GeneralSecretary from '../src/pages/GeneralSecretaryDashboard.jsx';

const App = () => (
  <ToastProvider>
    <SettingsProvider>
      <AuthProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<StudentPortal />} />
            <Route path="/home" element={<Home />} /> 
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/member-signup" element={<MemberSignup />} />
            <Route path="/contribute" element={<Contribute />} />

            {/* Note: 'President' now grants ultimate access instead of 'Admin' */}
            <Route element={<ProtectedRoute allowedRoles={['CR', 'President']} />}>
              <Route path="/cr-dashboard" element={<CRDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['General Secretary', 'President']} />}>
              <Route path="/gs-dashboard" element={<GeneralSecretary />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Joint GS', 'President']} />}>
              <Route path="/joint-gs-dashboard" element={<JointGSDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Finance Secretary', 'Finance Manager', 'President']} />}>
              <Route path="/finance-dashboard" element={<FinanceSecretaryDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Assistant Finance', 'President']} />}>
              <Route path="/assistant-finance-dashboard" element={<AssistantFinanceDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Event Manager', 'Event Coordinator', 'President']} />}>
              <Route path="/event-manager-dashboard" element={<EventManagerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Media PR', 'President']} />}>
              <Route path="/media-pr-dashboard" element={<MediaPRDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Co Media', 'President']} />}>
              <Route path="/co-media-dashboard" element={<CoMediaDashboard />} />
            </Route>

            {/* PRESIDENT DASHBOARD (The Hub) */}
            <Route element={<ProtectedRoute allowedRoles={['President']} />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="members" element={<Members />} />
                <Route path="funds" element={<Funds />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="events" element={<Events />} />
                <Route path="requests" element={<Requests />} />
                <Route path="participant-requests" element={<ParticipantRequests />} />
                <Route path="fund-requests" element={<FundRequests />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="participants" element={<Participants />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="studentmanagement" element={<StudentManagement />} />
              </Route>
              <Route path="/chat" element={<Chat />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  </ToastProvider>
);

export default App;