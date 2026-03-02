"use client";

import { AppLayout } from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Filter } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ExportsPage() {
  const [exportType, setExportType] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [hasPhone, setHasPhone] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);
  const [hasHeaterProgram, setHasHeaterProgram] = useState(false);
  const [hasIAqualink, setHasIAqualink] = useState(false);
  const [street, setStreet] = useState("");

  const handleExport = async () => {
    setLoading(true);
    try {
      let query = supabase.from("customers").select(`
        *,
        program_enrollments(program_type, status)
      `);

      if (exportType === "with_phone" || hasPhone) {
        query = query.not("phone", "is", null);
      }
      if (exportType === "with_email" || hasEmail) {
        query = query.not("email", "is", null);
      }

      if (city) {
        query = query.ilike("city", `%${city}%`);
      }
      if (zip) {
        query = query.eq("zip", zip);
      }
      if (street) {
        query = query.ilike("address_line1", `%${street}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (hasHeaterProgram) {
        filteredData = filteredData.filter((customer: any) =>
          customer.program_enrollments?.some(
            (enrollment: any) =>
              enrollment.program_type === "heater_annual" &&
              enrollment.status === "active"
          )
        );
      }

      if (hasIAqualink) {
        filteredData = filteredData.filter((customer: any) =>
          customer.program_enrollments?.some(
            (enrollment: any) =>
              enrollment.program_type === "iaqualink" && enrollment.status === "active"
          )
        );
      }

      const csv = convertToCSV(filteredData);
      downloadCSV(
        csv,
        `pure-pools-export-${exportType}-${new Date().toISOString().split("T")[0]}.csv`
      );

      toast.success(`Exported ${filteredData.length} customers successfully`);
    } catch (error: any) {
      toast.error(error.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickExport = async (type: string) => {
    setLoading(true);
    try {
      let query = supabase.from("customers").select(`
        *,
        program_enrollments(program_type, status)
      `);

      if (type === "heater_annual") {
        const { data } = await query;
        const filtered =
          data?.filter((customer: any) =>
            customer.program_enrollments?.some(
              (enrollment: any) =>
                enrollment.program_type === "heater_annual" &&
                enrollment.status === "active"
            )
          ) || [];

        const csv = convertToCSV(filtered);
        downloadCSV(csv, `heater-annual-customers-${new Date().toISOString().split("T")[0]}.csv`);
        toast.success(`Exported ${filtered.length} heater annual customers`);
      } else if (type === "iaqualink") {
        const { data } = await query;
        const filtered =
          data?.filter((customer: any) =>
            customer.program_enrollments?.some(
              (enrollment: any) =>
                enrollment.program_type === "iaqualink" && enrollment.status === "active"
            )
          ) || [];

        const csv = convertToCSV(filtered);
        downloadCSV(csv, `iaqualink-customers-${new Date().toISOString().split("T")[0]}.csv`);
        toast.success(`Exported ${filtered.length} iAqualink customers`);
      } else if (type === "all_with_contact") {
        query = query.not("phone", "is", null).not("email", "is", null);
        const { data } = await query;
        const csv = convertToCSV(data || []);
        downloadCSV(
          csv,
          `all-customers-with-contact-${new Date().toISOString().split("T")[0]}.csv`
        );
        toast.success(`Exported ${data?.length || 0} customers with contact info`);
      }
    } catch (error: any) {
      toast.error(error.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";

    const headers = [
      "first_name",
      "last_name",
      "phone",
      "email",
      "address_line1",
      "city",
      "state",
      "zip",
      "tags",
    ];
    const rows = data.map((row) => {
      return headers
        .map((header) => {
          const value = row[header];
          if (Array.isArray(value)) {
            return `"${value.join(", ")}"`;
          }
          return `"${value || ""}"`;
        })
        .join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketing Exports</h1>
          <p className="text-gray-600 mt-1">
            Generate targeted customer lists for campaigns and outreach
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Button
                onClick={() => handleQuickExport("heater_annual")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Heater Annual Customers
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Button
                onClick={() => handleQuickExport("iaqualink")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                iAqualink Customers
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Button
                onClick={() => handleQuickExport("all_with_contact")}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                All with Contact Info
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Filter className="h-5 w-5 inline mr-2" />
              Custom Export with Filters
            </CardTitle>
            <CardDescription>
              Build a targeted customer list with specific criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  placeholder="e.g., Marco Island"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <Label>ZIP Code</Label>
                <Input
                  placeholder="e.g., 34145"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Street Name</Label>
                <Input
                  placeholder="e.g., Tahiti Road"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Contact Requirements</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-phone"
                  checked={hasPhone}
                  onCheckedChange={(checked) => setHasPhone(checked as boolean)}
                />
                <label htmlFor="has-phone" className="text-sm">
                  Must have phone number
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-email"
                  checked={hasEmail}
                  onCheckedChange={(checked) => setHasEmail(checked as boolean)}
                />
                <label htmlFor="has-email" className="text-sm">
                  Must have email address
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Program Enrollment</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="heater-program"
                  checked={hasHeaterProgram}
                  onCheckedChange={(checked) => setHasHeaterProgram(checked as boolean)}
                />
                <label htmlFor="heater-program" className="text-sm">
                  Enrolled in Heater Annual Service
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="iaqualink"
                  checked={hasIAqualink}
                  onCheckedChange={(checked) => setHasIAqualink(checked as boolean)}
                />
                <label htmlFor="iaqualink" className="text-sm">
                  Enrolled in iAqualink Monitoring
                </label>
              </div>
            </div>

            <Button onClick={handleExport} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Exporting..." : "Export Filtered List to CSV"}
            </Button>

            <div className="text-sm text-gray-600 mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium mb-2">Export includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Customer name and contact information</li>
                <li>Full address details</li>
                <li>Tags for segmentation</li>
                <li>Phone numbers in standard format</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
