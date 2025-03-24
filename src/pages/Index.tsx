
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Key, User } from "lucide-react";
import Navbar from "../components/Navbar";

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-white via-secondary/20 to-primary/5 -z-10" />
    
    {/* Decorative elements */}
    <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
    <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
    
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-20">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 md:pr-12">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-block">
              <span className="bg-primary/10 text-primary py-1 px-3 rounded-full text-sm font-medium">
                Find your perfect hostel
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Your Gateway to <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                Comfortable Living
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md">
              Connect with quality hostels, streamline your search, and book your ideal accommodation in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/hostel-search">
                <Button size="lg" className="group">
                  Find Hostels
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="lg" variant="outline">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/2 mt-12 md:mt-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="relative">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-border">
              <img 
                src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80" 
                alt="Modern hostel room" 
                className="w-full h-auto rounded-t-2xl"
              />
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold">Student-Friendly Accommodations</h3>
                <p className="text-muted-foreground">Find affordable, quality hostels close to your campus.</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">$250-$500/month</span>
                  <Button size="sm">View Options</Button>
                </div>
              </div>
            </div>
            
            {/* Floating card */}
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

const FeaturesSection = () => (
  <section className="py-20 bg-secondary/30">
    <div className="container mx-auto px-4 md:px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-muted-foreground">
          HostelConnect provides a seamless experience for both students and hostel owners
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <User className="text-primary" size={32} />,
            title: "Create Your Account",
            description: "Sign up as a student to find hostels or as an owner to list your property",
          },
          {
            icon: <Home className="text-primary" size={32} />,
            title: "Find or List Hostels",
            description: "Search for available hostels or create detailed listings for your properties",
          },
          {
            icon: <Key className="text-primary" size={32} />,
            title: "Connect & Book",
            description: "Request bookings directly through the platform with secure messaging",
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
            Join thousands of students who have found their ideal accommodation through HostelConnect.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/hostel-search">
              <Button size="lg" className="w-full sm:w-auto">
                Browse Hostels
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
              <li><a href="mailto:support@hostelconnect.com" className="text-sm text-muted-foreground hover:text-primary">support@hostelconnect.com</a></li>
              <li><a href="tel:+1234567890" className="text-sm text-muted-foreground hover:text-primary">+1 (234) 567-890</a></li>
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
