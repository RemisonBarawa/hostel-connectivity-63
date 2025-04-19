import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "../components/ui/dialog";
import { toast } from "sonner";
import { Home, Users, User, Trash, Edit, UserCheck, LogIn, Mail, Phone, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import { Hostel } from "../components/HostelCard";
import { supabase } from "../integrations/supabase/client";

interface AppUser {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: "student" | "owner" | "admin";
}

interface Booking {
  id: string;
  hostel_id: string;
  student_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  created_at: string;
  hostel: Hostel;
  student: AppUser;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "user" | "hostel"; id: string } | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "admin") {
      const redirectPath = user?.role === "student" ? "/student-dashboard" : "/owner-dashboard";
      toast.error("You don't have admin privileges. Redirecting...");
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);
  
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');
          
        if (error) throw error;
        
        const usersWithEmails: AppUser[] = await Promise.all(
          profiles.map(async (profile) => {
            let email = null;
            return {
              id: profile.id,
              name: profile.full_name,
              email: email,
              phone: profile.phone_number || 'Not provided',
              role: validateUserRole(profile.role),
            };
          })
        );
        
        return usersWithEmails;
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'admin'
  });
  
  const validateUserRole = (role: string): "student" | "owner" | "admin" => {
    const validRoles = ["student", "owner", "admin"];
    return validRoles.includes(role) ? (role as "student" | "owner" | "admin") : "student";
  };
  
  const { data: hostels = [], isLoading: hostelsLoading } = useQuery({
    queryKey: ['adminHostels'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('hostels')
          .select(`
            *,
            amenities (*),
            hostel_images (*)
          `);
          
        if (error) throw error;
        
        return data.map(hostel => {
          const amenitiesData = hostel.amenities && hostel.amenities[0] ? hostel.amenities[0] : {
            wifi: false,
            water: false,
            electricity: false,
            security: false,
            furniture: false,
            kitchen: false,
            bathroom: false
          };
          
          const images = hostel.hostel_images || [];
          
          return {
            id: hostel.id,
            name: hostel.name,
            location: hostel.location,
            description: hostel.description || '',
            price: hostel.price,
            rooms: hostel.rooms,
            ownerId: hostel.owner_id,
            amenities: {
              wifi: amenitiesData.wifi || false,
              water: amenitiesData.water || false,
              electricity: amenitiesData.electricity || false,
              security: amenitiesData.security || false,
              furniture: amenitiesData.furniture || false,
              kitchen: amenitiesData.kitchen || false,
              bathroom: amenitiesData.bathroom || false,
            },
            images: images.map(img => img.image_url),
            createdAt: hostel.created_at
          };
        });
      } catch (error) {
        console.error('Error fetching hostels:', error);
        toast.error('Failed to fetch hostels');
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'admin'
  });
  
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            hostel:hostels (
              id,
              name,
              location,
              price,
              rooms
            ),
            student:profiles!student_id (
              id,
              full_name,
              phone_number,
              email
            )
          `);

        if (error) throw error;
        return data as Booking[];
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to fetch bookings');
        return [];
      }
    },
    enabled: !!user && isAuthenticated && user.role === 'admin'
  });
  
  const handleBookingStatusUpdate = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };
  
  const openDeleteDialog = (type: "user" | "hostel", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === "user") {
        if (itemToDelete.id === user?.id) {
          toast.error("You cannot delete your own account");
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          return;
        }
        
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        toast.success("User deleted successfully");
      } else if (itemToDelete.type === "hostel") {
        const { error } = await supabase
          .from('hostels')
          .delete()
          .eq('id', itemToDelete.id);
          
        if (error) throw error;
        
        toast.success("Hostel deleted successfully");
      }
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${itemToDelete.type}: ${error.message}`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  const loginAsUser = async (userId: string) => {
    try {
      const { data: targetUser, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        toast.error("User not found");
        return;
      }
      
      if (targetUser.role === 'student') {
        navigate('/student-dashboard');
        toast.success(`Viewing as student: ${targetUser.full_name}`);
      } else if (targetUser.role === 'owner') {
        navigate('/owner-dashboard');
        toast.success(`Viewing as owner: ${targetUser.full_name}`);
      } else {
        toast.error("Cannot impersonate this user type");
      }
    } catch (error: any) {
      console.error("Error logging in as user:", error);
      toast.error(`Failed to login as user: ${error.message}`);
    }
  };
  
  const isLoading = usersLoading || hostelsLoading || bookingsLoading;
  
  const studentCount = users.filter((appUser) => appUser.role === "student").length;
  const ownerCount = users.filter((appUser) => appUser.role === "owner").length;
  const adminCount = users.filter((appUser) => appUser.role === "admin").length;

  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === 'Not provided') return 'Not provided';
    
    return phone;
  };
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Manage users, hostels and system settings
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{users.length}</div>
                <Users className="text-muted-foreground" size={24} />
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
                <Home className="text-muted-foreground" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{studentCount}</div>
                <User className="text-primary" size={24} />
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
                <UserCheck className="text-muted-foreground" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Dashboard Management</h2>
            <p className="text-muted-foreground">Manage system users and hostels</p>
          </div>
          
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-secondary rounded-md"></div>
                <div className="h-64 bg-secondary rounded-md"></div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <Tabs defaultValue="users">
                <TabsList className="mb-6">
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
                
                <TabsContent value="users">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Contact</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Role</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((appUser) => (
                          <tr key={appUser.id} className="border-b border-border hover:bg-secondary/5">
                            <td className="py-4 px-4">
                              <div className="font-medium">{appUser.name}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <Mail size={14} className="mr-1.5 text-muted-foreground" />
                                  {appUser.email || 'Not available'}
                                </div>
                                <div className="flex items-center text-sm">
                                  <Phone size={14} className="mr-1.5 text-muted-foreground" />
                                  {formatPhoneNumber(appUser.phone)}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium 
                                ${appUser.role === "admin" 
                                  ? "bg-primary/10 text-primary" 
                                  : appUser.role === "owner" 
                                  ? "bg-amber-100 text-amber-800" 
                                  : "bg-green-100 text-green-800"
                                }`}
                              >
                                {appUser.role}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loginAsUser(appUser.id)}
                                  className="text-primary border-primary/20 hover:bg-primary/5"
                                >
                                  <LogIn size={14} className="mr-1" />
                                  Log In As
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteDialog("user", appUser.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  disabled={appUser.id === user?.id}
                                >
                                  <Trash size={14} className="mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="hostels">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Hostel Name</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Location</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Price/Month</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Rooms</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Owner</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hostels.map((hostel) => {
                          const owner = users.find((u) => u.id === hostel.ownerId);
                          
                          return (
                            <tr key={hostel.id} className="border-b border-border hover:bg-secondary/5">
                              <td className="py-4 px-4">
                                <div className="font-medium">{hostel.name}</div>
                              </td>
                              <td className="py-4 px-4">{hostel.location}</td>
                              <td className="py-4 px-4">${hostel.price}</td>
                              <td className="py-4 px-4">{hostel.rooms}</td>
                              <td className="py-4 px-4">{owner?.name || "Unknown"}</td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/hostel/${hostel.id}`)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/hostel-edit/${hostel.id}`)}
                                  >
                                    <Edit size={14} className="mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDeleteDialog("hostel", hostel.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Trash size={14} className="mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {hostels.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              No hostels found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                
                <TabsContent value="bookings">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Hostel</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Student</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Message</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                          <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-border hover:bg-secondary/5">
                            <td className="py-4 px-4">
                              <div className="font-medium">{booking.hostel.name}</div>
                              <div className="text-sm text-muted-foreground">{booking.hostel.location}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="font-medium">{booking.student.full_name}</div>
                                <div className="flex items-center text-sm">
                                  <Phone size={14} className="mr-1.5 text-muted-foreground" />
                                  {booking.student.phone_number || 'Not provided'}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium 
                                ${booking.status === "approved" 
                                  ? "bg-green-100 text-green-800" 
                                  : booking.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {booking.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {booking.message || 'No message'}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-muted-foreground">
                                {new Date(booking.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {booking.status === 'pending' && (
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBookingStatusUpdate(booking.id, 'approved')}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <Check size={14} className="mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBookingStatusUpdate(booking.id, 'rejected')}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Trash size={14} className="mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        
                        {bookings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
                              No booking requests found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {itemToDelete?.type === "user" ? "User" : "Hostel"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
              {itemToDelete?.type === "hostel" && " All associated booking requests will also be deleted."}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
