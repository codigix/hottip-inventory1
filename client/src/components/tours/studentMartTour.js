// Student Mart Tour Configuration
export const studentMartTourConfig = {
  id: 'studentmart-tour',
  steps: [
    {
      id: 'studentmart-welcome',
      title: 'Welcome to Student Mart',
      text: 'Student Mart is your one-stop shop for campus merchandise and supplies.',
      attachTo: {
        element: '[data-tour="studentmart-main"]',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Next',
          action() {
            return this.next();
          },
        },
      ],
    },
    {
      id: 'studentmart-categories',
      title: 'Browse Categories',
      text: 'Browse different product categories. Click on any category to see available products.',
      attachTo: {
        element: '[data-tour="studentmart-categories"]',
        on: 'right',
      },
      buttons: [
        {
          text: 'Back',
          action() {
            return this.back();
          },
        },
        {
          text: 'Next',
          action() {
            return this.next();
          },
        },
      ],
    },
    {
      id: 'studentmart-products',
      title: 'Product Listings',
      text: 'Browse available products with prices and descriptions. Click on any product to view more details.',
      attachTo: {
        element: '[data-tour="studentmart-products"]',
        on: 'left',
      },
      buttons: [
        {
          text: 'Back',
          action() {
            return this.back();
          },
        },
        {
          text: 'Next',
          action() {
            return this.next();
          },
        },
      ],
    },
    {
      id: 'studentmart-cart',
      title: 'Shopping Cart',
      text: 'Your shopping cart is located here. Add products and proceed to checkout when ready.',
      attachTo: {
        element: '[data-tour="studentmart-cart"]',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          action() {
            return this.back();
          },
        },
        {
          text: 'Next',
          action() {
            return this.next();
          },
        },
      ],
    },
    {
      id: 'studentmart-search',
      title: 'Quick Search',
      text: 'Search for specific products by name or keyword. Use filters to narrow down your results.',
      attachTo: {
        element: '[data-tour="studentmart-search"]',
        on: 'bottom',
      },
      buttons: [
        {
          text: 'Back',
          action() {
            return this.back();
          },
        },
        {
          text: 'Finish',
          action() {
            return this.complete();
          },
        },
      ],
    },
  ],
};
