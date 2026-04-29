"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";
import { VehicleCard } from "@/components/VehicleCard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Car, Bike, Plus } from "lucide-react";
import { z } from "zod";
import { vehicleSchema } from "@/lib/validations";
import { calculateBilling, BillingResult } from "@/lib/billing";

// Format license plate to Brazilian standard: ABC-1234 or ABC-1D23 (Mercosul)
const formatPlate = (value: string): string => {
  if (!value) return '';
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Old standard: ABC1234 -> ABC-1234
  if (/^[A-Z]{3}\d{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // Mercosul: ABC1D23 -> ABC-1D23
  if (/^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  return cleaned;
};

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: "CARRO" | "MOTO";
  startTime: string;
  endTime: string | null;
  pricePerMin: number | null;
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
  const [finishBilling, setFinishBilling] = useState<BillingResult | null>(null);
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
      const activeVehicles = data.filter((v: Vehicle) => !v.endTime);
      setVehicles(activeVehicles);
    } catch {
      setError("Erro ao carregar veículos");
    } finally {
      setLoading(false);
    }
  };

  // Calculate estimated revenue
  const estimatedRevenue = vehicles.reduce((acc, v) => {
    const billing = calculateBilling({
      startTime: v.startTime,
      type: v.type,
      pricePerMin: v.pricePerMin,
    });
    return acc + billing.price;
  }, 0);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const validatedData = vehicleSchema.parse({
        plate: form.plate,
        model: form.model,
        type: form.type,
      });

      const plateForAPI = validatedData.plate.replace("-", "");
      
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validatedData, plate: plateForAPI }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao adicionar veículo");
        return;
      }

      setModalOpen(false);
      setForm({ plate: "", model: "", type: "CARRO" });
      fetchVehicles();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues?.[0];
        setError(firstError?.message || "Dados inválidos");
      } else {
        setError("Erro de conexão");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishVehicle = (vehicle: Vehicle) => {
    const billing = calculateBilling({
      startTime: vehicle.startTime,
      type: vehicle.type,
      pricePerMin: vehicle.pricePerMin,
    });
    setFinishingVehicle(vehicle);
    setFinishBilling(billing);
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
      setFinishBilling(null);
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
    setFinishBilling(null);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Mobile: Summary Card */}
      <div className="md:hidden">
        <div className="bg-background-light border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-bold text-white">Resumo</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Veículos Ativos:</span>
              <span className="text-white font-bold">{vehicles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Carros:</span>
              <span className="text-white">{vehicles.filter((v) => v.type === "CARRO").length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Motos:</span>
              <span className="text-white">{vehicles.filter((v) => v.type === "MOTO").length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-gray-400">Faturamento:</span>
              <span className="text-primary font-bold">
                {formatCurrency(estimatedRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <StatsCards
        totalVehicles={vehicles.length}
        totalCars={vehicles.filter((v) => v.type === "CARRO").length}
        totalMotos={vehicles.filter((v) => v.type === "MOTO").length}
        revenue={estimatedRevenue}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Veículos Estacionados</h2>
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
              onFinish={handleFinishVehicle}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm({ plate: "", model: "", type: "CARRO" });
          setError("");
        }}
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
          <div className="flex items-center gap-4 p-4 bg-background rounded-lg">
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
                {finishBilling?.timeDisplay || "0 min"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Valor a pagar</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(finishBilling?.price || 0)}
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
