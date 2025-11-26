const fs = require('fs');

const filePath = 'client/src/components/GlobalNavbar.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Add tourId constant
const oldMapSection = 'const Icon = dept.icon;\n              const isActive = location === dept.href;\n              \n              return (';
const newMapSection = 'const Icon = dept.icon;\n              const isActive = location === dept.href;\n              const tourId = `nav-${dept.name.toLowerCase()}`;\n              \n              return (';

content = content.replace(oldMapSection, newMapSection);

// Add data-tour attribute to Button
const oldButton = 'className="flex items-center space-x-2"\n                  >';
const newButton = 'className="flex items-center space-x-2"\n                    data-tour={tourId}\n                  >';

content = content.replace(oldButton, newButton);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('GlobalNavbar.tsx updated successfully');
