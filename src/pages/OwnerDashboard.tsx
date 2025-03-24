
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
import { Home, Clock, Check, X, Edit, Trash, Plus, UserCheck, User } from "lucide-react";
import Navbar from "../components/Navbar";
import { Hostel } from "../components/HostelCard";

// Storage keys
const HOSTELS_STORAGE_KEY = "hostel_listings";
const BOOKINGS_STORAGE_KEY = "hostel_bookings";
const USERS_STORAGE_KEY = "hostel_users";

// Type for booking requests
interface BookingRequest {
  id: string;
  hostelId: string;
  studentId: string;
  ownerId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface BookingWithStudent extends BookingRequest {
  student: {
    name: string;
    email: string;
    phone: string;
  };
  hostel: {
    name: string;
  };
}

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [myHostels, setMyHostels] = useState<Hostel[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hostelToDelete, setHostelToDelete] = useState<string | null>(null);
  
  // Redirect if not authenticated or not an owner
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "owner" && user?.role !== "admin") {
      const redirectPath = user?.role === "student" ? "/student-dashboard" : "/admin-dashboard";
      toast.error(`You don't have access to this page. Redirecting to ${user?.role} dashboard.`);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch owner hostels and booking requests
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Get all hostels
        const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
        const allHostels: Record<string, Hostel> = hostelsJson ? JSON.parse(hostelsJson) : {};
        
        // Filter hostels owned by this user
        const ownerHostels = Object.values(allHostels).filter(
          (hostel) => hostel.ownerId === user.id
        );
        
        setMyHostels(ownerHostels);
        
        // Get booking requests for owner's hostels
        const bookingsJson = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        const allBookings: Record<string, BookingRequest> = bookingsJson ? JSON.parse(bookingsJson) : {};
        
        const ownerBookings = Object.values(allBookings).filter(
          (booking) => booking.ownerId === user.id
        );
        
        // Get student information for each booking
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        const users = usersJson ? JSON.parse(usersJson) : {};
        
        const bookingsWithStudents = ownerBookings.map((booking) => {
          const student = users[booking.studentId];
          const hostel = allHostels[booking.hostelId];
          
          return {
            ...booking,
            student: student
              ? {
                  name: student.name,
                  email: student.email,
                  phone: student.phone,
                }
              : { name: "Unknown", email: "Unknown", phone: "Unknown" },
            hostel: hostel
              ? { name: hostel.name }
              : { name: "Unknown Hostel" },
          };
        });
        
        setBookingRequests(bookingsWithStudents);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }, 800);
  }, [isAuthenticated, user]);
  
  // Handle hostel deletion
  const openDeleteDialog = (hostelId: string) => {
    setHostelToDelete(hostelId);
    setDeleteDialogOpen(true);
  };
  
  const deleteHostel = () => {
    if (!hostelToDelete) return;
    
    try {
      // Get all hostels
      const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
      const allHostels: Record<string, Hostel> = hostelsJson ? JSON.parse(hostelsJson) : {};
      
      // Remove this hostel
      delete allHostels[hostelToDelete];
      
      // Save back to localStorage
      localStorage.setItem(HOSTELS_STORAGE_KEY, JSON.stringify(allHostels));
      
      // Also remove any bookings for this hostel
      const bookingsJson = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      const allBookings: Record<string, BookingRequest> = bookingsJson ? JSON.parse(bookingsJson) : {};
      
      const updatedBookings = Object.entries(allBookings).reduce((acc, [id, booking]) => {
        if (booking.hostelId !== hostelToDelete) {
          acc[id] = booking;
        }
        return acc;
      }, {} as Record<string, BookingRequest>);
      
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedBookings));
      
      // Update state
      setMyHostels(myHostels.filter((hostel) => hostel.id !== hostelToDelete));
      setBookingRequests(bookingRequests.filter((booking) => booking.hostelId !== hostelToDelete));
      
      toast.success("Hostel deleted successfully");
    } catch (error) {
      console.error("Error deleting hostel:", error);
      toast.error("Failed to delete hostel");
    } finally {
      setDeleteDialogOpen(false);
      setHostelToDelete(null);
    }
  };
  
  // Handle booking request actions
  const updateBookingStatus = (bookingId: string, newStatus: "approved" | "rejected") => {
    try {
      // Get all bookings
      const bookingsJson = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      const allBookings: Record<string, BookingRequest> = bookingsJson ? JSON.parse(bookingsJson) : {};
      
      // Update this booking's status
      allBookings[bookingId] = {
        ...allBookings[bookingId],
        status: newStatus,
      };
      
      // Save back to localStorage
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(allBookings));
      
      // Update state
      setBookingRequests(
        bookingRequests.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: newStatus }
            : booking
        )
      );
      
      toast.success(`Booking request ${newStatus}`);
    } catch (error) {
      console.error(`Error updating booking status:`, error);
      toast.error("Failed to update booking status");
    }
  };
  
  // Group bookings by status
  const pendingBookings = bookingRequests.filter((booking) => booking.status === "pending");
  const approvedBookings = bookingRequests.filter((booking) => booking.status === "approved");
  const rejectedBookings = bookingRequests.filter((booking) => booking.status === "rejected");
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your hostel listings and booking requests
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/hostel-create")}
            className="mt-4 md:mt-0"
          >
            <Plus size={16} className="mr-1" />
            Add New Hostel
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Hostels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{myHostels.length}</div>
                <Home className="text-muted-foreground" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Booking Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{bookingRequests.length}</div>
                <UserCheck className="text-primary" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{pendingBookings.length}</div>
                <Clock className="text-amber-500" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Your Hostel Listings</h2>
            <p className="text-muted-foreground">Manage your property listings</p>
          </div>
          
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-secondary rounded-md"></div>
                <div className="h-32 bg-secondary rounded-md"></div>
                <div className="h-32 bg-secondary rounded-md"></div>
              </div>
            </div>
          ) : myHostels.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <Home size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No Hostels Listed</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You haven't listed any hostels yet. Add your first hostel to start receiving booking requests.
              </p>
              <Button onClick={() => navigate("/hostel-create")}>
                <Plus size={16} className="mr-1" />
                Add Hostel
              </Button>
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Hostel Name</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Location</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Price/Month</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Rooms</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Bookings</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myHostels.map((hostel) => {
                      const hostelBookings = bookingRequests.filter(
                        (booking) => booking.hostelId === hostel.id
                      );
                      const pendingCount = hostelBookings.filter(
                        (booking) => booking.status === "pending"
                      ).length;
                      
                      return (
                        <tr key={hostel.id} className="border-b border-border hover:bg-secondary/5">
                          <td className="py-4 px-4">
                            <div className="font-medium">{hostel.name}</div>
                          </td>
                          <td className="py-4 px-4">{hostel.location}</td>
                          <td className="py-4 px-4">${hostel.price}</td>
                          <td className="py-4 px-4">{hostel.rooms}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <span className="mr-2">{hostelBookings.length}</span>
                              {pendingCount > 0 && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                  {pendingCount} pending
                                </Badge>
                              )}
                            </div>
                          </td>
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
                                onClick={() => openDeleteDialog(hostel.id)}
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
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Booking Requests</h2>
            <p className="text-muted-foreground">Manage incoming requests from students</p>
          </div>
          
          {isLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-secondary rounded-md"></div>
                <div className="h-32 bg-secondary rounded-md"></div>
                <div className="h-32 bg-secondary rounded-md"></div>
              </div>
            </div>
          ) : bookingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <User size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No Booking Requests</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't received any booking requests yet. Check back later.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <Tabs defaultValue="all">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">
                    All ({bookingRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending ({pendingBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Approved ({approvedBookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rejected ({rejectedBookings.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <BookingRequestsList 
                    bookings={bookingRequests} 
                    updateStatus={updateBookingStatus} 
                  />
                </TabsContent>
                
                <TabsContent value="pending">
                  <BookingRequestsList 
                    bookings={pendingBookings} 
                    updateStatus={updateBookingStatus} 
                  />
                </TabsContent>
                
                <TabsContent value="approved">
                  <BookingRequestsList 
                    bookings={approvedBookings} 
                    updateStatus={updateBookingStatus} 
                  />
                </TabsContent>
                
                <TabsContent value="rejected">
                  <BookingRequestsList 
                    bookings={rejectedBookings} 
                    updateStatus={updateBookingStatus} 
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Hostel Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hostel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this hostel? This action cannot be undone,
              and all associated booking requests will also be deleted.
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
              onClick={deleteHostel}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BookingRequestsList = ({ 
  bookings, 
  updateStatus 
}: { 
  bookings: BookingWithStudent[];
  updateStatus: (bookingId: string, status: "approved" | "rejected") => void;
}) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No booking requests found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between mb-4">
              <div>
                <div className="flex items-center mb-1">
                  <Home size={16} className="text-primary mr-1" />
                  <h3 className="font-semibold">{booking.hostel.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Requested on {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <Badge
                className={`self-start md:self-center mb-3 md:mb-0 ${
                  booking.status === "pending"
                    ? "bg-amber-100 text-amber-800"
                    : booking.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {booking.status === "pending" && (
                  <>
                    <Clock size={14} className="mr-1" /> Pending
                  </>
                )}
                {booking.status === "approved" && (
                  <>
                    <Check size={14} className="mr-1" /> Approved
                  </>
                )}
                {booking.status === "rejected" && (
                  <>
                    <X size={14} className="mr-1" /> Rejected
                  </>
                )}
              </Badge>
            </div>
            
            <div className="bg-secondary/20 rounded-md p-4 mb-4">
              <h4 className="font-medium mb-2">Student Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-2 gap-x-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p>{booking.student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{booking.student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{booking.student.phone}</p>
                </div>
              </div>
            </div>
            
            {booking.status === "pending" && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => updateStatus(booking.id, "rejected")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X size={16} className="mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => updateStatus(booking.id, "approved")}
                >
                  <Check size={16} className="mr-1" />
                  Approve
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OwnerDashboard;
