"use client";

import { useState } from "react";
import TextInput from "@/components/TextInput";

type LookupOption = { id: string; name: string };
type CountryOption = LookupOption & { countryCode: string | null };

type CustomerProfile = {
  id: string;
  name: string | null;
  mobile: string | null;
  whatsappNumber: string | null;
  email: string | null;
  idCardType: string | null;
  idCardNumber: string | null;
  address: string | null;
  zipcode: string | null;
  stateId: string | null;
  cityId: string | null;
  countryId: string | null;
  countryCode: string | null;
  nationalityId: string | null;
  dateOfBirth: string | null;
  documentIssuingCountryId: string | null;
  language: string | null;
  alternateContactNumber: string | null;
  contactViaWhatsapp: boolean;
  contactViaSms: boolean;
  contactViaCall: boolean;
  contactViaEmail: boolean;
  preferredJewelryId: string | null;
  preferredKaratId: string | null;
  preferredStyleId: string | null;
  ringSize: number | null;
  bangleSize: number | null;
  customerTypeId: string | null;
  customerGradeId: string | null;
  personaId: string | null;
  leadSourceId: string | null;
  totalReferrals: number | null;
  familyMilestone: number | null;
  advocacyScore: number | null;
  consentService: boolean;
  consentMarketing: boolean;
  preferredBranchId: string | null;
  goldRateAlert: boolean;
  goldRateAlertMode: string | null;
  weeklyNotificationMail: boolean;
  anniversaryDate: string;
  spouseName: string | null;
  genderId: string | null;
  maritalStatusId: string | null;
};

type FamilyMember = {
  id: string;
  name: string;
  relationshipId: string;
  dateOfBirth: string;
  anniversaryDate: string;
  mobile: string;
  email: string;
};

type Lookups = {
  divisions: LookupOption[];
  karats: LookupOption[];
  genders: LookupOption[];
  maritalStatuses: LookupOption[];
  relationships: LookupOption[];
  styles: LookupOption[];
  customerTypes: LookupOption[];
  customerGrades: LookupOption[];
  personas: LookupOption[];
  leadSources: LookupOption[];
  branches: LookupOption[];
};

const MAX_FAMILY_MEMBERS = 6;
const ALERT_MODES = [
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
];

const ID_TYPES = ["Passport", "Iqama", "Resident ID", "Emirates ID"];
// The full ISO 639-1 language list, with the languages Sona's customers
// most commonly use (expat communities in Saudi Arabia) pinned to the top
// in their own native script, followed by every other language
// alphabetically by English name. `pos_customer.language` is a plain text
// column with no lookup table behind it, so any code can still be stored
// freely — this list is just for a friendly picker.
const COMMON_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic (العربية)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "ml", label: "Malayalam (മലയാളം)" },
  { code: "ta", label: "Tamil (தமிழ்)" },
  { code: "te", label: "Telugu (తెలుగు)" },
  { code: "ur", label: "Urdu (اردو)" },
  { code: "bn", label: "Bengali (বাংলা)" },
  { code: "tl", label: "Filipino (Tagalog)" },
  { code: "ne", label: "Nepali (नेपाली)" },
  { code: "si", label: "Sinhala (සිංහල)" },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "id", label: "Indonesian" },
  { code: "ps", label: "Pashto (پښتو)" },
  { code: "fa", label: "Persian (فارسی)" },
];

