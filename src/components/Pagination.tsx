import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function usePagination<T>(items: T[], defaultPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  const reset = () => setPage(1);

  const changePageSize = (size: number) => { setPageSize(size); setPage(1); };

  return { page: safePage, setPage, pageSize, changePageSize, totalPages, paginated, total: items.length, reset };
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
  label?: string;
}

export function Pagination({
  page, totalPages, total, pageSize,
  onPageChange, onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  label = "rows",
}: PaginationProps) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={v => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">
          {total === 0 ? "No results" : `${from}–${to} of ${total} ${label}`}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronLeft size={12} /><ChevronLeft size={12} className="-ml-2" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft size={14} />
        </Button>
        <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
          <ChevronRight size={12} /><ChevronRight size={12} className="-ml-2" />
        </Button>
      </div>
    </div>
  );
}
