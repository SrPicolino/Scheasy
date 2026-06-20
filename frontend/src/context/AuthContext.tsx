import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import API_URL from '../config';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
}

interface AuthContextData {
  token: string | null;
  customer: Customer | null;
  loading: boolean;
  login: (token: string, customerData: Customer) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('customerToken'));
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/customer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomer(res.data);
    } catch (err) {
      setToken(null);
      setCustomer(null);
      localStorage.removeItem('customerToken');
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken: string, customerData: Customer) => {
    localStorage.setItem('customerToken', newToken);
    setToken(newToken);
    setCustomer(customerData);
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    setToken(null);
    setCustomer(null);
  };

  return (
    <AuthContext.Provider value={{ token, customer, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
