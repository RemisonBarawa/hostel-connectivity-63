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
      (event, currentSession) => {
        if (currentSession && currentSession.user) {
          // If we have a session, get user profile data from the database
          // Use setTimeout to defer Supabase calls and prevent deadlocks
          setSession(currentSession);
          
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentSession.user.id)
                .single();
  
              if (error) throw error;
  
              if (profile) {
                // Ensure we always have the email from the auth user
                const userData: User = {
                  id: currentSession.user.id,
                  name: profile.full_name,
                  email: currentSession.user.email || '',
                  phone: profile.phone_number || '',
                  role: validateUserRole(profile.role),
                };
                setUser(userData);
              }
            } catch (error) {
              console.error("Error fetching user profile:", error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          // Clear user data when logged out
          setUser(null);
          setSession(null);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (currentSession && currentSession.user) {
          // Fetch profile data for the user
          setSession(currentSession);
          
          return supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
        }
        setIsLoading(false);
        return { data: null, error: null };
      })
      .then(({ data: profile, error }) => {
        if (error) {
          console.error("Error fetching user profile:", error);
          setIsLoading(false);
          return;
        }

        if (profile && session) {
          // Ensure we always have the email from the auth user
          const userData: User = {
            id: session.user.id,
            name: profile.full_name,
            email: session.user.email || '',
            phone: profile.phone_number || '',
            role: validateUserRole(profile.role),
          };
          setUser(userData);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error getting session:", error);
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper function to validate user role
  const validateUserRole = (role: string): UserRole => {
    const validRoles: UserRole[] = ["student", "owner", "admin"];
    return validRoles.includes(role as UserRole) 
      ? role as UserRole 
      : "student"; // Default to student if invalid role
  };

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
      
      // Redirect will happen automatically due to auth state change
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
      setIsLoading(false); // Make sure to reset loading state on error
      throw error;
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
      
      if (authData.user) {
        // Explicitly update the profile with phone number directly after signup
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            phone_number: data.phone 
          })
          .eq('id', authData.user.id);
          
        if (updateError) {
          console.error("Error updating phone number:", updateError);
          toast.error("Account created but phone number could not be saved");
        } else {
          toast.success("Account created successfully");
        }
        
        // Set user state
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
      setIsLoading(false); // Make sure to reset loading state on error
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
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
      
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLoading(false);
    }
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
