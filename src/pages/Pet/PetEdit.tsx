import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import Select from "../../components/form/Select";
import petApi, { UpdatePetPayload } from "../../services/api/petApi";

export default function PetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [animal, setAnimal] = useState<string>("");
  const [breed, setBreed] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [vaccinated, setVaccinated] = useState<boolean>(false);
  const [neutered, setNeutered] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<string>("0");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ageGroupOptions = [
    { value: "Young", label: "Young (< 1 year)" },
    { value: "Child", label: "Child (1-3 years)" },
    { value: "Adult", label: "Adult (3-7 years)" },
    { value: "Senior", label: "Senior (> 7 years)" },
  ];

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  useEffect(() => {
    const loadPet = async () => {
      if (!id) {
        setError("Pet ID is missing");
        setLoadingData(false);
        return;
      }
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setError("Invalid pet ID");
        setLoadingData(false);
        return;
      }
      setLoadingData(true);
      setError(null);
      try {
        const res = await petApi.getPetById(numericId);
        const data = res?.data?.result ?? res?.data;
        if (data) {
          setName(data.name || "");
          setAnimal(data.animal || "");
          setBreed(data.breed || "");
          setAge(data.age !== undefined && data.age !== null ? String(data.age) : "");
          setAgeGroup(data.ageGroup || "");
          setWeight(data.weight !== undefined && data.weight !== null ? String(data.weight) : "");
          setGender(data.gender || "");
          setDescription(data.description || "");
          setHealthStatus(data.healthStatus || "");
          const vaccinatedRaw = data.vaccinated;
          const neuteredRaw = data.neutered;
          setWeight(data.weight !== undefined && data.weight !== null ? String(data.weight) : "");
          setNeutered(
            neuteredRaw === true || neuteredRaw === 1 || neuteredRaw === "1"
          );
          setIsDeleted(data.isDeleted || "0");
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load pet");
      } finally {
        setLoadingData(false);
      }
    };
    loadPet();
  }, [id]);

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAge(value);
    const num = Number(value);
    if (!value) {
      setAgeGroup("");
    } else if (num < 1) {
      setAgeGroup("Young");
    } else if (num >= 1 && num < 3) {
      setAgeGroup("Child");
    } else if (num >= 3 && num <= 7) {
      setAgeGroup("Adult");
    } else if (num > 7) {
      setAgeGroup("Senior");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      setError("Pet ID is missing");
      return;
    }
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      setError("Invalid pet ID");
      return;
    }

    if (weight && Number(weight) <= 0) {
      setError("Weight must be greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload: UpdatePetPayload = {
        name,
        animal,
        breed,
        age: age ? Number(age) : undefined,
        ageGroup,
        weight: weight ? Number(weight) : undefined,
        gender,
        description,
        healthStatus,
        vaccinated: vaccinated ? "1" : "0",
        neutered: neutered ? "1" : "0",
        isDeleted,
      };

      const res = await petApi.updatePet(numericId, payload);
      const data = res?.data;
      if (data?.success || data?.code === 1000) {
        setMessage("Update pet successfully");
        setTimeout(() => {
          navigate("/pet/list");
        }, 1500);
      } else {
        setError(data?.message || "Unknown response");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update pet");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <>
        <PageMeta title="Edit Pet" description="Edit pet information" />
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Edit Pet" description="Edit pet information" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Pet</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/pet/list")}
          >
            ← Back to List
          </Button>
        </div>

        <form onSubmit={submit} className="bg-white border rounded-lg p-6">
          {error && (
            <div className="mb-3">
              <Alert variant="error" title="Error" message={error} />
            </div>
          )}
          {message && (
            <div className="mb-3">
              <Alert variant="success" title="Success" message={message} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Pet Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Enter pet name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Animal Type
              </label>
              <input
                value={animal}
                onChange={(e) => setAnimal(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Dog / Cat / Bird..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Breed</label>
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
                placeholder="Enter breed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={handleAgeChange}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter age"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Age Group
              </label>
              <Select
                options={ageGroupOptions}
                value={ageGroup}
                onChange={(val) => setAgeGroup(val)}
                placeholder="Select Age Group"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number(val) >= 0) {
                    setWeight(val);
                  }
                }}
                className="w-full border rounded px-3 py-2"
                placeholder="Enter weight"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Gender</label>
              <Select
                options={genderOptions}
                value={gender}
                onChange={(val) => setGender(val)}
                placeholder="Select Gender"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 h-32"
              placeholder="Description"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Health Status
              </label>
              <input
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="Good, etc."
              />
            </div>
            <div className="flex items-center gap-6 mt-6 md:mt-8">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={vaccinated}
                  onChange={(e) => setVaccinated(e.target.checked)}
                  className="h-4 w-4"
                />
                Vaccinated
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={neutered}
                  onChange={(e) => setNeutered(e.target.checked)}
                  className="h-4 w-4"
                />
                Neutered
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={isDeleted}
                onChange={(e) => setIsDeleted(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="0">Active</option>
                <option value="1">Deleted</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button
              size="md"
              type="submit"
              disabled={loading}
              className="bg-indigo-600"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => navigate("/pet/list")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}


