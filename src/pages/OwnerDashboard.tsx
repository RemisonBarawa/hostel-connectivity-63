
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { supabase } from "../integrations/supabase/client";

// Type for booking requests
interface BookingRequest {
  id: string;
  hostel_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  message?: string;
  student?: {
    name: string;
    email: string;
    phone: string;
  };
  hostel?: {
    name: string;
  };
}

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
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
  
  // Fetch owner's hostels
  const { data: myHostels = [], isLoading: isLoadingHostels } = useQuery({
    queryKey: ['ownerHostels', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        const { data, error } = await supabase
          .from('hostels')
          .select(`
            *,
            amenities (*),
            hostel_images (*)
          `)
          .eq('owner_id', user.id);
          
        if (error) throw error;
        
        // Transform Supabase data to match Hostel type
        return data.map(hostel => {
          const amenities = hostel.amenities?.[0] || {};
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
              wifi: amenities.wifi || false,
              water: amenities.water || false,
              electricity: amenities.electricity || false,
              security: amenities.security || false,
              furniture: amenities.furniture || false,
              kitchen: amenities.kitchen || false,
              bathroom: amenities.bathroom || false,
            },
            images: images.map((img: any) => img.image_url),
            createdAt: hostel.created_at
          };
        });
      } catch (error) {
        console.error("Error loading owner hostels:", error);
        toast.error("Failed to load your hostels");
        return [];
      }
    },
    enabled: !!user && isAuthenticated
  });
  
  // Fetch booking requests for owner's hostels
  const { data: bookingRequests = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['ownerBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Get all hostels owned by this user
        const { data: hostels, error: hostelsError } = await supabase
          .from('hostels')
          .select('id, name')
          .eq('owner_id', user.id);
          
        if (hostelsError) throw hostelsError;
        
        if (hostels.length === 0) {
          return [];
        }
        
        // Get booking requests for these hostels
        const hostelIds = hostels.map(h => h.id);
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('hostel_id', hostelIds);
          
        if (bookingsError) throw bookingsError;
        
        // Get student information
        const bookingsWithDetails = await Promise.all(
          bookings.map(async (booking) => {
            // Get student details
            const { data: student, error: studentError } = await supabase
              .from('profiles')
              .select('full_name, phone_number, id')
              .eq('id', booking.student_id)
              .single();
              
            // Get hostel name
            const hostel = hostels.find(h => h.id === booking.hostel_id);
            
            let studentDetails = {
              name: "Unknown",
              email: "Unknown",
              phone: "Unknown"
            };
            
            if (!studentError && student) {
              // Get user email from auth
              const { data: authUser } = await supabase.auth.admin.getUserById(student.id);
              
              studentDetails = {
                name: student.full_name,
                email: authUser?.user?.email || "Unknown",
                phone: student.phone_number || "Unknown"
              };
            }
            
            return {
              ...booking,
              student: studentDetails,
              hostel: { 
                name: hostel?.name || "Unknown Hostel"
              }
            };
          })
        );
        
        return bookingsWithDetails;
      } catch (error) {
        console.error("Error loading booking requests:", error);
        toast.error("Failed to load booking requests");
        return [];
      }
    },
    enabled: !!user && isAuthenticated
  });
  
  // Delete hostel mutation
  const deleteHostelMutation = useMutation({
    mutationFn: async (hostelId: string) => {
      // Delete hostel (cascade deletion will handle amenities, images, and bookings)
      const { error } = await supabase
        .from('hostels')
        .delete()
        .eq('id', hostelId)
        .eq('owner_id', user?.id);
        
      if (error) throw error;
      return hostelId;
    },
    onSuccess: (hostelId) => {
      queryClient.invalidateQueries({ queryKey: ['ownerHostels', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings', user?.id] });
      toast.success("Hostel deleted successfully");
      setDeleteDialogOpen(false);
      setHostelToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting hostel:", error);
      toast.error("Failed to delete hostel");
      setDeleteDialogOpen(false);
      setHostelToDelete(null);
    }
  });
  
  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, newStatus }: { bookingId: string; newStatus: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
        
      if (error) throw error;
      return { bookingId, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerBookings', user?.id] });
      toast.success("Booking status updated");
    },
    onError: (error) => {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    }
  });
  
  // Handle hostel deletion
  const openDeleteDialog = (hostelId: string) => {
    setHostelToDelete(hostelId);
    setDeleteDialogOpen(true);
  };
  
  const deleteHostel = () => {
    if (!hostelToDelete) return;
    deleteHostelMutation.mutate(hostelToDelete);
  };
  
  // Handle booking request actions
  const updateBookingStatus = (bookingId: string, newStatus: "approved" | "rejected") => {
    updateBookingStatusMutation.mutate({ bookingId, newStatus });
  };
  
  const isLoading = isLoadingHostels || isLoadingBookings;
  
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
                        (booking) => booking.hostel_id === hostel.id
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
  bookings: BookingRequest[];
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
                  <h3 className="font-semibold">{booking.hostel?.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Requested on {new Date(booking.created_at).toLocaleDateString()}
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
                  <p>{booking.student?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{booking.student?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p>{booking.student?.phone}</p>
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
