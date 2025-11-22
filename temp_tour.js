
export const fullTour = {
  name: "full-tour",
  steps: [
    {
      element: "[data-tour='welcome-header']",
      title: "Welcome to the Full Tour!",
      text: "This tour will guide you through all the major modules of the application. Let's start with the Admin Dashboard.",
      position: "bottom",
    },
    {
      element: "[data-tour='nav-sales']",
      title: "Sales Module",
      text: "Now, let's move to the Sales Module.",
      position: "right",
      navigation: {
        path: "/sales",
        tourConfig: "salesTour",
      },
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
        element: "[data-tour='nav-inventory']",
        title: "Inventory Module",
        text: "Next, we'll explore the Inventory Module.",
        position: "right",
        navigation: {
            path: "/inventory",
            tourConfig: "inventoryTour",
        },
    }
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
        element: "[data-tour='nav-logistics']",
        title: "Logistics Module",
        text: "Let's proceed to the Logistics Module.",
        position: "right",
        navigation: {
            path: "/logistics",
            tourConfig: "logisticsTour",
        },
    }
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
        element: "[data-tour='nav-marketing']",
        title: "Marketing Module",
        text: "Now, let's check out the Marketing Module.",
        position: "right",
        navigation: {
            path: "/marketing",
            tourConfig: "marketingTour",
        },
    }
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
        element: "[data-tour='nav-accounts']",
        title: "Accounts Module",
        text: "Finally, let's visit the Accounts Module.",
        position: "right",
        navigation: {
            path: "/accounts",
            tourConfig: "accountsTour",
        },
    }
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
      title: "End of Tour",
      text: "You have completed the full tour of the application!",
      position: "center",
    },
  ],
};
