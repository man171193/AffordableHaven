import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client, Quality, ReportWithItems, CreateReportInput } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, File, Trash2, PlusCircle } from "lucide-react";
import { generateExcel, generatePDF } from "@/lib/exporters";

// Form schema for adding an item
const addItemSchema = z.object({
  bagNo: z.coerce.number().min(1, "Bag number is required"),
  grossWeight: z.coerce.number().min(0.1, "Gross weight must be greater than 0"),
  tareWeight: z.coerce.number().min(0, "Tare weight must be at least 0"),
  cones: z.coerce.number().min(1, "Number of cones is required"),
});

type AddItemFormValues = z.infer<typeof addItemSchema>;

// Form schema for the report header
const reportHeaderSchema = z.object({
  reportDate: z.string().min(1, "Date is required"),
  clientId: z.coerce.number({ required_error: "Client is required" }),
  clientAddress: z.string().min(1, "Client address is required"),
  challanNo: z.coerce.number().min(1, "Challan number is required"),
  qualityName: z.string().min(1, "Quality name is required"),
  shadeNumber: z.string().optional(),
  denier: z.coerce.number().min(1, "Denier is required"),
  blend: z.string().min(1, "Blend is required"),
  lotNumber: z.coerce.number().min(1, "Lot number is required"),
});

type ReportHeaderFormValues = z.infer<typeof reportHeaderSchema>;

// Item interface for the table
interface ReportItem {
  bagNo: number;
  qualityName: string;
  denier: number;
  blend: string;
  lotNumber: number;
  shadeNumber?: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  cones: number;
}

