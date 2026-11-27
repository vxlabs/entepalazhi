import type { Locale } from "@/lib/i18n/config";

/**
 * Olavanna Grama Panchayat resident directory, shown on the home page.
 *
 * Static on purpose: a list in code needs no migration or admin screen. To
 * change a number, edit it here, update DIRECTORY_AS_OF and redeploy.
 *
 * Rules (see the project CLAUDE.md):
 *  - every entry comes from a published source listed in SOURCES;
 *  - an unknown value is `null` and renders as "Not known", never a guess;
 *  - people appear as contact rows only: ward, name, number. No commentary.
 *
 * Names of people, wards, offices and portals are kept in English in both
 * locales, exactly as published. Descriptive text is bilingual.
 */
export const DIRECTORY_AS_OF = "2026-11-20";

export type L = { en: string; ml: string };

export function tx(value: L | string, locale: Locale): string {
  return typeof value === "string" ? value : value[locale];
}

/** Digits only, for tel: links ("0495 2437300" -> "04952437300"). */
export function telHref(display: string): string {
  return `tel:${display.replace(/\s+/g, "")}`;
}

export type ContactLabel =
  | "landline"
  | "mobile"
  | "email"
  | "phone"
  | "helpline"
  | "whatsapp"
  | "station"
  | "ambulance"
  | "emergency"
  | "secretary";

export type ContactRow =
  | { kind: "phone"; label: ContactLabel; value: string }
  | { kind: "email"; label: ContactLabel; value: string }
  | { kind: "text"; label: ContactLabel; value: string };

export type ContactPanelData = {
  chip?: L;
  title: L | string;
  meta?: L;
  rows: ContactRow[];
  note?: L;
  link?: { label: L; url: string };
};

// ---------------------------------------------------------------- overview

export const OVERVIEW_STATS: { label: L; value: L | string; sub: L }[] = [
  {
    label: { en: "Current wards", ml: "നിലവിലെ വാർഡുകൾ" },
    value: "24",
    sub: { en: "Council term 2025–2030", ml: "ഭരണസമിതി കാലാവധി 2025–2030" },
  },
  {
    label: { en: "Population", ml: "ജനസംഖ്യ" },
    value: "68,432",
    sub: { en: "2011 Census, not a current estimate", ml: "2011 സെൻസസ്; ഇപ്പോഴത്തെ കണക്കല്ല" },
  },
  {
    label: { en: "Area", ml: "വിസ്തീർണ്ണം" },
    value: "21.43 km²",
    sub: { en: "Reported area", ml: "രേഖപ്പെടുത്തിയ വിസ്തീർണ്ണം" },
  },
  {
    label: { en: "Revenue villages", ml: "റവന്യൂ വില്ലേജുകൾ" },
    value: "2",
    sub: { en: "Olavanna & Pantheerankavu", ml: "Olavanna, Pantheerankavu" },
  },
];

export const WARD_CHANGE_NOTE: L = {
  en: "Ward changes: some older directories still show 23 wards. The current Panchayat website lists 24. Revised building numbers were published on 31 October 2026 after delimitation; use the updated door number for related services.",
  ml: "വാർഡ് മാറ്റം: ചില പഴയ പട്ടികകളിൽ ഇപ്പോഴും 23 വാർഡുകളാണ് കാണുന്നത്. പഞ്ചായത്തിന്റെ നിലവിലെ വെബ്സൈറ്റിൽ 24 വാർഡുകളുണ്ട്. വാർഡ് പുനർനിർണയത്തിന് ശേഷം പുതുക്കിയ കെട്ടിട നമ്പറുകൾ 2026 ഒക്ടോബർ 31-ന് പ്രസിദ്ധീകരിച്ചു; ബന്ധപ്പെട്ട സേവനങ്ങൾക്ക് പുതിയ വീട്ടുനമ്പർ ഉപയോഗിക്കുക.",
};

// -------------------------------------------------------------- leadership

