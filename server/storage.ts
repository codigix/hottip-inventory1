import { 
  users, products, customers, orders, orderItems, suppliers, 
  purchaseOrders, shipments, tasks, attendance, activityLog,
  outboundQuotations, quotationItems, inboundQuotations, inboundQuotationItems,
  invoices, invoiceItems, stockTransactions, spareParts, batches, barcodes,
  vendorCommunications, reorderPoints, fabricationOrders, inventoryTasks,
  // Accounts entities
  accountsReceivables, accountsPayables, payments, bankAccounts, bankTransactions,
  gstReturns, accountReminders, accountTasks, accountReports,
  // Marketing entities
  leads, fieldVisits, marketingTasks, marketingAttendance,
  // Logistics entities
  logisticsShipments, logisticsStatusUpdates, logisticsCheckpoints,
  type User, type InsertUser, type Product, type InsertProduct,
  type Customer, type InsertCustomer, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Supplier, type InsertSupplier,
  type Shipment, type InsertShipment, type Task, type InsertTask,
  type Attendance, type InsertAttendance, type ActivityLog,
  type OutboundQuotation, type InsertOutboundQuotation,
  type QuotationItem, type InsertQuotationItem,
  type InboundQuotation, type InsertInboundQuotation,
  type InboundQuotationItem, type InsertInboundQuotationItem,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type StockTransaction, type InsertStockTransaction, type SparePart, type InsertSparePart,
  type Batch, type InsertBatch, type Barcode, type InsertBarcode,
  type VendorCommunication, type InsertVendorCommunication, type ReorderPoint, type InsertReorderPoint,
  type FabricationOrder, type InsertFabricationOrder, type InventoryTask, type InsertInventoryTask,
  // Accounts types
  type AccountsReceivable, type InsertAccountsReceivable, type AccountsPayable, type InsertAccountsPayable,
  type Payment, type InsertPayment, type BankAccount, type InsertBankAccount,
  type BankTransaction, type InsertBankTransaction, type GstReturn, type InsertGstReturn,
  type AccountReminder, type InsertAccountReminder, type AccountTask, type InsertAccountTask,
  type AccountReport, type InsertAccountReport,
  // Marketing types
  type Lead, type InsertLead, type FieldVisit, type InsertFieldVisit,
  type MarketingTask, type InsertMarketingTask, type MarketingAttendance, type InsertMarketingAttendance,
  // Logistics types
  type LogisticsShipment, type InsertLogisticsShipment, type LogisticsStatusUpdate, type InsertLogisticsStatusUpdate,
  type LogisticsCheckpoint, type InsertLogisticsCheckpoint,
  // Logistics interfaces
  type LogisticsStatusData, type LogisticsPodData, type LogisticsShipmentTimeline,
  type LogisticsDashboardMetrics, type LogisticsDeliveryMetrics, type LogisticsVendorPerformance,
  type LogisticsShipmentVolumeMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, like, count, sum, sql, avg, isNotNull, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUsers(): Promise<User[]>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Orders
  getOrder(id: string): Promise<any>;
  getOrders(): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  getOrdersByCustomer(customerId: string): Promise<any[]>;

  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<any[]>;
  deleteOrderItems(orderId: string): Promise<void>;

  // Suppliers
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Shipments
  getShipment(id: string): Promise<any>;
  getShipments(): Promise<any[]>;
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  updateShipment(id: string, shipment: Partial<InsertShipment>): Promise<Shipment>;
  deleteShipment(id: string): Promise<void>;

  // Tasks
  getTask(id: string): Promise<any>;
  getTasks(): Promise<any[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getTasksByUser(userId: string): Promise<any[]>;

  // Attendance
  getAttendance(userId: string, date: Date): Promise<Attendance | undefined>;
  getAttendanceByUser(userId: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<InsertAttendance>): Promise<Attendance>;
  deleteAttendance(id: string): Promise<void>;
  getAccountsAttendance(filters: any): Promise<any[]>;
  getAccountsAttendanceByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  getAccountsAttendanceSummary(period: string): Promise<any>;
  getUserAttendanceHistory(filters: any): Promise<any[]>;
  getAttendanceMetrics(): Promise<any>;
  getAllAttendanceWithUsers(filters?: any): Promise<any[]>;

  // Activity Log
  createActivity(activity: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog>;
  getRecentActivities(limit?: number): Promise<any[]>;

  // Analytics/Dashboard
  getDashboardMetrics(): Promise<any>;

  // Outbound Quotations (Company → Clients)
  getOutboundQuotation(id: string): Promise<any>;
  getOutboundQuotations(): Promise<any[]>;
  createOutboundQuotation(quotation: InsertOutboundQuotation): Promise<OutboundQuotation>;
  updateOutboundQuotation(id: string, quotation: Partial<InsertOutboundQuotation>): Promise<OutboundQuotation>;
  deleteOutboundQuotation(id: string): Promise<void>;
  getOutboundQuotationsByStatus(status: string): Promise<any[]>;
  convertQuotationToInvoice(quotationId: string): Promise<Invoice>;

  // Quotation Items
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  getQuotationItems(quotationId: string): Promise<any[]>;
  deleteQuotationItems(quotationId: string): Promise<void>;
  updateQuotationItem(id: string, item: Partial<InsertQuotationItem>): Promise<QuotationItem>;

  // Inbound Quotations (Clients/Vendors → Company)
  getInboundQuotation(id: string): Promise<any>;
  getInboundQuotations(): Promise<any[]>;
  createInboundQuotation(quotation: InsertInboundQuotation): Promise<InboundQuotation>;
  updateInboundQuotation(id: string, quotation: Partial<InsertInboundQuotation>): Promise<InboundQuotation>;
  deleteInboundQuotation(id: string): Promise<void>;
  getInboundQuotationsByStatus(status: string): Promise<any[]>;

  // Inbound Quotation Items
  createInboundQuotationItem(item: InsertInboundQuotationItem): Promise<InboundQuotationItem>;
  getInboundQuotationItems(quotationId: string): Promise<any[]>;
  deleteInboundQuotationItems(quotationId: string): Promise<void>;

  // Invoices
  getInvoice(id: string): Promise<any>;
  getInvoices(): Promise<any[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  getInvoicesByStatus(status: string): Promise<any[]>;
  getInvoicesByCustomer(customerId: string): Promise<any[]>;

  // Invoice Items
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: string): Promise<any[]>;
  deleteInvoiceItems(invoiceId: string): Promise<void>;
  updateInvoiceItem(id: string, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;

  // Stock Transactions
  getStockTransaction(id: string): Promise<any>;
  getStockTransactions(): Promise<any[]>;
  createStockTransaction(transaction: InsertStockTransaction): Promise<StockTransaction>;
  updateStockTransaction(id: string, transaction: Partial<InsertStockTransaction>): Promise<StockTransaction>;
  deleteStockTransaction(id: string): Promise<void>;
  getStockTransactionsByProduct(productId: string): Promise<any[]>;
  getStockTransactionsByType(type: string): Promise<any[]>;

  // Spare Parts
  getSparePart(id: string): Promise<SparePart | undefined>;
  getSpareParts(): Promise<SparePart[]>;
  createSparePart(sparePart: InsertSparePart): Promise<SparePart>;
  updateSparePart(id: string, sparePart: Partial<InsertSparePart>): Promise<SparePart>;
  deleteSparePart(id: string): Promise<void>;
  getSparePartsByStatus(status: string): Promise<SparePart[]>;
  getLowStockSpareParts(): Promise<SparePart[]>;

  // Batches
  getBatch(id: string): Promise<any>;
  getBatches(): Promise<any[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: string, batch: Partial<InsertBatch>): Promise<Batch>;
  deleteBatch(id: string): Promise<void>;
  getBatchesByProduct(productId: string): Promise<any[]>;
  getBatchesByQualityStatus(status: string): Promise<any[]>;

  // Barcodes
  getBarcode(id: string): Promise<Barcode | undefined>;
  getBarcodes(): Promise<Barcode[]>;
  createBarcode(barcode: InsertBarcode): Promise<Barcode>;
  updateBarcode(id: string, barcode: Partial<InsertBarcode>): Promise<Barcode>;
  deleteBarcode(id: string): Promise<void>;
  getBarcodeByCode(code: string): Promise<Barcode | undefined>;
  getBarcodesByEntityType(entityType: string): Promise<Barcode[]>;

  // Fabrication Orders
  getFabricationOrder(id: string): Promise<any>;
  getFabricationOrders(): Promise<any[]>;
  createFabricationOrder(order: InsertFabricationOrder): Promise<FabricationOrder>;
  updateFabricationOrder(id: string, order: Partial<InsertFabricationOrder>): Promise<FabricationOrder>;
  deleteFabricationOrder(id: string): Promise<void>;
  getFabricationOrdersByStatus(status: string): Promise<any[]>;
  getFabricationOrdersByAssignee(assigneeId: string): Promise<any[]>;

  // Reorder Points
  getReorderPoint(id: string): Promise<ReorderPoint | undefined>;
  getReorderPoints(): Promise<ReorderPoint[]>;
  createReorderPoint(reorderPoint: InsertReorderPoint): Promise<ReorderPoint>;
  updateReorderPoint(id: string, reorderPoint: Partial<InsertReorderPoint>): Promise<ReorderPoint>;
  deleteReorderPoint(id: string): Promise<void>;
  getActiveReorderPoints(): Promise<ReorderPoint[]>;
  getTriggeredReorderPoints(): Promise<any[]>;

  // Vendor Communications
  getVendorCommunication(id: string): Promise<any>;
  getVendorCommunications(): Promise<any[]>;
  createVendorCommunication(communication: InsertVendorCommunication): Promise<VendorCommunication>;
  updateVendorCommunication(id: string, communication: Partial<InsertVendorCommunication>): Promise<VendorCommunication>;
  deleteVendorCommunication(id: string): Promise<void>;
  getVendorCommunicationsBySupplier(supplierId: string): Promise<any[]>;
  getVendorCommunicationsByStatus(status: string): Promise<any[]>;

  // Inventory Tasks
  getInventoryTask(id: string): Promise<any>;
  getInventoryTasks(): Promise<any[]>;
  createInventoryTask(task: InsertInventoryTask): Promise<InventoryTask>;
  updateInventoryTask(id: string, task: Partial<InsertInventoryTask>): Promise<InventoryTask>;
  deleteInventoryTask(id: string): Promise<void>;
  getInventoryTasksByAssignee(assigneeId: string): Promise<any[]>;
  getInventoryTasksByStatus(status: string): Promise<any[]>;
  getInventoryTasksByType(type: string): Promise<any[]>;

  // ===== ACCOUNTS MODULE METHODS =====

  // Accounts Receivables
  getAccountsReceivable(id: string): Promise<any>;
  getAccountsReceivables(): Promise<any[]>;
  createAccountsReceivable(receivable: InsertAccountsReceivable): Promise<AccountsReceivable>;
  updateAccountsReceivable(id: string, receivable: Partial<InsertAccountsReceivable>): Promise<AccountsReceivable>;
  deleteAccountsReceivable(id: string): Promise<void>;
  getAccountsReceivablesByCustomer(customerId: string): Promise<any[]>;
  getAccountsReceivablesByStatus(status: string): Promise<any[]>;
  getOverdueReceivables(): Promise<any[]>;

  // Accounts Payables
  getAccountsPayable(id: string): Promise<any>;
  getAccountsPayables(): Promise<any[]>;
  createAccountsPayable(payable: InsertAccountsPayable): Promise<AccountsPayable>;
  updateAccountsPayable(id: string, payable: Partial<InsertAccountsPayable>): Promise<AccountsPayable>;
  deleteAccountsPayable(id: string): Promise<void>;
  getAccountsPayablesBySupplier(supplierId: string): Promise<any[]>;
  getAccountsPayablesByStatus(status: string): Promise<any[]>;
  getOverduePayables(): Promise<any[]>;

  // Payments
  getPayment(id: string): Promise<any>;
  getPayments(): Promise<any[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
  getPaymentsByKind(kind: string): Promise<any[]>;
  getPaymentsByMethod(method: string): Promise<any[]>;
  getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<any[]>;

  // Bank Accounts
  getBankAccount(id: string): Promise<any>;
  getBankAccounts(): Promise<any[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: string, account: Partial<InsertBankAccount>): Promise<BankAccount>;
  deleteBankAccount(id: string): Promise<void>;
  getDefaultBankAccount(): Promise<BankAccount | undefined>;
  getActiveBankAccounts(): Promise<any[]>;

  // Bank Transactions
  getBankTransaction(id: string): Promise<any>;
  getBankTransactions(): Promise<any[]>;
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  updateBankTransaction(id: string, transaction: Partial<InsertBankTransaction>): Promise<BankTransaction>;
  deleteBankTransaction(id: string): Promise<void>;
  getBankTransactionsByAccount(bankAccountId: string): Promise<any[]>;
  getBankTransactionsByDateRange(bankAccountId: string, startDate: Date, endDate: Date): Promise<any[]>;

  // GST Returns
  getGstReturn(id: string): Promise<any>;
  getGstReturns(): Promise<any[]>;
  createGstReturn(gstReturn: InsertGstReturn): Promise<GstReturn>;
  updateGstReturn(id: string, gstReturn: Partial<InsertGstReturn>): Promise<GstReturn>;
  deleteGstReturn(id: string): Promise<void>;
  getGstReturnsByStatus(status: string): Promise<any[]>;
  getGstReturnsByPeriod(startDate: Date, endDate: Date): Promise<any[]>;

  // Account Reminders
  getAccountReminder(id: string): Promise<any>;
  getAccountReminders(): Promise<any[]>;
  createAccountReminder(reminder: InsertAccountReminder): Promise<AccountReminder>;
  updateAccountReminder(id: string, reminder: Partial<InsertAccountReminder>): Promise<AccountReminder>;
  deleteAccountReminder(id: string): Promise<void>;
  getPendingReminders(): Promise<any[]>;
  getRemindersByTargetType(targetType: string): Promise<any[]>;

  // Account Tasks
  getAccountTask(id: string): Promise<any>;
  getAccountTasks(): Promise<any[]>;
  createAccountTask(task: InsertAccountTask): Promise<AccountTask>;
  updateAccountTask(id: string, task: Partial<InsertAccountTask>): Promise<AccountTask>;
  deleteAccountTask(id: string): Promise<void>;
  getAccountTasksByAssignee(assigneeId: string): Promise<any[]>;
  getAccountTasksByStatus(status: string): Promise<any[]>;
  getAccountTasksByType(type: string): Promise<any[]>;

  // Accounts Analytics
  getAccountsDashboardMetrics(): Promise<any>;
  getTotalReceivablesAmount(): Promise<number>;
  getTotalPayablesAmount(): Promise<number>;
  getCashFlowSummary(): Promise<any>;

  // Account Reports
  getAccountReport(id: string): Promise<any>;
  getAccountReports(): Promise<any[]>;
  createAccountReport(report: InsertAccountReport): Promise<AccountReport>;
  updateAccountReport(id: string, report: Partial<InsertAccountReport>): Promise<AccountReport>;
  deleteAccountReport(id: string): Promise<void>;
  getReportsByType(type: string): Promise<any[]>;
  getReportsByStatus(status: string): Promise<any[]>;
  exportReport(id: string, format: string): Promise<{ url: string; fileName: string }>;
  incrementReportDownload(id: string): Promise<void>;

  // ===== MARKETING MODULE METHODS =====

  // Leads
  getLead(id: string): Promise<any>;
  getLeads(): Promise<any[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  getLeadsByStatus(status: string): Promise<any[]>;
  getLeadsByAssignedEmployee(userId: string): Promise<any[]>;
  getLeadsBySource(source: string): Promise<any[]>;
  getLeadsByPriority(priority: string): Promise<any[]>;
  updateLeadStatus(id: string, status: string): Promise<Lead>;
  convertLeadToCustomer(leadId: string): Promise<Customer>;
  getLeadsConversionMetrics(): Promise<any>;
  searchLeads(query: string): Promise<any[]>;
  getLeadsByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  getActiveLeads(): Promise<any[]>;

  // Field Visits
  getFieldVisit(id: string): Promise<any>;
  getFieldVisits(): Promise<any[]>;
  createFieldVisit(visit: InsertFieldVisit): Promise<FieldVisit>;
  updateFieldVisit(id: string, visit: Partial<InsertFieldVisit>): Promise<FieldVisit>;
  deleteFieldVisit(id: string): Promise<void>;
  getFieldVisitsByEmployee(userId: string): Promise<any[]>;
  getFieldVisitsByLead(leadId: string): Promise<any[]>;
  getFieldVisitsByStatus(status: string): Promise<any[]>;
  getFieldVisitsByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  updateVisitStatus(id: string, status: string): Promise<FieldVisit>;
  getTodayFieldVisits(): Promise<any[]>;
  getUpcomingFieldVisits(): Promise<any[]>;
  getVisitMetrics(): Promise<any>;
  checkInFieldVisit(id: string, checkInData: any): Promise<FieldVisit>;
  checkOutFieldVisit(id: string, checkOutData: any): Promise<FieldVisit>;

  // Marketing Tasks
  getMarketingTask(id: string): Promise<any>;
  getMarketingTasks(): Promise<any[]>;
  createMarketingTask(task: InsertMarketingTask): Promise<MarketingTask>;
  updateMarketingTask(id: string, task: Partial<InsertMarketingTask>): Promise<MarketingTask>;
  deleteMarketingTask(id: string): Promise<void>;
  getMarketingTasksByEmployee(userId: string): Promise<any[]>;
  getMarketingTasksByStatus(status: string): Promise<any[]>;
  getMarketingTasksByType(type: string): Promise<any[]>;
  getMarketingTasksByPriority(priority: string): Promise<any[]>;
  getMarketingTasksByLead(leadId: string): Promise<any[]>;
  updateTaskStatus(id: string, status: string): Promise<MarketingTask>;
  getTodayMarketingTasks(): Promise<any[]>;
  getOverdueMarketingTasks(): Promise<any[]>;
  getTaskMetrics(): Promise<any>;
  completeMarketingTask(id: string, completionData: any): Promise<MarketingTask>;

  // Marketing Attendance
  getMarketingAttendance(id: string): Promise<any>;
  getMarketingAttendances(): Promise<any[]>;
  createMarketingAttendance(attendance: InsertMarketingAttendance): Promise<MarketingAttendance>;
  updateMarketingAttendance(id: string, attendance: Partial<InsertMarketingAttendance>): Promise<MarketingAttendance>;
  deleteMarketingAttendance(id: string): Promise<void>;
  getMarketingAttendanceByEmployee(userId: string): Promise<any[]>;
  getMarketingAttendanceByDate(date: Date): Promise<any[]>;
  getMarketingAttendanceByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  getTodayMarketingAttendance(): Promise<any[]>;
  checkInMarketingAttendance(userId: string, checkInData: any): Promise<MarketingAttendance>;
  checkOutMarketingAttendance(userId: string, checkOutData: any): Promise<MarketingAttendance>;
  getMarketingAttendanceMetrics(): Promise<any>;
  getEmployeeAttendanceHistory(userId: string, filters: any): Promise<any[]>;
  updateAttendanceStatus(id: string, status: string): Promise<MarketingAttendance>;
  getMarketingTeamAttendanceSummary(): Promise<any>;

  // Marketing Analytics
  getMarketingDashboardMetrics(): Promise<any>;
  getLeadConversionRates(): Promise<any>;
  getMarketingTeamPerformance(): Promise<any>;
  getVisitSuccessRates(): Promise<any>;

  // ===== LOGISTICS MODULE =====
  
  // Logistics Shipments
  getLogisticsShipment(id: string): Promise<LogisticsShipment | undefined>;
  getLogisticsShipments(): Promise<LogisticsShipment[]>;
  createLogisticsShipment(shipment: InsertLogisticsShipment): Promise<LogisticsShipment>;
  updateLogisticsShipment(id: string, shipment: Partial<InsertLogisticsShipment>): Promise<LogisticsShipment>;
  deleteLogisticsShipment(id: string): Promise<void>;
  getLogisticsShipmentsByStatus(status: string): Promise<LogisticsShipment[]>;
  getLogisticsShipmentsByEmployee(userId: string): Promise<LogisticsShipment[]>;
  getLogisticsShipmentsByClient(clientId: string): Promise<LogisticsShipment[]>;
  getLogisticsShipmentsByVendor(vendorId: string): Promise<LogisticsShipment[]>;
  getLogisticsShipmentsByDateRange(startDate: Date, endDate: Date): Promise<LogisticsShipment[]>;
  updateShipmentStatus(id: string, statusData: LogisticsStatusData): Promise<LogisticsShipment>;
  getShipmentTimeline(id: string): Promise<LogisticsShipmentTimeline[]>;
  getActiveShipments(): Promise<LogisticsShipment[]>;
  getOverdueShipments(): Promise<LogisticsShipment[]>;
  closeShipment(id: string, podData: LogisticsPodData): Promise<LogisticsShipment>;
  searchShipments(query: string): Promise<LogisticsShipment[]>;

  // Logistics Status Updates
  getLogisticsStatusUpdate(id: string): Promise<LogisticsStatusUpdate | undefined>;
  getLogisticsStatusUpdates(): Promise<LogisticsStatusUpdate[]>;
  createLogisticsStatusUpdate(update: InsertLogisticsStatusUpdate): Promise<LogisticsStatusUpdate>;
  updateLogisticsStatusUpdate(id: string, update: Partial<InsertLogisticsStatusUpdate>): Promise<LogisticsStatusUpdate>;
  deleteLogisticsStatusUpdate(id: string): Promise<void>;
  getStatusUpdatesByShipment(shipmentId: string): Promise<LogisticsStatusUpdate[]>;
  getStatusUpdatesByEmployee(userId: string): Promise<LogisticsStatusUpdate[]>;
  getStatusUpdatesByDateRange(startDate: Date, endDate: Date): Promise<LogisticsStatusUpdate[]>;

  // Logistics Checkpoints
  getLogisticsCheckpoint(id: string): Promise<LogisticsCheckpoint | undefined>;
  getLogisticsCheckpoints(): Promise<LogisticsCheckpoint[]>;
  createLogisticsCheckpoint(checkpoint: InsertLogisticsCheckpoint): Promise<LogisticsCheckpoint>;
  updateLogisticsCheckpoint(id: string, checkpoint: Partial<InsertLogisticsCheckpoint>): Promise<LogisticsCheckpoint>;
  deleteLogisticsCheckpoint(id: string): Promise<void>;
  getCheckpointsByShipment(shipmentId: string): Promise<LogisticsCheckpoint[]>;
  getCheckpointsByEmployee(userId: string): Promise<LogisticsCheckpoint[]>;
  getCheckpointsByDateRange(startDate: Date, endDate: Date): Promise<LogisticsCheckpoint[]>;

  // Logistics Reports & Analytics
  getLogisticsDashboardMetrics(): Promise<LogisticsDashboardMetrics>;
  getDailyShipmentsReport(date: Date): Promise<{ date: string; shipments: LogisticsShipment[]; count: number }>;
  getAverageDeliveryTime(dateRange?: { start: Date; end: Date }): Promise<{ averageDays: number; totalShipments: number }>;
  getVendorPerformanceReport(vendorId?: string): Promise<LogisticsVendorPerformance[]>;
  getShipmentVolumeMetrics(): Promise<LogisticsShipmentVolumeMetrics>;
  getDeliveryPerformanceMetrics(): Promise<LogisticsDeliveryMetrics>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...updateProduct, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.name} ILIKE ${`%${query}%`} OR ${products.sku} ILIKE ${`%${query}%`}`
      );
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updateCustomer: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updateCustomer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Orders
  async getOrder(id: string): Promise<any> {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        taxAmount: orders.taxAmount,
        discountAmount: orders.discountAmount,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id));
    
    return order || undefined;
  }

  async getOrders(): Promise<any[]> {
    return await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderNumber = `ORD-${Date.now()}`;
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();
    return order;
  }

  async updateOrder(id: string, updateOrder: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ ...updateOrder, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async deleteOrder(id: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrdersByCustomer(customerId: string): Promise<any[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  // Order Items
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertOrderItem).returning();
    return item;
  }

  async getOrderItems(orderId: string): Promise<any[]> {
    return await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
          price: products.price,
        },
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async deleteOrderItems(orderId: string): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Suppliers
  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier || undefined;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(insertSupplier).returning();
    return supplier;
  }

  async updateSupplier(id: string, updateSupplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db
      .update(suppliers)
      .set({ ...updateSupplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return supplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  // Shipments
  async getShipment(id: string): Promise<any> {
    const [shipment] = await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        trackingNumber: shipments.trackingNumber,
        carrier: shipments.carrier,
        status: shipments.status,
        shippingAddress: shipments.shippingAddress,
        estimatedDelivery: shipments.estimatedDelivery,
        actualDelivery: shipments.actualDelivery,
        notes: shipments.notes,
        createdAt: shipments.createdAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
        },
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .where(eq(shipments.id, id));
    
    return shipment || undefined;
  }

  async getShipments(): Promise<any[]> {
    return await db
      .select({
        id: shipments.id,
        shipmentNumber: shipments.shipmentNumber,
        trackingNumber: shipments.trackingNumber,
        carrier: shipments.carrier,
        status: shipments.status,
        estimatedDelivery: shipments.estimatedDelivery,
        createdAt: shipments.createdAt,
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
        },
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .orderBy(desc(shipments.createdAt));
  }

  async createShipment(insertShipment: InsertShipment): Promise<Shipment> {
    const shipmentNumber = `SH-${Date.now()}`;
    const [shipment] = await db
      .insert(shipments)
      .values({ ...insertShipment, shipmentNumber })
      .returning();
    return shipment;
  }

  async updateShipment(id: string, updateShipment: Partial<InsertShipment>): Promise<Shipment> {
    const [shipment] = await db
      .update(shipments)
      .set({ ...updateShipment, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return shipment;
  }

  async deleteShipment(id: string): Promise<void> {
    await db.delete(shipments).where(eq(shipments.id, id));
  }

  // Tasks
  async getTask(id: string): Promise<any> {
    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        assignee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        assigner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .where(eq(tasks.id, id));
    
    return task || undefined;
  }

  async getTasks(): Promise<any[]> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        assignee: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assignedTo, users.id))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: string, updateTask: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...updateTask, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTasksByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  // Attendance
  async getAttendance(userId: string, date: Date): Promise<Attendance | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [record] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay)
        )
      );
    
    return record || undefined;
  }

  async getAttendanceByUser(userId: string): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(insertAttendance).returning();
    return record;
  }

  async updateAttendance(id: string, updateAttendance: Partial<InsertAttendance>): Promise<Attendance> {
    const [record] = await db
      .update(attendance)
      .set(updateAttendance)
      .where(eq(attendance.id, id))
      .returning();
    return record;
  }

  async deleteAttendance(id: string): Promise<void> {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  async getAccountsAttendance(filters: any): Promise<any[]> {
    const conditions = [];
    
    if (filters.startDate) {
      conditions.push(gte(attendance.date, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(attendance.date, filters.endDate));
    }
    if (filters.department) {
      conditions.push(eq(users.department, filters.department));
    }

    const query = db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        location: attendance.location,
        status: attendance.status,
        notes: attendance.notes,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          department: users.department,
        },
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id));

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(attendance.date));
    }

    return await query.orderBy(desc(attendance.date));
  }

  async getAccountsAttendanceByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        location: attendance.location,
        status: attendance.status,
        notes: attendance.notes,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          department: users.department,
        },
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(
        and(
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      )
      .orderBy(desc(attendance.date));
  }

  async getAccountsAttendanceSummary(period: string): Promise<any> {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const totalAttendance = await db
      .select({ count: count() })
      .from(attendance)
      .where(gte(attendance.date, startDate));

    const presentCount = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startDate),
          eq(attendance.status, 'present')
        )
      );

    const lateCount = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startDate),
          eq(attendance.status, 'late')
        )
      );

    const absentCount = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, startDate),
          eq(attendance.status, 'absent')
        )
      );

    const totalEmployees = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      period,
      totalAttendance: totalAttendance[0]?.count || 0,
      presentCount: presentCount[0]?.count || 0,
      lateCount: lateCount[0]?.count || 0,
      absentCount: absentCount[0]?.count || 0,
      totalEmployees: totalEmployees[0]?.count || 0,
      attendanceRate: totalEmployees[0]?.count && totalAttendance[0]?.count ? 
        ((presentCount[0]?.count || 0) / (totalAttendance[0]?.count) * 100) : 0,
    };
  }

  async getUserAttendanceHistory(filters: any): Promise<any[]> {
    let query = db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        location: attendance.location,
        status: attendance.status,
        notes: attendance.notes,
      })
      .from(attendance);

    const conditions = [eq(attendance.userId, filters.userId)];
    
    if (filters.startDate) {
      conditions.push(gte(attendance.date, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(attendance.date, filters.endDate));
    }

    return await query
      .where(and(...conditions))
      .orderBy(desc(attendance.date));
  }

  async getAttendanceMetrics(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's attendance
    const todayAttendance = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, today),
          lt(attendance.date, tomorrow)
        )
      );

    const todayPresent = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, today),
          lt(attendance.date, tomorrow),
          eq(attendance.status, 'present')
        )
      );

    const todayLate = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, today),
          lt(attendance.date, tomorrow),
          eq(attendance.status, 'late')
        )
      );

    // This week's late arrivals
    const weekLateArrivals = await db
      .select({ count: count() })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, thisWeekStart),
          eq(attendance.status, 'late')
        )
      );

    // Average working hours calculation
    const avgHoursResult = await db
      .select({
        avgMinutes: avg(
          sql`EXTRACT(EPOCH FROM (${attendance.checkOut} - ${attendance.checkIn})) / 60`
        ),
      })
      .from(attendance)
      .where(
        and(
          gte(attendance.date, thisMonth),
          isNotNull(attendance.checkIn),
          isNotNull(attendance.checkOut)
        )
      );

    const totalActiveEmployees = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    const avgHours = avgHoursResult[0]?.avgMinutes ? 
      Math.round((parseFloat(avgHoursResult[0].avgMinutes) / 60) * 10) / 10 : 0;

    return {
      teamSize: totalActiveEmployees[0]?.count || 0,
      presentToday: todayPresent[0]?.count || 0,
      attendanceRate: totalActiveEmployees[0]?.count ? 
        ((todayPresent[0]?.count || 0) / (totalActiveEmployees[0]?.count) * 100) : 0,
      avgHours: avgHours,
      lateArrivalsThisWeek: weekLateArrivals[0]?.count || 0,
      todayTotal: todayAttendance[0]?.count || 0,
      todayLate: todayLate[0]?.count || 0,
    };
  }

  async getAllAttendanceWithUsers(filters?: any): Promise<any[]> {
    const conditions = [eq(users.isActive, true)]; // Always filter for active users
    
    if (filters?.employeeId) {
      conditions.push(eq(attendance.userId, filters.employeeId));
    }
    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(gte(attendance.date, startOfDay));
      conditions.push(lte(attendance.date, endOfDay));
    }
    if (filters?.department) {
      conditions.push(eq(users.department, filters.department));
    }

    const query = db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        location: attendance.location,
        status: attendance.status,
        notes: attendance.notes,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          department: users.department,
        },
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    return await query;
  }

  // Activity Log
  async createActivity(activity: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const [log] = await db.insert(activityLog).values(activity).returning();
    return log;
  }

  async getRecentActivities(limit: number = 20): Promise<any[]> {
    return await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        details: activityLog.details,
        createdAt: activityLog.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  // Dashboard Analytics
  async getDashboardMetrics(): Promise<any> {
    const totalRevenue = await db
      .select({ sum: sum(orders.totalAmount) })
      .from(orders)
      .where(eq(orders.status, 'delivered'));

    const activeOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(sql`${orders.status} IN ('pending', 'processing', 'shipped')`);

    const lowStockCount = await db
      .select({ count: count() })
      .from(products)
      .where(sql`${products.stock} <= ${products.lowStockThreshold}`);

    const totalEmployees = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      totalRevenue: totalRevenue[0]?.sum || 0,
      activeOrders: activeOrders[0]?.count || 0,
      lowStockItems: lowStockCount[0]?.count || 0,
      totalEmployees: totalEmployees[0]?.count || 0,
    };
  }

  // Outbound Quotations (Company → Clients)
  async getOutboundQuotation(id: string): Promise<any> {
    const [quotation] = await db
      .select()
      .from(outboundQuotations)
      .leftJoin(customers, eq(outboundQuotations.customerId, customers.id))
      .leftJoin(users, eq(outboundQuotations.userId, users.id))
      .where(eq(outboundQuotations.id, id));
    
    if (!quotation) return undefined;

    const items = await this.getQuotationItems(id);
    return {
      ...quotation.outbound_quotations,
      customer: quotation.customers,
      user: quotation.users,
      items
    };
  }

  async getOutboundQuotations(): Promise<any[]> {
    const quotations = await db
      .select()
      .from(outboundQuotations)
      .leftJoin(customers, eq(outboundQuotations.customerId, customers.id))
      .leftJoin(users, eq(outboundQuotations.userId, users.id))
      .orderBy(desc(outboundQuotations.createdAt));

    return quotations.map(q => ({
      ...q.outbound_quotations,
      customer: q.customers,
      user: q.users
    }));
  }

  async createOutboundQuotation(insertQuotation: InsertOutboundQuotation): Promise<OutboundQuotation> {
    const [quotation] = await db.insert(outboundQuotations).values(insertQuotation).returning();
    return quotation;
  }

  async updateOutboundQuotation(id: string, updateQuotation: Partial<InsertOutboundQuotation>): Promise<OutboundQuotation> {
    const [quotation] = await db
      .update(outboundQuotations)
      .set({ ...updateQuotation, updatedAt: new Date() })
      .where(eq(outboundQuotations.id, id))
      .returning();
    return quotation;
  }

  async deleteOutboundQuotation(id: string): Promise<void> {
    await this.deleteQuotationItems(id);
    await db.delete(outboundQuotations).where(eq(outboundQuotations.id, id));
  }

  async getOutboundQuotationsByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(outboundQuotations)
      .leftJoin(customers, eq(outboundQuotations.customerId, customers.id))
      .where(eq(outboundQuotations.status, status as any))
      .orderBy(desc(outboundQuotations.createdAt));
  }

  async convertQuotationToInvoice(quotationId: string): Promise<Invoice> {
    const quotation = await this.getOutboundQuotation(quotationId);
    if (!quotation) throw new Error('Quotation not found');
    
    // Generate invoice number
    const invoiceCount = await db.select({ count: count() }).from(invoices);
    const invoiceNumber = `INV${String(invoiceCount[0].count + 1).padStart(6, '0')}`;
    
    // Create invoice from quotation
    const invoiceData: InsertInvoice = {
      invoiceNumber,
      quotationId,
      customerId: quotation.customerId,
      userId: quotation.userId,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      subtotalAmount: quotation.subtotalAmount,
      totalAmount: quotation.totalAmount,
      balanceAmount: quotation.totalAmount,
      paymentTerms: quotation.paymentTerms,
      bankName: quotation.bankName,
      accountNumber: quotation.accountNumber,
      ifscCode: quotation.ifscCode
    };

    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    
    // Copy quotation items to invoice items
    const quotationItems = await this.getQuotationItems(quotationId);
    for (const item of quotationItems) {
      await this.createInvoiceItem({
        invoiceId: invoice.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        hsnSacCode: item.hsnSacCode,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount
      });
    }

    // Update quotation status to approved
    await this.updateOutboundQuotation(quotationId, { status: 'approved' });

    return invoice;
  }

  // Quotation Items
  async createQuotationItem(insertItem: InsertQuotationItem): Promise<QuotationItem> {
    const [item] = await db.insert(quotationItems).values(insertItem).returning();
    return item;
  }

  async getQuotationItems(quotationId: string): Promise<any[]> {
    return await db
      .select()
      .from(quotationItems)
      .leftJoin(products, eq(quotationItems.productId, products.id))
      .where(eq(quotationItems.quotationId, quotationId));
  }

  async deleteQuotationItems(quotationId: string): Promise<void> {
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, quotationId));
  }

  async updateQuotationItem(id: string, updateItem: Partial<InsertQuotationItem>): Promise<QuotationItem> {
    const [item] = await db
      .update(quotationItems)
      .set(updateItem)
      .where(eq(quotationItems.id, id))
      .returning();
    return item;
  }

  // Inbound Quotations (Clients/Vendors → Company)
  async getInboundQuotation(id: string): Promise<any> {
    const [quotation] = await db
      .select()
      .from(inboundQuotations)
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id))
      .leftJoin(users, eq(inboundQuotations.userId, users.id))
      .where(eq(inboundQuotations.id, id));
    
    if (!quotation) return undefined;

    const items = await this.getInboundQuotationItems(id);
    return {
      ...quotation.inbound_quotations,
      sender: quotation.suppliers,
      user: quotation.users,
      items
    };
  }

  async getInboundQuotations(): Promise<any[]> {
    const quotations = await db
      .select()
      .from(inboundQuotations)
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id))
      .leftJoin(users, eq(inboundQuotations.userId, users.id))
      .orderBy(desc(inboundQuotations.createdAt));

    return quotations.map(q => ({
      ...q.inbound_quotations,
      sender: q.suppliers,
      user: q.users
    }));
  }

  async createInboundQuotation(insertQuotation: InsertInboundQuotation): Promise<InboundQuotation> {
    const [quotation] = await db.insert(inboundQuotations).values(insertQuotation).returning();
    return quotation;
  }

  async updateInboundQuotation(id: string, updateQuotation: Partial<InsertInboundQuotation>): Promise<InboundQuotation> {
    const [quotation] = await db
      .update(inboundQuotations)
      .set({ ...updateQuotation, updatedAt: new Date() })
      .where(eq(inboundQuotations.id, id))
      .returning();
    return quotation;
  }

  async deleteInboundQuotation(id: string): Promise<void> {
    await this.deleteInboundQuotationItems(id);
    await db.delete(inboundQuotations).where(eq(inboundQuotations.id, id));
  }

  async getInboundQuotationsByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(inboundQuotations)
      .leftJoin(suppliers, eq(inboundQuotations.senderId, suppliers.id))
      .where(eq(inboundQuotations.status, status as any))
      .orderBy(desc(inboundQuotations.createdAt));
  }

  // Inbound Quotation Items
  async createInboundQuotationItem(insertItem: InsertInboundQuotationItem): Promise<InboundQuotationItem> {
    const [item] = await db.insert(inboundQuotationItems).values(insertItem).returning();
    return item;
  }

  async getInboundQuotationItems(quotationId: string): Promise<any[]> {
    return await db
      .select()
      .from(inboundQuotationItems)
      .where(eq(inboundQuotationItems.quotationId, quotationId));
  }

  async deleteInboundQuotationItems(quotationId: string): Promise<void> {
    await db.delete(inboundQuotationItems).where(eq(inboundQuotationItems.quotationId, quotationId));
  }

  // Invoices
  async getInvoice(id: string): Promise<any> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .leftJoin(outboundQuotations, eq(invoices.quotationId, outboundQuotations.id))
      .where(eq(invoices.id, id));
    
    if (!invoice) return undefined;

    const items = await this.getInvoiceItems(id);
    return {
      ...invoice.invoices,
      customer: invoice.customers,
      user: invoice.users,
      quotation: invoice.outbound_quotations,
      items
    };
  }

  async getInvoices(): Promise<any[]> {
    const invoices_data = await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.createdAt));

    return invoices_data.map(inv => ({
      ...inv.invoices,
      customer: inv.customers,
      user: inv.users
    }));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();
    return invoice;
  }

  async updateInvoice(id: string, updateInvoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updateInvoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.deleteInvoiceItems(id);
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  async getInvoicesByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.status, status as any))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByCustomer(customerId: string): Promise<any[]> {
    return await db
      .select()
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.createdAt));
  }

  // Invoice Items
  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(insertItem).returning();
    return item;
  }

  async getInvoiceItems(invoiceId: string): Promise<any[]> {
    return await db
      .select()
      .from(invoiceItems)
      .leftJoin(products, eq(invoiceItems.productId, products.id))
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async updateInvoiceItem(id: string, updateItem: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [item] = await db
      .update(invoiceItems)
      .set(updateItem)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  }

  // Stock Transactions
  async getStockTransaction(id: string): Promise<any> {
    const [transaction] = await db
      .select()
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .leftJoin(batches, eq(stockTransactions.batchId, batches.id))
      .leftJoin(users, eq(stockTransactions.userId, users.id))
      .where(eq(stockTransactions.id, id));
    
    if (!transaction) return undefined;
    
    return {
      ...transaction.stock_transactions,
      product: transaction.products,
      batch: transaction.batches,
      user: transaction.users
    };
  }

  async getStockTransactions(): Promise<any[]> {
    const transactions = await db
      .select()
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .leftJoin(batches, eq(stockTransactions.batchId, batches.id))
      .leftJoin(users, eq(stockTransactions.userId, users.id))
      .orderBy(desc(stockTransactions.createdAt));

    return transactions.map(t => ({
      ...t.stock_transactions,
      product: t.products,
      batch: t.batches,
      user: t.users
    }));
  }

  async createStockTransaction(insertTransaction: InsertStockTransaction): Promise<StockTransaction> {
    const [transaction] = await db.insert(stockTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateStockTransaction(id: string, updateTransaction: Partial<InsertStockTransaction>): Promise<StockTransaction> {
    const [transaction] = await db
      .update(stockTransactions)
      .set(updateTransaction)
      .where(eq(stockTransactions.id, id))
      .returning();
    return transaction;
  }

  async deleteStockTransaction(id: string): Promise<void> {
    await db.delete(stockTransactions).where(eq(stockTransactions.id, id));
  }

  async getStockTransactionsByProduct(productId: string): Promise<any[]> {
    return await db
      .select()
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .leftJoin(users, eq(stockTransactions.userId, users.id))
      .where(eq(stockTransactions.productId, productId))
      .orderBy(desc(stockTransactions.createdAt));
  }

  async getStockTransactionsByType(type: string): Promise<any[]> {
    return await db
      .select()
      .from(stockTransactions)
      .leftJoin(products, eq(stockTransactions.productId, products.id))
      .leftJoin(users, eq(stockTransactions.userId, users.id))
      .where(eq(stockTransactions.type, type as any))
      .orderBy(desc(stockTransactions.createdAt));
  }

  // Spare Parts
  async getSparePart(id: string): Promise<SparePart | undefined> {
    const [sparePart] = await db.select().from(spareParts).where(eq(spareParts.id, id));
    return sparePart || undefined;
  }

  async getSpareParts(): Promise<SparePart[]> {
    return await db.select().from(spareParts).orderBy(desc(spareParts.createdAt));
  }

  async createSparePart(insertSparePart: InsertSparePart): Promise<SparePart> {
    const [sparePart] = await db.insert(spareParts).values(insertSparePart).returning();
    return sparePart;
  }

  async updateSparePart(id: string, updateSparePart: Partial<InsertSparePart>): Promise<SparePart> {
    const [sparePart] = await db
      .update(spareParts)
      .set({ ...updateSparePart, updatedAt: new Date() })
      .where(eq(spareParts.id, id))
      .returning();
    return sparePart;
  }

  async deleteSparePart(id: string): Promise<void> {
    await db.delete(spareParts).where(eq(spareParts.id, id));
  }

  async getSparePartsByStatus(status: string): Promise<SparePart[]> {
    return await db
      .select()
      .from(spareParts)
      .where(eq(spareParts.status, status as any))
      .orderBy(desc(spareParts.createdAt));
  }

  async getLowStockSpareParts(): Promise<SparePart[]> {
    return await db
      .select()
      .from(spareParts)
      .where(sql`${spareParts.stock} <= ${spareParts.minStock}`);
  }

  // Batches
  async getBatch(id: string): Promise<any> {
    const [batch] = await db
      .select()
      .from(batches)
      .leftJoin(products, eq(batches.productId, products.id))
      .leftJoin(spareParts, eq(batches.sparePartId, spareParts.id))
      .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
      .where(eq(batches.id, id));
    
    if (!batch) return undefined;
    
    return {
      ...batch.batches,
      product: batch.products,
      sparePart: batch.spare_parts,
      supplier: batch.suppliers
    };
  }

  async getBatches(): Promise<any[]> {
    const batches_data = await db
      .select()
      .from(batches)
      .leftJoin(products, eq(batches.productId, products.id))
      .leftJoin(spareParts, eq(batches.sparePartId, spareParts.id))
      .leftJoin(suppliers, eq(batches.supplierId, suppliers.id))
      .orderBy(desc(batches.createdAt));

    return batches_data.map(b => ({
      ...b.batches,
      product: b.products,
      sparePart: b.spare_parts,
      supplier: b.suppliers
    }));
  }

  async createBatch(insertBatch: InsertBatch): Promise<Batch> {
    const [batch] = await db.insert(batches).values(insertBatch).returning();
    return batch;
  }

  async updateBatch(id: string, updateBatch: Partial<InsertBatch>): Promise<Batch> {
    const [batch] = await db
      .update(batches)
      .set({ ...updateBatch, updatedAt: new Date() })
      .where(eq(batches.id, id))
      .returning();
    return batch;
  }

  async deleteBatch(id: string): Promise<void> {
    await db.delete(batches).where(eq(batches.id, id));
  }

  async getBatchesByProduct(productId: string): Promise<any[]> {
    return await db
      .select()
      .from(batches)
      .leftJoin(products, eq(batches.productId, products.id))
      .where(eq(batches.productId, productId))
      .orderBy(desc(batches.createdAt));
  }

  async getBatchesByQualityStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(batches)
      .leftJoin(products, eq(batches.productId, products.id))
      .where(eq(batches.qualityStatus, status))
      .orderBy(desc(batches.createdAt));
  }

  // Barcodes
  async getBarcode(id: string): Promise<Barcode | undefined> {
    const [barcode] = await db.select().from(barcodes).where(eq(barcodes.id, id));
    return barcode || undefined;
  }

  async getBarcodes(): Promise<Barcode[]> {
    return await db.select().from(barcodes).orderBy(desc(barcodes.generatedAt));
  }

  async createBarcode(insertBarcode: InsertBarcode): Promise<Barcode> {
    const [barcode] = await db.insert(barcodes).values(insertBarcode).returning();
    return barcode;
  }

  async updateBarcode(id: string, updateBarcode: Partial<InsertBarcode>): Promise<Barcode> {
    const [barcode] = await db
      .update(barcodes)
      .set(updateBarcode)
      .where(eq(barcodes.id, id))
      .returning();
    return barcode;
  }

  async deleteBarcode(id: string): Promise<void> {
    await db.delete(barcodes).where(eq(barcodes.id, id));
  }

  async getBarcodeByCode(code: string): Promise<Barcode | undefined> {
    const [barcode] = await db.select().from(barcodes).where(eq(barcodes.barcode, code));
    return barcode || undefined;
  }

  async getBarcodesByEntityType(entityType: string): Promise<Barcode[]> {
    return await db
      .select()
      .from(barcodes)
      .where(eq(barcodes.entityType, entityType))
      .orderBy(desc(barcodes.generatedAt));
  }

  // Fabrication Orders
  async getFabricationOrder(id: string): Promise<any> {
    const [order] = await db
      .select()
      .from(fabricationOrders)
      .leftJoin(spareParts, eq(fabricationOrders.sparePartId, spareParts.id))
      .leftJoin(customers, eq(fabricationOrders.customerId, customers.id))
      .leftJoin(users, eq(fabricationOrders.assignedTo, users.id))
      .where(eq(fabricationOrders.id, id));
    
    if (!order) return undefined;
    
    return {
      ...order.fabrication_orders,
      sparePart: order.spare_parts,
      customer: order.customers,
      assignedUser: order.users
    };
  }

  async getFabricationOrders(): Promise<any[]> {
    const orders = await db
      .select()
      .from(fabricationOrders)
      .leftJoin(spareParts, eq(fabricationOrders.sparePartId, spareParts.id))
      .leftJoin(customers, eq(fabricationOrders.customerId, customers.id))
      .leftJoin(users, eq(fabricationOrders.assignedTo, users.id))
      .orderBy(desc(fabricationOrders.createdAt));

    return orders.map(o => ({
      ...o.fabrication_orders,
      sparePart: o.spare_parts,
      customer: o.customers,
      assignedUser: o.users
    }));
  }

  async createFabricationOrder(insertOrder: InsertFabricationOrder): Promise<FabricationOrder> {
    const [order] = await db.insert(fabricationOrders).values(insertOrder).returning();
    return order;
  }

  async updateFabricationOrder(id: string, updateOrder: Partial<InsertFabricationOrder>): Promise<FabricationOrder> {
    const [order] = await db
      .update(fabricationOrders)
      .set({ ...updateOrder, updatedAt: new Date() })
      .where(eq(fabricationOrders.id, id))
      .returning();
    return order;
  }

  async deleteFabricationOrder(id: string): Promise<void> {
    await db.delete(fabricationOrders).where(eq(fabricationOrders.id, id));
  }

  async getFabricationOrdersByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(fabricationOrders)
      .leftJoin(spareParts, eq(fabricationOrders.sparePartId, spareParts.id))
      .where(eq(fabricationOrders.status, status as any))
      .orderBy(desc(fabricationOrders.createdAt));
  }

  async getFabricationOrdersByAssignee(assigneeId: string): Promise<any[]> {
    return await db
      .select()
      .from(fabricationOrders)
      .leftJoin(spareParts, eq(fabricationOrders.sparePartId, spareParts.id))
      .where(eq(fabricationOrders.assignedTo, assigneeId))
      .orderBy(desc(fabricationOrders.createdAt));
  }

  // Reorder Points
  async getReorderPoint(id: string): Promise<ReorderPoint | undefined> {
    const [reorderPoint] = await db.select().from(reorderPoints).where(eq(reorderPoints.id, id));
    return reorderPoint || undefined;
  }

  async getReorderPoints(): Promise<ReorderPoint[]> {
    return await db.select().from(reorderPoints).orderBy(desc(reorderPoints.createdAt));
  }

  async createReorderPoint(insertReorderPoint: InsertReorderPoint): Promise<ReorderPoint> {
    const [reorderPoint] = await db.insert(reorderPoints).values(insertReorderPoint).returning();
    return reorderPoint;
  }

  async updateReorderPoint(id: string, updateReorderPoint: Partial<InsertReorderPoint>): Promise<ReorderPoint> {
    const [reorderPoint] = await db
      .update(reorderPoints)
      .set({ ...updateReorderPoint, updatedAt: new Date() })
      .where(eq(reorderPoints.id, id))
      .returning();
    return reorderPoint;
  }

  async deleteReorderPoint(id: string): Promise<void> {
    await db.delete(reorderPoints).where(eq(reorderPoints.id, id));
  }

  async getActiveReorderPoints(): Promise<ReorderPoint[]> {
    return await db
      .select()
      .from(reorderPoints)
      .where(eq(reorderPoints.isActive, true))
      .orderBy(desc(reorderPoints.createdAt));
  }

  async getTriggeredReorderPoints(): Promise<any[]> {
    // Join with products and spare parts to check current stock levels
    const productReorders = await db
      .select()
      .from(reorderPoints)
      .leftJoin(products, eq(reorderPoints.productId, products.id))
      .where(
        and(
          eq(reorderPoints.isActive, true),
          sql`${products.stock} <= ${reorderPoints.minQuantity}`
        )
      );

    const sparePartReorders = await db
      .select()
      .from(reorderPoints)
      .leftJoin(spareParts, eq(reorderPoints.sparePartId, spareParts.id))
      .where(
        and(
          eq(reorderPoints.isActive, true),
          sql`${spareParts.stock} <= ${reorderPoints.minQuantity}`
        )
      );

    return [...productReorders, ...sparePartReorders];
  }

  // Vendor Communications
  async getVendorCommunication(id: string): Promise<any> {
    const [communication] = await db
      .select()
      .from(vendorCommunications)
      .leftJoin(suppliers, eq(vendorCommunications.supplierId, suppliers.id))
      .leftJoin(users, eq(vendorCommunications.userId, users.id))
      .where(eq(vendorCommunications.id, id));
    
    if (!communication) return undefined;
    
    return {
      ...communication.vendor_communications,
      supplier: communication.suppliers,
      user: communication.users
    };
  }

  async getVendorCommunications(): Promise<any[]> {
    const communications = await db
      .select()
      .from(vendorCommunications)
      .leftJoin(suppliers, eq(vendorCommunications.supplierId, suppliers.id))
      .leftJoin(users, eq(vendorCommunications.userId, users.id))
      .orderBy(desc(vendorCommunications.createdAt));

    return communications.map(c => ({
      ...c.vendor_communications,
      supplier: c.suppliers,
      user: c.users
    }));
  }

  async createVendorCommunication(insertCommunication: InsertVendorCommunication): Promise<VendorCommunication> {
    const [communication] = await db.insert(vendorCommunications).values(insertCommunication).returning();
    return communication;
  }

  async updateVendorCommunication(id: string, updateCommunication: Partial<InsertVendorCommunication>): Promise<VendorCommunication> {
    const [communication] = await db
      .update(vendorCommunications)
      .set({ ...updateCommunication, updatedAt: new Date() })
      .where(eq(vendorCommunications.id, id))
      .returning();
    return communication;
  }

  async deleteVendorCommunication(id: string): Promise<void> {
    await db.delete(vendorCommunications).where(eq(vendorCommunications.id, id));
  }

  async getVendorCommunicationsBySupplier(supplierId: string): Promise<any[]> {
    return await db
      .select()
      .from(vendorCommunications)
      .leftJoin(suppliers, eq(vendorCommunications.supplierId, suppliers.id))
      .leftJoin(users, eq(vendorCommunications.userId, users.id))
      .where(eq(vendorCommunications.supplierId, supplierId))
      .orderBy(desc(vendorCommunications.createdAt));
  }

  async getVendorCommunicationsByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(vendorCommunications)
      .leftJoin(suppliers, eq(vendorCommunications.supplierId, suppliers.id))
      .where(eq(vendorCommunications.status, status as any))
      .orderBy(desc(vendorCommunications.createdAt));
  }

  // Inventory Tasks
  async getInventoryTask(id: string): Promise<any> {
    const [task] = await db
      .select()
      .from(inventoryTasks)
      .leftJoin(users, eq(inventoryTasks.assignedTo, users.id))
      .leftJoin(products, eq(inventoryTasks.productId, products.id))
      .leftJoin(spareParts, eq(inventoryTasks.sparePartId, spareParts.id))
      .leftJoin(batches, eq(inventoryTasks.batchId, batches.id))
      .leftJoin(fabricationOrders, eq(inventoryTasks.fabricationOrderId, fabricationOrders.id))
      .where(eq(inventoryTasks.id, id));
    
    if (!task) return undefined;
    
    return {
      ...task.inventory_tasks,
      assignedUser: task.users,
      product: task.products,
      sparePart: task.spare_parts,
      batch: task.batches,
      fabricationOrder: task.fabrication_orders
    };
  }

  async getInventoryTasks(): Promise<any[]> {
    const tasks = await db
      .select()
      .from(inventoryTasks)
      .leftJoin(users, eq(inventoryTasks.assignedTo, users.id))
      .leftJoin(products, eq(inventoryTasks.productId, products.id))
      .leftJoin(spareParts, eq(inventoryTasks.sparePartId, spareParts.id))
      .leftJoin(batches, eq(inventoryTasks.batchId, batches.id))
      .orderBy(desc(inventoryTasks.createdAt));

    return tasks.map(t => ({
      ...t.inventory_tasks,
      assignedUser: t.users,
      product: t.products,
      sparePart: t.spare_parts,
      batch: t.batches
    }));
  }

  async createInventoryTask(insertTask: InsertInventoryTask): Promise<InventoryTask> {
    const [task] = await db.insert(inventoryTasks).values(insertTask).returning();
    return task;
  }

  async updateInventoryTask(id: string, updateTask: Partial<InsertInventoryTask>): Promise<InventoryTask> {
    const [task] = await db
      .update(inventoryTasks)
      .set({ ...updateTask, updatedAt: new Date() })
      .where(eq(inventoryTasks.id, id))
      .returning();
    return task;
  }

  async deleteInventoryTask(id: string): Promise<void> {
    await db.delete(inventoryTasks).where(eq(inventoryTasks.id, id));
  }

  async getInventoryTasksByAssignee(assigneeId: string): Promise<any[]> {
    return await db
      .select()
      .from(inventoryTasks)
      .leftJoin(users, eq(inventoryTasks.assignedTo, users.id))
      .leftJoin(products, eq(inventoryTasks.productId, products.id))
      .leftJoin(spareParts, eq(inventoryTasks.sparePartId, spareParts.id))
      .where(eq(inventoryTasks.assignedTo, assigneeId))
      .orderBy(desc(inventoryTasks.createdAt));
  }

  async getInventoryTasksByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(inventoryTasks)
      .leftJoin(users, eq(inventoryTasks.assignedTo, users.id))
      .where(eq(inventoryTasks.status, status as any))
      .orderBy(desc(inventoryTasks.createdAt));
  }

  async getInventoryTasksByType(type: string): Promise<any[]> {
    return await db
      .select()
      .from(inventoryTasks)
      .leftJoin(users, eq(inventoryTasks.assignedTo, users.id))
      .where(eq(inventoryTasks.type, type as any))
      .orderBy(desc(inventoryTasks.createdAt));
  }

  // ===== ACCOUNTS MODULE IMPLEMENTATIONS =====

  // Accounts Receivables
  async getAccountsReceivable(id: string): Promise<any> {
    const [receivable] = await db
      .select()
      .from(accountsReceivables)
      .leftJoin(invoices, eq(accountsReceivables.invoiceId, invoices.id))
      .leftJoin(customers, eq(accountsReceivables.customerId, customers.id))
      .where(eq(accountsReceivables.id, id));

    if (!receivable) return undefined;

    return {
      ...receivable.accounts_receivables,
      invoice: receivable.invoices,
      customer: receivable.customers
    };
  }

  async getAccountsReceivables(): Promise<any[]> {
    const receivables = await db
      .select()
      .from(accountsReceivables)
      .leftJoin(invoices, eq(accountsReceivables.invoiceId, invoices.id))
      .leftJoin(customers, eq(accountsReceivables.customerId, customers.id))
      .orderBy(desc(accountsReceivables.dueDate));

    return receivables.map(r => ({
      ...r.accounts_receivables,
      invoice: r.invoices,
      customer: r.customers
    }));
  }

  async createAccountsReceivable(receivable: InsertAccountsReceivable): Promise<AccountsReceivable> {
    const [newReceivable] = await db
      .insert(accountsReceivables)
      .values(receivable)
      .returning();
    return newReceivable;
  }

  async updateAccountsReceivable(id: string, receivable: Partial<InsertAccountsReceivable>): Promise<AccountsReceivable> {
    const [updated] = await db
      .update(accountsReceivables)
      .set({ ...receivable, updatedAt: new Date() })
      .where(eq(accountsReceivables.id, id))
      .returning();
    return updated;
  }

  async deleteAccountsReceivable(id: string): Promise<void> {
    await db.delete(accountsReceivables).where(eq(accountsReceivables.id, id));
  }

  async getAccountsReceivablesByCustomer(customerId: string): Promise<any[]> {
    return await db
      .select()
      .from(accountsReceivables)
      .leftJoin(invoices, eq(accountsReceivables.invoiceId, invoices.id))
      .where(eq(accountsReceivables.customerId, customerId))
      .orderBy(desc(accountsReceivables.dueDate));
  }

  async getAccountsReceivablesByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(accountsReceivables)
      .leftJoin(invoices, eq(accountsReceivables.invoiceId, invoices.id))
      .leftJoin(customers, eq(accountsReceivables.customerId, customers.id))
      .where(eq(accountsReceivables.status, status as any))
      .orderBy(desc(accountsReceivables.dueDate));
  }

  async getOverdueReceivables(): Promise<any[]> {
    const today = new Date();
    return await db
      .select()
      .from(accountsReceivables)
      .leftJoin(invoices, eq(accountsReceivables.invoiceId, invoices.id))
      .leftJoin(customers, eq(accountsReceivables.customerId, customers.id))
      .where(and(
        lte(accountsReceivables.dueDate, today),
        eq(accountsReceivables.status, 'overdue')
      ))
      .orderBy(desc(accountsReceivables.dueDate));
  }

  // Accounts Payables
  async getAccountsPayable(id: string): Promise<any> {
    const [payable] = await db
      .select()
      .from(accountsPayables)
      .leftJoin(purchaseOrders, eq(accountsPayables.poId, purchaseOrders.id))
      .leftJoin(inboundQuotations, eq(accountsPayables.inboundQuotationId, inboundQuotations.id))
      .leftJoin(suppliers, eq(accountsPayables.supplierId, suppliers.id))
      .where(eq(accountsPayables.id, id));

    if (!payable) return undefined;

    return {
      ...payable.accounts_payables,
      purchaseOrder: payable.purchase_orders,
      inboundQuotation: payable.inbound_quotations,
      supplier: payable.suppliers
    };
  }

  async getAccountsPayables(): Promise<any[]> {
    const payables = await db
      .select()
      .from(accountsPayables)
      .leftJoin(purchaseOrders, eq(accountsPayables.poId, purchaseOrders.id))
      .leftJoin(inboundQuotations, eq(accountsPayables.inboundQuotationId, inboundQuotations.id))
      .leftJoin(suppliers, eq(accountsPayables.supplierId, suppliers.id))
      .orderBy(desc(accountsPayables.dueDate));

    return payables.map(p => ({
      ...p.accounts_payables,
      purchaseOrder: p.purchase_orders,
      inboundQuotation: p.inbound_quotations,
      supplier: p.suppliers
    }));
  }

  async createAccountsPayable(payable: InsertAccountsPayable): Promise<AccountsPayable> {
    const [newPayable] = await db
      .insert(accountsPayables)
      .values(payable)
      .returning();
    return newPayable;
  }

  async updateAccountsPayable(id: string, payable: Partial<InsertAccountsPayable>): Promise<AccountsPayable> {
    const [updated] = await db
      .update(accountsPayables)
      .set({ ...payable, updatedAt: new Date() })
      .where(eq(accountsPayables.id, id))
      .returning();
    return updated;
  }

  async deleteAccountsPayable(id: string): Promise<void> {
    await db.delete(accountsPayables).where(eq(accountsPayables.id, id));
  }

  async getAccountsPayablesBySupplier(supplierId: string): Promise<any[]> {
    return await db
      .select()
      .from(accountsPayables)
      .leftJoin(purchaseOrders, eq(accountsPayables.poId, purchaseOrders.id))
      .leftJoin(inboundQuotations, eq(accountsPayables.inboundQuotationId, inboundQuotations.id))
      .where(eq(accountsPayables.supplierId, supplierId))
      .orderBy(desc(accountsPayables.dueDate));
  }

  async getAccountsPayablesByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(accountsPayables)
      .leftJoin(purchaseOrders, eq(accountsPayables.poId, purchaseOrders.id))
      .leftJoin(inboundQuotations, eq(accountsPayables.inboundQuotationId, inboundQuotations.id))
      .leftJoin(suppliers, eq(accountsPayables.supplierId, suppliers.id))
      .where(eq(accountsPayables.status, status as any))
      .orderBy(desc(accountsPayables.dueDate));
  }

  async getOverduePayables(): Promise<any[]> {
    const today = new Date();
    return await db
      .select()
      .from(accountsPayables)
      .leftJoin(purchaseOrders, eq(accountsPayables.poId, purchaseOrders.id))
      .leftJoin(inboundQuotations, eq(accountsPayables.inboundQuotationId, inboundQuotations.id))
      .leftJoin(suppliers, eq(accountsPayables.supplierId, suppliers.id))
      .where(and(
        lte(accountsPayables.dueDate, today),
        eq(accountsPayables.status, 'overdue')
      ))
      .orderBy(desc(accountsPayables.dueDate));
  }

  // Payments
  async getPayment(id: string): Promise<any> {
    const [payment] = await db
      .select()
      .from(payments)
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .where(eq(payments.id, id));

    if (!payment) return undefined;

    return {
      ...payment.payments,
      bankAccount: payment.bank_accounts
    };
  }

  async getPayments(): Promise<any[]> {
    const paymentsList = await db
      .select()
      .from(payments)
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .orderBy(desc(payments.date));

    return paymentsList.map(p => ({
      ...p.payments,
      bankAccount: p.bank_accounts
    }));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async deletePayment(id: string): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  async getPaymentsByKind(kind: string): Promise<any[]> {
    return await db
      .select()
      .from(payments)
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .where(eq(payments.kind, kind as any))
      .orderBy(desc(payments.date));
  }

  async getPaymentsByMethod(method: string): Promise<any[]> {
    return await db
      .select()
      .from(payments)
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .where(eq(payments.method, method as any))
      .orderBy(desc(payments.date));
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select()
      .from(payments)
      .leftJoin(bankAccounts, eq(payments.bankAccountId, bankAccounts.id))
      .where(and(
        gte(payments.date, startDate),
        lte(payments.date, endDate)
      ))
      .orderBy(desc(payments.date));
  }

  // Bank Accounts
  async getBankAccount(id: string): Promise<any> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id));
    return account;
  }

  async getBankAccounts(): Promise<any[]> {
    return await db
      .select()
      .from(bankAccounts)
      .orderBy(desc(bankAccounts.isDefault), desc(bankAccounts.createdAt));
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db
      .insert(bankAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateBankAccount(id: string, account: Partial<InsertBankAccount>): Promise<BankAccount> {
    const [updated] = await db
      .update(bankAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteBankAccount(id: string): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  async getDefaultBankAccount(): Promise<BankAccount | undefined> {
    const [account] = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.isDefault, true))
      .limit(1);
    return account;
  }

  async getActiveBankAccounts(): Promise<any[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.isActive, true))
      .orderBy(desc(bankAccounts.isDefault), desc(bankAccounts.createdAt));
  }

  // Bank Transactions
  async getBankTransaction(id: string): Promise<any> {
    const [transaction] = await db
      .select()
      .from(bankTransactions)
      .leftJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
      .leftJoin(payments, eq(bankTransactions.paymentId, payments.id))
      .where(eq(bankTransactions.id, id));

    if (!transaction) return undefined;

    return {
      ...transaction.bank_transactions,
      bankAccount: transaction.bank_accounts,
      payment: transaction.payments
    };
  }

  async getBankTransactions(): Promise<any[]> {
    const transactions = await db
      .select()
      .from(bankTransactions)
      .leftJoin(bankAccounts, eq(bankTransactions.bankAccountId, bankAccounts.id))
      .leftJoin(payments, eq(bankTransactions.paymentId, payments.id))
      .orderBy(desc(bankTransactions.date));

    return transactions.map(t => ({
      ...t.bank_transactions,
      bankAccount: t.bank_accounts,
      payment: t.payments
    }));
  }

  async createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction> {
    const [newTransaction] = await db
      .insert(bankTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateBankTransaction(id: string, transaction: Partial<InsertBankTransaction>): Promise<BankTransaction> {
    const [updated] = await db
      .update(bankTransactions)
      .set(transaction)
      .where(eq(bankTransactions.id, id))
      .returning();
    return updated;
  }

  async deleteBankTransaction(id: string): Promise<void> {
    await db.delete(bankTransactions).where(eq(bankTransactions.id, id));
  }

  async getBankTransactionsByAccount(bankAccountId: string): Promise<any[]> {
    return await db
      .select()
      .from(bankTransactions)
      .leftJoin(payments, eq(bankTransactions.paymentId, payments.id))
      .where(eq(bankTransactions.bankAccountId, bankAccountId))
      .orderBy(desc(bankTransactions.date));
  }

  async getBankTransactionsByDateRange(bankAccountId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select()
      .from(bankTransactions)
      .leftJoin(payments, eq(bankTransactions.paymentId, payments.id))
      .where(and(
        eq(bankTransactions.bankAccountId, bankAccountId),
        gte(bankTransactions.date, startDate),
        lte(bankTransactions.date, endDate)
      ))
      .orderBy(desc(bankTransactions.date));
  }

  // GST Returns
  async getGstReturn(id: string): Promise<any> {
    const [gstReturn] = await db
      .select()
      .from(gstReturns)
      .where(eq(gstReturns.id, id));
    return gstReturn;
  }

  async getGstReturns(): Promise<any[]> {
    return await db
      .select()
      .from(gstReturns)
      .orderBy(desc(gstReturns.periodEnd));
  }

  async createGstReturn(gstReturn: InsertGstReturn): Promise<GstReturn> {
    const [newGstReturn] = await db
      .insert(gstReturns)
      .values(gstReturn)
      .returning();
    return newGstReturn;
  }

  async updateGstReturn(id: string, gstReturn: Partial<InsertGstReturn>): Promise<GstReturn> {
    const [updated] = await db
      .update(gstReturns)
      .set({ ...gstReturn, updatedAt: new Date() })
      .where(eq(gstReturns.id, id))
      .returning();
    return updated;
  }

  async deleteGstReturn(id: string): Promise<void> {
    await db.delete(gstReturns).where(eq(gstReturns.id, id));
  }

  async getGstReturnsByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(gstReturns)
      .where(eq(gstReturns.status, status as any))
      .orderBy(desc(gstReturns.periodEnd));
  }

  async getGstReturnsByPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return await db
      .select()
      .from(gstReturns)
      .where(and(
        gte(gstReturns.periodStart, startDate),
        lte(gstReturns.periodEnd, endDate)
      ))
      .orderBy(desc(gstReturns.periodEnd));
  }

  // Account Reminders
  async getAccountReminder(id: string): Promise<any> {
    const [reminder] = await db
      .select()
      .from(accountReminders)
      .where(eq(accountReminders.id, id));
    return reminder;
  }

  async getAccountReminders(): Promise<any[]> {
    return await db
      .select()
      .from(accountReminders)
      .orderBy(desc(accountReminders.nextReminderAt));
  }

  async createAccountReminder(reminder: InsertAccountReminder): Promise<AccountReminder> {
    const [newReminder] = await db
      .insert(accountReminders)
      .values(reminder)
      .returning();
    return newReminder;
  }

  async updateAccountReminder(id: string, reminder: Partial<InsertAccountReminder>): Promise<AccountReminder> {
    const [updated] = await db
      .update(accountReminders)
      .set({ ...reminder, updatedAt: new Date() })
      .where(eq(accountReminders.id, id))
      .returning();
    return updated;
  }

  async deleteAccountReminder(id: string): Promise<void> {
    await db.delete(accountReminders).where(eq(accountReminders.id, id));
  }

  async getPendingReminders(): Promise<any[]> {
    const now = new Date();
    return await db
      .select()
      .from(accountReminders)
      .where(and(
        eq(accountReminders.status, 'pending'),
        lte(accountReminders.nextReminderAt, now)
      ))
      .orderBy(desc(accountReminders.nextReminderAt));
  }

  async getRemindersByTargetType(targetType: string): Promise<any[]> {
    return await db
      .select()
      .from(accountReminders)
      .where(eq(accountReminders.targetType, targetType as any))
      .orderBy(desc(accountReminders.nextReminderAt));
  }

  // Account Tasks
  async getAccountTask(id: string): Promise<any> {
    const [task] = await db
      .select()
      .from(accountTasks)
      .leftJoin(users, eq(accountTasks.assignedTo, users.id))
      .where(eq(accountTasks.id, id));

    if (!task) return undefined;

    return {
      ...task.account_tasks,
      assignedToUser: task.users
    };
  }

  async getAccountTasks(): Promise<any[]> {
    const tasks = await db
      .select()
      .from(accountTasks)
      .leftJoin(users, eq(accountTasks.assignedTo, users.id))
      .orderBy(desc(accountTasks.createdAt));

    return tasks.map(t => ({
      ...t.account_tasks,
      assignedToUser: t.users
    }));
  }

  async createAccountTask(task: InsertAccountTask): Promise<AccountTask> {
    const [newTask] = await db
      .insert(accountTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateAccountTask(id: string, task: Partial<InsertAccountTask>): Promise<AccountTask> {
    const [updated] = await db
      .update(accountTasks)
      .set({ ...task, updatedAt: new Date() })
      .where(eq(accountTasks.id, id))
      .returning();
    return updated;
  }

  async deleteAccountTask(id: string): Promise<void> {
    await db.delete(accountTasks).where(eq(accountTasks.id, id));
  }

  async getAccountTasksByAssignee(assigneeId: string): Promise<any[]> {
    return await db
      .select()
      .from(accountTasks)
      .leftJoin(users, eq(accountTasks.assignedTo, users.id))
      .where(eq(accountTasks.assignedTo, assigneeId))
      .orderBy(desc(accountTasks.createdAt));
  }

  async getAccountTasksByStatus(status: string): Promise<any[]> {
    return await db
      .select()
      .from(accountTasks)
      .leftJoin(users, eq(accountTasks.assignedTo, users.id))
      .where(eq(accountTasks.status, status as any))
      .orderBy(desc(accountTasks.createdAt));
  }

  async getAccountTasksByType(type: string): Promise<any[]> {
    return await db
      .select()
      .from(accountTasks)
      .leftJoin(users, eq(accountTasks.assignedTo, users.id))
      .where(eq(accountTasks.type, type as any))
      .orderBy(desc(accountTasks.createdAt));
  }

  // Accounts Analytics
  async getAccountsDashboardMetrics(): Promise<any> {
    const totalReceivables = await db
      .select({ sum: sum(accountsReceivables.amountDue) })
      .from(accountsReceivables)
      .where(eq(accountsReceivables.status, 'pending'));

    const totalPayables = await db
      .select({ sum: sum(accountsPayables.amountDue) })
      .from(accountsPayables)
      .where(eq(accountsPayables.status, 'pending'));

    const overdueReceivables = await db
      .select({ count: count() })
      .from(accountsReceivables)
      .where(eq(accountsReceivables.status, 'overdue'));

    const overduePayables = await db
      .select({ count: count() })
      .from(accountsPayables)
      .where(eq(accountsPayables.status, 'overdue'));

    return {
      totalReceivables: totalReceivables[0]?.sum || 0,
      totalPayables: totalPayables[0]?.sum || 0,
      overdueReceivables: overdueReceivables[0]?.count || 0,
      overduePayables: overduePayables[0]?.count || 0
    };
  }

  async getTotalReceivablesAmount(): Promise<number> {
    const result = await db
      .select({ sum: sum(accountsReceivables.amountDue) })
      .from(accountsReceivables)
      .where(eq(accountsReceivables.status, 'pending'));
    return parseFloat(result[0]?.sum || '0');
  }

  async getTotalPayablesAmount(): Promise<number> {
    const result = await db
      .select({ sum: sum(accountsPayables.amountDue) })
      .from(accountsPayables)
      .where(eq(accountsPayables.status, 'pending'));
    return parseFloat(result[0]?.sum || '0');
  }

  async getCashFlowSummary(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const paymentsReceived = await db
      .select({ sum: sum(payments.amount) })
      .from(payments)
      .where(and(
        eq(payments.kind, 'receive'),
        gte(payments.date, thirtyDaysAgo)
      ));

    const paymentsMade = await db
      .select({ sum: sum(payments.amount) })
      .from(payments)
      .where(and(
        eq(payments.kind, 'pay'),
        gte(payments.date, thirtyDaysAgo)
      ));

    return {
      paymentsReceived: parseFloat(paymentsReceived[0]?.sum || '0'),
      paymentsMade: parseFloat(paymentsMade[0]?.sum || '0'),
      netCashFlow: parseFloat(paymentsReceived[0]?.sum || '0') - parseFloat(paymentsMade[0]?.sum || '0')
    };
  }

  // Account Reports
  async getAccountReport(id: string): Promise<any> {
    const [report] = await db
      .select()
      .from(accountReports)
      .leftJoin(users, eq(accountReports.generatedBy, users.id))
      .where(eq(accountReports.id, id));

    if (!report) return undefined;

    return {
      ...report.account_reports,
      generatedByUser: report.users
    };
  }

  async getAccountReports(): Promise<any[]> {
    const reports = await db
      .select()
      .from(accountReports)
      .leftJoin(users, eq(accountReports.generatedBy, users.id))
      .orderBy(desc(accountReports.createdAt));

    return reports.map(r => ({
      ...r.account_reports,
      generatedByUser: r.users
    }));
  }

  async createAccountReport(report: InsertAccountReport): Promise<AccountReport> {
    const [newReport] = await db
      .insert(accountReports)
      .values(report)
      .returning();
    return newReport;
  }

  async updateAccountReport(id: string, report: Partial<InsertAccountReport>): Promise<AccountReport> {
    const [updated] = await db
      .update(accountReports)
      .set({ ...report, updatedAt: new Date() })
      .where(eq(accountReports.id, id))
      .returning();
    return updated;
  }

  async deleteAccountReport(id: string): Promise<void> {
    await db.delete(accountReports).where(eq(accountReports.id, id));
  }

  async getReportsByType(type: string): Promise<any[]> {
    const reports = await db
      .select()
      .from(accountReports)
      .leftJoin(users, eq(accountReports.generatedBy, users.id))
      .where(eq(accountReports.reportType, type as any))
      .orderBy(desc(accountReports.createdAt));

    return reports.map(r => ({
      ...r.account_reports,
      generatedByUser: r.users
    }));
  }

  async getReportsByStatus(status: string): Promise<any[]> {
    const reports = await db
      .select()
      .from(accountReports)
      .leftJoin(users, eq(accountReports.generatedBy, users.id))
      .where(eq(accountReports.status, status as any))
      .orderBy(desc(accountReports.createdAt));

    return reports.map(r => ({
      ...r.account_reports,
      generatedByUser: r.users
    }));
  }

  async exportReport(id: string, format: string): Promise<{ url: string; fileName: string }> {
    // This would typically integrate with a report generation service
    // For now, we'll simulate the file generation process
    const report = await this.getAccountReport(id);
    if (!report) throw new Error('Report not found');
    
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${report.reportType}_${timestamp}.${format}`;
    
    // In a real implementation, this would:
    // 1. Generate the actual file (PDF/Excel/CSV)
    // 2. Upload to cloud storage or serve from filesystem
    // 3. Return the actual download URL
    
    const simulatedUrl = `/downloads/reports/${fileName}`;
    
    return {
      url: simulatedUrl,
      fileName: fileName
    };
  }

  async incrementReportDownload(id: string): Promise<void> {
    await db
      .update(accountReports)
      .set({ 
        downloadCount: sql`${accountReports.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(accountReports.id, id));
  }

  // ===== MARKETING MODULE IMPLEMENTATIONS =====

  // LEADS CRUD OPERATIONS
  async getLead(id: string): Promise<any> {
    const [lead] = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.id, id));
    
    if (!lead) return undefined;
    
    return {
      ...lead.leads,
      assignedUser: lead.users
    };
  }

  async getLeads(): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(insertLead).returning();
    return lead;
  }

  async updateLead(id: string, updateLead: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...updateLead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async getLeadsByStatus(status: string): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.status, status as any))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async getLeadsByAssignedEmployee(userId: string): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.assignedTo, userId))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async getLeadsBySource(source: string): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.source, source as any))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async getLeadsByPriority(priority: string): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(eq(leads.priority, priority as any))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async updateLeadStatus(id: string, status: string): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ 
        status: status as any, 
        updatedAt: new Date(),
        ...(status === 'converted' && { conversionDate: new Date() })
      })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async convertLeadToCustomer(leadId: string): Promise<Customer> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error('Lead not found');
    
    // Create customer from lead data
    const customerData: InsertCustomer = {
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zipCode: lead.zipCode,
      country: lead.country,
      companyType: lead.companyName ? 'company' : 'individual',
      notes: `Converted from lead on ${new Date().toISOString()}. Original requirement: ${lead.requirementDescription}`
    };

    const customer = await this.createCustomer(customerData);
    
    // Update lead status to converted
    await this.updateLeadStatus(leadId, 'converted');
    
    return customer;
  }

  async getLeadsConversionMetrics(): Promise<any> {
    const totalLeads = await db.select({ count: count() }).from(leads);
    const convertedLeads = await db.select({ count: count() }).from(leads).where(eq(leads.status, 'converted'));
    const activeLeads = await db.select({ count: count() }).from(leads).where(eq(leads.isActive, true));
    
    const conversionRate = totalLeads[0]?.count ? 
      ((convertedLeads[0]?.count || 0) / totalLeads[0].count * 100) : 0;
    
    return {
      totalLeads: totalLeads[0]?.count || 0,
      convertedLeads: convertedLeads[0]?.count || 0,
      activeLeads: activeLeads[0]?.count || 0,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  async searchLeads(query: string): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(
        sql`${leads.firstName} ILIKE ${`%${query}%`} OR 
            ${leads.lastName} ILIKE ${`%${query}%`} OR 
            ${leads.companyName} ILIKE ${`%${query}%`} OR 
            ${leads.email} ILIKE ${`%${query}%`} OR 
            ${leads.phone} ILIKE ${`%${query}%`}`
      )
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async getLeadsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(and(
        gte(leads.createdAt, startDate),
        lte(leads.createdAt, endDate)
      ))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  async getActiveLeads(): Promise<any[]> {
    const leadsData = await db
      .select()
      .from(leads)
      .leftJoin(users, eq(leads.assignedTo, users.id))
      .where(and(
        eq(leads.isActive, true),
        sql`${leads.status} NOT IN ('converted', 'dropped')`
      ))
      .orderBy(desc(leads.createdAt));

    return leadsData.map(l => ({
      ...l.leads,
      assignedUser: l.users
    }));
  }

  // FIELD VISITS CRUD OPERATIONS
  async getFieldVisit(id: string): Promise<any> {
    const [visit] = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(eq(fieldVisits.id, id));
    
    if (!visit) return undefined;
    
    return {
      ...visit.field_visits,
      lead: visit.leads,
      assignedUser: visit.users
    };
  }

  async getFieldVisits(): Promise<any[]> {
    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .orderBy(desc(fieldVisits.createdAt));

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async createFieldVisit(insertVisit: InsertFieldVisit): Promise<FieldVisit> {
    // Generate visit number
    const visitCount = await db.select({ count: count() }).from(fieldVisits);
    const visitNumber = `FV${String(visitCount[0].count + 1).padStart(6, '0')}`;
    
    const [visit] = await db
      .insert(fieldVisits)
      .values({ ...insertVisit, visitNumber })
      .returning();
    return visit;
  }

  async updateFieldVisit(id: string, updateVisit: Partial<InsertFieldVisit>): Promise<FieldVisit> {
    const [visit] = await db
      .update(fieldVisits)
      .set({ ...updateVisit, updatedAt: new Date() })
      .where(eq(fieldVisits.id, id))
      .returning();
    return visit;
  }

  async deleteFieldVisit(id: string): Promise<void> {
    await db.delete(fieldVisits).where(eq(fieldVisits.id, id));
  }

  async getFieldVisitsByEmployee(userId: string): Promise<any[]> {
    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(eq(fieldVisits.assignedTo, userId))
      .orderBy(desc(fieldVisits.plannedDate));

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async getFieldVisitsByLead(leadId: string): Promise<any[]> {
    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(eq(fieldVisits.leadId, leadId))
      .orderBy(desc(fieldVisits.plannedDate));

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async getFieldVisitsByStatus(status: string): Promise<any[]> {
    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(eq(fieldVisits.status, status as any))
      .orderBy(desc(fieldVisits.plannedDate));

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async getFieldVisitsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(and(
        gte(fieldVisits.plannedDate, startDate),
        lte(fieldVisits.plannedDate, endDate)
      ))
      .orderBy(desc(fieldVisits.plannedDate));

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async updateVisitStatus(id: string, status: string): Promise<FieldVisit> {
    const [visit] = await db
      .update(fieldVisits)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(fieldVisits.id, id))
      .returning();
    return visit;
  }

  async getTodayFieldVisits(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(and(
        gte(fieldVisits.plannedDate, today),
        lt(fieldVisits.plannedDate, tomorrow)
      ))
      .orderBy(fieldVisits.plannedStartTime);

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async getUpcomingFieldVisits(): Promise<any[]> {
    const today = new Date();
    
    const visitsData = await db
      .select()
      .from(fieldVisits)
      .leftJoin(leads, eq(fieldVisits.leadId, leads.id))
      .leftJoin(users, eq(fieldVisits.assignedTo, users.id))
      .where(and(
        gte(fieldVisits.plannedDate, today),
        eq(fieldVisits.status, 'scheduled')
      ))
      .orderBy(fieldVisits.plannedDate)
      .limit(20);

    return visitsData.map(v => ({
      ...v.field_visits,
      lead: v.leads,
      assignedUser: v.users
    }));
  }

  async getVisitMetrics(): Promise<any> {
    const totalVisits = await db.select({ count: count() }).from(fieldVisits);
    const completedVisits = await db.select({ count: count() }).from(fieldVisits).where(eq(fieldVisits.status, 'completed'));
    const todayVisits = await this.getTodayFieldVisits();
    
    const successRate = totalVisits[0]?.count ? 
      ((completedVisits[0]?.count || 0) / totalVisits[0].count * 100) : 0;
    
    return {
      totalVisits: totalVisits[0]?.count || 0,
      completedVisits: completedVisits[0]?.count || 0,
      todayVisits: todayVisits.length,
      successRate: Math.round(successRate * 100) / 100
    };
  }

  async checkInFieldVisit(id: string, checkInData: any): Promise<FieldVisit> {
    const [visit] = await db
      .update(fieldVisits)
      .set({
        actualStartTime: checkInData.actualStartTime || new Date(),
        checkInLocation: checkInData.location,
        checkInLatitude: checkInData.latitude,
        checkInLongitude: checkInData.longitude,
        checkInPhotoPath: checkInData.photoPath,
        status: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(fieldVisits.id, id))
      .returning();
    return visit;
  }

  async checkOutFieldVisit(id: string, checkOutData: any): Promise<FieldVisit> {
    const [visit] = await db
      .update(fieldVisits)
      .set({
        actualEndTime: checkOutData.actualEndTime || new Date(),
        checkOutLocation: checkOutData.location,
        checkOutLatitude: checkOutData.latitude,
        checkOutLongitude: checkOutData.longitude,
        checkOutPhotoPath: checkOutData.photoPath,
        visitNotes: checkOutData.notes,
        outcome: checkOutData.outcome,
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(fieldVisits.id, id))
      .returning();
    return visit;
  }

  // MARKETING TASKS CRUD OPERATIONS
  async getMarketingTask(id: string): Promise<any> {
    const [task] = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .leftJoin(fieldVisits, eq(marketingTasks.fieldVisitId, fieldVisits.id))
      .leftJoin(customers, eq(marketingTasks.customerId, customers.id))
      .where(eq(marketingTasks.id, id));
    
    if (!task) return undefined;
    
    return {
      ...task.marketing_tasks,
      assignedUser: task.users,
      lead: task.leads,
      fieldVisit: task.field_visits,
      customer: task.customers
    };
  }

  async getMarketingTasks(): Promise<any[]> {
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .leftJoin(fieldVisits, eq(marketingTasks.fieldVisitId, fieldVisits.id))
      .leftJoin(customers, eq(marketingTasks.customerId, customers.id))
      .orderBy(desc(marketingTasks.createdAt));

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads,
      fieldVisit: t.field_visits,
      customer: t.customers
    }));
  }

  async createMarketingTask(insertTask: InsertMarketingTask): Promise<MarketingTask> {
    const result = await db.insert(marketingTasks).values(insertTask).returning();
    const resultArray = Array.isArray(result) ? result : [];
    if (!resultArray || resultArray.length === 0) {
      throw new Error('Failed to create marketing task');
    }
    return resultArray[0];
  }

  async updateMarketingTask(id: string, updateTask: Partial<InsertMarketingTask>): Promise<MarketingTask> {
    const [task] = await db
      .update(marketingTasks)
      .set({ ...updateTask, updatedAt: new Date() })
      .where(eq(marketingTasks.id, id))
      .returning();
    return task;
  }

  async deleteMarketingTask(id: string): Promise<void> {
    await db.delete(marketingTasks).where(eq(marketingTasks.id, id));
  }

  async getMarketingTasksByEmployee(userId: string): Promise<any[]> {
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(eq(marketingTasks.assignedTo, userId))
      .orderBy(desc(marketingTasks.createdAt));

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async getMarketingTasksByStatus(status: string): Promise<any[]> {
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(eq(marketingTasks.status, status as any))
      .orderBy(desc(marketingTasks.createdAt));

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async getMarketingTasksByType(type: string): Promise<any[]> {
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(eq(marketingTasks.type, type as any))
      .orderBy(desc(marketingTasks.createdAt));

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async getMarketingTasksByPriority(priority: string): Promise<any[]> {
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(eq(marketingTasks.priority, priority as any))
      .orderBy(desc(marketingTasks.createdAt));

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async getMarketingTasksByLead(leadId: string): Promise<any[]> {
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(eq(marketingTasks.leadId, leadId))
      .orderBy(desc(marketingTasks.createdAt));

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async updateTaskStatus(id: string, status: string): Promise<MarketingTask> {
    const updateData: any = { 
      status: status as any, 
      updatedAt: new Date() 
    };
    
    if (status === 'in_progress') {
      updateData.startedDate = new Date();
    } else if (status === 'completed') {
      updateData.completedDate = new Date();
    }
    
    const [task] = await db
      .update(marketingTasks)
      .set(updateData)
      .where(eq(marketingTasks.id, id))
      .returning();
    return task;
  }

  async getTodayMarketingTasks(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(and(
        gte(marketingTasks.dueDate, today),
        lt(marketingTasks.dueDate, tomorrow)
      ))
      .orderBy(marketingTasks.dueDate);

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async getOverdueMarketingTasks(): Promise<any[]> {
    const today = new Date();
    
    const tasksData = await db
      .select()
      .from(marketingTasks)
      .leftJoin(users, eq(marketingTasks.assignedTo, users.id))
      .leftJoin(leads, eq(marketingTasks.leadId, leads.id))
      .where(and(
        lt(marketingTasks.dueDate, today),
        sql`${marketingTasks.status} NOT IN ('completed', 'cancelled')`
      ))
      .orderBy(marketingTasks.dueDate);

    return tasksData.map(t => ({
      ...t.marketing_tasks,
      assignedUser: t.users,
      lead: t.leads
    }));
  }

  async getTaskMetrics(): Promise<any> {
    const totalTasks = await db.select({ count: count() }).from(marketingTasks);
    const completedTasks = await db.select({ count: count() }).from(marketingTasks).where(eq(marketingTasks.status, 'completed'));
    const overdueTasks = await this.getOverdueMarketingTasks();
    const todayTasks = await this.getTodayMarketingTasks();
    
    const completionRate = totalTasks[0]?.count ? 
      ((completedTasks[0]?.count || 0) / totalTasks[0].count * 100) : 0;
    
    return {
      totalTasks: totalTasks[0]?.count || 0,
      completedTasks: completedTasks[0]?.count || 0,
      overdueTasks: overdueTasks.length,
      todayTasks: todayTasks.length,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  async completeMarketingTask(id: string, completionData: any): Promise<MarketingTask> {
    const [task] = await db
      .update(marketingTasks)
      .set({
        status: 'completed',
        completedDate: new Date(),
        completionNotes: completionData.notes,
        outcome: completionData.outcome,
        nextAction: completionData.nextAction,
        actualHours: completionData.actualHours,
        updatedAt: new Date()
      })
      .where(eq(marketingTasks.id, id))
      .returning();
    return task;
  }

  // MARKETING ATTENDANCE CRUD OPERATIONS
  async getMarketingAttendance(id: string): Promise<any> {
    const [attendance] = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(eq(marketingAttendance.id, id));
    
    if (!attendance) return undefined;
    
    return {
      ...attendance.marketing_attendance,
      user: attendance.users
    };
  }

  async getMarketingAttendances(): Promise<any[]> {
    const attendanceData = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .orderBy(desc(marketingAttendance.date));

    return attendanceData.map(a => ({
      ...a.marketing_attendance,
      user: a.users
    }));
  }

  async createMarketingAttendance(insertAttendance: InsertMarketingAttendance): Promise<MarketingAttendance> {
    const [attendance] = await db.insert(marketingAttendance).values(insertAttendance).returning();
    return attendance;
  }

  async updateMarketingAttendance(id: string, updateAttendance: Partial<InsertMarketingAttendance>): Promise<MarketingAttendance> {
    const [attendance] = await db
      .update(marketingAttendance)
      .set({ ...updateAttendance, updatedAt: new Date() })
      .where(eq(marketingAttendance.id, id))
      .returning();
    return attendance;
  }

  async deleteMarketingAttendance(id: string): Promise<void> {
    await db.delete(marketingAttendance).where(eq(marketingAttendance.id, id));
  }

  async getMarketingAttendanceByEmployee(userId: string): Promise<any[]> {
    const attendanceData = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(eq(marketingAttendance.userId, userId))
      .orderBy(desc(marketingAttendance.date));

    return attendanceData.map(a => ({
      ...a.marketing_attendance,
      user: a.users
    }));
  }

  async getMarketingAttendanceByDate(date: Date): Promise<any[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log('getMarketingAttendanceByDate:', {
        method: 'getMarketingAttendanceByDate',
        date,
        startOfDay,
        endOfDay
      });

      const attendanceData = await db
        .select()
        .from(marketingAttendance)
        .leftJoin(users, eq(marketingAttendance.userId, users.id))
        .where(and(
          gte(marketingAttendance.date, startOfDay),
          lte(marketingAttendance.date, endOfDay)
        ))
        .orderBy(asc(marketingAttendance.checkInTime));

      console.log('Query result:', { rowCount: attendanceData.length });

      return attendanceData.map(a => ({
        ...(a.marketing_attendance ?? a),
        user: a.users ?? undefined
      }));
    } catch (error) {
      const err = error as Error;
      console.error('getMarketingAttendanceByDate error:', {
        method: 'getMarketingAttendanceByDate',
        error: err.name,
        message: err.message,
        stack: err.stack
      });
      throw error;
    }
  }

  async getMarketingAttendanceByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const attendanceData = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(and(
        gte(marketingAttendance.date, startDate),
        lte(marketingAttendance.date, endDate)
      ))
      .orderBy(desc(marketingAttendance.date));

    return attendanceData.map(a => ({
      ...a.marketing_attendance,
      user: a.users
    }));
  }

  async getTodayMarketingAttendance(): Promise<any[]> {
    const today = new Date();
    return await this.getMarketingAttendanceByDate(today);
  }

  async checkInMarketingAttendance(userId: string, checkInData: any): Promise<MarketingAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    const [existing] = await db
      .select()
      .from(marketingAttendance)
      .where(and(
        eq(marketingAttendance.userId, userId),
        gte(marketingAttendance.date, today)
      ));

    if (existing) {
      // Update existing record
      const [attendance] = await db
        .update(marketingAttendance)
        .set({
          checkInTime: checkInData.checkInTime || new Date(),
          checkInLocation: checkInData.location,
          checkInLatitude: checkInData.latitude,
          checkInLongitude: checkInData.longitude,
          checkInPhotoPath: checkInData.photoPath,
          attendanceStatus: 'present',
          updatedAt: new Date()
        })
        .where(eq(marketingAttendance.id, existing.id))
        .returning();
      return attendance;
    } else {
      // Create new record
      const attendanceData: InsertMarketingAttendance = {
        userId,
        date: new Date(),
        checkInTime: checkInData.checkInTime || new Date(),
        checkInLocation: checkInData.location,
        checkInLatitude: checkInData.latitude,
        checkInLongitude: checkInData.longitude,
        checkInPhotoPath: checkInData.photoPath,
        attendanceStatus: 'present'
      };
      return await this.createMarketingAttendance(attendanceData);
    }
  }

  async checkOutMarketingAttendance(userId: string, checkOutData: any): Promise<MarketingAttendance> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [existing] = await db
      .select()
      .from(marketingAttendance)
      .where(and(
        eq(marketingAttendance.userId, userId),
        gte(marketingAttendance.date, today)
      ));

    if (!existing) {
      throw new Error('No check-in record found for today');
    }

    // Calculate work hours
    const checkInTime = existing.checkInTime;
    const checkOutTime = checkOutData.checkOutTime || new Date();
    const totalMinutes = checkInTime ? 
      Math.round((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)) : 0;
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

    const [attendance] = await db
      .update(marketingAttendance)
      .set({
        checkOutTime: checkOutTime,
        checkOutLocation: checkOutData.location,
        checkOutLatitude: checkOutData.latitude,
        checkOutLongitude: checkOutData.longitude,
        checkOutPhotoPath: checkOutData.photoPath,
        totalHours: totalHours.toString(),
        workDescription: checkOutData.workDescription,
        visitCount: checkOutData.visitCount || 0,
        tasksCompleted: checkOutData.tasksCompleted || 0,
        notes: checkOutData.notes,
        updatedAt: new Date()
      })
      .where(eq(marketingAttendance.id, existing.id))
      .returning();
    return attendance;
  }

  async getMarketingAttendanceMetrics(): Promise<any> {
    try {
      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);

      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      console.log('getMarketingAttendanceMetrics:', {
        method: 'getMarketingAttendanceMetrics',
        today,
        thisWeekStart,
        thisMonthStart
      });

      // Today's attendance
      const todayAttendance = await this.getTodayMarketingAttendance();
      console.log('Today attendance:', { count: todayAttendance.length, sample: todayAttendance[0] });
      
      const presentToday = todayAttendance.filter(a => a.attendanceStatus === 'present' || a.status === 'present').length;

    // This week's average hours
    const weeklyHours = await db
      .select({
        avgHours: avg(sql`CAST(${marketingAttendance.totalHours} AS DECIMAL)`)
      })
      .from(marketingAttendance)
      .where(and(
        gte(marketingAttendance.date, thisWeekStart),
        isNotNull(marketingAttendance.totalHours)
      ));

    // Monthly attendance rate
    const monthlyAttendance = await db
      .select({ count: count() })
      .from(marketingAttendance)
      .where(and(
        gte(marketingAttendance.date, thisMonthStart),
        eq(marketingAttendance.attendanceStatus, 'present')
      ));

    const totalMarketingEmployees = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        eq(users.isActive, true),
        eq(users.department, 'marketing')
      ));

    const avgHours = weeklyHours[0]?.avgHours ? 
      Math.round(parseFloat(weeklyHours[0].avgHours) * 100) / 100 : 0;

      return {
        totalEmployees: totalMarketingEmployees[0]?.count || 0,
        presentToday: presentToday,
        averageHoursThisWeek: avgHours,
        monthlyAttendanceCount: monthlyAttendance[0]?.count || 0,
        todayTotal: todayAttendance.length
      };
    } catch (error) {
      const err = error as Error;
      console.error('getMarketingAttendanceMetrics error:', {
        method: 'getMarketingAttendanceMetrics',
        error: err.name,
        message: err.message,
        stack: err.stack
      });
      throw error;
    }
  }

  async getEmployeeAttendanceHistory(userId: string, filters: any): Promise<any[]> {
    // Build conditions array
    const conditions = [eq(marketingAttendance.userId, userId)];

    if (filters.startDate && filters.endDate) {
      conditions.push(
        gte(marketingAttendance.date, filters.startDate),
        lte(marketingAttendance.date, filters.endDate)
      );
    }

    if (filters.status) {
      conditions.push(eq(marketingAttendance.attendanceStatus, filters.status));
    }

    const attendanceData = await db
      .select()
      .from(marketingAttendance)
      .leftJoin(users, eq(marketingAttendance.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(marketingAttendance.date));

    return attendanceData.map(a => ({
      ...a.marketing_attendance,
      user: a.users
    }));
  }

  async updateAttendanceStatus(id: string, status: string): Promise<MarketingAttendance> {
    const [attendance] = await db
      .update(marketingAttendance)
      .set({ 
        attendanceStatus: status, 
        updatedAt: new Date() 
      })
      .where(eq(marketingAttendance.id, id))
      .returning();
    return attendance;
  }

  async getMarketingTeamAttendanceSummary(): Promise<any> {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all marketing employees
    const marketingEmployees = await db
      .select()
      .from(users)
      .where(and(
        eq(users.isActive, true),
        eq(users.department, 'marketing')
      ));

    // Get monthly attendance for each employee
    const employeeSummaries = await Promise.all(
      marketingEmployees.map(async (employee) => {
        const monthlyAttendance = await db
          .select({ count: count() })
          .from(marketingAttendance)
          .where(and(
            eq(marketingAttendance.userId, employee.id),
            gte(marketingAttendance.date, thisMonthStart),
            eq(marketingAttendance.attendanceStatus, 'present')
          ));

        const totalWorkingDays = today.getDate();
        const attendanceRate = totalWorkingDays > 0 ? 
          ((monthlyAttendance[0]?.count || 0) / totalWorkingDays * 100) : 0;

        return {
          employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email
          },
          monthlyAttendance: monthlyAttendance[0]?.count || 0,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          totalWorkingDays
        };
      })
    );

    return {
      totalEmployees: marketingEmployees.length,
      summaries: employeeSummaries,
      month: today.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  }

  // MARKETING ANALYTICS AND DASHBOARD METHODS
  async getMarketingDashboardMetrics(): Promise<any> {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    // Get lead metrics
    const leadMetrics = await this.getLeadsConversionMetrics();
    
    // Get visit metrics
    const visitMetrics = await this.getVisitMetrics();
    
    // Get task metrics
    const taskMetrics = await this.getTaskMetrics();
    
    // Get attendance metrics
    const attendanceMetrics = await this.getMarketingAttendanceMetrics();

    // Get this month's new leads
    const monthlyNewLeads = await db
      .select({ count: count() })
      .from(leads)
      .where(gte(leads.createdAt, thisMonthStart));

    // Get this week's field visits
    const weeklyVisits = await db
      .select({ count: count() })
      .from(fieldVisits)
      .where(and(
        gte(fieldVisits.plannedDate, thisWeekStart),
        eq(fieldVisits.status, 'completed')
      ));

    // Get pending follow-ups
    const pendingFollowUps = await db
      .select({ count: count() })
      .from(leads)
      .where(and(
        lte(leads.followUpDate, today),
        sql`${leads.status} NOT IN ('converted', 'dropped')`,
        eq(leads.isActive, true)
      ));

    return {
      leads: {
        total: leadMetrics.totalLeads,
        active: leadMetrics.activeLeads,
        converted: leadMetrics.convertedLeads,
        conversionRate: leadMetrics.conversionRate,
        monthlyNew: monthlyNewLeads[0]?.count || 0,
        pendingFollowUps: pendingFollowUps[0]?.count || 0
      },
      visits: {
        total: visitMetrics.totalVisits,
        completed: visitMetrics.completedVisits,
        today: visitMetrics.todayVisits,
        successRate: visitMetrics.successRate,
        weeklyCompleted: weeklyVisits[0]?.count || 0
      },
      tasks: {
        total: taskMetrics.totalTasks,
        completed: taskMetrics.completedTasks,
        overdue: taskMetrics.overdueTasks,
        today: taskMetrics.todayTasks,
        completionRate: taskMetrics.completionRate
      },
      attendance: {
        totalEmployees: attendanceMetrics.totalEmployees,
        presentToday: attendanceMetrics.presentToday,
        averageHoursThisWeek: attendanceMetrics.averageHoursThisWeek,
        monthlyAttendanceCount: attendanceMetrics.monthlyAttendanceCount
      }
    };
  }

  async getLeadConversionRates(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Last 30 days
    const last30DaysLeads = await db.select({ count: count() }).from(leads)
      .where(gte(leads.createdAt, thirtyDaysAgo));
    const last30DaysConverted = await db.select({ count: count() }).from(leads)
      .where(and(
        gte(leads.createdAt, thirtyDaysAgo),
        eq(leads.status, 'converted')
      ));

    // Last 60 days
    const last60DaysLeads = await db.select({ count: count() }).from(leads)
      .where(gte(leads.createdAt, sixtyDaysAgo));
    const last60DaysConverted = await db.select({ count: count() }).from(leads)
      .where(and(
        gte(leads.createdAt, sixtyDaysAgo),
        eq(leads.status, 'converted')
      ));

    // Last 90 days
    const last90DaysLeads = await db.select({ count: count() }).from(leads)
      .where(gte(leads.createdAt, ninetyDaysAgo));
    const last90DaysConverted = await db.select({ count: count() }).from(leads)
      .where(and(
        gte(leads.createdAt, ninetyDaysAgo),
        eq(leads.status, 'converted')
      ));

    // Conversion by source
    const conversionBySource = await db
      .select({
        source: leads.source,
        total: count(),
        converted: sum(sql`CASE WHEN ${leads.status} = 'converted' THEN 1 ELSE 0 END`)
      })
      .from(leads)
      .groupBy(leads.source);

    return {
      last30Days: {
        totalLeads: last30DaysLeads[0]?.count || 0,
        convertedLeads: last30DaysConverted[0]?.count || 0,
        conversionRate: last30DaysLeads[0]?.count ? 
          ((last30DaysConverted[0]?.count || 0) / last30DaysLeads[0].count * 100) : 0
      },
      last60Days: {
        totalLeads: last60DaysLeads[0]?.count || 0,
        convertedLeads: last60DaysConverted[0]?.count || 0,
        conversionRate: last60DaysLeads[0]?.count ? 
          ((last60DaysConverted[0]?.count || 0) / last60DaysLeads[0].count * 100) : 0
      },
      last90Days: {
        totalLeads: last90DaysLeads[0]?.count || 0,
        convertedLeads: last90DaysConverted[0]?.count || 0,
        conversionRate: last90DaysLeads[0]?.count ? 
          ((last90DaysConverted[0]?.count || 0) / last90DaysLeads[0].count * 100) : 0
      },
      bySource: conversionBySource.map(item => ({
        source: item.source,
        totalLeads: item.total,
        convertedLeads: parseInt(item.converted?.toString() || '0'),
        conversionRate: item.total ? 
          (parseInt(item.converted?.toString() || '0') / item.total * 100) : 0
      }))
    };
  }

  async getMarketingTeamPerformance(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all marketing employees
    const marketingEmployees = await db
      .select()
      .from(users)
      .where(and(
        eq(users.isActive, true),
        eq(users.department, 'marketing')
      ));

    const performance = await Promise.all(
      marketingEmployees.map(async (employee) => {
        // Lead metrics
        const assignedLeads = await db.select({ count: count() }).from(leads)
          .where(eq(leads.assignedTo, employee.id));
        const convertedLeads = await db.select({ count: count() }).from(leads)
          .where(and(
            eq(leads.assignedTo, employee.id),
            eq(leads.status, 'converted')
          ));

        // Visit metrics
        const totalVisits = await db.select({ count: count() }).from(fieldVisits)
          .where(eq(fieldVisits.assignedTo, employee.id));
        const completedVisits = await db.select({ count: count() }).from(fieldVisits)
          .where(and(
            eq(fieldVisits.assignedTo, employee.id),
            eq(fieldVisits.status, 'completed')
          ));

        // Task metrics
        const assignedTasks = await db.select({ count: count() }).from(marketingTasks)
          .where(eq(marketingTasks.assignedTo, employee.id));
        const completedTasks = await db.select({ count: count() }).from(marketingTasks)
          .where(and(
            eq(marketingTasks.assignedTo, employee.id),
            eq(marketingTasks.status, 'completed')
          ));

        // Recent activity (last 30 days)
        const recentLeads = await db.select({ count: count() }).from(leads)
          .where(and(
            eq(leads.assignedTo, employee.id),
            gte(leads.createdAt, thirtyDaysAgo)
          ));
        const recentVisits = await db.select({ count: count() }).from(fieldVisits)
          .where(and(
            eq(fieldVisits.assignedTo, employee.id),
            gte(fieldVisits.plannedDate, thirtyDaysAgo)
          ));

        const leadConversionRate = assignedLeads[0]?.count ? 
          ((convertedLeads[0]?.count || 0) / assignedLeads[0].count * 100) : 0;
        const visitSuccessRate = totalVisits[0]?.count ? 
          ((completedVisits[0]?.count || 0) / totalVisits[0].count * 100) : 0;
        const taskCompletionRate = assignedTasks[0]?.count ? 
          ((completedTasks[0]?.count || 0) / assignedTasks[0].count * 100) : 0;

        return {
          employee: {
            id: employee.id,
            name: `${employee.firstName} ${employee.lastName}`,
            email: employee.email
          },
          leads: {
            total: assignedLeads[0]?.count || 0,
            converted: convertedLeads[0]?.count || 0,
            conversionRate: Math.round(leadConversionRate * 100) / 100,
            recent: recentLeads[0]?.count || 0
          },
          visits: {
            total: totalVisits[0]?.count || 0,
            completed: completedVisits[0]?.count || 0,
            successRate: Math.round(visitSuccessRate * 100) / 100,
            recent: recentVisits[0]?.count || 0
          },
          tasks: {
            total: assignedTasks[0]?.count || 0,
            completed: completedTasks[0]?.count || 0,
            completionRate: Math.round(taskCompletionRate * 100) / 100
          }
        };
      })
    );

    return {
      teamSize: marketingEmployees.length,
      performance: performance.sort((a, b) => b.leads.conversionRate - a.leads.conversionRate)
    };
  }

  async getVisitSuccessRates(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Overall success rates
    const totalVisits = await db.select({ count: count() }).from(fieldVisits);
    const completedVisits = await db.select({ count: count() }).from(fieldVisits)
      .where(eq(fieldVisits.status, 'completed'));
    const successfulVisits = await db.select({ count: count() }).from(fieldVisits)
      .where(sql`${fieldVisits.outcome} ILIKE '%success%' OR ${fieldVisits.outcome} ILIKE '%positive%'`);

    // Recent trends (last 30 days)
    const recentVisits = await db.select({ count: count() }).from(fieldVisits)
      .where(gte(fieldVisits.plannedDate, thirtyDaysAgo));
    const recentCompleted = await db.select({ count: count() }).from(fieldVisits)
      .where(and(
        gte(fieldVisits.plannedDate, thirtyDaysAgo),
        eq(fieldVisits.status, 'completed')
      ));

    // Success by purpose
    const successByPurpose = await db
      .select({
        purpose: fieldVisits.purpose,
        total: count(),
        completed: sum(sql`CASE WHEN ${fieldVisits.status} = 'completed' THEN 1 ELSE 0 END`)
      })
      .from(fieldVisits)
      .groupBy(fieldVisits.purpose);

    const overallSuccessRate = totalVisits[0]?.count ? 
      ((completedVisits[0]?.count || 0) / totalVisits[0].count * 100) : 0;
    const recentSuccessRate = recentVisits[0]?.count ? 
      ((recentCompleted[0]?.count || 0) / recentVisits[0].count * 100) : 0;
    const positiveOutcomeRate = totalVisits[0]?.count ? 
      ((successfulVisits[0]?.count || 0) / totalVisits[0].count * 100) : 0;

    return {
      overall: {
        totalVisits: totalVisits[0]?.count || 0,
        completedVisits: completedVisits[0]?.count || 0,
        successRate: Math.round(overallSuccessRate * 100) / 100,
        positiveOutcomeRate: Math.round(positiveOutcomeRate * 100) / 100
      },
      recent: {
        totalVisits: recentVisits[0]?.count || 0,
        completedVisits: recentCompleted[0]?.count || 0,
        successRate: Math.round(recentSuccessRate * 100) / 100
      },
      byPurpose: successByPurpose.map(item => ({
        purpose: item.purpose,
        totalVisits: item.total,
        completedVisits: parseInt(item.completed?.toString() || '0'),
        successRate: item.total ? 
          (parseInt(item.completed?.toString() || '0') / item.total * 100) : 0
      }))
    };
  }

  // ===== LOGISTICS MODULE IMPLEMENTATIONS =====

  // Logistics Shipments - Basic CRUD
  async getLogisticsShipment(id: string): Promise<any> {
    const [shipment] = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .leftJoin(users, eq(logisticsShipments.assignedTo, users.id))
      .where(eq(logisticsShipments.id, id));
    
    if (!shipment) return undefined;
    
    return {
      ...shipment.logistics_shipments,
      client: shipment.customers,
      vendor: shipment.suppliers,
      assignedEmployee: shipment.users
    };
  }

  async getLogisticsShipments(): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .leftJoin(users, eq(logisticsShipments.assignedTo, users.id))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers,
      assignedEmployee: s.users
    }));
  }

  async createLogisticsShipment(shipment: InsertLogisticsShipment): Promise<LogisticsShipment> {
    const [newShipment] = await db
      .insert(logisticsShipments)
      .values(shipment)
      .returning();
    return newShipment;
  }

  async updateLogisticsShipment(id: string, shipment: Partial<InsertLogisticsShipment>): Promise<LogisticsShipment> {
    const [updatedShipment] = await db
      .update(logisticsShipments)
      .set(shipment)
      .where(eq(logisticsShipments.id, id))
      .returning();
    return updatedShipment;
  }

  async deleteLogisticsShipment(id: string): Promise<void> {
    await db.delete(logisticsShipments).where(eq(logisticsShipments.id, id));
  }

  // Logistics Shipments - Specialized queries
  async getLogisticsShipmentsByStatus(status: string): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(eq(logisticsShipments.currentStatus, status as any))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers
    }));
  }

  async getLogisticsShipmentsByEmployee(userId: string): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(eq(logisticsShipments.assignedTo, userId))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers
    }));
  }

  async getLogisticsShipmentsByClient(clientId: string): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .where(eq(logisticsShipments.clientId, clientId))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers
    }));
  }

  async getLogisticsShipmentsByVendor(vendorId: string): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(eq(logisticsShipments.vendorId, vendorId))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      vendor: s.suppliers
    }));
  }

  async getLogisticsShipmentsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(and(
        gte(logisticsShipments.createdAt, startDate),
        lte(logisticsShipments.createdAt, endDate)
      ))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers
    }));
  }

  // Logistics Shipments - Workflow operations
  async updateShipmentStatus(id: string, statusData: any): Promise<LogisticsShipment> {
    // Update shipment status
    const [updatedShipment] = await db
      .update(logisticsShipments)
      .set({ 
        currentStatus: statusData.status,
        updatedAt: new Date()
      })
      .where(eq(logisticsShipments.id, id))
      .returning();

    // Create status update record
    await db.insert(logisticsStatusUpdates).values({
      shipmentId: id,
      status: statusData.status,
      location: statusData.location,
      notes: statusData.notes,
      podObjectKey: statusData.podObjectKey,
      updatedBy: statusData.updatedBy
    });

    return updatedShipment;
  }

  async getShipmentTimeline(id: string): Promise<any[]> {
    const timeline = await db
      .select()
      .from(logisticsStatusUpdates)
      .leftJoin(users, eq(logisticsStatusUpdates.updatedBy, users.id))
      .where(eq(logisticsStatusUpdates.shipmentId, id))
      .orderBy(asc(logisticsStatusUpdates.timestamp));

    return timeline.map(t => ({
      ...t.logistics_status_updates,
      updatedByUser: t.users
    }));
  }

  async getActiveShipments(): Promise<any[]> {
    const activeStatuses = ['created', 'packed', 'dispatched', 'in_transit', 'out_for_delivery'];
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(sql`${logisticsShipments.currentStatus} = ANY(${activeStatuses})`)
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers
    }));
  }

  async getOverdueShipments(): Promise<any[]> {
    const today = new Date();
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(and(
        lt(logisticsShipments.expectedDeliveryDate, today),
        sql`${logisticsShipments.currentStatus} NOT IN ('delivered', 'closed')`
      ))
      .orderBy(asc(logisticsShipments.expectedDeliveryDate));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers
    }));
  }

  async closeShipment(id: string, podData: any): Promise<LogisticsShipment> {
    const now = new Date();
    
    // Update shipment to closed status
    const [closedShipment] = await db
      .update(logisticsShipments)
      .set({
        currentStatus: 'closed',
        closedAt: now,
        podObjectKey: podData.podObjectKey,
        podUploadedAt: now,
        podUploadedBy: podData.uploadedBy,
        updatedAt: now
      })
      .where(eq(logisticsShipments.id, id))
      .returning();

    // Create final status update
    await db.insert(logisticsStatusUpdates).values({
      shipmentId: id,
      status: 'closed',
      notes: podData.notes || 'Shipment closed with POD',
      podObjectKey: podData.podObjectKey,
      updatedBy: podData.uploadedBy
    });

    return closedShipment;
  }

  async searchShipments(query: string): Promise<any[]> {
    const shipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(like(logisticsShipments.consignmentNumber, `%${query}%`))
      .orderBy(desc(logisticsShipments.createdAt));

    return shipments.map(s => ({
      ...s.logistics_shipments,
      client: s.customers,
      vendor: s.suppliers
    }));
  }

  // Logistics Status Updates - Basic CRUD
  async getLogisticsStatusUpdate(id: string): Promise<any> {
    const [statusUpdate] = await db
      .select()
      .from(logisticsStatusUpdates)
      .leftJoin(users, eq(logisticsStatusUpdates.updatedBy, users.id))
      .leftJoin(logisticsShipments, eq(logisticsStatusUpdates.shipmentId, logisticsShipments.id))
      .where(eq(logisticsStatusUpdates.id, id));
    
    if (!statusUpdate) return undefined;
    
    return {
      ...statusUpdate.logistics_status_updates,
      updatedByUser: statusUpdate.users,
      shipment: statusUpdate.logistics_shipments
    };
  }

  async getLogisticsStatusUpdates(): Promise<any[]> {
    const statusUpdates = await db
      .select()
      .from(logisticsStatusUpdates)
      .leftJoin(users, eq(logisticsStatusUpdates.updatedBy, users.id))
      .leftJoin(logisticsShipments, eq(logisticsStatusUpdates.shipmentId, logisticsShipments.id))
      .orderBy(desc(logisticsStatusUpdates.timestamp));

    return statusUpdates.map(u => ({
      ...u.logistics_status_updates,
      updatedByUser: u.users,
      shipment: u.logistics_shipments
    }));
  }

  async createLogisticsStatusUpdate(update: InsertLogisticsStatusUpdate): Promise<LogisticsStatusUpdate> {
    const [newUpdate] = await db
      .insert(logisticsStatusUpdates)
      .values(update)
      .returning();
    return newUpdate;
  }

  async updateLogisticsStatusUpdate(id: string, update: Partial<InsertLogisticsStatusUpdate>): Promise<LogisticsStatusUpdate> {
    const [updatedUpdate] = await db
      .update(logisticsStatusUpdates)
      .set(update)
      .where(eq(logisticsStatusUpdates.id, id))
      .returning();
    return updatedUpdate;
  }

  async deleteLogisticsStatusUpdate(id: string): Promise<void> {
    await db.delete(logisticsStatusUpdates).where(eq(logisticsStatusUpdates.id, id));
  }

  async getStatusUpdatesByShipment(shipmentId: string): Promise<any[]> {
    const statusUpdates = await db
      .select()
      .from(logisticsStatusUpdates)
      .leftJoin(users, eq(logisticsStatusUpdates.updatedBy, users.id))
      .where(eq(logisticsStatusUpdates.shipmentId, shipmentId))
      .orderBy(asc(logisticsStatusUpdates.timestamp));

    return statusUpdates.map(u => ({
      ...u.logistics_status_updates,
      updatedByUser: u.users
    }));
  }

  async getStatusUpdatesByEmployee(userId: string): Promise<any[]> {
    const statusUpdates = await db
      .select()
      .from(logisticsStatusUpdates)
      .leftJoin(logisticsShipments, eq(logisticsStatusUpdates.shipmentId, logisticsShipments.id))
      .where(eq(logisticsStatusUpdates.updatedBy, userId))
      .orderBy(desc(logisticsStatusUpdates.timestamp));

    return statusUpdates.map(u => ({
      ...u.logistics_status_updates,
      shipment: u.logistics_shipments
    }));
  }

  async getStatusUpdatesByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const statusUpdates = await db
      .select()
      .from(logisticsStatusUpdates)
      .leftJoin(users, eq(logisticsStatusUpdates.updatedBy, users.id))
      .leftJoin(logisticsShipments, eq(logisticsStatusUpdates.shipmentId, logisticsShipments.id))
      .where(and(
        gte(logisticsStatusUpdates.timestamp, startDate),
        lte(logisticsStatusUpdates.timestamp, endDate)
      ))
      .orderBy(desc(logisticsStatusUpdates.timestamp));

    return statusUpdates.map(u => ({
      ...u.logistics_status_updates,
      updatedByUser: u.users,
      shipment: u.logistics_shipments
    }));
  }

  // Logistics Checkpoints - Basic CRUD
  async getLogisticsCheckpoint(id: string): Promise<any> {
    const [checkpoint] = await db
      .select()
      .from(logisticsCheckpoints)
      .leftJoin(users, eq(logisticsCheckpoints.addedBy, users.id))
      .leftJoin(logisticsShipments, eq(logisticsCheckpoints.shipmentId, logisticsShipments.id))
      .where(eq(logisticsCheckpoints.id, id));
    
    if (!checkpoint) return undefined;
    
    return {
      ...checkpoint.logistics_checkpoints,
      addedByUser: checkpoint.users,
      shipment: checkpoint.logistics_shipments
    };
  }

  async getLogisticsCheckpoints(): Promise<any[]> {
    const checkpoints = await db
      .select()
      .from(logisticsCheckpoints)
      .leftJoin(users, eq(logisticsCheckpoints.addedBy, users.id))
      .leftJoin(logisticsShipments, eq(logisticsCheckpoints.shipmentId, logisticsShipments.id))
      .orderBy(desc(logisticsCheckpoints.checkpointTime));

    return checkpoints.map(c => ({
      ...c.logistics_checkpoints,
      addedByUser: c.users,
      shipment: c.logistics_shipments
    }));
  }

  async createLogisticsCheckpoint(checkpoint: InsertLogisticsCheckpoint): Promise<LogisticsCheckpoint> {
    const [newCheckpoint] = await db
      .insert(logisticsCheckpoints)
      .values(checkpoint)
      .returning();
    return newCheckpoint;
  }

  async updateLogisticsCheckpoint(id: string, checkpoint: Partial<InsertLogisticsCheckpoint>): Promise<LogisticsCheckpoint> {
    const [updatedCheckpoint] = await db
      .update(logisticsCheckpoints)
      .set(checkpoint)
      .where(eq(logisticsCheckpoints.id, id))
      .returning();
    return updatedCheckpoint;
  }

  async deleteLogisticsCheckpoint(id: string): Promise<void> {
    await db.delete(logisticsCheckpoints).where(eq(logisticsCheckpoints.id, id));
  }

  async getCheckpointsByShipment(shipmentId: string): Promise<any[]> {
    const checkpoints = await db
      .select()
      .from(logisticsCheckpoints)
      .leftJoin(users, eq(logisticsCheckpoints.addedBy, users.id))
      .where(eq(logisticsCheckpoints.shipmentId, shipmentId))
      .orderBy(asc(logisticsCheckpoints.checkpointTime));

    return checkpoints.map(c => ({
      ...c.logistics_checkpoints,
      addedByUser: c.users
    }));
  }

  async getCheckpointsByEmployee(userId: string): Promise<any[]> {
    const checkpoints = await db
      .select()
      .from(logisticsCheckpoints)
      .leftJoin(logisticsShipments, eq(logisticsCheckpoints.shipmentId, logisticsShipments.id))
      .where(eq(logisticsCheckpoints.addedBy, userId))
      .orderBy(desc(logisticsCheckpoints.checkpointTime));

    return checkpoints.map(c => ({
      ...c.logistics_checkpoints,
      shipment: c.logistics_shipments
    }));
  }

  async getCheckpointsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    const checkpoints = await db
      .select()
      .from(logisticsCheckpoints)
      .leftJoin(users, eq(logisticsCheckpoints.addedBy, users.id))
      .leftJoin(logisticsShipments, eq(logisticsCheckpoints.shipmentId, logisticsShipments.id))
      .where(and(
        gte(logisticsCheckpoints.checkpointTime, startDate),
        lte(logisticsCheckpoints.checkpointTime, endDate)
      ))
      .orderBy(desc(logisticsCheckpoints.checkpointTime));

    return checkpoints.map(c => ({
      ...c.logistics_checkpoints,
      addedByUser: c.users,
      shipment: c.logistics_shipments
    }));
  }

  // Logistics Reports & Analytics
  async getLogisticsDashboardMetrics(): Promise<any> {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total shipments
    const totalShipments = await db
      .select({ count: count() })
      .from(logisticsShipments);

    // Active shipments
    const activeShipments = await db
      .select({ count: count() })
      .from(logisticsShipments)
      .where(sql`${logisticsShipments.currentStatus} NOT IN ('delivered', 'closed')`);

    // Delivered this month
    const monthlyDelivered = await db
      .select({ count: count() })
      .from(logisticsShipments)
      .where(and(
        gte(logisticsShipments.deliveredAt, thisMonthStart),
        eq(logisticsShipments.currentStatus, 'delivered')
      ));

    // On-time delivery rate
    const onTimeDeliveries = await db
      .select({ count: count() })
      .from(logisticsShipments)
      .where(and(
        sql`${logisticsShipments.deliveredAt} <= ${logisticsShipments.expectedDeliveryDate}`,
        sql`${logisticsShipments.currentStatus} IN ('delivered', 'closed')`
      ));

    const totalDeliveries = await db
      .select({ count: count() })
      .from(logisticsShipments)
      .where(sql`${logisticsShipments.currentStatus} IN ('delivered', 'closed')`);

    const onTimeRate = totalDeliveries[0]?.count ? 
      ((onTimeDeliveries[0]?.count || 0) / totalDeliveries[0].count * 100) : 0;

    return {
      totalShipments: totalShipments[0]?.count || 0,
      activeShipments: activeShipments[0]?.count || 0,
      monthlyDelivered: monthlyDelivered[0]?.count || 0,
      onTimeDeliveryRate: Math.round(onTimeRate * 100) / 100
    };
  }

  async getDailyShipmentsReport(date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyShipments = await db
      .select()
      .from(logisticsShipments)
      .leftJoin(customers, eq(logisticsShipments.clientId, customers.id))
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(and(
        gte(logisticsShipments.createdAt, startOfDay),
        lte(logisticsShipments.createdAt, endOfDay)
      ))
      .orderBy(desc(logisticsShipments.createdAt));

    const statusCounts = await db
      .select({
        status: logisticsShipments.currentStatus,
        count: count()
      })
      .from(logisticsShipments)
      .where(and(
        gte(logisticsShipments.createdAt, startOfDay),
        lte(logisticsShipments.createdAt, endOfDay)
      ))
      .groupBy(logisticsShipments.currentStatus);

    return {
      date: date.toISOString().split('T')[0],
      totalShipments: dailyShipments.length,
      shipments: dailyShipments.map(s => ({
        ...s.logistics_shipments,
        client: s.customers,
        vendor: s.suppliers
      })),
      statusBreakdown: statusCounts
    };
  }

  async getAverageDeliveryTime(dateRange?: { start: Date; end: Date }): Promise<any> {
    const conditions = [
      isNotNull(logisticsShipments.deliveredAt),
      isNotNull(logisticsShipments.dispatchDate)
    ];

    if (dateRange) {
      conditions.push(
        gte(logisticsShipments.deliveredAt, dateRange.start),
        lte(logisticsShipments.deliveredAt, dateRange.end)
      );
    }

    const query = db
      .select({
        avgDays: avg(sql`EXTRACT(EPOCH FROM (${logisticsShipments.deliveredAt} - ${logisticsShipments.dispatchDate})) / 86400`)
      })
      .from(logisticsShipments)
      .where(and(...conditions));

    const result = await query;
    const avgDays = result[0]?.avgDays ? parseFloat(result[0].avgDays) : 0;

    return {
      averageDeliveryDays: Math.round(avgDays * 100) / 100,
      dateRange: dateRange ? {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0]
      } : null
    };
  }

  async getVendorPerformanceReport(vendorId?: string): Promise<any[]> {
    const conditions = [isNotNull(logisticsShipments.vendorId)];
    
    if (vendorId) {
      conditions.push(eq(logisticsShipments.vendorId, vendorId));
    }

    const vendorQuery = db
      .select({
        vendorId: logisticsShipments.vendorId,
        vendorName: suppliers.name,
        totalShipments: count(),
        deliveredShipments: sum(sql`CASE WHEN ${logisticsShipments.currentStatus} IN ('delivered', 'closed') THEN 1 ELSE 0 END`),
        onTimeDeliveries: sum(sql`CASE WHEN ${logisticsShipments.deliveredAt} <= ${logisticsShipments.expectedDeliveryDate} AND ${logisticsShipments.currentStatus} IN ('delivered', 'closed') THEN 1 ELSE 0 END`),
        avgDeliveryDays: avg(sql`EXTRACT(EPOCH FROM (${logisticsShipments.deliveredAt} - ${logisticsShipments.dispatchDate})) / 86400`)
      })
      .from(logisticsShipments)
      .leftJoin(suppliers, eq(logisticsShipments.vendorId, suppliers.id))
      .where(and(...conditions))
      .groupBy(logisticsShipments.vendorId, suppliers.name);

    const vendors = await vendorQuery;

    return vendors.map(v => ({
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      totalShipments: v.totalShipments,
      deliveredShipments: parseInt(v.deliveredShipments?.toString() || '0'),
      onTimeDeliveries: parseInt(v.onTimeDeliveries?.toString() || '0'),
      deliveryRate: v.totalShipments ? 
        (parseInt(v.deliveredShipments?.toString() || '0') / v.totalShipments * 100) : 0,
      onTimeRate: parseInt(v.deliveredShipments?.toString() || '0') ? 
        (parseInt(v.onTimeDeliveries?.toString() || '0') / parseInt(v.deliveredShipments?.toString() || '1') * 100) : 0,
      avgDeliveryDays: v.avgDeliveryDays ? Math.round(parseFloat(v.avgDeliveryDays) * 100) / 100 : 0
    }));
  }

  async getShipmentVolumeMetrics(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyVolume = await db
      .select({
        date: sql`DATE(${logisticsShipments.createdAt})`,
        count: count()
      })
      .from(logisticsShipments)
      .where(gte(logisticsShipments.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${logisticsShipments.createdAt})`)
      .orderBy(sql`DATE(${logisticsShipments.createdAt})`);

    return {
      dailyVolume,
      totalLast30Days: dailyVolume.reduce((sum, day) => sum + day.count, 0),
      avgDailyVolume: dailyVolume.length ? 
        Math.round((dailyVolume.reduce((sum, day) => sum + day.count, 0) / dailyVolume.length) * 100) / 100 : 0
    };
  }

  async getDeliveryPerformanceMetrics(): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const performanceData = await db
      .select({
        totalShipments: count(),
        deliveredShipments: sum(sql`CASE WHEN ${logisticsShipments.currentStatus} IN ('delivered', 'closed') THEN 1 ELSE 0 END`),
        onTimeDeliveries: sum(sql`CASE WHEN ${logisticsShipments.deliveredAt} <= ${logisticsShipments.expectedDeliveryDate} AND ${logisticsShipments.currentStatus} IN ('delivered', 'closed') THEN 1 ELSE 0 END`),
        overdueShipments: sum(sql`CASE WHEN ${logisticsShipments.expectedDeliveryDate} < NOW() AND ${logisticsShipments.currentStatus} NOT IN ('delivered', 'closed') THEN 1 ELSE 0 END`)
      })
      .from(logisticsShipments)
      .where(gte(logisticsShipments.createdAt, thirtyDaysAgo));

    const data = performanceData[0];
    const totalShipments = data?.totalShipments || 0;
    const deliveredShipments = parseInt(data?.deliveredShipments?.toString() || '0');
    const onTimeDeliveries = parseInt(data?.onTimeDeliveries?.toString() || '0');
    const overdueShipments = parseInt(data?.overdueShipments?.toString() || '0');

    return {
      totalShipments,
      deliveredShipments,
      onTimeDeliveries,
      overdueShipments,
      deliveryRate: totalShipments ? (deliveredShipments / totalShipments * 100) : 0,
      onTimeRate: deliveredShipments ? (onTimeDeliveries / deliveredShipments * 100) : 0,
      overdueRate: totalShipments ? (overdueShipments / totalShipments * 100) : 0
    };
  }
}

export const storage = new DatabaseStorage();
