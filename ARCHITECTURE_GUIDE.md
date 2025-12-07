# All-in-One Product Form - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ProductCreateAllInOne                        │
│                    (Main Form Component)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
    │  Image Upload   │  │ Variant      │  │ Image Selection  │
    │  Dropzone       │  │ Table        │  │ Modal            │
    └─────────────────┘  └──────────────┘  └──────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                    ┌─────────────────────┐
                    │  State Management   │
                    │  (Categories, etc)  │
                    └─────────────────────┘
                              │
                    ┌─────────────────────┐
                    │   API Layer         │
                    │  productApi         │
                    │  imageApi           │
                    │  categoryApi        │
                    └─────────────────────┘
                              │
                    ┌─────────────────────┐
                    │   Backend APIs      │
                    │  /api/v1/products   │
                    │  /api/v1/images     │
                    └─────────────────────┘
```

## Data Flow Diagram

### Step 1: General Information

```
User Input (Name, Category, Description)
            ↓
         State Update
            ↓
       Validation Check
            ↓
      (canProceedToImages?)
            ↓
        Next Button Enabled
```

### Step 2: Image Upload

```
Drag & Drop or Click Files
            ↓
    Upload to /api/v1/images/upload/{productId}
            ↓
   Async Response (Array of URLs)
            ↓
Store in productImages State
            ↓
Display in Grid + Set Primary
            ↓
(canProceedToVariants?)
```

### Step 3: Attribute & Variant Generation

```
Add Attributes (Name, Values)
            ↓
    Generate Cartesian Product
            ↓
    Create Variant Combinations
            ↓
Store in generatedVariants State
            ↓
Edit Price, Weight, Stock
            ↓
Select Images per Variant
            ↓
(canProceedToReview?)
```

### Step 4: Image Mapping

```
Click "Select Images" on Variant
            ↓
Open ImageSelectionModal
            ↓
Multi-select from productImages
            ↓
Confirm Selection
            ↓
Update variant.imageUrls
            ↓
Display Thumbnails in Table
```

### Step 5: Review & Submit

```
Display Summary
            ↓
Final Validation
            ↓
Construct DTO Object
            ↓
POST /api/v1/products
            ↓
Success → Redirect to /product
            ↓
Error → Show Alert Message
```

## State Structure

```typescript
// General Information
categoryId: string              // Selected category ID
name: string                    // Product name
shortDescription: string        // One-line description
description: string             // Full description
featured: boolean               // Is featured?

// Image Upload
productImages: ProductImage[]   // Array of uploaded images
  ├─ id: string                 // Unique identifier
  ├─ imageUrl: string           // URL from backend
  ├─ isPrimary: boolean         // Is primary image?
  └─ position: number           // Display order

// Attributes & Variants
attributes: Attribute[]         // User-defined attributes
  ├─ id: string                 // Attribute ID
  ├─ name: string               // Color, Size, etc.
  └─ values: AttributeValue[]   // Red, Blue, S, M, etc.

generatedVariants: GeneratedVariant[]
  ├─ id: string                 // Variant ID
  ├─ name: string               // "Red-S"
  ├─ attributeCombination: {}   // {Color: "Red", Size: "S"}
  ├─ price: number              // Variant price
  ├─ weight: number             // Variant weight
  ├─ stockQuantity: number      // Available stock
  └─ imageUrls: string[]        // Images for this variant

// UI State
currentStep: "info" | "images" | "variants" | "review"
selectedVariantId: string | null
showImageModal: boolean
uploadingImages: boolean
loading: boolean
error: string | null
message: string | null
```

## Component Props Interface

### ImageUploadDropzone

```typescript
{
  onImagesDrop: (files: File[]) => Promise<void>
  isLoading?: boolean
}
```

### VariantTable

```typescript
{
  variants: GeneratedVariant[]
  onUpdatePrice: (variantId: string, price: number) => void
  onUpdateWeight: (variantId: string, weight: number) => void
  onUpdateStock: (variantId: string, stockQuantity: number) => void
  onSelectImages: (variantId: string) => void
}
```

### ImageSelectionModal

```typescript
{
  images: ProductImage[]
  selectedUrls: string[]
  onConfirm: (selectedUrls: string[]) => void
  onCancel: () => void
}
```

## Cartesian Product Logic

```
Input:
  Color: [Red, Blue]
  Size: [S, M]

Algorithm:
  1. Extract values: [[Red, Blue], [S, M]]
  2. For each Color value:
     For each Size value:
       Create combination {Color: color, Size: size}

Output:
  [
    {Color: "Red", Size: "S"},
    {Color: "Red", Size: "M"},
    {Color: "Blue", Size: "S"},
    {Color: "Blue", Size: "M"}
  ]

