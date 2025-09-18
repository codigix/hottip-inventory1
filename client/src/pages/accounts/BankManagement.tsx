import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Landmark, CreditCard, TrendingUp, Activity, Plus, Search, Filter, Eye, Edit, Trash2, DollarSign, Building, ArrowUpDown, CheckCircle2, XCircle, Calendar, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertBankAccountSchema, insertBankTransactionSchema, type BankAccount, type BankTransaction, type InsertBankAccount, type InsertBankTransaction } from "@shared/schema";

// Schemas - Use shared schemas from drizzle-zod with proper numeric validation
const bankAccountFormSchema = insertBankAccountSchema.extend({
  openingBalance: z.coerce.number().nonnegative("Opening balance must be zero or positive"),
  currentBalance: z.coerce.number().nonnegative("Current balance must be zero or positive"),
});

const bankTransactionFormSchema = insertBankTransactionSchema.extend({
  amount: z.coerce.number().gt(0, "Amount must be greater than zero"),
  balance: z.coerce.number("Balance must be a valid number"),
  date: z.coerce.date("Please enter a valid date"),
});

type BankAccountFormData = z.infer<typeof bankAccountFormSchema>;
type BankTransactionFormData = z.infer<typeof bankTransactionFormSchema>;

// Status styling
const transactionTypeStyles = {
  credit: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  debit: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const accountStatusStyles = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export default function BankManagement() {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [isViewAccountOpen, setIsViewAccountOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeleteTransactionOpen, setIsDeleteTransactionOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<BankTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");
  const [selectedAccountForTransactions, setSelectedAccountForTransactions] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("accounts");

  // Data fetching
  const { data: bankAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: activeBankAccounts = [] } = useQuery({
    queryKey: ["/api/bank-accounts/active"],
  });

  const { data: defaultBankAccount } = useQuery({
    queryKey: ["/api/bank-accounts/default"],
  });

  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/bank-transactions"],
  });

  const { data: selectedAccountTransactions = [] } = useQuery({
    queryKey: ["/api/bank-transactions/account", selectedAccountForTransactions],
    enabled: selectedAccountForTransactions !== "all",
  });

  // Form setup
  const createAccountForm = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      name: "",
      bankName: "",
      accountNumberMasked: "",
      ifsc: "",
      upiId: "",
      openingBalance: 0,
      currentBalance: 0,
      isDefault: false,
      isActive: true,
    },
  });

  const editAccountForm = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountFormSchema),
  });

  const createTransactionForm = useForm<BankTransactionFormData>({
    resolver: zodResolver(bankTransactionFormSchema),
    defaultValues: {
      bankAccountId: "",
      date: new Date(),
      type: "credit",
      amount: 0,
      description: "",
      balance: 0,
      reference: "",
    },
  });

  const editTransactionForm = useForm<BankTransactionFormData>({
    resolver: zodResolver(bankTransactionFormSchema),
  });

  // Calculate metrics from actual data
  const bankAccountsArray = Array.isArray(bankAccounts) ? bankAccounts : [];
  const allTransactionsArray = Array.isArray(allTransactions) ? allTransactions : [];
  
  const totalBalance = bankAccountsArray.reduce((sum: number, account: any) => sum + parseFloat(account.currentBalance || 0), 0);
  const totalAccounts = bankAccountsArray.length;
  const activeAccounts = bankAccountsArray.filter((account: any) => account.isActive).length;
  
  // Calculate monthly metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTransactions = allTransactionsArray.filter((transaction: any) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });
  
  const monthlyInflow = monthlyTransactions
    .filter((t: any) => t.type === 'credit')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
    
  const monthlyOutflow = monthlyTransactions
    .filter((t: any) => t.type === 'debit')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  // Mutations for bank accounts
  const createAccountMutation = useMutation({
    mutationFn: (data: BankAccountFormData) =>
      apiRequest("/api/bank-accounts", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          openingBalance: data.openingBalance,
          currentBalance: data.currentBalance,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts/default"] });
      toast({ title: "Success", description: "Bank account created successfully" });
      setIsCreateAccountOpen(false);
      createAccountForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create bank account", variant: "destructive" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, ...data }: BankAccountFormData & { id: string }) =>
      apiRequest(`/api/bank-accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          openingBalance: data.openingBalance,
          currentBalance: data.currentBalance,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts/default"] });
      toast({ title: "Success", description: "Bank account updated successfully" });
      setIsEditAccountOpen(false);
      setSelectedAccount(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bank account", variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/bank-accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts/default"] });
      toast({ title: "Success", description: "Bank account deleted successfully" });
      setIsDeleteAccountOpen(false);
      setAccountToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete bank account", variant: "destructive" });
    },
  });

  // Mutations for transactions
  const createTransactionMutation = useMutation({
    mutationFn: (data: BankTransactionFormData) =>
      apiRequest("/api/bank-transactions", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          date: data.date instanceof Date ? data.date.toISOString() : new Date(data.date).toISOString(),
          amount: data.amount,
          balance: data.balance,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions/account"] });
      toast({ title: "Success", description: "Bank transaction created successfully" });
      setIsCreateTransactionOpen(false);
      createTransactionForm.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create bank transaction", variant: "destructive" });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, ...data }: BankTransactionFormData & { id: string }) =>
      apiRequest(`/api/bank-transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          date: data.date instanceof Date ? data.date.toISOString() : new Date(data.date).toISOString(),
          amount: data.amount,
          balance: data.balance,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions/account"] });
      toast({ title: "Success", description: "Bank transaction updated successfully" });
      setIsEditTransactionOpen(false);
      setSelectedTransaction(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bank transaction", variant: "destructive" });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/bank-transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-transactions/account"] });
      toast({ title: "Success", description: "Bank transaction deleted successfully" });
      setIsDeleteTransactionOpen(false);
      setTransactionToDelete(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete bank transaction", variant: "destructive" });
    },
  });

  // Account handlers
  const handleCreateAccountSubmit = (data: BankAccountFormData) => {
    createAccountMutation.mutate(data);
  };

  const handleEditAccountSubmit = (data: BankAccountFormData) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ ...data, id: selectedAccount.id });
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    editAccountForm.reset({
      name: account.name,
      bankName: account.bankName,
      accountNumberMasked: account.accountNumberMasked,
      ifsc: account.ifsc,
      upiId: account.upiId || "",
      openingBalance: account.openingBalance,
      currentBalance: account.currentBalance,
      isDefault: account.isDefault,
      isActive: account.isActive,
    });
    setIsEditAccountOpen(true);
  };

  const handleViewAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsViewAccountOpen(true);
  };

  const handleDeleteAccountClick = (account: BankAccount) => {
    setAccountToDelete(account);
    setIsDeleteAccountOpen(true);
  };

  const handleDeleteAccountConfirm = () => {
    if (accountToDelete) {
      deleteAccountMutation.mutate(accountToDelete.id);
    }
  };

  // Transaction handlers
  const handleCreateTransactionSubmit = (data: BankTransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  const handleEditTransactionSubmit = (data: BankTransactionFormData) => {
    if (selectedTransaction) {
      updateTransactionMutation.mutate({ ...data, id: selectedTransaction.id });
    }
  };

  const handleEditTransaction = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    editTransactionForm.reset({
      bankAccountId: transaction.bankAccountId,
      date: new Date(transaction.date),
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      balance: transaction.balance,
      reference: transaction.reference || "",
    });
    setIsEditTransactionOpen(true);
  };

  const handleDeleteTransactionClick = (transaction: BankTransaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteTransactionOpen(true);
  };

  const handleDeleteTransactionConfirm = () => {
    if (transactionToDelete) {
      deleteTransactionMutation.mutate(transactionToDelete.id);
    }
  };

  // Filtered data
  const filteredAccounts = bankAccountsArray.filter((account: BankAccount) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.accountNumberMasked.includes(searchTerm);
    const matchesStatus = accountStatusFilter === "all" || 
                         (accountStatusFilter === "active" && account.isActive) ||
                         (accountStatusFilter === "inactive" && !account.isActive);
    return matchesSearch && matchesStatus;
  });

  const displayTransactions = selectedAccountForTransactions === "all" ? allTransactionsArray : selectedAccountTransactions;
  const filteredTransactions = displayTransactions.filter((transaction: BankTransaction & { bankAccount?: any }) => {
    const accountName = transaction.bankAccount?.name || 'Unknown Account';
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = transactionTypeFilter === "all" || transaction.type === transactionTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
            Bank Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Bank account details and transactions
          </p>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Total Balance</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-balance">
              ₹{(totalBalance / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">
              Across {totalAccounts} {totalAccounts === 1 ? 'account' : 'accounts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Monthly Inflow</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-monthly-inflow">
              ₹{(monthlyInflow / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Monthly Outflow</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-monthly-outflow">
              ₹{(monthlyOutflow / 100000).toFixed(1)}L
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-light">Active Accounts</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-accounts">
              {activeAccounts}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {totalAccounts} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts" data-testid="tab-accounts">
            Bank Accounts ({totalAccounts})
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            Transactions ({allTransactionsArray.length})
          </TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-accounts"
                />
              </div>
              <Select value={accountStatusFilter} onValueChange={setAccountStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-account-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-account">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                  <DialogDescription>
                    Add a new bank account to manage your finances.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createAccountForm}>
                  <form onSubmit={createAccountForm.handleSubmit(handleCreateAccountSubmit)} className="space-y-4">
                    <FormField
                      control={createAccountForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Primary Current Account" data-testid="input-account-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createAccountForm.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input placeholder="HDFC Bank" data-testid="input-bank-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createAccountForm.control}
                      name="accountNumberMasked"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number (masked)</FormLabel>
                          <FormControl>
                            <Input placeholder="xxxx1234" data-testid="input-account-number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createAccountForm.control}
                      name="ifsc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IFSC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="HDFC0000123" data-testid="input-ifsc" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createAccountForm.control}
                      name="upiId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPI ID (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="company@paytm" data-testid="input-upi-id" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createAccountForm.control}
                        name="openingBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Balance</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" inputMode="decimal" data-testid="input-opening-balance" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createAccountForm.control}
                        name="currentBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Balance</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" inputMode="decimal" data-testid="input-current-balance" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <FormField
                        control={createAccountForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input 
                                type="checkbox" 
                                checked={field.value}
                                onChange={field.onChange}
                                data-testid="checkbox-is-default"
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Default Account</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={createAccountForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input 
                                type="checkbox" 
                                checked={field.value}
                                onChange={field.onChange}
                                data-testid="checkbox-is-active"
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Active</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateAccountOpen(false)}
                        data-testid="button-cancel-create-account"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createAccountMutation.isPending}
                        data-testid="button-submit-create-account"
                        className="flex-1"
                      >
                        {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Accounts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first bank account.
                  </p>
                  <Button onClick={() => setIsCreateAccountOpen(true)} data-testid="button-add-first-account">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Details</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account: BankAccount) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <div>
                            <div className="font-light" data-testid={`text-account-name-${account.id}`}>
                              {account.name}
                              {account.isDefault && (
                                <Badge variant="secondary" className="ml-2">Default</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ****{account.accountNumberMasked}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-light">{account.bankName}</div>
                            <div className="text-sm text-muted-foreground">{account.ifsc}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-light" data-testid={`text-balance-${account.id}`}>
                              ₹{parseFloat(account.currentBalance).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Opening: ₹{parseFloat(account.openingBalance).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={accountStatusStyles[account.isActive ? 'active' : 'inactive']}
                            data-testid={`badge-status-${account.id}`}
                          >
                            {account.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewAccount(account)}
                              data-testid={`button-view-${account.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditAccount(account)}
                              data-testid={`button-edit-${account.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAccountClick(account)}
                              data-testid={`button-delete-${account.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-transactions"
                />
              </div>
              <Select value={selectedAccountForTransactions} onValueChange={setSelectedAccountForTransactions}>
                <SelectTrigger className="w-48" data-testid="select-account-filter">
                  <Building className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {activeBankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger className="w-40" data-testid="select-transaction-type-filter">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isCreateTransactionOpen} onOpenChange={setIsCreateTransactionOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-transaction">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new bank transaction.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createTransactionForm}>
                  <form onSubmit={createTransactionForm.handleSubmit(handleCreateTransactionSubmit)} className="space-y-4">
                    <FormField
                      control={createTransactionForm.control}
                      name="bankAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Account</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-transaction-account">
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeBankAccounts.map((account: any) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name} - {account.bankName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createTransactionForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Date</FormLabel>
                          <FormControl>
                            <Input type="date" data-testid="input-transaction-date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createTransactionForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-transaction-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="credit">Credit</SelectItem>
                                <SelectItem value="debit">Debit</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createTransactionForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" inputMode="decimal" data-testid="input-transaction-amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createTransactionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Transaction description" data-testid="input-transaction-description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createTransactionForm.control}
                      name="balance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Running Balance</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" inputMode="decimal" data-testid="input-running-balance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createTransactionForm.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Transaction reference" data-testid="input-transaction-reference" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateTransactionOpen(false)}
                        data-testid="button-cancel-create-transaction"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTransactionMutation.isPending}
                        data-testid="button-submit-create-transaction"
                        className="flex-1"
                      >
                        {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Bank Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by recording your first bank transaction.
                  </p>
                  <Button onClick={() => setIsCreateTransactionOpen(true)} data-testid="button-add-first-transaction">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: BankTransaction & { bankAccount?: any }) => (
                      <TableRow key={transaction.id}>
                        <TableCell data-testid={`text-date-${transaction.id}`}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-light">
                            {transaction.bankAccount?.name || 'Unknown Account'}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-description-${transaction.id}`}>
                          <div>
                            <div className="font-light">{transaction.description}</div>
                            {transaction.reference && (
                              <div className="text-sm text-muted-foreground">
                                Ref: {transaction.reference}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={transactionTypeStyles[transaction.type as keyof typeof transactionTypeStyles]}
                            data-testid={`badge-type-${transaction.id}`}
                          >
                            {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`text-right font-light ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`} data-testid={`text-amount-${transaction.id}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-right font-light" data-testid={`text-balance-${transaction.id}`}>
                            ₹{parseFloat(transaction.balance).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTransaction(transaction)}
                              data-testid={`button-edit-transaction-${transaction.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTransactionClick(transaction)}
                              data-testid={`button-delete-transaction-${transaction.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Account Dialog */}
      <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>
              Update the bank account details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editAccountForm}>
            <form onSubmit={editAccountForm.handleSubmit(handleEditAccountSubmit)} className="space-y-4">
              {/* Form fields similar to create form but with editAccountForm */}
              <FormField
                control={editAccountForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-account-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editAccountForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-bank-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editAccountForm.control}
                name="currentBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" data-testid="input-edit-current-balance" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
                <FormField
                  control={editAccountForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-edit-is-default"
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Default Account</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={editAccountForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={field.onChange}
                          data-testid="checkbox-edit-is-active"
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditAccountOpen(false)}
                  data-testid="button-cancel-edit-account"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateAccountMutation.isPending}
                  data-testid="button-submit-edit-account"
                  className="flex-1"
                >
                  {updateAccountMutation.isPending ? "Updating..." : "Update Account"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update the transaction details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editTransactionForm}>
            <form onSubmit={editTransactionForm.handleSubmit(handleEditTransactionSubmit)} className="space-y-4">
              <FormField
                control={editTransactionForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input inputMode="decimal" data-testid="input-edit-transaction-amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editTransactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-transaction-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTransactionOpen(false)}
                  data-testid="button-cancel-edit-transaction"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTransactionMutation.isPending}
                  data-testid="button-submit-edit-transaction"
                  className="flex-1"
                >
                  {updateTransactionMutation.isPending ? "Updating..." : "Update Transaction"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Account Dialog */}
      <Dialog open={isViewAccountOpen} onOpenChange={setIsViewAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected bank account.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-light text-muted-foreground">Account Name</Label>
                  <div data-testid="view-account-name">{selectedAccount.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">Bank Name</Label>
                  <div data-testid="view-bank-name">{selectedAccount.bankName}</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">Account Number</Label>
                  <div data-testid="view-account-number">****{selectedAccount.accountNumberMasked}</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">IFSC Code</Label>
                  <div data-testid="view-ifsc">{selectedAccount.ifsc}</div>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">Current Balance</Label>
                  <div className="text-lg font-semibold" data-testid="view-current-balance">
                    ₹{parseFloat(selectedAccount.currentBalance).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-light text-muted-foreground">Status</Label>
                  <div>
                    <Badge 
                      variant="secondary"
                      className={accountStatusStyles[selectedAccount.isActive ? 'active' : 'inactive']}
                      data-testid="view-account-status"
                    >
                      {selectedAccount.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedAccount.isDefault && (
                      <Badge variant="secondary" className="ml-2">Default</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setIsViewAccountOpen(false)} 
                className="w-full"
                data-testid="button-close-view-account"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteAccountOpen} onOpenChange={setIsDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{accountToDelete?.name}"? This action cannot be undone and will affect all associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-account">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccountConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-account"
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Transaction Confirmation */}
      <AlertDialog open={isDeleteTransactionOpen} onOpenChange={setIsDeleteTransactionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone and may affect account balances.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-transaction">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransactionConfirm}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete-transaction"
            >
              {deleteTransactionMutation.isPending ? "Deleting..." : "Delete Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}