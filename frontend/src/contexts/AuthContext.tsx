import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, setAuthToken, getAuthToken, authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Legacy DEMO_USERS removed for security


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    // Generate or retrieve device fingerprint
    let fp = localStorage.getItem('device_fingerprint');
    if (!fp) {
      fp = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('device_fingerprint', fp);
    }
    setFingerprint(fp);

    // Check for existing session
    const token = getAuthToken();
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        setAuthToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<any> => {
    try {
      // Real API call
      const response = await authApi.login(email, password, fingerprint);

      // Handle "Must Change Password" scenario
      if ((response as any).status === 'must_change_password') {
        // Save token AND user so ProtectedRoute allows access to /change-password
        if ((response as any).data?.token) {
          setAuthToken((response as any).data.token);
        }
        if ((response as any).data?.user) {
          localStorage.setItem('user', JSON.stringify((response as any).data.user));
          setUser((response as any).data.user);
        }
        return response; // Return full response for UI to handle redirect
      }

      // Standard Login
      const token = response.data?.token;
      const userData = response.data?.user;

      if (token && userData) {
        setAuthToken(token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return response;
      } else {
        throw new Error('فشل تسجيل الدخول: استجابة غير صالحة من الخادم');
      }

    } catch (error: any) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getProfile();
      const freshUser = response.data?.user;
      if (freshUser) {
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      }
    } catch {
      // If profile fetch fails, keep existing user data
    }
  };

  const logout = () => {
    authApi.logout().catch(console.error); // Best effort logout from server
    setAuthToken(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('must_change_password');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
