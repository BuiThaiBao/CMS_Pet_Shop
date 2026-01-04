import http from "./http";

export interface UserInfo {
  id: number;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  roles: string;
  isDeleted: string | number | boolean;
  createdDate?: string;
  updatedDate?: string;
}

interface ApiResponse<T> {
  code: number;
  success: boolean;
  message: string;
  result: T;
}

// Response type for email search
export interface SearchEmailResponse {
  emails: string[];
}

export const userApi = {
  // Lấy thông tin user hiện tại
  async getMyInfo(signal?: AbortSignal): Promise<UserInfo> {
    const res = await http.get<ApiResponse<UserInfo>>("/users/myInfo", {
      signal,
    });
    return res.data.result;
  },

  // Search emails by keyword for autocomplete
  searchEmail: (keyword: string) => {
    return http.post<ApiResponse<SearchEmailResponse>>(
      `/users/search-email`,
      { keyword }
    );
  },
};

export default userApi;
