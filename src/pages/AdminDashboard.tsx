
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Home, Users, User, Trash, Edit, UserCheck, LogIn } from "lucide-react";
import Navbar from "../components/Navbar";
import { Hostel } from "../components/HostelCard";

// Storage keys
const HOSTELS_STORAGE_KEY = "hostel_listings";
const BOOKINGS_STORAGE_KEY = "hostel_bookings";
const USERS_STORAGE_KEY = "hostel_users";

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "student" | "owner" | "admin";
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "user" | "hostel"; id: string } | null>(null);
  
  // Redirect if not authenticated or not an admin
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
  
  // Fetch all data for admin dashboard
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== "admin") return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Get all users
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        const allUsers: Record<string, AppUser> = usersJson ? JSON.parse(usersJson) : {};
        
        // Filter out passwords from users for security
        const usersArray = Object.values(allUsers).map(({ password, ...userWithoutPassword }: any) => userWithoutPassword);
        setUsers(usersArray);
        
        // Get all hostels
        const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
        const allHostels: Record<string, Hostel> = hostelsJson ? JSON.parse(hostelsJson) : {};
        setHostels(Object.values(allHostels));
        
        // Get booking count
        const bookingsJson = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        const allBookings = bookingsJson ? JSON.parse(bookingsJson) : {};
        setBookingsCount(Object.keys(allBookings).length);
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast.error("Failed to load admin dashboard data");
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [isAuthenticated, user, navigate]);
  
  // Open delete confirmation dialog
  const openDeleteDialog = (type: "user" | "hostel", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };
  
  // Delete user or hostel
  const handleDelete = () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === "user") {
        // Get all users
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        const allUsers = usersJson ? JSON.parse(usersJson) : {};
        
        // Check if trying to delete self
        if (itemToDelete.id === user?.id) {
          toast.error("You cannot delete your own account");
          setDeleteDialogOpen(false);
          setItemToDelete(null);
          return;
        }
        
        // Remove this user
        delete allUsers[itemToDelete.id];
        
        // Save back to localStorage
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
        
        // Update state
        setUsers(users.filter((u) => u.id !== itemToDelete.id));
        
        toast.success("User deleted successfully");
      } else if (itemToDelete.type === "hostel") {
        // Get all hostels
        const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
        const allHostels = hostelsJson ? JSON.parse(hostelsJson) : {};
        
        // Remove this hostel
        delete allHostels[itemToDelete.id];
        
        // Save back to localStorage
        localStorage.setItem(HOSTELS_STORAGE_KEY, JSON.stringify(allHostels));
        
        // Update state
        setHostels(hostels.filter((h) => h.id !== itemToDelete.id));
        
        toast.success("Hostel deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };
  
  // Login as user (for admin testing)
  const loginAsUser = (userId: string) => {
    try {
      // Get all users
      const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
      const allUsers = usersJson ? JSON.parse(usersJson) : {};
      
      const targetUser = allUsers[userId];
      
      if (!targetUser) {
        toast.error("User not found");
        return;
      }
      
      // Remove password from user object
      const { password, ...userWithoutPassword } = targetUser;
      
      // Store in localStorage as current user
      localStorage.setItem("hostel_current_user", JSON.stringify(userWithoutPassword));
      
      // Refresh page to update auth context
      window.location.reload();
    } catch (error) {
      console.error("Error logging in as user:", error);
      toast.error("Failed to login as user");
    }
  };
  
  // Calculate stats
  const studentCount = users.filter((user) => user.role === "student").length;
  const ownerCount = users.filter((user) => user.role === "owner").length;
  const adminCount = users.filter((user) => user.role === "admin").length;
  
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
                <div className="text-3xl font-bold">{bookingsCount}</div>
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
                </TabsList>
                
                <TabsContent value="users">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Email</th>
                          <th className="py-3 px-4 text-left font-medium text-muted-foreground">Phone</th>
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
                            <td className="py-4 px-4">{appUser.email}</td>
                            <td className="py-4 px-4">{appUser.phone}</td>
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
              </Tabs>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
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
