import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Login/LoginForm';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/products" element={<div>Products Page - Coming Soon</div>} />
        <Route path="/orders" element={<div>Orders Page - Coming Soon</div>} />
        <Route path="/customers" element={<div>Customers Page - Coming Soon</div>} />
        <Route path="/reports" element={<div>Reports Page - Coming Soon</div>} />
        <Route path="/users" element={<div>Users Page - Coming Soon</div>} />
        <Route path="/settings" element={<div>Settings Page - Coming Soon</div>} />
        <Route path="/printers" element={<div>Printers Page - Coming Soon</div>} />
        <Route path="/payments" element={<div>Payment Config Page - Coming Soon</div>} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <AppRoutes />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;