"use client";

import { useEffect, useState, useId } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { authService } from "@/lib/authService";
import { userService, type UserProfile, type ProviderProfile } from "@/lib/userService";
import ProfileImageUpload from "@/components/ProfileImageUpload";

const INDUSTRY_OPTIONS = [
  "Technology & Software",
  "Construction & Real Estate",
  "Healthcare & Medicine",
  "Education & Training",
  "Finance & Banking",
  "Retail & E-Commerce",
  "Manufacturing",
  "Agriculture & Food",
  "Transportation & Logistics",
  "Media & Entertainment",
  "Energy & Utilities",
  "Government & Public Sector",
  "Non-Profit & NGO",
  "Telecommunications",
  "Legal & Consulting",
  "Other (type below)",
];

const EMPTY_PROVIDER: ProviderProfile = {
  organizationName: "",
  industry: "",
  country: "",
  city: "",
  website: "",
  contactDetails: "",
};

export default function ProviderProfilePage() {
  const formId = useId();
  const [session, setSession] = useState<{ userId: string; role: string } | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<ProviderProfile>(EMPTY_PROVIDER);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // account edit state
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ fullName: "", phone: "" });
  const [savingAccount, setSavingAccount] = useState(false);

  // password state
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  // identity profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [industryDropdown, setIndustryDropdown] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  useEffect(() => {
    const s = authService.getSession();
    if (!s) return;
    setSession({ userId: s.userId, role: s.role });

    userService
      .getUser(s.userId)
      .then((u) => {
        setUser(u);
        setAccountForm({ fullName: u.fullName, phone: u.phone });
      })
      .finally(() => setLoadingUser(false));

    userService
      .getIdentityProfile(s.role, s.userId)
      .then((p) => {
        const ep = p as ProviderProfile;
        setProfile(ep);
        const ind = ep.industry || "";
        if (INDUSTRY_OPTIONS.includes(ind)) {
          setIndustryDropdown(ind);
          setShowCustomIndustry(false);
        } else if (ind) {
          setIndustryDropdown("Other (type below)");
          setCustomIndustry(ind);
          setShowCustomIndustry(true);
        }
      })
      .catch(() => setProfile(EMPTY_PROVIDER))
      .finally(() => setLoadingProfile(false));
  }, []);

  async function saveAccount() {
    if (!session) return;
    setSavingAccount(true);
    try {
      const updated = await userService.updateUser(session.userId, accountForm);
      setUser(updated);
      setEditingAccount(false);
      toast.success("Account updated successfully.");
    } catch {
      toast.error("Failed to update account.");
    } finally {
      setSavingAccount(false);
    }
  }

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (!session) return;
    setSavingPw(true);
    try {
      await userService.changePassword(session.userId, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed successfully.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to change password.";
      toast.error(msg);
    } finally {
      setSavingPw(false);
    }
  }

  async function saveProfile() {
    if (!session) return;
    const finalIndustry = showCustomIndustry ? customIndustry.trim() : industryDropdown === "Other (type below)" ? customIndustry.trim() : industryDropdown;
    const payload: ProviderProfile = { ...profile, industry: finalIndustry };
    setSavingProfile(true);
    try {
      const updated = await userService.saveIdentityProfile(session.role, session.userId, payload);
      setProfile(updated as ProviderProfile);
      setEditingProfile(false);
      toast.success("Profile saved successfully.");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition";
  const inputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
  };
  const readStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-neutral-50)",
    color: "var(--color-foreground)",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>My Profile</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          View and manage your account details and identity profile.
        </p>
      </div>

      {session && user && (
        <ProfileImageUpload
          userId={session.userId}
          currentImageUrl={user.profileImageUrl ?? null}
          fullName={user.fullName}
          onUploadSuccess={(url) => {
            setUser((prev) => prev ? { ...prev, profileImageUrl: url } : prev);
          }}
        />
      )}

      {/* Account Information */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            Account Information
          </h5>
          {!editingAccount && (
            <button
              onClick={() => setEditingAccount(true)}
              className="text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              Edit
            </button>
          )}
        </div>

        {loadingUser ? (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Full Name
              </label>
              <input
                id={`${formId}-name`}
                type="text"
                className={inputClass}
                style={editingAccount ? inputStyle : readStyle}
                readOnly={!editingAccount}
                value={editingAccount ? accountForm.fullName : (user?.fullName || "")}
                onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Email
              </label>
              <input
                type="email"
                className={inputClass}
                style={readStyle}
                readOnly
                value={user?.email || ""}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Phone
              </label>
              <input
                type="tel"
                className={inputClass}
                style={editingAccount ? inputStyle : readStyle}
                readOnly={!editingAccount}
                value={editingAccount ? accountForm.phone : (user?.phone || "")}
                onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Role
                </label>
                <input type="text" className={inputClass} style={readStyle} readOnly value="Project Provider" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Status
                </label>
                <input
                  type="text"
                  className={inputClass}
                  style={readStyle}
                  readOnly
                  value={user?.active ? "Active" : "Inactive"}
                />
              </div>
            </div>

            {editingAccount && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveAccount}
                  disabled={savingAccount}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {savingAccount ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditingAccount(false);
                    setAccountForm({ fullName: user?.fullName || "", phone: user?.phone || "" });
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", backgroundColor: "transparent" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Change Password */}
      <motion.div
        id="password"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
          Change Password
        </h5>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
              Current Password
            </label>
            <input
              type="password"
              className={inputClass}
              style={inputStyle}
              placeholder="Enter current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
              New Password
            </label>
            <input
              type="password"
              className={inputClass}
              style={inputStyle}
              placeholder="Min 8 chars, uppercase, lowercase, number, special"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              className={inputClass}
              style={inputStyle}
              placeholder="Repeat new password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <div>
            <button
              onClick={changePassword}
              disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Provider Identity Profile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>
              Organization Profile
            </h5>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Your identity as a Project Provider.
            </p>
          </div>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              {profile.organizationName ? "Edit" : "Set Up"}
            </button>
          )}
        </div>

        {loadingProfile ? (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Organization Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                style={editingProfile ? inputStyle : readStyle}
                readOnly={!editingProfile}
                placeholder="e.g. Acme Corp"
                value={profile.organizationName}
                onChange={(e) => setProfile((p) => ({ ...p, organizationName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Industry / Field
                </label>
                {editingProfile ? (
                  <>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none appearance-none pr-8"
                        style={inputStyle}
                        value={industryDropdown}
                        onChange={(e) => {
                          setIndustryDropdown(e.target.value);
                          setShowCustomIndustry(e.target.value === "Other (type below)");
                          if (e.target.value !== "Other (type below)") {
                            setProfile((p) => ({ ...p, industry: e.target.value }));
                          }
                        }}
                      >
                        <option value="">— Select industry —</option>
                        {INDUSTRY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: "var(--color-muted-foreground)" }} />
                    </div>
                    {showCustomIndustry && (
                      <input type="text" className={inputClass} style={inputStyle}
                        placeholder="Type your industry"
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)} />
                    )}
                  </>
                ) : (
                  <input type="text" className={inputClass} style={readStyle} readOnly value={profile.industry || ""} />
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Website
                </label>
                <input
                  type="text"
                  className={inputClass}
                  style={editingProfile ? inputStyle : readStyle}
                  readOnly={!editingProfile}
                  placeholder="https://example.com"
                  value={profile.website}
                  onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  Country
                </label>
                <input
                  type="text"
                  className={inputClass}
                  style={editingProfile ? inputStyle : readStyle}
                  readOnly={!editingProfile}
                  placeholder="e.g. Rwanda"
                  value={profile.country}
                  onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                  City
                </label>
                <input
                  type="text"
                  className={inputClass}
                  style={editingProfile ? inputStyle : readStyle}
                  readOnly={!editingProfile}
                  placeholder="e.g. Kigali"
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Contact Details
              </label>
              <input
                type="text"
                className={inputClass}
                style={editingProfile ? inputStyle : readStyle}
                readOnly={!editingProfile}
                placeholder="e.g. info@acme.com or +250 700 000 000"
                value={profile.contactDetails}
                onChange={(e) => setProfile((p) => ({ ...p, contactDetails: e.target.value }))}
              />
            </div>

            {editingProfile && (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile || !profile.organizationName.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", backgroundColor: "transparent" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

