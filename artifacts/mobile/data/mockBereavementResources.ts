import { BereavementResource } from "@/types";

export const bereavementResources: BereavementResource[] = [
  {
    id: "bv-001",
    title: "988 Suicide & Crisis Lifeline",
    description:
      "Free, confidential crisis support 24/7 for people in distress. Grief can sometimes feel overwhelming — this line is for anyone who needs to talk.",
    type: "hotline",
    phone: "988",
    isFree: true,
    tags: ["crisis", "24/7", "emotional support"],
  },
  {
    id: "bv-002",
    title: "GriefShare Support Groups",
    description:
      "A grief recovery support group program offered through churches nationwide. Weekly meetings help people move through grief at their own pace.",
    type: "organization",
    url: "https://www.griefshare.org",
    isFree: true,
    tags: ["support group", "community", "weekly meetings"],
  },
  {
    id: "bv-003",
    title: "What's Your Grief",
    description:
      "Practical, evidence-based articles, courses, and resources on grief and loss for adults, written by licensed grief therapists.",
    type: "article",
    url: "https://whatsyourgrief.com",
    isFree: true,
    tags: ["education", "articles", "therapist-authored"],
  },
  {
    id: "bv-004",
    title: "National Alliance for Grieving Children",
    description:
      "Resources and support for children who are grieving the death of a parent, sibling, or other loved one. Includes a provider directory.",
    type: "organization",
    url: "https://childrengrieve.org",
    isFree: true,
    tags: ["children", "family", "grief education"],
  },
  {
    id: "bv-005",
    title: "Hospice Foundation of America",
    description:
      "Educational materials and a library of grief resources from a leading nonprofit in end-of-life care and bereavement.",
    type: "organization",
    url: "https://hospicefoundation.org",
    isFree: true,
    tags: ["education", "hospice", "nonprofit"],
  },
  {
    id: "bv-006",
    title: "Option B (Sheryl Sandberg's Platform)",
    description:
      "A community of people finding strength in the face of adversity, including loss. Resources, forums, and stories of resilience.",
    type: "organization",
    url: "https://optionb.org",
    isFree: true,
    tags: ["community", "resilience", "stories"],
  },
  {
    id: "bv-007",
    title: "Being Mortal (Atul Gawande)",
    description:
      "A widely praised book by surgeon and author Atul Gawande about how medicine can better honor the wishes of the dying and those who love them.",
    type: "book",
    isFree: false,
    tags: ["book", "end-of-life", "medicine", "reading"],
  },
  {
    id: "bv-008",
    title: "The Year of Magical Thinking (Joan Didion)",
    description:
      "A memoir of grief following the sudden death of the author's husband. Considered one of the most honest and beautiful accounts of loss.",
    type: "book",
    isFree: false,
    tags: ["book", "memoir", "grief", "reading"],
  },
];
