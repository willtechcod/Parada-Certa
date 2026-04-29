import { Car, Bike, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card className="bg-background-light border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  totalVehicles: number;
  totalCars: number;
  totalMotos: number;
  revenue: number;
  occupancyRate?: number;
}

export function StatsCards({
  totalVehicles,
  totalCars,
  totalMotos,
  revenue,
  occupancyRate,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Veículos Ativos"
        value={totalVehicles}
        icon={<Car size={24} />}
        description={`${totalCars} carros, ${totalMotos} motos`}
      />
      <StatCard
        title="Carros"
        value={totalCars}
        icon={<Car size={24} />}
      />
      <StatCard
        title="Motos"
        value={totalMotos}
        icon={<Bike size={24} />}
      />
      <StatCard
        title="Faturamento"
        value={`R$ ${revenue.toFixed(2)}`}
        icon={<DollarSign size={24} />}
        description={occupancyRate ? `${occupancyRate}% ocupação` : undefined}
      />
    </div>
  );
}
