
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

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

// Storage keys for local authentication fallback
const USERS_STORAGE_KEY = "hostel_users";
const CURRENT_USER_KEY = "hostel_current_user";

// Helper function to hash password (simplified for demo)
const hashPassword = (password: string): string => {
  // In a real app, use a proper hashing library
  return `hashed_${password}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (currentSession && currentSession.user) {
          // If we have a session, get user profile data from the database
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (error) throw error;

            if (profile) {
              const userData: User = {
                id: currentSession.user.id,
                name: profile.full_name,
                email: currentSession.user.email || '',
                phone: profile.phone_number || '',
                role: profile.role as UserRole,
              };
              setUser(userData);
              setSession(currentSession);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            // Fallback to local storage
            const storedUser = localStorage.getItem(CURRENT_USER_KEY);
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        } else {
          // Clear user data when logged out
          setUser(null);
          setSession(null);
        }
        
        setIsLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession && currentSession.user) {
        // Fetch profile data for the user
        supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error("Error fetching user profile:", error);
              setIsLoading(false);
              return;
            }

            if (profile) {
              const userData: User = {
                id: currentSession.user.id,
                name: profile.full_name,
                email: currentSession.user.email || '',
                phone: profile.phone_number || '',
                role: profile.role as UserRole,
              };
              setUser(userData);
              setSession(currentSession);
            }
            setIsLoading(false);
          });
      } else {
        // Check local storage as fallback
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Try Supabase authentication first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) throw error;
      
      // Authentication successful, profile data is loaded in the onAuthStateChange handler
      
      // Redirect based on role will happen after profile is loaded
      toast.success("Logged in successfully");
    } catch (supabaseError) {
      console.error("Supabase login error:", supabaseError);
      
      // Fall back to local storage authentication for development
      try {
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
        redirectBasedOnRole(userWithoutPassword.role);
        
        toast.success("Logged in successfully (local storage)");
      } catch (localError) {
        toast.error((localError as Error).message);
        throw localError;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (data: SignupData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            role: data.role,
          }
        }
      });
      
      if (authError) throw authError;
      
      // Profile is automatically created via database trigger
      
      // Update phone number if provided
      if (authData.user && data.phone) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ phone_number: data.phone })
          .eq('id', authData.user.id);
          
        if (updateError) console.error("Error updating phone number:", updateError);
      }
      
      toast.success("Account created successfully. Please check your email for verification.");
      
      // Note: We don't auto-login or redirect here since email verification might be required
    } catch (supabaseError) {
      console.error("Supabase signup error:", supabaseError);
      
      // Fall back to local storage for development
      try {
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
        redirectBasedOnRole(data.role);
        
        toast.success("Account created successfully (local storage)");
      } catch (localError) {
        toast.error((localError as Error).message);
        throw localError;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
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
  };

  // Logout function
  const logout = async () => {
    // Try Supabase logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out from Supabase:", error);
    }
    
    // Always clear local state
    setUser(null);
    setSession(null);
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