export const LEADERS: {
  role: L;
  name: string;
  meta: L;
  phone: string | null;
  email?: string;
}[] = [
  {
    role: { en: "Panchayat president", ml: "പഞ്ചായത്ത് പ്രസിഡന്റ്" },
    name: "Sulin M S",
    meta: { en: "Ward 14 · Kodinattumukku", ml: "വാർഡ് 14 · Kodinattumukku" },
    phone: "8907008876",
    email: "sulinmannarakkal@gmail.com",
  },
  {
    role: { en: "Vice president", ml: "വൈസ് പ്രസിഡന്റ്" },
    name: "Rajitha N P",
    meta: {
      en: "Ward 23 · Mathara · Finance Standing Committee",
      ml: "വാർഡ് 23 · Mathara · ധനകാര്യ സ്ഥിരം സമിതി",
    },
    phone: "9497644550",
  },
  {
    role: { en: "Panchayat secretary", ml: "പഞ്ചായത്ത് സെക്രട്ടറി" },
    name: "Jayakrishnan S",
    meta: { en: "Contact through the Panchayat office", ml: "പഞ്ചായത്ത് ഓഫീസ് വഴി ബന്ധപ്പെടുക" },
    phone: null,
  },
];

export const COMMITTEES: { committee: L; chair: string; phone: string }[] = [
  { committee: { en: "Finance / Vice President", ml: "ധനകാര്യം / വൈസ് പ്രസിഡന്റ്" }, chair: "Rajitha N P", phone: "9497644550" },
  { committee: { en: "Development", ml: "വികസനം" }, chair: "V Vijayan Valappil", phone: "7306799979" },
  { committee: { en: "Health & Education", ml: "ആരോഗ്യം, വിദ്യാഭ്യാസം" }, chair: "Pilakkunnath Jayasree", phone: "9745457930" },
  { committee: { en: "Welfare", ml: "ക്ഷേമം" }, chair: "Ramachandran Melampurath", phone: "9995917361" },
];

// ------------------------------------------------------------------- wards

/** `ml` is a transliteration of the English name on the Panchayat's member
 * list, not taken from an official Malayalam source - check before relying
 * on it anywhere beyond the report form's ward picker. */
export type Ward = { no: number; name: string; ml: string; member: string; phone: string };

