import { useEffect, useState } from "react";

export default function AdminSettings({ studioSettings, setStudioSettings }) {
  // Local state to handle form edits before saving
  const [formData, setFormData] = useState({
    studioName: "Snap Yourself Studio",
    contactEmail: "hello@snapyourself.com",
    contactPhone: "0912 345 6789",
    address: "123 Photography Lane, Metro Manila",
    openTime: "09:00",
    closeTime: "18:00",
    advanceBooking: "24",
    gcashName: "Snap Yourself Studio",
    gcashNumber: "09123456789",
    emailAlerts: true,
  });

  // Security form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync with global settings when the component mounts or settings change
  useEffect(() => {
    if (studioSettings) {
      setFormData(studioSettings);
    }
  }, [studioSettings]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setStudioSettings(formData);
    alert("✅ Studio profile updated successfully!");
  };

  const handleSaveBookingRules = (e) => {
    e.preventDefault();
    setStudioSettings(formData);
    alert("✅ Booking rules and hours updated!");
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    setStudioSettings(formData);
    alert("✅ Payment settings saved successfully!");
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    
    // 1. Verify they entered a current password
    if (!currentPassword) {
      alert("⚠️ Please enter your current password to authorize this change.");
      return;
    }

    // 2. Enforce minimum length
    if (newPassword.length < 8) {
      alert("⚠️ Your new password must be at least 8 characters long.");
      return;
    }

    // 3. Verify passwords match
    if (newPassword !== confirmPassword) {
      alert("⚠️ New passwords do not match. Please try again.");
      return;
    }

    /* 
      In a real backend, you would send {currentPassword, newPassword} to an API here.
      For local development, we just reset the form and show success.
    */
    alert("✅ Admin password updated successfully!");
    
    // Clear the fields for security
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="page-container pb-20">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-label">ADMINISTRATION</div>
        <h1 className="page-title">Platform Settings</h1>
        <p className="page-description">
          Manage your studio preferences, operating hours, payment details, and security.
        </p>
      </div>

      <div className="mx-auto max-w-4xl flex flex-col gap-8">
        
        {/* 1. STUDIO PROFILE CARD */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Studio Profile</h2>
            <p className="text-sm text-slate-500 mt-1">Public information displayed to your customers.</p>
          </div>
          
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Studio Name</label>
                <input
                  type="text"
                  value={formData.studioName}
                  onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Contact Number</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Studio Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* 2. AVAILABILITY & BOOKING RULES */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Availability & Rules</h2>
            <p className="text-sm text-slate-500 mt-1">Configure when customers can book appointments.</p>
          </div>
          
          <form onSubmit={handleSaveBookingRules} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Opening Time</label>
                <input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Closing Time</label>
                <input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Min. Notice (Hours)</label>
                <select
                  value={formData.advanceBooking}
                  onChange={(e) => setFormData({ ...formData, advanceBooking: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                >
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="48">48 Hours</option>
                </select>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                Save Rules
              </button>
            </div>
          </form>
        </div>

        {/* 3. PAYMENT SETTINGS CARD */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Payment Configuration</h2>
            <p className="text-sm text-slate-500 mt-1">Update the GCash details shown to customers during checkout.</p>
          </div>
          
          <form onSubmit={handleSavePayment} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  GCash Receiver Name
                </label>
                <input
                  type="text"
                  value={formData.gcashName}
                  onChange={(e) => setFormData({ ...formData, gcashName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  GCash Mobile Number
                </label>
                <input
                  type="text"
                  value={formData.gcashNumber}
                  onChange={(e) => setFormData({ ...formData, gcashNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <button type="submit" className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                Save Payment Details
              </button>
            </div>
          </form>
        </div>

        {/* 4. NOTIFICATIONS CARD */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500 mt-1">Manage how you receive updates about new bookings.</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Email Alerts</p>
              <p className="text-sm text-slate-500">Receive an email when a new appointment is booked or cancelled.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input 
                type="checkbox" 
                className="peer sr-only" 
                checked={formData.emailAlerts}
                onChange={(e) => {
                  const updatedData = { ...formData, emailAlerts: e.target.checked };
                  setFormData(updatedData);
                  setStudioSettings(updatedData);
                }}
              />
              <div className="peer h-7 w-14 rounded-full bg-slate-200 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-sky-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-100"></div>
            </label>
          </div>
        </div>

        {/* 5. SECURITY CARD */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">Security</h2>
            <p className="text-sm text-slate-500 mt-1">Update your admin password. Requires your current password to verify.</p>
          </div>
          
          <form onSubmit={handleSaveSecurity} className="flex flex-col gap-5">
            
            {/* CURRENT PASSWORD - Full Width */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full sm:w-1/2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                required
              />
            </div>

            <div className="my-2 border-t border-slate-100" />

            {/* NEW & CONFIRM PASSWORD - Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button 
                type="submit" 
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}   