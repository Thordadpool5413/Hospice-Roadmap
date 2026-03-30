import type { CareGapType } from "./types.js";

export interface GriefType {
  id: string;
  type: string;
  description: string;
  commonExperiences: string[];
  whatHelps: string;
  whatToSay: string;
  whenToSuggestProfessionalSupport: string;
  normalTimeline: string;
}

export const GRIEF_TYPES: GriefType[] = [
  {
    id: "GRIEF-001",
    type: "Anticipatory Grief",
    description: "Grief that begins before the death, often the most misunderstood form. Families may feel they are betraying the dying person by grieving while they are still alive.",
    commonExperiences: ["Waves of sadness while the person is still living", "Crying unexpectedly", "Imagining the future without them", "Starting to say goodbye in small ways", "Difficulty concentrating on daily life", "Feeling guilty about normal activities"],
    whatHelps: "Permission to grieve. Talking to the hospice social worker or a grief counselor. Support group for caregivers. Journaling. Allowing the grief to coexist with care.",
    whatToSay: "It is okay to tell them: 'I'm already missing you, and you're still here. I love you so much.' This honesty is not a burden — it is a gift.",
    whenToSuggestProfessionalSupport: "When anticipatory grief is preventing functioning, driving, or safe caregiving.",
    normalTimeline: "Throughout the hospice period — can begin at diagnosis.",
  },
  {
    id: "GRIEF-002",
    type: "Shock and Numbness",
    description: "Feeling nothing — or a strange calm — immediately after death, even when death was expected.",
    commonExperiences: ["Going through motions automatically", "Not crying when expected to", "Strange clarity or efficiency in the hours after death", "Feeling disconnected from the experience", "Feeling nothing and then suddenly feeling everything"],
    whatHelps: "This is normal and protective. Allow the numbness. Do not push past it. Basic self-care: drinking water, eating something.",
    whatToSay: "To others: 'I feel strangely okay right now. I think it hasn't fully hit me yet.'",
    whenToSuggestProfessionalSupport: "If numbness persists for months and prevents any grieving.",
    normalTimeline: "Hours to days after death.",
  },
  {
    id: "GRIEF-003",
    type: "Guilt",
    description: "Feeling responsible for the death or for decisions made during the illness.",
    commonExperiences: ["'If I had called hospice sooner'", "'If I had been in the room when they died'", "'If I had given less/more medication'", "Replaying final conversations", "'I should have said...'", "Guilt about feeling relieved"],
    whatHelps: "Talking to the hospice social worker or bereavement counselor. Recognizing that guilt is love — it comes from caring. Understanding that no one can do everything perfectly in an impossible situation.",
    whatToSay: "It is true and helpful to say: 'You did the best you could with what you knew and what you had. That is all any of us can do.'",
    whenToSuggestProfessionalSupport: "When guilt is intrusive and persistent, affecting sleep or daily function.",
    normalTimeline: "Can begin during caregiving and intensify immediately after death.",
  },
  {
    id: "GRIEF-004",
    type: "Anger",
    description: "Anger directed at the healthcare system, at family members, at God or the universe, at the person who died, at themselves.",
    commonExperiences: ["Rage at the hospice team for perceived failures", "Anger at family members who 'weren't there'", "Anger at a God for not intervening", "Anger at the person for dying", "Anger that has no clear direction"],
    whatHelps: "Physical outlets. Talking to someone who can absorb anger without returning it. Channeling anger into advocacy or documentation of care failures if those exist.",
    whatToSay: "Anger is allowed. Say: 'I'm so angry. At the situation, at the unfairness of it, at everything. And that's part of grief.'",
    whenToSuggestProfessionalSupport: "When anger is being directed destructively at family members or self.",
    normalTimeline: "Often appears weeks after the death when numbness lifts.",
  },
  {
    id: "GRIEF-005",
    type: "Relief Mixed with Sadness",
    description: "Feeling relief that the person is no longer suffering — and then feeling guilty about that relief.",
    commonExperiences: ["'I'm relieved. Does that make me a bad person?'", "Feeling lighter after a death that followed prolonged suffering", "Relief about the end of caregiving combined with profound loss", "'I shouldn't feel this way'"],
    whatHelps: "Normalizing relief as a natural human response to the end of suffering and the end of an exhausting period. Relief is not a measure of love.",
    whatToSay: "'I feel relieved that they're not suffering anymore. And I'm devastated that they're gone. Both of those are true at the same time.'",
    whenToSuggestProfessionalSupport: "When the guilt about relief is overwhelming.",
    normalTimeline: "Often immediate after death, especially after prolonged illness.",
  },
  {
    id: "GRIEF-006",
    type: "Caregiver Exhaustion Grief",
    description: "The profound exhaustion, disorientation, and identity loss that caregivers experience after death.",
    commonExperiences: ["Not knowing what to do with themselves now that caregiving has ended", "Sleeping but never feeling rested", "Loss of purpose", "'I don't know who I am anymore'", "The house feels unbearably quiet", "Unexpected grief about small things (the hospital bed, the medications)"],
    whatHelps: "Rest. Permission to do nothing for a period. Gradually reintroducing activities that were abandoned during caregiving. Bereavement group specifically for caregivers.",
    whatToSay: "'I was their caregiver for [time]. That was my whole identity. Now I need to figure out who I am again. That's part of my grief too.'",
    whenToSuggestProfessionalSupport: "If identity loss is severe and persistent after several months.",
    normalTimeline: "Immediate post-death period, may intensify in the first months.",
  },
  {
    id: "GRIEF-007",
    type: "Regret",
    description: "Focused on specific things left unsaid or undone.",
    commonExperiences: ["'I never told them I forgave them'", "'We had a fight the week before and never resolved it'", "'I wasn't in the room when they died'", "'I should have taken them to that place one more time'"],
    whatHelps: "Writing an unsent letter to the person who died. Grief therapy focused on completing unfinished business symbolically. Understanding that the relationship is not over — it continues in a different form.",
    whatToSay: "'It's not too late to say what you need to say — even now. A letter, a prayer, a conversation at their grave — these still matter.'",
    whenToSuggestProfessionalSupport: "When regret is intrusive and non-resolving.",
    normalTimeline: "Often appears weeks to months after death.",
  },
  {
    id: "GRIEF-008",
    type: "Child Grief",
    description: "How children of various ages grieve the loss of a parent, grandparent, or other close person.",
    commonExperiences: ["School refusal or academic decline", "Sleep disturbances", "Regression to younger behaviors", "Physical complaints without medical cause", "Withdrawal or unusual aggression", "Asking repeated questions about death", "'Will I die too?'"],
    whatHelps: "Honest, age-appropriate communication. Inclusion in rituals and goodbyes. Maintaining routines. Giving the child a role (placing flowers, reading a poem). School counselor awareness. Child-focused bereavement support groups.",
    whatToSay: "'It is okay to be sad and to cry. It is also okay to play and have fun. Grandpa would want you to be happy. We will always remember him together.'",
    whenToSuggestProfessionalSupport: "If behavioral changes persist beyond a few weeks or are severe.",
    normalTimeline: "Immediate and ongoing — children's grief resurfaces at developmental milestones.",
  },
  {
    id: "GRIEF-009",
    type: "Complicated Grief (Prolonged Grief Disorder)",
    description: "Grief that does not follow a natural healing trajectory and remains acutely disabling months or years after the loss.",
    commonExperiences: ["Inability to accept the death months later", "Persistent longing that prevents functioning", "Bitterness that interferes with daily life", "Inability to experience positive emotions", "Feeling that life is meaningless", "Avoiding reminders while also being unable to stop thinking about the loss"],
    whatHelps: "Specialized complicated grief therapy (CGT) — not the same as standard grief counseling. This is a recognized clinical condition with effective treatments.",
    whatToSay: "'What you're describing sounds like grief that has gotten stuck in a way that is making it very hard to live your life. That is not weakness — it is a clinical condition that responds well to a specific kind of therapy. Would you be willing to talk to someone who specializes in exactly this?'",
    whenToSuggestProfessionalSupport: "If symptoms described above persist beyond 6 months with significant impairment.",
    normalTimeline: "Diagnosis typically considered after 6+ months of acute grief with functional impairment.",
  },
];

