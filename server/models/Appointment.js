import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageName: { type: String, required: true },
    packagePrice: { type: Number, required: true },
    packageIcon: { type: String, default: "📷" },
    packagePeople: { type: String, default: "" },
    packageDuration: { type: String, default: "" },

    date: { type: String, required: true },
    time: { type: String, required: true },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    smsConsent: { type: Boolean, default: false },
    gcashReference: { type: String, default: "" },
    gcashReceipt: { type: String, default: "" }, // saved file name, never sent to clients

    paymentMethod: { type: String, default: "" },
    freeBackdrops: { type: [String], default: [] },
    extraBackdrops: { type: [String], default: [] },
    total: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Cancelled"],
      default: "Pending",
    },
    rescheduleCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.gcashReceipt; // clients only get hasReceipt
        return ret;
      },
    },
  }
);

/*
  One confirmed appointment per date and time.
  Cancelled appointments do not block the slot.
*/
appointmentSchema.index(
  { date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["Pending", "Confirmed", "Completed"] },
    },
  }
);

/* A GCash reference number can only be used once (blank values are ignored) */
appointmentSchema.index(
  { gcashReference: 1 },
  {
    unique: true,
    partialFilterExpression: { gcashReference: { $gt: "" } },
  }
);

appointmentSchema.virtual("hasReceipt").get(function () {
  return Boolean(this.gcashReceipt);
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

/* One document holds the studio settings (shown to customers, edited by admin) */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "studio", unique: true },
    studioName: { type: String, default: "Snap Yourself Studio" },
    contactEmail: { type: String, default: "hello@snapyourself.com" },
    contactPhone: { type: String, default: "0912 345 6789" },
    address: { type: String, default: "123 Photography Lane, Metro Manila" },
    openTime: { type: String, default: "09:00" },
    closeTime: { type: String, default: "18:00" },
    advanceBooking: { type: String, default: "24" },
    gcashName: { type: String, default: "Snap Yourself Studio" },
    gcashNumber: { type: String, default: "09123456789" },
    emailAlerts: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);