Generated Variants:
  1. Red-S (price: 0, weight: 0, stock: 0, images: [])
  2. Red-M (price: 0, weight: 0, stock: 0, images: [])
  3. Blue-S (price: 0, weight: 0, stock: 0, images: [])
  4. Blue-M (price: 0, weight: 0, stock: 0, images: [])
```

## API Call Sequence

```
1. Component Mount
   └─ GET /api/v1/categories (fetch all categories)

2. Step 2: Image Upload
   └─ POST /api/v1/images/upload/{tempProductId}
      └─ Returns: { result: string[] } (URLs)

3. Step 5: Final Submit
   └─ POST /api/v1/products
      └─ Payload: Complete DTO with images & variants
      └─ Returns: { success: true, data: {...} }
```

## Validation Flow

```
Step 1 Complete?
├─ ✅ name.trim() != ""
├─ ✅ categoryId != ""
├─ ✅ shortDescription.trim() != ""
└─ Enable "Next" button

Step 2 Complete?
├─ ✅ productImages.length > 0
└─ Enable "Next" button

Step 3 Complete?
├─ ✅ generatedVariants.length > 0
├─ ✅ For each variant:
│  ├─ price > 0
│  ├─ stockQuantity > 0
│  └─ imageUrls.length > 0
└─ Enable "Next" button

Step 5 Submit?
├─ ✅ All validations pass
├─ ✅ DTO is constructed
├─ ✅ POST request succeeds
└─ Redirect to /product
```

## File Structure

```
src/
├─ pages/Product/
│  └─ ProductCreateAllInOne.tsx    (620 lines) ⭐
│
├─ components/Product/
│  ├─ ImageUploadDropzone.tsx      (59 lines) ⭐
│  ├─ VariantTable.tsx             (99 lines) ⭐
│  └─ ImageSelectionModal.tsx      (100 lines) ⭐
│
└─ App.tsx                          (modified - added route)
```

## Key Algorithms

### 1. Cartesian Product Generation

```typescript
const cartesian = (arrays: string[][]): Record<string, string>[] => {
  if (arrays.length === 0) return [{}];
  if (arrays.length === 1) {
    return arrays[0].map((v) => ({ [attrNames[0]]: v }));
  }

  const result = [];
  const smaller = cartesian(arrays.slice(1));

  arrays[0].forEach((val) => {
    smaller.forEach((combo) => {
      result.push({
        [attrNames[0]]: val,
        ...combo,
      });
    });
  });

  return result;
};
```

### 2. Image URL Storage

```typescript
const handleImageUpload = async (files: File[]) => {
  const response = await imageApi.upload(tempProductId, files);
  const uploadedUrls = response.data.result;

  const newImages = uploadedUrls.map((url, idx) => ({
    id: `img-${Date.now()}-${idx}`,
    imageUrl: url,
    isPrimary: productImages.length === 0 && idx === 0,
    position: productImages.length + idx + 1,
  }));

  setProductImages((prev) => [...prev, ...newImages]);
};
```

### 3. DTO Construction

```typescript
const payload = {
  categoryId: Number(categoryId),
  name,
  shortDescription,
  description,
  featured,
  images: productImages.map((img, idx) => ({
    imageUrl: img.imageUrl,
    isPrimary: img.isPrimary ?? idx === 0,
    position: idx + 1,
  })),
  variants: generatedVariants.map((variant) => ({
    variantName: variant.name,
    weight: variant.weight,
    price: variant.price,
    stockQuantity: variant.stockQuantity,
    imageUrls: variant.imageUrls,
  })),
};
```

## Testing Matrix

| Scenario         | Input                                 | Expected Outcome              |
| ---------------- | ------------------------------------- | ----------------------------- |
| Basic Create     | Name, Category, 1 Image, 1 Variant    | ✅ Product created            |
| Multiple Images  | 5 uploaded images                     | ✅ All stored and mapped      |
| Complex Variants | 3 attrs × 4 values each = 12 variants | ✅ All generated              |
| Image Mapping    | Assign 2 images to each of 3 variants | ✅ Each variant has images    |
| Error Handling   | Missing required field                | ❌ Error alert shown          |
| Validation       | Submit without images                 | ❌ Validation prevents submit |

## Performance Considerations

- Image upload is non-blocking (async/await)
- Cartesian product: O(n^m) where n=values, m=attributes
- Recommended: ≤ 5 attributes, ≤ 10 values each = ~100k variants
- Each state update only re-renders affected components
- Modal uses Set for O(1) image selection lookup

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-dropzone": "^14.3.5", // For drag-drop
  "axios": "^1.12.2", // API calls
  "tailwindcss": "^4.0.8" // Styling
}
```

---

This architecture ensures **scalability**, **maintainability**, and **excellent user experience** throughout the entire product creation process.
