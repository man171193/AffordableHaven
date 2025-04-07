import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Eye, FileEdit, Printer, FileSpreadsheet, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Client, Quality, ReportWithItems } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateExcel, generatePDF } from "@/lib/exporters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Report type for the table
interface ReportRow {
  id: number;
  reportDate: string;
  challanNo: number;
  clientName: string;
  qualityName: string;
  totalBags: number;
  totalNetWeight: number;
}

export default function ReportHistory() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportWithItems | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  
  // Filter states
  const [clientFilter, setClientFilter] = useState<string>("");
  const [qualityFilter, setQualityFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Custom date range
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Fetch clients for filter
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Fetch qualities for filter
  const { data: qualities = [] } = useQuery({
    queryKey: ["/api/qualities"],
  });

  // Build the query parameters for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (clientFilter) {
      params.append("clientId", clientFilter);
    }
    
    if (qualityFilter) {
      params.append("qualityName", qualityFilter);
    }
    
    if (dateFilter === "today") {
      const today = new Date();
      params.append("startDate", today.toISOString().split("T")[0]);
      params.append("endDate", today.toISOString().split("T")[0]);
    } else if (dateFilter === "week") {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      params.append("startDate", weekAgo.toISOString().split("T")[0]);
      params.append("endDate", today.toISOString().split("T")[0]);
    } else if (dateFilter === "month") {
      const today = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(today.getMonth() - 1);
      params.append("startDate", monthAgo.toISOString().split("T")[0]);
      params.append("endDate", today.toISOString().split("T")[0]);
    } else if (dateFilter === "custom" && startDate && endDate) {
      params.append("startDate", startDate);
      params.append("endDate", endDate);
    }
    
    if (searchTerm) {
      params.append("q", searchTerm);
    }
    
    return params.toString();
  };

  // Fetch reports with filters
  const { 
    data: reports = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: [`/api/reports?${buildQueryParams()}`],
  });

  // Function to view report details
  const viewReport = async (id: number) => {
    try {
      const response = await fetch(`/api/reports/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch report details");
      }
      
      const reportData = await response.json();
      setSelectedReport(reportData);
      setViewDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report details",
        variant: "destructive",
      });
    }
  };

  // Function to delete a report
  const deleteReport = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/reports/${id}`);
      
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
      
      setReportToDelete(null);
      setDeleteDialogOpen(false);
      
      // Refresh the reports list
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  // Function to confirm delete
  const confirmDelete = (id: number) => {
    setReportToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Function to export report to Excel
  const exportToExcel = async (id: number) => {
    try {
      const response = await fetch(`/api/reports/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch report details");
      }
      
      const reportData = await response.json();
      generateExcel(reportData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report to Excel",
        variant: "destructive",
      });
    }
  };

  // Function to export report to PDF
  const exportToPDF = async (id: number) => {
    try {
      const response = await fetch(`/api/reports/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch report details");
      }
      
      const reportData = await response.json();
      generatePDF(reportData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report to PDF",
        variant: "destructive",
      });
    }
  };

  // Table columns definition
  const columns: ColumnDef<ReportRow>[] = [
    {
      accessorKey: "reportDate",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("reportDate"));
        return format(date, "dd MMM yyyy");
      },
    },
    {
      accessorKey: "challanNo",
      header: "Challan No.",
    },
    {
      accessorKey: "clientName",
      header: "Client",
    },
    {
      accessorKey: "qualityName",
      header: "Qualities",
    },
    {
      accessorKey: "totalBags",
      header: "Total Bags",
    },
    {
      accessorKey: "totalNetWeight",
      header: "Total Net Wt",
      cell: ({ row }) => {
        const weight = parseFloat(row.getValue("totalNetWeight"));
        return `${weight.toFixed(1)} kg`;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const report = row.original;
        
        return (
          <div className="flex justify-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => viewReport(report.id)}
              title="View"
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toast({ title: "Not implemented", description: "Edit functionality is not implemented yet" })}
              title="Edit"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <FileEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => exportToPDF(report.id)}
              title="Print"
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              <Printer className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => exportToExcel(report.id)}
              title="Excel"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => confirmDelete(report.id)}
              title="Delete"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-neutral-900">Report History</CardTitle>
            <div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-md pr-10 text-sm w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Filter bar */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex flex-wrap gap-3">
            <div>
              <Label htmlFor="clientFilter" className="block text-xs font-medium text-gray-700 mb-1">Client</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger id="clientFilter" className="w-48 h-8 text-sm">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Clients</SelectItem>
                  {clients.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateFilter" className="block text-xs font-medium text-gray-700 mb-1">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="dateFilter" className="w-36 h-8 text-sm">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateFilter === "custom" && (
              <>
                <div>
                  <Label htmlFor="startDate" className="block text-xs font-medium text-gray-700 mb-1">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-sm w-36"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="block text-xs font-medium text-gray-700 mb-1">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-sm w-36"
                  />
                </div>
              </>
            )}
            
            <div>
              <Label htmlFor="qualityFilter" className="block text-xs font-medium text-gray-700 mb-1">Quality</Label>
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger id="qualityFilter" className="w-36 h-8 text-sm">
                  <SelectValue placeholder="All Qualities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Qualities</SelectItem>
                  {qualities.map((quality: Quality) => (
                    <SelectItem key={quality.id} value={quality.name}>
                      {quality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                size="sm" 
                onClick={() => refetch()} 
                className="h-8"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={reports}
            pagination={true}
          />
        </CardContent>
      </Card>
      
      {/* View Report Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              {selectedReport && (
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Date:</span> {format(new Date(selectedReport.report.reportDate), "dd MMM yyyy")} | 
                  <span className="font-medium ml-2">Challan No:</span> {selectedReport.report.challanNo} | 
                  <span className="font-medium ml-2">Client:</span> {selectedReport.report.clientName}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Client Address</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                      {selectedReport.report.clientAddress}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Yarn Details</h4>
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                      <p><span className="font-medium">Quality:</span> {selectedReport.report.qualityName}</p>
                      <p><span className="font-medium">Denier:</span> {selectedReport.report.denier}</p>
                      <p><span className="font-medium">Blend:</span> {selectedReport.report.blend}</p>
                      <p><span className="font-medium">Lot Number:</span> {selectedReport.report.lotNumber}</p>
                      {selectedReport.report.shadeNumber && (
                        <p><span className="font-medium">Shade Number:</span> {selectedReport.report.shadeNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Report Items</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sr. No.</TableHead>
                          <TableHead>Bag No.</TableHead>
                          <TableHead>Gross Wt</TableHead>
                          <TableHead>Tare Wt</TableHead>
                          <TableHead>Net Wt</TableHead>
                          <TableHead>Cones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedReport.items.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.bagNo}</TableCell>
                            <TableCell>{item.grossWeight.toFixed(1)}</TableCell>
                            <TableCell>{item.tareWeight.toFixed(1)}</TableCell>
                            <TableCell className="font-medium">{item.netWeight.toFixed(1)}</TableCell>
                            <TableCell>{item.cones}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-primary/10 font-semibold">
                          <TableCell colSpan={2}>Grand Total</TableCell>
                          <TableCell>{selectedReport.report.totalGrossWeight.toFixed(1)}</TableCell>
                          <TableCell>{selectedReport.report.totalTareWeight.toFixed(1)}</TableCell>
                          <TableCell>{selectedReport.report.totalNetWeight.toFixed(1)}</TableCell>
                          <TableCell>{selectedReport.report.totalCones}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between items-center gap-2">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => exportToExcel(selectedReport.report.id)}
                  >
                    <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                    Export to Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => exportToPDF(selectedReport.report.id)}
                  >
                    <Printer className="mr-1.5 h-4 w-4" />
                    Print / PDF
                  </Button>
                </div>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => reportToDelete && deleteReport(reportToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
