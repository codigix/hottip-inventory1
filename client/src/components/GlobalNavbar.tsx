import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <Link href="/" data-testid="link-home">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-semibold text-foregroun">BusinessOps</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {departments.map((dept) => {
              const Icon = dept.icon;
              const isActive = location === dept.href;
              const deptKey = dept.name.toLowerCase();
              
              return (
                <Link key={dept.href} href={dept.href} data-testid={`link-${deptKey}`} data-tour={`nav-module-${deptKey}`}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{dept.name}</span>
                  </Button>
                </Link>
              );
            })}
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
              <span className="text-sm font-light text-foreground">John Admin</span>
            </div>

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
                    
                    {departments.map((dept) => {
                      const Icon = dept.icon;
                      const isActive = location === dept.href;
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
