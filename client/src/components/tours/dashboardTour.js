export const dashboardTour = {
  name: "admin-dashboard",
  steps: [
    {
      element: "[data-tour='welcome-header']",
      title: "Welcome to Admin Dashboard",
      text: "This is your main control center. Here you can monitor system-wide metrics and manage all departments.",
      position: "bottom",
    },
    {
      element: "[data-tour='system-activity']",
      title: "System Activity",
      text: "View real-time system activity and operational status. The donut chart shows the percentage of active operations.",
      position: "bottom",
    },
    {
      element: "[data-tour='growth-trends']",
      title: "Growth Trends",
      text: "Monitor growth trends over the last 6 months. This helps you identify patterns and plan accordingly.",
      position: "bottom",
    },
    {
      element: "[data-tour='department-activity']",
      title: "Department Overview",
      text: "See which departments are most active. This helps you understand workload distribution across your organization.",
      position: "top",
    },
    {
      element: "[data-tour='navigation-menu']",
      title: "Navigation Menu",
      text: "Use the navigation menu to access different modules and features. Each icon represents a different department.",
      position: "right",
    },
    {
      element: "[data-tour='nav-dashboard']",
      title: "Dashboard Overview",
      text: "Click here to return to the main dashboard overview with system metrics and department activity.",
      position: "right",
    },
    {
      element: "[data-tour='nav-audit-log']",
      title: "Audit Log",
      text: "Access the audit log to track all system activities and user actions for compliance and security.",
      position: "right",
    },
    {
      element: "[data-tour='nav-settings']",
      title: "Master Settings",
      text: "Configure system-wide settings, user permissions, and application preferences.",
      position: "right",
    },
    {
      element: "[data-tour='nav-approvals']",
      title: "Approvals System",
      text: "Manage pending approvals for invoices, quotations, and other business processes.",
      position: "right",
    },
    {
      element: "[data-tour='nav-backup']",
      title: "Backup & Recovery",
      text: "Create backups and manage data recovery operations to ensure business continuity.",
      position: "right",
    },
    {
      element: "[data-tour='nav-reports']",
      title: "Reports & Analytics",
      text: "Generate comprehensive reports and analytics across all business modules.",
      position: "right",
    },
    {
      element: "[data-tour='nav-tasks']",
      title: "Task Console",
      text: "Monitor and manage system tasks, background processes, and scheduled operations.",
      position: "right",
    },
  ],
};

// Admin Subcomponent Tours
export const adminAuditLogTour = {
  name: "admin-audit-log",
  steps: [
    {
      element: "[data-tour='admin-audit-log-header']",
      title: "Audit Log Overview",
      text: "View all system activity, changes, and user actions for compliance and traceability.",
      position: "bottom",
    },
  ],
};

export const adminSettingsTour = {
  name: "admin-settings",
  steps: [
    {
      element: "[data-tour='admin-settings-gst-input']",
      title: "GST Number",
      text: "Enter your company's GST registration number for tax compliance.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-tax-rate-input']",
      title: "Tax Rate",
      text: "Set the default tax rate percentage for your invoices and quotations.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-bank-account-input']",
      title: "Bank Account Details",
      text: "Enter your bank account information including name, IFSC, and account number.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-payment-terms-input']",
      title: "Default Payment Terms",
      text: "Set the standard payment terms (e.g., 30 days) for your business transactions.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-save-button']",
      title: "Save Settings",
      text: "Click here to save all your master settings. These will apply system-wide.",
      position: "top",
    },
  ],
};

export const adminApprovalsTour = {
  name: "admin-approvals",
  steps: [
    {
      element: "[data-tour='admin-approvals-approve-button']",
      title: "Approve Requests",
      text: "Review and approve pending requests for quotations, invoices, leave requests, and payments.",
      position: "left",
    },
  ],
};

export const adminBackupTour = {
  name: "admin-backup",
  steps: [
    {
      element: "[data-tour='admin-backup-create-button']",
      title: "Create Backup",
      text: "Create a new system backup to ensure data safety and business continuity.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-backup-restore-button']",
      title: "Restore Backup",
      text: "Restore the system from a previous backup in case of data loss or corruption.",
      position: "left",
    },
  ],
};

export const adminReportsTour = {
  name: "admin-reports",
  steps: [
    {
      element: "[data-tour='admin-reports-export-button']",
      title: "Export Reports",
      text: "Export comprehensive reports in CSV format for analysis and record-keeping.",
      position: "top",
    },
  ],
};

