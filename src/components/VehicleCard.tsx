import { Car, Bike, X } from "lucide-react";
import { calculateBilling, BillingResult } from "@/lib/billing";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Format license plate to Brazilian standard
const formatPlateDisplay = (plate: string): string => {
  if (!plate) return '';
  const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^[A-Z]{3}\d{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  if (/^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return plate;
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

interface VehicleCardProps {
  vehicle: Vehicle;
  onFinish?: (vehicle: Vehicle) => void;
}

export function VehicleCard({ vehicle, onFinish }: VehicleCardProps) {
  const billing: BillingResult = calculateBilling({
    startTime: vehicle.startTime,
    type: vehicle.type,
    pricePerMin: vehicle.pricePerMin,
  });

  return (
    <div className="bg-background-light border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {vehicle.type === "CARRO" ? <Car size={32} /> : <Bike size={32} />}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{formatPlateDisplay(vehicle.plate)}</p>
            <p className="text-sm text-gray-400">{vehicle.model}</p>
            <p className="text-xs text-gray-500 mt-1">{billing.timeDisplay}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(billing.price)}
          </p>
        </div>
      </div>
      {onFinish && (
        <button
          onClick={() => onFinish(vehicle)}
          className="mt-3 w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <X size={16} />
          Finalizar
        </button>
      )}
    </div>
  );
}
