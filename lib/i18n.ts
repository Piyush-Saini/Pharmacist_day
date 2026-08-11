/**
 * All user-facing strings, externalised from day one (PRD §9 Localization).
 *
 * Hindi + English ship in this prototype. Adding a language is a matter of
 * adding one more entry to `strings` — no component changes. Regional
 * languages beyond these are PRD Open Question 4.
 */

import type { Language } from "./types";

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

export interface Strings {
  // Landing
  landingHeadline: string;
  landingSub: string;
  landingCta: string;
  landingTime: string;
  chooseLanguage: string;

  // Chrome
  stepOf: (current: number, total: number) => string;
  back: string;
  next: string;
  submit: string;

  // Questions
  q1Title: string;
  q1Help: string;
  q1Unit: string;
  q2Title: string;
  q3Title: string;
  q3Unit: string;
  q4Title: string;
  q4Help: string;
  q4Unit: string;
  q5Title: string;
  q5Help: string;
  q6Title: string;
  q6Help: string;

  // Option labels
  daysOption: (d: number) => string;
  hoursOption: (h: number) => string;
  stepsUnder2000: string;
  steps2000_3000: string;
  steps3000_4000: string;
  steps4000_5000: string;
  stepsOver5000: string;
  stepsUnknown: string;
  knownForPatientGuidance: string;
  knownForAlwaysAvailable: string;
  knownForMedicineKnowledge: string;
  knownForFriendlyAdvice: string;
  knownForServingGenerations: string;
  knownForHelpingEmergencies: string;

  // Photo
  photoTitle: string;
  photoHelp: string;
  photoTake: string;
  photoChoose: string;
  photoRetake: string;
  photoSkip: string;
  photoSkipConfirm: string;
  photoChecking: string;
  photoGood: string;
  photoErrTooSmall: string;
  photoErrTooDark: string;
  photoErrBlurry: string;
  photoErrTooBig: string;
  photoErrUnreadable: string;
  photoExampleGood: string;
  photoExampleBad: string;

  // Personalisation
  detailsTitle: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  pharmacyLabel: string;
  pharmacyPlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  stateLabel: string;
  mobileLabel: string;
  mobileHelp: string;
  mrCodeLabel: string;
  mrCodeHelp: string;

  // Validation
  errRequired: string;
  errTooLong: (max: number) => string;
  errMobileInvalid: string;
  errCityUnknown: string;

  // Consent
  consentTitle: string;
  consentPrimary: string;
  consentPublic: string;
  consentPrivacyLink: string;
  errConsentRequired: string;

  // Processing + result
  processingTitle: string;
  processingSub: string;
  processingQueued: (position: number) => string;
  resultTitle: string;
  resultSub: string;
  download: string;
  shareVideo: string;
  shareShort: string;
  shareHelp: string;
  startOver: string;
  renderFailedTitle: string;
  renderFailedSub: string;
  retryRender: string;

  // Resume
  resumeTitle: string;
  resumeBody: string;
  resumeContinue: string;
  resumeFresh: string;
}

