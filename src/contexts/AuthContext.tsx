
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error) throw error;
      
      toast.success("Logged in successfully");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
      throw error;
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
      
      // Update phone number if provided
      if (authData.user && data.phone) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ phone_number: data.phone })
          .eq('id', authData.user.id);
          
        if (updateError) console.error("Error updating phone number:", updateError);
      }
      
      toast.success("Account created successfully");
      
      // Auto-login after signup for better user experience
      if (authData.user) {
        // Profile will be fetched by the auth listener
        setUser({
          id: authData.user.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role
        });
        
        // Redirect based on role
        redirectBasedOnRole(data.role);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
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
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
      return;
    }
    
    setUser(null);
    setSession(null);
    
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
