const fs = require('fs');
const path = require('path');

// Fix 1: AdminLayout.tsx
console.log('Updating AdminLayout.tsx...');
const adminLayoutPath = path.join(__dirname, 'client/src/components/AdminLayout.tsx');
let adminContent = fs.readFileSync(adminLayoutPath, 'utf8');

// Update import
adminContent = adminContent.replace(
  'import { adminFlowTour } from "@/components/tours/dashboardTour";',
  'import { adminFlowTour, modulesNavigationTour } from "@/components/tours/dashboardTour";'
);

// Update tourConfigWithNavigation object
const oldConfig = `  const tourConfigWithNavigation = {
    ...adminFlowTour,
    steps: adminFlowTour.steps.map((step) => {
      if (step.navigation) {
        // For the flow tour, navigation is already embedded in the tour config
        return step;
      }
      return step;
    }),
  };`;

const newConfig = `  const tourConfigWithNavigation = {
    name: "admin-modules-flow-tour",
    steps: [
      ...modulesNavigationTour.steps,
      ...adminFlowTour.steps,
    ],
  };`;

adminContent = adminContent.replace(oldConfig, newConfig);

// Update tourName prop
adminContent = adminContent.replace(
  'tourName="admin-flow-tour"',
  'tourName="admin-modules-flow-tour"'
);

fs.writeFileSync(adminLayoutPath, adminContent);
console.log('✓ AdminLayout.tsx updated');

// Fix 2: AdminDashboard.tsx
console.log('Updating AdminDashboard.tsx...');
const adminDashPath = path.join(__dirname, 'client/src/pages/AdminDashboard.tsx');
let dashContent = fs.readFileSync(adminDashPath, 'utf8');

// Remove imports
dashContent = dashContent.replace(
  'import { StartTourButton } from "@/components/StartTourButton";\nimport { dashboardTour } from "@/components/tours/dashboardTour";\n\n',
  ''
);

// Remove StartTourButton from header
dashContent = dashContent.replace(
  '          <StartTourButton tourConfig={dashboardTour} tourName="admin-dashboard" />',
  ''
);

// Remove data-tour attributes
dashContent = dashContent.replace(
  'data-tour="welcome-header"',
  ''
);

dashContent = dashContent.replace(
  '          data-tour="system-activity"',
  ''
);

fs.writeFileSync(adminDashPath, dashContent);
console.log('✓ AdminDashboard.tsx updated');

// Fix 3: Add export to dashboardTour.js
console.log('Updating dashboardTour.js...');
const tourPath = path.join(__dirname, 'client/src/components/tours/dashboardTour.js');
let tourContent = fs.readFileSync(tourPath, 'utf8');

// Check if adminModulesFlowTour already exists
if (!tourContent.includes('export const adminModulesFlowTour')) {
  const addition = `\nexport const adminModulesFlowTour = {
  name: "admin-modules-flow-tour",
  steps: [
    ...modulesNavigationTour.steps,
    ...adminFlowTour.steps,
  ],
};`;
  tourContent += addition;
  fs.writeFileSync(tourPath, tourContent);
  console.log('✓ dashboardTour.js updated');
} else {
  console.log('✓ adminModulesFlowTour already exists in dashboardTour.js');
}

console.log('\n✅ All tour fixes applied successfully!');
console.log('Tour flow: Modules Navigation → Admin Panel');
