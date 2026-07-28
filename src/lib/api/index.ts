/** PGfy API surface — import from `@/lib/api`. */
export {
  API_BASE_URL,
  ApiError,
  errorMessage,
  getAccessToken,
  setAccessToken,
  setUnauthorizedHandler,
  request,
} from './client';

export * as authApi from './auth';
export * as profileApi from './profile';
export * as masterDataApi from './masterData';
export * as propertyApi from './property';
export * as favoritesApi from './favorites';
export * as bookingApi from './booking';
export * as billingApi from './billing';
export * as couponsApi from './coupons';
export * as stayApi from './stay';
export * as maintenanceApi from './maintenance';
export * as visitorLogApi from './visitorLog';
export * as continueBrowsingApi from './continueBrowsing';
export * as dashboardApi from './dashboard';
export * as searchApi from './search';
export * as uploadApi from './upload';
export { UploadFileType } from './upload';

export type {
  SendOtpInput,
  VerifyOtpInput,
  SendPhoneVerificationInput,
  VerifyPhoneVerificationInput,
  SendEmailVerificationInput,
  VerifyEmailVerificationInput,
  VerifyContactResponse,
  SendCompanyEmailOtpInput,
  VerifyCompanyEmailOtpInput,
} from './auth';
export type { UpdateTenantProfileInput } from './profile';
export type {
  SearchPropertiesQuery,
  PropertyPage,
  PropertyDetailsQuery,
  RoomBedAvailabilityQuery,
} from './property';
export type { ContinueBrowsingProperty, ContinueBrowsingPage, ContinueBrowsingMediaSection } from './continueBrowsing';
export type { DashboardQuery, DashboardResponse } from './dashboard';
export type {
  SearchProperty,
  SearchResponse,
  SearchPropertyLocality,
  SearchPropertyCity,
  SearchPropertyType,
  SearchPropertyMediaSection,
} from './search';
export type { UploadPurpose, UploadResult, UploadFileInput } from './upload';
export type { ListBookingsQuery } from './booking';
export type { ListBillingRentQuery } from './billing';
export type { ListCouponsQuery } from './coupons';
export type { ListMaintenanceQuery } from './maintenance';
export type { ListVisitorLogsQuery } from './visitorLog';

export type {
  ApiProfile,
  ProfileAsset,
  Gender,
  PersonalDetails,
  KycDocuments,
  Occupation,
  OccupationDetails,
  BankDetails,
  AuthResponse,
  GuestAuthResponse,
  KycStatus,
  BankVerificationStatus,
  ProfileStatus,
  Paginated,
  ListResponse,
  MasterStatus,
  MasterChargeType,
  MasterMediaAsset,
  StateMaster,
  CityMaster,
  LocalityMaster,
  MaintenancePriority,
  MaintenanceCategoryMaster,
  SupportPanel,
  PlatformSupportCategoryMaster,
  PopularDestinationMaster,
  MasterConfig,
  PropertyGender,
  MediaAttachment,
  PropertyMediaSection,
  PropertyGstMode,
  ApiProperty,
  ApiBookingMode,
  ApiPropertyPricingTier,
  ApiFoodMenuSlot,
  ApiFoodMenuDay,
  ApiFoodMenu,
  VerificationDocStatus,
  ApiVerificationDocument,
  ApiPropertyVerification,
  ApiPropertyReview,
  ApiPropertyDetails,
  ApiBedStatus,
  ApiRoomBed,
  ApiPropertyRoom,
  ApiPropertyFloor,
  ApiSelectedOccupancy,
  ApiRoomBedAvailability,
  FavoriteStatus,
  TenantFavoriteProperty,
  BookingStatusApi,
  PaymentMethod,
  PaymentFrequency,
  ApiBookingProperty,
  ApiBooking,
  ApiBookingDetail,
  CreateBookingInput,
  ApiBookingInvoice,
  ApiBookingBill,
  ApiBookingTransaction,
  ApiBookingPaymentHint,
  ApiBookingCreateResponse,
  CancelBookingInput,
  ApiBookingRefund,
  ApiBookingCancelResponse,
  InvoiceStatusApi,
  InvoiceTypeApi,
  ApiInvoiceProperty,
  ApiInvoiceRoom,
  ApiInvoiceBooking,
  ApiInvoiceTenant,
  ApiInvoice,
  ApiBillingSummary,
  ApiBillingRentResponse,
  PayRentInput,
  ApiPayRentInvoice,
  ApiPayRentMandate,
  ApiPayRentRazorpayAuth,
  ApiPayRentAutopay,
  ApiPayRentResponse,
  CouponDiscountType,
  CouponStatus,
  ApiCoupon,
  ApiStayProperty,
  ApiStayBookingSummary,
  ApiStayFloor,
  ApiStayRoom,
  ApiStayBed,
  ApiStayBilling,
  ApiBedStay,
  ApiMyStayOwner,
  ApiMyStayProperty,
  ApiMyStayRoom,
  ApiMyStayBooking,
  ApiMyStayInvoice,
  ApiMyStayBilling,
  ApiMyStayResponse,
  MaintenanceStatus,
  ApiMaintenanceTicket,
  MaintenanceSummary,
  ApiMaintenanceListResponse,
  CreateMaintenanceInput,
  VisitorLogStatus,
  ApiVisitorLog,
  CreateVisitorLogInput,
} from './types';
