'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { X, Search, SlidersHorizontal, Download, Trash2, MoreHorizontal, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
  bulkActions?: {
    label: string;
    action: (selectedRows: TData[]) => void;
    variant?: 'default' | 'destructive';
    icon?: React.ReactNode;
  }[];
  selectedRows: TData[];
  onExport?: (data: TData[], format: 'csv' | 'pdf') => void;
  data: TData[];
}

export function DataTableToolbar<TData>({
  table,
  globalFilter,
  setGlobalFilter,
  searchPlaceholder = 'Search...',
  filterableColumns = [],
  bulkActions = [],
  selectedRows,
  onExport,
  data,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || globalFilter.length > 0;
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Global Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Column Filters */}
        {filterableColumns.map((column) => {
          const columnFilter = table.getColumn(column.id);
          if (!columnFilter) return null;

          return (
            <Select
              key={column.id}
              value={(columnFilter.getFilterValue() as string) ?? 'all'}
              onValueChange={(value) =>
                columnFilter.setFilterValue(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder={column.title} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {column.title}</SelectItem>
                {column.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}

        {/* Reset Filters */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters();
              setGlobalFilter('');
            }}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Selected rows indicator */}
        {hasSelectedRows && (
          <Badge variant="secondary" className="mr-2">
            {selectedRows.length} selected
          </Badge>
        )}

        {/* Bulk Actions */}
        {hasSelectedRows && bulkActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {bulkActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={() => action.action(selectedRows)}
                  className={action.variant === 'destructive' ? 'text-red-600' : ''}
                >
                  {action.icon || (action.variant === 'destructive' && <Trash2 className="mr-2 h-4 w-4" />)}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Export */}
        {onExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Data</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onExport(hasSelectedRows ? selectedRows : data, 'csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(hasSelectedRows ? selectedRows : data, 'pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
