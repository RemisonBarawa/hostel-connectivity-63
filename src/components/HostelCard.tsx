
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MapPin, Wifi, Droplet, Zap, Users, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

export interface Hostel {
  id: string;
  name: string;
  location: string;
  price: number;
  rooms: number;
  description?: string;
  amenities: {
    wifi: boolean;
    water: boolean;
    electricity: boolean;
    security?: boolean;
    furniture?: boolean;
    kitchen?: boolean;
    bathroom?: boolean;
    [key: string]: boolean | undefined;
  };
  images: string[];
  ownerId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface HostelCardProps {
  hostel: Hostel;
  compact?: boolean;
}

const HostelCard = ({ hostel, compact = false }: HostelCardProps) => {
  const { id, name, location, price, rooms, description, amenities, images } = hostel;
  
  // Use placeholder image if none provided
  const imageUrl = images && images.length > 0 
    ? images[0] 
    : "/placeholder.svg";

  return (
    <Card className={`overflow-hidden ${compact ? '' : 'card-hover'}`}>
      <div className="relative">
        <img
          src={imageUrl}
          alt={name}
          className={`w-full object-cover ${compact ? 'h-36' : 'h-48'}`}
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90 text-primary-foreground backdrop-blur-sm">
            KES {price}/month
          </Badge>
        </div>
      </div>
      
      <CardContent className={`${compact ? 'p-3' : 'p-5'}`}>
        <div className="space-y-2">
          <h3 className={`font-semibold ${compact ? 'text-base' : 'text-xl'}`}>{name}</h3>
          
          <div className="flex items-center text-muted-foreground">
            <MapPin size={compact ? 14 : 16} className="mr-1 text-primary" />
            <span className={`${compact ? 'text-xs' : 'text-sm'}`}>{location}</span>
          </div>
          
          <div className={`flex items-center ${compact ? 'text-xs mt-1' : 'text-sm mt-2'}`}>
            <Users size={compact ? 14 : 16} className="mr-1 text-primary" />
            <span>{rooms} room{rooms !== 1 ? 's' : ''} available</span>
          </div>
          
          <div className={`flex space-x-2 ${compact ? 'mt-2' : 'mt-3'}`}>
            {amenities.wifi && (
              <Badge variant="outline" className="bg-secondary/50">
                <Wifi size={compact ? 12 : 14} className="mr-1" /> Wifi
              </Badge>
            )}
            {amenities.water && (
              <Badge variant="outline" className="bg-secondary/50">
                <Droplet size={compact ? 12 : 14} className="mr-1" /> Water
              </Badge>
            )}
            {amenities.electricity && (
              <Badge variant="outline" className="bg-secondary/50">
                <Zap size={compact ? 12 : 14} className="mr-1" /> Power
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className={`${compact ? 'px-3 py-2' : 'px-5 py-3'} border-t bg-secondary/20`}>
        <Link to={`/hostel/${id}`} className="w-full">
          <Button 
            variant={compact ? "ghost" : "default"} 
            className={`w-full justify-between ${compact ? 'h-8 text-xs' : ''}`}
          >
            <span>View Details</span>
            <ArrowRight size={compact ? 14 : 16} />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default HostelCard;