const ALL_OTHER_LANGUAGES = [
  { code: "ab", label: "Abkhazian (Аҧсуа)" },
  { code: "aa", label: "Afar (Afaraf)" },
  { code: "af", label: "Afrikaans" },
  { code: "ak", label: "Akan" },
  { code: "sq", label: "Albanian (Shqip)" },
  { code: "am", label: "Amharic (አማርኛ)" },
  { code: "an", label: "Aragonese (Aragonés)" },
  { code: "hy", label: "Armenian (Հայերեն)" },
  { code: "as", label: "Assamese (অসমীয়া)" },
  { code: "av", label: "Avaric (Авар мацӀ)" },
  { code: "ae", label: "Avestan" },
  { code: "ay", label: "Aymara (Aymar aru)" },
  { code: "az", label: "Azerbaijani (Azərbaycan)" },
  { code: "bm", label: "Bambara (Bamanankan)" },
  { code: "ba", label: "Bashkir (Башҡорт)" },
  { code: "eu", label: "Basque (Euskara)" },
  { code: "be", label: "Belarusian (Беларуская)" },
  { code: "bi", label: "Bislama" },
  { code: "bs", label: "Bosnian (Bosanski)" },
  { code: "br", label: "Breton (Brezhoneg)" },
  { code: "bg", label: "Bulgarian (Български)" },
  { code: "my", label: "Burmese (မြန်မာ)" },
  { code: "ca", label: "Catalan (Català)" },
  { code: "ch", label: "Chamorro (Chamoru)" },
  { code: "ce", label: "Chechen (Нохчийн)" },
  { code: "ny", label: "Chichewa" },
  { code: "zh", label: "Chinese (中文)" },
  { code: "cu", label: "Church Slavic" },
  { code: "cv", label: "Chuvash (Чӑваш)" },
  { code: "kw", label: "Cornish (Kernewek)" },
  { code: "co", label: "Corsican (Corsu)" },
  { code: "cr", label: "Cree (ᓀᐦᐃᔭᐍᐏᐣ)" },
  { code: "hr", label: "Croatian (Hrvatski)" },
  { code: "cs", label: "Czech (Čeština)" },
  { code: "da", label: "Danish (Dansk)" },
  { code: "dv", label: "Divehi (ދިވެހި)" },
  { code: "nl", label: "Dutch (Nederlands)" },
  { code: "dz", label: "Dzongkha (རྫོང་ཁ)" },
  { code: "eo", label: "Esperanto" },
  { code: "et", label: "Estonian (Eesti)" },
  { code: "ee", label: "Ewe (Eʋegbe)" },
  { code: "fo", label: "Faroese (Føroyskt)" },
  { code: "fj", label: "Fijian (Vosa Vakaviti)" },
  { code: "fi", label: "Finnish (Suomi)" },
  { code: "fr", label: "French (Français)" },
  { code: "ff", label: "Fulah (Fulfulde)" },
  { code: "gd", label: "Gaelic (Gàidhlig)" },
  { code: "gl", label: "Galician (Galego)" },
  { code: "lg", label: "Ganda (Luganda)" },
  { code: "ka", label: "Georgian (ქართული)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "ki", label: "Gikuyu (Gĩkũyũ)" },
  { code: "el", label: "Greek (Ελληνικά)" },
  { code: "kl", label: "Greenlandic (Kalaallisut)" },
  { code: "gn", label: "Guarani (Avañeʼẽ)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
  { code: "ht", label: "Haitian Creole (Kreyòl)" },
  { code: "ha", label: "Hausa" },
  { code: "he", label: "Hebrew (עברית)" },
  { code: "hz", label: "Herero (Otjiherero)" },
  { code: "ho", label: "Hiri Motu" },
  { code: "hu", label: "Hungarian (Magyar)" },
  { code: "is", label: "Icelandic (Íslenska)" },
  { code: "io", label: "Ido" },
  { code: "ig", label: "Igbo" },
  { code: "ia", label: "Interlingua" },
  { code: "ie", label: "Interlingue" },
  { code: "iu", label: "Inuktitut (ᐃᓄᒃᑎᑐᑦ)" },
  { code: "ik", label: "Inupiaq (Iñupiaq)" },
  { code: "ga", label: "Irish (Gaeilge)" },
  { code: "it", label: "Italian (Italiano)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "jv", label: "Javanese (Basa Jawa)" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)" },
  { code: "kr", label: "Kanuri" },
  { code: "ks", label: "Kashmiri (کٲشُر)" },
  { code: "kk", label: "Kazakh (Қазақ)" },
  { code: "km", label: "Khmer (ខ្មែរ)" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "kv", label: "Komi (Коми)" },
  { code: "kg", label: "Kongo (Kikongo)" },
  { code: "ko", label: "Korean (한국어)" },
  { code: "kj", label: "Kwanyama" },
  { code: "ku", label: "Kurdish (کوردی)" },
  { code: "ky", label: "Kyrgyz (Кыргызча)" },
  { code: "lo", label: "Lao (ລາວ)" },
  { code: "la", label: "Latin (Latina)" },
  { code: "lv", label: "Latvian (Latviešu)" },
  { code: "lb", label: "Luxembourgish (Lëtzebuergesch)" },
  { code: "li", label: "Limburgish (Limburgs)" },
  { code: "ln", label: "Lingala (Lingála)" },
  { code: "lt", label: "Lithuanian (Lietuvių)" },
  { code: "lu", label: "Luba-Katanga (Kiluba)" },
  { code: "mk", label: "Macedonian (Македонски)" },
  { code: "mg", label: "Malagasy" },
  { code: "ms", label: "Malay (Bahasa Melayu)" },
  { code: "mt", label: "Maltese (Malti)" },
  { code: "gv", label: "Manx (Gaelg)" },
  { code: "mi", label: "Maori (Māori)" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "mh", label: "Marshallese (Kajin M̧ajeļ)" },
  { code: "mn", label: "Mongolian (Монгол)" },
  { code: "na", label: "Nauru (Dorerin Naoero)" },
  { code: "nv", label: "Navajo (Diné bizaad)" },
  { code: "nd", label: "Ndebele, North (isiNdebele)" },
  { code: "nr", label: "Ndebele, South (isiNdebele)" },
  { code: "ng", label: "Ndonga (Owambo)" },
  { code: "no", label: "Norwegian (Norsk)" },
  { code: "nb", label: "Norwegian Bokmål" },
  { code: "nn", label: "Norwegian Nynorsk" },
  { code: "ii", label: "Nuosu (ꆈꌠ꒿ Nuosuhxop)" },
  { code: "oc", label: "Occitan" },
  { code: "oj", label: "Ojibwe (ᐊᓂᔑᓈᐯᒧᐎᓐ)" },
  { code: "or", label: "Oriya (ଓଡ଼ିଆ)" },
  { code: "om", label: "Oromo (Afaan Oromoo)" },
  { code: "os", label: "Ossetian (Ирон)" },
  { code: "pi", label: "Pali (पाऴि)" },
  { code: "pl", label: "Polish (Polski)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "qu", label: "Quechua (Runa Simi)" },
  { code: "ro", label: "Romanian (Română)" },
  { code: "rm", label: "Romansh (Rumantsch)" },
  { code: "rn", label: "Rundi (Ikirundi)" },
  { code: "ru", label: "Russian (Русский)" },
  { code: "se", label: "Sami, Northern (Davvisámegiella)" },
  { code: "sm", label: "Samoan (Gagana Samoa)" },
  { code: "sg", label: "Sango (Yângâ tî Sängö)" },
  { code: "sa", label: "Sanskrit (संस्कृतम्)" },
  { code: "sc", label: "Sardinian (Sardu)" },
  { code: "sr", label: "Serbian (Српски)" },
  { code: "sn", label: "Shona (chiShona)" },
  { code: "sd", label: "Sindhi (سنڌي)" },
  { code: "sk", label: "Slovak (Slovenčina)" },
  { code: "sl", label: "Slovenian (Slovenščina)" },
  { code: "so", label: "Somali (Soomaali)" },
  { code: "st", label: "Sotho, Southern (Sesotho)" },
  { code: "es", label: "Spanish (Español)" },
  { code: "su", label: "Sundanese (Basa Sunda)" },
  { code: "sw", label: "Swahili (Kiswahili)" },
  { code: "ss", label: "Swati (SiSwati)" },
  { code: "sv", label: "Swedish (Svenska)" },
  { code: "ty", label: "Tahitian (Reo Tahiti)" },
  { code: "tg", label: "Tajik (Тоҷикӣ)" },
  { code: "tt", label: "Tatar (Татар)" },
  { code: "th", label: "Thai (ไทย)" },
  { code: "bo", label: "Tibetan (བོད་ཡིག)" },
  { code: "ti", label: "Tigrinya (ትግርኛ)" },
  { code: "to", label: "Tongan (Lea Fakatonga)" },
  { code: "ts", label: "Tsonga (Xitsonga)" },
  { code: "tn", label: "Tswana (Setswana)" },
  { code: "tr", label: "Turkish (Türkçe)" },
  { code: "tk", label: "Turkmen (Türkmençe)" },
  { code: "tw", label: "Twi" },
  { code: "ug", label: "Uyghur (ئۇيغۇرچە)" },
  { code: "uk", label: "Ukrainian (Українська)" },
  { code: "uz", label: "Uzbek (Oʻzbek)" },
  { code: "ve", label: "Venda (Tshivenda)" },
  { code: "vi", label: "Vietnamese (Tiếng Việt)" },
  { code: "vo", label: "Volapük" },
  { code: "wa", label: "Walloon (Walon)" },
  { code: "cy", label: "Welsh (Cymraeg)" },
  { code: "fy", label: "Western Frisian (Frysk)" },
  { code: "wo", label: "Wolof" },
  { code: "xh", label: "Xhosa (isiXhosa)" },
  { code: "yi", label: "Yiddish (ייִדיש)" },
  { code: "yo", label: "Yoruba (Yorùbá)" },
  { code: "za", label: "Zhuang (Vahcuengh)" },
  { code: "zu", label: "Zulu (isiZulu)" },
];

const LANGUAGES = [...COMMON_LANGUAGES, ...ALL_OTHER_LANGUAGES];

const inputClass =
  "w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-brand-50/40 disabled:text-ink-500 dark:border-surface-border dark:bg-surface-raised dark:text-ink-100 dark:disabled:bg-surface dark:disabled:text-ink-300";
const labelClass = "mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-100";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-700 dark:text-ink-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink-300 accent-brand-500"
      />
      {label}
    </label>
  );
}

function Select({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: LookupOption[];
  placeholder: string;
}) {
  return (
    <select id={id} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

const sectionClass =
  "overflow-hidden rounded-2xl border border-ink-100 border-t-4 border-t-brand-500 bg-white p-5 shadow-card dark:border-surface-border dark:border-t-brand-400 dark:bg-surface-raised sm:p-6";
const sectionTitleClass =
  "mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-brand-600 before:h-4 before:w-1 before:rounded-full before:bg-gold-400 dark:text-brand-300";

export default function ProfileForm({
  customer,
  countries,
  initialStates,
  initialCities,
  familyMembers: initialFamily,
  lookups,
  companyName,
}: {
  customer: CustomerProfile;
  familyMembers: FamilyMember[];
  lookups: Lookups;
  companyName: string;
  countries: CountryOption[];
  initialStates: LookupOption[];
  initialCities: LookupOption[];
}) {
  const [form, setForm] = useState({
    whatsappNumber: customer.whatsappNumber ?? "",
    email: customer.email ?? "",
    idCardType: customer.idCardType ?? "",
    idCardNumber: customer.idCardNumber ?? "",
    address: customer.address ?? "",
    zipcode: customer.zipcode ?? "",
    countryId: customer.countryId ?? "",
    stateId: customer.stateId ?? "",
    cityId: customer.cityId ?? "",
    nationalityId: customer.nationalityId ?? "",
    dateOfBirth: customer.dateOfBirth ?? "",
    documentIssuingCountryId: customer.documentIssuingCountryId ?? "",
    language: customer.language ?? "en",
    alternateContactNumber: customer.alternateContactNumber ?? "",
    contactViaWhatsapp: customer.contactViaWhatsapp,
    contactViaSms: customer.contactViaSms,
    contactViaCall: customer.contactViaCall,
    contactViaEmail: customer.contactViaEmail,
    preferredJewelryId: customer.preferredJewelryId ?? "",
    preferredKaratId: customer.preferredKaratId ?? "",
    preferredStyleId: customer.preferredStyleId ?? "",
    ringSize: customer.ringSize?.toString() ?? "",
    bangleSize: customer.bangleSize?.toString() ?? "",
    customerTypeId: customer.customerTypeId ?? "",
    customerGradeId: customer.customerGradeId ?? "",
    personaId: customer.personaId ?? "",
    leadSourceId: customer.leadSourceId ?? "",
    consentService: customer.consentService,
    consentMarketing: customer.consentMarketing,
    preferredBranchId: customer.preferredBranchId ?? "",
    goldRateAlert: customer.goldRateAlert,
    goldRateAlertMode: customer.goldRateAlertMode ?? "",
    weeklyNotificationMail: customer.weeklyNotificationMail,
    anniversaryDate: customer.anniversaryDate ?? "",
    spouseName: customer.spouseName ?? "",
    genderId: customer.genderId ?? "",
    maritalStatusId: customer.maritalStatusId ?? "",
  });
  const [family, setFamily] = useState<FamilyMember[]>(initialFamily);

  function updateMember(i: number, patch: Partial<FamilyMember>) {
    setFamily((list) => list.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  const [states, setStates] = useState<LookupOption[]>(initialStates);
  const [cities, setCities] = useState<LookupOption[]>(initialCities);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCountry = countries.find((c) => c.id === form.countryId);
  const derivedCountryCode = form.countryId ? selectedCountry?.countryCode ?? "" : customer.countryCode ?? "";

  const idTypeOptions = !form.idCardType || ID_TYPES.includes(form.idCardType)
    ? ID_TYPES
    : [form.idCardType, ...ID_TYPES];

  async function handleCountryChange(value: string) {
    setForm((f) => ({ ...f, countryId: value, stateId: "", cityId: "" }));
    setCities([]);
    if (!value) {
      setStates([]);
      return;
    }
    setLoadingStates(true);
    try {
      const res = await fetch(`/api/lookups/states?countryId=${value}`);
      const json = await res.json();
      setStates(json.success ? json.data : []);
    } finally {
      setLoadingStates(false);
    }
  }

  async function handleStateChange(value: string) {
    setForm((f) => ({ ...f, stateId: value, cityId: "" }));
    if (!value) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    try {
      const res = await fetch(`/api/lookups/cities?stateId=${value}`);
      const json = await res.json();
      setCities(json.success ? json.data : []);
    } finally {
      setLoadingCities(false);
    }
  }

  function fail(message: string) {
    setError(message);
    setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    // Required fields (marked * on the form)
    if (!form.email.trim()) return fail("Email Is Required.");
    if (!form.whatsappNumber.trim()) return fail("WhatsApp Number Is Required.");
    if (!(form.contactViaWhatsapp || form.contactViaSms || form.contactViaCall || form.contactViaEmail))
      return fail("Please Select At Least One Preferred Contact Channel.");
    if (!form.leadSourceId) return fail("Lead Source Is Required.");
    if (!form.consentService) return fail("Please Acknowledge The Collection And Processing Of Your Personal Information.");
    if (!form.preferredKaratId) return fail("Preferred Karat Is Required.");
    if (!form.preferredBranchId) return fail("Preferred Branch / Outlet Is Required.");
    if (!form.genderId) return fail("Gender Is Required.");
    if (form.goldRateAlert && !form.goldRateAlertMode) return fail("Please Select A Mode Of Gold Rate Alert.");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: form.whatsappNumber,
          email: form.email,
          idCardType: form.idCardType,
          idCardNumber: form.idCardNumber,
          address: form.address,
          zipcode: form.zipcode,
          stateId: form.stateId || null,
          cityId: form.cityId || null,
          countryId: form.countryId || null,
          nationalityId: form.nationalityId || null,
          documentIssuingCountryId: form.documentIssuingCountryId || null,
          dateOfBirth: form.dateOfBirth || null,
          language: form.language,
          alternateContactNumber: form.alternateContactNumber,
          contactViaWhatsapp: form.contactViaWhatsapp,
          contactViaSms: form.contactViaSms,
          contactViaCall: form.contactViaCall,
          contactViaEmail: form.contactViaEmail,
          preferredJewelryId: form.preferredJewelryId || null,
          preferredKaratId: form.preferredKaratId || null,
          preferredStyleId: form.preferredStyleId || null,
          ringSize: form.ringSize === "" ? null : Number(form.ringSize),
          bangleSize: form.bangleSize === "" ? null : Number(form.bangleSize),
          customerTypeId: form.customerTypeId || null,
          customerGradeId: form.customerGradeId || null,
          personaId: form.personaId || null,
          leadSourceId: form.leadSourceId || null,
          consentService: form.consentService,
          consentMarketing: form.consentMarketing,
          preferredBranchId: form.preferredBranchId || null,
          goldRateAlert: form.goldRateAlert,
          goldRateAlertMode: form.goldRateAlert ? form.goldRateAlertMode : null,
          weeklyNotificationMail: form.weeklyNotificationMail,
          anniversaryDate: form.anniversaryDate || null,
          spouseName: form.spouseName,
          genderId: form.genderId || null,
          maritalStatusId: form.maritalStatusId || null,
          familyMembers: family.map((m) => ({
            id: m.id || null,
            name: m.name,
            relationshipId: m.relationshipId || null,
            dateOfBirth: m.dateOfBirth || null,
            anniversaryDate: m.anniversaryDate || null,
            mobile: m.mobile,
            email: m.email,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "Something Went Wrong.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Something Went Wrong. Please Try Again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Read-only identity — per requirement, name/mobile are view-only */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Account</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input className={inputClass} value={customer.name ?? ""} disabled />
          </Field>
          <Field label="Mobile Number">
            <input className={inputClass} value={customer.mobile ?? ""} disabled />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="WhatsApp Number *" htmlFor="whatsappNumber">
            <input
              id="whatsappNumber"
              type="tel"
              className={inputClass}
              value={form.whatsappNumber}
              onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
            />
          </Field>
          <Field label="Email *" htmlFor="email">
            <input
              id="email"
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Alternate Contact Number" htmlFor="alternateContactNumber">
            <input
              id="alternateContactNumber"
              type="tel"
              className={inputClass}
              value={form.alternateContactNumber}
              onChange={(e) => setForm((f) => ({ ...f, alternateContactNumber: e.target.value }))}
            />
          </Field>
          <div>
            <span className={labelClass}>Preferred Contact Channel *</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1.5">
              <Check label="WhatsApp" checked={form.contactViaWhatsapp} onChange={(v) => setForm((f) => ({ ...f, contactViaWhatsapp: v }))} />
              <Check label="SMS" checked={form.contactViaSms} onChange={(v) => setForm((f) => ({ ...f, contactViaSms: v }))} />
              <Check label="Call" checked={form.contactViaCall} onChange={(v) => setForm((f) => ({ ...f, contactViaCall: v }))} />
              <Check label="Email" checked={form.contactViaEmail} onChange={(v) => setForm((f) => ({ ...f, contactViaEmail: v }))} />
            </div>
          </div>
        </div>
      </section>

      {/* Identification */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Identification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ID Type" htmlFor="idCardType">
            <select
              id="idCardType"
              className={inputClass}
              value={form.idCardType}
              onChange={(e) => setForm((f) => ({ ...f, idCardType: e.target.value }))}
            >
              <option value="">Select ID Type</option>
              {idTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ID Number" htmlFor="idCardNumber">
            <input
              id="idCardNumber"
              className={inputClass}
              value={form.idCardNumber}
              onChange={(e) => setForm((f) => ({ ...f, idCardNumber: e.target.value }))}
            />
          </Field>
          <Field label="Document Issuing Country" htmlFor="documentIssuingCountryId">
            <select
              id="documentIssuingCountryId"
              className={inputClass}
              value={form.documentIssuingCountryId}
              onChange={(e) => setForm((f) => ({ ...f, documentIssuingCountryId: e.target.value }))}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nationality" htmlFor="nationalityId">
            <select
              id="nationalityId"
              className={inputClass}
              value={form.nationalityId}
              onChange={(e) => setForm((f) => ({ ...f, nationalityId: e.target.value }))}
            >
              <option value="">Select Nationality</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Address</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Address" htmlFor="address">
              <TextInput
                id="address"
                className={inputClass}
                value={form.address}
                onChange={(value) => setForm((f) => ({ ...f, address: value }))}
              />
            </Field>
          </div>

          <Field label="Country" htmlFor="countryId">
            <select
              id="countryId"
              className={inputClass}
              value={form.countryId}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value="">Select Country</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Country Code">
            <input className={inputClass} value={derivedCountryCode} disabled placeholder="Auto-filled from country" />
          </Field>

          <Field label="Province" htmlFor="stateId">
            <select
              id="stateId"
              className={inputClass}
              value={form.stateId}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={!form.countryId || loadingStates}
            >
              <option value="">{loadingStates ? "Loading…" : "Select Province"}</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="City" htmlFor="cityId">
            <select
              id="cityId"
              className={inputClass}
              value={form.cityId}
              onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value }))}
              disabled={!form.stateId || loadingCities}
            >
              <option value="">{loadingCities ? "Loading…" : "Select City"}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Zipcode" htmlFor="zipcode">
            <input
              id="zipcode"
              className={inputClass}
              value={form.zipcode}
              onChange={(e) => setForm((f) => ({ ...f, zipcode: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      {/* Customer Classification */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Customer Classification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Customer Type" htmlFor="customerTypeId">
            <Select id="customerTypeId" value={form.customerTypeId} options={lookups.customerTypes} placeholder="Select Customer Type"
              onChange={(v) => setForm((f) => ({ ...f, customerTypeId: v }))} />
          </Field>
          <Field label="Customer Grade" htmlFor="customerGradeId">
            <Select id="customerGradeId" value={form.customerGradeId} options={lookups.customerGrades} placeholder="Select Customer Grade"
              onChange={(v) => setForm((f) => ({ ...f, customerGradeId: v }))} />
          </Field>
          <Field label="Persona" htmlFor="personaId">
            <Select id="personaId" value={form.personaId} options={lookups.personas} placeholder="Select Persona"
              onChange={(v) => setForm((f) => ({ ...f, personaId: v }))} />
          </Field>
          <Field label="Lead Source *" htmlFor="leadSourceId">
            <Select id="leadSourceId" value={form.leadSourceId} options={lookups.leadSources} placeholder="Select Lead Source"
              onChange={(v) => setForm((f) => ({ ...f, leadSourceId: v }))} />
          </Field>
          <Field label="Total Referrals">
            <input className={inputClass} value={customer.totalReferrals ?? ""} disabled />
          </Field>
          <Field label="Family Milestone">
            <input className={inputClass} value={customer.familyMilestone ?? ""} disabled />
          </Field>
          <Field label="Advocacy Score">
            <input className={inputClass} value={customer.advocacyScore ?? ""} disabled />
          </Field>
        </div>
      </section>

      {/* Jewellery Preferences & Alerts */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Jewellery Preferences &amp; Alerts</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Preferred Jewellery" htmlFor="preferredJewelryId">
            <Select id="preferredJewelryId" value={form.preferredJewelryId} options={lookups.divisions} placeholder="Select Jewellery"
              onChange={(v) => setForm((f) => ({ ...f, preferredJewelryId: v }))} />
          </Field>
          <Field label="Preferred Karat *" htmlFor="preferredKaratId">
            <Select id="preferredKaratId" value={form.preferredKaratId} options={lookups.karats} placeholder="Select Karat"
              onChange={(v) => setForm((f) => ({ ...f, preferredKaratId: v }))} />
          </Field>
          <Field label="Preferred Style" htmlFor="preferredStyleId">
            <Select id="preferredStyleId" value={form.preferredStyleId} options={lookups.styles} placeholder="Select Style"
              onChange={(v) => setForm((f) => ({ ...f, preferredStyleId: v }))} />
          </Field>
          <Field label="Ring Size" htmlFor="ringSize">
            <input id="ringSize" type="number" step="0.5" min="0" className={inputClass} value={form.ringSize}
              onChange={(e) => setForm((f) => ({ ...f, ringSize: e.target.value }))} />
          </Field>
          <Field label="Bangle Size" htmlFor="bangleSize">
            <input id="bangleSize" type="number" step="0.1" min="0" className={inputClass} value={form.bangleSize}
              onChange={(e) => setForm((f) => ({ ...f, bangleSize: e.target.value }))} />
          </Field>
          <Field label="Preferred Branch / Outlet *" htmlFor="preferredBranchId">
            <Select id="preferredBranchId" value={form.preferredBranchId} options={lookups.branches} placeholder="Select Branch"
              onChange={(v) => setForm((f) => ({ ...f, preferredBranchId: v }))} />
          </Field>
          <div className="flex flex-col gap-3 sm:col-span-3 sm:flex-row sm:items-start sm:gap-10">
            <div className="space-y-3">
              <Check label="Gold Rate Alert" checked={form.goldRateAlert}
                onChange={(v) => setForm((f) => ({ ...f, goldRateAlert: v, goldRateAlertMode: v ? f.goldRateAlertMode : "" }))} />
              {form.goldRateAlert && (
                <Field label="Mode Of Gold Rate Alert *" htmlFor="goldRateAlertMode">
                  <select id="goldRateAlertMode" className={inputClass} value={form.goldRateAlertMode}
                    onChange={(e) => setForm((f) => ({ ...f, goldRateAlertMode: e.target.value }))}>
                    <option value="">Select Mode</option>
                    {ALERT_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
            <Check label="Weekly Notification Mail" checked={form.weeklyNotificationMail}
              onChange={(v) => setForm((f) => ({ ...f, weeklyNotificationMail: v }))} />
          </div>
        </div>
      </section>

      {/* Personal & Family Details */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Personal &amp; Family Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Date Of Birth" htmlFor="dateOfBirth">
            <input id="dateOfBirth" type="date" className={inputClass} value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
          </Field>
          <Field label="Anniversary Date" htmlFor="anniversaryDate">
            <input id="anniversaryDate" type="date" className={inputClass} value={form.anniversaryDate}
              onChange={(e) => setForm((f) => ({ ...f, anniversaryDate: e.target.value }))} />
          </Field>
          <Field label="Spouse Name" htmlFor="spouseName">
            <TextInput id="spouseName" className={inputClass} value={form.spouseName}
              onChange={(v) => setForm((f) => ({ ...f, spouseName: v }))} />
          </Field>
          <Field label="Gender *" htmlFor="genderId">
            <Select id="genderId" value={form.genderId} options={lookups.genders} placeholder="Select Gender"
              onChange={(v) => setForm((f) => ({ ...f, genderId: v }))} />
          </Field>
          <Field label="Marital Status" htmlFor="maritalStatusId">
            <Select id="maritalStatusId" value={form.maritalStatusId} options={lookups.maritalStatuses} placeholder="Select Marital Status"
              onChange={(v) => setForm((f) => ({ ...f, maritalStatusId: v }))} />
          </Field>
        </div>

        <div className="mt-5 border-t border-dashed border-ink-100 pt-4 dark:border-surface-border">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-700 dark:text-ink-100">
              Family Members{" "}
              <span className="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 dark:bg-brand-800/30 dark:text-brand-300">
                {family.length} / {MAX_FAMILY_MEMBERS}
              </span>
            </p>
            <button
              type="button"
              disabled={family.length >= MAX_FAMILY_MEMBERS}
              onClick={() =>
                setFamily((l) => [...l, { id: "", name: "", relationshipId: "", dateOfBirth: "", anniversaryDate: "", mobile: "", email: "" }])
              }
              className="rounded-xl border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-300 dark:hover:bg-brand-800/30"
            >
              + Add Member
            </button>
          </div>
          {family.length === 0 ? (
            <p className="text-sm text-ink-500 dark:text-ink-300">No Family Members Added.</p>
          ) : (
            <div className="space-y-3">
              {family.map((m, i) => (
                <div key={i} className="grid grid-cols-1 gap-3 rounded-xl border border-ink-100 p-3 dark:border-surface-border sm:grid-cols-6">
                  <Field label="Name">
                    <TextInput className={inputClass} value={m.name} onChange={(v) => updateMember(i, { name: v })} />
                  </Field>
                  <Field label="Relationship">
                    <Select id={`rel-${i}`} value={m.relationshipId} options={lookups.relationships} placeholder="Select"
                      onChange={(v) => updateMember(i, { relationshipId: v })} />
                  </Field>
                  <Field label="DOB">
                    <input type="date" className={inputClass} value={m.dateOfBirth} onChange={(e) => updateMember(i, { dateOfBirth: e.target.value })} />
                  </Field>
                  <Field label="Anniversary">
                    <input type="date" className={inputClass} value={m.anniversaryDate} onChange={(e) => updateMember(i, { anniversaryDate: e.target.value })} />
                  </Field>
                  <Field label="Mobile">
                    <input type="tel" className={inputClass} value={m.mobile} onChange={(e) => updateMember(i, { mobile: e.target.value })} />
                  </Field>
                  <Field label="Email ID">
                    <div className="flex items-center gap-2">
                      <input type="email" className={inputClass} value={m.email} onChange={(e) => updateMember(i, { email: e.target.value })} />
                      <button
                        type="button"
                        aria-label="Remove Member"
                        onClick={() => setFamily((l) => l.filter((_, idx) => idx !== i))}
                        className="rounded-lg px-2 py-1 text-lg leading-none text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        ×
                      </button>
                    </div>
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Consent (text only; company name comes from the company table) */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Consent</h2>
        <div className="space-y-2 text-sm text-ink-700 dark:text-ink-100">
          <p className="font-semibold">Dear Valued Customer,</p>
          <p>At {companyName}, we value your privacy and are committed to protecting your personal information.</p>
          <p>
            By providing your details, you acknowledge that your personal information may be collected and processed
            for the following purposes, in accordance with applicable data protection laws:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Customer Service:</b> Purchase records, billing, warranties, exchanges, and after-sales support.</li>
            <li><b>Customer Communication:</b> Order updates, service notifications, and responses to your enquiries.</li>
            <li><b>Marketing Communications (Optional):</b> Offers, promotions, new collections, events, and personalized recommendations through WhatsApp, SMS, email, or phone.</li>
          </ul>
          <div className="space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-surface-border dark:bg-surface">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-300">Your Consent *</p>
            <Check label={`I acknowledge the collection and processing of my personal information for customer service and transaction-related purposes, as explained in the applicable privacy notice.`}
              checked={form.consentService} onChange={(v) => setForm((f) => ({ ...f, consentService: v }))} />
            <Check label={`I voluntarily consent to receive marketing communications from ${companyName} through the channels selected above.`}
              checked={form.consentMarketing} onChange={(v) => setForm((f) => ({ ...f, consentMarketing: v }))} />
          </div>
          <p className="pt-2 text-ink-500 dark:text-ink-300">Thank you for trusting {companyName}. Always With You</p>
        </div>
      </section>

      {/* Preferences */}
      <section className={sectionClass}>
        <h2 className={sectionTitleClass}>Preferences</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Language" htmlFor="language">
            <select
              id="language"
              className={inputClass}
              value={form.language}
              onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
            >
              {!form.language || LANGUAGES.some((l) => l.code === form.language) ? null : (
                <option value={form.language}>{form.language}</option>
              )}
              <optgroup label="Common">
                {COMMON_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All Languages (A–Z)">
                {ALL_OTHER_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700 dark:bg-brand-800/30 dark:text-brand-300">
          Profile Updated Successfully.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:from-brand-600 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