export const inventoryTour = {
  name: "inventory-module",
  steps: [
    {
      element: "[data-tour='inventory-header']",
      title: "Inventory Module",
      text: "Welcome to the Inventory Module. Manage stock, vendors, and spare parts from here.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-dashboard']",
      title: "Inventory Dashboard",
      text: "View inventory overview, key metrics, and quick stats for your operations.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-stock-management']",
      title: "Stock Management",
      text: "Track and manage your inventory. Monitor stock levels, perform stock in/out operations, and view low-stock alerts.",
      position: "right",
      navigation: {
        path: "/inventory/stock",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='inventory-vendors']",
      title: "Vendor Management",
      text: "Manage supplier and vendor information. View their contact details and communication history.",
      position: "right",
      navigation: {
        path: "/inventory/vendors",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='inventory-spare-parts']",
      title: "Spare Parts & Fabrication",
      text: "Manage fabrication and inventory of spare parts for your operations.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-batch-barcode']",
      title: "Batch & Barcode",
      text: "Handle lot tracking and QR/barcode scanning for inventory management.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-tasks']",
      title: "Inventory Tasks",
      text: "Assign and manage inventory-related tasks for your team members.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-reports']",
      title: "Reports & Analytics",
      text: "Generate stock reports, vendor history, and inventory forecasts.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-attendance']",
      title: "Staff Attendance",
      text: "Track attendance and leave management for inventory team members.",
      position: "right",
    },
  ],
};

// Inventory Subcomponent Tours
export const inventoryStockManagementTour = {
  name: "inventory-stock-management",
  steps: [
    {
      element: "[data-tour='inventory-stock-in-button']",
      title: "Stock In",
      text: "Record incoming stock from purchases, returns, or adjustments. This increases your inventory levels.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-stock-out-button']",
      title: "Stock Out",
      text: "Record outgoing stock for sales, damage, or transfers. This decreases your inventory levels.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-refresh-button']",
      title: "Refresh Data",
      text: "Refresh the stock data to see the latest inventory levels and transactions.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-transaction-type-select']",
      title: "Transaction Type",
      text: "Choose whether this is a stock in (receiving) or stock out (issuing) transaction.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-product-select']",
      title: "Select Product",
      text: "Choose the product for this stock transaction from your inventory.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-quantity-input']",
      title: "Quantity",
      text: "Enter the quantity of items being added to or removed from stock.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-reason-select']",
      title: "Reason",
      text: "Specify the reason for this stock movement (purchase, sale, return, damage, etc.).",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-reference-input']",
      title: "Reference Number",
      text: "Enter the invoice number, PO number, or other reference for this transaction.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-notes-textarea']",
      title: "Notes",
      text: "Add any additional notes or comments about this stock transaction.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-save-transaction-button']",
      title: "Record Transaction",
      text: "Save this stock transaction to update your inventory levels.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-product-actions']",
      title: "Product Actions",
      text: "Click here to view product details, edit product information, or see transaction history.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-product-view']",
      title: "View Product Details",
      text: "View detailed information about this product including specifications and history.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-product-edit']",
      title: "Edit Product",
      text: "Modify product information such as name, SKU, category, stock levels, and pricing.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-edit-name-input']",
      title: "Product Name",
      text: "Update the product name as it appears in your catalog.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-sku-input']",
      title: "SKU",
      text: "Modify the Stock Keeping Unit identifier for this product.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-category-input']",
      title: "Category",
      text: "Change the product category for better organization.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-stock-input']",
      title: "Current Stock",
      text: "Update the current stock quantity for this product.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-threshold-input']",
      title: "Low Stock Threshold",
      text: "Set the minimum stock level that triggers low stock alerts.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-unit-input']",
      title: "Unit",
      text: "Specify the unit of measurement (pieces, kg, liters, etc.).",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-price-input']",
      title: "Price",
      text: "Update the selling price for this product.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-edit-description-textarea']",
      title: "Description",
      text: "Add or modify detailed product description and specifications.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-edit-save-button']",
      title: "Save Changes",
      text: "Save all the product modifications you've made.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-transaction-actions']",
      title: "Transaction Actions",
      text: "Click here to view detailed information about this stock transaction.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-transaction-view']",
      title: "View Transaction Details",
      text: "See complete details of this stock movement including notes and references.",
      position: "left",
    },
  ],
};