const en: Strings = {
  landingHeadline: "Your year behind the counter, as a film.",
  landingSub:
    "Six quick questions and one photo. We turn your working life into numbers you have never seen — and a video you can keep.",
  landingCta: "Make my film",
  landingTime: "Takes about 2 minutes",
  chooseLanguage: "Choose your language",

  stepOf: (current, total) => `Step ${current} of ${total}`,
  back: "Back",
  next: "Next",
  submit: "Create my film",

  q1Title: "How many years have you worked as a pharmacist?",
  q1Help: "A rough number is fine.",
  q1Unit: "years",
  q2Title: "How many days a week is your pharmacy open for you?",
  q3Title: "How many hours do you spend at the pharmacy each day?",
  q3Unit: "hours",
  q4Title: "About how many people do you serve each day?",
  q4Help: "Your best estimate on a normal day.",
  q4Unit: "people",
  q5Title: "How many steps do you walk while working?",
  q5Help: "If you have never counted, that is fine — pick the last option.",
  q6Title: "What do your customers know you best for?",
  q6Help: "Pick the one that fits you most.",

  daysOption: (d) => `${d} days`,
  hoursOption: (h) => (h === 14 ? "14+ hours" : `${h} hours`),
  stepsUnder2000: "Less than 2,000",
  steps2000_3000: "2,000 – 3,000",
  steps3000_4000: "3,000 – 4,000",
  steps4000_5000: "4,000 – 5,000",
  stepsOver5000: "More than 5,000",
  stepsUnknown: "I don't know",
  knownForPatientGuidance: "Patient guidance",
  knownForAlwaysAvailable: "Always being available",
  knownForMedicineKnowledge: "Medicine knowledge",
  knownForFriendlyAdvice: "Friendly advice",
  knownForServingGenerations: "Serving generations",
  knownForHelpingEmergencies: "Helping in emergencies",

  photoTitle: "Add your photo",
  photoHelp:
    "Face the camera in good light. Just you in the picture — no one else.",
  photoTake: "Take a photo",
  photoChoose: "Choose from gallery",
  photoRetake: "Try another photo",
  photoSkip: "Continue without a photo",
  photoSkipConfirm:
    "We will make your film using your name and pharmacy instead of your photo. You can still download and share it.",
  photoChecking: "Checking your photo…",
  photoGood: "Looks good.",
  photoErrTooSmall:
    "This picture is too small to look sharp in a video. Please take a fresh photo with your camera.",
  photoErrTooDark:
    "This photo is too dark. Move somewhere brighter — near a window or outside — and try again.",
  photoErrBlurry:
    "This photo came out blurry. Hold the phone steady, wait for the camera to focus, then take it again.",
  photoErrTooBig:
    "This file is too large to handle on your connection. Please take a photo with your camera instead.",
  photoErrUnreadable:
    "We could not open this file. Please pick a normal photo (JPG or PNG).",
  photoExampleGood: "Good",
  photoExampleBad: "Not this",

  detailsTitle: "Last few details",
  fullNameLabel: "Your full name",
  fullNamePlaceholder: "As you want it shown in the film",
  pharmacyLabel: "Your pharmacy name",
  pharmacyPlaceholder: "e.g. Sharma Medical Store",
  cityLabel: "Your city",
  cityPlaceholder: "Start typing your city",
  stateLabel: "State",
  mobileLabel: "Mobile number (optional)",
  mobileHelp:
    "Only used to send you a WhatsApp copy of your film as a backup. You can leave this blank.",
  mrCodeLabel: "MR code (optional)",
  mrCodeHelp: "For Mankind field staff filling this in with a pharmacist.",

  errRequired: "Please fill this in.",
  errTooLong: (max) => `Please keep this under ${max} characters.`,
  errMobileInvalid: "Please enter a 10-digit Indian mobile number.",
  errCityUnknown: "Please pick your state as well, we could not detect it.",

  consentTitle: "One last thing",
  consentPrimary:
    "I agree that Mankind Pharma may use my photo and the details I have given to create my personalised video, and may use it in World Pharmacist Day communications.",
  consentPublic:
    "You may also feature my video publicly, on social media or in press.",
  consentPrivacyLink: "How we handle your data",
  errConsentRequired: "Please accept the first checkbox to continue.",

  processingTitle: "Building your film…",
  processingSub: "This takes about a minute. Please keep this page open.",
  processingQueued: (position) =>
    `You are number ${position} in the queue. Your film starts shortly.`,
  resultTitle: "Your film is ready.",
  resultSub: "Download it, then share it wherever you like.",
  download: "Download video",
  shareVideo: "Share full film",
  shareShort: "Share short version",
  shareHelp:
    "The short version fits WhatsApp Status and Instagram Stories, which only allow 30 seconds.",
  startOver: "Make another one",
  renderFailedTitle: "Something went wrong.",
  renderFailedSub:
    "Your details are saved. Please try building the film again.",
  retryRender: "Try again",

  resumeTitle: "Continue where you left off?",
  resumeBody: "We saved your answers on this phone.",
  resumeContinue: "Continue",
  resumeFresh: "Start fresh",
};

