
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Slider } from "../components/ui/slider";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import HostelCard, { Hostel } from "../components/HostelCard";
import Navbar from "../components/Navbar";

// Storage key for hostels
const HOSTELS_STORAGE_KEY = "hostel_listings";

const HostelSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Extract search parameters from URL
  const initialLocation = searchParams.get("location") || "";
  
  // State for search form
  const [searchForm, setSearchForm] = useState({
    location: initialLocation,
    minPrice: 0,
    maxPrice: 1000,
    amenities: {
      wifi: false,
      water: false,
      electricity: false,
      security: false,
      furniture: false,
      kitchen: false,
      bathroom: false,
    },
  });
  
  // States for search results and UI
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [filteredHostels, setFilteredHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Load hostels on mount
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      // Get hostels from localStorage
      const hostelsJson = localStorage.getItem(HOSTELS_STORAGE_KEY);
      const hostelsObj: Record<string, Hostel> = hostelsJson ? JSON.parse(hostelsJson) : {};
      
      // Convert to array
      const hostelArray = Object.values(hostelsObj);
      setHostels(hostelArray);
      setIsLoading(false);
    }, 500);
  }, []);
  
  // Apply filters whenever search form or hostels change
  useEffect(() => {
    if (hostels.length === 0) return;
    
    const filtered = hostels.filter((hostel) => {
      // Filter by location (case insensitive)
      if (
        searchForm.location &&
        !hostel.location.toLowerCase().includes(searchForm.location.toLowerCase())
      ) {
        return false;
      }
      
      // Filter by price range
      if (
        hostel.price < searchForm.minPrice ||
        hostel.price > searchForm.maxPrice
      ) {
        return false;
      }
      
      // Filter by amenities
      for (const [key, value] of Object.entries(searchForm.amenities)) {
        if (value && !hostel.amenities?.[key as keyof typeof hostel.amenities]) {
          return false;
        }
      }
      
      return true;
    });
    
    setFilteredHostels(filtered);
  }, [searchForm, hostels]);
  
  // Update search params in URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    
    if (searchForm.location) {
      newParams.set("location", searchForm.location);
    }
    
    const newSearch = newParams.toString();
    const newUrl = newSearch ? `${location.pathname}?${newSearch}` : location.pathname;
    
    // Replace state instead of push to avoid adding to history
    window.history.replaceState({}, "", newUrl);
  }, [searchForm.location, location.pathname]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchForm({
      ...searchForm,
      [name]: value,
    });
  };
  
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setSearchForm({
      ...searchForm,
      amenities: {
        ...searchForm.amenities,
        [amenity]: checked,
      },
    });
  };
  
  const handlePriceChange = (value: number[]) => {
    setSearchForm({
      ...searchForm,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };
  
  const clearFilters = () => {
    setSearchForm({
      location: "",
      minPrice: 0,
      maxPrice: 1000,
      amenities: {
        wifi: false,
        water: false,
        electricity: false,
        security: false,
        furniture: false,
        kitchen: false,
        bathroom: false,
      },
    });
  };
  
  // Function to determine if any filters are active
  const hasActiveFilters = () => {
    return (
      searchForm.location !== "" ||
      searchForm.minPrice !== 0 ||
      searchForm.maxPrice !== 1000 ||
      Object.values(searchForm.amenities).some((value) => value)
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="bg-gradient-to-b from-secondary/30 to-transparent pt-28 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
            Find Your Perfect Hostel
          </h1>
          <p className="text-muted-foreground text-center mb-6 max-w-2xl mx-auto">
            Search through our curated list of quality hostels to find the perfect accommodation for your needs
          </p>
          
          {/* Main search bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  name="location"
                  value={searchForm.location}
                  onChange={handleInputChange}
                  placeholder="Enter location, area, or city..."
                  className="pl-10 h-12 bg-white"
                />
              </div>
              <Button 
                className="h-12 px-5"
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? "default" : "outline"}
              >
                <SlidersHorizontal size={18} className="mr-2" />
                Filters
              </Button>
            </div>
            
            {/* Advanced filters */}
            {showFilters && (
              <div className="bg-white rounded-lg shadow-lg border border-border p-5 mt-2 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-medium">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-muted-foreground"
                  >
                    <X size={14} className="mr-1" />
                    Clear all
                  </Button>
                </div>
                
                <div className="space-y-5">
                  {/* Price range */}
                  <div>
                    <Label className="mb-2 block">Price Range ($/month)</Label>
                    <div className="pt-4 px-2">
                      <Slider
                        defaultValue={[searchForm.minPrice, searchForm.maxPrice]}
                        min={0}
                        max={1000}
                        step={10}
                        value={[searchForm.minPrice, searchForm.maxPrice]}
                        onValueChange={handlePriceChange}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>${searchForm.minPrice}</span>
                      <span>${searchForm.maxPrice}+</span>
                    </div>
                  </div>
                  
                  {/* Amenities */}
                  <div>
                    <Label className="mb-3 block">Amenities</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                            checked={searchForm.amenities[amenity.id as keyof typeof searchForm.amenities]}
                            onCheckedChange={(checked) => 
                              handleAmenityChange(amenity.id, checked === true)
                            }
                          />
                          <Label htmlFor={amenity.id} className="cursor-pointer text-sm">
                            {amenity.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-background py-8">
        <div className="container mx-auto px-4">
          {/* Results summary */}
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-medium">
              {isLoading
                ? "Loading hostels..."
                : filteredHostels.length === 0
                ? "No hostels found"
                : `${filteredHostels.length} hostel${filteredHostels.length !== 1 ? "s" : ""} found`}
            </h2>
            
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-8"
              >
                <X size={14} className="mr-1" />
                Clear filters
              </Button>
            )}
          </div>
          
          {isLoading ? (
            // Loading state
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-secondary animate-pulse rounded-lg h-[320px]"></div>
              ))}
            </div>
          ) : filteredHostels.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <div className="bg-secondary/30 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No hostels found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                No hostels match your current filters. Try adjusting your search criteria or clearing filters.
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          ) : (
            // Results grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHostels.map((hostel) => (
                <HostelCard key={hostel.id} hostel={hostel} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelSearch;
