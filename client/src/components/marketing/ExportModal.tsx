import { useState } from "react";
import { Download, FileText, Table, File, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import exportService, { type ExportOptions, type ExportData } from "@/services/exportService";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportData;
  defaultFilename: string;
  title: string;
  chartElementId?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
}

type ExportFormat = 'csv' | 'excel' | 'pdf';

const formatOptions = [
  {
    value: 'csv' as ExportFormat,
    label: 'CSV File',
    description: 'Comma-separated values for spreadsheet applications',
    icon: Table,
    size: 'Small file size',
  },
  {
    value: 'excel' as ExportFormat,
    label: 'Excel Workbook',
    description: 'Microsoft Excel format with metadata sheet',
    icon: FileText,
    size: 'Medium file size',
  },
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF Report',
    description: 'Formatted report with optional charts and tables',
    icon: File,
    size: 'Larger file size',
  },
];

export default function ExportModal({
  isOpen,
  onClose,
  data,
  defaultFilename,
  title,
  chartElementId,
  dateRange
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [filename, setFilename] = useState(defaultFilename);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!filename.trim()) {
      toast({
        title: "Filename required",
        description: "Please enter a filename for the export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const options: ExportOptions = {
        filename: filename.trim(),
        title,
        includeCharts: includeCharts && selectedFormat === 'pdf',
        dateRange
      };

      // Add metadata to data if not present
      const exportData = {
        ...data,
        metadata: data.metadata || exportService.generateMetadata(data.rows.length, dateRange)
      };

      switch (selectedFormat) {
        case 'csv':
          await exportService.exportToCSV(exportData, options);
          break;
        case 'excel':
          await exportService.exportToExcel(exportData, options);
          break;
        case 'pdf':
          await exportService.exportToPDF(exportData, options, chartElementId);
          break;
      }

      toast({
        title: "Export successful",
        description: `Report exported as ${filename}.${selectedFormat}`,
      });

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const selectedFormatInfo = formatOptions.find(opt => opt.value === selectedFormat);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="export-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </DialogTitle>
          <DialogDescription>
            Choose the format and options for exporting your report data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filename Input */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename..."
              disabled={isExporting}
              data-testid="export-filename-input"
            />
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup 
              value={selectedFormat} 
              onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
              disabled={isExporting}
            >
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div 
                    key={option.value} 
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      data-testid={`export-format-${option.value}`}
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <Label 
                        htmlFor={option.value} 
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.size}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* PDF Options */}
          {selectedFormat === 'pdf' && chartElementId && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked === true)}
                    disabled={isExporting}
                    data-testid="include-charts-checkbox"
                  />
                  <Label htmlFor="include-charts" className="text-sm">
                    Include charts and visualizations in PDF
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  This will capture chart images and include them in the PDF report
                </p>
              </CardContent>
            </Card>
          )}

          {/* Report Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Title:</span>
                  <span className="font-medium">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Records:</span>
                  <span className="font-medium">{data.rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Columns:</span>
                  <span className="font-medium">{data.headers.length}</span>
                </div>
                {dateRange?.from && dateRange?.to && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date Range:</span>
                    <span className="font-medium text-xs">
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isExporting}
            data-testid="export-cancel-button"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || !filename.trim()}
            data-testid="export-confirm-button"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {selectedFormatInfo?.label}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}