import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../src/components/Toast/ToastProvider';
import { SettingsProvider } from '../src/context/SettingsContext.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx'; // <-- IMPORT AUTH PROVIDER
import ProtectedRoute from '../src/components/ProtectedRoute.jsx'; // <-- IMPORT THE GUARD

import DashboardLayout from '../src/components/DashboardLayout.jsx';
import Home from '../src/pages/Home.jsx';
import StudentPortal from '../src/pages/StudentPortal.jsx';
import Login from '../src/pages/Login.jsx';
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
import Signup from '../src/pages/Signup.jsx';
import MemberSignup from '../src/pages/MembersSignUp.jsx';
import CRDashboard from '../src/pages/CRDashboard.jsx';
import Chat from '../src/pages/Chat.jsx';
import Contribute from '../src/pages/Contribute.jsx';
import Notifications from '../src/pages/Notifications.jsx';
import NotFound from '../src/pages/NotFound.jsx';

const App = () => (
  <ToastProvider>
    <SettingsProvider>
      <AuthProvider> {/* <-- WRAP APP IN AUTH PROVIDER */}
        <BrowserRouter>
          <Routes>
            {/* ========================================== */}
            {/* PUBLIC ROUTES (Anyone can access)          */}
            {/* ========================================== */}
            {/* Setting path="/" ensures Student Portal is the default landing page */}
            <Route path="/" element={<StudentPortal />} />
            <Route path="/home" element={<Home />} /> 
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/member-signup" element={<MemberSignup />} />
            <Route path="/contribute" element={<Contribute />} />

            {/* ========================================== */}
            {/* CR ONLY ROUTES                             */}
            {/* ========================================== */}
            <Route element={<ProtectedRoute allowedRoles={['CR', 'Admin']} />}>
              <Route path="/cr-dashboard" element={<CRDashboard />} />
            </Route>

            {/* ========================================== */}
            {/* ADMIN ONLY ROUTES (The whole Dashboard)    */}
            {/* ========================================== */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              {/* Anything inside here requires the 'Admin' role */}
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
              </Route>
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