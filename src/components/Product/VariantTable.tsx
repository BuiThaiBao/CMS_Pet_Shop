import { GeneratedVariant } from "../../pages/Product/ProductCreateAllInOne";

interface VariantTableProps {
  variants: GeneratedVariant[];
  onUpdatePrice: (variantId: string, price: number) => void;
  onUpdateWeight: (variantId: string, weight: number) => void;
  onUpdateStock: (variantId: string, stockQuantity: number) => void;
  onSelectImages: (variantId: string) => void;
}

export default function VariantTable({
  variants,
  onUpdatePrice,
  onUpdateWeight,
  onUpdateStock,
  onSelectImages,
}: VariantTableProps) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="border px-3 py-3 text-left">Variant Name</th>
            <th className="border px-3 py-3 text-right">Price</th>
            <th className="border px-3 py-3 text-right">Weight</th>
            <th className="border px-3 py-3 text-right">Stock Qty</th>
            <th className="border px-3 py-3 text-center">Images</th>
            <th className="border px-3 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.id} className="border-b hover:bg-gray-50">
                <td className="border px-3 py-3 font-medium">{variant.name}</td>
                <td className="border px-3 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) =>
                      onUpdatePrice(variant.id, Number(e.target.value))
                    }
                    className="w-20 border rounded px-2 py-1 text-right text-sm"
                    placeholder="0.00"
                  />
                </td>
                <td className="border px-3 py-3 text-right">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={variant.weight}
                    onChange={(e) =>
                      onUpdateWeight(variant.id, Number(e.target.value))
                    }
                    className="w-20 border rounded px-2 py-1 text-right text-sm"
                    placeholder="0.0"
                  />
                </td>
                <td className="border px-3 py-3 text-right">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={variant.stockQuantity}
                    onChange={(e) =>
                      onUpdateStock(variant.id, Number(e.target.value))
                    }
                    className="w-20 border rounded px-2 py-1 text-right text-sm"
                    placeholder="0"
                  />
                </td>
                <td className="border px-3 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {variant.imageUrls.length > 0 && (
                      <div className="flex gap-1">
                        {variant.imageUrls.slice(0, 3).map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`variant-img-${idx}`}
                            className="w-6 h-6 rounded object-cover border"
                            title={url}
                          />
                        ))}
                        {variant.imageUrls.length > 3 && (
                          <span className="text-xs bg-gray-200 px-1 rounded">
                            +{variant.imageUrls.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="border px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectImages(variant.id)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                  >
                    Select Images
                  </button>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
