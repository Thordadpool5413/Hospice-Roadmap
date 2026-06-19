export interface TeamContactRow {
  role: string;
  icon: string;
  color: string;
  callFor: string[];
  when: string;
  available: string;
}

export const HOSPICE_TEAM_MATRIX: TeamContactRow[] = [
  {
    role: "Hospice Nurse (RN)",
    icon: "activity",
    color: "#E85040",
    callFor: [
      "Pain, breathing, nausea, or any symptom change",
      "Medication questions or comfort kit use",
      "Equipment that affects care (oxygen, bed)",
      "Anything that feels urgent at night",
    ],
    when: "First call for medical concerns — 24/7",
    available: "24 hours a day, every day",
  },
  {
    role: "Hospice Aide (CNA)",
    icon: "user-check",
    color: "#3A9E8A",
    callFor: [
      "Bathing, grooming, mouth care",
      "More frequent personal care visits",
      "Skin care and positioning help",
    ],
    when: "Request through the main hospice line",
    available: "Scheduled visits; more can be arranged",
  },
  {
    role: "Chaplain",
    icon: "sun",
    color: "#B89AE8",
    callFor: [
      "Panic, fear, or spiritual distress at 3 a.m.",
      "Family conflict about care decisions",
      "Finding meaning or saying goodbye",
      "Any faith background — or none",
    ],
    when: "You can request a chaplain anytime — including nights",
    available: "On-call through hospice; visits arranged quickly",
  },
  {
    role: "Social Worker",
    icon: "users",
    color: "#58B6FF",
    callFor: [
      "Caregiver burnout or family communication",
      "Paperwork, benefits, funeral planning",
      "Children or teens in the home",
      "Respite care or extra support",
    ],
    when: "Request when emotional or practical load is heavy",
    available: "Weekdays plus on-call coverage via hospice",
  },
  {
    role: "Bereavement Counselor",
    icon: "heart",
    color: "#9A7ACC",
    callFor: [
      "Grief before or after death",
      "Anticipatory grief while still caring",
      "Ongoing support after hospice ends",
    ],
    when: "During hospice and up to 13 months after",
    available: "Phone, mailings, and counseling sessions",
  },
  {
    role: "Equipment Provider",
    icon: "tool",
    color: "#E0A030",
    callFor: [
      "Oxygen concentrator alarms or failure",
      "Hospital bed motor or remote issues",
      "Suction machine not working",
    ],
    when: "After trying quick fixes in guidance — or if unsafe",
    available: "Often 24/7 for oxygen emergencies",
  },
];