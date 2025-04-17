import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { Users, Home, FileCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";
import ProfileEdit from "../components/ProfileEdit";

interface UserProfile {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string | null;
  role: "student" | "owner" | "admin";
  updated_at: string;
  email?: string; // This will be added from auth
}

interface Hostel {
  id: string;
  name: string;
  location: string;
  price: number;
  rooms: number;
  owner_id: string;
  owner?: UserProfile;
}

interface Booking {
  id: string;
  created_at: string;
  hostel_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  hostel?: {
    name: string;
  };
  student?: {
    full_name: string;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  
  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "admin") {
      const redirectPath = user?.role === "student" ? "/student-dashboard" : "/owner-dashboard";
      toast.error(`You don't have access to this page. Redirecting to ${user?.role} dashboard.`);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch all users
  const { 
    data: users = [], 
    isLoading: usersLoading,
    refetch: refetchUsers
  } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Cast the role property to the correct type
      const userProfiles: UserProfile[] = profiles.map(profile => ({
        ...profile,
        // Ensure role is one of the allowed values, default to "student" if not
        role: (profile.role === "student" || profile.role === "owner" || profile.role === "admin") 
          ? profile.role as "student" | "owner" | "admin"
          : "student"
      }));
      
      return userProfiles;
    }
  });
  
  // Fetch all hostels
  const { 
    data: hostels = [], 
    isLoading: hostelsLoading,
    refetch: refetchHostels
  } = useQuery({
    queryKey: ['adminHostels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hostels')
        .select(`
          *,
          profiles!hostels_owner_id_fkey (
            id,
            full_name,
            role
          )
        `);
        
      if (error) throw error;
      
      return data.map(hostel => ({
        id: hostel.id,
        name: hostel.name,
        location: hostel.location,
        price: hostel.price,
        rooms: hostel.rooms,
        owner_id: hostel.owner_id,
        owner: hostel.profiles
      }));
    }
  });
  
  // Fetch all bookings
  const { 
    data: bookings = [], 
    isLoading: bookingsLoading,
    refetch: refetchBookings
  } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          hostels (
            name
          ),
          profiles!bookings_student_id_fkey (
            full_name
          )
        `);
        
      if (error) throw error;
      
      return data.map(booking => ({
        id: booking.id,
        created_at: booking.created_at,
        hostel_id: booking.hostel_id,
        student_id: booking.student_id,
        status: booking.status as "pending" | "approved" | "rejected",
        hostel: booking.hostels,
        student: booking.profiles
      }));
    }
  });
  
  // Delete a user (in a real app, you should have confirmation)
  const deleteUser = async (userId: string) => {
    try {
      // In a real production app, you would need an admin function to delete users
      // Since we can't delete from auth.users directly from the client
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success("User deleted successfully");
      refetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    }
  };
  
  // Delete a hostel
  const deleteHostel = async (hostelId: string) => {
    try {
      const { error } = await supabase
        .from('hostels')
        .delete()
        .eq('id', hostelId);
        
      if (error) throw error;
      
      toast.success("Hostel deleted successfully");
      refetchHostels();
    } catch (error: any) {
      console.error("Error deleting hostel:", error);
      toast.error(error.message || "Failed to delete hostel");
    }
  };
  
  const isLoading = usersLoading || hostelsLoading || bookingsLoading;
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Manage users, hostels, and bookings
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{users.length}</div>
                <Users className="text-primary/60" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Hostels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{hostels.length}</div>
                <Home className="text-primary/60" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{bookings.length}</div>
                <FileCheck className="text-primary/60" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="profile">
                  My Profile
                </TabsTrigger>
                <TabsTrigger value="users">
                  Users ({users.length})
                </TabsTrigger>
                <TabsTrigger value="hostels">
                  Hostels ({hostels.length})
                </TabsTrigger>
                <TabsTrigger value="bookings">
                  Bookings ({bookings.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <ProfileEdit />
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-secondary rounded-md"></div>
                        <div className="h-12 bg-secondary rounded-md"></div>
                        <div className="h-12 bg-secondary rounded-md"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left pb-2">Name</th>
                              <th className="text-left pb-2">Role</th>
                              <th className="text-left pb-2">Phone</th>
                              <th className="text-left pb-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.id} className="border-b border-border/40 hover:bg-secondary/20">
                                <td className="py-3">{user.full_name}</td>
                                <td className="py-3">{user.role}</td>
                                <td className="py-3">{user.phone_number || "None"}</td>
                                <td className="py-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deleteUser(user.id)}
                                  >
                                    Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="hostels">
                <Card>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-secondary rounded-md"></div>
                        <div className="h-12 bg-secondary rounded-md"></div>
                        <div className="h-12 bg-secondary rounded-md"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left pb-2">Name</th>
                              <th className="text-left pb-2">Location</th>
                              <th className="text-left pb-2">Price</th>
                              <th className="text-left pb-2">Owner</th>
                              <th className="text-left pb-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hostels.map((hostel) => (
                              <tr key={hostel.id} className="border-b border-border/40 hover:bg-secondary/20">
                                <td className="py-3">{hostel.name}</td>
                                <td className="py-3">{hostel.location}</td>
                                <td className="py-3">${hostel.price}/month</td>
                                <td className="py-3">{hostel.owner?.full_name || "Unknown"}</td>
                                <td className="py-3">
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/hostel/${hostel.id}`)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => deleteHostel(hostel.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="bookings">
                <Card>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-secondary rounded-md"></div>
                        <div className="h-12 bg-secondary rounded-md"></div>
                        <div className="h-12 bg-secondary rounded-md"></div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left pb-2">Hostel</th>
                              <th className="text-left pb-2">Student</th>
                              <th className="text-left pb-2">Status</th>
                              <th className="text-left pb-2">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr key={booking.id} className="border-b border-border/40 hover:bg-secondary/20">
                                <td className="py-3">{booking.hostel?.name || "Unknown Hostel"}</td>
                                <td className="py-3">{booking.student?.full_name || "Unknown Student"}</td>
                                <td className="py-3">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    booking.status === "approved" 
                                      ? "bg-green-100 text-green-800" 
                                      : booking.status === "rejected" 
                                        ? "bg-red-100 text-red-800" 
                                        : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="py-3">{new Date(booking.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
