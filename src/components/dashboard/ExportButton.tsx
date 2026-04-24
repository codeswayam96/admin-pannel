'use client';

import React, { useState } from 'react';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  onExportCSV?: () => Promise<void>;
  onExportPDF?: () => Promise<void>;
  onExportJSON?: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  onExportCSV,
  onExportPDF,
  onExportJSON,
  disabled = false,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (type: string, fn?: () => Promise<void>) => {
    if (!fn) return;
    setIsExporting(type);
    try {
      await fn();
    } catch (error) {
      console.error(`Export ${type} error:`, error);
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
          variant="outline"
          size="sm"
          disabled={disabled || isExporting !== null}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export As</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportCSV && (
          <DropdownMenuItem
            onClick={() => handleExport('csv', onExportCSV)}
            disabled={isExporting === 'csv'}
          >
            <Table className="mr-2 h-4 w-4" />
            CSV Spreadsheet
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem
            onClick={() => handleExport('pdf', onExportPDF)}
            disabled={isExporting === 'pdf'}
          >
            <FileText className="mr-2 h-4 w-4" />
            PDF Document
          </DropdownMenuItem>
        )}
        {onExportJSON && (
          <DropdownMenuItem
            onClick={() => handleExport('json', onExportJSON)}
            disabled={isExporting === 'json'}
          >
            <FileText className="mr-2 h-4 w-4" />
            JSON Data
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
