import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, MapPin, User as UserIcon, Clock, Target, FileText, Calendar as LucideCalendar, AlertCircle, Timer } from "lucide-react";
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
  plannedDate: z.date({ required_error: "Deal date is required" }),
  plannedStartTime: z.string().optional(),
  assignedTo: z.string().optional(),
  visitAddress: z.string().min(1, "Visit address is required"),
  visitCity: z.string().optional(),
  visitState: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  purpose: z.enum(['initial_meeting', 'demo', 'follow_up', 'quotation_discussion', 'negotiation', 'closing', 'support', 'other']),
  status: z.enum(['scheduled', 'upcoming', 'completed', 'cancelled', 'in_progress']).optional(),
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

  // Fetch purpose logs for the selected visit
  const { data: purposeLogs = [] } = useQuery<any[]>({
    queryKey: [visit ? `/api/field-visits/${visit.id}/purpose-logs` : ""],
    enabled: !!visit?.id,
  });

  const getPurposeText = (purpose: string) => {
    const purposeMap: Record<string, string> = {
      initial_meeting: "Initial Meeting",
      demo: "Product Demo",
      follow_up: "Follow Up",
      quotation_discussion: "Quotation Discussion",
      negotiation: "Negotiation",
      closing: "Closing",
      support: "Support",
      other: "Other",
    };
    return purposeMap[purpose] || purpose;
  };

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      purpose: "initial_meeting",
      status: "scheduled",
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
        assignedTo: visit.assignedTo,
        visitAddress: visit.visitAddress,
        visitCity: visit.visitCity || '',
        visitState: visit.visitState || '',
        latitude: visit.latitude ? parseFloat(visit.latitude) : undefined,
        longitude: visit.longitude ? parseFloat(visit.longitude) : undefined,
        purpose: visit.purpose,
        status: (["in progress", "upcoming", "in_progress"].includes(visit.status.toLowerCase().replace("_", " ")) 
          ? "upcoming" 
          : visit.status.toLowerCase().replace(" ", "_")) as any,
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

      // Auto-fill assignedTo if available in lead
      if (lead.assignedTo) {
        form.setValue('assignedTo', lead.assignedTo);
      }
    }
  };

  // Handle form submission
  const handleSubmit = (data: VisitFormData) => {
    // If purpose changed, force status back to Scheduled
    const purposeChanged = visit && data.purpose !== visit.purpose;
    
    const submitData: InsertFieldVisit = {
      leadId: data.leadId,
      plannedDate: data.plannedDate,
      plannedStartTime: data.plannedStartTime ? 
        new Date(`${format(data.plannedDate, 'yyyy-MM-dd')}T${data.plannedStartTime}`) : 
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
      status: purposeChanged ? 'Scheduled' : (data.status ? 
        (data.status.charAt(0).toUpperCase() + data.status.slice(1)).replace("_", " ") : 
        'Scheduled'),
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
  const activeUsers = users.filter(user => user.isActive !== false);

  // Filter leads that are not converted or dropped
  const availableLeads = leads.filter(lead => 
    ['new', 'contacted', 'in_progress'].includes(lead.status || 'new')
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 my-3">
            <TabsTrigger value="basic" data-testid="tab-basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="location" data-testid="tab-location-info">Location</TabsTrigger>
            <TabsTrigger value="details" data-testid="tab-visit-details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
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
                      value={field.value}
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
                    <Select onValueChange={field.onChange} value={field.value || ""}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plannedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Deal Date *</span>
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-gray-500 text-xs"
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
                      <span>Scheduled Time</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        {...field}
                        data-testid="input-scheduled-time"
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {visit && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Timer className="h-4 w-4" />
                      <span>Visit Status *</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        {form.watch("purpose") === "closing" && (
                          <SelectItem value="completed">Completed</SelectItem>
                        )}
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {visit && purposeLogs && purposeLogs.length > 0 && (
              <div className=" space-y-2 p-2 bg-slate-50 dark:bg-primary rounded-lg border-l-4 border-blue-500">
                <p className="text-xs text-slate-500    mb-2">Visit Purpose History</p>
                <div className="space-y-2">
                  {purposeLogs
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                        <div className="space-y-1">
                          <p className="text-xs  text-slate-800 dark:text-slate-200">
                            {getPurposeText(log.purpose)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <LucideCalendar className="h-3 w-3" />
                            <span>{format(new Date(log.visitDate), "dd MMM yyyy")}</span>
                          </div>
                        </div>
                        <div className="text-xs  text-green-600 ">
                          {log.status}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Lead Information Card */}
            {selectedLead && (
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Name:</span>
                      <p className="font-light">
                        {selectedLead.firstName} {selectedLead.lastName}
                      </p>
                    </div>
                    {selectedLead.companyName && (
                      <div>
                        <span className="text-gray-500 text-xs">Company:</span>
                        <p className="font-light">{selectedLead.companyName}</p>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div>
                        <span className="text-gray-500 text-xs">Phone:</span>
                        <p className="font-light">{selectedLead.phone}</p>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div>
                        <span className="text-gray-500 text-xs">Email:</span>
                        <p className="font-light">{selectedLead.email}</p>
                      </div>
                    )}
                  </div>
                  {selectedLead.requirementDescription && (
                    <div>
                      <span className="text-gray-500 text-xs">Requirements:</span>
                      <p className="text-sm mt-1">{selectedLead.requirementDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="location" className="space-y-4 mt-5">
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
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-5">
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
                    <span className="text-gray-500 text-xs">Visit Number:</span>
                    <p className="font-light text-sm">{visit?.visitNumber || generateVisitNumber()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Status:</span>
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