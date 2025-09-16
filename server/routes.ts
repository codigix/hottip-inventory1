import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { 
  insertUserSchema, insertProductSchema, insertCustomerSchema,
  insertOrderSchema, insertOrderItemSchema, insertSupplierSchema,
  insertShipmentSchema, insertTaskSchema, insertAttendanceSchema,
  insertOutboundQuotationSchema, insertQuotationItemSchema,
  insertInboundQuotationSchema, insertInboundQuotationItemSchema,
  insertInvoiceSchema, insertInvoiceItemSchema,
  insertStockTransactionSchema, insertSparePartSchema, insertBatchSchema,
  insertBarcodeSchema, insertFabricationOrderSchema, insertReorderPointSchema,
  insertVendorCommunicationSchema, insertInventoryTaskSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users Routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      await storage.createActivity({
        userId: user.id,
        action: "CREATE_USER",
        entityType: "user",
        entityId: user.id,
        details: `Created user: ${user.firstName} ${user.lastName}`,
      });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      await storage.createActivity({
        userId: user.id,
        action: "UPDATE_USER",
        entityType: "user",
        entityId: user.id,
        details: `Updated user: ${user.firstName} ${user.lastName}`,
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Products Routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const products = await storage.getLowStockProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_PRODUCT",
        entityType: "product",
        entityId: product.id,
        details: `Created product: ${product.name}`,
      });
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      await storage.createActivity({
        userId: null,
        action: "UPDATE_PRODUCT",
        entityType: "product",
        entityId: product.id,
        details: `Updated product: ${product.name}`,
      });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Customers Routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_CUSTOMER",
        entityType: "customer",
        entityId: customer.id,
        details: `Created customer: ${customer.name}`,
      });
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid customer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      await storage.createActivity({
        userId: null,
        action: "UPDATE_CUSTOMER",
        entityType: "customer",
        entityId: customer.id,
        details: `Updated customer: ${customer.name}`,
      });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Orders Routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      const items = await storage.getOrderItems(req.params.id);
      res.json({ ...order, items });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const validatedOrder = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrder);
      
      if (items && items.length > 0) {
        for (const item of items) {
          const validatedItem = insertOrderItemSchema.parse({
            ...item,
            orderId: order.id,
          });
          await storage.createOrderItem(validatedItem);
        }
      }

      await storage.createActivity({
        userId: order.userId,
        action: "CREATE_ORDER",
        entityType: "order",
        entityId: order.id,
        details: `Created order: ${order.orderNumber}`,
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, orderData);
      await storage.createActivity({
        userId: order.userId,
        action: "UPDATE_ORDER",
        entityType: "order",
        entityId: order.id,
        details: `Updated order: ${order.orderNumber}`,
      });
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      await storage.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // Suppliers Routes
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_SUPPLIER",
        entityType: "supplier",
        entityId: supplier.id,
        details: `Created supplier: ${supplier.name}`,
      });
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid supplier data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  // Shipments Routes
  app.get("/api/shipments", async (req, res) => {
    try {
      const shipments = await storage.getShipments();
      res.json(shipments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shipments" });
    }
  });

  app.post("/api/shipments", async (req, res) => {
    try {
      const shipmentData = insertShipmentSchema.parse(req.body);
      const shipment = await storage.createShipment(shipmentData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_SHIPMENT",
        entityType: "shipment",
        entityId: shipment.id,
        details: `Created shipment: ${shipment.shipmentNumber}`,
      });
      res.status(201).json(shipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid shipment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // Tasks Routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      await storage.createActivity({
        userId: task.assignedBy,
        action: "CREATE_TASK",
        entityType: "task",
        entityId: task.id,
        details: `Created task: ${task.title}`,
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, taskData);
      await storage.createActivity({
        userId: task.assignedTo,
        action: "UPDATE_TASK",
        entityType: "task",
        entityId: task.id,
        details: `Updated task: ${task.title}`,
      });
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Attendance Routes
  app.get("/api/attendance/:userId", async (req, res) => {
    try {
      const attendance = await storage.getAttendanceByUser(req.params.userId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid attendance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create attendance record" });
    }
  });

  // Outbound Quotations Routes
  app.get("/api/outbound-quotations", async (req, res) => {
    try {
      const quotations = await storage.getOutboundQuotations();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outbound quotations" });
    }
  });

  app.get("/api/outbound-quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getOutboundQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Outbound quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch outbound quotation" });
    }
  });

  app.post("/api/outbound-quotations", async (req, res) => {
    try {
      const quotationData = insertOutboundQuotationSchema.parse(req.body);
      const quotation = await storage.createOutboundQuotation(quotationData);
      await storage.createActivity({
        userId: quotation.userId,
        action: "CREATE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: quotation.id,
        details: `Created outbound quotation: ${quotation.quotationNumber}`,
      });
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quotation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create outbound quotation" });
    }
  });

  app.put("/api/outbound-quotations/:id", async (req, res) => {
    try {
      const quotationData = insertOutboundQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateOutboundQuotation(req.params.id, quotationData);
      await storage.createActivity({
        userId: quotation.userId,
        action: "UPDATE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: quotation.id,
        details: `Updated outbound quotation: ${quotation.quotationNumber}`,
      });
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update outbound quotation" });
    }
  });

  app.delete("/api/outbound-quotations/:id", async (req, res) => {
    try {
      await storage.deleteOutboundQuotation(req.params.id);
      await storage.createActivity({
        userId: null,
        action: "DELETE_OUTBOUND_QUOTATION",
        entityType: "outbound_quotation",
        entityId: req.params.id,
        details: `Deleted outbound quotation`,
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete outbound quotation" });
    }
  });

  app.post("/api/outbound-quotations/:id/convert-to-invoice", async (req, res) => {
    try {
      const invoice = await storage.convertQuotationToInvoice(req.params.id);
      await storage.createActivity({
        userId: invoice.userId,
        action: "CONVERT_QUOTATION_TO_INVOICE",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Converted quotation to invoice: ${invoice.invoiceNumber}`,
      });
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to convert quotation to invoice" });
    }
  });

  // Inbound Quotations Routes
  app.get("/api/inbound-quotations", async (req, res) => {
    try {
      const quotations = await storage.getInboundQuotations();
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbound quotations" });
    }
  });

  app.get("/api/inbound-quotations/:id", async (req, res) => {
    try {
      const quotation = await storage.getInboundQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ error: "Inbound quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inbound quotation" });
    }
  });

  app.post("/api/inbound-quotations", async (req, res) => {
    try {
      const quotationData = insertInboundQuotationSchema.parse(req.body);
      const quotation = await storage.createInboundQuotation(quotationData);
      await storage.createActivity({
        userId: quotation.userId,
        action: "CREATE_INBOUND_QUOTATION",
        entityType: "inbound_quotation",
        entityId: quotation.id,
        details: `Created inbound quotation: ${quotation.quotationNumber}`,
      });
      res.status(201).json(quotation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quotation data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create inbound quotation" });
    }
  });

  app.put("/api/inbound-quotations/:id", async (req, res) => {
    try {
      const quotationData = insertInboundQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateInboundQuotation(req.params.id, quotationData);
      await storage.createActivity({
        userId: quotation.userId,
        action: "UPDATE_INBOUND_QUOTATION",
        entityType: "inbound_quotation",
        entityId: quotation.id,
        details: `Updated inbound quotation: ${quotation.quotationNumber}`,
      });
      res.json(quotation);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inbound quotation" });
    }
  });

  // Invoice Routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(invoiceData);
      await storage.createActivity({
        userId: invoice.userId,
        action: "CREATE_INVOICE",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Created invoice: ${invoice.invoiceNumber}`,
      });
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid invoice data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      await storage.createActivity({
        userId: invoice.userId,
        action: "UPDATE_INVOICE",
        entityType: "invoice",
        entityId: invoice.id,
        details: `Updated invoice: ${invoice.invoiceNumber}`,
      });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  // Dashboard & Analytics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Object Storage Routes for File Upload
  
  // This endpoint is used to serve private objects (quotation attachments)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // This endpoint is used to get the upload URL for an object entity
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Update inbound quotation with attachment info after upload
  app.put("/api/inbound-quotations/:id/attachment", async (req, res) => {
    if (!req.body.attachmentURL) {
      return res.status(400).json({ error: "attachmentURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.attachmentURL,
      );
      
      // Update the inbound quotation with attachment info
      const quotation = await storage.updateInboundQuotation(req.params.id, {
        attachmentPath: objectPath,
        attachmentName: req.body.attachmentName || "uploaded-file",
      });

      res.status(200).json({
        objectPath: objectPath,
        quotation: quotation,
      });
    } catch (error) {
      console.error("Error updating quotation attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Stock Transactions Routes
  app.get("/api/stock-transactions", async (req, res) => {
    try {
      const transactions = await storage.getStockTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock transactions" });
    }
  });

  app.get("/api/stock-transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getStockTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Stock transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock transaction" });
    }
  });

  app.post("/api/stock-transactions", async (req, res) => {
    try {
      const transactionData = insertStockTransactionSchema.parse(req.body);
      const transaction = await storage.createStockTransaction(transactionData);
      await storage.createActivity({
        userId: transaction.userId,
        action: "CREATE_STOCK_TRANSACTION",
        entityType: "stock_transaction",
        entityId: transaction.id,
        details: `Created stock transaction: ${transaction.type} ${transaction.quantity} units`,
      });
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid transaction data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create stock transaction" });
    }
  });

  app.put("/api/stock-transactions/:id", async (req, res) => {
    try {
      const transactionData = insertStockTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateStockTransaction(req.params.id, transactionData);
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update stock transaction" });
    }
  });

  app.delete("/api/stock-transactions/:id", async (req, res) => {
    try {
      await storage.deleteStockTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete stock transaction" });
    }
  });

  // Spare Parts Routes
  app.get("/api/spare-parts", async (req, res) => {
    try {
      const spareParts = await storage.getSpareParts();
      res.json(spareParts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spare parts" });
    }
  });

  app.get("/api/spare-parts/low-stock", async (req, res) => {
    try {
      const spareParts = await storage.getLowStockSpareParts();
      res.json(spareParts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock spare parts" });
    }
  });

  app.get("/api/spare-parts/:id", async (req, res) => {
    try {
      const sparePart = await storage.getSparePart(req.params.id);
      if (!sparePart) {
        return res.status(404).json({ error: "Spare part not found" });
      }
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch spare part" });
    }
  });

  app.post("/api/spare-parts", async (req, res) => {
    try {
      const sparePartData = insertSparePartSchema.parse(req.body);
      const sparePart = await storage.createSparePart(sparePartData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_SPARE_PART",
        entityType: "spare_part",
        entityId: sparePart.id,
        details: `Created spare part: ${sparePart.name}`,
      });
      res.status(201).json(sparePart);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid spare part data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create spare part" });
    }
  });

  app.put("/api/spare-parts/:id", async (req, res) => {
    try {
      const sparePartData = insertSparePartSchema.partial().parse(req.body);
      const sparePart = await storage.updateSparePart(req.params.id, sparePartData);
      res.json(sparePart);
    } catch (error) {
      res.status(500).json({ error: "Failed to update spare part" });
    }
  });

  app.delete("/api/spare-parts/:id", async (req, res) => {
    try {
      await storage.deleteSparePart(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete spare part" });
    }
  });

  // Batches Routes
  app.get("/api/batches", async (req, res) => {
    try {
      const batches = await storage.getBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.get("/api/batches/:id", async (req, res) => {
    try {
      const batch = await storage.getBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.json(batch);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  app.post("/api/batches", async (req, res) => {
    try {
      const batchData = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(batchData);
      await storage.createActivity({
        userId: null,
        action: "CREATE_BATCH",
        entityType: "batch",
        entityId: batch.id,
        details: `Created batch: ${batch.batchNumber}`,
      });
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid batch data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.put("/api/batches/:id", async (req, res) => {
    try {
      const batchData = insertBatchSchema.partial().parse(req.body);
      const batch = await storage.updateBatch(req.params.id, batchData);
      res.json(batch);
    } catch (error) {
      res.status(500).json({ error: "Failed to update batch" });
    }
  });

  app.delete("/api/batches/:id", async (req, res) => {
    try {
      await storage.deleteBatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  // Barcodes Routes
  app.get("/api/barcodes", async (req, res) => {
    try {
      const barcodes = await storage.getBarcodes();
      res.json(barcodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barcodes" });
    }
  });

  app.get("/api/barcodes/:id", async (req, res) => {
    try {
      const barcode = await storage.getBarcode(req.params.id);
      if (!barcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }
      res.json(barcode);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch barcode" });
    }
  });

  app.get("/api/barcodes/scan/:code", async (req, res) => {
    try {
      const barcode = await storage.getBarcodeByCode(req.params.code);
      if (!barcode) {
        return res.status(404).json({ error: "Barcode not found" });
      }
      res.json(barcode);
    } catch (error) {
      res.status(500).json({ error: "Failed to scan barcode" });
    }
  });

  app.post("/api/barcodes", async (req, res) => {
    try {
      const barcodeData = insertBarcodeSchema.parse(req.body);
      const barcode = await storage.createBarcode(barcodeData);
      res.status(201).json(barcode);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid barcode data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create barcode" });
    }
  });

  app.delete("/api/barcodes/:id", async (req, res) => {
    try {
      await storage.deleteBarcode(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete barcode" });
    }
  });

  // Fabrication Orders Routes
  app.get("/api/fabrication-orders", async (req, res) => {
    try {
      const orders = await storage.getFabricationOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fabrication orders" });
    }
  });

  app.get("/api/fabrication-orders/:id", async (req, res) => {
    try {
      const order = await storage.getFabricationOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Fabrication order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch fabrication order" });
    }
  });

  app.post("/api/fabrication-orders", async (req, res) => {
    try {
      const orderData = insertFabricationOrderSchema.parse(req.body);
      const order = await storage.createFabricationOrder(orderData);
      await storage.createActivity({
        userId: order.createdBy,
        action: "CREATE_FABRICATION_ORDER",
        entityType: "fabrication_order",
        entityId: order.id,
        details: `Created fabrication order: ${order.orderNumber}`,
      });
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid fabrication order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create fabrication order" });
    }
  });

  app.put("/api/fabrication-orders/:id", async (req, res) => {
    try {
      const orderData = insertFabricationOrderSchema.partial().parse(req.body);
      const order = await storage.updateFabricationOrder(req.params.id, orderData);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update fabrication order" });
    }
  });

  app.delete("/api/fabrication-orders/:id", async (req, res) => {
    try {
      await storage.deleteFabricationOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete fabrication order" });
    }
  });

  // Reorder Points Routes
  app.get("/api/reorder-points", async (req, res) => {
    try {
      const reorderPoints = await storage.getReorderPoints();
      res.json(reorderPoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reorder points" });
    }
  });

  app.get("/api/reorder-points/triggered", async (req, res) => {
    try {
      const triggeredPoints = await storage.getTriggeredReorderPoints();
      res.json(triggeredPoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch triggered reorder points" });
    }
  });

  app.get("/api/reorder-points/:id", async (req, res) => {
    try {
      const reorderPoint = await storage.getReorderPoint(req.params.id);
      if (!reorderPoint) {
        return res.status(404).json({ error: "Reorder point not found" });
      }
      res.json(reorderPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reorder point" });
    }
  });

  app.post("/api/reorder-points", async (req, res) => {
    try {
      const reorderPointData = insertReorderPointSchema.parse(req.body);
      const reorderPoint = await storage.createReorderPoint(reorderPointData);
      res.status(201).json(reorderPoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid reorder point data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create reorder point" });
    }
  });

  app.put("/api/reorder-points/:id", async (req, res) => {
    try {
      const reorderPointData = insertReorderPointSchema.partial().parse(req.body);
      const reorderPoint = await storage.updateReorderPoint(req.params.id, reorderPointData);
      res.json(reorderPoint);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reorder point" });
    }
  });

  app.delete("/api/reorder-points/:id", async (req, res) => {
    try {
      await storage.deleteReorderPoint(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reorder point" });
    }
  });

  // Vendor Communications Routes
  app.get("/api/vendor-communications", async (req, res) => {
    try {
      const communications = await storage.getVendorCommunications();
      res.json(communications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor communications" });
    }
  });

  app.get("/api/vendor-communications/:id", async (req, res) => {
    try {
      const communication = await storage.getVendorCommunication(req.params.id);
      if (!communication) {
        return res.status(404).json({ error: "Vendor communication not found" });
      }
      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vendor communication" });
    }
  });

  app.post("/api/vendor-communications", async (req, res) => {
    try {
      const communicationData = insertVendorCommunicationSchema.parse(req.body);
      const communication = await storage.createVendorCommunication(communicationData);
      await storage.createActivity({
        userId: communication.userId,
        action: "CREATE_VENDOR_COMMUNICATION",
        entityType: "vendor_communication",
        entityId: communication.id,
        details: `Created vendor communication: ${communication.subject}`,
      });
      res.status(201).json(communication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid communication data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create vendor communication" });
    }
  });

  app.put("/api/vendor-communications/:id", async (req, res) => {
    try {
      const communicationData = insertVendorCommunicationSchema.partial().parse(req.body);
      const communication = await storage.updateVendorCommunication(req.params.id, communicationData);
      res.json(communication);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vendor communication" });
    }
  });

  app.delete("/api/vendor-communications/:id", async (req, res) => {
    try {
      await storage.deleteVendorCommunication(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vendor communication" });
    }
  });

  // Inventory Tasks Routes
  app.get("/api/inventory-tasks", async (req, res) => {
    try {
      const tasks = await storage.getInventoryTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory tasks" });
    }
  });

  app.get("/api/inventory-tasks/:id", async (req, res) => {
    try {
      const task = await storage.getInventoryTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Inventory task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory task" });
    }
  });

  app.post("/api/inventory-tasks", async (req, res) => {
    try {
      const taskData = insertInventoryTaskSchema.parse(req.body);
      const task = await storage.createInventoryTask(taskData);
      await storage.createActivity({
        userId: task.assignedBy,
        action: "CREATE_INVENTORY_TASK",
        entityType: "inventory_task",
        entityId: task.id,
        details: `Created inventory task: ${task.title}`,
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create inventory task" });
    }
  });

  app.put("/api/inventory-tasks/:id", async (req, res) => {
    try {
      const taskData = insertInventoryTaskSchema.partial().parse(req.body);
      const task = await storage.updateInventoryTask(req.params.id, taskData);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update inventory task" });
    }
  });

  app.delete("/api/inventory-tasks/:id", async (req, res) => {
    try {
      await storage.deleteInventoryTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete inventory task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
