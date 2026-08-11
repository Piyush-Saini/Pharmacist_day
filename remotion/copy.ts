/**
 * On-screen copy for the film.
 *
 * Two variant axes, both driven by the payload:
 *   - `earlyCareer` (PRD §7.3) swaps the caption set for under-5-year
 *     pharmacists, so the film leads on people and trust rather than lifetime
 *     totals that would read as unremarkable.
 *   - `knownFor` (PRD §7.4) selects one of six captions for scene 8.
 */

import type { KnownFor, Language } from "../lib/types";

export interface SceneCopy {
  kicker: string;
  headline: string;
  /** Caption under the big number. */
  caption: string;
}

export interface VideoCopy {
  introKicker: string;
  introTitle: string;
  identityGreeting: string;
  identityAt: string;
  years: SceneCopy;
  hours: SceneCopy;
  people: SceneCopy;
  minutes: SceneCopy;
  steps: SceneCopy;
  /** Comparison lines that land after the main number settles. */
  hoursFootnote: (continuousYears: string) => string;
  peopleFootnote: (stadiums: string) => string;
  knownForKicker: string;
  knownFor: Record<KnownFor, { title: string; sub: string }>;
  outroLine1: string;
  outroLine2: string;
  outroSignoff: string;
  unitWeeks: string;
  unitHours: string;
  unitPeople: string;
  unitKm: string;
  unitStadiums: string;
  unitYears: string;
}

const enBase: VideoCopy = {
  introKicker: "World Pharmacist Day 2026",
  introTitle: "Your work, in numbers.",
  identityGreeting: "This is",
  identityAt: "at",

  // Each caption continues the sentence *after* the number and its unit, so
  // the three lines read as one: kicker → "1,144 weeks" → caption.
  years: {
    kicker: "You have been at this for",
    headline: "",
    caption: "standing behind that counter.",
  },
  hours: {
    kicker: "That adds up to",
    headline: "",
    caption: "on your feet, for someone else.",
  },
  people: {
    kicker: "In that time you have served",
    headline: "",
    caption: "one at a time.",
  },
  minutes: {
    kicker: "Every one of them got",
    headline: "",
    caption: "of your day, and your full attention.",
  },
  steps: {
    kicker: "And you walked",
    headline: "",
    caption: "without ever leaving your shop.",
  },

  hoursFootnote: (y) => `That is ${y} years without once going home.`,
  peopleFootnote: (s) => `Enough people to fill ${s} cricket stadiums.`,

  knownForKicker: "But ask your customers,",
  knownFor: {
    patient_guidance: {
      title: "and they talk about your guidance.",
      sub: "The explanation nobody else had time to give.",
    },
    always_available: {
      title: "and they talk about you always being there.",
      sub: "Open when they needed you. Every time.",
    },
    medicine_knowledge: {
      title: "and they talk about what you know.",
      sub: "The right answer, without looking it up.",
    },
    friendly_advice: {
      title: "and they talk about how you talk to them.",
      sub: "Advice that felt like it came from family.",
    },
    serving_generations: {
      title: "and they talk about the years.",
      sub: "You have served their parents. Now their children.",
    },
    helping_emergencies: {
      title: "and they talk about the emergencies.",
      sub: "The night you opened up when it mattered most.",
    },
  },

  outroLine1: "Numbers cannot hold all of it.",
  outroLine2: "Thank you, ",
  outroSignoff: "Happy World Pharmacist Day",

  unitWeeks: "weeks",
  unitHours: "hours",
  unitPeople: "people",
  unitKm: "km",
  unitStadiums: "stadiums",
  unitYears: "years",
};

/** Under 5 years — leads on people served and trust, not cumulative totals. */
const enEarly: Partial<VideoCopy> = {
  introTitle: "Your work, already counting.",
  years: {
    kicker: "You have already given",
    headline: "",
    caption: "to this counter.",
  },
  hours: {
    kicker: "Already",
    headline: "",
    caption: "standing for someone else.",
  },
  people: {
    kicker: "And already",
    headline: "",
    caption: "have trusted you with their health.",
  },
  minutes: {
    kicker: "Each of them gets",
    headline: "",
    caption: "of your full attention.",
  },
  steps: {
    kicker: "You have already walked",
    headline: "",
    caption: "for them.",
  },
  outroLine1: "This is only the beginning.",
};

