import { FormEvent, useState } from "react";
import { CheckCircle2, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "api/client";
import { useAuthStore } from "store/authStore";
import { getApiErrorMessage } from "../utils/api";

const registerHighlights = [
  { title: "6 Months Warranty", subtitle: "On all products", icon: ShieldCheck },
  { title: "Quality Checked", subtitle: "100+ tests passed", icon: CheckCircle2 },
  { title: "7 Day Easy Returns", subtitle: "No questions asked", icon: Undo2 },
  { title: "Fast Delivery", subtitle: "Across Hyderabad", icon: Truck }
] as const;

export function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const user = await authApi.register(form);
      setUser(user);
      toast.success("Account created");
      navigate("/");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10">
      <div className="store-dark-panel overflow-hidden">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-[rgba(30,58,138,0.08)] p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="flex gap-2 rounded-xl border border-[rgba(30,58,138,0.12)] bg-[#f8fbff] p-1">
              <Link to="/login" className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-slate-500 transition hover:text-[#1e3a8a]">
                Login
              </Link>
              <Link to="/register" className="flex-1 rounded-lg bg-[#1e3a8a] px-4 py-2.5 text-center text-sm font-semibold text-white">
                Register
              </Link>
            </div>

            <div className="mt-8">
              <h1 className="text-3xl font-bold text-slate-950">Create Account</h1>
              <p className="mt-2 text-slate-600">Start shopping with a synced wishlist, cart, and order journey.</p>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <input
                className="store-field"
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                className="store-field"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
              <input
                className="store-field"
                placeholder="Phone"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
              <input
                className="store-field"
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <button className="store-primary-btn w-full py-4 text-base">Create account</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link to="/login" className="font-semibold text-[#1e3a8a]">
                Login
              </Link>
            </p>
          </div>

          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_38%),linear-gradient(135deg,#eff5ff,#dce8ff)] p-8 lg:p-10">
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.12),transparent_60%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="store-kicker">Why create an account</div>
                <h2 className="mt-5 max-w-md text-4xl font-bold leading-tight text-slate-950">Track orders, save favorites, and finish checkout faster.</h2>
              </div>

              <div className="mt-10 grid gap-4">
                {registerHighlights.map((item) => (
                  <div key={item.title} className="rounded-[1.2rem] border border-[rgba(30,58,138,0.08)] bg-white/80 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#edf4ff] p-2.5 text-[#1e3a8a]">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{item.subtitle}</div>
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