export const WARDS: Ward[] = [
  { no: 1, name: "Iringallur", ml: "ഇരിങ്ങല്ലൂർ", member: "Sudheesh P", phone: "9048636365" },
  { no: 2, name: "Palazhi Pala", ml: "പാലാഴി പാല", member: "Ramseena T M", phone: "9645467208" },
  { no: 3, name: "Palazhi Pala East", ml: "പാലാഴി പാല ഈസ്റ്റ്", member: "Rema M", phone: "9846464510" },
  { no: 4, name: "Palazhi West", ml: "പാലാഴി വെസ്റ്റ്", member: "Muneefa Teacher", phone: "8714306021" },
  { no: 5, name: "Palazhi East", ml: "പാലാഴി ഈസ്റ്റ്", member: "K P Jayalakshmi", phone: "9895082907" },
  { no: 6, name: "Pantheerankave North", ml: "പന്തീരാങ്കാവ് നോർത്ത്", member: "Muraleedharan N", phone: "9387426792" },
  { no: 7, name: "Pantheerankave South", ml: "പന്തീരാങ്കാവ് സൗത്ത്", member: "Lijina M P", phone: "9048689104" },
  { no: 8, name: "Poolenkara", ml: "പൂളേങ്കര", member: "Anitha Shaji", phone: "9562739576" },
  { no: 9, name: "Muthuvanathara", ml: "മുതുവനത്തറ", member: "Pilakkunnath Jayasree", phone: "9745457930" },
  { no: 10, name: "Manakkadave", ml: "മണക്കടവ്", member: "P Mini", phone: "9847530163" },
  { no: 11, name: "Kodal Nadakkave", ml: "കോടൽ നടക്കാവ്", member: "Aneesh T P", phone: "9946124251" },
  { no: 12, name: "Moorkkanad", ml: "മൂർക്കനാട്", member: "Raseena P M", phone: "8086296349" },
  { no: 13, name: "Chathothara", ml: "ചാത്തോത്തറ", member: "Ramachandran Melampurath", phone: "9995917361" },
  { no: 14, name: "Kodinattumukku", ml: "കൊടിനാട്ടുമുക്ക്", member: "Sulin M S", phone: "8907008876" },
  { no: 15, name: "Palakurumba", ml: "പാലക്കുറുമ്പ", member: "C Jageesh", phone: "9846278405" },
  { no: 16, name: "Olavanna", ml: "ഒളവണ്ണ", member: "Abdul Mujeeb T", phone: "9846166775" },
  { no: 17, name: "Thondilakkadave", ml: "തൊണ്ടിലക്കടവ്", member: "Muhammed Nasik", phone: "9961111417" },
  { no: 18, name: "Kayatti", ml: "കയറ്റി", member: "V Vijayan Valappil", phone: "7306799979" },
  { no: 19, name: "Odumbra", ml: "ഒടുമ്പ്ര", member: "Thaikkandi Prasanna", phone: "8089296150" },
  { no: 20, name: "Kambiliparambu", ml: "കമ്പിളിപ്പറമ്പ്", member: "P M Souda", phone: "9747338141" },
  { no: 21, name: "Kunnathupalam", ml: "കുന്നത്തുപാലം", member: "T P M Sadikh", phone: "8089147709" },
  { no: 22, name: "M.G. Nagar", ml: "എം.ജി. നഗർ", member: "K P Faisal", phone: "9747891459" },
  { no: 23, name: "Mathara", ml: "മാത്തറ", member: "Rajitha N P", phone: "9497644550" },
  { no: 24, name: "Konthanari", ml: "കൊന്തനാരി", member: "K Sunil", phone: "9496165061" },
];

export const WARDS_SOURCE_URL = "https://olavannapanchayat.lsgkerala.gov.in/en/members-list";

const WARD_BY_NO = new Map(WARDS.map((w) => [w.no, w]));

/** The ward an issue is tagged with (projects.ward_no), with its current
 * member. Undefined for an untagged issue or a number no longer listed. */
export function getWard(no: number | null | undefined): Ward | undefined {
  return no == null ? undefined : WARD_BY_NO.get(no);
}

// --------------------------------------------------------------- emergency

export const EMERGENCY: { number: string; label: L; note: L }[] = [
  {
    number: "112",
    label: { en: "All emergencies", ml: "എല്ലാ അടിയന്തര സാഹചര്യങ്ങൾക്കും" },
    note: { en: "Police, fire or ambulance when help is needed now", ml: "ഉടൻ സഹായം വേണ്ടപ്പോൾ പോലീസ്, ഫയർഫോഴ്സ്, ആംബുലൻസ്" },
  },
  {
    number: "108",
    label: { en: "Ambulance", ml: "ആംബുലൻസ്" },
    note: { en: "Medical emergency response", ml: "അടിയന്തര വൈദ്യസഹായം" },
  },
  {
    number: "101",
    label: { en: "Fire & Rescue", ml: "ഫയർ & റെസ്ക്യൂ" },
    note: { en: "National fire emergency line", ml: "തീപിടിത്തത്തിനുള്ള ദേശീയ നമ്പർ" },
  },
  {
    number: "1912",
    label: { en: "KSEB power", ml: "KSEB വൈദ്യുതി" },
    note: { en: "Power outage and electrical complaints", ml: "വൈദ്യുതി മുടക്കവും വൈദ്യുതി സംബന്ധമായ പരാതികളും" },
  },
  {
    number: "1916",
    label: { en: "Water supply", ml: "കുടിവെള്ളം" },
    note: { en: "Kerala Water Authority complaints", ml: "കേരള വാട്ടർ അതോറിറ്റി പരാതികൾ" },
  },
  {
    number: "1077",
    label: { en: "Disaster control", ml: "ദുരന്ത നിവാരണം" },
    note: { en: "District disaster management helpline", ml: "ജില്ലാ ദുരന്ത നിവാരണ ഹെൽപ്പ്‌ലൈൻ" },
  },
];

