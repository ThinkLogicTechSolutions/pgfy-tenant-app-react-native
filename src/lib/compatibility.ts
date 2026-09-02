/**
 * Roommate compatibility scoring. Compares the tenant's occupation (from KYC step 2)
 * and lifestyle preferences against a room's current-occupant profile and returns a
 * 0–100 match score plus a per-dimension breakdown for the selection UI.
 */
import type { RoommateProfile } from '@/data/types';
import type { LifestylePrefs, Occupation } from '@/store/profile';

export interface CompatInput {
  occupation: Occupation | null;
  prefs: LifestylePrefs;
}

export interface CompatBreakdownItem {
  /** Dimension being compared, e.g. "Diet". */
  category: string;
  /** The tenant's own preference. */
  you: string;
  /** The corresponding value for this room's current occupants. */
  room: string;
  match: boolean;
}

export interface CompatResult {
  /** 0–100, rounded. Only meaningful when `answered > 0`. */
  score: number;
  breakdown: CompatBreakdownItem[];
  /** how many dimensions the tenant has expressed a preference for */
  answered: number;
}

const dietLabel: Record<RoommateProfile['diet'], string> = {
  veg: 'Vegetarian',
  vegan: 'Vegan',
  nonveg: 'Non-vegetarian',
};

/** True when both diets avoid meat (veg & vegan are considered compatible). */
function dietMatches(a: LifestylePrefs['diet'], b: RoommateProfile['diet']): boolean {
  if (!a) return false;
  if (a === b) return true;
  return a !== 'nonveg' && b !== 'nonveg';
}

export function computeCompatibility(input: CompatInput, room?: RoommateProfile): CompatResult {
  const { occupation, prefs } = input;
  const breakdown: CompatBreakdownItem[] = [];

  if (room && occupation) {
    const roomMostlyPros = room.professionals >= room.students;
    const match = occupation === 'professional' ? roomMostlyPros : !roomMostlyPros;
    breakdown.push({
      category: 'Roommate type',
      you: occupation === 'professional' ? 'Working professional' : 'Student',
      room: roomMostlyPros ? 'Mostly professionals' : 'Mostly students',
      match,
    });
  }

  if (room && prefs.smoking !== null) {
    breakdown.push({
      category: 'Smoking',
      you: prefs.smoking ? 'Smoking-friendly' : 'Non-smoking',
      room: room.smoking ? 'Smokers in this room' : 'Non-smoking room',
      match: room.smoking === prefs.smoking,
    });
  }

  if (room && prefs.alcohol !== null) {
    breakdown.push({
      category: 'Alcohol',
      you: prefs.alcohol ? 'Alcohol-friendly' : 'No alcohol',
      room: room.alcohol ? 'Roommates drink' : 'Alcohol-free room',
      match: room.alcohol === prefs.alcohol,
    });
  }

  if (room && prefs.sleep) {
    breakdown.push({
      category: 'Sleep schedule',
      you: prefs.sleep === 'early' ? 'Early sleeper' : 'Night owl',
      room: room.sleep === 'early' ? 'Early sleepers' : 'Night owls',
      match: room.sleep === prefs.sleep,
    });
  }

  if (room && prefs.diet) {
    breakdown.push({
      category: 'Diet',
      you: dietLabel[prefs.diet],
      room: dietLabel[room.diet],
      match: dietMatches(prefs.diet, room.diet),
    });
  }

  const answered = breakdown.length;
  const matches = breakdown.filter((b) => b.match).length;
  const score = answered === 0 ? 0 : Math.round((matches / answered) * 100);
  return { score, breakdown, answered };
}

export function compatibilityTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'danger';
}
