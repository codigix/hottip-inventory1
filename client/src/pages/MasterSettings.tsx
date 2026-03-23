import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminSettingsTour } from "@/components/tours/dashboardTour";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, Building2, Receipt, Landmark, FileClock, Loader2, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface AdminSettings {
  id?: number;
  gstNumber: string;
  taxRate: number;
  bankAccount: string;
  paymentTerms: string;
  updatedAt?: string;
}

const fetchSettings = async (): Promise<AdminSettings> => {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
};

const updateSettings = async (settings: Partial<AdminSettings>) => {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
};

const MasterSettings: React.FC = () => {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/settings"],
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/settings"] });
      toast({
        title: "Settings Saved",
        description: "System configuration has been updated successfully.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const [form, setForm] = useState({
    gstNumber: "",
    taxRate: "",
    bankAccount: "",
    paymentTerms: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        gstNumber: data.gstNumber || "",
        taxRate: data.taxRate?.toString() || "",
        bankAccount: data.bankAccount || "",
        paymentTerms: data.paymentTerms || "",
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      taxRate: parseInt(form.taxRate) || 0,
    });
  };

  const resetForm = () => {
    if (data) {
      setForm({
        gstNumber: data.gstNumber || "",
        taxRate: data.taxRate?.toString() || "",
        bankAccount: data.bankAccount || "",
        paymentTerms: data.paymentTerms || "",
      });
      toast({
        description: "Form reset to current values.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-900 tracking-tight flex items-center gap-2" data-tour="admin-settings-header">
            <Settings2 className="h-6 w-6 text-primary" />
            Master Settings
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Manage global system configuration and business defaults.
          </p>
        </div>
        <StartTourButton tourConfig={adminSettingsTour} tourName="admin-settings" />
      </div>

      <div>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-sm text-slate-800">General Configuration</CardTitle>
            <CardDescription className="text-xs">
              Configure taxation, banking, and payment details for documents and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="text-slate-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    GST Number
                  </Label>
                  <Input
                    id="gstNumber"
                    name="gstNumber"
                    placeholder="Enter business GSTIN"
                    value={form.gstNumber}
                    onChange={handleChange}
                    className="bg-white border-slate-200 focus:ring-primary/20"
                    data-tour="admin-settings-gst-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-slate-700 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-slate-400" />
                    Default Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    placeholder="e.g. 18"
                    value={form.taxRate}
                    onChange={handleChange}
                    className="bg-white border-slate-200 focus:ring-primary/20"
                    data-tour="admin-settings-tax-rate-input"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bankAccount" className="text-slate-700 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-slate-400" />
                    Bank Account Details
                  </Label>
                  <Input
                    id="bankAccount"
                    name="bankAccount"
                    placeholder="Bank Name, Account Number, IFSC Code"
                    value={form.bankAccount}
                    onChange={handleChange}
                    className="bg-white border-slate-200 focus:ring-primary/20"
                    data-tour="admin-settings-bank-account-input"
                  />
                  <p className="text-[10px] text-slate-400">This will appear on all outbound invoices and quotations.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="paymentTerms" className="text-slate-700 flex items-center gap-2">
                    <FileClock className="h-4 w-4 text-slate-400" />
                    Default Payment Terms
                  </Label>
                  <Input
                    id="paymentTerms"
                    name="paymentTerms"
                    placeholder="e.g. Net 30 Days"
                    value={form.paymentTerms}
                    onChange={handleChange}
                    className="bg-white border-slate-200 focus:ring-primary/20"
                    data-tour="admin-settings-payment-terms-input"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 flex items-center justify-between p-4 px-6">
            <div className="text-xs text-slate-500 italic">
              {data?.updatedAt && (
                <span>Last updated: {format(new Date(data.updatedAt), "PPP p")}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                data-tour="admin-settings-reset-button"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                form="settings-form"
                type="submit"
                disabled={mutation.isPending}
                className="bg-primary hover:bg-primary/90 min-w-[140px]"
                data-tour="admin-settings-save-button"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default MasterSettings;