export const HELPLINES: { number: string; label: L }[] = [
  { number: "181", label: { en: "Women's helpline", ml: "വനിതാ ഹെൽപ്പ്‌ലൈൻ" } },
  { number: "1098", label: { en: "Child helpline", ml: "ചൈൽഡ് ഹെൽപ്പ്‌ലൈൻ" } },
  { number: "1930", label: { en: "Cyber-financial fraud", ml: "സൈബർ സാമ്പത്തിക തട്ടിപ്പ്" } },
];

// ------------------------------------------------------------------ police

export const POLICE: ContactPanelData[] = [
  {
    title: "Pantheerankavu Police Station",
    meta: {
      en: "Near SIDCO Tool & Die Training Centre, Kodal Nadakkavu, Kozhikode",
      ml: "SIDCO Tool & Die Training Centre-ന് സമീപം, Kodal Nadakkavu, Kozhikode",
    },
    rows: [
      { kind: "phone", label: "landline", value: "0495 2437300" },
      { kind: "phone", label: "mobile", value: "9497947287" },
      { kind: "email", label: "email", value: "shopkavukkd.pol@kerala.gov.in" },
    ],
  },
  {
    title: "Nallalam Police Station",
    meta: {
      en: "Near Areekkad, National Highway, Kozhikode",
      ml: "Areekkad-ന് സമീപം, ദേശീയപാത, Kozhikode",
    },
    rows: [
      { kind: "phone", label: "landline", value: "0495 2420643" },
      { kind: "phone", label: "mobile", value: "9497987179" },
      { kind: "email", label: "email", value: "shonallmkkd.pol@kerala.gov.in" },
    ],
  },
];

// ------------------------------------------------------------- electricity

export const KSEB_SECTIONS: { section: string; landline: string | null; mobile: string | null }[] = [
  { section: "Pantheerankavu", landline: "0495 2430200", mobile: "9496010784" },
  { section: "Mankavu", landline: "0495 2332662", mobile: "9496010780" },
  { section: "Areekkad", landline: null, mobile: "9496012305" },
];

export const KSEB_WHATSAPP = "9496001912";

// ---------------------------------------------------------------- panchayat

export const PANCHAYAT_WEBSITE_URL = "https://olavannapanchayat.lsgkerala.gov.in/en";

export const PANCHAYAT_OFFICE: ContactPanelData = {
  chip: { en: "Main Panchayat office", ml: "പ്രധാന പഞ്ചായത്ത് ഓഫീസ്" },
  title: "Olavanna Grama Panchayat",
  meta: {
    en: "Olavanna, Kozhikode, Kerala. See the official website for the current office location and hours.",
    ml: "Olavanna, Kozhikode, Kerala. ഓഫീസിന്റെ ഇപ്പോഴത്തെ സ്ഥലവും പ്രവർത്തന സമയവും ഔദ്യോഗിക വെബ്സൈറ്റിൽ നോക്കുക.",
  },
  rows: [
    { kind: "phone", label: "phone", value: "0495 2430788" },
    { kind: "email", label: "email", value: "olavannagp@gmail.com" },
    { kind: "text", label: "secretary", value: "Jayakrishnan S" },
  ],
  link: {
    label: { en: "Official Panchayat website", ml: "പഞ്ചായത്തിന്റെ ഔദ്യോഗിക വെബ്സൈറ്റ്" },
    url: PANCHAYAT_WEBSITE_URL,
  },
};

