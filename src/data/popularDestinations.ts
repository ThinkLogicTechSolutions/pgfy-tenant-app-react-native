/** Home screen popular destinations — leaf module (no barrel / discovery deps). */
import { coverImages } from './images';

export type PopularDestination = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
};

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  { id: 'blr', name: 'Bengaluru', subtitle: '120+ PGs', image: coverImages[0] },
  { id: 'hyd', name: 'Hyderabad', subtitle: '95+ PGs', image: coverImages[4] },
  { id: 'pun', name: 'Pune', subtitle: '80+ PGs', image: coverImages[2] },
  { id: 'mum', name: 'Mumbai', subtitle: '110+ PGs', image: coverImages[6] },
  { id: 'del', name: 'Delhi NCR', subtitle: '140+ PGs', image: coverImages[7] },
  { id: 'che', name: 'Chennai', subtitle: '70+ PGs', image: coverImages[9] },
  { id: 'kol', name: 'Kolkata', subtitle: '65+ PGs', image: coverImages[11] },
  { id: 'ahm', name: 'Ahmedabad', subtitle: '55+ PGs', image: coverImages[13] },
];
