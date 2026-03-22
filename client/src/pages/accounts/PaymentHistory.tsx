import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  History,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface PaymentHistoryItem {
  id: string;
  amountPaid: string;
  amountDue: string;
  paymentDate: string;
  createdAt: string;
  paymentMode: string;
  status: string;
  partyName: string;
  partyType: 'Customer' | 'Supplier';
  type: 'Receivable' | 'Payable';
  refType: 'Invoice' | 'PO' | 'Quotation';
  refNumber: string;
}

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: history = [], isLoading } = useQuery<PaymentHistoryItem[]>({
    queryKey: ["/api/accounts/payment-history"],
  });

  const filteredHistory = history.filter((item) => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.partyName?.toLowerCase().includes(searchStr) ||
      item.refNumber?.toLowerCase().includes(searchStr) ||
      item.type?.toLowerCase().includes(searchStr) ||
      item.paymentMode?.toLowerCase().includes(searchStr)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Paid</Badge>;
      case "partial":
        return <Badge className="bg-amber-50 text-amber-600 border-amber-100">Partial</Badge>;
      case "pending":
        return <Badge className="bg-slate-50 text-slate-600 border-slate-100">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModeLabel = (mode: string) => {
    if (!mode) return "N/A";
    return mode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="p-4 space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl text-black mb-2">Payment History</h1>
          <p className="text-gray-500">
            Complete record of all receivables and payables transactions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none  bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-500  ">Total Transactions</p>
              <p className="text-2xl ">{history.length}</p>
            </div>
            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary">
              <History className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none  bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-500  ">Recent Inflow</p>
              <p className="text-2xl  text-emerald-600">
                ₹{history
                  .filter(i => i.type === 'Receivable')
                  .reduce((acc, curr) => acc + parseFloat(curr.amountPaid || "0"), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none  bg-card/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-500  ">Recent Outflow</p>
              <p className="text-2xl  text-rose-600">
                ₹{history
                  .filter(i => i.type === 'Payable')
                  .reduce((acc, curr) => acc + parseFloat(curr.amountPaid || "0"), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded bg-rose-100 flex items-center justify-center text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none  bg-card/50">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl ">Transaction Ledger</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search party, reference..."
                  className="pl-8 bg-background border-none shadow-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-gray-500 italic">
                      No payment history found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <span>{format(new Date(item.paymentDate || item.createdAt), "dd MMM yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {item.type === 'Receivable' ? (
                            <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 text-rose-500" />
                          )}
                          <span className={item.type === 'Receivable' ? 'text-emerald-600 ' : 'text-rose-600 '}>
                            {item.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className=" text-slate-700">{item.partyName || "Unknown"}</div>
                          <div className="text-xs text-gray-500 ">{item.partyType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-xs  text-primary">{item.refNumber || "N/A"}</div>
                          <div className="text-xs text-gray-500 ">{item.refType}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="">
                          ₹{parseFloat(item.amountPaid || "0").toLocaleString()}
                        </div>
                        {item.status !== 'paid' && (
                          <div className="text-xs text-gray-500">
                            Due: ₹{parseFloat(item.amountDue || "0").toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs  text-slate-600">
                          {getModeLabel(item.paymentMode)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