const hi: Strings = {
  landingHeadline: "काउंटर के पीछे बीता आपका सफ़र, एक फ़िल्म में।",
  landingSub:
    "छह छोटे सवाल और एक फ़ोटो। हम आपके काम को ऐसे आँकड़ों में बदलते हैं जो आपने पहले कभी नहीं देखे — और एक वीडियो जो आपका हो जाएगा।",
  landingCta: "मेरी फ़िल्म बनाएँ",
  landingTime: "लगभग 2 मिनट लगेंगे",
  chooseLanguage: "अपनी भाषा चुनें",

  stepOf: (current, total) => `चरण ${current} / ${total}`,
  back: "पीछे",
  next: "आगे",
  submit: "मेरी फ़िल्म बनाएँ",

  q1Title: "आप कितने वर्षों से फ़ार्मासिस्ट हैं?",
  q1Help: "अंदाज़ा भी ठीक है।",
  q1Unit: "वर्ष",
  q2Title: "आप सप्ताह में कितने दिन दुकान पर रहते हैं?",
  q3Title: "आप रोज़ कितने घंटे दुकान पर बिताते हैं?",
  q3Unit: "घंटे",
  q4Title: "आप रोज़ लगभग कितने लोगों की सेवा करते हैं?",
  q4Help: "आम दिन का अंदाज़ा बताएँ।",
  q4Unit: "लोग",
  q5Title: "काम के दौरान आप रोज़ कितने कदम चलते हैं?",
  q5Help: "अगर कभी गिना नहीं है, तो आख़िरी विकल्प चुनें।",
  q6Title: "आपके ग्राहक आपको सबसे ज़्यादा किस बात के लिए जानते हैं?",
  q6Help: "जो आप पर सबसे सही बैठे, वह चुनें।",

  daysOption: (d) => `${d} दिन`,
  hoursOption: (h) => (h === 14 ? "14+ घंटे" : `${h} घंटे`),
  stepsUnder2000: "2,000 से कम",
  steps2000_3000: "2,000 – 3,000",
  steps3000_4000: "3,000 – 4,000",
  steps4000_5000: "4,000 – 5,000",
  stepsOver5000: "5,000 से ज़्यादा",
  stepsUnknown: "मुझे नहीं पता",
  knownForPatientGuidance: "मरीज़ को सही सलाह",
  knownForAlwaysAvailable: "हमेशा उपलब्ध रहना",
  knownForMedicineKnowledge: "दवाओं की जानकारी",
  knownForFriendlyAdvice: "अपनापन भरी सलाह",
  knownForServingGenerations: "पीढ़ियों की सेवा",
  knownForHelpingEmergencies: "आपात स्थिति में मदद",

  photoTitle: "अपनी फ़ोटो लगाएँ",
  photoHelp:
    "अच्छी रोशनी में कैमरे की ओर देखें। फ़ोटो में सिर्फ़ आप हों, कोई और नहीं।",
  photoTake: "फ़ोटो लें",
  photoChoose: "गैलरी से चुनें",
  photoRetake: "दूसरी फ़ोटो लें",
  photoSkip: "फ़ोटो के बिना आगे बढ़ें",
  photoSkipConfirm:
    "हम आपकी फ़ोटो की जगह आपके नाम और दुकान के नाम से फ़िल्म बनाएँगे। आप उसे डाउनलोड और शेयर कर सकेंगे।",
  photoChecking: "आपकी फ़ोटो जाँची जा रही है…",
  photoGood: "बढ़िया है।",
  photoErrTooSmall:
    "यह फ़ोटो बहुत छोटी है, वीडियो में साफ़ नहीं दिखेगी। कृपया कैमरे से नई फ़ोटो लें।",
  photoErrTooDark:
    "यह फ़ोटो बहुत अंधेरी है। खिड़की के पास या बाहर जाकर दोबारा लें।",
  photoErrBlurry:
    "यह फ़ोटो धुंधली आई है। फ़ोन को स्थिर रखें, कैमरे को फ़ोकस होने दें, फिर दोबारा लें।",
  photoErrTooBig:
    "यह फ़ाइल बहुत बड़ी है। कृपया कैमरे से सीधे फ़ोटो लें।",
  photoErrUnreadable:
    "हम यह फ़ाइल नहीं खोल पाए। कृपया सामान्य फ़ोटो (JPG या PNG) चुनें।",
  photoExampleGood: "सही",
  photoExampleBad: "ऐसी नहीं",

  detailsTitle: "आख़िरी कुछ जानकारी",
  fullNameLabel: "आपका पूरा नाम",
  fullNamePlaceholder: "जैसा फ़िल्म में दिखाना चाहते हैं",
  pharmacyLabel: "आपकी दुकान का नाम",
  pharmacyPlaceholder: "जैसे शर्मा मेडिकल स्टोर",
  cityLabel: "आपका शहर",
  cityPlaceholder: "शहर का नाम लिखना शुरू करें",
  stateLabel: "राज्य",
  mobileLabel: "मोबाइल नंबर (ज़रूरी नहीं)",
  mobileHelp:
    "सिर्फ़ बैकअप के लिए, ताकि आपकी फ़िल्म व्हाट्सऐप पर भी भेज सकें। खाली छोड़ सकते हैं।",
  mrCodeLabel: "MR कोड (ज़रूरी नहीं)",
  mrCodeHelp: "मैनकाइंड के फ़ील्ड स्टाफ़ के लिए, जो फ़ार्मासिस्ट के साथ भर रहे हैं।",

  errRequired: "कृपया यह भरें।",
  errTooLong: (max) => `कृपया ${max} अक्षरों से कम रखें।`,
  errMobileInvalid: "कृपया 10 अंकों का मोबाइल नंबर डालें।",
  errCityUnknown: "कृपया राज्य भी चुनें, हम पहचान नहीं पाए।",

  consentTitle: "एक आख़िरी बात",
  consentPrimary:
    "मैं सहमत हूँ कि मैनकाइंड फार्मा मेरी फ़ोटो और दी गई जानकारी से मेरा वीडियो बना सकता है, और उसे वर्ल्ड फार्मासिस्ट डे के संदेशों में उपयोग कर सकता है।",
  consentPublic:
    "आप मेरा वीडियो सोशल मीडिया या प्रेस में सार्वजनिक रूप से दिखा सकते हैं।",
  consentPrivacyLink: "हम आपके डेटा का क्या करते हैं",
  errConsentRequired: "आगे बढ़ने के लिए कृपया पहला बॉक्स स्वीकार करें।",

  processingTitle: "आपकी फ़िल्म बन रही है…",
  processingSub: "इसमें लगभग एक मिनट लगेगा। कृपया यह पेज खुला रखें।",
  processingQueued: (position) =>
    `आप कतार में ${position} नंबर पर हैं। आपकी फ़िल्म जल्दी शुरू होगी।`,
  resultTitle: "आपकी फ़िल्म तैयार है।",
  resultSub: "इसे डाउनलोड करें, और जहाँ चाहें शेयर करें।",
  download: "वीडियो डाउनलोड करें",
  shareVideo: "पूरी फ़िल्म शेयर करें",
  shareShort: "छोटा वर्ज़न शेयर करें",
  shareHelp:
    "छोटा वर्ज़न व्हाट्सऐप स्टेटस और इंस्टाग्राम स्टोरीज़ के लिए है, जिनमें सिर्फ़ 30 सेकंड चलते हैं।",
  startOver: "एक और बनाएँ",
  renderFailedTitle: "कुछ गड़बड़ हो गई।",
  renderFailedSub: "आपकी जानकारी सुरक्षित है। कृपया फ़िल्म दोबारा बनाने की कोशिश करें।",
  retryRender: "दोबारा कोशिश करें",

  resumeTitle: "जहाँ छोड़ा था, वहीं से जारी रखें?",
  resumeBody: "हमने आपके जवाब इस फ़ोन पर सहेज लिए हैं।",
  resumeContinue: "जारी रखें",
  resumeFresh: "नए सिरे से शुरू करें",
};

export const strings: Record<Language, Strings> = { en, hi };

export function getStrings(lang: Language): Strings {
  return strings[lang] ?? strings.en;
}
