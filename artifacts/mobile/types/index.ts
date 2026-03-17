export type JourneyStage = "before" | "during" | "after";

export type UserRole =
  | "patient"
  | "caregiver"
  | "other";

export interface GoalsOfCare {
  whatMattersMost?: string;
  goodDayLooksLike?: string;
  thingsToAvoid?: string;
  dnrStatus?: "dnr" | "full-code" | "unknown" | "not-discussed";
  additionalDirectives?: string;
  updatedAt?: string;
}

export interface MedicationEntry {
  id: string;
  name: string;
  rxcui?: string;
  tty?: string;
  doseNote?: string;
}

export interface PatientProfile {
  patientName?: string;
  diagnosis?: string;
  comfortKitMedications?: string;
  medications?: MedicationEntry[];
  equipmentInHome?: string;
  hospicePhone?: string;
  hospiceAfterHoursPhone?: string;
  equipmentProviderPhone?: string;
  pharmacyPhone?: string;
  additionalNotes?: string;
  goalsOfCare?: GoalsOfCare;
}

export interface SymptomEntry {
  id: string;
  date: string;
  time: string;
  pain: number;
  breathlessness: number;
  nausea: number;
  agitation: 0 | 1 | 2 | 3;
  restlessness: boolean;
  appetite: 0 | 1 | 2 | 3;
  notes?: string;
}

export interface User {
  id: string;
  role: UserRole;
  journeyStage: JourneyStage;
  name?: string;
  onboardingComplete: boolean;
  savedResources: string[];
  savedProviders: string[];
  createdAt: string;
  patientProfile?: PatientProfile;
}

export interface Provider {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website?: string;
  distance?: number;
  services: string[];
  accreditations: string[];
  rating?: number;
  reviewCount?: number;
  description: string;
  acceptsMedicare: boolean;
  acceptsMedicaid: boolean;
  specialties: string[];
  ccn?: string;
  county?: string;
  cmsOwnershipType?: string;
  certificationDate?: string;
  cmsRegion?: string;
  medicareGovUrl?: string;
  cmsQuality?: CmsQualityData;
  cmsSpending?: CmsSpendingData;
}

export interface CmsQualityData {
  ccn: string;
  hciScore: string | null;
  summaryStarRating: string | null;
  compositeProcessMeasure: string | null;
  perBeneficiarySpending: string | null;
  avgDailyCensus: string | null;
  visitsNearDeath: string | null;
  cahps: {
    overallRating9or10: string | null;
    wouldDefinitelyRecommend: string | null;
    alwaysTreatedWithRespect: string | null;
    alwaysGotPainHelp: string | null;
    alwaysCommunicatedWell: string | null;
    alwaysTimelyHelp: string | null;
    alwaysRightEmotionalSupport: string | null;
    definitelyReceivedTraining: string | null;
  };
  qualityMeasures: Array<{
    code: string;
    name: string;
    score: string;
    percentile?: string;
  }>;
  medicareGovUrl: string;
}

export interface CmsOfficeVisitCosts {
  zip: string;
  newPatientCopay: string | null;
  establishedPatientCopay: string | null;
  newPatientMedicarePricing: string | null;
  establishedPatientMedicarePricing: string | null;
}

export interface CmsSpendingData {
  ccn: string;
  found: boolean;
  perBeneficiarySpending: string | null;
  avgDailyCensus: string | null;
  utilizationMeasures: Array<{
    code: string;
    name: string;
    score: string;
  }>;
  officeVisitCosts: CmsOfficeVisitCosts | null;
  source: string;
  medicareGovUrl: string;
}

export interface Resource {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: ResourceCategory;
  journeyStage: JourneyStage[];
  tags: string[];
  readTime: number;
  isFeatured: boolean;
}

export type ResourceCategory =
  | "understanding_hospice"
  | "eligibility"
  | "caregiver_support"
  | "symptom_care"
  | "decision_support"
  | "after_hospice"
  | "grief_bereavement"
  | "physician_resources"
  | "documentation"
  | "myths_facts";

export interface SupportRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  topic: SupportTopic;
  message: string;
  preferredContact: "email" | "phone";
  submittedAt?: string;
  status: "pending" | "received" | "resolved";
}

export type SupportTopic =
  | "general_question"
  | "provider_search"
  | "caregiver_support"
  | "bereavement"
  | "eligibility_question"
  | "other";

export interface EvaluationInput {
  diagnosis: DiagnosisCategory;
  performanceStatus: 0 | 1 | 2 | 3 | 4;
  weightLoss: boolean;
  hospitalizations: number;
  declineRate: "rapid" | "gradual" | "stable";
  painLevel: number;
  adlDecline: boolean;
  advanceDirectives: boolean;
}

export type DiagnosisCategory =
  | "cancer"
  | "chf"
  | "copd"
  | "dementia"
  | "stroke"
  | "general_debility"
  | "liver_disease"
  | "renal_disease"
  | "aids"
  | "other";

export interface EvaluationResult {
  readinessLevel: "low" | "moderate" | "high";
  score: number;
  summary: string;
  keyFactors: string[];
  nextSteps: string[];
  disclaimer: string;
}

export interface JourneyContent {
  id: string;
  stage: JourneyStage;
  title: string;
  subtitle: string;
  sections: ContentSection[];
}

export interface ContentSection {
  id: string;
  title: string;
  body: string;
  icon?: string;
}

export interface BereavementResource {
  id: string;
  title: string;
  description: string;
  type: "article" | "hotline" | "organization" | "book" | "tool";
  url?: string;
  phone?: string;
  isFree: boolean;
  tags: string[];
}

export type JournalEntryType = "symptom" | "medication" | "observation" | "mood" | "general";

export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title: string;
  body: string;
  date: string;
  timestamp: number;
  moodLevel?: 1 | 2 | 3 | 4 | 5;
}

export type ReminderRecurrence = "none" | "daily" | "weekly";
export type ReminderType = "medication" | "appointment";

export interface Reminder {
  id: string;
  type: ReminderType;
  label: string;
  datetime: string;
  recurrence: ReminderRecurrence;
  enabled: boolean;
  notificationId?: string;
}
