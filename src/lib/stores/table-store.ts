import { create } from 'zustand';

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface TableFilter {
  column: string;
  value: string;
}

interface TableStore {
  // Pagination
  pagination: PaginationState;
  setPagination: (pagination: PaginationState) => void;

  // Sorting
  sorting: SortingState[];
  setSorting: (sorting: SortingState[]) => void;

  // Column Visibility
  columnVisibility: Record<string, boolean>;
  setColumnVisibility: (columnVisibility: Record<string, boolean>) => void;

  // Row Selection
  rowSelection: Record<string, boolean>;
  setRowSelection: (rowSelection: Record<string, boolean>) => void;
  clearRowSelection: () => void;

  // Global Filter (Search)
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;

  // Column Filters
  columnFilters: TableFilter[];
  setColumnFilters: (filters: TableFilter[]) => void;
  addColumnFilter: (filter: TableFilter) => void;
  removeColumnFilter: (column: string) => void;
  clearColumnFilters: () => void;

  // Reset all states
  resetTableState: () => void;
}

export const useTableStore = create<TableStore>((set) => ({
  // Pagination
  pagination: {
    pageIndex: 0,
    pageSize: 20,
  },
  setPagination: (pagination) => set({ pagination }),

  // Sorting
  sorting: [],
  setSorting: (sorting) => set({ sorting }),

  // Column Visibility
  columnVisibility: {},
  setColumnVisibility: (columnVisibility) => set({ columnVisibility }),

  // Row Selection
  rowSelection: {},
  setRowSelection: (rowSelection) => set({ rowSelection }),
  clearRowSelection: () => set({ rowSelection: {} }),

  // Global Filter
  globalFilter: '',
  setGlobalFilter: (globalFilter) => set({ globalFilter }),

  // Column Filters
  columnFilters: [],
  setColumnFilters: (columnFilters) => set({ columnFilters }),
  addColumnFilter: (filter) =>
    set((state) => ({
      columnFilters: [...state.columnFilters.filter((f) => f.column !== filter.column), filter],
    })),
  removeColumnFilter: (column) =>
    set((state) => ({
      columnFilters: state.columnFilters.filter((f) => f.column !== column),
    })),
  clearColumnFilters: () => set({ columnFilters: [] }),

  // Reset
  resetTableState: () =>
    set({
      pagination: { pageIndex: 0, pageSize: 20 },
      sorting: [],
      columnVisibility: {},
      rowSelection: {},
      globalFilter: '',
      columnFilters: [],
    }),
}));
