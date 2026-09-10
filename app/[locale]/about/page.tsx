import type { Metadata } from "next";
import { alternateLanguages, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { SITE_CONFIG } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/data/settings";

export const revalidate = 86400;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const pathname = `/${locale}/about`;
  return {
    title: dict.about.title,
    alternates: {
      canonical: pathname,
      languages: alternateLanguages(pathname),
    },
  };
}

const COPY = {
  en: {
    p1: "Aarekettikkan is a public record of government cases across Kerala that were inaugurated, funded, and then abandoned, delayed, or left unfinished. It started as an Instagram series, visiting these sites and asking a simple question: aarekettikkan - who is responsible for this?",
    p2: "This site exists to keep a durable, searchable record of that reporting - not just the videos, but what (if anything) happened afterward. Every case page carries a live counter of how many days it has been since it was reported, and a timeline of updates as the story develops.",
    p3: "Claims on this site are framed as verifiable facts tied to a date - for example, \"incomplete as of\" a specific date - rather than accusations. Where a claim has a source (a news report, an RTI reply, an official statement), it is linked from the case's timeline.",
    p4: "If you believe something on this site is inaccurate, or you represent a department or contractor named here and want to respond, get in touch via the Instagram or YouTube links below and it will be reviewed.",
    p5: "Anyone can report a case for review from the Report a case page. Submissions are checked before they are published.",
  },
  ml: {
    p1: "ആഘോഷത്തോടെ ഉദ്ഘാടനം ചെയ്യുകയും ധനസഹായം നൽകുകയും ചെയ്ത ശേഷം ഉപേക്ഷിക്കപ്പെടുകയോ വൈകുകയോ പൂർത്തിയാകാതിരിക്കുകയോ ചെയ്ത കേരളത്തിലെ സർക്കാർ പ്രശ്നങ്ങളുടെ ഒരു പൊതു രേഖയാണ് . ഈ സ്ഥലങ്ങൾ സന്ദർശിച്ച് \"ഞങ്ങൾ  - ഇതിന് ആരാണ് ഉത്തരവാദി?\" എന്ന ലളിതമായ ചോദ്യം ചോദിക്കുന്ന ഒരു ഇൻസ്റ്റാഗ്രാം സീരീസായി ഇത് ആരംഭിച്ചു.",
    p2: "ആ റിപ്പോർട്ടിംഗിന്റെ ശാശ്വതവും തിരയാവുന്നതുമായ ഒരു രേഖ സൂക്ഷിക്കാനാണ് ഈ സൈറ്റ് നിലനിൽക്കുന്നത് - വീഡിയോകൾ മാത്രമല്ല, പിന്നീട് എന്ത് സംഭവിച്ചു എന്നതും. ഓരോ പ്രശ്നം പേജിലും റിപ്പോർട്ട് ചെയ്തതിന് ശേഷം എത്ര ദിവസമായി എന്നതിന്റെ തത്സമയ കൗണ്ടറും അപ്ഡേറ്റുകളുടെ ഒരു ടൈംലൈനും ഉണ്ട്.",
    p3: "ഈ സൈറ്റിലെ അവകാശവാദങ്ങൾ ഒരു തീയതിയുമായി ബന്ധപ്പെട്ട പരിശോധിക്കാവുന്ന വസ്തുതകളായാണ് അവതരിപ്പിക്കുന്നത് - ഉദാഹരണത്തിന്, ഒരു നിശ്ചിത തീയതി വരെ \"പൂർത്തിയാകാത്തത്\" - ആരോപണങ്ങളായല്ല. ഒരു അവകാശവാദത്തിന് ഒരു ഉറവിടം ഉണ്ടെങ്കിൽ (ഒരു വാർത്താ റിപ്പോർട്ട്, ഒരു RTI മറുപടി, ഒരു ഔദ്യോഗിക പ്രസ്താവന), അത് പ്രശ്നത്തിന്റെ ടൈംലൈനിൽ നിന്ന് ലിങ്ക് ചെയ്തിരിക്കുന്നു.",
    p4: "ഈ സൈറ്റിലെ എന്തെങ്കിലും കൃത്യമല്ലെന്ന് നിങ്ങൾ വിശ്വസിക്കുന്നുവെങ്കിൽ, അല്ലെങ്കിൽ ഇവിടെ പേരുള്ള ഒരു വകുപ്പിനെയോ കരാറുകാരനെയോ പ്രതിനിധീകരിക്കുകയും പ്രതികരിക്കാൻ ആഗ്രഹിക്കുകയും ചെയ്യുന്നുവെങ്കിൽ, താഴെയുള്ള ഇൻസ്റ്റാഗ്രാം അല്ലെങ്കിൽ യൂട്യൂബ് ലിങ്കുകൾ വഴി ബന്ധപ്പെടുക.",
    p5: "ആർക്കും ഒരു പ്രശ്നം പരിശോധനയ്ക്കായി റിപ്പോർട്ട് ചെയ്യാം. പ്രസിദ്ധീകരിക്കുന്നതിന് മുമ്പ് സമർപ്പിക്കലുകൾ പരിശോധിക്കുന്നു.",
  },
} as const;

export default async function AboutPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const copy = COPY[locale];
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{dict.about.title}</h1>
      <p className="leading-relaxed">{copy.p1}</p>
      <p className="leading-relaxed">{copy.p2}</p>
      <p className="leading-relaxed">{copy.p3}</p>
      <p className="leading-relaxed">{copy.p4}</p>
      <p className="leading-relaxed">{copy.p5}</p>
      <div className="mt-4 flex gap-4 text-sm">
        {settings.instagram_url && (
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            {dict.footer.instagram}
          </a>
        )}
        <a href={SITE_CONFIG.youtubeUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
          {dict.footer.youtube}
        </a>
      </div>
    </div>
  );
}
