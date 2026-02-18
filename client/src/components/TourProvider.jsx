import React from 'react';
import { ShepherdTourContext } from 'react-shepherd';
import 'shepherd.js/dist/shepherd.css';

export const TourProvider = ({ children }) => {
  return (
    <ShepherdTourContext>
      {children}
    </ShepherdTourContext>
  );
};
