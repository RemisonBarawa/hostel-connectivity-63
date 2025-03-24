
import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    
    if (!fileList) return;
    
    // Convert FileList to array and check if we're not exceeding max images
    const selectedFiles = Array.from(fileList);
    const totalImages = images.length + selectedFiles.length;
    
    if (totalImages > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      return;
    }
    
    // Read files as data URLs
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImages = [...images, event.target.result.toString()];
          setImages(newImages);
          onImagesChange(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
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
        
        {/* Upload button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-md border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center transition-colors"
          >
            <Upload size={24} className="text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">
              {images.length === 0 ? "Upload Images" : "Add More"}
            </span>
          </button>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      
      <p className="text-xs text-muted-foreground">
        {images.length} of {maxImages} images uploaded. Click on an image to remove it.
      </p>
    </div>
  );
};

export default ImageUpload;