export const inventoryVendorManagementTour = {
  name: "inventory-vendor-management",
  steps: [
    {
      element: "[data-tour='inventory-add-vendor-button']",
      title: "Add New Vendor",
      text: "Add a new supplier or vendor to your database with their contact and business information.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-log-communication-button']",
      title: "Log Communication",
      text: "Record interactions with vendors including emails, calls, meetings, and orders.",
      position: "bottom",
    },
  ],
};

export const inventorySpareToursPrefabricationTour = {
  name: "inventory-spare-parts-fabrication",
  steps: [
    {
      element: "[data-tour='inventory-spare-parts-header']",
      title: "Spare Parts & Fabrication",
      text: "Manage spare parts inventory and track fabrication orders with status updates and scheduling.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-add-spare-part-button']",
      title: "Add New Spare Part",
      text: "Create a new spare part in your inventory with part number, specifications, and stock levels.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-spare-parts-table']",
      title: "Spare Parts List",
      text: "View all spare parts with their status, current stock, minimum stock levels, and fabrication time.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-fabrication-orders-tab']",
      title: "Fabrication Orders",
      text: "View and manage fabrication orders for spare parts with tracking and status management.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-add-fabrication-order-button']",
      title: "Create Fabrication Order",
      text: "Create a new fabrication order for a spare part with due dates and assignment.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-fabrication-orders-table']",
      title: "Fabrication Orders List",
      text: "Track all fabrication orders with their status, progress, and assigned personnel.",
      position: "top",
    },
  ],
};

export const inventoryBatchBarcodeTour = {
  name: "inventory-batch-barcode",
  steps: [
    {
      element: "[data-tour='inventory-batch-barcode-header']",
      title: "Batch & Barcode Management",
      text: "Manage product batches, generate QR codes, and handle barcode tracking for inventory items.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-create-batch-button']",
      title: "Create New Batch",
      text: "Create a new batch for your products with batch number, expiry date, and quantity.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-batches-table']",
      title: "Batches List",
      text: "View all product batches with their status, quantity, expiry dates, and locations.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-generate-qr-button']",
      title: "Generate QR Code",
      text: "Generate QR codes for batch tracking and scanning during inventory operations.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-barcode-scanner']",
      title: "Barcode Scanner",
      text: "Scan barcodes to quickly identify and track products during stock movements.",
      position: "bottom",
    },
  ],
};

export const inventoryTasksTour = {
  name: "inventory-tasks",
  steps: [
    {
      element: "[data-tour='inventory-tasks-header']",
      title: "Inventory Tasks",
      text: "Assign and manage inventory-related tasks to employees with deadlines and status tracking.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-create-task-button']",
      title: "Create New Task",
      text: "Create a new inventory task and assign it to specific employees with due dates.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-tasks-table']",
      title: "Tasks List",
      text: "View all inventory tasks with assignment details, deadlines, and current status.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-task-filters']",
      title: "Filter Tasks",
      text: "Filter tasks by status (pending, in progress, completed) to focus on what's important.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-task-actions']",
      title: "Task Actions",
      text: "Update task status, view details, or reassign tasks to different employees.",
      position: "left",
    },
  ],
};

export const inventoryReportsTour = {
  name: "inventory-reports",
  steps: [
    {
      element: "[data-tour='inventory-reports-header']",
      title: "Inventory Reports",
      text: "View comprehensive reports on stock balance, vendor history, and inventory forecasts.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-reports-tabs']",
      title: "Report Types",
      text: "Switch between different report types: Stock Balance, Vendor History, Forecast, and Analytics.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-stock-balance-tab']",
      title: "Stock Balance Report",
      text: "View current stock levels, values, and movements for all products.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-export-stock-button']",
      title: "Export Stock Balance",
      text: "Download stock balance report as CSV for external analysis and record-keeping.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-vendor-history-tab']",
      title: "Vendor History",
      text: "Track purchase history and performance metrics for all your vendors.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-export-vendor-button']",
      title: "Export Vendor History",
      text: "Download vendor history report as CSV for procurement analysis.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-forecast-tab']",
      title: "Reorder Forecast",
      text: "View predicted reorder points based on consumption patterns and historical data.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-analytics-tab']",
      title: "Analytics & Insights",
      text: "Explore inventory analytics including turnover rates and movement trends.",
      position: "right",
    },
  ],
};

