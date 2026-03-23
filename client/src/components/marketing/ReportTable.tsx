import { useState, useMemo } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Card, div, div, div } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, Column } from "@/components/ui/data-table";
import ExportModal from "./ExportModal";
import type { ExportData } from "@/services/exportService";

export interface TableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  formatter?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface ReportTableProps {
  data: any[];
  columns: TableColumn[];
  title: string;
  isLoading?: boolean;
  emptyMessage?: string;
  exportFilename?: string;
  onRowClick?: (row: any) => void;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

export default function ReportTable({
  data,
  columns,
  title,
  isLoading = false,
  emptyMessage = "No data available",
  exportFilename = "report",
  onRowClick,
  dateRange
}: ReportTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(col => col.key));
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter data based on search term (client-side)
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Prepare export data
  const getExportData = (): ExportData => {
    const visibleColumnConfigs = columns.filter(col => visibleColumns.includes(col.key));
    const headers = visibleColumnConfigs.map(col => col.header);
    
    const rows = filteredData.map(row =>
      visibleColumnConfigs.map(col => {
        const value = row[col.key];
        if (col.formatter) {
          // For export, we need string representation, not React nodes
          if (typeof value === 'string' || typeof value === 'number') {
            return value;
          }
          return String(value || '');
        }
        return value;
      })
    );

    return { headers, rows };
  };

  const dataTableColumns = useMemo<Column<any>[]>(() => {
    return columns
      .filter(col => visibleColumns.includes(col.key))
      .map(col => ({
        key: col.key,
        header: col.header,
        sortable: col.sortable,
        cell: (item: any) => col.formatter ? col.formatter(item[col.key], item) : (item[col.key] ?? '-'),
      }));
  }, [columns, visibleColumns]);

  if (isLoading) {
    return (
      <div>
        <div>
          <div className="text-sm">{title}</div>
        </div>
        <div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-64" />
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
            <div className="border rounded-lg">
              <div className="p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex space-x-4 mb-4">
                    {Array.from({ length: columns.length }).map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge variant="secondary" data-testid="table-record-count">
                {filteredData.length} records
              </Badge>
            </div>
          </div>
        </div>
        <div>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="table-search-input"
              />
            </div>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" data-testid="table-column-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  Columns
                  <Badge variant="secondary" className="ml-2">
                    {visibleColumns.length}/{columns.length}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={visibleColumns.includes(column.key)}
                    onCheckedChange={() => toggleColumnVisibility(column.key)}
                    data-testid={`column-toggle-${column.key}`}
                  >
                    <span className="flex items-center">
                      {visibleColumns.includes(column.key) ? (
                        <Eye className="h-4 w-4 mr-2" />
                      ) : (
                        <EyeOff className="h-4 w-4 mr-2" />
                      )}
                      {column.header}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <Button 
              variant="outline"
              onClick={() => setShowExportModal(true)}
              disabled={filteredData.length === 0}
              data-testid="table-export-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Table using DataTable */}
          <DataTable
            data={filteredData}
            columns={dataTableColumns}
            searchable={false}
            onView={onRowClick ? (item) => onRowClick(item) : undefined}
          />

          {/* Footer */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between pt-4 text-sm text-gray-500">
              <span>
                Showing {filteredData.length} of {data.length} records
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </span>
              <span>
                {visibleColumns.length} of {columns.length} columns visible
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={getExportData()}
        defaultFilename={exportFilename}
        title={title}
        dateRange={dateRange}
      />
    </>
  );
}
