"use client";

import { useEffect, useState, useId } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { authService } from "@/lib/authService";
import { userService, type UserProfile, type WorkerProfile } from "@/lib/userService";
import ProfileImageUpload from "@/components/ProfileImageUpload";

const FIELD_OPTIONS = [
  "Full-Stack Development",
  "Frontend Development",
  "Backend Development",
  "Mobile Development (iOS/Android)",
  "UI/UX Design",
  "Data Science & Analytics",
  "Machine Learning / AI",
  "DevOps & Cloud Engineering",
  "Cybersecurity",
  "Database Administration",
  "Quality Assurance & Testing",
  "Project Management",
  "Product Management",
  "Business Analysis",
  "Network Engineering",
  "Embedded Systems",
  "Blockchain Development",
  "Game Development",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Architecture & Design",
  "Interior Design",
  "Construction & Building",
  "Plumbing & HVAC",
  "Marketing & Digital Marketing",
  "Content Creation & Copywriting",
  "Finance & Accounting",
  "Human Resources",
  "Legal & Compliance",
  "Healthcare Services",
  "Education & Training",
  "Logistics & Supply Chain",
  "Other (type below)",
];

interface ExtendedWorkerProfile extends WorkerProfile {
  linkedinUrl?: string;
  githubUrl?: string;
  otherProfileUrl?: string;
}

const EMPTY_WORKER: ExtendedWorkerProfile = {
  professionalTitle: "",
  country: "",
  city: "",
  specialization: "",
  linkedinUrl: "",
  githubUrl: "",
  otherProfileUrl: "",
};

