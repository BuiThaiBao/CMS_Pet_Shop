import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import petApi from "../../services/api/petApi";
import Select from "../../components/form/Select";
import Switch from "../../components/form/switch/Switch";
import PetDetailModal from "../../components/Pet/PetDetailModal";


export default function PetList() {
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  // Pagination states
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  // Filter states
  const [status, setStatus] = useState("");
  const [animal, setAnimal] = useState("");
  const [size, setSize] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const navigate = useNavigate();
  const abortRef = useRef<AbortController | null>(null);

  // Animal options lấy từ API
  const [animalOptions, setAnimalOptions] = useState([
    { value: "", label: "All Animals" }
  ]);

  useEffect(() => {
    // Lấy danh sách animal từ API (dùng cho admin)
    const fetchAnimals = async () => {
      try {
        const res = await petApi.getAnimalsForAdmin();
        // Giả sử trả về mảng string tên animal
        const arr = res.data?.result || [];
        setAnimalOptions([
          { value: "", label: "All Animals" },
          ...arr.map((a: string) => ({ value: a, label: a }))
        ]);
      } catch (e) {
        // fallback giữ lại All Animals
      }
    };
    fetchAnimals();
  }, []);
  const sizeOptions = [
    { value: "", label: "All Sizes" },
    { value: "Small", label: "Small" },
    { value: "Medium", label: "Medium" },
    { value: "Big", label: "Big" },
  ];
  const ageGroupOptions = [
    { value: "", label: "All Age Groups" },
    { value: "Young", label: "Young (< 1 year)" },
    { value: "Child", label: "Child (1-3 years)" },
    { value: "Adult", label: "Adult (3-7 years)" },
    { value: "Senior", label: "Senior (> 7 years)" },
  ];
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "AVAILABLE", label: "Available" },
    { value: "ADOPTED", label: "Adopted" },
    { value: "PENDING_APPROVAL", label: "Pending" },

  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      await loadPets(pageNumber, pageSize);
    };
    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, pageSize, animal, size, ageGroup, status]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPageNumber(1);
  }, [animal, size, ageGroup, status]);

  const loadPets = async (page: number, pageSizeParam: number) => {
    setLoading(true);
    try {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Gọi API với filter và pagination
      const params: any = {};
      
      // Thêm pagination params - thử dùng pageSize thay vì size để tránh conflict
      params.pageNumber = page;
      params.pageSize = pageSizeParam;
      
      // Thêm filter params
      if (animal) params.animal = animal;
      if (size) params.size = size; // Filter size (Small/Medium/Big)
      if (ageGroup) params.ageGroup = ageGroup;
      if (status) params.status = status;
      params.isDeleted = "";
      
      const query = new URLSearchParams(params).toString();
      console.log("Calling API with query:", query);
      const res = await petApi.getAllPetsWithQuery(query);
      console.log("API response:", res.data);
      const data = res.data?.result ?? res.data;
      
      if (data) {
        // Nếu data là mảng trực tiếp (không có pagination)
        if (Array.isArray(data)) {
          setPets(data);
          setTotalPages(1);
          setTotalElements(data.length);
        } else {
          // Nếu có pagination structure
          setPets(data.content || []);
          setTotalPages(data.totalPages ?? 0);
          setTotalElements(data.totalElements ?? 0);
          const serverPageRaw =
            typeof data.number === "number"
              ? data.number
              : (data.pageable?.pageNumber as number | undefined);
          const serverSize = data.size ?? data.pageable?.pageSize ?? pageSizeParam;
          let resolvedPage = page;
          if (typeof serverPageRaw === "number") {
            if (serverPageRaw === page - 1) resolvedPage = serverPageRaw + 1;
            else if (serverPageRaw === page) resolvedPage = serverPageRaw;
          }
          setPageNumber(resolvedPage);
          setPageSize(serverSize);
        }
      } else {
        setPets([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err: any) {
      const code = err?.code as string | undefined;
      if (code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      console.error("Failed to load pets", err);
      setPets([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleToggleDeleted = async (id: number | string | undefined) => {
    if (!id) {
      console.error("Invalid pet ID: id is missing");
      return;
    }
    
    // Convert to number
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) {
      console.error("Invalid pet ID: cannot convert to number", id);
      return;
    }

    const current = pets.find((p) => {
      const pId = typeof p.id === 'string' ? parseInt(p.id, 10) : Number(p.id);
      return pId === numericId;
    });
    
    if (!current) {
      console.error("Pet not found with ID:", numericId);
      return;
    }

    const prevPets = [...pets];
    const newIsDeleted = current.isDeleted === "0" ? "1" : "0";

    const nextPets = pets.map((p) => {
      const pId = typeof p.id === 'string' ? parseInt(p.id, 10) : Number(p.id);
      return pId === numericId ? { ...p, isDeleted: newIsDeleted } : p;
    });
    setPets(nextPets);

    const updating = new Set(updatingIds);
    updating.add(numericId);
    setUpdatingIds(updating);

    try {
      console.log("Calling API deletePet with ID:", numericId);
      await petApi.deletePet(numericId);
      console.log("API call successful");
    } catch (error) {
      console.error("Failed to toggle pet deleted state", error);
      setPets(prevPets);
    } finally {
      const after = new Set(updatingIds);
      after.delete(numericId);
      setUpdatingIds(after);
    }
  };

  const handleViewDetail = (id: number | string | undefined) => {
    if (!id) {
      console.error("Invalid pet ID: id is missing");
      return;
    }
    const numericId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    if (isNaN(numericId)) {
      console.error("Invalid pet ID: cannot convert to number", id);
      return;
    }
    setSelectedPetId(numericId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedPetId(null);
  };

  return (
    <>
      <PageMeta title="Pet List | Pet Shop CMS" description="List of all pets" />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Pet List</h1>
            <p className="mt-2 text-sm text-gray-600">Manage pets</p>
          </div>
        </div>
        <div className="mt-4 bg-white rounded-lg border">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select options={animalOptions} value={animal} onChange={setAnimal} placeholder="All Animals" />
                <Select options={sizeOptions} value={size} onChange={setSize} placeholder="All Sizes" />
                <Select options={ageGroupOptions} value={ageGroup} onChange={setAgeGroup} placeholder="All Age Groups" />
                <Select options={statusOptions} value={status} onChange={setStatus} placeholder="All Statuses" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-sm text-gray-500 border-b">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Animal</th>
                    <th className="py-3 px-4">Breed</th>
                    <th className="py-3 px-4">Age</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Size</th>
                    <th className="py-3 px-4">Age Group</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deleted</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4">Updated At</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="p-6 text-center">Loading...</td>
                    </tr>
                  ) : pets.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-6 text-center text-gray-500">No pets found</td>
                    </tr>
                  ) : (
                    pets.map((pet, key) => {
                      // Capture pet.id to avoid closure issues
                      const petId = pet.id;
                      const petIdNum = typeof petId === 'string' ? parseInt(petId, 10) : Number(petId);
                      
                      return (
                      <tr key={key} className="border-b">
                        <td className="py-4 px-4 font-medium">{pet.name}</td>
                        <td className="py-4 px-4">{pet.animal}</td>
                        <td className="py-4 px-4">{pet.breed}</td>
                        <td className="py-4 px-4">{pet.age}</td>
                        <td className="py-4 px-4">{pet.gender}</td>
                        <td className="py-4 px-4">{pet.size}</td>
                        <td className="py-4 px-4">{pet.ageGroup}</td>
                        <td className="py-4 px-4">{pet.healthStatus || "Good"}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              key={`pet-del-${petId}-${pet.isDeleted}`}
                              label=""
                              color={pet.isDeleted === "0" ? "green" : "red"}
                              disabled={!isNaN(petIdNum) && updatingIds.has(petIdNum)}
                              defaultChecked={pet.isDeleted === "0"}
                              onChange={(checked) => {
                                console.log("Switch toggled for pet ID:", petId, "checked:", checked);
                                handleToggleDeleted(petId);
                              }}
                            />
                            <span
                              className={`text-sm font-medium ${
                                pet.isDeleted === "0"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {pet.isDeleted === "0" ? "Active" : "Deleted"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{pet.createdDate}</td>
                        <td className="py-4 px-4">{pet.updatedDate}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                              onClick={() => {
                                if (petId && !isNaN(petIdNum)) {
                                  navigate(`/pet/edit/${petId}`);
                                } else {
                                  console.error("Invalid pet ID:", petId);
                                }
                              }}
                              title="Edit pet information"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                              Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                              onClick={() => handleViewDetail(petId)}
                              title="View details"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {pets.length} of {totalElements} pets
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                  disabled={pageNumber <= 1}
                  aria-label="Previous page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                    pageNumber <= 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.max(totalPages, 0) }).map(
                  (_, idx) => {
                    const p = idx + 1;
                    const active = p === pageNumber;
                    return (
                      <button
                        key={p}
                        onClick={() => setPageNumber(p)}
                        aria-current={active ? "page" : undefined}
                        className={`transition-all ${
                          active
                            ? "w-9 h-9 flex items-center justify-center text-sm rounded-md bg-indigo-600 text-white shadow"
                            : "px-2 text-sm text-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                )}
                <button
                  onClick={() => {
                    const target = pageNumber + 1;
                    if (totalPages && target > totalPages) return;
                    setPageNumber(target);
                  }}
                  disabled={totalPages ? pageNumber >= totalPages : false}
                  aria-label="Next page"
                  className={`w-9 h-9 flex items-center justify-center border rounded-lg ${
                    totalPages && pageNumber >= totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PetDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        petId={selectedPetId}
      />
    </>
  );
}
