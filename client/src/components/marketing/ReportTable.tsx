import { useState } from "react";
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map(col => col.key));
  const [showExportModal, setShowExportModal] = useState(false);

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const comparison = aVal.localeCompare(bVal);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    if (aVal instanceof Date && bVal instanceof Date) {
      const comparison = aVal.getTime() - bVal.getTime();
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });

  // Filter data based on search term
  const filteredData = sortedData.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    setSortConfig(prevConfig => {
      if (prevConfig.key === columnKey) {
        const nextDirection = 
          prevConfig.direction === 'asc' ? 'desc' : 
          prevConfig.direction === 'desc' ? null : 'asc';
        return { key: columnKey, direction: nextDirection };
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

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

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1 inline" /> : 
      <ChevronDown className="h-4 w-4 ml-1 inline" />;
  };

  const visibleColumnConfigs = columns.filter(col => visibleColumns.includes(col.key));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
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
                    {Array.from({ length: visibleColumnConfigs.length }).map((_, j) => (
                      <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge variant="secondary" data-testid="table-record-count">
                {filteredData.length} records
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumnConfigs.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={`${column.sortable ? 'cursor-pointer hover:bg-muted/50 select-none' : ''} ${column.width || ''}`}
                      onClick={() => handleSort(column.key)}
                      data-testid={`table-header-${column.key}`}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={visibleColumnConfigs.length} 
                      className="h-24 text-center text-muted-foreground"
                      data-testid="table-empty-message"
                    >
                      {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, index) => (
                    <TableRow 
                      key={index}
                      className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => onRowClick?.(row)}
                      data-testid={`table-row-${index}`}
                    >
                      {visibleColumnConfigs.map((column) => (
                        <TableCell 
                          key={column.key}
                          className={column.width || ''}
                          data-testid={`table-cell-${column.key}-${index}`}
                        >
                          {column.formatter 
                            ? column.formatter(row[column.key], row)
                            : row[column.key] ?? '-'
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          {filteredData.length > 0 && (
            <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
              <span>
                Showing {filteredData.length} of {data.length} records
                {searchTerm && ` (filtered by "${searchTerm}")`}
              </span>
              <span>
                {visibleColumns.length} of {columns.length} columns visible
              </span>
            </div>
          )}
        </CardContent>
      </Card>

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