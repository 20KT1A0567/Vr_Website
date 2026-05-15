import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { getApiErrorMessage } from "../utils/api";
import { mergeGuestDataAfterLogin } from "../utils/mergeGuestData";
import { getRecaptcha, resetRecaptcha, sendOtp, type ConfirmationResult } from "lib/firebase";

const loginHighlights = [
  { title: "6 Months Warranty", subtitle: "On all products", icon: ShieldCheck },
  { title: "Quality Checked", subtitle: "100+ tests passed", icon: CheckCircle2 },
  { title: "7 Day Easy Returns", subtitle: "No questions asked", icon: Undo2 },
  { title: "Fast Delivery", subtitle: "Across Hyderabad", icon: Truck }
] as const;

const RECAPTCHA_CONTAINER_ID = "vr-recaptcha-container";

function mapFirebaseError(code: string | undefined, fallback: string) {
  switch (code) {
    case "auth/invalid-phone-number":
      return "That phone number doesn't look right. Check the digits and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes before trying again.";
    case "auth/code-expired":
      return "That OTP has expired. Request a new one.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP. Check the code and try again.";
    case "auth/missing-phone-number":
      return "Please enter your phone number.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and retry.";
    default:
      return fallback;
  }
}

export function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const sessionInfoRef = useRef<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      resetRecaptcha();
    };
  }, []);

  const phoneE164 = `+91${phone.replace(/\D/g, "")}`;

  async function handleSendOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phone.replace(/\D/g, "").length !== 10) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const verifier = getRecaptcha(RECAPTCHA_CONTAINER_ID);
      confirmationRef.current = await sendOtp(phoneE164, verifier);
      
      try {
        const backendOtpResponse = await authApi.sendPhoneOtp(phoneE164);
        sessionInfoRef.current = backendOtpResponse.sessionInfo;
      } catch (backendError) {
        console.warn("Backend OTP registration failed, proceeding with Firebase only:", backendError);
      }

      toast.success(`OTP sent to ${phoneE164}`);
      setStep("otp");
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      toast.error(mapFirebaseError(code, "Could not send OTP. Try again."));
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmationRef.current) {
      toast.error("Please request a fresh OTP.");
      setStep("phone");
      return;
    }
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const result = await confirmationRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();
      const user = await authApi.verifyPhone(idToken, sessionInfoRef.current ?? undefined);
      setUser(user);
      try {
        await mergeGuestDataAfterLogin(queryClient);
      } catch {
        // merge errors must not block login
      }
      toast.success("Welcome to Anusha Bazaar");
      navigate("/");
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      toast.error(mapFirebaseError(code, getApiErrorMessage(error, "Login failed")));
      setShakeKey((value) => value + 1);
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeNumber() {
    confirmationRef.current = null;
    setOtp("");
    setStep("phone");
    resetRecaptcha();
  }

  async function handleResendOtp() {
    if (loading) return;
    setLoading(true);
    try {
      resetRecaptcha();
      const verifier = getRecaptcha(RECAPTCHA_CONTAINER_ID);
      confirmationRef.current = await sendOtp(phoneE164, verifier);
      toast.success("New OTP sent.");
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      toast.error(mapFirebaseError(code, "Could not resend OTP."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10">
      <div className="store-dark-panel overflow-hidden">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-[rgba(30,58,138,0.08)] p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="store-kicker">Sign in</div>

            <div className="mt-6">
              <h1 className="text-3xl font-bold text-slate-950">
                {step === "phone" ? "Login with your mobile" : "Verify OTP"}
              </h1>
              <p className="mt-2 text-slate-600">
                {step === "phone"
                  ? "We'll send a one-time password to your phone. New here? Your account is created automatically."
                  : `Enter the 6-digit code sent to ${phoneE164}.`}
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === "phone" ? (
                <motion.form
                  key="phone-step"
                  initial={{ opacity: 0, x: -22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -22 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 space-y-4"
                  onSubmit={handleSendOtp}
                >
                  <label className="store-field flex items-center gap-2 !py-0 !pr-2 cursor-text">
                    <span className="select-none font-semibold text-slate-700">+91</span>
                    <input
                      type="tel"
                      className="flex-1 border-0 bg-transparent py-3 text-sm outline-none focus:ring-0"
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </label>
                  <button className="store-primary-btn w-full py-4 text-base" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="otp-step"
                  initial={{ opacity: 0, x: 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 22 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 space-y-4"
                  onSubmit={handleVerifyOtp}
                >
                  <motion.div
                    key={shakeKey}
                    animate={shakeKey === 0 ? { x: 0 } : { x: [0, -10, 10, -8, 8, -4, 4, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <input
                      className="store-field tracking-[0.4em] text-center text-lg"
                      placeholder="6-digit OTP"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </motion.div>
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      className="font-semibold text-[#1e3a8a]"
                      onClick={handleChangeNumber}
                      disabled={loading}
                    >
                      Change number
                    </button>
                    <button
                      type="button"
                      className="font-semibold text-[#1e3a8a]"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  </div>
                  <button className="store-primary-btn w-full py-4 text-base" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="mt-6 text-center text-xs text-slate-500">
              By continuing you agree to our terms of service and privacy policy.
            </p>

            <div id={RECAPTCHA_CONTAINER_ID} className="mt-4" />
          </div>

          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_38%),linear-gradient(135deg,#eff5ff,#dce8ff)] p-8 lg:p-10">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.12),transparent_60%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="store-kicker">VR Technologies</div>
                <h2 className="mt-5 max-w-md text-4xl font-bold leading-tight text-slate-950">Reliable refurbished tech, delivered with store-backed support.</h2>
              </div>

              <div className="mt-10 grid gap-4">
                {loginHighlights.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + index * 0.1, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[1.2rem] border border-[rgba(30,58,138,0.08)] bg-white/80 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#edf4ff] p-2.5 text-[#1e3a8a]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{item.subtitle}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
