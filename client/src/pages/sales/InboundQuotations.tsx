// import { useState } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/ui/data-table";
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { useToast } from "@/hooks/use-toast";
// import { FileUploader } from "@/components/FileUploader";
// import { Plus, FileDown, Eye, Upload, CheckCircle, XCircle } from "lucide-react";
// import { insertInboundQuotationSchema, type InsertInboundQuotation } from "@shared/schema";
// import { z } from "zod";

// export default function InboundQuotations() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [uploadedFile, setUploadedFile] = useState<{ uploadURL: string; fileName: string } | null>(null);
//   const { toast } = useToast();

//   const { data: quotations, isLoading } = useQuery({
//     queryKey: ["/inbound-quotations"],
//   });

//   const quotationFormSchema = insertInboundQuotationSchema.extend({
//     quotationNumber: z.string().min(1, "Quotation number is required"),
//     sender: z.string().min(1, "Sender name is required"),
//     quotationDate: z.date(),
//     totalAmount: z.string().min(1, "Total amount is required"),
//   });

//   const form = useForm<z.infer<typeof quotationFormSchema>>({
//   resolver: zodResolver(quotationFormSchema),
//   defaultValues: {
//     senderId: "", // Now a UUID
//     quotationNumber: "",
//     quotationDate: new Date(),
//     totalAmount: "",
//     status: "received",
//     senderType: "vendor",
//     notes: "",
//   },
// });

//   const createQuotationMutation = useMutation({
//     mutationFn: (data: InsertInboundQuotation) =>
//       apiRequest('POST', '/inbound-quotations', {
//         ...data,
//         userId: '19b9aff1-55d8-42f8-bf1f-51f03c4361f3', // Use the test user ID
//         attachmentPath: uploadedFile ? '/objects/' + uploadedFile.uploadURL.split('/uploads/')[1] : null,
//         attachmentName: uploadedFile ? uploadedFile.fileName : null,
//       }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/inbound-quotations"] });
//       toast({
//         title: "Success",
//         description: "Inbound quotation created successfully.",
//       });
//       setIsModalOpen(false);
//       form.reset();
//       setUploadedFile(null);
//     },
//     onError: (error) => {
//       console.error('Failed to create quotation:', error);
//       toast({
//         title: "Error",
//         description: "Failed to create quotation. Please try again.",
//         variant: "destructive",
//       });
//     },
//   });

//   const onSubmit = (values: z.infer<typeof quotationFormSchema>) => {
//     createQuotationMutation.mutate(values);
//   };

//   const handleFileUpload = (result: { uploadURL: string; fileName: string }) => {
//     setUploadedFile(result);
//     toast({
//       title: "File uploaded",
//       description: `${result.fileName} uploaded successfully. You can now submit the quotation.`,
//     });
//   };

//   const columns = [
//     {
//       key: 'quotationNumber',
//       header: 'Quotation #',
//       cell: (quotation: any) => (
//         <div className="font-light">{quotation.quotationNumber}</div>
//       ),
//     },
//     {
//       key: 'sender',
//       header: 'Sender',
//       cell: (quotation: any) => (
//         <div>
//           <div className="font-light">{quotation.sender?.name || 'N/A'}</div>
//           <div className="text-xs text-muted-foreground">
//             {quotation.senderType?.toUpperCase() || 'VENDOR'}
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: 'quotationDate',
//       header: 'Date',
//       cell: (quotation: any) => new Date(quotation.quotationDate).toLocaleDateString(),
//     },
//     {
//       key: 'totalAmount',
//       header: 'Total Amount',
//       cell: (quotation: any) => `₹${parseFloat(quotation.totalAmount).toLocaleString('en-IN')}`,
//     },
//     {
//       key: 'status',
//       header: 'Status',
//       cell: (quotation: any) => {
//         const statusColors = {
//           received: 'bg-blue-100 text-blue-800',
//           under_review: 'bg-yellow-100 text-yellow-800',
//           approved: 'bg-green-100 text-green-800',
//           rejected: 'bg-red-100 text-red-800'
//         };
//         return (
//           <Badge className={statusColors[quotation.status as keyof typeof statusColors] || statusColors.received}>
//             {quotation.status?.replace('_', ' ').toUpperCase() || 'RECEIVED'}
//           </Badge>
//         );
//       },
//     },
//     {
//       key: 'actions',
//       header: 'Actions',
//       cell: (quotation: any) => (
//         <div className="flex items-center space-x-2">
//           <Button size="sm" variant="ghost" data-testid={`button-view-inbound-${quotation.id}`}>
//             <Eye className="h-4 w-4" />
//           </Button>
//           <Button size="sm" variant="ghost" data-testid={`button-approve-${quotation.id}`}>
//             <CheckCircle className="h-4 w-4" />
//           </Button>
//           <Button size="sm" variant="ghost" data-testid={`button-reject-${quotation.id}`}>
//             <XCircle className="h-4 w-4" />
//           </Button>
//         </div>
//       ),
//     }
//   ];

