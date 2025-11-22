import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search } from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  searchable?: boolean;
  searchKey?: keyof T;
  actionsTourId?: string;
  viewTourId?: string;
  editTourId?: string;
  deleteTourId?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  searchKey,
  actionsTourId,
  viewTourId,
  editTourId,
  deleteTourId,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = searchable && searchQuery && searchKey
    ? data.filter((item) =>
        String(item[searchKey])
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : data;

  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      const keys = key.split('.');
      let value = item;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return item[key as keyof T];
  };

  return (
    <div className="space-y-4">
      {searchable && searchKey && (
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ${String(searchKey)}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            data-testid="input-search"
          />
        </div>
      )}

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item, rowIndex) => (
                <TableRow key={item.id || rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell 
                        ? column.cell(item) 
                        : String(getValue(item, column.key) || '')}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            data-testid={`button-actions-${rowIndex}`}
                            data-tour={rowIndex === 0 ? actionsTourId : undefined}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onView && (
                            <DropdownMenuItem
                              onClick={() => onView(item)}
                              data-testid={`button-view-${rowIndex}`}
                              data-tour={rowIndex === 0 ? viewTourId : undefined}
                            >
                              View
                            </DropdownMenuItem>
                          )}
                          {onEdit && (
                            <DropdownMenuItem
                              onClick={() => onEdit(item)}
                              data-testid={`button-edit-${rowIndex}`}
                              data-tour={rowIndex === 0 ? editTourId : undefined}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-destructive"
                              data-testid={`button-delete-${rowIndex}`}
                              data-tour={rowIndex === 0 ? deleteTourId : undefined}
                            >
                              Delete
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
