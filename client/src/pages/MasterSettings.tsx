
import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import { StartTourButton } from "@/components/StartTourButton";
import { adminSettingsTour } from "@/components/tours/dashboardTour";

const fetchSettings = async () => {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
};

const updateSettings = async (settings: any) => {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
};

const MasterSettings: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/admin/settings"],
    queryFn: fetchSettings,
  });
  const mutation = useMutation({
    mutationFn: updateSettings,
  });


  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    gstNumber: "",
    taxRate: "",
    bankAccount: "",
    paymentTerms: "",
  });


  React.useEffect(() => {
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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Master Settings</h1>
          <p className="text-muted-foreground">Manage global system settings and configuration for all departments.</p>
        </div>
        <StartTourButton tourConfig={adminSettingsTour} tourName="admin-settings" />
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error.message || "Failed to load settings."}</div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-medium mb-1">GST Number</label>
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Enter GST number"
                name="gstNumber"
                value={form.gstNumber}
                onChange={handleChange}
                data-tour="admin-settings-gst-input"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Tax Rate (%)</label>
              <input
                className="border rounded px-3 py-2 w-full"
                type="number"
                placeholder="18"
                name="taxRate"
                value={form.taxRate}
                onChange={handleChange}
                data-tour="admin-settings-tax-rate-input"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Bank Account</label>
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Bank name, IFSC, Account #"
                name="bankAccount"
                value={form.bankAccount}
                onChange={handleChange}
                data-tour="admin-settings-bank-account-input"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Default Payment Terms</label>
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="30 days"
                name="paymentTerms"
                value={form.paymentTerms}
                onChange={handleChange}
                data-tour="admin-settings-payment-terms-input"
              />
            </div>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              type="submit"
              disabled={mutation.isPending}
              data-tour="admin-settings-save-button"
            >
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </button>
            {mutation.isSuccess && (
              <div className="text-green-600 mt-2">Settings saved successfully.</div>
            )}
            {mutation.isError && (
              <div className="text-red-600 mt-2">{mutation.error?.message || "Failed to save settings."}</div>
            )}
          </form>
        )}
      </div>
    </main>
  );
};

export default MasterSettings;
