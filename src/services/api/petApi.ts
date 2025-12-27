import http from "./http";

export interface PetImage {
  imageUrl: string;
  publicId: string;
  isPrimary: boolean;
  imagePosition: number;
}

export interface CreatePetPayload {
  name: string;
  animal: string;
  breed: string;
  age: number;
  ageGroup: string;
  size: string;
  gender: string;
  description: string;
  healthStatus: string;
  vaccinated: string;
  neutered: string;
  images: PetImage[];
}

export interface UpdatePetPayload {
  name?: string;
  animal?: string;
  breed?: string;
  age?: number;
  ageGroup?: string;
  size?: string;
  gender?: string;
  description?: string;
  healthStatus?: string;
  vaccinated?: string;
  neutered?: string;
  isDeleted?: string;
}

const petApi = {
  createFullPet: (data: CreatePetPayload) => {
    return http.post("/pets/create-all", data);
  },
  getAllPets: () => {
    return http.get("/pets");
  },
  getAllPetsWithQuery: (query: string) => {
    return http.get(`/pets?${query}`);
  },
  getPetById: (id: number) => {
    return http.get(`/pets/${id}`);
  },
  updatePet: (id: number | string, data: UpdatePetPayload) => {
    return http.put(`/pets/${id}`, data);
  },
  deletePet: (id: number) => {
    return http.put(`/pets/delete/${id}`);
  },
  restorePet: (id: number) => {
    return http.put(`/pets/restore/${id}`);
  },
  getAnimalsForCustomer: () => {
    return http.get("/pets/animalsCustomer");
  },
  getAnimalsForAdmin: () => {
    return http.get("/pets/animalsAdmin");
  }
};

export default petApi;
