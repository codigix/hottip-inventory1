import fs from 'fs';
import path from 'path';

const filePath = 'client/src/components/tours/dashboardTour.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of orphaned content
const orphanStart = content.indexOf('    // ===== INBOUND QUOTATIONS SECTION =====');
console.log('Orphan start index:', orphanStart);

if (orphanStart > 0) {
  // Find the end - the duplicate export statement
  const duplicateExport = 'export const comprehensiveSalesTour = salesFlowTour;';
  const orphanEnd = content.indexOf(duplicateExport, orphanStart);
  console.log('Orphan end index:', orphanEnd);
  
  if (orphanEnd > 0) {
    // Keep everything before the orphan and everything after the duplicate export
    const before = content.substring(0, orphanStart);
    const after = content.substring(orphanEnd + duplicateExport.length);
    
    const fixed = before + '\n' + after;
    fs.writeFileSync(filePath, fixed);
    console.log('File fixed!');
  }
}
