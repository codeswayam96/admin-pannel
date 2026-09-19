'use client';

import React, { useState } from 'react';
import { Download, FileText, Table, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportButtonProps {
  onExportCSV?: () => Promise<void> | void;
  onExportPDF?: () => Promise<void> | void;
  onExportJSON?: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  label?: string;
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  count?: number;
}

export function ExportButton({
  onExportCSV,
  onExportPDF,
  onExportJSON,
  disabled = false,
  className,
  label = 'Export',
  variant = 'outline',
  size = 'sm',
  count,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (type: string, fn?: () => Promise<void> | void) => {
    if (!fn) return;
    setIsExporting(type);
    try {
      await Promise.resolve(fn());
    } catch (err: any) {
      console.error(`Export ${type} failed:`, err);
      toast.error(`Failed to export as ${type.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  const hasExportOptions = onExportCSV || onExportPDF || onExportJSON;

  if (!hasExportOptions) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting !== null}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Download className="mr-1.5 h-4 w-4 text-muted-foreground" />
          )}
          <span>{label}</span>
          {count !== undefined && count > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportCSV && (
          <DropdownMenuItem
            onClick={() => handleExport('csv', onExportCSV)}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <Table className="mr-2 h-4 w-4 text-emerald-600" />
            <span>CSV Spreadsheet (.csv)</span>
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem
            onClick={() => handleExport('pdf', onExportPDF)}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4 text-rose-600" />
            <span>PDF Document (.pdf)</span>
          </DropdownMenuItem>
        )}
        {onExportJSON && (
          <DropdownMenuItem
            onClick={() => handleExport('json', onExportJSON)}
            disabled={isExporting !== null}
            className="cursor-pointer"
          >
            <Code className="mr-2 h-4 w-4 text-violet-600" />
            <span>JSON Data (.json)</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

