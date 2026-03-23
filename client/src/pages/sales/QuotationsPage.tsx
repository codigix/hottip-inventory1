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
    <div className="p-4 space-y-2 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl  text-slate-800">Quotations Hub</h1>
          <p className="text-xs text-slate-500 ">
            Centralized management for all your outbound and inbound quotations
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === "sent" ? (
            <Link href="/sales/outbound-quotations/new">
              <Button className="bg-primary hover:bg-primary text-white border-none ">
                <Plus className="h-4 w-4 mr-2" />
                New Outbound Quotation
              </Button>
            </Link>
          ) : (
            <Button className="bg-primary hover:bg-primary text-white border-none " onClick={() => {
              const uploadBtn = document.querySelector('[data-testid="button-upload-inbound-quotation"]') as HTMLButtonElement;
              if (uploadBtn) uploadBtn.click();
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Received Quotation
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-2">
        <TabsList className="bg-white border border-slate-200 p-1 h-11  inline-flex w-auto">
          <TabsTrigger 
            value="sent" 
            className="p-2 rounded data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none transition-all text-slate-600 text-xs   "
          >
            <FileUp className="h-4 w-4 mr-2" />
            Sent to Clients
          </TabsTrigger>
          <TabsTrigger 
            value="received" 
            className="p-2 rounded data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none transition-all text-slate-600 text-xs   "
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
