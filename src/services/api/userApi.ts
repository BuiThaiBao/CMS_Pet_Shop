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

export const userApi = {
  // Lấy thông tin user hiện tại
  async getMyInfo(signal?: AbortSignal): Promise<UserInfo> {
    const res = await http.get<ApiResponse<UserInfo>>("/users/myInfo", {
      signal,
    });
    return res.data.result;
  },
};

export default userApi;
