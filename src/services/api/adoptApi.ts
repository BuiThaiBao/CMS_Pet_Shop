import http from './http';

export interface AdoptResponse {
  id: number;
  code: string;
  petId?: number;
  pet?: any;
  status?: string;
  note?: string;
  createdDate?: string;
}

const adoptApi = {
  // For admin: get all adopts with optional filters
  getAllAdopts: (params: Record<string, any>) => {
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const qs = new URLSearchParams(clean as Record<string,string>).toString();
    return http.get(`/adopt/all${qs ? `?${qs}` : ''}`);
  },

  // other helpers if needed
  cancelAdopt: (id: number) => http.put(`/adopt/cancel/${id}`),
  getAdoptDetail: (id: number) => http.get(`/adopt/${id}`),
  updateStautusAdopt: (adoptId: number, status: string) => {
    const qs = `?status=${encodeURIComponent(String(status || ''))}`;
    return http.put(`/adopt/status/${adoptId}${qs}`);
  },
};

export default adoptApi;
