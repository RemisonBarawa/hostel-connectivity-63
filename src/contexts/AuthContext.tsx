
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type UserRole = "student" | "owner" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock database for demo purposes
const USERS_STORAGE_KEY = "hostel_users";
const CURRENT_USER_KEY = "hostel_current_user";

// Helper function to hash password (simplified for demo)
const hashPassword = (password: string): string => {
  // In a real app, use a proper hashing library
  return `hashed_${password}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get users from local storage
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      const users: Record<string, User & { password: string }> = usersJson ? JSON.parse(usersJson) : {};
      
      // Find user by email
      const foundUser = Object.values(users).find(
        u => u.email === credentials.email && u.password === hashPassword(credentials.password)
      );
      
      if (!foundUser) {
        throw new Error("Invalid email or password");
      }
      
      // Remove password before storing in state
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      
      // Store current user in localStorage
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      
      // Redirect based on role
      switch (userWithoutPassword.role) {
        case "student":
          navigate("/student-dashboard");
          break;
        case "owner":
          navigate("/owner-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
      }
      
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (data: SignupData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get users from local storage
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      const users: Record<string, User & { password: string }> = usersJson ? JSON.parse(usersJson) : {};
      
      // Check if email already exists
      if (Object.values(users).some(u => u.email === data.email)) {
        throw new Error("Email already exists");
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashPassword(data.password),
        role: data.role,
      };
      
      // Add to users store
      users[newUser.id] = newUser;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      
      // Login the user
      const { password, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      
      // Store current user in localStorage
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      
      // Redirect based on role
      switch (data.role) {
        case "student":
          navigate("/student-dashboard");
          break;
        case "owner":
          navigate("/owner-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
      }
      
      toast.success("Account created successfully");
    } catch (error) {
      toast.error((error as Error).message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    navigate("/");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
