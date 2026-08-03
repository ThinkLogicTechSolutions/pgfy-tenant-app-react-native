/** Current tenant user. */
import type { TenantUser } from './types';

export const USER: TenantUser = {
  id: 'u1',
  name: 'Aarav Sharma',
  phone: '+91 98765 43210',
  email: 'aarav.sharma@gmail.com',
  avatar: 'https://i.pravatar.cc/150?img=12',
  kycStatus: 'Verified',
  guardianName: 'Rajesh Sharma',
  guardianPhone: '+91 98450 11223',
  guardianRelation: 'Father',
  emergencyContact: '+91 98450 11223',
  documents: [
    { label: 'Aadhaar (front & back)', status: 'Verified' },
    { label: 'PAN card', status: 'Verified' },
    { label: 'Passport-size photo', status: 'Verified' },
    { label: 'Guardian details', status: 'Verified' },
  ],
};