export default function WorkerProfilePage() {
  const formId = useId();
  const [session, setSession] = useState<{ userId: string; role: string } | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<ExtendedWorkerProfile>(EMPTY_WORKER);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [editingAccount, setEditingAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ fullName: "", phone: "" });
  const [savingAccount, setSavingAccount] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [fieldDropdown, setFieldDropdown] = useState("");
  const [customField, setCustomField] = useState("");
  const [showCustom, setShowCustom] = useState(false);

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
        const ep = p as ExtendedWorkerProfile;
        setProfile(ep);
        const spec = ep.specialization || "";
        if (FIELD_OPTIONS.includes(spec)) {
          setFieldDropdown(spec);
          setShowCustom(false);
        } else if (spec) {
          setFieldDropdown("Other (type below)");
          setCustomField(spec);
          setShowCustom(true);
        }
      })
      .catch(() => setProfile(EMPTY_WORKER))
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
    const finalSpec = showCustom ? customField.trim() : fieldDropdown === "Other (type below)" ? customField.trim() : fieldDropdown;
    const payload: ExtendedWorkerProfile = { ...profile, specialization: finalSpec };
    setSavingProfile(true);
    try {
      const updated = await userService.saveIdentityProfile(session.role, session.userId, payload);
      setProfile(updated as ExtendedWorkerProfile);
      setEditingProfile(false);
      toast.success("Profile saved successfully.");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition";
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
          View and manage your account details and professional profile.
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
          <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>Account Information</h5>
          {!editingAccount && (
            <button onClick={() => setEditingAccount(true)} className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              Edit
            </button>
          )}
        </div>
        {loadingUser ? (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Full Name</label>
              <input id={`${formId}-name`} type="text" className={inputClass} style={editingAccount ? inputStyle : readStyle}
                readOnly={!editingAccount}
                value={editingAccount ? accountForm.fullName : (user?.fullName || "")}
                onChange={(e) => setAccountForm((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Email</label>
              <input type="email" className={inputClass} style={readStyle} readOnly value={user?.email || ""} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Phone</label>
              <input type="tel" className={inputClass} style={editingAccount ? inputStyle : readStyle}
                readOnly={!editingAccount}
                value={editingAccount ? accountForm.phone : (user?.phone || "")}
                onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Role</label>
                <input type="text" className={inputClass} style={readStyle} readOnly value="Worker" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Status</label>
                <input type="text" className={inputClass} style={readStyle} readOnly value={user?.active ? "Active" : "Inactive"} />
              </div>
            </div>
            {editingAccount && (
              <div className="flex gap-3 pt-1">
                <button onClick={saveAccount} disabled={savingAccount}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  {savingAccount ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={() => { setEditingAccount(false); setAccountForm({ fullName: user?.fullName || "", phone: user?.phone || "" }); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", backgroundColor: "transparent" }}>
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
        <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>Change Password</h5>
        <div className="grid grid-cols-1 gap-4">
          {(["currentPassword", "newPassword", "confirm"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                {k === "currentPassword" ? "Current Password" : k === "newPassword" ? "New Password" : "Confirm New Password"}
              </label>
              <input type="password" className={inputClass} style={inputStyle}
                placeholder={k === "newPassword" ? "Min 8 chars, uppercase, lowercase, number, special" : k === "confirm" ? "Repeat new password" : "Enter current password"}
                value={pwForm[k]}
                onChange={(e) => setPwForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <button onClick={changePassword} disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: "var(--color-primary)" }}>
              {savingPw ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Professional Profile */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-semibold" style={{ color: "var(--color-foreground)" }}>Professional Profile</h5>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
              Your identity as a Worker. Fill all fields to increase profile completion.
            </p>
          </div>
          {!editingProfile && (
            <button onClick={() => setEditingProfile(true)} className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              {profile.professionalTitle ? "Edit" : "Set Up"}
            </button>
          )}
        </div>

        {loadingProfile ? (
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Loading…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Professional Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input type="text" className={inputClass} style={editingProfile ? inputStyle : readStyle}
                readOnly={!editingProfile} placeholder="e.g. Software Engineer"
                value={profile.professionalTitle}
                onChange={(e) => setProfile((p) => ({ ...p, professionalTitle: e.target.value }))} />
            </div>

            {/* Field of Expertise — Dropdown + optional manual */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Field of Expertise
              </label>
              {editingProfile ? (
                <>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none appearance-none pr-8"
                      style={inputStyle}
                      value={fieldDropdown}
                      onChange={(e) => {
                        setFieldDropdown(e.target.value);
                        setShowCustom(e.target.value === "Other (type below)");
                        if (e.target.value !== "Other (type below)") {
                          setProfile((p) => ({ ...p, specialization: e.target.value }));
                        }
                      }}
                    >
                      <option value="">— Select a field —</option>
                      {FIELD_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--color-muted-foreground)" }} />
                  </div>
                  {showCustom && (
                    <input type="text" className={inputClass} style={inputStyle}
                      placeholder="Type your field of expertise"
                      value={customField}
                      onChange={(e) => setCustomField(e.target.value)} />
                  )}
                </>
              ) : (
                <input type="text" className={inputClass} style={readStyle} readOnly
                  value={profile.specialization || ""} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Country</label>
                <input type="text" className={inputClass} style={editingProfile ? inputStyle : readStyle}
                  readOnly={!editingProfile} placeholder="e.g. Rwanda"
                  value={profile.country}
                  onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>City</label>
                <input type="text" className={inputClass} style={editingProfile ? inputStyle : readStyle}
                  readOnly={!editingProfile} placeholder="e.g. Kigali"
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
              </div>
            </div>

            {/* Professional Links */}
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                LinkedIn Profile URL
              </label>
              <input type="url" className={inputClass} style={editingProfile ? inputStyle : readStyle}
                readOnly={!editingProfile} placeholder="https://linkedin.com/in/yourname"
                value={profile.linkedinUrl || ""}
                onChange={(e) => setProfile((p) => ({ ...p, linkedinUrl: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                GitHub Profile URL
              </label>
              <input type="url" className={inputClass} style={editingProfile ? inputStyle : readStyle}
                readOnly={!editingProfile} placeholder="https://github.com/yourname"
                value={profile.githubUrl || ""}
                onChange={(e) => setProfile((p) => ({ ...p, githubUrl: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                Other Portfolio / Profile URL <span style={{ color: "var(--color-muted-foreground)" }}>(optional)</span>
              </label>
              <input type="url" className={inputClass} style={editingProfile ? inputStyle : readStyle}
                readOnly={!editingProfile} placeholder="https://yourportfolio.com"
                value={profile.otherProfileUrl || ""}
                onChange={(e) => setProfile((p) => ({ ...p, otherProfileUrl: e.target.value }))} />
            </div>

            {editingProfile && (
              <div className="flex gap-3 pt-1">
                <button onClick={saveProfile} disabled={savingProfile || !profile.professionalTitle.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ backgroundColor: "var(--color-primary)" }}>
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
                <button onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)", backgroundColor: "transparent" }}>
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
