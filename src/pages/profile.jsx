import { useEffect, useState } from "react";
import api from "../api";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState(null); // { type, text }

  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data.user);
        setForm({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone,
        });
      })
      .catch(() =>
        setMessage({ type: "error", text: "Could not load your profile." })
      );
  }, []);

  const errorText = (error, fallback) =>
    error.response?.data?.message || fallback;

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields." });
      return;
    }

    try {
      const { data } = await api.patch("/auth/me", form);
      setUser(data.user);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (error) {
      setMessage({
        type: "error",
        text: errorText(error, "Could not update your profile."),
      });
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    const { currentPassword, newPassword, confirmPassword } = passwords;

    if (!currentPassword) {
      setMessage({ type: "error", text: "Enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ type: "success", text: "Password updated." });
    } catch (error) {
      setMessage({
        type: "error",
        text: errorText(error, "Could not update your password."),
      });
    }
  };

  const field = (label, key, type = "text") => (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={inputClass}
      />
    </div>
  );

  const passwordField = (label, key) => (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>
      <input
        type="password"
        value={passwords[key]}
        onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="page-container pb-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h1>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={saveProfile}
        className="mb-8 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-bold text-slate-900">Account details</h2>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className={`${inputClass} bg-slate-50 text-slate-500`}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {field("First name", "firstName")}
          {field("Last name", "lastName")}
        </div>
        {field("Phone", "phone", "tel")}

        <button
          type="submit"
          className="self-start rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
        >
          Save changes
        </button>
      </form>

      <form
        onSubmit={savePassword}
        className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-bold text-slate-900">Change password</h2>
        {passwordField("Current password", "currentPassword")}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {passwordField("New password", "newPassword")}
          {passwordField("Confirm new password", "confirmPassword")}
        </div>
        <button
          type="submit"
          className="self-start rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
        >
          Update password
        </button>
      </form>
    </div>
  );
}