export const DEPARTMENTS: { name: string; email: string }[] = [
  { name: "LSGD Assistant Engineer", email: "aelsgdolavannagp@gmail.com" },
  { name: "Krishi Bhavan", email: "olavannakbkzd@gmail.com" },
  { name: "Veterinary Dispensary", email: "vd.olavanna@kerala.gov.in" },
];

// ------------------------------------------------------- water, health, fire

export const WATER_HEALTH: ContactPanelData[] = [
  {
    title: "Kerala Water Authority",
    rows: [
      { kind: "phone", label: "helpline", value: "1916" },
      { kind: "phone", label: "whatsapp", value: "9495998258" },
    ],
    note: {
      en: "For water-supply complaints. Photos and videos help when reporting a leak.",
      ml: "കുടിവെള്ള വിതരണ പരാതികൾക്ക്. ചോർച്ച അറിയിക്കുമ്പോൾ ഫോട്ടോയും വീഡിയോയും ഉപകരിക്കും.",
    },
    link: {
      label: { en: "KWA online complaints", ml: "KWA ഓൺലൈൻ പരാതി" },
      url: "https://aqualoomnew.kwa.kerala.gov.in/",
    },
  },
  {
    title: "CHC Olavanna",
    meta: {
      en: "Community Health Centre · Kodal Nadakkave / Pantheerankavu area, PIN 673019",
      ml: "സാമൂഹികാരോഗ്യ കേന്ദ്രം · Kodal Nadakkave / Pantheerankavu ഭാഗം, പിൻ 673019",
    },
    rows: [
      { kind: "phone", label: "phone", value: "0495 2430074" },
      { kind: "email", label: "email", value: "chcolavanna@gmail.com" },
    ],
    note: {
      en: "Phone number from a 2024–25 directory. Call before a non-emergency visit.",
      ml: "ഫോൺ നമ്പർ 2024–25-ലെ ഒരു ഡയറക്ടറിയിൽ നിന്നുള്ളതാണ്. അടിയന്തരമല്ലാത്ത സന്ദർശനത്തിന് മുമ്പ് വിളിച്ച് ഉറപ്പാക്കുക.",
    },
  },
  {
    title: "Meenchanda Fire & Rescue Station",
    rows: [{ kind: "phone", label: "station", value: "0495 2321654" }],
    note: {
      en: "For an active fire or immediate emergency, call 101 or 112.",
      ml: "തീപിടിത്തമോ അടിയന്തര സാഹചര്യമോ ഉണ്ടെങ്കിൽ 101 അല്ലെങ്കിൽ 112 വിളിക്കുക.",
    },
  },
  {
    title: { en: "Medical emergency", ml: "അടിയന്തര വൈദ്യസഹായം" },
    rows: [
      { kind: "phone", label: "ambulance", value: "108" },
      { kind: "phone", label: "emergency", value: "112" },
    ],
    note: {
      en: "Use emergency lines for urgent medical situations, not appointment enquiries.",
      ml: "അടിയന്തര വൈദ്യസഹായത്തിന് മാത്രം ഈ നമ്പറുകൾ ഉപയോഗിക്കുക; അപ്പോയിന്റ്മെന്റ് അന്വേഷണങ്ങൾക്കല്ല.",
    },
  },
];

// ---------------------------------------------------------- village offices

export const VILLAGE_OFFICES: ContactPanelData[] = [
  {
    chip: { en: "Village Office 01", ml: "വില്ലേജ് ഓഫീസ് 01" },
    title: "Olavanna Village Office",
    meta: {
      en: "Kunnathupalam, near Olavanna Krishi Bhavan / Guruvayurappan College",
      ml: "Kunnathupalam; Olavanna Krishi Bhavan / Guruvayurappan College-ന് സമീപം",
    },
    rows: [
      { kind: "phone", label: "phone", value: "8547616122" },
      { kind: "email", label: "email", value: "VO-olavanna.rev@kerala.gov.in" },
    ],
  },
  {
    chip: { en: "Village Office 02", ml: "വില്ലേജ് ഓഫീസ് 02" },
    title: "Pantheerankavu Village Office",
    meta: {
      en: "Near Arapuzha Bridge, Pantheerankavu",
      ml: "Arapuzha Bridge-ന് സമീപം, Pantheerankavu",
    },
    rows: [
      { kind: "phone", label: "phone", value: "8547616124" },
      { kind: "email", label: "email", value: "VO-pantheerankavu.rev@kerala.gov.in" },
    ],
  },
];