export const inventoryAttendanceTour = {
  name: "inventory-attendance",
  steps: [
    {
      element: "[data-tour='inventory-attendance-header']",
      title: "Attendance Management",
      text: "Track employee attendance and manage leave requests for inventory staff.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-mark-attendance-button']",
      title: "Mark Attendance",
      text: "Record attendance for inventory staff members.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-attendance-table']",
      title: "Attendance Records",
      text: "View attendance records for all employees with date, status, and notes.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-attendance-filters']",
      title: "Filter Attendance",
      text: "Filter records by employee, date range, or attendance status.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-request-leave-button']",
      title: "Request Leave",
      text: "Submit leave requests for inventory employees with approval workflow.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-leave-requests-tab']",
      title: "Leave Requests",
      text: "View and manage pending leave requests from inventory staff.",
      position: "right",
    },
  ],
};

// Sales Subcomponent Tours
export const salesInvoiceManagementTour = {
  name: "sales-invoice-management",
  steps: [
    {
      element: "[data-tour='sales-invoice-header']",
      title: "Invoice Management",
      text: "Create and manage GST-compliant invoices with detailed tax breakdowns.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-new-invoice-button']",
      title: "Create New Invoice",
      text: "Click here to create a new invoice with client details, line items, and tax calculations.",
      position: "bottom",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Close any open drawers/dialogs first
          if (window.tourControls?.closeAll) {
            window.tourControls.closeAll();
          }
          resolve();
        });
      },
    },
    {
      element: "[data-tour='sales-invoice-number']",
      title: "Invoice Number",
      text: "Enter a unique invoice number for tracking and reference purposes.",
      position: "right",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Open the create invoice drawer
          if (window.tourControls?.openCreateInvoice) {
            window.tourControls.openCreateInvoice();
            // Wait a bit for the drawer to open
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
    },
    {
      element: "[data-tour='sales-customer-selection']",
      title: "Select Customer",
      text: "Choose the client for this invoice from your customer database.",
      position: "right",
    },
    {
      element: "[data-tour='sales-invoice-date']",
      title: "Invoice Date",
      text: "Set the date when this invoice was issued.",
      position: "right",
    },
    {
      element: "[data-tour='sales-due-date']",
      title: "Due Date",
      text: "Specify when payment for this invoice is due.",
      position: "right",
    },
    {
      element: "[data-tour='sales-subtotal-amount']",
      title: "Subtotal Amount",
      text: "The total amount before taxes and discounts are applied.",
      position: "right",
    },
    {
      element: "[data-tour='sales-discount-amount']",
      title: "Discount Amount",
      text: "Apply any discounts to reduce the invoice total.",
      position: "right",
    },
    {
      element: "[data-tour='sales-tax-fields']",
      title: "GST Tax Fields",
      text: "Configure CGST, SGST, and IGST rates and amounts for GST compliance.",
      position: "right",
    },
    {
      element: "[data-tour='sales-address-fields']",
      title: "Address Information",
      text: "Enter billing and shipping addresses for the invoice.",
      position: "right",
    },
    {
      element: "[data-tour='sales-line-items-section']",
      title: "Line Items Section",
      text: "Add products or services with quantities, prices, and tax rates.",
      position: "right",
    },
    {
      element: "[data-tour='sales-add-line-item']",
      title: "Add Line Item",
      text: "Click to add a new product or service line to the invoice.",
      position: "left",
    },
    {
      element: "[data-tour='sales-line-items-table']",
      title: "Line Items Table",
      text: "Enter item details including description, HSN/SAC code, quantity, unit price, and tax rates.",
      position: "top",
    },
    {
      element: "[data-tour='sales-item-description']",
      title: "Item Description",
      text: "Describe the product or service being invoiced.",
      position: "top",
    },
    {
      element: "[data-tour='sales-item-hsn']",
      title: "HSN/SAC Code",
      text: "Enter the HSN (Harmonized System of Nomenclature) or SAC (Service Accounting Code) for GST classification.",
      position: "top",
    },
    {
      element: "[data-tour='sales-item-quantity']",
      title: "Quantity",
      text: "Specify the quantity of items being invoiced.",
      position: "top",
    },
    {
      element: "[data-tour='sales-item-price']",
      title: "Unit Price",
      text: "Enter the price per unit for this item.",
      position: "top",
    },
    {
      element: "[data-tour='sales-item-cgst-rate']",
      title: "CGST Rate",
      text: "Central GST rate applicable to this item.",
      position: "top",
    },
    {
      element: "[data-tour='sales-item-amount']",
      title: "Line Item Amount",
      text: "Calculated total for this line item including taxes.",
      position: "top",
    },
    {
      element: "[data-tour='sales-form-actions']",
      title: "Form Actions",
      text: "Save your invoice or cancel to discard changes.",
      position: "top",
    },
    {
      element: "[data-tour='sales-create-invoice']",
      title: "Create Invoice",
      text: "Save this invoice to your database. It will be marked as 'Draft' status.",
      position: "top",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Ensure create invoice drawer is still open
          if (window.tourControls?.openCreateInvoice) {
            window.tourControls.openCreateInvoice();
            setTimeout(resolve, 100);
          } else {
            resolve();
          }
        });
      },
    },
    {
      element: "[data-tour='sales-invoice-header']",
      title: "Back to Invoice List",
      text: "Now let's explore the invoice list and available actions for existing invoices.",
      position: "bottom",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Close create invoice drawer and ensure we're back to main view
          if (window.tourControls?.closeAll) {
            window.tourControls.closeAll();
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
    },
    {
      element: "[data-tour='sales-invoice-actions']",
      title: "Invoice Actions",
      text: "View, download, or send completed invoices to clients.",
      position: "left",
    },
    {
      element: "[data-tour='sales-view-invoice']",
      title: "View Invoice",
      text: "Open a detailed view of the invoice with all information and formatting.",
      position: "left",
    },
    {
      element: "[data-tour='sales-download-invoice']",
      title: "Download PDF",
      text: "Download the invoice as a PDF file for printing or sharing.",
      position: "left",
    },
    {
      element: "[data-tour='sales-send-invoice']",
      title: "Send Invoice",
      text: "Email the invoice to the client and update status to 'Sent'.",
      position: "left",
    },
    {
      element: "[data-tour='sales-view-invoice-drawer']",
      title: "Invoice Preview",
      text: "Complete invoice view with company details, client information, and tax calculations.",
      position: "right",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Open the view invoice drawer
          if (window.tourControls?.openViewInvoice) {
            window.tourControls.openViewInvoice();
            // Wait a bit for the drawer to open
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
    },
    {
      element: "[data-tour='sales-company-details']",
      title: "Company Information",
      text: "Your company details as they appear on the invoice.",
      position: "right",
    },
    {
      element: "[data-tour='sales-invoice-info-section']",
      title: "Invoice Details",
      text: "Invoice number, dates, and payment terms.",
      position: "left",
    },
    {
      element: "[data-tour='sales-view-line-items']",
      title: "Invoice Line Items",
      text: "Detailed breakdown of all products and services invoiced.",
      position: "top",
    },
    {
      element: "[data-tour='sales-tax-summary-section']",
      title: "Tax Summary & Banking",
      text: "Tax breakdown, bank details for payment, and final total amount.",
      position: "top",
    },
    {
      element: "[data-tour='sales-total-amount-display']",
      title: "Total Amount",
      text: "The final amount due including all taxes and charges.",
      position: "left",
    },
    {
      element: "[data-tour='sales-invoice-header']",
      title: "Back to Invoice List",
      text: "Now let's see how to send an invoice to a client.",
      position: "bottom",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Close view invoice drawer
          if (window.tourControls?.closeViewInvoice) {
            window.tourControls.closeViewInvoice();
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
    },
    {
      element: "[data-tour='sales-send-invoice']",
      title: "Send Invoice Action",
      text: "Click here to send the invoice to the client.",
      position: "left",
    },
    {
      element: "[data-tour='sales-send-invoice-dialog']",
      title: "Send Confirmation",
      text: "Confirm sending the invoice to the client via email.",
      position: "center",
      beforeShowPromise: function() {
        return new Promise((resolve) => {
          // Open send dialog
          if (window.tourControls?.openSendDialog) {
            window.tourControls.openSendDialog();
            // Wait a bit for the dialog to open
            setTimeout(resolve, 300);
          } else {
            resolve();
          }
        });
      },
    },
  ],
};

export const salesQuotationManagementTour = {
  name: "sales-quotation-management",
  steps: [
    {
      element: "[data-tour='sales-quotation-header']",
      title: "Quotation Management",
      text: "Create and manage quotations for clients and vendors with detailed line items and pricing.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-quotation-export-button']",
      title: "Export Quotations",
      text: "Export all quotations or filtered results as CSV for external analysis and record-keeping.",
      position: "left",
    },
    {
      element: "[data-tour='sales-quotation-filter-section']",
      title: "Filter Quotations",
      text: "Filter quotations by customer, status, and date range to find specific quotes quickly.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-quotation-status-filter']",
      title: "Status Filter",
      text: "View quotations by status: Draft, Sent, Pending, Approved, or Rejected.",
      position: "right",
    },
    {
      element: "[data-tour='sales-quotation-customer-filter']",
      title: "Customer Filter",
      text: "Filter quotations by specific customers to focus on particular client relationships.",
      position: "right",
    },
    {
      element: "[data-tour='sales-quotation-list']",
      title: "Quotation List",
      text: "View all quotations with their numbers, clients, dates, amounts, and current status.",
      position: "top",
    },
    {
      element: "[data-tour='sales-quotation-actions']",
      title: "Quotation Actions",
      text: "View, edit, download, or delete quotations using the action buttons.",
      position: "left",
    },
  ],
};

export const salesClientManagementTour = {
  name: "sales-client-management",
  steps: [
    {
      element: "[data-tour='sales-client-header']",
      title: "Client Database",
      text: "Manage your customer information, contact details, and communication history with detailed client records.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-add-client-button']",
      title: "Add New Client",
      text: "Create a new customer record with complete information including name, contact, email, GST number, and address.",
      position: "left",
    },
    {
      element: "[data-tour='sales-client-list']",
      title: "Client List",
      text: "View all your clients with their contact information, status, and action buttons.",
      position: "top",
    },
    {
      element: "[data-tour='sales-client-name-column']",
      title: "Client Name & Company",
      text: "Client's business name and company information for identification and reference.",
      position: "right",
    },
    {
      element: "[data-tour='sales-client-contact-column']",
      title: "Contact Information",
      text: "Client's email address and phone number for direct communication.",
      position: "right",
    },
    {
      element: "[data-tour='sales-client-status-column']",
      title: "Client Status",
      text: "Shows whether the client is active or inactive in your database.",
      position: "right",
    },
    {
      element: "[data-tour='sales-client-actions']",
      title: "Client Actions",
      text: "View client details, edit information, view history, or delete the client record.",
      position: "left",
    },
  ],
};

export const salesVendorManagementTour = {
  name: "sales-vendor-management",
  steps: [
    {
      element: "[data-tour='sales-vendor-header']",
      title: "Vendor Database",
      text: "Maintain your supplier and vendor information with detailed records and communication tracking.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-add-vendor-button']",
      title: "Add New Vendor",
      text: "Create a new vendor record with complete information including name, contact, email, GST number, and address.",
      position: "left",
    },
    {
      element: "[data-tour='sales-vendor-list']",
      title: "Vendor List",
      text: "View all your vendors with their contact information, status, and action buttons.",
      position: "top",
    },
    {
      element: "[data-tour='sales-vendor-name-column']",
      title: "Vendor Name & Company",
      text: "Vendor's business name and company information for identification.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendor-contact-column']",
      title: "Contact Information",
      text: "Vendor's email address and phone number for direct communication.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendor-status-column']",
      title: "Vendor Status",
      text: "Shows whether the vendor is active or inactive in your database.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendor-actions']",
      title: "Vendor Actions",
      text: "View vendor details, edit information, log communication, view history, or delete the vendor record.",
      position: "left",
    },
    {
      element: "[data-tour='sales-log-communication-button']",
      title: "Log Communication",
      text: "Record interactions with vendors including emails, calls, meetings, and orders.",
      position: "left",
    },
  ],
};

export const salesReportsTour = {
  name: "sales-reports",
  steps: [
    {
      element: "[data-tour='sales-reports-header']",
      title: "Sales Reports",
      text: "Generate and analyze comprehensive sales metrics, pipeline reports, and performance analytics.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-report-type-selector']",
      title: "Report Type",
      text: "Choose different report types: Pipeline, Conversion Analysis, Client History, or Vendor Summary.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-report-date-range']",
      title: "Date Range",
      text: "Select specific date range to filter report data for the period you want to analyze.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-report-export-button']",
      title: "Export Report",
      text: "Download the current report and data as a CSV file for external analysis in spreadsheet applications.",
      position: "left",
    },
    {
      element: "[data-tour='sales-key-metrics']",
      title: "Key Metrics",
      text: "View important sales metrics: quotations sent, invoices generated, conversion rate, and total revenue.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-quotations-sent-metric']",
      title: "Quotations Sent",
      text: "Total number of outbound quotations sent to clients.",
      position: "right",
    },
    {
      element: "[data-tour='sales-invoices-generated-metric']",
      title: "Invoices Generated",
      text: "Total number of invoices generated from quotations.",
      position: "right",
    },
    {
      element: "[data-tour='sales-conversion-rate-metric']",
      title: "Conversion Rate",
      text: "Percentage of quotations that were converted to invoices.",
      position: "right",
    },
    {
      element: "[data-tour='sales-total-revenue-metric']",
      title: "Total Revenue",
      text: "Total revenue from paid invoices.",
      position: "right",
    },
  ],
};

export const salesTour = {
  name: "sales-module",
  steps: [
    {
      element: "[data-tour='sales-header']",
      title: "Sales Module",
      text: "Welcome to the Sales Module. Manage quotations, invoices, and clients.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-dashboard']",
      title: "Sales Dashboard",
      text: "View sales overview, key metrics, and performance indicators.",
      position: "right",
    },
    {
      element: "[data-tour='sales-outbound-quotations']",
      title: "Outbound Quotations",
      text: "Create and manage quotations sent to clients for your products and services.",
      position: "right",
      navigation: {
        path: "/sales/outbound-quotations",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='sales-inbound-quotations']",
      title: "Inbound Quotations",
      text: "Review and manage quotations received from clients and vendors.",
      position: "right",
      navigation: {
        path: "/sales/inbound-quotations",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='sales-invoices']",
      title: "Invoice Management",
      text: "Create, send, and track GST invoices and billing for completed sales.",
      position: "right",
      navigation: {
        path: "/sales/invoices",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='sales-clients']",
      title: "Client Database",
      text: "Manage customer information, contact details, and communication history.",
      position: "right",
      navigation: {
        path: "/sales/clients",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='sales-vendors']",
      title: "Vendor Database",
      text: "Maintain supplier information and manage vendor relationships.",
      position: "right",
      navigation: {
        path: "/sales/vendors",
        tourConfig: null,
      },
    },
    {
      element: "[data-tour='sales-reports']",
      title: "Sales Reports",
      text: "Generate sales analytics, performance reports, and export data.",
      position: "right",
      navigation: {
        path: "/sales/reports",
        tourConfig: null,
      },
    },
  ],
};

export const accountsTour = {
  name: "accounts-module",
  steps: [
    {
      element: "[data-tour='accounts-header']",
      title: "Accounts Module",
      text: "Welcome to the Accounts Module. Manage receivables, payables, and financial records.",
      position: "bottom",
    },
    {
      element: "[data-tour='receivables']",
      title: "Receivables",
      text: "Track money owed to you by customers.",
      position: "right",
    },
    {
      element: "[data-tour='payables']",
      title: "Payables",
      text: "Manage payments owed to suppliers.",
      position: "right",
    },
    {
      element: "[data-tour='bank-management']",
      title: "Bank Management",
      text: "Manage bank accounts and reconciliation.",
      position: "right",
    },
  ],
};

export const marketingTour = {
  name: "marketing-module",
  steps: [
    {
      element: "[data-tour='marketing-header']",
      title: "Marketing Module",
      text: "Welcome to the Marketing Module. Manage leads, field visits, and campaigns.",
      position: "bottom",
    },
    {
      element: "[data-tour='leads']",
      title: "Leads",
      text: "Manage and track sales leads.",
      position: "right",
    },
    {
      element: "[data-tour='field-visits']",
      title: "Field Visits",
      text: "Log and track field visits to leads and customers.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-tasks']",
      title: "Marketing Tasks",
      text: "Organize marketing tasks and campaigns.",
      position: "right",
    },
  ],
};

export const logisticsTour = {
  name: "logistics-module",
  steps: [
    {
      element: "[data-tour='logistics-header']",
      title: "Logistics Module",
      text: "Welcome to the Logistics Module. Manage shipments and deliveries.",
      position: "bottom",
    },
    {
      element: "[data-tour='shipments']",
      title: "Shipments",
      text: "Create and track shipments.",
      position: "right",
    },
    {
      element: "[data-tour='status-workflow']",
      title: "Status Workflow",
      text: "Monitor shipment status and workflow.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-reports']",
      title: "Reports",
      text: "View logistics reports and analytics.",
      position: "right",
    },
  ],
};
