import { FormEvent, useState } from "react";
import { CheckCircle2, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { getApiErrorMessage } from "../utils/api";

const loginHighlights = [
  { title: "6 Months Warranty", subtitle: "On all products", icon: ShieldCheck },
  { title: "Quality Checked", subtitle: "100+ tests passed", icon: CheckCircle2 },
  { title: "7 Day Easy Returns", subtitle: "No questions asked", icon: Undo2 },
  { title: "Fast Delivery", subtitle: "Across Hyderabad", icon: Truck }
] as const;

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const user = await authApi.login({ email, password });
      setUser(user);
      toast.success("Welcome back");
      navigate("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed"));
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10">
      <div className="store-dark-panel overflow-hidden">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-white/8 p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-1">
              <Link to="/login" className="flex-1 rounded-lg bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-950">
                Login
              </Link>
              <Link to="/register" className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white/60 transition hover:text-white">
                Register
              </Link>
            </div>

            <div className="mt-8">
              <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
              <p className="mt-2 text-white/58">Login to continue shopping with branch-aware checkout and order tracking.</p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <input className="store-field" placeholder="Enter your email or mobile number" value={email} onChange={(event) => setEmail(event.target.value)} />
              <input
                className="store-field"
                placeholder="Enter your password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <div className="text-right text-sm text-[#c5ed83]">Forgot password?</div>
              <button className="store-primary-btn w-full py-4 text-base">Login</button>
            </form>

            <div className="mt-6 flex items-center gap-4 text-sm text-white/34">
              <div className="h-px flex-1 bg-white/8" />
              Continue with
              <div className="h-px flex-1 bg-white/8" />
            </div>

            <div className="mt-5 flex gap-3">
              <button className="store-secondary-btn w-full">Google</button>
              <button className="store-secondary-btn w-full">Facebook</button>
            </div>

            <p className="mt-6 text-center text-sm text-white/54">
              New here?{" "}
              <Link to="/register" className="font-semibold text-[#c5ed83]">
                Create an account
              </Link>
            </p>
          </div>

          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(149,216,69,0.25),transparent_38%),linear-gradient(135deg,#111712,#0a0d0a)] p-8 lg:p-10">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(149,216,69,0.18),transparent_60%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="store-kicker">VR Technologies</div>
                <h2 className="mt-5 max-w-md text-4xl font-bold leading-tight text-white">Reliable refurbished tech, delivered with store-backed support.</h2>
              </div>

              <div className="mt-10 grid gap-4">
                {loginHighlights.map((item) => (
                  <div key={item.title} className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#89c73a]/14 p-2.5 text-[#c5ed83]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-white/54">{item.subtitle}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