// ----------------------------------------------------------- online portals

export const PORTALS: { need: L; name: string; url: string }[] = [
  {
    need: { en: "Birth, death and marriage certificates", ml: "ജനന, മരണ, വിവാഹ സർട്ടിഫിക്കറ്റുകൾ" },
    name: "K-SMART",
    url: "https://ksmart.lsgkerala.gov.in/ui/web-portal",
  },
  {
    need: { en: "Building permits, property tax, trade licence", ml: "കെട്ടിട നിർമാണ അനുമതി, വസ്തു നികുതി, വ്യാപാര ലൈസൻസ്" },
    name: "K-SMART services",
    url: "https://ksmart.lsgkerala.gov.in/ui/web-portal/services/",
  },
  {
    need: { en: "Check a revised building or door number", ml: "പുതുക്കിയ കെട്ടിട / വീട്ടുനമ്പർ പരിശോധിക്കാൻ" },
    name: "Know Your Door Number",
    url: "https://ksmart.lsgkerala.gov.in/ui/property-tax/know-your-door-number/citizen",
  },
  {
    need: { en: "Land tax and land records", ml: "ഭൂനികുതിയും ഭൂരേഖകളും" },
    name: "Kerala Revenue Portal",
    url: "https://revenue.kerala.gov.in/",
  },
  {
    need: { en: "Income, caste, nativity, possession certificates", ml: "വരുമാന, ജാതി, നേറ്റിവിറ്റി, കൈവശ സർട്ടിഫിക്കറ്റുകൾ" },
    name: "e-District Kerala",
    url: "https://edistrict.kerala.gov.in/",
  },
  {
    need: { en: "Welfare pension information", ml: "ക്ഷേമ പെൻഷൻ വിവരങ്ങൾ" },
    name: "Welfare Pension Portal",
    url: "https://welfarepension.lsgkerala.gov.in/",
  },
  {
    need: { en: "Electricity bill payment and services", ml: "വൈദ്യുതി ബിൽ അടയ്ക്കാനും മറ്റ് സേവനങ്ങൾക്കും" },
    name: "KSEB",
    url: "https://www.kseb.in/",
  },
  {
    need: { en: "Water bill payment", ml: "വെള്ളക്കരം അടയ്ക്കാൻ" },
    name: "KWA Quick Pay",
    url: "https://epay.kwa.kerala.gov.in/",
  },
  {
    need: { en: "Water supply complaints", ml: "കുടിവെള്ള വിതരണ പരാതികൾ" },
    name: "KWA Aqualoom",
    url: "https://aqualoomnew.kwa.kerala.gov.in/",
  },
  {
    need: { en: "Cybercrime reporting", ml: "സൈബർ കുറ്റകൃത്യം റിപ്പോർട്ട് ചെയ്യാൻ" },
    name: "National Cybercrime Portal",
    url: "https://cybercrime.gov.in/",
  },
];

// ------------------------------------------------------------ problem guide

