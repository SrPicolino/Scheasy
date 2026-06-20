import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import BookingFlow from './pages/BookingFlow';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import ClientProfile from './pages/ClientProfile';

function App() {
  const isAuthenticated = () => !!localStorage.getItem('adminToken');

  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <Router>
        <Routes>
          {/* Client Area (before slug to avoid collision) */}
          <Route path="/my-account" element={<ClientProfile />} />
          
          {/* Evaluation Page (before slug) */}
          <Route path="/evaluate/:appointmentId" element={<Evaluation />} />

          {/* Admin Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Dashboard */}
          <Route 
            path="/admin" 
            element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} 
          />

          {/* Default: redirect to a demo slug */}
          <Route path="/" element={<Navigate to="/demo" />} />

          {/* Public Booking Flow - Dynamic slug per barbershop (e.g. /barbearia-do-ze) */}
          {/* This MUST be last to avoid swallowing other routes */}
          <Route path="/:slug" element={<BookingFlow />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
