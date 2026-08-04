import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CafeScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/restaurants');
  }, []);

  return null;
}
