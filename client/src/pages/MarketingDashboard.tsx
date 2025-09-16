import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  MapPin, 
  TrendingUp, 
  Target, 
  Calendar,
  PhoneCall,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function MarketingDashboard() {
  return (
    <div className="p-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Marketing Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of marketing activities, leads, and performance metrics
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-total-leads">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-campaigns">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 ending this week
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-field-visits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Visits Today</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              5 completed, 3 pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-leads">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Recent Leads</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Acme Corp</p>
                <p className="text-sm text-muted-foreground">Software Development</p>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Qualified</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tech Solutions Ltd</p>
                <p className="text-sm text-muted-foreground">IT Services</p>
              </div>
              <div className="flex items-center space-x-1">
                <PhoneCall className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Follow-up</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Global Industries</p>
                <p className="text-sm text-muted-foreground">Manufacturing</p>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">New</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-visits">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Field Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Visit Acme Corp</p>
                <p className="text-sm text-muted-foreground">Today, 2:00 PM</p>
              </div>
              <span className="text-sm text-blue-600 font-medium">Scheduled</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Demo at Tech Solutions</p>
                <p className="text-sm text-muted-foreground">Tomorrow, 10:00 AM</p>
              </div>
              <span className="text-sm text-blue-600 font-medium">Confirmed</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Follow-up Global Industries</p>
                <p className="text-sm text-muted-foreground">Thursday, 3:30 PM</p>
              </div>
              <span className="text-sm text-gray-600 font-medium">Pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card data-testid="card-performance-overview">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">127</div>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">31</div>
              <p className="text-sm text-muted-foreground">Converted</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">45</div>
              <p className="text-sm text-muted-foreground">Field Visits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}