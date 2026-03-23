import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  ArrowUpDown
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  searchable?: boolean;
  searchKey?: keyof T | string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  searchKey,
  searchPlaceholder,
  isLoading = false,
  pageSizeOptions = [5, 10, 20, 50, 100],
  defaultPageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Default to first column if searchKey not provided but searchable is true
  const effectiveSearchKey = searchKey || (searchable && columns.length > 0 ? columns[0].key : undefined);

  // Helper to get nested values
  const getValue = (item: T, key: string): any => {
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = item;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return item[key];
  };

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Process data (Filter -> Sort -> Paginate)
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (searchable && searchQuery) {
      result = result.filter((item) => {
        if (searchKey) {
          const value = getValue(item, searchKey as string);
          return String(value || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
        
        // Global search across all provided columns if no searchKey
        return columns.some(col => {
          const value = getValue(item, col.key as string);
          return String(value || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        });
      });
    }

    // Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue === bValue) return 0;
        
        const comparison = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default LIFO (Last In, First Out) sorting
      // Try to find a timestamp or ID field to sort by descending
      const possibleKeys = ['createdAt', 'created_at', 'date', 'id'];
      const defaultKey = possibleKeys.find(key => 
        result.length > 0 && getValue(result[0], key) !== undefined
      );

      if (defaultKey) {
        result.sort((a, b) => {
          const aValue = getValue(a, defaultKey);
          const bValue = getValue(b, defaultKey);

          if (aValue === bValue) return 0;
          return aValue > bValue ? -1 : 1;
        });
      }
    }

    return result;
  }, [data, searchQuery, searchKey, searchable, sortConfig]);

  // Pagination calculations
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

  // Reset to first page when search or page size changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(Number(size));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        {searchable && (
          <div className="relative w-full sm:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder || `Search...`}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white border-slate-200 h-10 shadow-sm focus:ring-1 focus:ring-primary/20 transition-all"
              data-testid="input-search"
            />
          </div>
        )}
        
        
      </div>

      <div className="rounded border border-slate-200 bg-white overflow-hidden ">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200">
                {columns.map((column, index) => (
                  <TableHead 
                    key={index}
                    className={cn(
                      "text-slate-500  text-xs",
                      column.sortable !== false && "cursor-pointer select-none hover:text-slate-800 transition-colors"
                    )}
                    onClick={() => column.sortable !== false && handleSort(column.key as string)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable !== false && (
                        <div className="flex flex-col">
                          {sortConfig.key === column.key ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : sortConfig.direction === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-30" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
                {(onEdit || onDelete || onView) && (
                  <TableHead className="w-fit text-right ">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <TableRow key={i} className="border-slate-100">
                    {columns.map((_, j) => (
                      <TableCell key={j} className="">
                        <Skeleton className="h-4 w-full bg-slate-100" />
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <TableCell className="">
                        <Skeleton className="h-4 w-4 rounded ml-auto bg-slate-100" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, rowIndex) => (
                  <TableRow key={item.id || rowIndex} className="hover:bg-slate-50/50 transition-colors border-slate-100 group">
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className=" text-xs text-slate-600">
                        {column.cell 
                          ? column.cell(item) 
                          : String(getValue(item, column.key as string) || '-')}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <TableCell className="">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0  group-hover:opacity-100 transition-opacity focus:opacity-100"
                              data-testid={`button-actions-${rowIndex}`}
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {onView && (
                              <DropdownMenuItem
                                onClick={() => onView(item)}
                                data-testid={`button-view-${rowIndex}`}
                                className="text-slate-600 cursor-pointer"
                              >
                                View Details
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem
                                onClick={() => onEdit(item)}
                                data-testid={`button-edit-${rowIndex}`}
                                className="text-slate-600 cursor-pointer"
                              >
                                Edit Record
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(item)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                data-testid={`button-delete-${rowIndex}`}
                              >
                                Delete Record
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} 
                    className="h-32 text-center text-slate-400 bg-slate-50/30"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Search className="h-8 w-8 opacity-20" />
                      <p className="font-medium text-sm">No results found</p>
                      <p className="text-xs opacity-60">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-800">{startIndex + 1}</span> to <span className="text-slate-800">{Math.min(startIndex + pageSize, totalItems)}</span> of <span className="text-slate-800">{totalItems}</span> results
          </div>
          
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={cn(
                    "cursor-pointer text-xs h-8 px-2 hover:bg-slate-100",
                    currentPage === 1 && "pointer-events-none opacity-40"
                  )}
                />
              </PaginationItem>
              
              {/* Simple page numbers */}
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let pageNumber = i + 1;
                // If total pages > 5, show window around current page
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNumber = currentPage - 3 + i + 1;
                  }
                  if (pageNumber > totalPages) {
                    pageNumber = totalPages - (4 - i);
                  }
                }
                
                return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={cn(
                        "cursor-pointer text-xs h-8 w-8 hover:bg-slate-100",
                        currentPage === pageNumber && "bg-primary text-white hover:bg-primary border-none"
                      )}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis className="h-8 w-8" />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={cn(
                    "cursor-pointer text-xs h-8 px-2 hover:bg-slate-100",
                    currentPage === totalPages && "pointer-events-none opacity-40"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[70px] h-8 bg-white border-slate-200">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
    </div>
  );
}
