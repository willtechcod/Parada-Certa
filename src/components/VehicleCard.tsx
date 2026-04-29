import { Car, Bike, X } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Format license plate to Brazilian standard
const formatPlateDisplay = (plate: string): string => {
  // Safety check for undefined/null
  if (!plate) return '';
  
  const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Old standard: ABC1234 -> ABC-1234
  if (/^[A-Z]{3}\d{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // Mercosul: ABC1D23 -> ABC-1D23
  if (/^[A-Z]{3}\d{1}[A-Z]{1}\d{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // Return as-is if doesn't match
  return plate;
};

interface VehicleCardProps {
  plate: string;
  model: string;
  type: "CARRO" | "MOTO";
  startTime: Date;
  pricePerMin?: number;
  onFinish?: () => void;
}

export function VehicleCard({
  plate,
  model,
  type,
  startTime,
  pricePerMin = 10.0 / 60, // R$ 10/hora para CARRO
  onFinish,
}: VehicleCardProps) {
  const now = new Date();
  const diffMs = now.getTime() - new Date(startTime).getTime();
  const totalMinutes = Math.max(1, Math.ceil(diffMs / 60000));
  const pricePerHour = pricePerMin * 60; // Preço por hora

  let currentPrice: number;
  let timeDisplay: string;
  let billableMinutes: number;

  // Nova lógica: até 29 min proporcional, 30 min = metade da hora, após 1h = hora + minuto proporcional
  if (totalMinutes <= 29) {
    // Até 29 min: proporcional ao minuto
    currentPrice = totalMinutes * pricePerMin;
    billableMinutes = totalMinutes;
    timeDisplay = `${totalMinutes} min`;
  } else if (totalMinutes === 30) {
    // 30 min: metade do valor da hora
    currentPrice = pricePerHour / 2;
    billableMinutes = 30;
    timeDisplay = `30 min`;
  } else if (totalMinutes <= 60) {
    // Entre 31-60 min: valor da hora cheia
    currentPrice = pricePerHour;
    billableMinutes = 60;
    timeDisplay = `${totalMinutes} min`;
  } else {
    // Após 1h: valor da hora + minuto proporcional excedido
    const hours = Math.floor(totalMinutes / 60);
    const exceededMinutes = totalMinutes % 60;
    currentPrice = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
    billableMinutes = totalMinutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    timeDisplay = h > 0 ? `${h}h ${m}m` : `${totalMinutes} min`;
  }

  return (
    <div className="bg-background-light border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {type === "CARRO" ? <Car size={32} /> : <Bike size={32} />}
          </div>
          <div>
            <p className="text-lg font-bold text-white">{formatPlateDisplay(plate)}</p>
            <p className="text-sm text-gray-400">{model}</p>
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
          onClick={onFinish}
          className="mt-3 w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <X size={16} />
          Finalizar
        </button>
      )}
    </div>
  );
}