export function findGriefType(messageText: string): GriefType | undefined {
  const lower = messageText.toLowerCase();
  const keywords: Record<string, string> = {
    "guilt": "GRIEF-003",
    "feel guilty": "GRIEF-003",
    "anger": "GRIEF-004",
    "angry": "GRIEF-004",
    "relief": "GRIEF-005",
    "relieved": "GRIEF-005",
    "anticipatory": "GRIEF-001",
    "before they die": "GRIEF-001",
    "still here": "GRIEF-001",
    "exhausted": "GRIEF-006",
    "who am i": "GRIEF-006",
    "regret": "GRIEF-007",
    "should have said": "GRIEF-007",
    "numb": "GRIEF-002",
    "not crying": "GRIEF-002",
    "child": "GRIEF-008",
    "children": "GRIEF-008",
    "kids": "GRIEF-008",
    "complicated": "GRIEF-009",
    "stuck": "GRIEF-009",
  };
  for (const [keyword, id] of Object.entries(keywords)) {
    if (lower.includes(keyword)) {
      return GRIEF_TYPES.find((g) => g.id === id);
    }
  }
  return undefined;
}

// Gaps that exist when grief is present but not being addressed
export const GRIEF_CARE_GAPS: CareGapType[] = [
  "poor_education",
  "family_feels_abandoned",
  "after_death_unprepared",
];
