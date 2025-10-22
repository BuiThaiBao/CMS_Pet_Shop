import http from "./http";
import { getToken } from "./tokenStorage";

export type ImagePayload = {
  imageUrl: string;
  position: number;
  isPrimary: number;
  isDeleted: string;
};

const imageApi = {
  /**
   * Update image by ID
   */
  update: (id: number | string, payload: ImagePayload) => {
    return http.put(`/images/${id}`, payload);
  },

  /**
   * Get image by ID
   */
  getById: (id: number | string) => {
    return http.get(`/images/${id}`);
  },

  /**
   * Delete image by ID
   */
  delete: (id: number | string) => {
    return http.delete(`/images/${id}`);
  },

  /**
   * Get images by product ID
   */
  getByProductId: (productId: number | string) => {
    return http.get(`/images/product/${productId}`);
  },

  /**
   * Upload images for a product
   * This uses FormData, so we use fetch directly but through a helper
   */
  upload: async (
    productId: number | string,
    files: File[],
    positions?: number[]
  ) => {
    const token = getToken();
    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const formData = new FormData();

    // Append all files
    files.forEach((file) => {
      formData.append("files", file);
    });

    // Append positions if provided
    if (positions && positions.length > 0) {
      positions.forEach((pos) => {
        formData.append("positions", String(pos));
      });
    } else {
      // Default positions
      files.forEach((_, index) => {
        formData.append("positions", String(index + 1));
      });
    }

    const response = await fetch(
      `${http.defaults.baseURL}/images/upload/${productId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to upload images");
    }

    return response.json();
  },
};

export default imageApi;
