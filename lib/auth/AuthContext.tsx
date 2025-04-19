// lib/auth/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // In a real app, you would call your API to check auth status
        const userData = localStorage.getItem("user");
        
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Authentication error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, you would call your API to authenticate
      // const response = await fetch("/api/login", {...})
      
      // Mock successful login
      const mockUser = {
        id: "1",
        email,
        name: "Amministratore",
        role: "admin",
      };
      
      // Save to localStorage for demo purposes
      // In a real app, you would rely on secure HTTP-only cookies
      localStorage.setItem("user", JSON.stringify(mockUser));
      
      setUser(mockUser);
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would call your API to logout
      // await fetch("/api/logout", {...})
      
      // Clear localStorage
      localStorage.removeItem("user");
      
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}