// Events Module Tour Configuration
export const eventsTourConfig = {
  id: 'events-tour',
  steps: [
    {
      id: 'events-welcome',
      title: 'Welcome to Events Module',
      text: 'The Events module helps you manage campus events, schedules, and activities.',
      attachTo: {
        element: '[data-tour="events-main"]',
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
      id: 'events-calendar',
      title: 'Calendar View',
      text: 'View all upcoming events in a calendar format. Click on any date to see events scheduled for that day.',
      attachTo: {
        element: '[data-tour="events-calendar"]',
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
      id: 'events-list',
      title: 'Events List',
      text: 'View detailed information about each event including date, time, location, and description.',
      attachTo: {
        element: '[data-tour="events-list"]',
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
      id: 'events-create',
      title: 'Create Event',
      text: 'Click here to create a new event. Fill in the event details including title, date, time, and location.',
      attachTo: {
        element: '[data-tour="events-create-btn"]',
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
      id: 'events-filters',
      title: 'Filter Events',
      text: 'Use filters to view events by category, status, or date range. This helps you find exactly what you\'re looking for.',
      attachTo: {
        element: '[data-tour="events-filters"]',
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
