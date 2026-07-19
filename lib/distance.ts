export interface DeliveryRules {
  distanceKm: number;
  minOrder: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  isServiceable: boolean;
  zoneName: string;
}

export function getDeliveryRules(distanceKm: number): DeliveryRules {
  if (distanceKm <= 2) {
    return {
      distanceKm,
      minOrder: 20,
      deliveryFee: 25,
      freeDeliveryThreshold: 199,
      isServiceable: true,
      zoneName: '0-2 km',
    };
  } else if (distanceKm <= 3) {
    return {
      distanceKm,
      minOrder: 20,
      deliveryFee: 35,
      freeDeliveryThreshold: 249,
      isServiceable: true,
      zoneName: '2-3 km',
    };
  }
  return {
    distanceKm,
    minOrder: 20,
    deliveryFee: 0,
    freeDeliveryThreshold: 249,
    isServiceable: false,
    zoneName: '3+ km (out of range)',
  };
}
