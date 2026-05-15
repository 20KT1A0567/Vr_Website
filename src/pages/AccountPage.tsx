import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit2, Home, Loader2, MapPin, Phone, Plus, Trash2, User, X } from "lucide-react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { customerApi } from "api/client";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { SectionHeader } from "components/ui/SectionHeader";
import { useAuthStore } from "store/authStore";
import { getApiErrorMessage } from "utils/api";
import type { UserAddress } from "types";
import { usePageMeta } from "../hooks/usePageMeta";

interface AddressFormState {
  label: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  defaultAddress: boolean;
}

const EMPTY_ADDRESS: AddressFormState = {
  label: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  defaultAddress: false
};

export function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  usePageMeta({ title: "My Account" });

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: customerApi.getProfile,
    enabled: Boolean(user)
  });
  const profile = profileQuery.data;

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });

  const [addressModal, setAddressModal] = useState<{ mode: "add" | "edit"; id?: number } | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>(EMPTY_ADDRESS);

  const updateProfileMutation = useMutation({
    mutationFn: customerApi.updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile"], updated);
      setEditingProfile(false);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update profile"))
  });

  const createAddressMutation = useMutation({
    mutationFn: customerApi.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAddressModal(null);
      toast.success("Address saved");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to save address"))
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AddressFormState }) =>
      customerApi.updateAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAddressModal(null);
      toast.success("Address updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update address"))
  });

  const deleteAddressMutation = useMutation({
    mutationFn: customerApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Address deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete address"))
  });

  if (!user) return <Navigate to="/login" replace />;

  function openAddAddress() {
    setAddressForm(EMPTY_ADDRESS);
    setAddressModal({ mode: "add" });
  }

  function openEditAddress(addr: UserAddress) {
    setAddressForm({
      label: addr.label,
      contactName: addr.contactName,
      contactPhone: addr.contactPhone,
      contactEmail: addr.contactEmail ?? "",
      address: addr.address,
      city: addr.city ?? "",
      state: addr.state ?? "",
      postalCode: addr.postalCode ?? "",
      defaultAddress: addr.defaultAddress
    });
    setAddressModal({ mode: "edit", id: addr.id });
  }

  function submitAddress() {
    if (addressModal?.mode === "edit" && addressModal.id != null) {
      updateAddressMutation.mutate({ id: addressModal.id, payload: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  }

  const addressPending = createAddressMutation.isPending || updateAddressMutation.isPending;

  return (
    <div className="vr-page-shell space-y-6">
      <SectionHeader eyebrow="My Account" title="Profile & Settings" />

      {/* Profile card */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(30,58,138,0.08)] text-[var(--vr-primary)]">
              <User className="h-7 w-7" />
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--vr-text)]">{profile?.name ?? user.name}</div>
              <div className="text-sm text-[var(--vr-muted)]">{profile?.email ?? user.email ?? "No email set"}</div>
              {profile?.phone ? (
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--vr-muted)]">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </div>
              ) : null}
            </div>
          </div>
          {!editingProfile && (
            <button
              type="button"
              onClick={() => {
                setProfileForm({
                  name: profile?.name ?? user.name ?? "",
                  email: profile?.email ?? user.email ?? "",
                  phone: profile?.phone ?? ""
                });
                setEditingProfile(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--vr-border)] px-3 py-1.5 text-xs font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
        </div>

        {editingProfile && (
          <div className="mt-5 space-y-3 border-t border-[var(--vr-border)] pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Full Name *</label>
                <input
                  className="vr-input"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Email</label>
                <input
                  type="email"
                  className="vr-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((c) => ({ ...c, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Phone</label>
                <input
                  type="tel"
                  className="vr-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                disabled={!profileForm.name.trim() || updateProfileMutation.isPending}
                onClick={() => updateProfileMutation.mutate(profileForm)}
                icon={updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              >
                Save Changes
              </Button>
              <Button variant="secondary" onClick={() => setEditingProfile(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Addresses */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-base font-bold text-[var(--vr-text)]">Saved Addresses</div>
            <div className="mt-0.5 text-sm text-[var(--vr-muted)]">Manage delivery addresses for faster checkout</div>
          </div>
          <button
            type="button"
            onClick={openAddAddress}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vr-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--vr-primary-strong)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Address
          </button>
        </div>

        {profileQuery.isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--vr-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading addresses…
          </div>
        ) : (profile?.addresses ?? []).length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--vr-border)] p-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-[var(--vr-muted)]">No saved addresses yet</p>
            <button
              type="button"
              onClick={openAddAddress}
              className="mt-3 text-sm font-bold text-[var(--vr-primary)] underline-offset-2 hover:underline"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(profile?.addresses ?? []).map((addr) => (
              <div
                key={addr.id}
                className={`relative rounded-2xl border p-4 transition ${
                  addr.defaultAddress
                    ? "border-[rgba(30,58,138,0.25)] bg-[rgba(30,58,138,0.03)]"
                    : "border-[var(--vr-border)] bg-white"
                }`}
              >
                {addr.defaultAddress && (
                  <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-[var(--vr-primary)] px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <Home className="h-3 w-3" /> Default
                  </span>
                )}
                <div className="text-[13px] font-bold text-[var(--vr-text)]">{addr.label}</div>
                <div className="mt-1 text-xs text-[var(--vr-muted)]">{addr.contactName}</div>
                <div className="mt-0.5 text-xs text-[var(--vr-muted)]">{addr.contactPhone}</div>
                <div className="mt-1 text-xs leading-5 text-[var(--vr-text)]">
                  {addr.address}
                  {addr.city ? `, ${addr.city}` : ""}
                  {addr.state ? `, ${addr.state}` : ""}
                  {addr.postalCode ? ` – ${addr.postalCode}` : ""}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditAddress(addr)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--vr-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vr-text)] transition hover:border-[var(--vr-primary)] hover:text-[var(--vr-primary)]"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this address?")) {
                        deleteAddressMutation.mutate(addr.id);
                      }
                    }}
                    disabled={deleteAddressMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--vr-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vr-muted)] transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Address modal */}
      {addressModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-4 pb-4 sm:items-center sm:pb-0">
          <div className="w-full max-w-lg overflow-hidden rounded-[1.6rem] border border-[var(--vr-border)] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between border-b border-[var(--vr-border)] px-5 py-4">
              <div className="text-base font-bold text-[var(--vr-text)]">
                {addressModal.mode === "edit" ? "Edit Address" : "Add New Address"}
              </div>
              <button
                type="button"
                onClick={() => setAddressModal(null)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Label *</label>
                  <input
                    className="vr-input"
                    placeholder="Home, Office, etc."
                    value={addressForm.label}
                    onChange={(e) => setAddressForm((c) => ({ ...c, label: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Contact Name *</label>
                  <input
                    className="vr-input"
                    placeholder="Full name"
                    value={addressForm.contactName}
                    onChange={(e) => setAddressForm((c) => ({ ...c, contactName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Contact Phone *</label>
                  <input
                    type="tel"
                    className="vr-input"
                    placeholder="+91 98765 43210"
                    value={addressForm.contactPhone}
                    onChange={(e) => setAddressForm((c) => ({ ...c, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Email</label>
                  <input
                    type="email"
                    className="vr-input"
                    placeholder="contact@email.com"
                    value={addressForm.contactEmail}
                    onChange={(e) => setAddressForm((c) => ({ ...c, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Address *</label>
                  <textarea
                    className="vr-input min-h-[72px] py-3"
                    placeholder="Street address, building, area…"
                    value={addressForm.address}
                    onChange={(e) => setAddressForm((c) => ({ ...c, address: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">City</label>
                  <input
                    className="vr-input"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((c) => ({ ...c, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">State</label>
                  <input
                    className="vr-input"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((c) => ({ ...c, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--vr-muted)]">Postal Code</label>
                  <input
                    className="vr-input"
                    placeholder="500001"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm((c) => ({ ...c, postalCode: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-3">
                  <input
                    id="default-addr"
                    type="checkbox"
                    checked={addressForm.defaultAddress}
                    onChange={(e) => setAddressForm((c) => ({ ...c, defaultAddress: e.target.checked }))}
                    className="h-4 w-4 rounded border-[var(--vr-border)] accent-[var(--vr-primary)]"
                  />
                  <label htmlFor="default-addr" className="text-xs font-semibold text-[var(--vr-text)]">
                    Set as default address
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-[var(--vr-border)] px-5 py-4">
              <Button
                disabled={
                  !addressForm.label.trim() ||
                  !addressForm.contactName.trim() ||
                  !addressForm.contactPhone.trim() ||
                  !addressForm.address.trim() ||
                  addressPending
                }
                onClick={submitAddress}
                icon={addressPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
              >
                {addressModal.mode === "edit" ? "Update Address" : "Save Address"}
              </Button>
              <Button variant="secondary" onClick={() => setAddressModal(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
