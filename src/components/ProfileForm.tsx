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
};

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

export default function ProfileForm({
  customer,
  countries,
  initialStates,
  initialCities,
}: {
  customer: CustomerProfile;
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
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
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
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-surface-border dark:bg-surface-raised">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-300 dark:text-ink-500">
          Account
        </h2>
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
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-surface-border dark:bg-surface-raised">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-300 dark:text-ink-500">
          Contact
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="WhatsApp Number" htmlFor="whatsappNumber">
            <input
              id="whatsappNumber"
              type="tel"
              className={inputClass}
              value={form.whatsappNumber}
              onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
            />
          </Field>
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      {/* Identification */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-surface-border dark:bg-surface-raised">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-300 dark:text-ink-500">
          Identification
        </h2>
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
          <Field label="Date Of Birth" htmlFor="dateOfBirth">
            <input
              id="dateOfBirth"
              type="date"
              className={inputClass}
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-surface-border dark:bg-surface-raised">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-300 dark:text-ink-500">
          Address
        </h2>
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

      {/* Preferences */}
      <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-surface-border dark:bg-surface-raised">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-300 dark:text-ink-500">
          Preferences
        </h2>
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
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
