import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OutboundQuotations from "./OutboundQuotations";
import InboundQuotations from "./InboundQuotations";
import { FileUp, FileDown, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function QuotationsPage() {
  const [activeTab, setActiveTab] = useState("sent");

  return (
    <div className="p-8 space-y-6 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quotations Hub</h1>
          <p className="text-muted-foreground mt-1">
            Centralized management for all your outbound and inbound quotations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === "sent" ? (
            <Link href="/sales/outbound-quotations/new">
              <Button className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                New Outbound Quotation
              </Button>
            </Link>
          ) : (
            <Button className="shadow-sm" onClick={() => {
              // Trigger the dialog in InboundQuotations if possible, 
              // or just rely on the button inside the component
              const uploadBtn = document.querySelector('[data-testid="button-upload-inbound-quotation"]') as HTMLButtonElement;
              if (uploadBtn) uploadBtn.click();
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Received Quotation
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-white border p-1 h-12 shadow-sm inline-flex w-auto">
          <TabsTrigger 
            value="sent" 
            className="px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Sent to Clients
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Received from Clients
          </TabsTrigger>
        </TabsList>

        <div className="mt-0">
          <TabsContent value="sent" className="border-none p-0 outline-none animate-in fade-in-50 duration-300">
            <OutboundQuotations isEmbedded={true} />
          </TabsContent>

          <TabsContent value="received" className="border-none p-0 outline-none animate-in fade-in-50 duration-300">
            <InboundQuotations isEmbedded={true} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