export default function CreateReport() {
  const { toast } = useToast();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [totals, setTotals] = useState({
    bags: 0,
    grossWeight: 0,
    tareWeight: 0,
    netWeight: 0,
    cones: 0,
  });
  const [qualitySubtotals, setQualitySubtotals] = useState<{
    [key: string]: {
      bags: number;
      grossWeight: number;
      tareWeight: number;
      netWeight: number;
      cones: number;
    };
  }>({});
  const [reportFinished, setReportFinished] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportWithItems | null>(null);

  // Load data from session storage if available
  useEffect(() => {
    const savedData = sessionStorage.getItem("packingData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.items && Array.isArray(parsedData.items)) {
          setItems(parsedData.items);
          calculateTotals(parsedData.items);
        }
      } catch (error) {
        console.error("Error loading session data:", error);
      }
    }
  }, []);

  // Save data to session storage when items change
  useEffect(() => {
    if (items.length > 0) {
      sessionStorage.setItem("packingData", JSON.stringify({ items }));
    }
  }, [items]);

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch qualities
  const { data: qualities = [] } = useQuery<Quality[]>({
    queryKey: ["/api/qualities"],
  });

  // Report header form
  const headerForm = useForm<ReportHeaderFormValues>({
    resolver: zodResolver(reportHeaderSchema),
    defaultValues: {
      reportDate: new Date().toISOString().split("T")[0],
      clientId: undefined,
      clientAddress: "",
      challanNo: undefined,
      qualityName: "",
      shadeNumber: "",
      denier: undefined,
      blend: "",
      lotNumber: undefined,
    },
  });

  // Item form
  const itemForm = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      bagNo: 1,
      grossWeight: undefined,
      tareWeight: undefined,
      cones: undefined,
    },
  });

  // Watch values for calculations
  const grossWeight = itemForm.watch("grossWeight");
  const tareWeight = itemForm.watch("tareWeight");
  const selectedClientId = headerForm.watch("clientId");
  const selectedQuality = headerForm.watch("qualityName");

  // Calculate net weight
  const netWeight = (() => {
    const gw = parseFloat(String(grossWeight)) || 0;
    const tw = parseFloat(String(tareWeight)) || 0;
    const net = gw - tw;
    return net > 0 ? net : 0;
  })();

  // Update client address when client changes
  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find((c: Client) => c.id === selectedClientId);
      if (client) {
        headerForm.setValue("clientAddress", client.address);
      }
    }
  }, [selectedClientId, clients, headerForm]);

  // Update denier and blend when quality changes
  useEffect(() => {
    if (selectedQuality && qualities.length > 0) {
      const quality = qualities.find((q: Quality) => q.name === selectedQuality);
      if (quality) {
        headerForm.setValue("denier", quality.denier);
        headerForm.setValue("blend", quality.blend);
      }
    }
  }, [selectedQuality, qualities, headerForm]);

  // Get the next bag number
  useEffect(() => {
    if (items.length > 0) {
      const maxBagNo = Math.max(...items.map(item => item.bagNo));
      itemForm.setValue("bagNo", maxBagNo + 1);
    } else {
      itemForm.setValue("bagNo", 1);
    }
  }, [items, itemForm]);

  // Add item handler
  const handleAddItem = itemForm.handleSubmit((data) => {
    const headerData = headerForm.getValues();
    
    if (!headerData.qualityName) {
      toast({
        title: "Validation Error",
        description: "Please select a quality first",
        variant: "destructive",
      });
      return;
    }

    const newItem: ReportItem = {
      ...data,
      netWeight,
      qualityName: headerData.qualityName,
      denier: headerData.denier,
      blend: headerData.blend,
      lotNumber: headerData.lotNumber,
      shadeNumber: headerData.shadeNumber,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    calculateTotals(updatedItems);

    // Reset the form for the next item
    itemForm.reset({
      bagNo: newItem.bagNo + 1,
      grossWeight: undefined,
      tareWeight: undefined,
      cones: undefined,
    });

    toast({
      title: "Success",
      description: "Item added to report",
    });
  });

  // Delete item handler
  const handleDeleteItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    calculateTotals(updatedItems);

    // Update the bag number for the next item
    if (updatedItems.length > 0) {
      const maxBagNo = Math.max(...updatedItems.map(item => item.bagNo));
      itemForm.setValue("bagNo", maxBagNo + 1);
    } else {
      itemForm.setValue("bagNo", 1);
    }

    toast({
      title: "Item Removed",
      description: "The item has been removed from the report",
    });
  };

  // Calculate totals and subtotals
  const calculateTotals = (itemsList: ReportItem[]) => {
    const newTotals = {
      bags: itemsList.length,
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
      cones: 0,
    };

    const subtotals: {
      [key: string]: {
        bags: number;
        grossWeight: number;
        tareWeight: number;
        netWeight: number;
        cones: number;
      };
    } = {};

    itemsList.forEach((item) => {
      newTotals.grossWeight += item.grossWeight;
      newTotals.tareWeight += item.tareWeight;
      newTotals.netWeight += item.netWeight;
      newTotals.cones += item.cones;

      // Calculate subtotals by quality
      if (!subtotals[item.qualityName]) {
        subtotals[item.qualityName] = {
          bags: 0,
          grossWeight: 0,
          tareWeight: 0,
          netWeight: 0,
          cones: 0,
        };
      }

      subtotals[item.qualityName].bags += 1;
      subtotals[item.qualityName].grossWeight += item.grossWeight;
      subtotals[item.qualityName].tareWeight += item.tareWeight;
      subtotals[item.qualityName].netWeight += item.netWeight;
      subtotals[item.qualityName].cones += item.cones;
    });

    setTotals(newTotals);
    setQualitySubtotals(subtotals);
  };

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: CreateReportInput) => {
      return apiRequest("POST", "/api/reports", data);
    },
    onSuccess: async (response) => {
      const reportData = await response.json();
      
      // Fetch the complete report with items
      const reportResponse = await fetch(`/api/reports/${reportData.id}`);
      const reportWithItems = await reportResponse.json();
      
      setCurrentReport(reportWithItems);
      setReportFinished(true);
      
      // Clear session storage
      sessionStorage.removeItem("packingData");
      
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      
      toast({
        title: "Report Created",
        description: "The packing report has been successfully created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create report: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Finish report handler
  const handleFinishReport = headerForm.handleSubmit((headerData) => {
    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item to the report",
        variant: "destructive",
      });
      return;
    }

    // Prepare the report data
    const reportData: CreateReportInput = {
      report: {
        reportDate: headerData.reportDate,
        clientId: headerData.clientId,
        challanNo: headerData.challanNo,
        qualityName: headerData.qualityName,
        shadeNumber: headerData.shadeNumber || null,
        denier: headerData.denier,
        blend: headerData.blend,
        lotNumber: headerData.lotNumber,
        totalBags: totals.bags,
        totalGrossWeight: totals.grossWeight,
        totalTareWeight: totals.tareWeight,
        totalNetWeight: totals.netWeight,
        totalCones: totals.cones,
      },
      items: items.map(item => ({
        bagNo: item.bagNo,
        grossWeight: item.grossWeight,
        tareWeight: item.tareWeight,
        netWeight: item.netWeight,
        cones: item.cones,
      })),
    };

    createReportMutation.mutate(reportData);
  });

  // Create a new report
  const handleCreateNew = () => {
    setItems([]);
    setTotals({
      bags: 0,
      grossWeight: 0,
      tareWeight: 0,
      netWeight: 0,
      cones: 0,
    });
    setQualitySubtotals({});
    setReportFinished(false);
    setCurrentReport(null);
    
    headerForm.reset({
      reportDate: new Date().toISOString().split("T")[0],
      clientId: undefined,
      clientAddress: "",
      challanNo: undefined,
      qualityName: "",
      shadeNumber: "",
      denier: undefined,
      blend: "",
      lotNumber: undefined,
    });
    
    itemForm.reset({
      bagNo: 1,
      grossWeight: undefined,
      tareWeight: undefined,
      cones: undefined,
    });

    toast({
      title: "New Report",
      description: "Ready to create a new packing report",
    });
  };

  // Export functions
  const handleExportExcel = () => {
    if (currentReport) {
      generateExcel(currentReport);
    } else if (items.length > 0) {
      // Create a temporary report object for export
      const tempReport = {
        report: {
          id: 0,
          reportDate: headerForm.getValues("reportDate"),
          clientId: headerForm.getValues("clientId"),
          challanNo: headerForm.getValues("challanNo"),
          qualityName: headerForm.getValues("qualityName"),
          shadeNumber: headerForm.getValues("shadeNumber") || null,
          denier: headerForm.getValues("denier"),
          blend: headerForm.getValues("blend"),
          lotNumber: headerForm.getValues("lotNumber"),
          totalBags: totals.bags,
          totalGrossWeight: totals.grossWeight,
          totalTareWeight: totals.tareWeight,
          totalNetWeight: totals.netWeight,
          totalCones: totals.cones,
          createdAt: new Date().toISOString(),
          clientName: clients.find((c: Client) => c.id === headerForm.getValues("clientId"))?.name || "",
          clientAddress: headerForm.getValues("clientAddress"),
        },
        items: items.map((item, index) => ({
          id: index,
          reportId: 0,
          bagNo: item.bagNo,
          grossWeight: item.grossWeight,
          tareWeight: item.tareWeight,
          netWeight: item.netWeight,
          cones: item.cones,
        })),
      };
      generateExcel(tempReport);
    }
  };

  const handleExportPDF = () => {
    if (currentReport) {
      generatePDF(currentReport);
    } else if (items.length > 0) {
      // Create a temporary report object for export
      const tempReport = {
        report: {
          id: 0,
          reportDate: headerForm.getValues("reportDate"),
          clientId: headerForm.getValues("clientId"),
          challanNo: headerForm.getValues("challanNo"),
          qualityName: headerForm.getValues("qualityName"),
          shadeNumber: headerForm.getValues("shadeNumber") || null,
          denier: headerForm.getValues("denier"),
          blend: headerForm.getValues("blend"),
          lotNumber: headerForm.getValues("lotNumber"),
          totalBags: totals.bags,
          totalGrossWeight: totals.grossWeight,
          totalTareWeight: totals.tareWeight,
          totalNetWeight: totals.netWeight,
          totalCones: totals.cones,
          createdAt: new Date().toISOString(),
          clientName: clients.find((c: Client) => c.id === headerForm.getValues("clientId"))?.name || "",
          clientAddress: headerForm.getValues("clientAddress"),
        },
        items: items.map((item, index) => ({
          id: index,
          reportId: 0,
          bagNo: item.bagNo,
          grossWeight: item.grossWeight,
          tareWeight: item.tareWeight,
          netWeight: item.netWeight,
          cones: item.cones,
        })),
      };
      generatePDF(tempReport);
    }
  };

  return (
    <div className="space-y-6">
      {!reportFinished ? (
        <>
          {/* Client & Report Details Card */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
              <CardTitle className="text-lg font-semibold text-neutral-900">Client & Report Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date field */}
                <div>
                  <Label htmlFor="reportDate">Report Date</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    {...headerForm.register("reportDate")}
                  />
                  {headerForm.formState.errors.reportDate && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.reportDate.message}</p>
                  )}
                </div>

                {/* Client name with search */}
                <div>
                  <Label htmlFor="clientId">Client Name</Label>
                  <Controller
                    control={headerForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger id="clientId">
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {headerForm.formState.errors.clientId && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.clientId.message}</p>
                  )}
                </div>

                {/* Challan number */}
                <div>
                  <Label htmlFor="challanNo">Challan No</Label>
                  <Input
                    id="challanNo"
                    type="number"
                    placeholder="e.g. 528"
                    {...headerForm.register("challanNo")}
                  />
                  {headerForm.formState.errors.challanNo && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.challanNo.message}</p>
                  )}
                </div>

                {/* Client Address */}
                <div className="md:col-span-2 lg:col-span-3">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    rows={2}
                    placeholder="Client address will auto-populate when client is selected"
                    readOnly
                    {...headerForm.register("clientAddress")}
                  />
                  {headerForm.formState.errors.clientAddress && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.clientAddress.message}</p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Finished Yarn Details Card */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
              <CardTitle className="text-lg font-semibold text-neutral-900">Finished Yarn Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quality Name with auto-population */}
                <div>
                  <Label htmlFor="qualityName">Quality Name</Label>
                  <Controller
                    control={headerForm.control}
                    name="qualityName"
                    render={({ field }) => (
                      <Select
                        value={field.value?.toString()}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="qualityName">
                          <SelectValue placeholder="Select a quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualities.map((quality: Quality) => (
                            <SelectItem key={quality.id} value={quality.name}>
                              {quality.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {headerForm.formState.errors.qualityName && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.qualityName.message}</p>
                  )}
                </div>

                {/* Shade Number */}
                <div>
                  <Label htmlFor="shadeNumber">Shade Number</Label>
                  <Input
                    id="shadeNumber"
                    placeholder="e.g. UV refuge"
                    {...headerForm.register("shadeNumber")}
                  />
                </div>

                {/* Denier - Auto-populated */}
                <div>
                  <Label htmlFor="denier">Denier</Label>
                  <Input
                    id="denier"
                    type="number"
                    placeholder="Auto-populated from quality"
                    readOnly
                    className="bg-gray-50"
                    {...headerForm.register("denier")}
                  />
                  {headerForm.formState.errors.denier && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.denier.message}</p>
                  )}
                </div>

                {/* Blend - Auto-populated */}
                <div>
                  <Label htmlFor="blend">Blend</Label>
                  <Input
                    id="blend"
                    placeholder="Auto-populated from quality"
                    readOnly
                    className="bg-gray-50"
                    {...headerForm.register("blend")}
                  />
                  {headerForm.formState.errors.blend && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.blend.message}</p>
                  )}
                </div>

                {/* Lot Number */}
                <div>
                  <Label htmlFor="lotNumber">Lot Number</Label>
                  <Input
                    id="lotNumber"
                    type="number"
                    placeholder="e.g. 58"
                    {...headerForm.register("lotNumber")}
                  />
                  {headerForm.formState.errors.lotNumber && (
                    <p className="text-sm text-red-500 mt-1">{headerForm.formState.errors.lotNumber.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Item Details Card */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
              <CardTitle className="text-lg font-semibold text-neutral-900">Item Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Bag No */}
                <div>
                  <Label htmlFor="bagNo">Bag No</Label>
                  <Input
                    id="bagNo"
                    type="number"
                    readOnly
                    {...itemForm.register("bagNo")}
                  />
                  {itemForm.formState.errors.bagNo && (
                    <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.bagNo.message}</p>
                  )}
                </div>

                {/* Gross Weight */}
                <div>
                  <Label htmlFor="grossWeight">Gross Weight</Label>
                  <Input
                    id="grossWeight"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 18.4"
                    {...itemForm.register("grossWeight")}
                  />
                  {itemForm.formState.errors.grossWeight && (
                    <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.grossWeight.message}</p>
                  )}
                </div>

                {/* Tare Weight */}
                <div>
                  <Label htmlFor="tareWeight">Tare Weight</Label>
                  <Input
                    id="tareWeight"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3"
                    {...itemForm.register("tareWeight")}
                  />
                  {itemForm.formState.errors.tareWeight && (
                    <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.tareWeight.message}</p>
                  )}
                </div>

                {/* Net Weight (Calculated) */}
                <div>
                  <Label htmlFor="netWeight">Net Weight</Label>
                  <Input
                    id="netWeight"
                    type="number"
                    value={netWeight.toFixed(1)}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                {/* No. of Cones */}
                <div>
                  <Label htmlFor="cones">No. of Cones</Label>
                  <Input
                    id="cones"
                    type="number"
                    placeholder="e.g. 10"
                    {...itemForm.register("cones")}
                  />
                  {itemForm.formState.errors.cones && (
                    <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.cones.message}</p>
                  )}
                </div>

                {/* Add Item Button */}
                <div className="col-span-full mt-4">
                  <Button type="submit" className="w-full flex items-center justify-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item to Report
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </>
      ) : null}

      {/* Report Table */}
      {(items.length > 0 || reportFinished) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-neutral-900">
                {reportFinished ? "Saved Report" : "Current Report Items"}
              </CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-1.5 h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <File className="mr-1.5 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No.</TableHead>
                  <TableHead>Bag No.</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Denier</TableHead>
                  <TableHead>Blend</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Shade</TableHead>
                  <TableHead>Gross Wt</TableHead>
                  <TableHead>Tare Wt</TableHead>
                  <TableHead>Net Wt</TableHead>
                  <TableHead>Cones</TableHead>
                  {!reportFinished && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Regular rows */}
                {(currentReport ? currentReport.items : items).map((item, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{index + 1}</TableCell>
                    <TableCell>{item.bagNo}</TableCell>
                    <TableCell>{currentReport ? currentReport.report.qualityName : item.qualityName}</TableCell>
                    <TableCell>{currentReport ? currentReport.report.denier : item.denier}</TableCell>
                    <TableCell>{currentReport ? currentReport.report.blend : item.blend}</TableCell>
                    <TableCell>{currentReport ? currentReport.report.lotNumber : item.lotNumber}</TableCell>
                    <TableCell>{currentReport ? currentReport.report.shadeNumber : item.shadeNumber}</TableCell>
                    <TableCell>{typeof item.grossWeight === 'number' ? item.grossWeight.toFixed(1) : item.grossWeight}</TableCell>
                    <TableCell>{typeof item.tareWeight === 'number' ? item.tareWeight.toFixed(1) : item.tareWeight}</TableCell>
                    <TableCell className="font-medium">{typeof item.netWeight === 'number' ? item.netWeight.toFixed(1) : item.netWeight}</TableCell>
                    <TableCell>{item.cones}</TableCell>
                    {!reportFinished && (
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteItem(index)} 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {/* Subtotal rows */}
                {Object.entries(qualitySubtotals).map(([quality, subtotal]) => (
                  <TableRow key={`subtotal-${quality}`} className="bg-gray-50 font-medium">
                    <TableCell colSpan={7}>Subtotal for {quality}</TableCell>
                    <TableCell>{subtotal.grossWeight.toFixed(1)}</TableCell>
                    <TableCell>{subtotal.tareWeight.toFixed(1)}</TableCell>
                    <TableCell>{subtotal.netWeight.toFixed(1)}</TableCell>
                    <TableCell>{subtotal.cones}</TableCell>
                    {!reportFinished && <TableCell></TableCell>}
                  </TableRow>
                ))}

                {/* Grand total row */}
                <TableRow className="bg-primary/10 font-semibold">
                  <TableCell colSpan={7}>Grand Total</TableCell>
                  <TableCell>{currentReport ? Number(currentReport.report.totalGrossWeight).toFixed(1) : totals.grossWeight.toFixed(1)}</TableCell>
                  <TableCell>{currentReport ? Number(currentReport.report.totalTareWeight).toFixed(1) : totals.tareWeight.toFixed(1)}</TableCell>
                  <TableCell>{currentReport ? Number(currentReport.report.totalNetWeight).toFixed(1) : totals.netWeight.toFixed(1)}</TableCell>
                  <TableCell>{currentReport ? currentReport.report.totalCones : totals.cones}</TableCell>
                  {!reportFinished && <TableCell></TableCell>}
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200">
            {reportFinished ? (
              <Button 
                onClick={handleCreateNew} 
                className="w-full flex items-center justify-center"
              >
                Create New Report
              </Button>
            ) : (
              <Button 
                onClick={handleFinishReport} 
                variant="default" 
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                disabled={createReportMutation.isPending}
              >
                {createReportMutation.isPending ? "Saving..." : "Finish & Save Report"}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