export const PROBLEM_GUIDE: { issue: L; contact: L }[] = [
  {
    issue: { en: "Broken local road, blocked drain, streetlight issue", ml: "തകർന്ന റോഡ്, അടഞ്ഞ ഓട, തെരുവുവിളക്ക് പ്രശ്നം" },
    contact: { en: "Ward member; Panchayat office / LSGD engineering section", ml: "വാർഡ് മെമ്പർ; പഞ്ചായത്ത് ഓഫീസ് / LSGD എഞ്ചിനീയറിംഗ് വിഭാഗം" },
  },
  {
    issue: { en: "Garbage collection or illegal dumping", ml: "മാലിന്യ ശേഖരണം, അനധികൃതമായി മാലിന്യം തള്ളൽ" },
    contact: { en: "Ward member; Panchayat sanitation team / Haritha Karma Sena", ml: "വാർഡ് മെമ്പർ; പഞ്ചായത്ത് ശുചിത്വ വിഭാഗം / ഹരിത കർമ്മ സേന" },
  },
  {
    issue: { en: "Property tax, house number, trade licence", ml: "വസ്തു നികുതി, വീട്ടുനമ്പർ, വ്യാപാര ലൈസൻസ്" },
    contact: { en: "Panchayat office / K-SMART", ml: "പഞ്ചായത്ത് ഓഫീസ് / K-SMART" },
  },
  {
    issue: { en: "Building permit or local public works", ml: "കെട്ടിട നിർമാണ അനുമതി, പ്രാദേശിക പൊതുമരാമത്ത് പണികൾ" },
    contact: { en: "Panchayat office / LSGD Assistant Engineer", ml: "പഞ്ചായത്ത് ഓഫീസ് / LSGD അസിസ്റ്റന്റ് എഞ്ചിനീയർ" },
  },
  {
    issue: { en: "Power cut, faulty transformer or electric line", ml: "വൈദ്യുതി മുടക്കം, ട്രാൻസ്ഫോർമർ അല്ലെങ്കിൽ ലൈൻ തകരാർ" },
    contact: { en: "KSEB 1912 / your electrical section", ml: "KSEB 1912 / നിങ്ങളുടെ ഇലക്ട്രിക്കൽ സെക്ഷൻ" },
  },
  {
    issue: { en: "Water shortage or pipeline leakage", ml: "വെള്ളം കിട്ടാതിരിക്കൽ, പൈപ്പ് ചോർച്ച" },
    contact: { en: "KWA 1916", ml: "KWA 1916" },
  },
  {
    issue: { en: "Land tax or possession certificate", ml: "ഭൂനികുതി, കൈവശ സർട്ടിഫിക്കറ്റ്" },
    contact: { en: "The relevant village office", ml: "ബന്ധപ്പെട്ട വില്ലേജ് ഓഫീസ്" },
  },
  {
    issue: { en: "Welfare pension or local assistance schemes", ml: "ക്ഷേമ പെൻഷൻ, പ്രാദേശിക സഹായ പദ്ധതികൾ" },
    contact: { en: "Ward member / Panchayat welfare section", ml: "വാർഡ് മെമ്പർ / പഞ്ചായത്ത് ക്ഷേമ വിഭാഗം" },
  },
  {
    issue: { en: "Vaccination or public-health enquiry", ml: "വാക്സിനേഷൻ, പൊതുജനാരോഗ്യ അന്വേഷണങ്ങൾ" },
    contact: { en: "CHC Olavanna", ml: "CHC Olavanna" },
  },
  {
    issue: { en: "Theft, threats or public safety", ml: "മോഷണം, ഭീഷണി, പൊതു സുരക്ഷ" },
    contact: { en: "Police station / 112 in an emergency", ml: "പോലീസ് സ്റ്റേഷൻ / അടിയന്തര ഘട്ടത്തിൽ 112" },
  },
];

// ------------------------------------------------------ caveats and sources

