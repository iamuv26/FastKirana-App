import React from 'react';
import { Redirect } from 'expo-router';

export default function RestaurantRoute() {
  return <Redirect href="/cafe?mode=restaurant" />;
}
