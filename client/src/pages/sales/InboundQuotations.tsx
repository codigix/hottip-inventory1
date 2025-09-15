import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus, FileDown, Eye, Upload, CheckCircle, XCircle } from "lucide-react";

export default function InboundQuotations() {
  const { data: quotations, isLoading } = useQuery({
    queryKey: ["/api/inbound-quotations"],
  });

  const columns = [
    {
      key: 'quotationNumber',
      header: 'Quotation #',
      cell: (quotation: any) => (
        <div className="font-medium">{quotation.quotationNumber}</div>
      ),
    },
    {
      key: 'sender',
      header: 'Sender',
      cell: (quotation: any) => (
        <div>
          <div className="font-medium">{quotation.sender?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">
            {quotation.senderType?.toUpperCase() || 'VENDOR'}
          </div>
        </div>
      ),
    },
    {
      key: 'quotationDate',
      header: 'Date',
      cell: (quotation: any) => new Date(quotation.quotationDate).toLocaleDateString(),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      cell: (quotation: any) => `₹${parseFloat(quotation.totalAmount).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (quotation: any) => {
        const statusColors = {
          received: 'bg-blue-100 text-blue-800',
          under_review: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800'
        };
        return (
          <Badge className={statusColors[quotation.status as keyof typeof statusColors] || statusColors.received}>
            {quotation.status?.replace('_', ' ').toUpperCase() || 'RECEIVED'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (quotation: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid={`button-view-inbound-${quotation.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-approve-${quotation.id}`}>
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-reject-${quotation.id}`}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-inbound-quotations-title">
            Inbound Quotations
          </h1>
          <p className="text-muted-foreground">
            Manage quotations received from clients and vendors
          </p>
        </div>
        <Button data-testid="button-upload-inbound-quotation">
          <Upload className="h-4 w-4 mr-2" />
          Upload Quotation
        </Button>
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
            data={(quotations || [])}
            columns={columns}
            searchable={true}
            searchKey="quotationNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}