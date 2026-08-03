/** Shared display helpers for the property category taxonomy (Hostel / Flat / Homestay). */
import type { AllowedTenantType, Furnishing, PropertyCategory, PropertySubCategory } from '@/lib/api';

export const PROPERTY_CATEGORIES: { value: PropertyCategory; label: string }[] = [
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'FLAT', label: 'Flat' },
  { value: 'HOMESTAY', label: 'Home stay' },
];

export const PROPERTY_SUB_CATEGORIES: { value: PropertySubCategory; label: string }[] = [
  { value: 'BHK_1', label: '1 BHK' },
  { value: 'BHK_2', label: '2 BHK' },
  { value: 'BHK_3', label: '3 BHK' },
  { value: 'BHK_4', label: '4 BHK' },
  { value: 'BHK_5', label: '5 BHK' },
];

export const FURNISHING_OPTIONS: { value: Furnishing; label: string }[] = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi furnished' },
  { value: 'FULLY_FURNISHED', label: 'Fully furnished' },
];

export const ALLOWED_TENANT_TYPES: { value: AllowedTenantType; label: string }[] = [
  { value: 'FAMILY_ONLY', label: 'Family only' },
  { value: 'BACHELOR_ONLY', label: 'Bachelor only' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'FAMILY_AND_BACHELOR', label: 'Family + Bachelor' },
];

/** Whether a category books a whole unit (no room/bed selection, single rent). */
export function isUnitCategory(category: PropertyCategory | null | undefined): boolean {
  return category === 'FLAT' || category === 'HOMESTAY';
}

export function propertyCategoryLabel(category?: PropertyCategory | null): string {
  return PROPERTY_CATEGORIES.find((c) => c.value === category)?.label ?? '';
}

export function propertySubCategoryLabel(sub?: PropertySubCategory | null): string {
  return PROPERTY_SUB_CATEGORIES.find((s) => s.value === sub)?.label ?? '';
}

export function furnishingLabel(furnishing?: Furnishing | null): string {
  return FURNISHING_OPTIONS.find((f) => f.value === furnishing)?.label ?? '';
}

export function allowedTenantTypeLabel(type?: AllowedTenantType | null): string {
  return ALLOWED_TENANT_TYPES.find((t) => t.value === type)?.label ?? '';
}
