import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Building2, Eye, Edit, FileText, History } from "lucide-react";

export default function VendorManagement() {
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const columns = [
    {
      key: 'name',
      header: 'Vendor Name',
      cell: (supplier: any) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-xs text-muted-foreground">{supplier.companyType || 'Company'}</div>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      cell: (supplier: any) => (
        <div>
          <div className="text-sm">{supplier.contactPerson}</div>
          <div className="text-xs text-muted-foreground">{supplier.email}</div>
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      cell: (supplier: any) => (
        <div className="text-sm font-mono">
          {supplier.gstNumber || 'Not Provided'}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      cell: (supplier: any) => (
        <div className="text-sm">
          {supplier.city}, {supplier.state}
        </div>
      ),
    },
    {
      key: 'paymentTerms',
      header: 'Payment Terms',
      cell: (supplier: any) => `${supplier.paymentTerms || 30} days`,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (supplier: any) => (
        <Badge className={supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (supplier: any) => (
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" data-testid={`button-view-vendor-${supplier.id}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-edit-vendor-${supplier.id}`}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" data-testid={`button-history-vendor-${supplier.id}`}>
            <History className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-vendor-management-title">
            Vendor Database
          </h1>
          <p className="text-muted-foreground">
            Supplier management with full history tracking
          </p>
        </div>
        <Button data-testid="button-new-vendor">
          <Plus className="h-4 w-4 mr-2" />
          New Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>All Vendors</span>
          </CardTitle>
          <CardDescription>
            Complete vendor database with GST details and transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={(suppliers || [])}
            columns={columns}
            searchable={true}
            searchKey="name"
          />
        </CardContent>
      </Card>
    </div>
  );
}