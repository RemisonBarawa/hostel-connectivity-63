import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Key, User } from "lucide-react";
import Navbar from "../components/Navbar";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const HeroSection = () => {
  const autoplayOptions = {
    delay: 3000,
    stopOnInteraction: false,
    stopOnMouseEnter: true
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-white via-secondary/20 to-primary/5 -z-10" />
      
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-20">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block">
                <span className="bg-primary/10 text-primary py-1 px-3 rounded-full text-sm font-medium">
                  Student Accommodation
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Affordable Hostels Near <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                  Kirinyaga University
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md">
                Browse verified hostel listings, filter by price, location, and amenities, and find your ideal accommodation near campus.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/hostel-search">
                  <Button size="lg" className="group">
                    Browse Hostels Now
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="lg" variant="outline">
                    List Your Hostel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 mt-12 md:mt-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-border">
                <Carousel 
                  className="w-full" 
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay(autoplayOptions)
                  ]}
                >
                  <CarouselContent>
                    {[
                      "photo-1568605114967-8130f3a36994",
                      "photo-1556228453-efd6c1ff04f6",
                      "photo-1564013799919-ab600027ffc6",
                      "photo-1605276374104-dee2a0ed3cd6"
                    ].map((id, index) => (
                      <CarouselItem key={id}>
                        <img 
                          src={`https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80`}
                          alt={`Student hostel preview ${index + 1}`}
                          className="w-full h-[300px] object-cover rounded-t-2xl"
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </Carousel>
                
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold">Student-Friendly Accommodations</h3>
                  <p className="text-muted-foreground">Find affordable, quality hostels close to your campus.</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">KES250-KES500/month</span>
                    <Button size="sm">View Options</Button>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg border border-border max-w-[200px] hidden md:block">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Key className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quick & Secure</p>
                    <p className="text-xs text-muted-foreground">Book in minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => (
  <section className="py-20 bg-secondary/30" id="features">
    <div className="container mx-auto px-4 md:px-6">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Your Trusted Platform for Student Accommodation
      </h2>
      <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
        Find quality hostels near Kirinyaga University with our easy-to-use platform
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <User className="text-primary" size={32} />,
            title: "Verified Listings",
            description: "All hostel listings are verified to ensure trust and safety for students",
          },
          {
            icon: <Home className="text-primary" size={32} />,
            title: "Local Expertise",
            description: "Deep understanding of Kirinyaga University's housing market",
          },
          {
            icon: <Key className="text-primary" size={32} />,
            title: "Easy Booking",
            description: "Simple process to find and secure your ideal accommodation",
          },
        ].map((feature, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-border flex flex-col items-center text-center"
          >
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4 md:px-6">
      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-8 md:p-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Perfect Hostel?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join hundreds of Kirinyaga University students who have found their ideal accommodation through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hostel-search">
              <Button size="lg" className="w-full sm:w-auto">
                Search Hostels
              </Button>
            </Link>
            <Link to="/auth?mode=signup&role=owner">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                List Your Property
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-secondary/40 py-10 border-t border-border">
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-6 md:mb-0">
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            HostelConnect
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Connecting students to quality hostels</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          <div>
            <h3 className="font-medium mb-2">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link></li>
              <li><Link to="/hostel-search" className="text-sm text-muted-foreground hover:text-primary">Find Hostels</Link></li>
              <li><Link to="/auth?mode=login" className="text-sm text-muted-foreground hover:text-primary">Sign In</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">For Owners</h3>
            <ul className="space-y-1">
              <li><Link to="/auth?mode=signup&role=owner" className="text-sm text-muted-foreground hover:text-primary">List Property</Link></li>
              <li><Link to="/owner-dashboard" className="text-sm text-muted-foreground hover:text-primary">Owner Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Contact</h3>
            <ul className="space-y-1">
              <li><a href="mailto:hostelconnect@gmail.com" className="text-sm text-muted-foreground hover:text-primary">support@hostelconnect.com</a></li>
              <li><a href="tel:+1234567890" className="text-sm text-muted-foreground hover:text-primary">+254713156080</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="border-t border-border mt-10 pt-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} HostelConnect. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