//   return (
//     <div className="p-8">
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight" data-testid="text-inbound-quotations-title">
//             Inbound Quotations
//           </h1>
//           <p className="text-muted-foreground">
//             Manage quotations received from clients and vendors
//           </p>
//         </div>
//         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//           <DialogTrigger asChild>
//             <Button data-testid="button-upload-inbound-quotation">
//               <Upload className="h-4 w-4 mr-2" />
//               Upload Quotation
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>Upload Inbound Quotation</DialogTitle>
//               <DialogDescription>
//                 Upload a quotation received from a client or vendor along with quotation details.
//               </DialogDescription>
//             </DialogHeader>

//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="quotationNumber"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Quotation Number</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="e.g., INB-2025-001"
//                             {...field}
//                             data-testid="input-quotation-number"
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="sender"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Sender Name</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="e.g., ABC Corporation"
//                             {...field}
//                             data-testid="input-sender"
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <FormField
//                     control={form.control}
//                     name="senderType"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Sender Type</FormLabel>
//                         <Select onValueChange={field.onChange} defaultValue={field.value}>
//                           <FormControl>
//                             <SelectTrigger data-testid="select-sender-type">
//                               <SelectValue placeholder="Select type" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             <SelectItem value="client">Client</SelectItem>
//                             <SelectItem value="vendor">Vendor</SelectItem>
//                             <SelectItem value="supplier">Supplier</SelectItem>
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name="totalAmount"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Total Amount</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="e.g., 1500.00"
//                             {...field}
//                             data-testid="input-total-amount"
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 </div>

