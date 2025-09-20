import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, MapPin, User as UserIcon, Clock, Target, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { FieldVisit, InsertFieldVisit, User, Lead } from "@shared/schema";

const visitFormSchema = z.object({
  leadId: z.string().min(1, "Lead is required"),
  plannedDate: z.date({ required_error: "Visit date is required" }),
  plannedStartTime: z.string().optional(),
  plannedEndTime: z.string().optional(),
  assignedTo: z.string().optional(),
  visitAddress: z.string().min(1, "Visit address is required"),
  visitCity: z.string().optional(),
  visitState: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  purpose: z.enum(['initial_meeting', 'demo', 'follow_up', 'quotation_discussion', 'negotiation', 'closing', 'support', 'other']),
  preVisitNotes: z.string().optional(),
  travelExpense: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitFormSchema>;

interface VisitWithDetails extends FieldVisit {
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

interface VisitFormProps {
  visit?: VisitWithDetails | null;
  leads: Lead[];
  users: User[];
  onSubmit: (data: InsertFieldVisit) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function VisitForm({ visit, leads, users, onSubmit, onCancel, isLoading = false }: VisitFormProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      purpose: "initial_meeting",
      visitCity: "",
      visitState: "",
      preVisitNotes: "",
      travelExpense: "",
    }
  });

  // Update form when visit data changes
  useEffect(() => {
    if (visit) {
      const visitData = {
        leadId: visit.leadId,
        plannedDate: visit.plannedDate ? new Date(visit.plannedDate) : new Date(),
        plannedStartTime: visit.plannedStartTime ? 
          format(new Date(visit.plannedStartTime), 'HH:mm') : '',
        plannedEndTime: visit.plannedEndTime ? 
          format(new Date(visit.plannedEndTime), 'HH:mm') : '',
        assignedTo: visit.assignedTo,
        visitAddress: visit.visitAddress,
        visitCity: visit.visitCity || '',
        visitState: visit.visitState || '',
        latitude: visit.latitude ? parseFloat(visit.latitude) : undefined,
        longitude: visit.longitude ? parseFloat(visit.longitude) : undefined,
        purpose: visit.purpose,
        preVisitNotes: visit.preVisitNotes || '',
        travelExpense: visit.travelExpense || '',
      };
      
      form.reset(visitData);
      
      // Find and set the selected lead
      const lead = leads.find(l => l.id === visit.leadId);
      if (lead) {
        setSelectedLead(lead);
      }
    } else {
      form.reset();
      setSelectedLead(null);
    }
  }, [visit, leads, form]);

  // Handle lead selection
  const handleLeadChange = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      
      // Auto-fill address if available
      if (lead.address) {
        form.setValue('visitAddress', lead.address);
        form.setValue('visitCity', lead.city || '');
        form.setValue('visitState', lead.state || '');
      }
    }
  };

  // Get user's current location for GPS coordinates
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Handle form submission
  const handleSubmit = (data: VisitFormData) => {
    const submitData: InsertFieldVisit = {
      leadId: data.leadId,
      plannedDate: data.plannedDate,
      plannedStartTime: data.plannedStartTime ? 
        new Date(`${format(data.plannedDate, 'yyyy-MM-dd')}T${data.plannedStartTime}`) : 
        undefined,
      plannedEndTime: data.plannedEndTime ? 
        new Date(`${format(data.plannedDate, 'yyyy-MM-dd')}T${data.plannedEndTime}`) : 
        undefined,
      assignedTo: data.assignedTo,
      visitAddress: data.visitAddress,
      visitCity: data.visitCity,
      visitState: data.visitState,
      latitude: data.latitude?.toString(),
      longitude: data.longitude?.toString(),
      purpose: data.purpose,
      preVisitNotes: data.preVisitNotes,
      travelExpense: data.travelExpense,
      status: 'scheduled',
    };

    onSubmit(submitData);
  };

  // Generate visit number (for display purposes)
  const generateVisitNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FV${year}${month}${day}${random}`;
  };

  // Filter active users for assignment
  const activeUsers = users.filter(user => user.isActive);

  // Filter leads that are not converted or dropped
  const availableLeads = leads.filter(lead => 
    ['new', 'contacted', 'in_progress'].includes(lead.status || 'new')
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" data-testid="tab-basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="location" data-testid="tab-location-info">Location</TabsTrigger>
            <TabsTrigger value="details" data-testid="tab-visit-details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Customer/Lead *</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleLeadChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-lead">
                          <SelectValue placeholder="Select a lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLeads.map(lead => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.firstName} {lead.lastName}
                            {lead.companyName && ` - ${lead.companyName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>Assigned To *</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-assigned-to">
                          <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} - {user.department || 'Marketing'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="plannedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Visit Date *</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                            data-testid="button-select-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Start Time</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field}
                        data-testid="input-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedEndTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>End Time</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field}
                        data-testid="input-end-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span>Visit Purpose *</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-purpose">
                        <SelectValue placeholder="Select visit purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="initial_meeting">Initial Meeting</SelectItem>
                      <SelectItem value="demo">Product Demo</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="quotation_discussion">Quotation Discussion</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lead Information Card */}
            {selectedLead && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-light">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </p>
                    </div>
                    {selectedLead.companyName && (
                      <div>
                        <span className="text-muted-foreground">Company:</span>
                        <p className="font-light">{selectedLead.companyName}</p>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-light">{selectedLead.phone}</p>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-light">{selectedLead.email}</p>
                      </div>
                    )}
                  </div>
                  {selectedLead.requirementDescription && (
                    <div>
                      <span className="text-muted-foreground">Requirements:</span>
                      <p className="text-sm mt-1">{selectedLead.requirementDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <FormField
              control={form.control}
              name="visitAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Visit Address *</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the complete visit address"
                      {...field}
                      data-testid="input-visit-address"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visitCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="City"
                        {...field}
                        data-testid="input-visit-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="State"
                        {...field}
                        data-testid="input-visit-state"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="any"
                        placeholder="e.g. 12.9716"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ''}
                        data-testid="input-latitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="any"
                        placeholder="e.g. 77.5946"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ''}
                        data-testid="input-longitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="w-full"
                  data-testid="button-get-location"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get GPS
                </Button>
              </div>
            </div>

            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-light text-blue-900 dark:text-blue-100">GPS Coordinates</p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      GPS coordinates help verify the actual visit location during check-in. 
                      You can get your current location or enter coordinates manually.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <FormField
              control={form.control}
              name="preVisitNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Pre-Visit Notes</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any preparation notes, talking points, or special instructions for this visit..."
                      {...field}
                      data-testid="textarea-pre-visit-notes"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="travelExpense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Travel Expense</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="Enter amount (e.g. 500.00)"
                      {...field}
                      data-testid="input-travel-expense"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visit Summary */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Visit Number:</span>
                    <p className="font-light">{visit?.visitNumber || generateVisitNumber()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-light">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? 'Saving...' : (visit ? 'Update Visit' : 'Schedule Visit')}
          </Button>
        </div>
      </form>
    </Form>
  );
}