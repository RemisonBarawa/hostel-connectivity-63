
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { getFormErrors } from "../utils/validation";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Save } from "lucide-react";
import ImageUpload from "../components/ImageUpload";
import Navbar from "../components/Navbar";
import { Hostel } from "../components/HostelCard";
import { Separator } from "../components/ui/separator";

// Type for form data
interface HostelFormData {
  name: string;
  location: string;
  price: string;
  rooms: string;
  description: string;
  amenities: {
    wifi: boolean;
    water: boolean;
    electricity: boolean;
    security: boolean;
    furniture: boolean;
    kitchen: boolean;
    bathroom: boolean;
  };
  images: string[];
}

// Storage key for hostels
const HOSTELS_STORAGE_KEY = "hostel_listings";

const HostelCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<HostelFormData>({
    name: "",
    location: "",
    price: "",
    rooms: "",
    description: "",
    amenities: {
      wifi: false,
      water: false,
      electricity: false,
      security: false,
      furniture: false,
      kitchen: false,
      bathroom: false,
    },
    images: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not authenticated or not an owner
  useEffect(() => {
    if (isAuthenticated && user?.role !== "owner" && user?.role !== "admin") {
      toast.error("Only hostel owners can access this page");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch hostel data if editing
  useEffect(() => {
    if (isEditing && id) {
      // Get hostels from localStorage
      const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
      const hostels: Record<string, Hostel> = hostelsJson ? JSON.parse(hostelsJson) : {};
      
      const hostel = hostels[id];
      
      if (hostel) {
        // Only allow editing if the user is the owner or an admin
        if (user?.id === hostel.ownerId || user?.role === "admin") {
          setFormData({
            name: hostel.name,
            location: hostel.location,
            price: String(hostel.price),
            rooms: String(hostel.rooms),
            description: hostel.description || "",
            amenities: {
              wifi: hostel.amenities?.wifi || false,
              water: hostel.amenities?.water || false,
              electricity: hostel.amenities?.electricity || false,
              security: hostel.amenities?.security || false,
              furniture: hostel.amenities?.furniture || false,
              kitchen: hostel.amenities?.kitchen || false,
              bathroom: hostel.amenities?.bathroom || false,
            },
            images: hostel.images || [],
          });
        } else {
          toast.error("You don't have permission to edit this hostel");
          navigate("/owner-dashboard");
        }
      } else {
        toast.error("Hostel not found");
        navigate("/owner-dashboard");
      }
    }
  }, [isEditing, id, user, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };
  
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData({
      ...formData,
      amenities: {
        ...formData.amenities,
        [amenity]: checked,
      },
    });
  };
  
  const handleImagesChange = (images: string[]) => {
    setFormData({
      ...formData,
      images,
    });
  };
  
  const validateForm = () => {
    // Validate required fields
    const validationData = {
      name: formData.name,
      location: formData.location,
      price: formData.price,
      rooms: formData.rooms,
    };
    
    const newErrors = getFormErrors(validationData);
    
    // Add custom validation for description if needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to create a hostel");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get existing hostels
      const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
      const hostels: Record<string, Hostel> = hostelsJson ? JSON.parse(hostelsJson) : {};
      
      // Create or update hostel object
      const hostelId = isEditing ? id! : `hostel_${Date.now()}`;
      const hostel: Hostel = {
        id: hostelId,
        name: formData.name,
        location: formData.location,
        price: parseFloat(formData.price),
        rooms: parseInt(formData.rooms, 10),
        description: formData.description,
        amenities: formData.amenities,
        images: formData.images,
        ownerId: user.id,
        createdAt: isEditing ? hostels[hostelId].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Save to "database"
      hostels[hostelId] = hostel;
      localStorage.setItem(HOSTELS_STORAGE_KEY, JSON.stringify(hostels));
      
      toast.success(isEditing ? "Hostel updated successfully" : "Hostel created successfully");
      navigate("/owner-dashboard");
    } catch (error) {
      console.error("Error saving hostel:", error);
      toast.error("An error occurred while saving the hostel");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-secondary/10">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          {/* Back button and title */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/owner-dashboard")}
              className="text-muted-foreground hover:text-foreground flex items-center mb-4"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </button>
            
            <h1 className="text-2xl font-semibold">
              {isEditing ? "Edit Hostel Listing" : "Create New Hostel Listing"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? "Update your hostel information below"
                : "Fill out the form below to list your hostel"}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-8 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Hostel Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Sunrise Student Hostel"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. 123 University Drive, City"
                      className={errors.location ? "border-red-500" : ""}
                    />
                    {errors.location && (
                      <p className="text-xs text-red-500">{errors.location}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Month ($) <span className="text-red-500">*</span></Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 350"
                      min="1"
                      className={errors.price ? "border-red-500" : ""}
                    />
                    {errors.price && (
                      <p className="text-xs text-red-500">{errors.price}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rooms">Number of Available Rooms <span className="text-red-500">*</span></Label>
                    <Input
                      id="rooms"
                      name="rooms"
                      type="number"
                      value={formData.rooms}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      min="1"
                      className={errors.rooms ? "border-red-500" : ""}
                    />
                    {errors.rooms && (
                      <p className="text-xs text-red-500">{errors.rooms}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your hostel, including nearby amenities, transport links, etc."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Amenities</h2>
                <p className="text-sm text-muted-foreground">Select the amenities available at your hostel</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[
                    { id: "wifi", label: "Wi-Fi" },
                    { id: "water", label: "Water Supply" },
                    { id: "electricity", label: "Electricity" },
                    { id: "security", label: "Security" },
                    { id: "furniture", label: "Furnished" },
                    { id: "kitchen", label: "Kitchen" },
                    { id: "bathroom", label: "Private Bathroom" },
                  ].map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities[amenity.id as keyof typeof formData.amenities]}
                        onCheckedChange={(checked) => 
                          handleAmenityChange(amenity.id, checked === true)
                        }
                      />
                      <Label htmlFor={amenity.id} className="cursor-pointer">
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Photos</h2>
                <p className="text-sm text-muted-foreground">Upload up to 5 images of your hostel</p>
                
                <ImageUpload
                  maxImages={5}
                  onImagesChange={handleImagesChange}
                  initialImages={formData.images}
                />
              </div>
              
              <div className="pt-2">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6 flex items-start">
                  <AlertCircle size={18} className="text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800">
                      By submitting this form, you confirm that all information provided is accurate and 
                      that you have the legal right to list this property.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/owner-dashboard")}
                    className="mr-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>
                        <Save size={16} className="mr-1" />
                        {isEditing ? "Update Hostel" : "Create Hostel"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelCreate;
