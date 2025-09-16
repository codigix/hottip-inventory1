import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Calendar, TrendingUp, BarChart3, Package, Building2 } from "lucide-react";

export default function InventoryReports() {
  const [dateRange, setDateRange] = useState("last-30-days");

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Reports</h1>
          <p className="text-muted-foreground">Stock balance, vendor history, and reorder forecasts</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-all">
            <Download className="h-4 w-4 mr-2" />
            Export All Reports
          </Button>
        </div>
      </div>

      {/* Quick Report Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-stock-balance">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Balance</p>
                <p className="text-lg font-semibold text-foreground">Current levels</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-vendor-history">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vendor History</p>
                <p className="text-lg font-semibold text-foreground">Performance</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-reorder-forecast">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reorder Forecast</p>
                <p className="text-lg font-semibold text-foreground">Predictions</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-analytics">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analytics</p>
                <p className="text-lg font-semibold text-foreground">Insights</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="stock-balance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stock-balance">Stock Balance</TabsTrigger>
          <TabsTrigger value="vendor-analysis">Vendor Analysis</TabsTrigger>
          <TabsTrigger value="reorder-forecast">Reorder Forecast</TabsTrigger>
          <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="stock-balance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Current Stock Balance Report</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Stock Value</p>
                    <p className="text-2xl font-bold">₹12,45,380</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Low Stock Items</p>
                    <p className="text-2xl font-bold text-red-600">23</p>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h3 className="font-semibold mb-4">Stock by Category</h3>
                  <div className="space-y-3">
                    {[
                      { category: "Steel Products", items: 456, value: "₹4,23,120", percentage: 34 },
                      { category: "Aluminum Sheets", items: 234, value: "₹2,67,890", percentage: 21 },
                      { category: "Spare Parts", items: 567, value: "₹3,54,370", percentage: 28 },
                      { category: "Tools & Equipment", items: 78, value: "₹1,98,000", percentage: 17 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          <p className="text-sm text-muted-foreground">{item.items} items</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Vendor Performance Analysis</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Top Vendors */}
                <div>
                  <h3 className="font-semibold mb-4">Top Performing Vendors</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Steel Industries Ltd", orders: 45, onTime: "98%", quality: "A+", value: "₹8,45,200" },
                      { name: "Aluminum Works", orders: 32, onTime: "94%", quality: "A", value: "₹5,67,890" },
                      { name: "Parts Supply Co", orders: 28, onTime: "91%", quality: "A-", value: "₹3,21,450" }
                    ].map((vendor, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{vendor.name}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Orders</p>
                          <p className="font-medium">{vendor.orders}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">On Time</p>
                          <p className="font-medium">{vendor.onTime}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Quality</p>
                          <p className="font-medium">{vendor.quality}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="font-medium">{vendor.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder-forecast">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Reorder Forecast & Planning</span>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Forecast Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="forecast-period">Forecast Period</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-month">1 Month</SelectItem>
                        <SelectItem value="3-months">3 Months</SelectItem>
                        <SelectItem value="6-months">6 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="demand-model">Demand Model</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moving-average">Moving Average</SelectItem>
                        <SelectItem value="exponential">Exponential Smoothing</SelectItem>
                        <SelectItem value="linear-trend">Linear Trend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button className="mt-6 w-full">Generate Forecast</Button>
                  </div>
                </div>

                {/* Reorder Recommendations */}
                <div>
                  <h3 className="font-semibold mb-4">Immediate Reorder Recommendations</h3>
                  <div className="space-y-3">
                    {[
                      { item: "Steel Rods - 12mm", current: 15, min: 25, suggested: 100, urgency: "High" },
                      { item: "Aluminum Sheet - 5mm", current: 8, min: 10, suggested: 50, urgency: "Medium" },
                      { item: "Bearing Assembly", current: 3, min: 5, suggested: 20, urgency: "High" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-muted-foreground">Current: {item.current} | Min: {item.min}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Suggest: {item.suggested}</p>
                          <span className={`text-xs px-2 py-1 rounded ${item.urgency === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {item.urgency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-reports">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Report Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory-movement">Inventory Movement</SelectItem>
                        <SelectItem value="vendor-performance">Vendor Performance</SelectItem>
                        <SelectItem value="cost-analysis">Cost Analysis</SelectItem>
                        <SelectItem value="demand-analysis">Demand Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date Range</Label>
                    <div className="flex space-x-2">
                      <Input type="date" />
                      <Input type="date" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>Filters</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="steel">Steel Products</SelectItem>
                        <SelectItem value="aluminum">Aluminum</SelectItem>
                        <SelectItem value="spares">Spare Parts</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Location..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wh-a">Warehouse A</SelectItem>
                        <SelectItem value="wh-b">Warehouse B</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="steel-ind">Steel Industries</SelectItem>
                        <SelectItem value="aluminum-works">Aluminum Works</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Preview</Button>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}