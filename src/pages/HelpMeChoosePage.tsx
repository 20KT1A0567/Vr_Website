import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Cpu,
  Gamepad2,
  Globe,
  GraduationCap,
  IndianRupee,
  Laptop2,
  MemoryStick,
  MessageCircle,
  Monitor,
  Palette,
  Phone,
  RotateCcw,
  Send,
  Sparkles,
  User
} from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";
import { ProductCard } from "components/catalog/ProductCard";
import { Button } from "components/ui/Button";
import { catalogApi } from "api/client";
import type { Product } from "types";
import toast from "react-hot-toast";

/* ── Types ─────────────────────────────────────────────────────── */

type UsageKey = "work" | "study" | "gaming" | "creative" | "macbook" | "general";
type BudgetKey = "u20k" | "20-40k" | "40-70k" | "a70k";
type RamKey = "4" | "8" | "16" | "any";
type OsKey = "windows" | "macos" | "any";

interface QuizAnswer {
  usage: UsageKey | null;
  budget: BudgetKey | null;
  ram: RamKey | null;
  os: OsKey | null;
}

type AnswerKey = keyof QuizAnswer;

interface StepOption {
  value: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

interface StepDef {
  key: AnswerKey;
  question: string;
  subtitle: string;
  gridCols: string;
  options: StepOption[];
}

/* ── Step definitions ───────────────────────────────────────────── */

const STEPS: StepDef[] = [
  {
    key: "usage",
    question: "What will you mainly use it for?",
    subtitle: "Pick the closest match — this helps us narrow the right category for you.",
    gridCols: "sm:grid-cols-2 lg:grid-cols-3",
    options: [
      { value: "work",     label: "Office & Work",      desc: "Emails, docs, video calls",        Icon: Briefcase,     iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
      { value: "study",    label: "Study & College",    desc: "Research, assignments, classes",    Icon: GraduationCap, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
      { value: "gaming",   label: "Gaming",             desc: "High FPS, AAA titles, streaming",  Icon: Gamepad2,      iconBg: "bg-red-50",    iconColor: "text-red-600"    },
      { value: "creative", label: "Creative & Design",  desc: "Video editing, photo, 3D work",    Icon: Palette,       iconBg: "bg-amber-50",  iconColor: "text-amber-600"  },
      { value: "macbook",  label: "MacBook",            desc: "Apple ecosystem, macOS",            Icon: Monitor,       iconBg: "bg-slate-100", iconColor: "text-slate-700"  },
      { value: "general",  label: "Everyday Use",       desc: "Browsing, streaming, light tasks", Icon: Laptop2,       iconBg: "bg-green-50",  iconColor: "text-green-600"  },
    ]
  },
  {
    key: "budget",
    question: "What is your budget?",
    subtitle: "We'll only show products within your price range — no surprises.",
    gridCols: "sm:grid-cols-2",
    options: [
      { value: "u20k",   label: "Under ₹20,000",       desc: "Entry-level, daily essentials",          Icon: IndianRupee, iconBg: "bg-green-50",  iconColor: "text-green-600"  },
      { value: "20-40k", label: "₹20,000 – ₹40,000",   desc: "Best-value refurbished picks",           Icon: IndianRupee, iconBg: "bg-blue-50",   iconColor: "text-blue-600",   badge: "Popular" },
      { value: "40-70k", label: "₹40,000 – ₹70,000",   desc: "Premium laptops & entry MacBooks",       Icon: IndianRupee, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
      { value: "a70k",   label: "Above ₹70,000",        desc: "Flagship MacBooks & workstations",       Icon: IndianRupee, iconBg: "bg-amber-50",  iconColor: "text-amber-600"  },
    ]
  },
  {
    key: "ram",
    question: "How much RAM do you need?",
    subtitle: "RAM affects how many apps you can run at once. Not sure? Pick 8 GB.",
    gridCols: "sm:grid-cols-2",
    options: [
      { value: "4",   label: "4 GB  — Basic",       desc: "Light work, one app at a time",        Icon: MemoryStick, iconBg: "bg-slate-100", iconColor: "text-slate-500" },
      { value: "8",   label: "8 GB  — Everyday",     desc: "Smooth multitasking for most users",  Icon: MemoryStick, iconBg: "bg-blue-50",   iconColor: "text-blue-600",  badge: "Recommended" },
      { value: "16",  label: "16 GB — Power user",   desc: "Editing, heavy software, VMs",         Icon: MemoryStick, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
      { value: "any", label: "No preference",         desc: "Show products at any RAM size",        Icon: Cpu,         iconBg: "bg-slate-50",  iconColor: "text-slate-400" },
    ]
  },
  {
    key: "os",
    question: "Which operating system do you prefer?",
    subtitle: "If you're not sure, pick 'No preference' and we'll show you everything.",
    gridCols: "sm:grid-cols-3",
    options: [
      { value: "windows", label: "Windows",         desc: "Most compatible, familiar interface",   Icon: Monitor, iconBg: "bg-blue-50",   iconColor: "text-blue-600"  },
      { value: "macos",   label: "macOS",            desc: "Apple experience, creative workflow",   Icon: Monitor, iconBg: "bg-slate-100", iconColor: "text-slate-700" },
      { value: "any",     label: "No preference",    desc: "I'm open to either OS",                Icon: Globe,   iconBg: "bg-slate-50",  iconColor: "text-slate-400" },
    ]
  }
];

/* ── Filter & scoring ───────────────────────────────────────────── */

function scoreProduct(p: Product, answers: QuizAnswer): number | null {
  let score = 0;
  let hardFail = false;

  const catLower  = (p.categoryName ?? "").toLowerCase();
  const osLower   = (p.os ?? "").toLowerCase();
  const ram       = p.ramGb ?? 0;
  const hasOs     = Boolean(p.os?.trim());
  const hasRam    = ram > 0;

  const isMacCat     = catLower.includes("mac");
  const isGamingCat  = catLower.includes("gaming");
  const isMonitor    = catLower.includes("monitor");
  const isAccessory  = catLower.includes("accessor");
  const isLaptopCat  = catLower.includes("laptop") || isMacCat;
  const isDesktopCat = catLower.includes("desktop") || catLower.includes("workstation");

  // ── Budget (hard filter) ──────────────────────────────────────
  if (answers.budget === "u20k"   && p.price > 20000)                           hardFail = true;
  if (answers.budget === "20-40k" && (p.price < 20000 || p.price > 40000))      hardFail = true;
  if (answers.budget === "40-70k" && (p.price < 40000 || p.price > 70000))      hardFail = true;
  if (answers.budget === "a70k"   && p.price < 70000)                           hardFail = true;
  if (!hardFail) score += 3; // within budget = strong signal

  // ── Usage (category match) ────────────────────────────────────
  if (answers.usage === "gaming") {
    if (!isGamingCat)                                                            hardFail = true;
    else                                                                         score += 4;
  } else if (answers.usage === "macbook") {
    if (!isMacCat && !osLower.includes("mac"))                                   hardFail = true;
    else                                                                         score += 4;
  } else if (answers.usage === "creative") {
    // Workstation or high RAM
    if (isMonitor || isAccessory)                                                hardFail = true;
    if (isDesktopCat || ram >= 16 || p.graphicsCard)                            score += 3;
    else if (ram >= 8)                                                           score += 1;
  } else if (answers.usage === "work" || answers.usage === "study") {
    // Laptops preferred, hard-exclude monitors/accessories
    if (isMonitor || isAccessory)                                                hardFail = true;
    if (isLaptopCat && !isGamingCat)                                            score += 3;
  } else if (answers.usage === "general") {
    // Exclude monitors and accessories
    if (isMonitor || isAccessory)                                                hardFail = true;
    if (isLaptopCat || isDesktopCat)                                            score += 2;
  }

  if (hardFail) return null;

  // ── RAM (soft — unknown RAM = neutral, not excluded) ──────────
  if (answers.ram === "4") {
    if (hasRam && ram <= 4)      score += 2;
    else if (hasRam && ram <= 8) score += 1;
  } else if (answers.ram === "8") {
    if (hasRam && ram < 8)       return null; // hard exclude only if data is known
    if (hasRam && ram >= 8)      score += 2;
    // ram = 0 (unknown): neutral, included
  } else if (answers.ram === "16") {
    if (hasRam && ram < 16)      return null;
    if (hasRam && ram >= 16)     score += 3;
  }

  // ── OS (soft — unknown OS = neutral, not excluded) ───────────
  if (answers.os === "windows") {
    if (hasOs && !osLower.includes("win"))  return null;
    if (osLower.includes("win"))            score += 2;
  } else if (answers.os === "macos") {
    if (hasOs && !osLower.includes("mac"))  return null;
    if (osLower.includes("mac"))            score += 2;
  }

  // ── Bonus for editorial quality ───────────────────────────────
  if (p.available)   score += 1;
  if (p.bestSeller)  score += 1;
  if (p.featured)    score += 1;

  return score;
}

function filterAndRank(products: Product[], answers: QuizAnswer) {
  const scored: Array<{ product: Product; score: number }> = [];

  for (const p of products) {
    const s = scoreProduct(p, answers);
    if (s !== null) scored.push({ product: p, score: s });
  }

  return scored.sort((a, b) => b.score - a.score).map((x) => x.product);
}

function buildProductsUrl(answers: QuizAnswer): string {
  const params = new URLSearchParams();
  if (answers.budget === "u20k")   params.set("maxPrice", "20000");
  if (answers.budget === "20-40k") { params.set("minPrice", "20000"); params.set("maxPrice", "40000"); }
  if (answers.budget === "40-70k") { params.set("minPrice", "40000"); params.set("maxPrice", "70000"); }
  if (answers.budget === "a70k")   params.set("minPrice", "70000");
  if (answers.ram === "8")         params.set("ram", "8");
  if (answers.ram === "16")        params.set("ram", "16");
  if (answers.os === "windows")    params.set("os", "windows");
  if (answers.os === "macos")      params.set("os", "macos");
  if (answers.usage === "gaming")  params.set("q", "gaming laptop");
  if (answers.usage === "macbook") params.set("q", "macbook");
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

function buildEnquiryMessage(answers: QuizAnswer): string {
  const label = (stepIdx: number, val: string | null) =>
    val ? STEPS[stepIdx].options.find((o) => o.value === val)?.label ?? val : null;
  return [
    "Enquiry via Help Me Choose quiz:",
    label(0, answers.usage)  && `Use case: ${label(0, answers.usage)}`,
    label(1, answers.budget) && `Budget: ${label(1, answers.budget)}`,
    label(2, answers.ram)    && `RAM: ${label(2, answers.ram)}`,
    label(3, answers.os)     && `OS: ${label(3, answers.os)}`,
  ].filter(Boolean).join("\n");
}

/* ── Component ──────────────────────────────────────────────────── */

const EMPTY_ANSWERS: QuizAnswer = { usage: null, budget: null, ram: null, os: null };

export function HelpMeChoosePage() {
  usePageMeta({ title: "Help me choose — VR Technologies" });

  const [step, setStep]               = useState(0);
  const [answers, setAnswers]         = useState<QuizAnswer>(EMPTY_ANSWERS);
  const [showResults, setShowResults] = useState(false);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["help-choose-products"],
    queryFn: () => catalogApi.getProducts(),
  });

  const totalSteps   = STEPS.length;
  const currentStep  = STEPS[Math.min(step, totalSteps - 1)];
  const currentAnswer = answers[currentStep.key];
  const isLastStep   = step === totalSteps - 1;

  // Live count — computed from answered questions so far
  const liveCount = useMemo(
    () => (answers.budget ? filterAndRank(allProducts, answers).length : null),
    [allProducts, answers]
  );

  const matched = useMemo(
    () => (showResults ? filterAndRank(allProducts, answers) : []),
    [allProducts, answers, showResults]
  );

  function pickOption(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value } as QuizAnswer));
  }

  function handleNext() {
    if (!currentAnswer) return;
    if (isLastStep) {
      setShowResults(true);
    } else {
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (showResults) { setShowResults(false); return; }
    if (step > 0) setStep((s) => s - 1);
  }

  function restart() {
    setStep(0);
    setAnswers(EMPTY_ANSWERS);
    setShowResults(false);
    setSubmitted(false);
    setEnquiryName(""); setEnquiryPhone(""); setEnquiryEmail("");
  }

  async function handleEnquiry() {
    if (!enquiryName.trim() || !enquiryPhone.trim()) {
      toast.error("Please enter your name and phone number");
      return;
    }
    setIsSubmitting(true);
    try {
      await catalogApi.createEnquiry({
        name: enquiryName.trim(),
        phone: enquiryPhone.trim(),
        email: enquiryEmail.trim() || undefined,
        message: buildEnquiryMessage(answers),
      });
      setSubmitted(true);
      toast.success("Our team will call you back shortly!");
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Shared hero ────────────────────────────────────────────── */
  const Hero = (
    <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#1e40af_100%)] px-6 py-10 text-white sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.07),transparent_60%)]" />
      <div className="relative mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.26em]">
          <Sparkles className="h-3 w-3 text-amber-400" />
          Personalised Recommendation
        </div>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          {showResults ? "Your Personalised Picks" : "Find your perfect laptop"}
        </h1>
        <p className="mt-2 text-sm leading-7 text-white/70">
          {showResults
            ? matched.length > 0
              ? `We found ${matched.length} product${matched.length !== 1 ? "s" : ""} that match your requirements.`
              : "We couldn't find an exact match — here are our best available picks."
            : "Answer 4 questions and we'll recommend the right refurbished laptop for you."}
        </p>
        {!showResults && (
          <div className="mx-auto mt-5 flex max-w-[280px] items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-bold text-white/55">
              Step {step + 1} of {totalSteps}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Results view ───────────────────────────────────────────── */
  if (showResults) {
    const toShow = matched.slice(0, 8);
    const moreCount = matched.length - toShow.length;
    const fallback  = allProducts.filter((p) => p.available && (p.featured || p.bestSeller)).slice(0, 8);
    const display   = toShow.length > 0 ? toShow : fallback;
    const hasMatch  = toShow.length > 0;

    return (
      <div>
        {Hero}
        <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8">

          {/* Answer summary + restart */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[var(--vr-muted)]">Your answers:</span>
            {(Object.entries(answers) as [AnswerKey, string | null][]).map(([key, value]) => {
              if (!value) return null;
              const stepDef = STEPS.find((s) => s.key === key);
              const opt = stepDef?.options.find((o) => o.value === value);
              if (!opt) return null;
              const OptIcon = opt.Icon;
              return (
                <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--vr-text)]">
                  <OptIcon className="h-3 w-3 text-[var(--vr-primary)]" />
                  {opt.label}
                </span>
              );
            })}
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--vr-muted)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
            >
              <RotateCcw className="h-3 w-3" />
              Start over
            </button>
          </div>

          {/* No-match notice */}
          {!hasMatch && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              No products exactly match your combination right now — showing our top available picks.{" "}
              <button type="button" onClick={restart} className="font-bold underline">
                Adjust your answers
              </button>{" "}
              or fill the form below for personalised help.
            </div>
          )}

          {/* Product grid */}
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="vr-skeleton h-[320px] rounded-[1.4rem]" />
              ))}
            </div>
          ) : display.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {display.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {(moreCount > 0 || !hasMatch) && (
                <div className="flex items-center gap-4">
                  <Link
                    to={buildProductsUrl(answers)}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--vr-primary)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--vr-primary)] transition hover:bg-[rgba(30,58,138,0.05)]"
                  >
                    {moreCount > 0 ? `See all ${matched.length} matching products` : "Browse more products"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-[var(--vr-border)] bg-[var(--vr-surface-soft)] py-14 text-center">
              <Sparkles className="mx-auto h-10 w-10 text-[var(--vr-muted)]" />
              <p className="mt-3 text-base font-semibold text-[var(--vr-text)]">No products available right now.</p>
              <p className="mt-1 text-sm text-[var(--vr-muted)]">Fill the form below — our team will find the perfect match for you.</p>
            </div>
          )}

          {/* Expert enquiry */}
          <div className="overflow-hidden rounded-[1.8rem] border border-[var(--vr-border)] bg-white shadow-sm">
            <div className="flex items-start gap-4 bg-[linear-gradient(135deg,#0f172a,#1e3a8a)] px-6 py-6 text-white sm:px-8 sm:py-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <MessageCircle className="h-5 w-5 text-white/80" />
              </div>
              <div>
                <div className="text-lg font-extrabold">Still not sure? Talk to an expert.</div>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  Share your number — our team will call you and personally help you pick the right laptop.
                </p>
              </div>
            </div>
            {submitted ? (
              <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="text-xl font-extrabold text-[var(--vr-text)]">Enquiry received!</div>
                <p className="max-w-sm text-sm leading-6 text-[var(--vr-muted)]">
                  Our team will reach out within a few hours. Thank you for choosing VR Technologies.
                </p>
                <Link to="/products" className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--vr-primary)] bg-white px-5 py-2 text-sm font-bold text-[var(--vr-primary)] transition hover:bg-[rgba(30,58,138,0.05)]">
                  Browse all products <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="px-6 py-6 sm:px-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Your Name", required: true, placeholder: "Full name", value: enquiryName, onChange: setEnquiryName, Icon: User, type: "text" },
                    { label: "Phone", required: true, placeholder: "+91 XXXXXXXXXX", value: enquiryPhone, onChange: setEnquiryPhone, Icon: Phone, type: "tel" },
                    { label: "Email (optional)", required: false, placeholder: "your@email.com", value: enquiryEmail, onChange: setEnquiryEmail, Icon: Send, type: "email" },
                  ].map(({ label, required, placeholder, value, onChange, Icon: FieldIcon, type }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--vr-muted)]">
                        {label}{required && <span className="ml-0.5 text-[var(--vr-danger)]">*</span>}
                      </label>
                      <div className="relative">
                        <FieldIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className="vr-input pl-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} type={type} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Button icon={<MessageCircle className="h-4 w-4" />} onClick={handleEnquiry} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Request a callback"}
                  </Button>
                  <span className="text-xs text-[var(--vr-muted)]">We respond within a few hours.</span>
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--vr-muted)] transition hover:text-[var(--vr-text)]">
            <ChevronLeft className="h-4 w-4" />
            Back to quiz
          </button>
        </div>
      </div>
    );
  }

  /* ── Quiz view ──────────────────────────────────────────────── */
  return (
    <div>
      {Hero}
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">

        {/* Step progress dots */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done     = i < step;
            const active   = i === step;
            const answered = answers[s.key] !== null;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => i < step && setStep(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    done
                      ? "cursor-pointer bg-[var(--vr-primary)] text-white hover:opacity-80"
                      : active
                      ? `border-2 border-[var(--vr-primary)] bg-white text-[var(--vr-primary)]${answered ? " ring-2 ring-[rgba(30,58,138,0.15)]" : ""}`
                      : "border-2 border-[var(--vr-border)] bg-white text-[var(--vr-muted)]"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 rounded-full transition-all duration-500 sm:w-12 ${done ? "bg-[var(--vr-primary)]" : "bg-[var(--vr-border)]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Question area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--vr-primary)]">
              Question {step + 1} of {totalSteps}
            </div>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--vr-text)] sm:text-3xl">
              {currentStep.question}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-[var(--vr-muted)]">
              {currentStep.subtitle}
            </p>

            {/* Options */}
            <div className={`mt-6 grid grid-cols-1 gap-3 ${currentStep.gridCols}`}>
              {currentStep.options.map((option) => {
                const OptionIcon = option.Icon;
                const isSelected = currentAnswer === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => pickOption(option.value)}
                    className={`group relative flex items-center gap-4 rounded-[1.3rem] border p-4 text-left transition-all ${
                      isSelected
                        ? "border-[var(--vr-primary)] bg-[rgba(30,58,138,0.04)] shadow-[0_0_0_3px_rgba(30,58,138,0.1)]"
                        : "border-[var(--vr-border)] bg-white hover:border-[var(--vr-primary)] hover:bg-[var(--vr-surface-soft)]"
                    }`}
                  >
                    {option.badge ? (
                      <span className="absolute right-3 top-3 rounded-full bg-[var(--vr-primary)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
                        {option.badge}
                      </span>
                    ) : null}

                    {/* Radio dot */}
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected ? "border-[var(--vr-primary)] bg-[var(--vr-primary)]" : "border-[var(--vr-border)] group-hover:border-[var(--vr-primary)]"
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>

                    {/* Icon */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] transition-all group-hover:scale-105 ${option.iconBg}`}>
                      <OptionIcon className={`h-5 w-5 ${option.iconColor}`} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-bold transition ${isSelected ? "text-[var(--vr-primary)]" : "text-[var(--vr-text)]"}`}>
                        {option.label}
                      </div>
                      <div className="mt-0.5 text-xs leading-5 text-[var(--vr-muted)]">
                        {option.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation row */}
            <div className="mt-7 flex items-center gap-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--vr-muted)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-text)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              <motion.button
                type="button"
                onClick={handleNext}
                disabled={!currentAnswer}
                whileHover={currentAnswer ? { scale: 1.02 } : {}}
                whileTap={currentAnswer ? { scale: 0.97 } : {}}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-all ${
                  currentAnswer
                    ? "bg-[var(--vr-primary)] text-white shadow-[0_8px_24px_rgba(30,58,138,0.25)] hover:bg-[var(--vr-primary-strong)]"
                    : "cursor-not-allowed bg-[var(--vr-surface-soft)] text-[var(--vr-muted)]"
                }`}
              >
                {isLastStep
                  ? liveCount !== null
                    ? `Show ${liveCount} matching product${liveCount !== 1 ? "s" : ""}`
                    : "Find my laptop"
                  : "Next question"}
                <ArrowRight className="h-4 w-4" />
              </motion.button>

              {!currentAnswer && (
                <span className="text-xs text-[var(--vr-muted)]">← Select an option above</span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
