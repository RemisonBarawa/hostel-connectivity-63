import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import { toast } from "sonner";
import { MapPin, Users, Wifi, Droplet, Zap, Home, ChevronLeft, ChevronRight, Phone, Mail, MessageSquare } from "lucide-react";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Hostel } from "../components/HostelCard";
import Navbar from "../components/Navbar";
import { supabase } from "../integrations/supabase/client";

interface BookingRequest {
  id: string;
  hostelId: string;
  studentId: string;
  ownerId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const HostelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [owner, setOwner] = useState<{ name: string; email: string; phone: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasRequestedBefore, setHasRequestedBefore] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    setIsLoading(true);
    
    const fetchHostelData = async () => {
      try {
        const { data: hostelData, error: hostelError } = await supabase
          .from('hostels')
          .select(`
            *,
            amenities (*),
            hostel_images (*)
          `)
          .eq('id', id)
          .single();
        
        if (hostelError) throw hostelError;
        
        if (hostelData) {
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
          
          const transformedHostel: Hostel = {
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
          
          setHostel(transformedHostel);
          
          if (hostelData.owner_id) {
            const { data: ownerData, error: ownerError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', hostelData.owner_id)
              .single();
            
            const { data: ownerEmailData, error: ownerEmailError } = await supabase
              .functions.invoke('get_user_email', {
                body: { user_id: hostelData.owner_id }
              });
            
            if (!ownerError && ownerData) {
              let ownerEmail = 'Email not available';
              
              if (!ownerEmailError && ownerEmailData) {
                if (Array.isArray(ownerEmailData) && ownerEmailData.length > 0 && ownerEmailData[0].email) {
                  ownerEmail = ownerEmailData[0].email;
                }
              }
              
              setOwner({
                name: ownerData.full_name || 'Unknown',
                email: ownerEmail,
                phone: ownerData.phone_number || 'Not provided',
              });
            } else {
              console.error("Error fetching owner data:", ownerError || ownerEmailError);
              setOwner({
                name: 'Unknown',
                email: 'Email not available',
                phone: 'Not provided',
              });
            }
          }
          
          if (isAuthenticated && user) {
            const { data: bookingData, error: bookingError } = await supabase
              .from('bookings')
              .select('*')
              .eq('hostel_id', id)
              .eq('student_id', user.id);
            
            if (!bookingError && bookingData && bookingData.length > 0) {
              setHasRequestedBefore(true);
            }
          }
        } else {
          toast.error("Hostel not found");
          navigate("/hostel-search");
        }
      } catch (error) {
        console.error("Error loading hostel:", error);
        toast.error("Error loading hostel details");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHostelData();
  }, [id, navigate, isAuthenticated, user]);
  
  const navigateImage = (direction: "next" | "prev") => {
    if (!hostel?.images?.length) return;
    
    if (direction === "next") {
      setActiveImageIndex((prev) => (prev + 1) % hostel.images.length);
    } else {
      setActiveImageIndex((prev) => (prev - 1 + hostel.images.length) % hostel.images.length);
    }
  };
  
  const handleRequestToBook = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to request booking");
      navigate("/auth?mode=login");
      return;
    }
    
    if (user?.role !== "student") {
      toast.error("Only students can request bookings");
      return;
    }
    
    setRequestDialogOpen(true);
  };
  
  const submitBookingRequest = async () => {
    if (!hostel || !user) return;
    
    setIsRequesting(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          hostel_id: hostel.id,
          student_id: user.id,
          status: 'pending',
          message: null
        });
      
      if (error) throw error;
      
