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
      minOrder: 0,
      deliveryFee: 25,
      freeDeliveryThreshold: 200,
      isServiceable: true,
      zoneName: '0-2 km',
    };
  } else if (distanceKm <= 3) {
    return {
      distanceKm,
      minOrder: 0,
      deliveryFee: 35,
      freeDeliveryThreshold: 300,
      isServiceable: true,
      zoneName: '2-3 km',
    };
  } else if (distanceKm <= 4) {
    return {
      distanceKm,
      minOrder: 0,
      deliveryFee: 45,
      freeDeliveryThreshold: 400,
      isServiceable: true,
      zoneName: '3-4 km',
    };
  }
  return {
    distanceKm,
    minOrder: 0,
    deliveryFee: 0,
    freeDeliveryThreshold: 400,
    isServiceable: false,
    zoneName: '4+ km (out of range)',
  };
}
