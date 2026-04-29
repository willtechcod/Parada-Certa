import { Car, Bike, X } from "lucide-react";

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
  const now = new Date();
  const startTime = new Date(vehicle.startTime);
  
  if (isNaN(startTime.getTime())) {
    console.error("Invalid startTime:", vehicle.startTime);
    return <div className="bg-background-light border border-border rounded-lg p-4">Erro: Data inválida</div>;
  }
  
  const diffMs = now.getTime() - startTime.getTime();
  const totalMinutes = Math.max(1, Math.ceil(diffMs / 60000));
  const pricePerMin = vehicle.pricePerMin || (vehicle.type === "CARRO" ? 10.0 / 60 : 5.0 / 60);
  const pricePerHour = pricePerMin * 60;

  let currentPrice: number;
  let timeDisplay: string;

  if (totalMinutes <= 29) {
    currentPrice = totalMinutes * pricePerMin;
    timeDisplay = `${totalMinutes} min`;
  } else if (totalMinutes === 30) {
    currentPrice = pricePerHour / 2;
    timeDisplay = `30 min`;
  } else if (totalMinutes <= 60) {
    currentPrice = pricePerHour;
    timeDisplay = `${totalMinutes} min`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const exceededMinutes = totalMinutes % 60;
    currentPrice = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    timeDisplay = h > 0 ? `${h}h ${m}m` : `${totalMinutes} min`;
  }

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
            <p className="text-xs text-gray-500 mt-1">{timeDisplay}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(currentPrice)}
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
