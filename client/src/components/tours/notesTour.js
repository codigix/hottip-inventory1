// Notes Module Tour Configuration
export const notesTourConfig = {
  id: 'notes-tour',
  steps: [
    {
      id: 'notes-welcome',
      title: 'Welcome to Notes Module',
      text: 'The Notes module allows you to create, organize, and manage important notes and documents.',
      attachTo: {
        element: '[data-tour="notes-main"]',
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
      id: 'notes-list',
      title: 'Your Notes',
      text: 'View all your notes here. Each note shows the title, creation date, and last modified time.',
      attachTo: {
        element: '[data-tour="notes-list"]',
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
      id: 'notes-create',
      title: 'Create New Note',
      text: 'Click this button to create a new note. You can add a title, content, and tags to organize your notes better.',
      attachTo: {
        element: '[data-tour="notes-create-btn"]',
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
      id: 'notes-search',
      title: 'Search & Filter',
      text: 'Use the search bar to find specific notes quickly. You can also filter by tags or categories.',
      attachTo: {
        element: '[data-tour="notes-search"]',
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
