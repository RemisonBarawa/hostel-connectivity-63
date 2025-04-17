import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { Home, Clock, Check, X, Plus, ExternalLink } from "lucide-react";
import Navbar from "../components/Navbar";
import HostelCard, { Hostel } from "../components/HostelCard";
import { supabase } from "../integrations/supabase/client";

// Type for booking requests with appropriate typing for status
interface BookingRequest {
  id: string;
  hostel_id: string;
  student_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  message?: string | null;
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
  
  // Redirect if not authenticated or not an owner
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "owner") {
      const redirectPath = user?.role === "student" ? "/student-dashboard" : "/admin-dashboard";
      toast.error(`You don't have access to this page. Redirecting to ${user?.role} dashboard.`);
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch owner's hostels
  const { data: hostels = [], isLoading: hostelsLoading } = useQuery({
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
        console.error("Error fetching hostels:", error);
        toast.error("Failed to load your hostels");
        return [];
      }
    },
    enabled: !!user && isAuthenticated
  });
  
  // Fetch booking requests for this owner's hostels
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['ownerBookings', user?.id],
    queryFn: async () => {
      if (!user) return [] as BookingRequest[];
      
      try {
        // Get all hostels for this owner
        const { data: ownerHostels, error: hostelsError } = await supabase
          .from('hostels')
          .select('id')
          .eq('owner_id', user.id);
          
        if (hostelsError) throw hostelsError;
        
        if (!ownerHostels.length) return [] as BookingRequest[];
        
        // Get all bookings for these hostels
        const hostelIds = ownerHostels.map(h => h.id);
        const { data: bookingData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .in('hostel_id', hostelIds);
          
        if (bookingsError) throw bookingsError;
        
        // Get student and hostel info for each booking
        const bookingsWithDetails = await Promise.all(
          bookingData.map(async (booking) => {
            // Get student info
            const { data: studentData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', booking.student_id)
              .single();
              
            // Get hostel info
            const { data: hostelData } = await supabase
              .from('hostels')
              .select('name')
              .eq('id', booking.hostel_id)
              .single();
              
            const student = studentData ? {
              name: studentData.full_name,
              email: "student@example.com", // This would come from auth users table
              phone: studentData.phone_number || "Not provided"
            } : {
              name: "Unknown Student",
              email: "unknown@example.com",
              phone: "Not provided"
            };
            
            const hostel = hostelData ? {
              name: hostelData.name
            } : {
              name: "Unknown Hostel"
            };
            
            return {
              ...booking,
              status: booking.status as "pending" | "approved" | "rejected",
              student,
              hostel
            } as BookingRequest;
          })
        );
        
        return bookingsWithDetails;
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load booking requests");
        return [] as BookingRequest[];
      }
    },
    enabled: !!user && isAuthenticated
  });
  
  // Approve or reject booking
  const updateBookingMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      status 
    }: { 
      bookingId: string; 
      status: "approved" | "rejected" 
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerBookings', user?.id] });
      toast.success("Booking request updated");
    },
    onError: (error) => {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking request");
    }
  });
  
  const approveBooking = (bookingId: string) => {
    updateBookingMutation.mutate({ bookingId, status: "approved" });
  };
  
  const rejectBooking = (bookingId: string) => {
    updateBookingMutation.mutate({ bookingId, status: "rejected" });
  };
  
  // Group bookings by status
  const pendingBookings = bookings.filter((booking) => booking.status === "pending");
  const approvedBookings = bookings.filter((booking) => booking.status === "approved");
  const rejectedBookings = bookings.filter((booking) => booking.status === "rejected");
  
  const isLoading = hostelsLoading || bookingsLoading;
  
  
  return (
    <div className="min-h-screen bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 mt-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your hostels and booking requests
            </p>
          </div>
          
          <Button onClick={() => navigate("/hostel-create")} className="mt-4 md:mt-0">
            <Plus size={16} className="mr-2" />
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
                <div className="text-3xl font-bold">{hostels.length}</div>
                <Home className="text-primary/60" size={24} />
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
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Approved Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold">{approvedBookings.length}</div>
                <Check className="text-green-500" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold">Booking Requests</h2>
                <p className="text-muted-foreground">Manage and track your hostel booking requests</p>
              </div>
              
              {isLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-secondary rounded-md"></div>
                    <div className="h-48 bg-secondary rounded-md"></div>
                    <div className="h-48 bg-secondary rounded-md"></div>
                  </div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                    <Clock size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Booking Requests Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    You haven't received any booking requests for your hostels yet.
                  </p>
                </div>
              ) : (
                <div className="p-6">
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
                      <BookingsList filteredBookings={bookings} />
                    </TabsContent>
                    
                    <TabsContent value="pending">
                      <BookingsList filteredBookings={pendingBookings} />
                    </TabsContent>
                    
                    <TabsContent value="approved">
                      <BookingsList filteredBookings={approvedBookings} />
                    </TabsContent>
                    
                    <TabsContent value="rejected">
                      <BookingsList filteredBookings={rejectedBookings} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold">Your Hostels</h2>
                <p className="text-muted-foreground">Manage your listed hostels</p>
              </div>
              
              {isLoading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-36 bg-secondary rounded-md"></div>
                    <div className="h-36 bg-secondary rounded-md"></div>
                  </div>
                </div>
              ) : hostels.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                    <Home size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No Hostels Listed</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    You haven't added any hostels yet. Add your first hostel to start receiving bookings.
                  </p>
                  <Button onClick={() => navigate("/hostel-create")}>
                    <Plus size={16} className="mr-2" />
                    Add Hostel
                  </Button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {hostels.map((hostel) => (
                    <HostelCard key={hostel.id} hostel={hostel} compact />
                  ))}
                  
                  <div className="pt-4">
                    <Button
                      onClick={() => navigate("/hostel-create")}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus size={16} className="mr-2" />
                      Add Another Hostel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Booking list component
const BookingsList = ({ filteredBookings }: { filteredBookings: BookingRequest[] }) => {
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
      {filteredBookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">
                  For: {booking.hostel?.name || "Unknown Hostel"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  From: {booking.student?.name || "Unknown Student"}
                </p>
              </div>
              
              <Badge
                className={`mt-2 md:mt-0 ${
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
            
            {booking.message && (
              <div className="bg-muted p-3 rounded-md mb-3 text-sm">
                <p className="font-medium text-xs mb-1">Message from student:</p>
                <p>{booking.message}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {booking.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-600 hover:bg-green-50"
                    onClick={() => approveBooking(booking.id)}
                  >
                    <Check size={14} className="mr-1" />
                    Approve
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => rejectBooking(booking.id)}
                  >
                    <X size={14} className="mr-1" />
                    Reject
                  </Button>
                </>
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
        </Card>
      ))}
    </div>
  );
};

// Helper functions
const approveBooking = (bookingId: string) => {
  // This will be called from the BookingsList component
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const updateBooking = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ownerBookings', user?.id] });
      toast.success("Booking approved successfully");
    } catch (error) {
      console.error("Error approving booking:", error);
      toast.error("Failed to approve booking");
    }
  };
  
  updateBooking();
};

const rejectBooking = (bookingId: string) => {
  // This will be called from the BookingsList component
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const updateBooking = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['ownerBookings', user?.id] });
      toast.success("Booking rejected");
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast.error("Failed to reject booking");
    }
  };
  
  updateBooking();
};

export default OwnerDashboard;
