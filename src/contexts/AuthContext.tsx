import { createContext, useContext, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

// Define the AuthContext type
interface AuthContextType {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string;
  } | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (
    name: string,
    email: string,
    password: string,
    role: string,
    phone_number?: string
  ) => Promise<{ success: boolean; error?: any }>;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  updateUser: () => Promise<void>;
}

// Create the AuthContext with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: false,
  signup: async () => ({ success: false, error: "Not implemented" }),
  login: async () => ({ success: false, error: "Not implemented" }),
  logout: async () => {},
  updateUser: async () => {},
});

// Create an AuthProvider component
interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        setIsAuthenticated(true);
        
        // Fetch user data from the 'profiles' table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile data:", profileError);
        } else if (profileData) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData.full_name || 'Unknown User',
            role: profileData.role || 'student',
            phone: profileData.phone_number || '',
          });
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };
    
    fetchSession();
    
    // Set up listener for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session) {
        setIsAuthenticated(true);
        
        // Fetch user data from the 'profiles' table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile data:", profileError);
        } else if (profileData) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData.full_name || 'Unknown User',
            role: profileData.role || 'student',
            phone: profileData.phone_number || '',
          });
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });
  }, []);
  
  const signup = async (
    name: string,
    email: string,
    password: string,
    role: string,
    phone_number?: string
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role,
            phone_number
          },
        }
      });
      
      if (authError) {
        setLoading(false);
        return { success: false, error: authError };
      }
      
      if (authData.user) {
        // Update profile with phone number separately
        if (phone_number) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ phone_number })
            .eq('id', authData.user.id);
            
          if (profileError) {
            console.error("Error updating profile with phone number:", profileError);
          }
        }
        
        // Set the user
        setUser({
          id: authData.user.id,
          email: authData.user.email || '',
          name: name,
          role: role,
          phone: phone_number || '',
        });
        
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: new Error("User registration failed") };
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: any }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoading(false);
        return { success: false, error };
      }
      if (data.user) {
        // Fetch user data from the 'profiles' table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile data:", profileError);
        } else if (profileData) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: profileData.full_name || 'Unknown User',
            role: profileData.role || 'student',
            phone: profileData.phone_number || '',
          });
        }
        setLoading(false);
        return { success: true };
      } else {
        setLoading(false);
        return { success: false, error: new Error("User login failed") };
      }
    } catch (error) {
      setLoading(false);
      return { success: false, error };
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateUser = async (): Promise<void> => {
    const session = await supabase.auth.getSession();
    
    if (session.data.session) {
      setIsAuthenticated(true);
      
      // Fetch user data from the 'profiles' table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.data.session.user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile data:", profileError);
      } else if (profileData) {
        setUser({
          id: session.data.session.user.id,
          email: session.data.session.user.email || '',
          name: profileData.full_name || 'Unknown User',
          role: profileData.role || 'student',
          phone: profileData.phone_number || '',
        });
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        loading,
        signup,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook to use the AuthContext
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
