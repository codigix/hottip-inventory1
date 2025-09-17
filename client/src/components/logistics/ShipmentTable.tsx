import { useState } from "react";
import { Edit, MoreHorizontal, Eye, MapPin, Clock, History, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use shared types from schema
import type { LogisticsShipment, LogisticsShipmentStatus } from "@shared/schema";

interface ShipmentTableProps {
  shipments: LogisticsShipment[];
  onEdit: (shipment: LogisticsShipment) => void;
  onViewTimeline: (shipment: LogisticsShipment) => void;
  onDelete: (shipment: LogisticsShipment) => void;
}

export default function ShipmentTable({ shipments, onEdit, onViewTimeline, onDelete }: ShipmentTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      created: { label: "Created", className: "bg-gray-100 text-gray-800" },
      packed: { label: "Packed", className: "bg-blue-100 text-blue-800" },
      dispatched: { label: "Dispatched", className: "bg-indigo-100 text-indigo-800" },
      in_transit: { label: "In Transit", className: "bg-purple-100 text-purple-800" },
      out_for_delivery: { label: "Out for Delivery", className: "bg-orange-100 text-orange-800" },
      delivered: { label: "Delivered", className: "bg-green-100 text-green-800" },
      closed: { label: "Closed", className: "bg-slate-100 text-slate-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const columns = [
    {
      key: "consignmentNumber",
      header: "Consignment #",
      cell: (shipment: LogisticsShipment) => (
        <div className="font-medium" data-testid={`text-consignment-${shipment.id}`}>
          {shipment.consignmentNumber}
        </div>
      ),
    },
    {
      key: "client",
      header: "Client/Vendor",
      cell: (shipment: LogisticsShipment) => (
        <div className="text-sm">
          {shipment.clientId ? (
            <div className="font-medium text-foreground">Client Shipment</div>
          ) : shipment.vendorId ? (
            <div className="text-muted-foreground">Vendor Shipment</div>
          ) : (
            <span className="text-muted-foreground">Direct</span>
          )}
        </div>
      ),
    },
    {
      key: "route",
      header: "Route",
      cell: (shipment: LogisticsShipment) => (
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex flex-col">
            <div className="font-medium">{shipment.source}</div>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {shipment.destination}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "currentStatus",
      header: "Status",
      cell: (shipment: LogisticsShipment) => getStatusBadge(shipment.currentStatus),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (shipment: LogisticsShipment) => (
        <div className="text-sm">
          {shipment.dispatchDate && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
              Dispatch: {new Date(shipment.dispatchDate).toLocaleDateString()}
            </div>
          )}
          {shipment.expectedDeliveryDate && (
            <div className="text-muted-foreground">
              Expected: {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
            </div>
          )}
          {shipment.deliveredAt && (
            <div className="text-green-600">
              Delivered: {new Date(shipment.deliveredAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (shipment: LogisticsShipment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              data-testid={`button-actions-${shipment.id}`}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit(shipment)}
              data-testid={`action-edit-${shipment.id}`}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Shipment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onViewTimeline(shipment)}
              data-testid={`action-timeline-${shipment.id}`}
            >
              <History className="mr-2 h-4 w-4" />
              View Timeline
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(shipment)}
              className="text-destructive focus:text-destructive"
              data-testid={`action-delete-${shipment.id}`}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Shipment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      data={shipments}
      columns={columns}
      searchable={true}
      searchKey="consignmentNumber"
      data-testid="table-shipments"
    />
  );
}