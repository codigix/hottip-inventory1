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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
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
      beforeShowPromise: function () {
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

// Original sales tour for individual module navigation
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



// Comprehensive Reports Tour
export const comprehensiveReportsTour = {
  name: "comprehensive-sales-reports",
  steps: [
    {
      element: "[data-tour='sales-reports-header']",
      title: "Sales Reports & Analytics",
      text: "Generate comprehensive sales metrics and performance analytics.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-report-type-selector']",
      title: "Report Type Selection",
      text: "Choose from Pipeline, Conversion Analysis, Client History, or Vendor Summary.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-report-date-range']",
      title: "Date Range Filter",
      text: "Select specific date range to filter report data.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-report-export-button']",
      title: "Export Report",
      text: "Download the current report as a CSV file for external analysis.",
      position: "left",
    },
    {
      element: "[data-tour='sales-key-metrics']",
      title: "Key Performance Metrics",
      text: "View important sales metrics and KPIs at a glance.",
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
      text: "Total number of invoices created from quotations.",
      position: "right",
    },
    {
      element: "[data-tour='sales-conversion-rate-metric']",
      title: "Conversion Rate",
      text: "Percentage of quotations converted to invoices.",
      position: "right",
    },
    {
      element: "[data-tour='sales-total-revenue-metric']",
      title: "Total Revenue",
      text: "Total revenue from paid invoices.",
      position: "right",
    },
    // Tour Completion
    {
      element: "[data-tour='sales-reports-header']",
      title: "Sales Module Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Sales module tour covering all features from dashboard to reports.",
      position: "bottom",
    },
  ],
};

// Comprehensive Vendor Management Tour
export const comprehensiveVendorsTour = {
  name: "comprehensive-sales-vendors",
  steps: [
    {
      element: "[data-tour='sales-vendor-header']",
      title: "Vendor Database Management",
      text: "Maintain supplier information and manage vendor relationships.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-add-vendor-button']",
      title: "Add New Vendor",
      text: "Create a new vendor record with complete information.",
      position: "left",
    },
    {
      element: "[data-tour='sales-vendor-list']",
      title: "Vendor List",
      text: "View all vendors with their contact information and status.",
      position: "top",
    },
    {
      element: "[data-tour='sales-vendor-name-column']",
      title: "Vendor Name & Company",
      text: "Vendor's business name and company information.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendor-contact-column']",
      title: "Contact Information",
      text: "Vendor's email and phone for communication.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendor-status-column']",
      title: "Vendor Status",
      text: "Shows whether the vendor is active or inactive.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendor-actions']",
      title: "Vendor Actions",
      text: "View details, edit information, log communication, or manage records.",
      position: "left",
    },
    {
      element: "[data-tour='sales-log-communication-button']",
      title: "Log Communication",
      text: "Record interactions with vendors including emails, calls, and meetings.",
      position: "left",
    },
    // Navigate to Reports
    {
      element: "[data-tour='sales-vendor-header']",
      title: "Vendor Management Complete",
      text: "Vendors covered! Click 'Next' to explore Sales Reports and Analytics.",
      position: "bottom",
      navigation: {
        path: "/sales/reports",
        tourConfig: comprehensiveReportsTour,
      },
    },
  ],
};

// Comprehensive Client Management Tour
export const comprehensiveClientsTour = {
  name: "comprehensive-sales-clients",
  steps: [
    {
      element: "[data-tour='sales-client-header']",
      title: "Client Database Management",
      text: "Manage customer information, contacts, and communication history.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-add-client-button']",
      title: "Add New Client",
      text: "Create a new customer record with complete contact information.",
      position: "left",
    },
    {
      element: "[data-tour='sales-client-list']",
      title: "Client List",
      text: "View all clients with their contact information and status.",
      position: "top",
    },
    {
      element: "[data-tour='sales-client-name-column']",
      title: "Client Name & Company",
      text: "Client's business name and company information.",
      position: "right",
    },
    {
      element: "[data-tour='sales-client-contact-column']",
      title: "Contact Information",
      text: "Client's email and phone for direct communication.",
      position: "right",
    },
    {
      element: "[data-tour='sales-client-status-column']",
      title: "Client Status",
      text: "Shows whether the client is active or inactive.",
      position: "right",
    },
    {
      element: "[data-tour='sales-client-actions']",
      title: "Client Actions",
      text: "View details, edit information, or manage client records.",
      position: "left",
    },
    // Navigate to Vendor Management
    {
      element: "[data-tour='sales-client-header']",
      title: "Client Management Complete",
      text: "Clients covered! Click 'Next' to explore Vendor Database management.",
      position: "bottom",
      navigation: {
        path: "/sales/vendors",
        tourConfig: comprehensiveVendorsTour,
      },
    },
  ],
};

// Comprehensive Invoice Management Tour
export const comprehensiveInvoicesTour = {
  name: "comprehensive-sales-invoices",
  steps: [
    {
      element: "[data-tour='sales-invoice-header']",
      title: "Invoice Management System",
      text: "Create and manage GST-compliant invoices with detailed tax calculations.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-new-invoice-button']",
      title: "Create New Invoice",
      text: "Start creating a new invoice with client details and line items.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-invoice-number']",
      title: "Invoice Number",
      text: "Enter a unique invoice number for tracking and reference.",
      position: "right",
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
      text: "Enter the HSN or SAC code for GST classification.",
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
      element: "[data-tour='sales-tax-fields']",
      title: "GST Tax Fields",
      text: "Configure CGST, SGST, and IGST rates for GST compliance.",
      position: "right",
    },
    {
      element: "[data-tour='sales-create-invoice']",
      title: "Create Invoice",
      text: "Save this invoice to your database as a draft.",
      position: "top",
    },
    {
      element: "[data-tour='sales-invoice-actions']",
      title: "Invoice Actions",
      text: "View, download, or send completed invoices to clients.",
      position: "left",
    },
    // Navigate to Client Management
    {
      element: "[data-tour='sales-invoice-header']",
      title: "Invoice Management Complete",
      text: "Invoices covered! Click 'Next' to explore Client Database management.",
      position: "bottom",
      navigation: {
        path: "/sales/clients",
        tourConfig: comprehensiveClientsTour,
      },
    },
  ],
};

// Comprehensive Inbound Quotations Tour
export const comprehensiveInboundQuotationsTour = {
  name: "comprehensive-sales-inbound-quotations",
  steps: [
    {
      element: "[data-tour='sales-quotation-header']",
      title: "Inbound Quotations Management",
      text: "Review and manage quotations received from clients and vendors.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-quotation-export-button']",
      title: "Export Inbound Quotations",
      text: "Export all inbound quotations for record-keeping and analysis.",
      position: "left",
    },
    {
      element: "[data-tour='sales-quotation-filter-section']",
      title: "Filter Inbound Quotations",
      text: "Filter by sender, status, and date to manage incoming quotations efficiently.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-quotation-list']",
      title: "Inbound Quotation List",
      text: "View all received quotations with sender details, amounts, and status.",
      position: "top",
    },
    {
      element: "[data-tour='sales-quotation-actions']",
      title: "Inbound Quotation Actions",
      text: "Review, approve, reject, or convert incoming quotations to invoices.",
      position: "left",
    },
    // Navigate to Invoice Management
    {
      element: "[data-tour='sales-quotation-header']",
      title: "Inbound Quotations Complete",
      text: "Inbound quotations covered! Click 'Next' to learn about Invoice Management.",
      position: "bottom",
      navigation: {
        path: "/sales/invoices",
        tourConfig: comprehensiveInvoicesTour,
      },
    },
  ],
};

// Comprehensive Outbound Quotations Tour
export const comprehensiveOutboundQuotationsTour = {
  name: "comprehensive-sales-outbound-quotations",
  steps: [
    {
      element: "[data-tour='sales-quotation-header']",
      title: "Outbound Quotations Management",
      text: "Create and manage quotations sent to clients. This section covers all quotation features.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-new-quotation-button']",
      title: "Create New Quotation",
      text: "Click here to create a new quotation. This opens a form where you can enter client details, items, and pricing.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-quotation-export-button']",
      title: "Export All Quotations",
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
      title: "Quotation List Table",
      text: "View all quotations with their numbers, clients, dates, amounts, and current status. This table shows all your outbound quotations.",
      position: "top",
    },
    {
      element: "[data-tour='sales-quotation-actions']",
      title: "Quotation Actions",
      text: "View, edit, download, or delete quotations using the action buttons in each row.",
      position: "left",
    },
    // Navigate to Inbound Quotations
    {
      element: "[data-tour='sales-quotation-header']",
      title: "Outbound Quotations Complete",
      text: "You've learned all about outbound quotations. Click 'Next' to explore Inbound Quotations.",
      position: "bottom",
      navigation: {
        path: "/sales/inbound-quotations",
        tourConfig: comprehensiveInboundQuotationsTour,
      },
    },
  ],
};

























// Flow-based sales module tour that covers all features in a continuous sequence
export const salesFlowTour = {
  name: "sales-flow-tour",
  steps: [
    // ===== SALES DASHBOARD SECTION =====
    {
      element: "[data-tour='sales-header']",
      title: "Welcome to Sales Module Tour",
      text: "This comprehensive tour will guide you through all features of the Sales module in a continuous flow, from dashboard to reports.",
      position: "bottom",
    },
    {
      element: "[data-tour='sales-dashboard']",
      title: "Sales Dashboard Overview",
      text: "Your sales control center with key metrics and navigation to all sales features.",
      position: "right",
    },
    {
      element: "[data-tour='sales-outbound-quotations']",
      title: "Outbound Quotations",
      text: "Create and manage quotations sent to clients for your products and services.",
      position: "right",
    },
    {
      element: "[data-tour='sales-inbound-quotations']",
      title: "Inbound Quotations",
      text: "Review and manage quotations received from clients and vendors.",
      position: "right",
    },
    {
      element: "[data-tour='sales-invoices']",
      title: "Invoice Management",
      text: "Create, send, and track GST invoices and billing for completed sales.",
      position: "right",
    },
    {
      element: "[data-tour='sales-clients']",
      title: "Client Database",
      text: "Manage customer information, contact details, and communication history.",
      position: "right",
    },
    {
      element: "[data-tour='sales-vendors']",
      title: "Vendor Database",
      text: "Maintain supplier information and manage vendor relationships.",
      position: "right",
    },
    {
      element: "[data-tour='sales-reports']",
      title: "Sales Reports",
      text: "Generate sales analytics, performance reports, and export data.",
      position: "right",
    },
    // Navigation to Outbound Quotations
    {
      element: "[data-tour='sales-header']",
      title: "Moving to Outbound Quotations",
      text: "Click 'Next' to navigate to Outbound Quotations and continue the tour there.",
      position: "bottom",
      navigation: {
        path: "/sales/outbound-quotations",
        tourConfig: comprehensiveOutboundQuotationsTour,
      },
    },
  ],
};

// Keep the old comprehensive tour for backward compatibility
export const comprehensiveSalesTour = salesFlowTour;

// Flow-based inventory module tour that covers all features in a continuous sequence
export const inventoryFlowTour = {
  name: "inventory-flow-tour",
  steps: [
    // ===== INVENTORY DASHBOARD SECTION =====
    {
      element: "[data-tour='inventory-header']",
      title: "Welcome to Inventory Module Tour",
      text: "This comprehensive tour will guide you through all features of the Inventory module in a continuous flow, from dashboard to attendance.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-dashboard']",
      title: "Inventory Dashboard Overview",
      text: "Your inventory control center with key metrics, stock levels, and navigation to all inventory features.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-stock-management']",
      title: "Stock Management",
      text: "Track and manage your inventory. Monitor stock levels, perform stock in/out operations, and view low-stock alerts.",
      position: "right",
    },
    {
      element: "[data-tour='inventory-vendors']",
      title: "Vendor Management",
      text: "Manage supplier and vendor information. View their contact details and communication history.",
      position: "right",
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
    // Navigation to Stock Management
    {
      element: "[data-tour='inventory-header']",
      title: "Moving to Stock Management",
      text: "Click 'Next' to navigate to Stock Management and continue the tour there.",
      position: "bottom",
      navigation: {
        path: "/inventory/stock",
      },
    },

    // ===== STOCK MANAGEMENT SECTION =====
    {
      element: "[data-tour='inventory-stock-header']",
      title: "Stock Management System",
      text: "Comprehensive stock tracking with in/out operations, product management, and transaction history.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-stock-in-button']",
      title: "Stock In Operations",
      text: "Record incoming stock from purchases, returns, or adjustments. This increases your inventory levels.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-stock-out-button']",
      title: "Stock Out Operations",
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
    // Navigation to Vendors
    {
      element: "[data-tour='inventory-stock-header']",
      title: "Moving to Vendor Management",
      text: "Stock management covered! Click 'Next' to navigate to Vendor Management.",
      position: "bottom",
      navigation: {
        path: "/inventory/vendors",
      },
    },

    // ===== VENDOR MANAGEMENT SECTION =====
    {
      element: "[data-tour='inventory-vendor-header']",
      title: "Vendor Database Management",
      text: "Maintain supplier information and manage vendor relationships with communication tracking.",
      position: "bottom",
    },
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
    {
      element: "[data-tour='inventory-vendor-table']",
      title: "Vendor List",
      text: "View all vendors with their contact information, status, and communication history.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-vendor-actions']",
      title: "Vendor Actions",
      text: "View vendor details, edit information, log communication, or manage vendor records.",
      position: "left",
    },
    // Navigation to Spare Parts
    {
      element: "[data-tour='inventory-vendor-header']",
      title: "Moving to Spare Parts & Fabrication",
      text: "Vendor management covered! Click 'Next' to explore Spare Parts & Fabrication.",
      position: "bottom",
      navigation: {
        path: "/inventory/spare-parts",
      },
    },

    // ===== SPARE PARTS & FABRICATION SECTION =====
    {
      element: "[data-tour='inventory-spare-parts-header']",
      title: "Spare Parts & Fabrication Management",
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
    // Navigation to Batch & Barcode
    {
      element: "[data-tour='inventory-spare-parts-header']",
      title: "Moving to Batch & Barcode",
      text: "Spare parts covered! Click 'Next' to explore Batch & Barcode management.",
      position: "bottom",
      navigation: {
        path: "/inventory/batch-barcode",
      },
    },

    // ===== BATCH & BARCODE SECTION =====
    {
      element: "[data-tour='inventory-batch-barcode-header']",
      title: "Batch & Barcode Management",
      text: "Handle lot tracking and QR/barcode scanning for comprehensive inventory management.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-batch-tracking-table']",
      title: "Batch Tracking",
      text: "Monitor product batches with expiration dates, quality control, and traceability.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-barcode-scanner']",
      title: "Barcode Scanner",
      text: "Scan QR codes and barcodes for quick inventory lookup and stock movements.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-batch-actions']",
      title: "Batch Actions",
      text: "View batch details, update status, or manage batch-related operations.",
      position: "left",
    },
    // Navigation to Tasks
    {
      element: "[data-tour='inventory-batch-barcode-header']",
      title: "Moving to Inventory Tasks",
      text: "Batch & barcode covered! Click 'Next' to explore Inventory Tasks.",
      position: "bottom",
      navigation: {
        path: "/inventory/tasks",
      },
    },

    // ===== INVENTORY TASKS SECTION =====
    {
      element: "[data-tour='inventory-tasks-header']",
      title: "Inventory Tasks Management",
      text: "Assign and track inventory-related tasks for your team members with progress monitoring.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-add-task-button']",
      title: "Create New Task",
      text: "Assign a new inventory task to team members with deadlines and priorities.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-tasks-table']",
      title: "Tasks List",
      text: "View all inventory tasks with their status, assignments, and due dates.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-task-filters']",
      title: "Task Filters",
      text: "Filter tasks by status, assignee, priority, or due date for better organization.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-task-actions']",
      title: "Task Actions",
      text: "Update task status, reassign tasks, or view task details and history.",
      position: "left",
    },
    // Navigation to Reports
    {
      element: "[data-tour='inventory-tasks-header']",
      title: "Moving to Reports & Analytics",
      text: "Tasks covered! Click 'Next' to explore Reports & Analytics.",
      position: "bottom",
      navigation: {
        path: "/inventory/reports",
      },
    },

    // ===== REPORTS & ANALYTICS SECTION =====
    {
      element: "[data-tour='inventory-reports-header']",
      title: "Inventory Reports & Analytics",
      text: "Generate comprehensive inventory reports, analytics, and export data for decision making.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-reports-selector']",
      title: "Report Types",
      text: "Choose from Stock Levels, Vendor Performance, Fabrication Status, or Custom Reports.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-reports-date-range']",
      title: "Date Range Filter",
      text: "Select specific date ranges to filter report data and analytics.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-reports-export-button']",
      title: "Export Reports",
      text: "Download inventory reports in CSV or PDF format for external analysis.",
      position: "left",
    },
    {
      element: "[data-tour='inventory-reports-metrics']",
      title: "Key Performance Metrics",
      text: "View important inventory KPIs including stock turnover, vendor performance, and efficiency metrics.",
      position: "bottom",
    },
    // Navigation to Attendance
    {
      element: "[data-tour='inventory-reports-header']",
      title: "Moving to Staff Attendance",
      text: "Reports covered! Click 'Next' to explore Staff Attendance tracking.",
      position: "bottom",
      navigation: {
        path: "/inventory/attendance",
      },
    },

    // ===== STAFF ATTENDANCE SECTION =====
    {
      element: "[data-tour='inventory-attendance-header']",
      title: "Staff Attendance Management",
      text: "Track attendance and leave management for inventory team members with reporting.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-attendance-calendar']",
      title: "Attendance Calendar",
      text: "View attendance patterns and schedules in calendar format for easy visualization.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-attendance-table']",
      title: "Attendance Records",
      text: "Detailed attendance records with check-in/out times, leave requests, and approvals.",
      position: "top",
    },
    {
      element: "[data-tour='inventory-attendance-filters']",
      title: "Attendance Filters",
      text: "Filter attendance by employee, date range, or status to find specific records.",
      position: "bottom",
    },
    {
      element: "[data-tour='inventory-attendance-actions']",
      title: "Attendance Actions",
      text: "Approve leave requests, view attendance details, or manage attendance records.",
      position: "left",
    },
    // Tour Completion
    {
      element: "[data-tour='inventory-attendance-header']",
      title: "Inventory Module Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Inventory module flow tour covering all features from dashboard to attendance.",
      position: "bottom",
    },
  ],
};

// Flow-based accounts module tour that covers all features in a continuous sequence
export const accountsFlowTour = {
  name: "accounts-flow-tour",
  steps: [
    // ===== ACCOUNTS DASHBOARD SECTION =====
    {
      element: "[data-tour='accounts-header']",
      title: "Welcome to Accounts Module Tour",
      text: "This comprehensive tour will guide you through all features of the Accounts module in a continuous flow, from dashboard to attendance.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-dashboard']",
      title: "Accounts Dashboard Overview",
      text: "Your financial control center with key financial metrics, cash flow, and navigation to all accounting features.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-receivables']",
      title: "Receivables Management",
      text: "Track money owed to you by customers and manage outstanding invoices and payments.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-payables']",
      title: "Payables Management",
      text: "Manage payments owed to suppliers and track outstanding vendor invoices.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-bank-management']",
      title: "Bank Management",
      text: "Manage bank accounts, reconcile transactions, and track financial institutions.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-tax-gst']",
      title: "Tax & GST",
      text: "Handle tax calculations, GST compliance, and tax reconciliation processes.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-reminders']",
      title: "Payment Reminders",
      text: "Set up automated reminders for due payments and overdue accounts.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-tasks']",
      title: "Accounts Tasks",
      text: "Assign and manage accounting-related tasks for your team members.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-reports']",
      title: "Financial Reports",
      text: "Generate comprehensive financial reports, GST filings, and export data.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-attendance']",
      title: "Staff Attendance",
      text: "Track attendance and leave management for accounts team members.",
      position: "right",
    },
    // Navigation to Receivables
    {
      element: "[data-tour='accounts-header']",
      title: "Moving to Receivables Management",
      text: "Click 'Next' to navigate to Receivables and continue the tour there.",
      position: "bottom",
      navigation: {
        path: "/accounts/receivables",
      },
    },

    // ===== RECEIVABLES SECTION =====
    {
      element: "[data-tour='accounts-receivables-header']",
      title: "Receivables Management System",
      text: "Track and manage all money owed to your business by customers and clients.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-add-receivable-button']",
      title: "Add New Receivable",
      text: "Create a new receivable entry for customer invoices or outstanding payments.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-receivables-table']",
      title: "Receivables List",
      text: "View all outstanding receivables with amounts, due dates, and customer information.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-receivables-filters']",
      title: "Receivables Filters",
      text: "Filter receivables by customer, status, due date, or amount for better organization.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-receivables-actions']",
      title: "Receivables Actions",
      text: "View details, record payments, send reminders, or update receivable status.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-record-payment-button']",
      title: "Record Payment",
      text: "Record customer payments against outstanding receivables.",
      position: "left",
    },
    // Navigation to Payables
    {
      element: "[data-tour='accounts-receivables-header']",
      title: "Moving to Payables Management",
      text: "Receivables covered! Click 'Next' to navigate to Payables Management.",
      position: "bottom",
      navigation: {
        path: "/accounts/payables",
      },
    },

    // ===== PAYABLES SECTION =====
    {
      element: "[data-tour='accounts-payables-header']",
      title: "Payables Management System",
      text: "Track and manage all payments owed to suppliers and vendors.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-add-payable-button']",
      title: "Add New Payable",
      text: "Create a new payable entry for vendor invoices or outstanding supplier payments.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-payables-table']",
      title: "Payables List",
      text: "View all outstanding payables with amounts, due dates, and vendor information.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-payables-filters']",
      title: "Payables Filters",
      text: "Filter payables by vendor, status, due date, or amount for efficient management.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-payables-actions']",
      title: "Payables Actions",
      text: "View details, process payments, send reminders, or update payable status.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-process-payment-button']",
      title: "Process Payment",
      text: "Process payments to vendors and update payable status.",
      position: "left",
    },
    // Navigation to Bank Management
    {
      element: "[data-tour='accounts-payables-header']",
      title: "Moving to Bank Management",
      text: "Payables covered! Click 'Next' to explore Bank Management.",
      position: "bottom",
      navigation: {
        path: "/accounts/bank-management",
      },
    },

    // ===== BANK MANAGEMENT SECTION =====
    {
      element: "[data-tour='accounts-bank-header']",
      title: "Bank Account Management",
      text: "Manage bank accounts, track transactions, and perform bank reconciliation.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-add-bank-account-button']",
      title: "Add Bank Account",
      text: "Add a new bank account with account details and initial balance.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-bank-accounts-table']",
      title: "Bank Accounts List",
      text: "View all bank accounts with balances, account numbers, and status.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-bank-transactions-table']",
      title: "Bank Transactions",
      text: "View all bank transactions, deposits, withdrawals, and reconciliation status.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-bank-reconciliation-button']",
      title: "Bank Reconciliation",
      text: "Reconcile bank statements with your accounting records.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-bank-actions']",
      title: "Bank Account Actions",
      text: "View transaction details, edit account information, or manage reconciliation.",
      position: "left",
    },
    // Navigation to Tax & GST
    {
      element: "[data-tour='accounts-bank-header']",
      title: "Moving to Tax & GST Management",
      text: "Bank management covered! Click 'Next' to explore Tax & GST.",
      position: "bottom",
      navigation: {
        path: "/accounts/tax-gst",
      },
    },

    // ===== TAX & GST SECTION =====
    {
      element: "[data-tour='accounts-tax-header']",
      title: "Tax & GST Management",
      text: "Handle GST calculations, tax compliance, and generate tax reports for filing.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-gst-calculator']",
      title: "GST Calculator",
      text: "Calculate GST amounts for transactions with different tax rates.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-tax-rates-table']",
      title: "Tax Rates Configuration",
      text: "Configure GST rates, HSN codes, and tax categories for compliance.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-gst-reports']",
      title: "GST Reports",
      text: "Generate GSTR-1, GSTR-3B, and other GST compliance reports.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-tax-filing-status']",
      title: "Tax Filing Status",
      text: "Track GST filing status, due dates, and compliance requirements.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-export-gst-button']",
      title: "Export GST Data",
      text: "Export GST data in the required format for government filing.",
      position: "left",
    },
    // Navigation to Reminders
    {
      element: "[data-tour='accounts-tax-header']",
      title: "Moving to Payment Reminders",
      text: "Tax & GST covered! Click 'Next' to explore Payment Reminders.",
      position: "bottom",
      navigation: {
        path: "/accounts/reminders",
      },
    },

    // ===== REMINDERS SECTION =====
    {
      element: "[data-tour='accounts-reminders-header']",
      title: "Payment Reminders System",
      text: "Set up automated reminders for due payments and overdue accounts.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-create-reminder-button']",
      title: "Create Payment Reminder",
      text: "Set up automated reminders for upcoming or overdue payments.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-reminders-table']",
      title: "Reminders List",
      text: "View all active reminders with due dates, amounts, and recipient information.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-reminder-templates']",
      title: "Reminder Templates",
      text: "Configure email/SMS templates for different types of payment reminders.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-reminder-settings']",
      title: "Reminder Settings",
      text: "Configure reminder schedules, escalation rules, and notification preferences.",
      position: "right",
    },
    {
      element: "[data-tour='accounts-send-reminder-button']",
      title: "Send Manual Reminder",
      text: "Send immediate reminders to customers or follow up on overdue accounts.",
      position: "left",
    },
    // Navigation to Tasks
    {
      element: "[data-tour='accounts-reminders-header']",
      title: "Moving to Accounts Tasks",
      text: "Reminders covered! Click 'Next' to explore Accounts Tasks.",
      position: "bottom",
      navigation: {
        path: "/accounts/tasks",
      },
    },

    // ===== ACCOUNTS TASKS SECTION =====
    {
      element: "[data-tour='accounts-tasks-header']",
      title: "Accounts Tasks Management",
      text: "Assign and track accounting-related tasks for your team members with progress monitoring.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-add-task-button']",
      title: "Create New Task",
      text: "Assign a new accounting task to team members with deadlines and priorities.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-tasks-table']",
      title: "Tasks List",
      text: "View all accounting tasks with their status, assignments, and due dates.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-task-filters']",
      title: "Task Filters",
      text: "Filter tasks by status, assignee, priority, or due date for better organization.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-task-actions']",
      title: "Task Actions",
      text: "Update task status, reassign tasks, or view task details and history.",
      position: "left",
    },
    // Navigation to Reports
    {
      element: "[data-tour='accounts-tasks-header']",
      title: "Moving to Financial Reports",
      text: "Tasks covered! Click 'Next' to explore Financial Reports.",
      position: "bottom",
      navigation: {
        path: "/accounts/reports",
      },
    },

    // ===== REPORTS & ANALYTICS SECTION =====
    {
      element: "[data-tour='accounts-reports-header']",
      title: "Financial Reports & Analytics",
      text: "Generate comprehensive financial reports, analytics, and export data for decision making.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-reports-selector']",
      title: "Report Types",
      text: "Choose from Profit & Loss, Balance Sheet, Cash Flow, Receivables Aging, or GST Reports.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-reports-date-range']",
      title: "Date Range Filter",
      text: "Select specific date ranges to filter report data and financial periods.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-reports-export-button']",
      title: "Export Financial Reports",
      text: "Download financial reports in PDF, Excel, or CSV format for external analysis.",
      position: "left",
    },
    {
      element: "[data-tour='accounts-financial-metrics']",
      title: "Key Financial Metrics",
      text: "View important financial KPIs including profitability ratios, liquidity metrics, and collection efficiency.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-cash-flow-chart']",
      title: "Cash Flow Analysis",
      text: "Visualize cash flow patterns and forecast future financial positions.",
      position: "right",
    },
    // Navigation to Attendance
    {
      element: "[data-tour='accounts-reports-header']",
      title: "Moving to Staff Attendance",
      text: "Reports covered! Click 'Next' to explore Staff Attendance tracking.",
      position: "bottom",
      navigation: {
        path: "/accounts/attendance",
      },
    },

    // ===== STAFF ATTENDANCE SECTION =====
    {
      element: "[data-tour='accounts-attendance-header']",
      title: "Staff Attendance Management",
      text: "Track attendance and leave management for accounts team members with reporting.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-attendance-calendar']",
      title: "Attendance Calendar",
      text: "View attendance patterns and schedules in calendar format for easy visualization.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-attendance-table']",
      title: "Attendance Records",
      text: "Detailed attendance records with check-in/out times, leave requests, and approvals.",
      position: "top",
    },
    {
      element: "[data-tour='accounts-attendance-filters']",
      title: "Attendance Filters",
      text: "Filter attendance by employee, date range, or status to find specific records.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-attendance-actions']",
      title: "Attendance Actions",
      text: "Approve leave requests, view attendance details, or manage attendance records.",
      position: "left",
    },
    // Tour Completion
    {
      element: "[data-tour='accounts-attendance-header']",
      title: "Accounts Module Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Accounts module flow tour covering all features from dashboard to attendance.",
      position: "bottom",
    },
  ],
};

// Flow-based marketing module tour that covers all features in a continuous sequence
export const marketingFlowTour = {
  name: "marketing-flow-tour",
  steps: [
    // ===== MARKETING DASHBOARD SECTION =====
    {
      element: "[data-tour='marketing-header']",
      title: "Welcome to Marketing Module Tour",
      text: "This comprehensive tour will guide you through all features of the Marketing module in a continuous flow, from dashboard to attendance.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-dashboard']",
      title: "Marketing Dashboard Overview",
      text: "Your marketing control center with lead metrics, conversion rates, and campaign performance tracking.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-leads']",
      title: "Lead Management",
      text: "Track and manage sales leads through the complete conversion funnel from prospect to customer.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-field-visits']",
      title: "Field Visits",
      text: "Schedule and track field visits to leads and customers with geo-location and follow-up management.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-tasks']",
      title: "Marketing Tasks",
      text: "Assign and manage marketing-related tasks for your team members with progress tracking.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-reports']",
      title: "Marketing Reports",
      text: "Generate marketing analytics, conversion reports, and performance metrics.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-attendance']",
      title: "Staff Attendance",
      text: "Track attendance and leave management for marketing team members.",
      position: "right",
    },
    // Navigation to Leads
    {
      element: "[data-tour='marketing-header']",
      title: "Moving to Lead Management",
      text: "Click 'Next' to navigate to Lead Management and continue the tour there.",
      position: "bottom",
      navigation: {
        path: "/marketing/leads",
      },
    },

    // ===== LEADS SECTION =====
    {
      element: "[data-tour='marketing-leads-header']",
      title: "Lead Management System",
      text: "Comprehensive lead tracking from initial contact through conversion with status workflow management.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-add-lead-button']",
      title: "Add New Lead",
      text: "Create a new lead entry with contact information, source, and initial qualification details.",
      position: "left",
    },
    {
      element: "[data-tour='marketing-leads-table']",
      title: "Leads Pipeline",
      text: "View all leads in pipeline format with status, value, conversion probability, and next actions.",
      position: "top",
    },
    {
      element: "[data-tour='marketing-leads-filters']",
      title: "Lead Filters",
      text: "Filter leads by status, source, assigned person, or conversion stage for focused management.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-lead-status-workflow']",
      title: "Lead Status Workflow",
      text: "Track lead progression through qualification stages: New → Contacted → Qualified → Proposal → Negotiation → Closed.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-lead-actions']",
      title: "Lead Actions",
      text: "Update lead status, schedule follow-ups, assign to team members, or convert to opportunity.",
      position: "left",
    },
    {
      element: "[data-tour='marketing-lead-conversion-button']",
      title: "Convert Lead",
      text: "Convert qualified leads to customers and create sales opportunities.",
      position: "left",
    },
    // Navigation to Field Visits
    {
      element: "[data-tour='marketing-leads-header']",
      title: "Moving to Field Visits",
      text: "Lead management covered! Click 'Next' to navigate to Field Visits.",
      position: "bottom",
      navigation: {
        path: "/marketing/field-visits",
      },
    },

    // ===== FIELD VISITS SECTION =====
    {
      element: "[data-tour='marketing-field-visits-header']",
      title: "Field Visits Management",
      text: "Schedule, track, and manage field visits to leads and customers with geo-location and follow-up tracking.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-schedule-visit-button']",
      title: "Schedule Field Visit",
      text: "Schedule a new field visit with lead/customer details, location, and appointment time.",
      position: "left",
    },
    {
      element: "[data-tour='marketing-visits-calendar']",
      title: "Visits Calendar",
      text: "View scheduled field visits in calendar format with time slots and location details.",
      position: "top",
    },
    {
      element: "[data-tour='marketing-visits-table']",
      title: "Field Visits List",
      text: "Track all field visits with status, outcomes, follow-up requirements, and performance metrics.",
      position: "top",
    },
    {
      element: "[data-tour='marketing-visit-status-tracking']",
      title: "Visit Status Tracking",
      text: "Monitor visit status: Scheduled → In Progress → Completed → Follow-up Required → Closed.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-geo-tracking']",
      title: "Geo-Location Tracking",
      text: "Track field representative locations and visit routes for efficiency monitoring.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-visit-actions']",
      title: "Visit Actions",
      text: "Update visit status, add visit notes, schedule follow-ups, or generate visit reports.",
      position: "left",
    },
    // Navigation to Tasks
    {
      element: "[data-tour='marketing-field-visits-header']",
      title: "Moving to Marketing Tasks",
      text: "Field visits covered! Click 'Next' to explore Marketing Tasks.",
      position: "bottom",
      navigation: {
        path: "/marketing/tasks",
      },
    },

    // ===== MARKETING TASKS SECTION =====
    {
      element: "[data-tour='marketing-tasks-header']",
      title: "Marketing Tasks Management",
      text: "Assign and track marketing-related tasks for your team members with progress monitoring and deadlines.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-add-task-button']",
      title: "Create Marketing Task",
      text: "Assign a new marketing task to team members with specific deadlines and priority levels.",
      position: "left",
    },
    {
      element: "[data-tour='marketing-tasks-table']",
      title: "Tasks List",
      text: "View all marketing tasks with their status, assignments, due dates, and completion tracking.",
      position: "top",
    },
    {
      element: "[data-tour='marketing-task-filters']",
      title: "Task Filters",
      text: "Filter tasks by status, assignee, priority, campaign, or due date for better organization.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-task-categories']",
      title: "Task Categories",
      text: "Organize tasks by categories: Lead Generation, Customer Outreach, Campaign Management, Event Planning, etc.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-task-actions']",
      title: "Task Actions",
      text: "Update task status, reassign tasks, add notes, or mark tasks as completed.",
      position: "left",
    },
    // Navigation to Reports
    {
      element: "[data-tour='marketing-tasks-header']",
      title: "Moving to Marketing Reports",
      text: "Tasks covered! Click 'Next' to explore Marketing Reports.",
      position: "bottom",
      navigation: {
        path: "/marketing/reports",
      },
    },

    // ===== REPORTS & ANALYTICS SECTION =====
    {
      element: "[data-tour='marketing-reports-header']",
      title: "Marketing Reports & Analytics",
      text: "Generate comprehensive marketing reports, conversion analytics, and performance metrics for decision making.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-reports-selector']",
      title: "Report Types",
      text: "Choose from Lead Conversion, Campaign Performance, Field Visit Analytics, or ROI Reports.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-reports-date-range']",
      title: "Date Range Filter",
      text: "Select specific date ranges to filter marketing data and campaign performance.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-reports-export-button']",
      title: "Export Marketing Reports",
      text: "Download marketing reports in PDF, Excel, or CSV format for external analysis.",
      position: "left",
    },
    {
      element: "[data-tour='marketing-conversion-funnel']",
      title: "Conversion Funnel Analysis",
      text: "Visualize lead conversion rates through each stage of the sales funnel.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-performance-metrics']",
      title: "Key Performance Metrics",
      text: "View important marketing KPIs including lead generation rates, conversion percentages, and campaign ROI.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-campaign-analytics']",
      title: "Campaign Analytics",
      text: "Analyze campaign performance, engagement metrics, and marketing channel effectiveness.",
      position: "right",
    },
    // Navigation to Attendance
    {
      element: "[data-tour='marketing-reports-header']",
      title: "Moving to Staff Attendance",
      text: "Reports covered! Click 'Next' to explore Staff Attendance tracking.",
      position: "bottom",
      navigation: {
        path: "/marketing/attendance",
      },
    },

    // ===== STAFF ATTENDANCE SECTION =====
    {
      element: "[data-tour='marketing-attendance-header']",
      title: "Staff Attendance Management",
      text: "Track attendance and leave management for marketing team members with reporting and scheduling.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-attendance-calendar']",
      title: "Attendance Calendar",
      text: "View attendance patterns and marketing team schedules in calendar format for easy visualization.",
      position: "top",
    },
    {
      element: "[data-tour='marketing-attendance-table']",
      title: "Attendance Records",
      text: "Detailed attendance records with check-in/out times, leave requests, and field visit coordination.",
      position: "top",
    },
    {
      element: "[data-tour='marketing-attendance-filters']",
      title: "Attendance Filters",
      text: "Filter attendance by employee, date range, department, or field visit status.",
      position: "bottom",
    },
    {
      element: "[data-tour='marketing-field-schedule']",
      title: "Field Schedule Integration",
      text: "Integrate attendance tracking with field visit schedules and travel time management.",
      position: "right",
    },
    {
      element: "[data-tour='marketing-attendance-actions']",
      title: "Attendance Actions",
      text: "Approve leave requests, view attendance details, coordinate with field schedules, or manage attendance records.",
      position: "left",
    },
    // Tour Completion
    {
      element: "[data-tour='marketing-attendance-header']",
      title: "Marketing Module Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Marketing module flow tour covering all features from dashboard to attendance.",
      position: "bottom",
    },
  ],
};

// Flow-based logistics module tour that covers all features in a continuous sequence
export const logisticsFlowTour = {
  name: "logistics-flow-tour",
  steps: [
    // ===== LOGISTICS DASHBOARD SECTION =====
    {
      element: "[data-tour='logistics-header']",
      title: "Welcome to Logistics Module Tour",
      text: "This comprehensive tour will guide you through all features of the Logistics module in a continuous flow, from dashboard to attendance.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-dashboard']",
      title: "Logistics Dashboard Overview",
      text: "Your logistics control center with shipment metrics, delivery tracking, and operational performance monitoring.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-shipments']",
      title: "Shipment Management",
      text: "Create, track, and manage shipments with real-time status updates and delivery coordination.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-status-workflow']",
      title: "Status Workflow",
      text: "Monitor shipment status progression and manage proof of delivery (POD) processes.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-tasks']",
      title: "Logistics Tasks",
      text: "Assign and manage logistics-related tasks for your team members with route optimization.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-reports']",
      title: "Logistics Reports",
      text: "Generate delivery analytics, performance reports, and operational metrics.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-attendance']",
      title: "Staff Attendance",
      text: "Track attendance and GPS location management for logistics team members.",
      position: "right",
    },
    // Navigation to Shipments
    {
      element: "[data-tour='logistics-header']",
      title: "Moving to Shipment Management",
      text: "Click 'Next' to navigate to Shipment Management and continue the tour there.",
      position: "bottom",
      navigation: {
        path: "/logistics/shipments",
      },
    },

    // ===== SHIPMENTS SECTION =====
    {
      element: "[data-tour='logistics-shipments-header']",
      title: "Shipment Management System",
      text: "Comprehensive shipment creation, tracking, and delivery management with real-time updates.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-create-shipment-button']",
      title: "Create New Shipment",
      text: "Create a new shipment with sender/receiver details, package information, and delivery requirements.",
      position: "left",
    },
    {
      element: "[data-tour='logistics-shipments-table']",
      title: "Shipments Overview",
      text: "View all shipments with tracking numbers, status, delivery dates, and current location.",
      position: "top",
    },
    {
      element: "[data-tour='logistics-shipments-filters']",
      title: "Shipment Filters",
      text: "Filter shipments by status, date range, delivery zone, or assigned driver for efficient management.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-tracking-system']",
      title: "Real-time Tracking",
      text: "Monitor shipment locations in real-time with GPS tracking and estimated delivery times.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-shipment-actions']",
      title: "Shipment Actions",
      text: "Update shipment status, reassign drivers, modify delivery details, or generate shipping labels.",
      position: "left",
    },
    {
      element: "[data-tour='logistics-route-optimization']",
      title: "Route Optimization",
      text: "Optimize delivery routes for multiple shipments to minimize time and fuel costs.",
      position: "right",
    },
    // Navigation to Status Workflow
    {
      element: "[data-tour='logistics-shipments-header']",
      title: "Moving to Status Workflow",
      text: "Shipment management covered! Click 'Next' to navigate to Status Workflow.",
      position: "bottom",
      navigation: {
        path: "/logistics/status-workflow",
      },
    },

    // ===== STATUS WORKFLOW SECTION =====
    {
      element: "[data-tour='logistics-status-workflow-header']",
      title: "Status Workflow Management",
      text: "Track shipment status progression and manage proof of delivery processes with automated updates.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-status-timeline']",
      title: "Status Timeline",
      text: "View complete shipment journey from pickup to delivery with timestamped status updates.",
      position: "top",
    },
    {
      element: "[data-tour='logistics-status-updates']",
      title: "Status Update System",
      text: "Automated and manual status updates: Booked → Picked Up → In Transit → Out for Delivery → Delivered.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-pod-management']",
      title: "Proof of Delivery (POD)",
      text: "Manage digital signatures, photos, and delivery confirmations for completed shipments.",
      position: "left",
    },
    {
      element: "[data-tour='logistics-exception-handling']",
      title: "Exception Handling",
      text: "Manage delivery exceptions, rescheduling, and customer notifications for failed deliveries.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-customer-communication']",
      title: "Customer Communication",
      text: "Automated SMS/email notifications for status updates and delivery tracking information.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-workflow-actions']",
      title: "Workflow Actions",
      text: "Update shipment status, capture POD, handle exceptions, or communicate with customers.",
      position: "left",
    },
    // Navigation to Tasks
    {
      element: "[data-tour='logistics-status-workflow-header']",
      title: "Moving to Logistics Tasks",
      text: "Status workflow covered! Click 'Next' to explore Logistics Tasks.",
      position: "bottom",
      navigation: {
        path: "/logistics/tasks",
      },
    },

    // ===== LOGISTICS TASKS SECTION =====
    {
      element: "[data-tour='logistics-tasks-header']",
      title: "Logistics Tasks Management",
      text: "Assign and track logistics-related tasks for your team members with route planning and delivery coordination.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-add-task-button']",
      title: "Create Logistics Task",
      text: "Assign delivery tasks to drivers with specific routes, time windows, and delivery priorities.",
      position: "left",
    },
    {
      element: "[data-tour='logistics-tasks-table']",
      title: "Tasks Overview",
      text: "View all logistics tasks with assignments, routes, delivery windows, and completion status.",
      position: "top",
    },
    {
      element: "[data-tour='logistics-task-filters']",
      title: "Task Filters",
      text: "Filter tasks by driver, route, delivery zone, priority, or completion status.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-route-planning']",
      title: "Route Planning",
      text: "Plan optimized delivery routes considering traffic, time windows, and vehicle capacity.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-driver-assignment']",
      title: "Driver Assignment",
      text: "Assign tasks to available drivers based on location, skills, and vehicle type.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-task-actions']",
      title: "Task Actions",
      text: "Update task status, reassign drivers, modify routes, or track task progress.",
      position: "left",
    },
    // Navigation to Reports
    {
      element: "[data-tour='logistics-tasks-header']",
      title: "Moving to Logistics Reports",
      text: "Tasks covered! Click 'Next' to explore Logistics Reports.",
      position: "bottom",
      navigation: {
        path: "/logistics/reports",
      },
    },

    // ===== REPORTS & ANALYTICS SECTION =====
    {
      element: "[data-tour='logistics-reports-header']",
      title: "Logistics Reports & Analytics",
      text: "Generate comprehensive logistics reports, delivery analytics, and performance metrics for operational insights.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-reports-selector']",
      title: "Report Types",
      text: "Choose from Delivery Performance, Route Efficiency, Customer Satisfaction, or Financial Reports.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-reports-date-range']",
      title: "Date Range Filter",
      text: "Select specific date ranges to filter logistics data and performance metrics.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-reports-export-button']",
      title: "Export Logistics Reports",
      text: "Download logistics reports in PDF, Excel, or CSV format for external analysis.",
      position: "left",
    },
    {
      element: "[data-tour='logistics-delivery-metrics']",
      title: "Delivery Performance Metrics",
      text: "View key logistics KPIs including on-time delivery rates, route efficiency, and customer satisfaction.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-efficiency-analytics']",
      title: "Efficiency Analytics",
      text: "Analyze route optimization, fuel consumption, and operational cost efficiency.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-customer-feedback']",
      title: "Customer Feedback Analysis",
      text: "Track delivery satisfaction, complaint resolution, and service quality metrics.",
      position: "right",
    },
    // Navigation to Attendance
    {
      element: "[data-tour='logistics-reports-header']",
      title: "Moving to Staff Attendance",
      text: "Reports covered! Click 'Next' to explore Staff Attendance tracking.",
      position: "bottom",
      navigation: {
        path: "/logistics/attendance",
      },
    },

    // ===== STAFF ATTENDANCE SECTION =====
    {
      element: "[data-tour='logistics-attendance-header']",
      title: "Staff Attendance Management",
      text: "Track attendance and GPS location management for logistics team members with route verification.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-attendance-calendar']",
      title: "Attendance Calendar",
      text: "View attendance patterns and delivery schedules in calendar format for logistics coordination.",
      position: "top",
    },
    {
      element: "[data-tour='logistics-attendance-table']",
      title: "Attendance Records",
      text: "Detailed attendance records with check-in/out times, GPS locations, and delivery verification.",
      position: "top",
    },
    {
      element: "[data-tour='logistics-attendance-filters']",
      title: "Attendance Filters",
      text: "Filter attendance by driver, route, delivery zone, or time period for performance monitoring.",
      position: "bottom",
    },
    {
      element: "[data-tour='logistics-gps-tracking']",
      title: "GPS Location Tracking",
      text: "Monitor driver locations, route adherence, and delivery stop verification in real-time.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-route-verification']",
      title: "Route Verification",
      text: "Verify that drivers follow assigned routes and complete deliveries as scheduled.",
      position: "right",
    },
    {
      element: "[data-tour='logistics-attendance-actions']",
      title: "Attendance Actions",
      text: "Review attendance records, verify GPS data, approve leave requests, or manage driver schedules.",
      position: "left",
    },
    // Tour Completion
    {
      element: "[data-tour='logistics-attendance-header']",
      title: "Logistics Module Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Logistics module flow tour covering all features from dashboard to attendance.",
      position: "bottom",
    },
  ],
};

// Flow-based employees module tour that covers all features in a continuous sequence
export const employeesFlowTour = {
  name: "employees-flow-tour",
  steps: [
    // ===== EMPLOYEES DASHBOARD HEADER =====
    {
      element: "[data-tour='employees-header']",
      title: "Welcome to Employees Module Tour",
      text: "This comprehensive tour will guide you through all features of the Employee Management system.",
      position: "bottom",
    },
    {
      element: "[data-tour='employees-dashboard']",
      title: "Employee Management Overview",
      text: "Your employee control center with staff metrics, task management, and performance tracking.",
      position: "right",
    },
    {
      element: "[data-tour='employees-add-employee-button']",
      title: "Add New Employee",
      text: "Click here to add a new employee to your organization with their personal and professional details.",
      position: "left",
    },
    {
      element: "[data-tour='employees-assign-task-button']",
      title: "Assign Tasks",
      text: "Assign tasks to employees with priorities, deadlines, and progress tracking.",
      position: "left",
    },

    // ===== KPI METRICS CARDS =====
    {
      element: "[data-tour='employees-total-employees-card']",
      title: "Total Employees",
      text: "View the total number of employees in your organization.",
      position: "top",
    },
    {
      element: "[data-tour='employees-active-employees-card']",
      title: "Active Employees",
      text: "See how many employees are currently active and working.",
      position: "top",
    },
    {
      element: "[data-tour='employees-active-tasks-card']",
      title: "Active Tasks",
      text: "Monitor the number of tasks currently in progress across your team.",
      position: "top",
    },
    {
      element: "[data-tour='employees-completed-tasks-card']",
      title: "Completed Tasks",
      text: "Track task completion rates and team productivity.",
      position: "top",
    },

    // ===== EMPLOYEES TABLE SECTION =====
    {
      element: "[data-tour='employees-table-header']",
      title: "Employee Directory",
      text: "Comprehensive employee database with contact information, roles, and department assignments.",
      position: "bottom",
    },
    {
      element: "[data-tour='employees-table']",
      title: "Employee List",
      text: "View all employees with their names, emails, departments, roles, and status information.",
      position: "top",
    },
    {
      element: "[data-tour='employees-search-filter']",
      title: "Search & Filter",
      text: "Search employees by name or filter by department, role, or status.",
      position: "bottom",
    },
    {
      element: "[data-tour='employees-table-actions']",
      title: "Employee Actions",
      text: "Edit employee information, update roles, manage permissions, or view detailed profiles.",
      position: "left",
    },

    // ===== TASKS TABLE SECTION =====
    {
      element: "[data-tour='employees-tasks-header']",
      title: "Task Management System",
      text: "Track and manage all employee tasks, assignments, and project progress.",
      position: "bottom",
    },
    {
      element: "[data-tour='employees-tasks-table']",
      title: "Tasks Overview",
      text: "View all tasks with titles, assignees, priorities, due dates, and completion status.",
      position: "top",
    },
    {
      element: "[data-tour='employees-tasks-search']",
      title: "Task Search",
      text: "Search tasks by title, assignee, or project to find specific assignments quickly.",
      position: "bottom",
    },
    {
      element: "[data-tour='employees-tasks-filters']",
      title: "Task Filters",
      text: "Filter tasks by status (New, In Progress, Completed), priority, or due date.",
      position: "bottom",
    },
    {
      element: "[data-tour='employees-tasks-actions']",
      title: "Task Actions",
      text: "Update task status, reassign tasks, edit details, or mark tasks as completed.",
      position: "left",
    },

    // ===== QUICK ACTIONS SIDEBAR =====
    {
      element: "[data-tour='employees-quick-actions']",
      title: "Quick Actions Panel",
      text: "Access frequently used functions for efficient employee and task management.",
      position: "left",
    },
    {
      element: "[data-tour='employees-quick-add-employee']",
      title: "Quick Add Employee",
      text: "Rapid employee onboarding with essential information fields.",
      position: "left",
    },
    {
      element: "[data-tour='employees-quick-assign-task']",
      title: "Quick Task Assignment",
      text: "Fast task creation and assignment to keep projects moving forward.",
      position: "left",
    },
    {
      element: "[data-tour='employees-quick-reports']",
      title: "Quick Reports",
      text: "Generate instant reports on employee performance, task completion, and team metrics.",
      position: "left",
    },

    // ===== EMPLOYEE FORM DETAILS =====
    {
      element: "[data-tour='employees-form-first-name']",
      title: "Employee Information",
      text: "Enter personal details including name, contact information, and professional background.",
      position: "right",
    },
    {
      element: "[data-tour='employees-form-department']",
      title: "Department & Role Assignment",
      text: "Assign employees to departments and define their roles and responsibilities.",
      position: "right",
    },
    {
      element: "[data-tour='employees-form-username']",
      title: "Login Credentials",
      text: "Set up secure login credentials for system access and account management.",
      position: "right",
    },

    // ===== TASK FORM DETAILS =====
    {
      element: "[data-tour='employees-task-form-title']",
      title: "Task Details",
      text: "Define task objectives, requirements, and success criteria clearly.",
      position: "right",
    },
    {
      element: "[data-tour='employees-task-form-priority']",
      title: "Priority & Deadline Setting",
      text: "Set task priority levels and realistic deadlines for effective project management.",
      position: "right",
    },
    {
      element: "[data-tour='employees-task-form-assignee']",
      title: "Task Assignment",
      text: "Assign tasks to the most appropriate team members based on skills and availability.",
      position: "right",
    },

    // Tour Completion
    {
      element: "[data-tour='employees-header']",
      title: "Employee Management Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Employee Management module tour covering all features for effective team administration.",
      position: "bottom",
    },
  ],
};

// Flow-based admin module tour that covers all features in a continuous sequence
export const adminFlowTour = {
  name: "admin-flow-tour",
  steps: [
    // ===== ADMIN DASHBOARD SECTION =====
    {
      element: "[data-tour='admin-header']",
      title: "Welcome to Admin Module Tour",
      text: "This comprehensive tour will guide you through all features of the Admin module in a continuous flow, from dashboard to task console.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-dashboard']",
      title: "Admin Dashboard Overview",
      text: "Your system control center with comprehensive metrics across all departments and system-wide management tools.",
      position: "right",
    },
    {
      element: "[data-tour='admin-navigation-menu']",
      title: "Admin Navigation",
      text: "Access all administrative functions including audit logs, settings, approvals, backup, reports, and task management.",
      position: "right",
    },
    {
      element: "[data-tour='nav-dashboard']",
      title: "Dashboard Home",
      text: "Return to the main admin dashboard with system-wide metrics and department overviews.",
      position: "right",
    },
    {
      element: "[data-tour='nav-audit-log']",
      title: "Audit Log Access",
      text: "Monitor all system activities, user actions, and security events for compliance and troubleshooting.",
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
      text: "Manage pending approvals for invoices, quotations, leave requests, and other business processes.",
      position: "right",
    },
    {
      element: "[data-tour='nav-backup']",
      title: "Backup & Recovery",
      text: "Create system backups and manage data recovery operations for business continuity.",
      position: "right",
    },
    {
      element: "[data-tour='nav-reports']",
      title: "System Reports",
      text: "Generate comprehensive reports and analytics across all business modules.",
      position: "right",
    },
    {
      element: "[data-tour='nav-tasks']",
      title: "Task Console",
      text: "Monitor and manage system tasks, background processes, and scheduled operations.",
      position: "right",
    },
    // Navigation to Audit Log
    {
      element: "[data-tour='admin-header']",
      title: "Moving to Audit Log",
      text: "Click 'Next' to navigate to Audit Log and continue the tour there.",
      position: "bottom",
      navigation: {
        path: "/admin/audit-log",
      },
    },

    // ===== AUDIT LOG SECTION =====
    {
      element: "[data-tour='admin-audit-log-header']",
      title: "Audit Log Management",
      text: "Comprehensive system activity tracking for compliance, security monitoring, and troubleshooting.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-audit-log-table']",
      title: "Activity Log",
      text: "View all system activities with timestamps, user information, and detailed action descriptions.",
      position: "top",
    },
    {
      element: "[data-tour='admin-audit-log-filters']",
      title: "Audit Filters",
      text: "Filter audit logs by user, action type, date range, or module for targeted investigation.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-audit-log-export']",
      title: "Export Audit Data",
      text: "Export audit logs for compliance reporting, security analysis, or regulatory requirements.",
      position: "left",
    },
    {
      element: "[data-tour='admin-audit-log-search']",
      title: "Audit Search",
      text: "Search for specific activities, users, or time periods in the audit trail.",
      position: "bottom",
    },
    // Navigation to Settings
    {
      element: "[data-tour='admin-audit-log-header']",
      title: "Moving to Master Settings",
      text: "Audit log covered! Click 'Next' to navigate to Master Settings.",
      position: "bottom",
      navigation: {
        path: "/admin/settings",
      },
    },

    // ===== MASTER SETTINGS SECTION =====
    {
      element: "[data-tour='admin-settings-header']",
      title: "Master Settings Configuration",
      text: "Configure system-wide settings, business parameters, and application preferences.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-gst-input']",
      title: "GST Number Configuration",
      text: "Enter your company's GST registration number for tax compliance and invoicing.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-tax-rate-input']",
      title: "Default Tax Rate",
      text: "Set the default tax rate percentage for automatic calculations in invoices and quotations.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-bank-account-input']",
      title: "Bank Account Details",
      text: "Configure bank account information for payments, reconciliation, and financial reporting.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-payment-terms-input']",
      title: "Payment Terms",
      text: "Set standard payment terms (e.g., 30 days) for your business transactions.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-settings-save-button']",
      title: "Save Settings",
      text: "Save all master settings to apply system-wide changes.",
      position: "top",
    },
    {
      element: "[data-tour='admin-settings-reset-button']",
      title: "Reset to Defaults",
      text: "Reset all settings to system defaults if needed.",
      position: "top",
    },
    // Navigation to Approvals
    {
      element: "[data-tour='admin-settings-header']",
      title: "Moving to Approvals System",
      text: "Settings covered! Click 'Next' to navigate to Approvals management.",
      position: "bottom",
      navigation: {
        path: "/admin/approvals",
      },
    },

    // ===== APPROVALS SECTION =====
    {
      element: "[data-tour='admin-approvals-header']",
      title: "Approvals Management System",
      text: "Manage pending approvals for business processes, requests, and workflow items.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-approvals-pending-list']",
      title: "Pending Approvals",
      text: "View all items waiting for approval including invoices, quotations, leave requests, and payments.",
      position: "top",
    },
    {
      element: "[data-tour='admin-approvals-filters']",
      title: "Approval Filters",
      text: "Filter approvals by type, requester, priority, or due date for efficient processing.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-approvals-approve-button']",
      title: "Approve Requests",
      text: "Review and approve pending requests with comments and approval workflow.",
      position: "left",
    },
    {
      element: "[data-tour='admin-approvals-reject-button']",
      title: "Reject Requests",
      text: "Reject requests with reasons and feedback for process improvement.",
      position: "left",
    },
    {
      element: "[data-tour='admin-approvals-bulk-actions']",
      title: "Bulk Approval Actions",
      text: "Process multiple approvals simultaneously for efficiency.",
      position: "left",
    },
    // Navigation to Backup
    {
      element: "[data-tour='admin-approvals-header']",
      title: "Moving to Backup & Recovery",
      text: "Approvals covered! Click 'Next' to navigate to Backup & Recovery.",
      position: "bottom",
      navigation: {
        path: "/admin/backup",
      },
    },

    // ===== BACKUP & RECOVERY SECTION =====
    {
      element: "[data-tour='admin-backup-header']",
      title: "Backup & Recovery Management",
      text: "Create system backups and manage data recovery operations for business continuity.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-backup-create-button']",
      title: "Create Backup",
      text: "Initiate a new system backup to ensure data safety and disaster recovery capability.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-backup-schedule']",
      title: "Backup Scheduling",
      text: "Configure automated backup schedules for regular data protection.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-backup-history']",
      title: "Backup History",
      text: "View all backup operations with status, size, and completion times.",
      position: "top",
    },
    {
      element: "[data-tour='admin-backup-restore-button']",
      title: "Restore from Backup",
      text: "Restore the system from a previous backup in case of data loss or corruption.",
      position: "left",
    },
    {
      element: "[data-tour='admin-backup-download']",
      title: "Download Backup",
      text: "Download backup files for offsite storage or additional security.",
      position: "left",
    },
    // Navigation to Reports
    {
      element: "[data-tour='admin-backup-header']",
      title: "Moving to System Reports",
      text: "Backup covered! Click 'Next' to navigate to System Reports.",
      position: "bottom",
      navigation: {
        path: "/admin/reports",
      },
    },

    // ===== SYSTEM REPORTS SECTION =====
    {
      element: "[data-tour='admin-reports-header']",
      title: "System Reports & Analytics",
      text: "Generate comprehensive system reports and analytics for monitoring and decision making.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-reports-selector']",
      title: "Report Types",
      text: "Choose from System Performance, User Activity, Module Usage, or Custom Reports.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-reports-date-range']",
      title: "Report Date Range",
      text: "Select specific date ranges for targeted reporting and trend analysis.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-reports-export-button']",
      title: "Export System Reports",
      text: "Download system reports in PDF, Excel, or CSV format for external analysis.",
      position: "left",
    },
    {
      element: "[data-tour='admin-reports-dashboard']",
      title: "System Dashboard Metrics",
      text: "View real-time system metrics including performance, usage, and health indicators.",
      position: "top",
    },
    {
      element: "[data-tour='admin-reports-user-activity']",
      title: "User Activity Reports",
      text: "Analyze user engagement, login patterns, and feature usage across the system.",
      position: "right",
    },
    // Navigation to Tasks
    {
      element: "[data-tour='admin-reports-header']",
      title: "Moving to Task Console",
      text: "Reports covered! Click 'Next' to navigate to Task Console.",
      position: "bottom",
      navigation: {
        path: "/admin/tasks",
      },
    },

    // ===== TASK CONSOLE SECTION =====
    {
      element: "[data-tour='admin-tasks-header']",
      title: "Task Console Management",
      text: "Monitor and manage system tasks, background processes, and scheduled operations.",
      position: "bottom",
    },
    {
      element: "[data-tour='admin-tasks-active-list']",
      title: "Active Tasks",
      text: "View currently running system tasks and background processes.",
      position: "top",
    },
    {
      element: "[data-tour='admin-tasks-scheduled-list']",
      title: "Scheduled Tasks",
      text: "Monitor upcoming scheduled tasks and automated operations.",
      position: "top",
    },
    {
      element: "[data-tour='admin-tasks-completed-list']",
      title: "Task History",
      text: "Review completed tasks with execution times, status, and results.",
      position: "top",
    },
    {
      element: "[data-tour='admin-tasks-stop-button']",
      title: "Stop Task",
      text: "Stop running tasks if needed for system maintenance or issue resolution.",
      position: "left",
    },
    {
      element: "[data-tour='admin-tasks-restart-button']",
      title: "Restart Task",
      text: "Restart failed or stopped tasks to resume operations.",
      position: "left",
    },
    {
      element: "[data-tour='admin-tasks-logs']",
      title: "Task Logs",
      text: "View detailed logs for task execution, errors, and performance metrics.",
      position: "right",
    },
    // Tour Completion
    {
      element: "[data-tour='admin-tasks-header']",
      title: "Admin Module Tour Complete!",
      text: "Congratulations! You've completed the comprehensive Admin module flow tour covering all system management features.",
      position: "bottom",
    },
  ],
};

// Template for creating comprehensive module tours
// To create a comprehensive tour for any module, follow this pattern:
// 1. Create individual sub-tours for each page/section
// 2. Create a comprehensive tour that chains them together with navigation
// 3. Update the module layout to use the comprehensive tour
// 4. Ensure proper data-tour attributes are set on UI elements

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

// Example of how to create a comprehensive accounts tour (uncomment and customize):
/*
export const comprehensiveAccountsTour = {
  name: "comprehensive-accounts-module",
  steps: [
    // Accounts Dashboard Section
    {
      element: "[data-tour='accounts-header']",
      title: "Welcome to Accounts Module Tour",
      text: "This comprehensive tour will guide you through all features of the Accounts module.",
      position: "bottom",
    },
    {
      element: "[data-tour='accounts-dashboard']",
      title: "Accounts Dashboard Overview",
      text: "Your financial control center with key metrics and navigation.",
      position: "right",
    },

    // Navigate to Receivables
    {
      element: "[data-tour='receivables']",
      title: "Receivables Management - Let's Begin",
      text: "Click 'Next' to explore receivables management and payment tracking.",
      position: "right",
      navigation: {
        path: "/accounts/receivables",
        tourConfig: {
          name: "comprehensive-accounts-receivables",
          steps: [
            // Add receivables-specific tour steps here
          ],
        },
      },
    },

    // Continue with other sections...
  ],
};
*/

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

export const modulesNavigationTour = {
  name: "modules-navigation",
  steps: [
    {
      element: "[data-tour='nav-module-admin']",
      title: "Admin Module",
      text: "Access system-wide administration, settings, audit logs, and approvals. Perfect for monitoring and configuring your entire business system.",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-module-inventory']",
      title: "Inventory Module",
      text: "Manage your product inventory, stock levels, warehouse operations, and supplier relationships. Track all your physical assets efficiently.",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-module-sales']",
      title: "Sales Module",
      text: "Handle sales operations including client management, quotations, invoices, and revenue tracking. Streamline your sales workflow.",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-module-accounts']",
      title: "Accounts Module",
      text: "Manage financial operations including accounts payable, receivables, bank management, and tax compliance (GST/VAT).",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-module-marketing']",
      title: "Marketing Module",
      text: "Manage marketing campaigns, leads, field visits, and customer engagement. Track and optimize your marketing efforts.",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-module-logistics']",
      title: "Logistics Module",
      text: "Handle shipment management, delivery tracking, and logistics operations. Ensure efficient supply chain execution.",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-module-employees']",
      title: "Employees Module",
      text: "Manage your workforce including attendance, tasks, leave requests, and employee information. Oversee all human resources.",
      position: "bottom",
    },
  ],
};

export const adminModulesFlowTour = {
  name: "admin-modules-flow-tour",
  steps: [
    ...modulesNavigationTour.steps,
    ...adminFlowTour.steps,
  ],
};
