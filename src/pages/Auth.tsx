
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { getFormErrors } from "../utils/validation";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";

type Mode = "login" | "signup";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, isLoading, isAuthenticated } = useAuth();
  
  // Parse query parameters
  const searchParams = new URLSearchParams(location.search);
  const defaultMode = searchParams.get("mode") as Mode || "login";
  const defaultRole = searchParams.get("role") as UserRole || "student";
  
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: defaultRole,
  });
  
  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);
  
  // Update URL when mode changes
  useEffect(() => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("mode", mode);
    
    const newSearch = newParams.toString();
    const newUrl = `${location.pathname}?${newSearch}`;
    
    // Replace state instead of push to avoid adding to history
    window.history.replaceState({}, "", newUrl);
  }, [mode, location.pathname, location.search]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };
  
  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value as UserRole,
    });
  };
  
  const validateForm = () => {
    if (mode === "login") {
      // Only validate email and password for login
      const loginData = {
        email: formData.email,
        password: formData.password,
      };
      const newErrors = getFormErrors(loginData);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } else {
      // Validate all fields for signup
      const newErrors = getFormErrors(formData);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    try {
      if (mode === "login") {
        await login({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await signup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        });
      }
    } catch (error) {
      // Error is already displayed via toast in the auth context
      console.error("Authentication error:", error);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-lg shadow-lg rounded-2xl border border-border p-6 md:p-8">
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft size={16} className="mr-1" />
                Back to home
              </Link>
              
              <h1 className="text-2xl font-semibold">
                {mode === "login" ? "Welcome Back" : "Create Your Account"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {mode === "login" 
                  ? "Sign in to your account to continue" 
                  : "Join HostelConnect to find or list hostels"}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+1 (234) 567-8900"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>I am a</Label>
                    <RadioGroup 
                      value={formData.role} 
                      onValueChange={handleRoleChange}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student" className="cursor-pointer">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="owner" id="owner" />
                        <Label htmlFor="owner" className="cursor-pointer">Hostel Owner</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin" className="cursor-pointer">Admin</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                    className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Processing..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              {mode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
