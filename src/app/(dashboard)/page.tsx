"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { VehicleCard } from "@/components/VehicleCard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Car, Bike, Plus } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Format license plate to Brazilian standard: ABC-1234 or ABC-1D23 (Mercosul)
const formatPlate = (value: string): string => {
  // Remove all non-alphanumeric characters
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Format for old standard: 3 letters + 4 numbers = ABC-1234
  if (/^[A-Z]{3}\d{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // Format for Mercosul: 3 letters + 1 number + 1 letter + 2 numbers = ABC-1D23
  if (/^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // If partial, just return cleaned value
  return cleaned;
};

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: "CARRO" | "MOTO";
  startTime: string;
  endTime: string | null;
  pricePerMin: number;
  totalPrice: number | null;
}

export default function HomePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [finishModal, setFinishModal] = useState(false);
  const [finishingVehicle, setFinishingVehicle] = useState<Vehicle | null>(null);
  const [finishPrice, setFinishPrice] = useState<{
    minutes: number;
    price: number;
    timeDisplay: string;
  }>({ minutes: 0, price: 0, timeDisplay: "0 min" });
  const [form, setForm] = useState({
    plate: "",
    model: "",
    type: "CARRO" as "CARRO" | "MOTO",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setIsAdmin(data.user?.role === "ADMIN");
      fetchVehicles();
    } catch {
      router.push("/login");
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/vehicles");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setVehicles(data.filter((v: Vehicle) => !v.endTime));
    } catch {
      setError("Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Remove hyphen for API (store plate without formatting)
      const plateForAPI = form.plate.replace("-", "");
      
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plate: plateForAPI }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao adicionar veículo");
        return;
      }

      setModalOpen(false);
      setForm({ plate: "", model: "", type: "CARRO" });
      fetchVehicles();
    } catch {
      setError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishVehicle = async (vehicle: Vehicle) => {
    const now = new Date();
    const start = new Date(vehicle.startTime);
    const diffMs = now.getTime() - start.getTime();
    const totalMinutes = Math.ceil(diffMs / 60000);
    const pricePerMin = vehicle.pricePerMin || (vehicle.type === "CARRO" ? 10.0 / 60 : 5.0 / 60);
    const pricePerHour = pricePerMin * 60;

    let price: number;
    let timeDisplay: string;
    let billableMinutes: number;

    // Nova lógica
    if (totalMinutes <= 29) {
      price = totalMinutes * pricePerMin;
      billableMinutes = totalMinutes;
      timeDisplay = `${totalMinutes} min`;
    } else if (totalMinutes === 30) {
      price = pricePerHour / 2;
      billableMinutes = 30;
      timeDisplay = `30 min`;
    } else if (totalMinutes <= 60) {
      price = pricePerHour;
      billableMinutes = 60;
      timeDisplay = `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const exceededMinutes = totalMinutes % 60;
      price = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
      billableMinutes = totalMinutes;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      timeDisplay = h > 0 ? `${h}h ${m}m` : `${totalMinutes} min`;
    }

    setFinishingVehicle(vehicle);
    setFinishPrice({ minutes: billableMinutes, price, timeDisplay });
    setFinishModal(true);
  };

  const confirmFinishVehicle = async () => {
    if (!finishingVehicle) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/vehicles/${finishingVehicle.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao finalizar veículo");
        return;
      }

      setFinishModal(false);
      setFinishingVehicle(null);
      fetchVehicles();
    } catch {
      setError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelFinishVehicle = () => {
    setFinishModal(false);
    setFinishingVehicle(null);
  };

  const activeVehicles = vehicles.filter((v) => !v.endTime);
  const totalCars = activeVehicles.filter((v) => v.type === "CARRO").length;
  const totalMotos = activeVehicles.filter((v) => v.type === "MOTO").length;
  const estimatedRevenue = activeVehicles.reduce((acc, v) => {
    const start = new Date(v.startTime);
    const now = new Date();
    const minutes = Math.ceil((now.getTime() - start.getTime()) / 60000);
    const pricePerMin = v.pricePerMin || (v.type === "CARRO" ? 10.0 / 60 : 5.0 / 60);
    const pricePerHour = pricePerMin * 60;

    let price: number;
    if (minutes <= 29) {
      price = minutes * pricePerMin;
    } else if (minutes === 30) {
      price = pricePerHour / 2;
    } else if (minutes <= 60) {
      price = pricePerHour;
    } else {
      const hours = Math.floor(minutes / 60);
      const exceededMinutes = minutes % 60;
      price = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
    }

    return acc + price;
  }, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <StatsCards
        totalVehicles={vehicles.length}
        totalCars={vehicles.filter((v) => v.type === "CARRO").length}
        totalMotos={vehicles.filter((v) => v.type === "MOTO").length}
        revenue={0}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-white">Veículos Estacionados</h2>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus size={20} className="mr-2" />
          Adicionar Veículo
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">
          Carregando veículos...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 px-4">
          <Car size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Nenhum veículo estacionado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onFinish={(vehicle) => {
                setFinishingVehicle(vehicle);
                updateFinishPrice(vehicle);
                setFinishModal(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar Veículo"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                form.type === "CARRO"
                  ? "bg-primary text-secondary font-semibold"
                  : "bg-background-light text-white hover:bg-background-light/80"
              }`}
              onClick={() => setForm({ ...form, type: "CARRO" })}
            >
              <Car size={20} />
              Carro
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                form.type === "MOTO"
                  ? "bg-primary text-secondary font-semibold"
                  : "bg-background-light text-white hover:bg-background-light/80"
              }`}
              onClick={() => setForm({ ...form, type: "MOTO" })}
            >
              <Bike size={20} />
              Moto
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Placa
            </label>
            <input
              type="text"
              value={form.plate}
              onChange={(e) => {
                const formatted = formatPlate(e.target.value);
                setForm({ ...form, plate: formatted });
              }}
              placeholder="ABC-1234 ou ABC-1D23"
              maxLength={8}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos: ABC-1234 (padrão antigo) ou ABC-1D23 (Mercosul)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Modelo
            </label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="VW GOL G3"
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button type="submit" loading={submitting} className="w-full">
            Adicionar
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={finishModal}
        onClose={cancelFinishVehicle}
        title="Finalizar Estadia"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-background-light rounded-lg">
            <div className="text-primary">
              {finishingVehicle?.type === "CARRO" ? (
                <Car size={48} />
              ) : (
                <Bike size={48} />
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-white">
                {finishingVehicle?.plate}
              </p>
              <p className="text-gray-400">{finishingVehicle?.model}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-gray-400">Tempo estacionado</span>
              <span className="text-white font-semibold">
                {finishPrice.timeDisplay}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Valor a pagar</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(finishPrice.price)}
              </span>
            </div>
          </div>

          <p className="text-gray-400 text-center">
            Deseja realmente finalizar a estadia deste veículo?
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={cancelFinishVehicle}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmFinishVehicle}
              loading={submitting}
              className="flex-1"
            >
              Finalizar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
