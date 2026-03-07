import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../src/components/Toast/ToastProvider.jsx';
import DashboardLayout from '../src/components/DashboardLayout.jsx'
import Home from '../src/pages/Home.jsx';
import StudentPortal from '../src/pages/StudentPortal.jsx';
import Login from '../src/pages/Login.jsx';
import Dashboard from '../src/pages/Dashboard.jsx';
import Members from '../src/pages/Members.jsx';
import Funds from '../src/pages/Funds.jsx';
import Expenses from '../src/pages/Expenses.jsx';
import Events from '../src/pages/Events.jsx';
import Requests from '../src/pages/Requests.jsx';
import Announcements from '../src/pages/Announcements.jsx';
import Gallery from '../src/pages/Gallery.jsx';
import Reports from '../src/pages/Reports.jsx';
import Settings from '../src/pages/Settings.jsx';
import Signup from '../src/pages/Signup.jsx';
import NotFound from '../src/pages/NotFound.jsx';

const App = () => (
  <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student" element={<StudentPortal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="funds" element={<Funds />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="events" element={<Events />} />
          <Route path="requests" element={<Requests />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ToastProvider>
);

export default App;