      toast.success("Booking request sent successfully");
      setHasRequestedBefore(true);
      setRequestDialogOpen(false);
    } catch (error) {
      console.error("Error sending booking request:", error);
      toast.error("Error sending booking request");
    } finally {
      setIsRequesting(false);
    }
  };
  
  const renderContactCard = () => {
    if (!user) {
      return (
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to contact the property manager
          </p>
          <Button onClick={() => navigate("/auth?mode=login")}>
            Sign In
          </Button>
        </div>
      );
    }

    if (user.role === "student") {
      return (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Agency Contact</label>
            <p className="font-medium">Student Housing Agency</p>
          </div>
          
          <Button
            className="w-full bg-primary text-white"
            size="lg"
            onClick={handleRequestToBook}
            disabled={hasRequestedBefore}
          >
            {hasRequestedBefore ? "Request Sent" : "Book Now"}
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `tel:+254713156080`}
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
            
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `https://wa.me/254713156080`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </div>
          
          {hasRequestedBefore && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              You've already sent a request for this hostel.
            </p>
          )}
        </div>
      );
    }

    if (owner && (user.role === "admin" || (user.role === "owner" && user.id === hostel?.ownerId))) {
      return (
        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Owner</label>
            <p className="font-medium">{owner.name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Contact Information</label>
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{owner.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{owner.phone}</p>
            </div>
          </div>
          
          {user.id === hostel?.ownerId && (
            <div className="bg-secondary/30 p-3 rounded-md text-center">
              <p className="text-sm mb-2">This is your hostel listing</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/hostel-edit/${hostel.id}`)}
              >
                Edit Listing
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>No access to contact information</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="bg-secondary animate-pulse rounded-lg h-[400px] mb-8"></div>
          <div className="bg-secondary animate-pulse rounded-lg h-8 max-w-md mx-auto mb-4"></div>
          <div className="bg-secondary animate-pulse rounded-lg h-4 max-w-xs mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!hostel) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-2">Hostel Not Found</h1>
          <p className="text-muted-foreground mb-6">The hostel you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/hostel-search")}>Back to Search</Button>
        </div>
      </div>
    );
  }
  
  const { name, location, price, rooms, amenities, images, description } = hostel;
  
  const hasImages = images && images.length > 0;
  const currentImage = hasImages ? images[activeImageIndex] : "/placeholder.svg";
  
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to results
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative rounded-xl overflow-hidden border border-border">
              <div className="aspect-video relative">
                <img
                  src={currentImage}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                
                {hasImages && images.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage("prev")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => navigateImage("next")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                    
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImageIndex(index)}
                          className={`w-2 h-2 rounded-full ${
                            index === activeImageIndex ? "bg-white" : "bg-white/50"
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {hasImages && images.length > 1 && (
                <div className="flex overflow-x-auto p-2 bg-secondary/20 scrollbar-thin">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden mr-2 border-2 transition-all ${
                        index === activeImageIndex ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-semibold">{name}</h1>
                <div className="bg-secondary/60 text-foreground px-4 py-2 rounded-md">
                  <span className="text-lg font-semibold">KES {price}</span>
                  <span className="text-sm">/month</span>
                </div>
              </div>
              
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin size={18} className="mr-1 text-primary" />
                <span>{location}</span>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <Users size={18} className="mr-1 text-primary" />
                  <span className="font-medium">{rooms} room{rooms !== 1 ? 's' : ''} available</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {amenities?.wifi && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Wifi size={14} className="mr-1" /> Wi-Fi
                    </Badge>
                  )}
                  {amenities?.water && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Droplet size={14} className="mr-1" /> Water Supply
                    </Badge>
                  )}
                  {amenities?.electricity && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Zap size={14} className="mr-1" /> Electricity
                    </Badge>
                  )}
                  {amenities?.security && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Home size={14} className="mr-1" /> Security
                    </Badge>
                  )}
                  {amenities?.furniture && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Home size={14} className="mr-1" /> Furnished
                    </Badge>
                  )}
                  {amenities?.kitchen && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Home size={14} className="mr-1" /> Kitchen
                    </Badge>
                  )}
                  {amenities?.bathroom && (
                    <Badge variant="outline" className="bg-primary/5">
                      <Home size={14} className="mr-1" /> Private Bathroom
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              {renderContactCard()}
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Book Hostel</DialogTitle>
            <DialogDescription>
              Your contact information will be shared with the hostel owner. They will reach out to you to discuss the booking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3">
            <div className="bg-secondary/20 p-4 rounded-md mb-4">
              <h3 className="font-medium">{name}</h3>
              <p className="text-sm text-muted-foreground">{location}</p>
              <p className="font-medium mt-1">KES {price}/month</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Your Name</label>
                <p>{user?.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Your Email</label>
                <p>{user?.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Your Phone</label>
                <p>{user?.phone}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRequestDialogOpen(false)}
              disabled={isRequesting}
            >
              Cancel
            </Button>
            <Button
              onClick={submitBookingRequest}
              disabled={isRequesting}
            >
              {isRequesting ? "Sending..." : "Confirm Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostelDetail;
