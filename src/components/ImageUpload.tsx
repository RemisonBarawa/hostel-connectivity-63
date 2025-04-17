
import { useState } from "react";
import { X, Plus, Image as ImageIcon } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface ImageUploadProps {
  maxImages?: number;
  onImagesChange: (images: string[]) => void;
  initialImages?: string[];
}

const ImageUpload = ({
  maxImages = 5,
  onImagesChange,
  initialImages = [],
}: ImageUploadProps) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [imageUrl, setImageUrl] = useState<string>("");

  const addImage = () => {
    if (!imageUrl.trim()) return;
    
    if (images.length >= maxImages) {
      alert(`You can only add up to ${maxImages} images.`);
      return;
    }
    
    const newImages = [...images, imageUrl.trim()];
    setImages(newImages);
    onImagesChange(newImages);
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImage();
    }
  };

  const isValidUrl = (url: string) => {
    try {
      return Boolean(url.trim()) && 
        (url.startsWith('http://') || url.startsWith('https://'));
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
            onKeyPress={handleKeyPress}
            className={!isValidUrl(imageUrl) && imageUrl.trim() !== "" ? "border-red-300" : ""}
          />
          {!isValidUrl(imageUrl) && imageUrl.trim() !== "" && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid URL (starting with http:// or https://)
            </p>
          )}
        </div>
        <Button 
          type="button" 
          onClick={addImage}
          disabled={!isValidUrl(imageUrl) || images.length >= maxImages}
        >
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Image previews */}
        {images.map((image, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-md overflow-hidden border border-border group"
          >
            <img 
              src={image} 
              alt={`Uploaded image ${index + 1}`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {/* Upload placeholder */}
        {images.length === 0 && (
          <div className="aspect-square rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center">
            <ImageIcon size={24} className="text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">
              No images added yet
            </span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {images.length} of {maxImages} images added. Enter image URLs to add them to your listing.
      </p>
    </div>
  );
};

export default ImageUpload;
