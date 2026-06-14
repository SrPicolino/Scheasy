import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookingFlow from './pages/BookingFlow';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Evaluation from './pages/Evaluation';
import ClientProfile from './pages/ClientProfile';

function App() {
  const isAuthenticated = () => !!localStorage.getItem('adminToken');

  return (
    <Router>
      <Routes>
        {/* Public Booking Flow */}
        <Route path="/" element={<BookingFlow />} />
        
        {/* Client Area */}
        <Route path="/my-account" element={<ClientProfile />} />
        
        {/* Evaluation Page */}
        <Route path="/evaluate/:appointmentId" element={<Evaluation />} />

        {/* Admin Login */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard */}
        <Route 
          path="/admin" 
          element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* Redirect any unknown route to booking */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
