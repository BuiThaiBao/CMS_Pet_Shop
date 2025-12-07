# All-in-One Product Creation Form

## Overview

The **All-in-One Product Creation Form** (`ProductCreateAllInOne`) is a comprehensive, multi-step form that allows users to create products with images, variants, and attributes in a single unified workflow. It handles the complete product creation process from initial product information through image uploads, variant generation, and final submission.

## Features

### 1. **Step 1: General Information**

- **Product Name** (required): The name of the product
- **Category** (required): Select from available categories with autocomplete
- **Short Description** (required): A one-line product summary
- **Full Description**: Detailed product information
- **Featured**: Toggle to mark product as featured

### 2. **Step 2: Media Upload (Async)**

- **Drag & Drop Interface**: Intuitive drag-and-drop area for multiple images
- **Instant Upload**: Images are uploaded immediately using `POST /api/v1/images/upload/{productId}`
- **Image Management**:
  - Display uploaded images in a grid
  - Set primary image
  - Remove images
  - Support for JPG, PNG, GIF, WebP formats
- **Response Handling**: Receives array of image URLs from backend

### 3. **Step 3: Variant Generation**

- **Attribute Definition**: Add unlimited attributes (e.g., Color, Size, Material)
- **Attribute Values**: Define multiple values per attribute
- **Cartesian Product**: Auto-generates all possible combinations
  - Example: Color (Red, Blue) + Size (S, M) = 4 variants
- **Variant Properties**:
  - Auto-generated variant names (e.g., "Red-S", "Red-M")
  - Individual pricing per variant
  - Weight specification
  - Stock quantity
  - Image assignment per variant

### 4. **Step 4: Variant Image Mapping**

- **Image Selection Modal**: Click "Select Images" on any variant row
- **Multi-Image Support**: Each variant can have multiple images
- **Visual Feedback**: Selected images show thumbnails in the variant table
- **Easy Management**: Modal displays all uploaded images with selection UI

### 5. **Step 5: Review & Submit**

- **Summary View**: Review all product details and variants
- **Validation**: Ensures all required fields are completed
- **Final Submission**: Constructs proper DTO and submits to `POST /api/v1/products`

## Backend DTO Structure

The form constructs the following JSON structure for submission:

```json
{
  "categoryId": 0,
  "name": "string",
  "shortDescription": "string",
  "description": "string",
  "featured": true,
  "images": [
    {
      "imageUrl": "string",
      "isPrimary": true,
      "position": 0
    }
  ],
  "variants": [
    {
      "variantName": "string",
      "weight": 0.1,
      "price": 0.1,
      "stockQuantity": 0,
      "imageUrls": ["string"]
    }
  ]
}
```

## Component Files

### Main Component

- **`ProductCreateAllInOne.tsx`**: Main form component with multi-step navigation

### Sub-Components

- **`ImageUploadDropzone.tsx`**: Drag-and-drop image upload area
- **`VariantTable.tsx`**: Editable table for variant properties
- **`ImageSelectionModal.tsx`**: Modal for selecting images per variant

## Route

Access the form at: `/product/add-all-in-one`

## Usage Flow

1. **Navigate** to `/product/add-all-in-one`
2. **Fill Step 1**: Enter product name, category, descriptions
3. **Click "Next: Upload Images"** → Proceed to Step 2
4. **Upload Images**: Drag-drop or click to upload images
5. **Set Primary Image**: Click to mark the primary/featured image
6. **Click "Next: Create Variants"** → Proceed to Step 3
7. **Add Attributes**: Define product attributes and their values
8. **Generate Variants**: Click button to create all combinations
9. **Fill Variant Details**:
   - Enter price, weight, stock quantity for each variant
   - Click "Select Images" to assign images to each variant
10. **Click "Next: Review & Submit"** → Proceed to Step 4
11. **Review Summary**: Verify all details are correct
12. **Click "Submit & Create Product"**: Final submission to backend

## Validation Rules

The form enforces the following validations:

- ✅ Product name is required
- ✅ Category is required
- ✅ At least one image must be uploaded
- ✅ At least one variant must be defined
- ✅ Each variant must have:
  - Price > 0
  - Stock quantity > 0
  - At least one image assigned

## State Management

### Global State Variables

- `productImages`: Array of uploaded images with URLs
- `attributes`: Array of defined attributes and values
- `generatedVariants`: Array of auto-generated variant combinations

### Form State

- `categoryId`, `name`, `shortDescription`, `description`, `featured`
- `uploadingImages`: Loading state during image upload
- `loading`: Loading state during final submission
- `error`, `message`: Alert messages

## API Integration

### Image Upload

- **Endpoint**: `POST /api/v1/images/upload/{productId}`
- **Type**: Multipart FormData
- **Returns**: Array of image URLs

### Product Creation

- **Endpoint**: `POST /api/v1/products`
- **Type**: JSON
- **Payload**: Complete product DTO with images and variants

## Error Handling

- Upload errors are caught and displayed to the user
- Form submission errors prevent data loss
- Step navigation validates prerequisites before advancing
- All validation errors are shown in alert messages

## UI/UX Features

- **Step Indicators**: Visual progress with clickable steps
- **Disabled Navigation**: Steps are disabled until prerequisites are met
- **Loading States**: Visual feedback during uploads and submissions
- **Image Previews**: Thumbnail previews in variant table
- **Responsive Design**: Works on desktop and tablet
- **Accessibility**: Proper labels and semantic HTML

## Performance Considerations

- Images are uploaded asynchronously and don't block the form
- Cartesian product generation is optimized for reasonable attribute counts
- Modal uses React state for efficient re-renders
- Drag-drop uses `react-dropzone` library for reliability

## Future Enhancements

Potential improvements:

- Batch image upload optimization
- Variant template presets
- Bulk pricing calculator
- Stock distribution wizard
- Image optimization before upload
- Undo/redo functionality
- Auto-save drafts

## Support

For issues or questions, check:

1. Browser console for error messages
2. Network tab for API response details
3. Component-specific error alerts
