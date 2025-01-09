import Centroids from '../data/centroids.json';

export const getCentroidForCity = (cityKey: string): [number, number] => 
  (Centroids.cities[cityKey]) ? Centroids.cities[cityKey] as [number, number] : [0, 0]; 