export const CAVEATS: { title: L; body: L }[] = [
  {
    title: { en: "2025 ward boundary maps", ml: "2025-ലെ വാർഡ് അതിർത്തി മാപ്പുകൾ" },
    body: { en: "Street-by-street boundaries were not fully verified.", ml: "ഓരോ റോഡും തിരിച്ചുള്ള അതിർത്തികൾ പൂർണമായി സ്ഥിരീകരിച്ചിട്ടില്ല." },
  },
  {
    title: { en: "Police jurisdiction", ml: "പോലീസ് സ്റ്റേഷൻ പരിധി" },
    body: { en: "Some older lists may refer to pre-2025 ward numbers.", ml: "ചില പഴയ പട്ടികകളിൽ 2025-ന് മുമ്പുള്ള വാർഡ് നമ്പറുകളാകാം." },
  },
  {
    title: { en: "KSEB service coverage", ml: "KSEB സെക്ഷൻ പരിധി" },
    body: { en: "Find your assigned section on the household electricity bill.", ml: "നിങ്ങളുടെ സെക്ഷൻ ഏതെന്ന് വീട്ടിലെ വൈദ്യുതി ബില്ലിൽ നോക്കുക." },
  },
  {
    title: { en: "Street-level workers", ml: "താഴേത്തട്ടിലെ പ്രവർത്തകർ" },
    body: {
      en: "ASHA workers, Anganwadis, Haritha Karma Sena teams, Akshaya centres and water-supply field staff are not mapped here.",
      ml: "ആശാ പ്രവർത്തകർ, അങ്കണവാടികൾ, ഹരിത കർമ്മ സേന, അക്ഷയ കേന്ദ്രങ്ങൾ, വാട്ടർ അതോറിറ്റി ഫീൽഡ് ജീവനക്കാർ എന്നിവരുടെ വിവരങ്ങൾ ഇവിടെ ചേർത്തിട്ടില്ല.",
    },
  },
  {
    title: { en: "Staff phone changes", ml: "ഉദ്യോഗസ്ഥരുടെ ഫോൺ നമ്പർ മാറ്റം" },
    body: {
      en: "Reconfirm non-emergency contacts in official government directories before relying on them.",
      ml: "അടിയന്തരമല്ലാത്ത നമ്പറുകൾ ആശ്രയിക്കുന്നതിന് മുമ്പ് ഔദ്യോഗിക സർക്കാർ ഡയറക്ടറികളിൽ ഒന്നുകൂടി ഉറപ്പാക്കുക.",
    },
  },
];

export const SOURCES: { label: L; url: string }[] = [
  {
    label: { en: "Olavanna Panchayat: ward members (official)", ml: "ഒളവണ്ണ പഞ്ചായത്ത്: വാർഡ് അംഗങ്ങൾ (ഔദ്യോഗികം)" },
    url: WARDS_SOURCE_URL,
  },
  {
    label: { en: "Olavanna Grama Panchayat: official website, notices, contacts", ml: "ഒളവണ്ണ ഗ്രാമപഞ്ചായത്ത്: ഔദ്യോഗിക വെബ്സൈറ്റ്, അറിയിപ്പുകൾ, വിലാസങ്ങൾ" },
    url: PANCHAYAT_WEBSITE_URL,
  },
  {
    label: { en: "Kerala K-SMART citizen services", ml: "K-SMART പൗര സേവനങ്ങൾ" },
    url: "https://ksmart.lsgkerala.gov.in/ui/web-portal",
  },
  {
    label: { en: "Kerala Revenue Department", ml: "കേരള റവന്യൂ വകുപ്പ്" },
    url: "https://revenue.kerala.gov.in/",
  },
  {
    label: { en: "Kerala e-District services", ml: "e-District Kerala സേവനങ്ങൾ" },
    url: "https://edistrict.kerala.gov.in/",
  },
  {
    label: { en: "Kerala State Electricity Board", ml: "കേരള സ്റ്റേറ്റ് ഇലക്ട്രിസിറ്റി ബോർഡ് (KSEB)" },
    url: "https://www.kseb.in/",
  },
  {
    label: { en: "Kerala Water Authority complaint portal", ml: "കേരള വാട്ടർ അതോറിറ്റി പരാതി പോർട്ടൽ" },
    url: "https://aqualoomnew.kwa.kerala.gov.in/",
  },
  {
    label: { en: "National Cyber Crime Reporting Portal", ml: "ദേശീയ സൈബർ ക്രൈം റിപ്പോർട്ടിംഗ് പോർട്ടൽ" },
    url: "https://cybercrime.gov.in/",
  },
];