const hiBase: VideoCopy = {
  introKicker: "वर्ल्ड फार्मासिस्ट डे 2026",
  introTitle: "आपका काम, आँकड़ों में।",
  identityGreeting: "मिलिए",
  identityAt: "—",

  years: {
    kicker: "आप यह काम कर रहे हैं",
    headline: "",
    caption: "इसी काउंटर के पीछे खड़े होकर।",
  },
  hours: {
    kicker: "यानी कुल",
    headline: "",
    caption: "अपने पैरों पर, किसी और के लिए।",
  },
  people: {
    kicker: "इस दौरान आपने सेवा की",
    headline: "",
    caption: "एक-एक करके।",
  },
  minutes: {
    kicker: "हर एक को मिला",
    headline: "",
    caption: "आपके दिन का हिस्सा, और पूरा ध्यान।",
  },
  steps: {
    kicker: "और इस दौरान आप चले",
    headline: "",
    caption: "दुकान से बाहर कदम रखे बिना।",
  },

  hoursFootnote: (y) => `यानी ${y} वर्ष, बिना एक बार घर जाए।`,
  peopleFootnote: (s) => `इतने लोग, जिनसे ${s} स्टेडियम भर जाएँ।`,

  knownForKicker: "पर अपने ग्राहकों से पूछिए,",
  knownFor: {
    patient_guidance: {
      title: "वे आपकी सलाह की बात करते हैं।",
      sub: "वह समझाना, जिसके लिए किसी और के पास वक़्त नहीं था।",
    },
    always_available: {
      title: "वे कहते हैं, आप हमेशा मिले।",
      sub: "जब ज़रूरत पड़ी, दुकान खुली थी। हर बार।",
    },
    medicine_knowledge: {
      title: "वे आपकी जानकारी की बात करते हैं।",
      sub: "सही जवाब, बिना कुछ देखे।",
    },
    friendly_advice: {
      title: "वे आपके बात करने के तरीके की बात करते हैं।",
      sub: "सलाह, जो अपने घर की लगी।",
    },
    serving_generations: {
      title: "वे बीते बरसों की बात करते हैं।",
      sub: "आपने उनके माता-पिता की सेवा की। अब उनके बच्चों की।",
    },
    helping_emergencies: {
      title: "वे उस आपात रात की बात करते हैं।",
      sub: "जब सबसे ज़्यादा ज़रूरत थी, आपने दुकान खोली।",
    },
  },

  outroLine1: "आँकड़े सब कुछ नहीं कह सकते।",
  outroLine2: "धन्यवाद, ",
  outroSignoff: "वर्ल्ड फार्मासिस्ट डे की शुभकामनाएँ",

  unitWeeks: "हफ़्ते",
  unitHours: "घंटे",
  // Hindi needs the case ending on the unit for the sentence to read; the
  // early-career variant overrides this because its caption takes a different
  // grammatical form.
  unitPeople: "लोगों की",
  unitKm: "किमी",
  unitStadiums: "स्टेडियम",
  unitYears: "वर्ष",
};

const hiEarly: Partial<VideoCopy> = {
  introTitle: "आपका काम, अभी से गिनती में।",
  years: {
    kicker: "आपने अब तक दिए हैं",
    headline: "",
    caption: "इस काउंटर को।",
  },
  hours: {
    kicker: "अब तक",
    headline: "",
    caption: "किसी और के लिए खड़े रहकर।",
  },
  people: {
    kicker: "और अब तक",
    headline: "",
    caption: "ने आप पर भरोसा किया है।",
  },
  minutes: {
    kicker: "हर एक को मिलता है",
    headline: "",
    caption: "आपका पूरा ध्यान।",
  },
  steps: {
    kicker: "आप अब तक चल चुके हैं",
    headline: "",
    caption: "उनके लिए।",
  },
  unitPeople: "लोगों",
  outroLine1: "यह तो केवल शुरुआत है।",
};

export function getVideoCopy(lang: Language, earlyCareer: boolean): VideoCopy {
  const base = lang === "hi" ? hiBase : enBase;
  if (!earlyCareer) return base;
  const early = lang === "hi" ? hiEarly : enEarly;
  return { ...base, ...early };
}
