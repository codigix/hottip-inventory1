// ChatRoom Tour Configuration
export const chatroomTourConfig = {
  id: 'chatroom-tour',
  steps: [
    {
      id: 'chatroom-welcome',
      title: 'Welcome to ChatRoom',
      text: 'ChatRoom is your space for real-time communication and collaboration with colleagues.',
      attachTo: {
        element: '[data-tour="chatroom-main"]',
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
      id: 'chatroom-channels',
      title: 'Channels',
      text: 'View all available channels. Each channel is dedicated to a specific topic or department. Click to join and start chatting.',
      attachTo: {
        element: '[data-tour="chatroom-channels"]',
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
      id: 'chatroom-messages',
      title: 'Message Thread',
      text: 'View the conversation thread. Messages are displayed in chronological order with user information and timestamps.',
      attachTo: {
        element: '[data-tour="chatroom-messages"]',
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
      id: 'chatroom-input',
      title: 'Send Messages',
      text: 'Type your message here and press Enter or click the Send button to share your message with the channel.',
      attachTo: {
        element: '[data-tour="chatroom-input"]',
        on: 'top',
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
      id: 'chatroom-members',
      title: 'Active Members',
      text: 'See who is currently active in the channel. Green indicators show online status.',
      attachTo: {
        element: '[data-tour="chatroom-members"]',
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
          text: 'Finish',
          action() {
            return this.complete();
          },
        },
      ],
    },
  ],
};