//                 <FormField
//                   control={form.control}
//                   name="notes"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Notes (Optional)</FormLabel>
//                       <FormControl>
//                         <Textarea
//                           placeholder="Any additional notes about this quotation..."
//                           {...field}
//                           data-testid="textarea-notes"
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <div className="border rounded-lg p-4">
//                   <h4 className="font-light mb-3">Upload Quotation File</h4>
//                   <FileUploader
//                     onUploadComplete={handleFileUpload}
//                     acceptedFileTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                     className="w-full"
//                   />
//                   {uploadedFile && (
//                     <div className="mt-2 text-sm text-green-600" data-testid="text-upload-success">
//                       ✓ File uploaded: {uploadedFile.fileName}
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex justify-end space-x-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => {
//                       setIsModalOpen(false);
//                       form.reset();
//                       setUploadedFile(null);
//                     }}
//                     data-testid="button-cancel"
//                   >
//                     Cancel
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={createQuotationMutation.isPending}
//                     data-testid="button-create-quotation"
//                   >
//                     {createQuotationMutation.isPending ? "Creating..." : "Create Quotation"}
//                   </Button>
//                 </div>
//               </form>
//             </Form>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2">
//             <FileDown className="h-5 w-5" />
//             <span>All Inbound Quotations</span>
//           </CardTitle>
//           <CardDescription>
//             Client/Vendor → Company quotations with review workflow
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <DataTable
//             data={(quotations || [])}
//             columns={columns}
//             searchable={true}
//             searchKey="quotationNumber"
//           />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/FileUploader";
import {
  Plus,
  FileDown,
  Eye,
  Upload,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  insertInboundQuotationSchema,
  type InsertInboundQuotation,
  type Supplier,
} from "@shared/schema"; // Import Supplier type
import { z } from "zod";

export default function InboundQuotations() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    uploadURL: string;
    fileName: string;
  } | null>(null);
  const { toast } = useToast();

  // Fetch inbound quotations
  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["/inbound-quotations"],
  });

  // Fetch suppliers for the sender dropdown
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/suppliers"],
  });

  // Define the form schema based on the corrected Zod schema
  const quotationFormSchema = z.object({
    senderId: z.string().uuid("Sender ID must be a valid UUID"),
    quotationNumber: z.string().min(1, "Quotation number is required"),
    quotationDate: z.string().min(1, "Quotation date is required"), // Keep as string for form handling
    validUntil: z.string().optional(), // Keep as string for form handling
    subject: z.string().optional(),
    totalAmount: z.string().min(1, "Total amount is required"),
    status: z
      .enum(["received", "under_review", "approved", "rejected"])
      .default("received"),
    notes: z.string().optional(),
    senderType: z.enum(["client", "vendor", "supplier"]).default("vendor"),
    attachmentPath: z.string().optional(),
    attachmentName: z.string().optional(),
  });

  const form = useForm<z.infer<typeof quotationFormSchema>>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      senderId: "",
      quotationNumber: "",
      quotationDate: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      subject: "",
      totalAmount: "",
      status: "received",
      senderType: "vendor",
      notes: "",
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: (data: z.infer<typeof quotationFormSchema>) => {
      // Convert date strings to Date objects for the API call
      const formattedData = {
        ...data,
        userId: "79c36f2b-237a-4ba6-a4b3-a12fc8a18446", // Development user ID
        quotationDate: new Date(data.quotationDate),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        attachmentPath: uploadedFile ? uploadedFile.uploadURL : null,
        attachmentName: uploadedFile ? uploadedFile.fileName : null,
      };

      return apiRequest("POST", "/inbound-quotations", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/inbound-quotations"] });
      toast({
        title: "Success",
        description: "Inbound quotation created successfully.",
      });
      setIsModalOpen(false);
      form.reset();
      setUploadedFile(null);
    },
    onError: (error: any) => {
      // Specify error type
      console.error("Failed to create quotation:", error);
      // Handle Zod validation errors from the server
      if (error?.data?.details) {
        toast({
          title: "Validation Error",
          description: "Please check the form fields for errors.",
          variant: "destructive",
        });
        // Optionally, set field errors based on server response
        // This requires mapping server errors back to form fields
      } else {
        toast({
          title: "Error",
          description:
            error?.data?.error ||
            "Failed to create quotation. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (values: z.infer<typeof quotationFormSchema>) => {
    createQuotationMutation.mutate(values);
  };

  const handleFileUpload = (result: {
    uploadURL: string;
    fileName: string;
  }) => {
    setUploadedFile(result);
    toast({
      title: "File uploaded",
      description: `${result.fileName} uploaded successfully. You can now submit the quotation.`,
    });
  };

  const columns = [
    {
      key: "quotationNumber",
      header: "Quotation #",
      cell: (quotation: any) => (
        <div className="font-light">{quotation.quotationNumber}</div>
      ),
    },
    {
      key: "sender",
      header: "Sender",
      cell: (quotation: any) => (
        <div>
          <div className="font-light">{quotation.senderId || "N/A"}</div>{" "}
          {/* Display senderId or a name if joined later */}
          <div className="text-xs text-muted-foreground">
            {quotation.senderType?.toUpperCase() || "VENDOR"}
          </div>
        </div>
      ),
    },
    {
      key: "quotationDate",
      header: "Date",
      cell: (quotation: any) =>
        new Date(quotation.quotationDate).toLocaleDateString(),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      cell: (quotation: any) =>
        `₹${parseFloat(quotation.totalAmount).toLocaleString("en-IN")}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (quotation: any) => {
        const statusColors = {
          received: "bg-blue-100 text-blue-800",
          under_review: "bg-yellow-100 text-yellow-800",
          approved: "bg-green-100 text-green-800",
          rejected: "bg-red-100 text-red-800",
        };
        return (
          <Badge
            className={
              statusColors[quotation.status as keyof typeof statusColors] ||
              statusColors.received
            }
          >
            {quotation.status?.replace("_", " ").toUpperCase() || "RECEIVED"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (quotation: any) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-view-inbound-${quotation.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-approve-${quotation.id}`}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-reject-${quotation.id}`}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            data-testid="text-inbound-quotations-title"
          >
            Inbound Quotations
          </h1>
          <p className="text-muted-foreground">
            Manage quotations received from clients and vendors
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-inbound-quotation">
              <Upload className="h-4 w-4 mr-2" />
              Upload Quotation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Inbound Quotation</DialogTitle>
              <DialogDescription>
                Upload a quotation received from a client or vendor along with
                quotation details.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., INB-2025-001"
                            {...field}
                            data-testid="input-quotation-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-sender">
                              <SelectValue placeholder="Select sender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Select a sender</SelectItem>
                            {suppliers.map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
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
                    name="senderType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-sender-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="supplier">Supplier</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 1500.00"
                            {...field}
                            data-testid="input-total-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quotationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-quotation-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-valid-until"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Supply of Goods"
                          {...field}
                          data-testid="input-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional notes about this quotation..."
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-lg p-4">
                  <h4 className="font-light mb-3">Upload Quotation File</h4>
                  <FileUploader
                    onUploadComplete={handleFileUpload}
                    acceptedFileTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full"
                  />
                  {uploadedFile && (
                    <div
                      className="mt-2 text-sm text-green-600"
                      data-testid="text-upload-success"
                    >
                      ✓ File uploaded: {uploadedFile.fileName}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      form.reset();
                      setUploadedFile(null);
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createQuotationMutation.isPending}
                    data-testid="button-create-quotation"
                  >
                    {createQuotationMutation.isPending
                      ? "Creating..."
                      : "Create Quotation"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileDown className="h-5 w-5" />
            <span>All Inbound Quotations</span>
          </CardTitle>
          <CardDescription>
            Client/Vendor → Company quotations with review workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={quotations}
            columns={columns}
            searchable={true}
            searchKey="quotationNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}
