# PDF Template Update - Mold Details & Quotation Items

## 📋 Overview

Updated the outbound quotation PDF template to match the new format with yellow-highlighted mold details sections and proper quotation items display.

## 🎨 Visual Changes

### 1. **Mold/Part Details Section**

- **Yellow Header**: Changed from gray (#e8e8e8) to bright yellow (#FFFF00)
- **Header Text**: Now displays as "1) MOLD / PART DETAILS", "2) MOLD / PART DETAILS", etc.
- **Table Layout**: Changed from horizontal 10-column layout to 4-row × 3-column grid layout

### 2. **Mold Details Table Structure**

The table now displays 13 fields in a 4×3 grid format:

| Row | Column 1        | Column 2             | Column 3             |
| --- | --------------- | -------------------- | -------------------- |
| 1   | 1. Part Name    | 5. Plastic Material  | 9. Colour Change     |
| 2   | 2. Mould no     | 6. MFI               | 10. Wall Thickness   |
| 3   | 3. No of Cavity | 7. GF% + MP%         | 11. System Suggested |
| 4   | 4. No of Drops  | 8. Part Weight (Gms) | 12. Trial Date       |

### 3. **Quotation Items Section**

- **Title**: "Quotation For [Part Name] - [Quotation Type]"
- **Table Columns**:
  - No
  - Part Name
  - Part Description
  - QTY
  - UOM
  - Unit Price (INR)
  - Amount (INR)
- **Total Row**: Shows "TOTAL INR" with sum of all items for that mold

## 🔧 Technical Changes

### Files Modified:

#### 1. **server/templates/quotation-hottip.ejs**

**CSS Changes:**

```css
/* Yellow header for mold sections */
.part-header {
  background: #ffff00; /* Changed from #e8e8e8 */
  font-size: 12px;
  padding: 6px 10px;
}

/* Yellow background for mold table headers */
table.mold-table th {
  background: #ffff00; /* Changed from #d9d9d9 */
  font-size: 8px;
  padding: 4px 3px;
}

/* New style for quotation title */
.quotation-for-title {
  font-weight: bold;
  font-size: 11px;
  margin-top: 12px;
  margin-bottom: 8px;
}
```

**HTML Structure Changes:**

- Changed mold details from single-row table to 4-row grid layout
- Added numbered labels (1-12) for each field
- Implemented quotation items filtering by mold part name
- Added "Quotation For" title between mold details and items

#### 2. **server/sales-routes-registry.ts**

**Calculation Update:**

```typescript
// OLD: Calculated from moldDetails.quotation_spare_parts
const basicAmount = quotation.moldDetails?.reduce((sum, part) => {
  return sum + (part.quotation_spare_parts?.reduce(...) || 0);
}, 0) || quotation.subtotalAmount || 0;

// NEW: Calculates from quotationItems array
const basicAmount = quotation.quotationItems?.reduce((sum, item) => {
  return sum + (item.amount || 0);
}, 0) || quotation.subtotalAmount || 0;
```

## 📊 Data Structure

### Mold Details Fields (13 fields):

1. `partName` - Part name
2. `mouldNo` - Mould number
3. `noOfCavity` - Number of cavities
4. `noOfDrops` - Number of drops
5. `plasticMaterial` - Plastic material type
6. `mfi` - Melt Flow Index
7. `gfPercent` + `mfPercent` - Glass Fiber % + Mineral Filler %
8. `partWeight` - Part weight in grams
9. `colourChange` - Color change requirement
10. `wallThickness` - Wall thickness
11. `systemSuggested` - Suggested system
12. `trialDate` - Trial date
13. `quotationFor` - Quotation type (Production/Trial/etc.)

### Quotation Items Fields (7 fields):

1. `no` - Serial number
2. `partName` - Part name (links to mold)
3. `partDescription` - Detailed description
4. `qty` - Quantity
5. `uom` - Unit of measurement
6. `unitPrice` - Price per unit
7. `amount` - Total amount (qty × unitPrice)

## 🔗 Data Linking

The template links quotation items to molds by matching:

```javascript
const moldItems = quotation.quotationItems.filter(
  (item) => item.partName === mold.partName || item.no === mold.no
);
```

This ensures each mold section displays only its relevant quotation items.

## 📄 PDF Layout

### Page Structure:

1. **Header** - Company info (HOTTIP INDIA POLYMERS)
2. **Customer & Quotation Info** - Two-column layout
3. **Mold Sections** (repeating):
   - Yellow header: "N) MOLD / PART DETAILS"
   - Mold details table (4 rows × 3 columns)
   - "Quotation For [Part Name]" title
   - Quotation items table
   - Total row for items
4. **Financial Summary**:
   - Basic Amount
   - IGST (18%)
   - Grand Total
5. **Footer** - Terms & conditions, bank details, payment terms

## 🎯 Key Features

✅ **Multiple Molds**: Supports multiple mold/part details in one quotation
✅ **Yellow Highlighting**: Professional yellow (#FFFF00) headers matching reference design
✅ **Numbered Fields**: Clear field numbering (1-12) for easy reference
✅ **Grouped Items**: Quotation items grouped under their respective molds
✅ **Automatic Totals**: Calculates totals per mold and grand total
✅ **Professional Layout**: Clean, organized table structure
✅ **Print-Ready**: Optimized for A4 paper with proper margins

## 🧪 Testing

### Test the PDF Generation:

1. Navigate to: `http://localhost:5173/sales/outbound-quotations`
2. Open an existing quotation with mold details and items
3. Click the **Download PDF** button
4. Verify:
   - Yellow headers display correctly
   - Mold details show in 4×3 grid
   - Quotation items appear below each mold
   - Totals calculate correctly
   - Multiple molds display on separate sections

### Sample Test Data:

```json
{
  "moldDetails": [
    {
      "no": 1,
      "partName": "TTC 161",
      "mouldNo": "250ML JAR",
      "plasticMaterial": "PP",
      "colourChange": "YES",
      "mfi": "10",
      "wallThickness": "0.4 MM",
      "noOfCavity": 1,
      "gfPercent": "0",
      "mfPercent": "0",
      "partWeight": 7.8,
      "systemSuggested": "Single Valve gate",
      "noOfDrops": 1,
      "trialDate": "2024-01-15",
      "quotationFor": "SINGLE DROP NEEDLE VALVE GATE PNEUMATIC HOT SPRUE"
    }
  ],
  "quotationItems": [
    {
      "no": 1,
      "partName": "TTC 161",
      "partDescription": "VALVE TYPE NOZZLE AMP-D15-26120",
      "qty": 1,
      "uom": "NOS",
      "unitPrice": 176500.0,
      "amount": 176500.0
    },
    {
      "no": 2,
      "partName": "TTC 161",
      "partDescription": "CONNECTOR SET HOT/BOX/24 PIN MALE",
      "qty": 1,
      "uom": "NOS",
      "unitPrice": 0.0,
      "amount": 0.0
    }
  ]
}
```

## 🚀 Deployment

### Steps to Apply Changes:

1. ✅ Updated `server/templates/quotation-hottip.ejs`
2. ✅ Updated `server/sales-routes-registry.ts`
3. ✅ Restarted backend server
4. ⏳ Test PDF generation with sample data
5. ⏳ Verify all mold details and items display correctly

## 📝 Notes

- **Color Code**: Yellow (#FFFF00) matches the reference design exactly
- **Field Order**: Follows the exact numbering from reference images (1-12)
- **Backward Compatible**: Still supports old quotations without moldDetails/quotationItems
- **Responsive**: Table widths adjust to fit A4 page width
- **Professional**: Clean borders, proper spacing, and alignment

## 🔍 Troubleshooting

### If PDF doesn't generate:

1. Check backend console for errors
2. Verify Puppeteer is installed: `npm list puppeteer`
3. Ensure EJS is installed: `npm list ejs`
4. Check template path is correct

### If data doesn't display:

1. Verify `moldDetails` and `quotationItems` are saved in database
2. Check column names match: `moldDetails`, `quotationItems` (camelCase)
3. Ensure data structure matches schema definition
4. Check browser console for API errors

### If formatting is wrong:

1. Clear browser cache
2. Restart backend server
3. Check CSS in template file
4. Verify yellow color code: `#FFFF00`

## 📞 Support

For issues or questions:

- Check database schema: `\d outbound_quotations` in psql
- View sample quotation: `SELECT "moldDetails", "quotationItems" FROM outbound_quotations LIMIT 1;`
- Check backend logs for PDF generation errors
- Verify frontend sends correct data structure

---

**Last Updated**: 2024
**Version**: 2.0
**Status**: ✅ Ready for Testing
