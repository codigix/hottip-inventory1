import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building,
  BarChart3,
  Package,
  TrendingUp,
  Calculator,
  Truck,
  Users,
  Bell,
  User,
  Menu,
  Megaphone,
  LogOut,
} from "lucide-react";

const departments = [
  { name: "Admin", href: "/admin", icon: BarChart3 },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Accounts", href: "/accounts", icon: Calculator },
  { name: "Marketing", href: "/marketing", icon: Megaphone },
  { name: "Logistics", href: "/logistics", icon: Truck },
  { name: "Employees", href: "/employees", icon: Users },
];

export function GlobalNavbar() {
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const visibleDepartments = departments.filter((dept) => {
    if (user.role === "admin") return true;
    
    // Check if the user's department matches (case insensitive)
    const userDept = (user.department || "").toLowerCase().trim();
    const deptName = dept.name.toLowerCase().trim();
    
    // Special handling for some department name mappings if needed
    if (userDept === "administration" && deptName === "admin") return true;
    
    return userDept === deptName;
  });

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-4 cursor-pointer">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold text-foreground">BusinessOps</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden as per request (redundant with sidebar) */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-1">
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" data-testid="button-notifications">
              <Bell className="h-4 w-4" />
            </Button>
            
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground capitalize">
                  {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.username}
                </span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              title="Logout"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Building className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="text-xl font-semibold">BusinessOps</span>
                    </div>
                    
                    {visibleDepartments.map((dept) => {
                      const Icon = dept.icon;
                      const isActive = location === dept.href || location.startsWith(`${dept.href}/`);
                      const deptKey = dept.name.toLowerCase();
                      
                      return (
                        <Link 
                          key={dept.href} 
                          href={dept.href} 
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid={`mobile-link-${deptKey}`}
                          data-tour={`nav-module-${deptKey}`}
                        >
                          <Button
                            variant={isActive ? "default" : "ghost"}
                            className="w-full justify-start"
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {dept.name}
                          </Button>
                        </Link>
                      );
                    })}

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:text-destructive mt-4"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
