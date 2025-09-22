import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Receipt, Eye, Download, Send } from "lucide-react";

export default function InvoiceManagement() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/invoices"],
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      cell: (invoice: any) => (
        <div className="font-light">{invoice.invoiceNumber}</div>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      cell: (invoice: any) => (
        <div>
          <div className="font-light">{invoice.customer?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{invoice.customer?.gstNumber || ''}</div>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Date',
      cell: (invoice: any) => new Date(invoice.invoiceDate).toLocaleDateString(),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      cell: (invoice: any) => `₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}`,
    },
    {
      key: 'balanceAmount',
      header: 'Balance',
      cell: (invoice: any) => `₹${parseFloat(invoice.balanceAmount).toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (invoice: any) => {
        const statusColors = {
          draft: 'bg-gray-100 text-gray-800',
          sent: 'bg-blue-100 text-blue-800',
          paid: 'bg-green-100 text-green-800',
          overdue: 'bg-red-100 text-red-800',
          cancelled: 'bg-gray-100 text-gray-800'
        };
        return (
          <Badge className={statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft}>
            {invoice.status?.toUpperCase() || 'DRAFT'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (invoice: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid={`button-view-invoice-${invoice.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-download-invoice-${invoice.id}`}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-send-invoice-${invoice.id}`}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-invoice-management-title">
            Invoice Management
          </h1>
          <p className="text-muted-foreground">
            GST invoices with tax breakdowns and PDF downloads
          </p>
        </div>
        <Button data-testid="button-new-invoice">
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>All Invoices</span>
          </CardTitle>
          <CardDescription>
            GST compliant invoices with CGST, SGST, IGST breakdowns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(invoices || [])}
            columns={columns}
            searchable={true}
            searchKey="invoiceNumber"
          />
        </CardContent>
      </Card>
    </div>
  );
}