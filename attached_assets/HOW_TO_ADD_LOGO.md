# How to Add Company Logo to PDF Quotations

## Instructions

To add your company logo to the PDF quotations, follow these simple steps:

### Step 1: Prepare Your Logo Image

Your logo should be:

- **Format**: PNG, JPG, or JPEG
- **Recommended dimensions**: 300x300 pixels or similar square/rectangular size
- **File size**: Less than 1MB for best performance
- **Background**: Transparent background (PNG) works best

### Step 2: Rename Your Logo File

Rename your logo file to exactly one of these names:

- `company-logo.png` (recommended)
- `company-logo.jpg`
- `company-logo.jpeg`

⚠️ **Important**: The filename must be exactly as shown above (lowercase, with hyphen)

### Step 3: Place the Logo in the Correct Folder

Copy your renamed logo file into this folder:

```
attached_assets/
```

The full path should be:

```
c:\Users\admin\Desktop\hottip-inventory-backend\hottip-inventory1\hottip-inventory1\hottip-inventory1\attached_assets\company-logo.png
```

### Step 4: Restart the Server (if running)

If your backend server is already running, restart it to ensure the logo is loaded.

### Step 5: Generate a Test Quotation PDF

1. Open your application
2. Go to Outbound Quotations
3. Click "Download PDF" on any quotation
4. Check if the logo appears in the top-left corner of the PDF header

---

## What If the Logo Doesn't Appear?

If the logo doesn't show up, the PDF will automatically use a text-only header instead. Check the server console for messages:

- ✅ `Logo loaded successfully: company-logo.png` - Logo loaded correctly
- ℹ️ `No logo found in attached_assets folder` - Logo file not found
- ⚠️ `Error loading logo` - There's an issue with the logo file

## Troubleshooting

1. **Logo not appearing**:

   - Check the filename is exactly `company-logo.png` (or .jpg/.jpeg)
   - Verify the file is in the `attached_assets` folder
   - Make sure the file is not corrupted (try opening it in an image viewer)
   - Restart the server

2. **Logo appears too large/small**:

   - The logo is automatically sized to 30x15mm in the PDF
   - If you need different sizing, contact your developer to adjust the dimensions

3. **Logo quality is poor**:
   - Use a higher resolution image (at least 300x300 pixels)
   - Use PNG format with transparent background for best results

---

## Current Logo Status

**Expected location**: `attached_assets/company-logo.png`

To check if a logo is currently present, look for one of these files in the `attached_assets` folder:

- company-logo.png
- company-logo.jpg
- company-logo.jpeg

---

**Need Help?** Contact your system administrator or developer.
