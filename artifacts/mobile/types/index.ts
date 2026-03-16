export type JourneyStage = "before" | "during" | "after";

export type UserRole =
  | "caregiver"
  | "family"
  | "patient"
  | "physician"
  | "discharge_planner"
  | "staff"
  | "exploring";

export interface User {
  id: string;
  role: UserRole;
  journeyStage: JourneyStage;
  name?: string;
  onboardingComplete: boolean;
  savedResources: string[];
  savedProviders: string[];
  createdAt: string;
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

export interface Referral {
  id: string;
  patientName: string;
  patientDOB: string;
  diagnosis: string;
  physicianName: string;
  physicianPhone: string;
  facilityName?: string;
  contactName: string;
  contactPhone: string;
  contactRelationship: string;
  urgency: "routine" | "urgent" | "emergent";
  additionalNotes?: string;
  status: "draft" | "submitted" | "received" | "processing" | "complete";
  submittedAt?: string;
  providerId?: string;
}

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
  | "referral_help"
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
