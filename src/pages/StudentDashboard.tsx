import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { Home, Clock, Check, X, ExternalLink } from "lucide-react";
import Navbar from "../components/Navbar";
import HostelCard, { Hostel } from "../components/HostelCard";
import { supabase } from "../integrations/supabase/client";
import ProfileEdit from "../components/ProfileEdit";

// Type for booking requests with stricter typing
interface BookingRequest {
  id: string;
  hostel_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  message?: string | null;
  hostel?: Hostel;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("bookings");
  
  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "student") {
      const redirectPath = user?.role === "owner" ? "/owner-dashboard" : "/admin-dashboard";
      toast.error(`You don't have access to this page. Redirecting to ${user?.role} dashboard.`);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch student bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['studentBookings', user?.id],
    queryFn: async () => {
      if (!user) return [] as BookingRequest[];
      
      try {
        // Get bookings for this student
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('student_id', user.id);
          
        if (bookingError) throw bookingError;
        
        // Get hostel details for each booking
        const bookingsWithHostels = await Promise.all(
          bookingData.map(async (booking) => {
            const { data: hostelData, error: hostelError } = await supabase
              .from('hostels')
              .select(`
                *,
                amenities (*),
                hostel_images (*)
              `)
              .eq('id', booking.hostel_id)
              .single();
              
            if (hostelError) {
              console.error("Error fetching hostel:", hostelError);
              return booking as BookingRequest;
            }
            
            const amenitiesData = hostelData.amenities && hostelData.amenities[0] ? hostelData.amenities[0] : {
              wifi: false,
              water: false,
              electricity: false,
              security: false,
              furniture: false,
              kitchen: false,
              bathroom: false
            };
            
            const images = hostelData.hostel_images || [];
            
            const hostel: Hostel = {
              id: hostelData.id,
              name: hostelData.name,
              location: hostelData.location,
              description: hostelData.description || '',
              price: hostelData.price,
              rooms: hostelData.rooms,
              ownerId: hostelData.owner_id,
              amenities: {
                wifi: amenitiesData.wifi || false,
                water: amenitiesData.water || false,
                electricity: amenitiesData.electricity || false,
                security: amenitiesData.security || false,
                furniture: amenitiesData.furniture || false,
                kitchen: amenitiesData.kitchen || false,
                bathroom: amenitiesData.bathroom || false,
              },
              images: images.map((img: any) => img.image_url),
              createdAt: hostelData.created_at
            };
            
            return {
              ...booking,
              status: booking.status as "pending" | "approved" | "rejected",
              hostel
            } as BookingRequest;
          })
        );
        
        return bookingsWithHostels;
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
        return [] as BookingRequest[];
      }
    },
    enabled: !!user && isAuthenticated
  });
  
  // Cancel a booking request
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('student_id', user?.id)
        .eq('status', 'pending');
        
      if (error) throw error;
      return bookingId;
    },
    onSuccess: (bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['studentBookings', user?.id] });
      toast.success("Booking request cancelled");
    },
    onError: (error) => {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking request");
    }
  });
  
  const cancelBooking = (bookingId: string) => {
    cancelBookingMutation.mutate(bookingId);
  };
  
  // Group bookings by status
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const approvedBookings = bookings.filter((booking) => booking.status === "approved");
  const rejectedBookings = bookings.filter((booking) => booking.status === "rejected");
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Manage your hostel booking requests and view your saved hostels
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{bookings.length}</div>
                <Home className="text-muted-foreground" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{pendingBookings.length}</div>
                <Clock className="text-amber-500" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{approvedBookings.length}</div>
                <Check className="text-green-500" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="p-6 border-b border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="bookings">
                  Booking Requests
                </TabsTrigger>
                <TabsTrigger value="profile">
                  My Profile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="p-6">
            <TabsContent value="bookings">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-12 bg-secondary rounded-md"></div>
                  <div className="h-48 bg-secondary rounded-md"></div>
                  <div className="h-48 bg-secondary rounded-md"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                    <Home size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Booking Requests</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    You haven't made any booking requests yet. Start by browsing available hostels.
                  </p>
                  <Button onClick={() => navigate("/hostel-search")}>
                    Find Hostels
                  </Button>
                </div>
              ) : (
                <div>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-6">
                      <TabsTrigger value="all">
                        All ({bookings.length})
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
                      <BookingsList filteredBookings={bookings} cancelBooking={cancelBooking} />
                    </TabsContent>
                    
                    <TabsContent value="pending">
                      <BookingsList filteredBookings={pendingBookings} cancelBooking={cancelBooking} />
                    </TabsContent>
                    
                    <TabsContent value="approved">
                      <BookingsList filteredBookings={approvedBookings} cancelBooking={cancelBooking} />
                    </TabsContent>
                    
                    <TabsContent value="rejected">
                      <BookingsList filteredBookings={rejectedBookings} cancelBooking={cancelBooking} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="profile">
              <ProfileEdit />
            </TabsContent>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/hostel-search")}
            className="min-w-[200px]"
          >
            <Home size={18} className="mr-2" />
            Explore Hostels
          </Button>
        </div>
      </div>
    </div>
  );
};

// Components for different booking statuses
const BookingsList = ({ 
  filteredBookings, 
  cancelBooking 
}: { 
  filteredBookings: BookingRequest[], 
  cancelBooking: (id: string) => void 
}) => {
  const navigate = useNavigate();
  
  if (filteredBookings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No bookings found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredBookings.map((booking) => {
        const hostel = booking.hostel;
        
        return (
          <Card key={booking.id} className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4">
              <div className="md:col-span-1">
                {hostel && <HostelCard hostel={hostel} compact />}
              </div>
              
              <div className="md:col-span-3 p-4 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">
                      {hostel?.name || "Unknown Hostel"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      {hostel?.location || "Unknown Location"}
                    </p>
                    <p className="text-sm font-medium">${hostel?.price}/month</p>
                  </div>
                  
                  <Badge
                    className={`${
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
                
                <div className="text-xs text-muted-foreground mb-3">
                  Requested on {new Date(booking.created_at).toLocaleDateString()}
                </div>
                
                <div className="mt-auto flex justify-end space-x-2 pt-4">
                  {booking.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelBooking(booking.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel Request
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/hostel/${booking.hostel_id}`)}
                  >
                    <ExternalLink size={14} className="mr-1" />
                    View Hostel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StudentDashboard;
