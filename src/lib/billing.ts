// Utility function to calculate parking price
// Rules:
// - Up to 29 min: proportional to minute
// - 30 min: half hour rate
// - 31-60 min: full hour rate
// - After 1h: hour + proportional exceeded minutes

export interface BillingResult {
  minutes: number;
  billableMinutes: number;
  price: number;
  timeDisplay: string;
}

export function calculateBilling(params: {
  startTime: Date | string;
  endTime?: Date | string | null;
  type: "CARRO" | "MOTO";
  pricePerMin?: number | null;
}): BillingResult {
  const start = new Date(params.startTime);
  const end = params.endTime ? new Date(params.endTime) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.max(1, Math.ceil(diffMs / 60000));
  
  // Default prices if not provided
  const pricePerMin = params.pricePerMin || (params.type === "CARRO" ? 10.0 / 60 : 5.0 / 60);
  const pricePerHour = pricePerMin * 60;
  
  let price: number;
  let billableMinutes: number;
  let timeDisplay: string;
  
  if (totalMinutes <= 29) {
    // Up to 29 min: proportional
    price = totalMinutes * pricePerMin;
    billableMinutes = totalMinutes;
    timeDisplay = `${totalMinutes} min`;
  } else if (totalMinutes === 30) {
    // 30 min: half hour rate
    price = pricePerHour / 2;
    billableMinutes = 30;
    timeDisplay = `30 min`;
  } else if (totalMinutes <= 60) {
    // 31-60 min: full hour
    price = pricePerHour;
    billableMinutes = 60;
    timeDisplay = `${totalMinutes} min`;
  } else {
    // After 1h: hour + proportional exceeded minutes
    const hours = Math.floor(totalMinutes / 60);
    const exceededMinutes = totalMinutes % 60;
    price = (hours * pricePerHour) + (exceededMinutes * pricePerMin);
    billableMinutes = totalMinutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    timeDisplay = h > 0 ? `${h}h ${m}m` : `${totalMinutes} min`;
  }
  
  return {
    minutes: totalMinutes,
    billableMinutes,
    price,
    timeDisplay,
  };
}
