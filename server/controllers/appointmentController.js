import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Appointment, { Settings } from "../models/Appointment.js";

/* Same slots as Date.jsx */
const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
];

const ACTIVE_STATUSES = ["Pending", "Confirmed", "Completed"];

/* Source of truth for prices. The client's price and total are never trusted. */
const PACKAGES = {
  "Solo Package": { price: 400, people: "Good for 1 person", duration: "1 hour" },
  "2-Gether Package": { price: 800, people: "Good for 2 people", duration: "1 hour" },
  "Crew Package": { price: 1500, people: "Good for 3–5 people", duration: "1 hour 30 minutes" },
  "Multi Package": { price: 2000, people: "Good for 6–8 people", duration: "1 hour 30 minutes" },
  "Universal Package": { price: 2500, people: "Good for 9–12 people", duration: "1 hour 30 minutes" },
};
const FREE_BACKDROPS = ["Purple", "Blue", "White", "Silver", "Brown"];
const EXTRA_BACKDROPS = ["Cream", "Black", "Light Pink", "Maroon", "Gold"];
const EXTRA_BACKDROP_FEE = 100;
const ALL_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];
const MAX_RESCHEDULES = 1; // matches CancelReschedule.jsx: once only
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/* Receipt images are saved here (server/uploads/receipts), never served publicly */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECEIPT_DIR = path.join(__dirname, "..", "uploads", "receipts");

/* Detect the real image type from the first bytes, not from the client's claim */
const imageExtension = (buffer) => {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(pngSignature)) {
    return ".png";
  }
  return null;
};

/* Studio-local date (Manila), not UTC, so "today" is right after midnight */
const STUDIO_TZ = process.env.STUDIO_TIMEZONE || "Asia/Manila";
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: STUDIO_TZ });

const toText = (value) => (typeof value === "string" ? value.trim() : "");

const toTextArray = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map((s) => s.trim())
    : [];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* Returns an error message, or null if the slot is valid */
const checkSlot = (date, time) => {
  if (!datePattern.test(date)) return "Invalid date.";
  if (date < today()) return "You cannot book a past date.";
  if (!TIME_SLOTS.includes(time)) return "Invalid time slot.";
  return null;
};

const SLOT_TAKEN = "That time slot is already booked. Please choose another.";

/* CREATE */
export const createAppointment = async (req, res) => {
  try {
    /* A booking arrives as multipart: JSON in "data" plus the receipt file */
    let body = req.body;
    if (typeof req.body.data === "string") {
      try {
        body = JSON.parse(req.body.data);
      } catch {
        return res.status(400).json({ message: "Invalid booking data." });
      }
    }

    const data = {
      packageName: toText(body.packageName),
      packagePrice: Number(body.packagePrice),
      packageIcon: toText(body.packageIcon) || "📷",
      packagePeople: toText(body.packagePeople),
      packageDuration: toText(body.packageDuration),
      date: toText(body.date),
      time: toText(body.time),
      firstName: toText(body.firstName),
      lastName: toText(body.lastName),
      email: toText(body.email),
      phone: toText(body.phone),
      smsConsent: body.smsConsent === true,
      gcashReference: toText(body.gcashReference),
      paymentMethod: toText(body.paymentMethod),
      freeBackdrops: toTextArray(body.freeBackdrops),
      extraBackdrops: toTextArray(body.extraBackdrops),
      total: Number(body.total) || 0,
    };

    if (
      !data.packageName ||
      !data.date ||
      !data.time ||
      !data.firstName ||
      !data.lastName ||
      !data.email ||
      !data.phone ||
      Number.isNaN(data.packagePrice) ||
      data.packagePrice < 0 ||
      data.total < 0
    ) {
      return res
        .status(400)
        .json({ message: "Please complete all required fields." });
    }

    const pkg = PACKAGES[data.packageName];
    if (!pkg) {
      return res.status(400).json({ message: "Unknown package." });
    }

    if (
      data.freeBackdrops.length < 1 ||
      data.freeBackdrops.length > 2 ||
      !data.freeBackdrops.every((b) => FREE_BACKDROPS.includes(b))
    ) {
      return res.status(400).json({ message: "Invalid free backdrop selection." });
    }

    if (
      data.extraBackdrops.length > 2 ||
      !data.extraBackdrops.every((b) => EXTRA_BACKDROPS.includes(b))
    ) {
      return res.status(400).json({ message: "Invalid extra backdrop selection." });
    }

    if (data.gcashReference && !/^\d{13}$/.test(data.gcashReference)) {
      return res
        .status(400)
        .json({ message: "GCash reference must be exactly 13 digits." });
    }

    /* Overwrite whatever price the client sent */
    data.packagePrice = pkg.price;
    data.packagePeople = pkg.people;
    data.packageDuration = pkg.duration;
    data.total =
      pkg.price + (data.extraBackdrops.length > 0 ? EXTRA_BACKDROP_FEE : 0);

    const slotError = checkSlot(data.date, data.time);
    if (slotError) return res.status(400).json({ message: slotError });

    if (!["GCash", "Cash"].includes(data.paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    if (data.paymentMethod === "GCash" && (!req.file || !data.gcashReference)) {
      return res.status(400).json({
        message: "A GCash receipt image and reference number are required.",
      });
    }

    let receiptName = "";
    if (req.file) {
      const extension = imageExtension(req.file.buffer);
      if (!extension) {
        return res
          .status(400)
          .json({ message: "Receipt must be a PNG or JPEG image." });
      }
      receiptName = `${crypto.randomUUID()}${extension}`;
    }

    const appointment = await Appointment.create({
      gcashReceipt: receiptName,
      ...data,
      user: req.user._id, // always from the token, never from the body
      status: "Pending",
      rescheduleCount: 0,
    });

    if (receiptName) {
      try {
        await fs.mkdir(RECEIPT_DIR, { recursive: true });
        await fs.writeFile(path.join(RECEIPT_DIR, receiptName), req.file.buffer);
      } catch (writeError) {
        await Appointment.findByIdAndDelete(appointment._id);
        throw writeError;
      }
    }

    res.status(201).json({ appointment });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.gcashReference) {
        return res.status(409).json({
          message: "That GCash reference number has already been used.",
        });
      }
      return res.status(409).json({ message: SLOT_TAKEN });
    }
    console.error("Create appointment error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* READ: booked times for one date (public, times only) */
export const getBookedSlots = async (req, res) => {
  try {
    const date = toText(req.query.date);

    if (!datePattern.test(date)) {
      return res.status(400).json({ message: "Invalid date." });
    }

    const booked = await Appointment.find({
      date,
      status: { $in: ACTIVE_STATUSES },
    }).select("time -_id");

    res.json({ date, bookedTimes: booked.map((a) => a.time) });
  } catch (error) {
    console.error("Booked slots error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* READ: my appointments */
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error("My appointments error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* READ: all appointments (admin) with search + pagination */
export const getAllAppointments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const filter = {};

    const status = toText(req.query.status);
    if (ALL_STATUSES.includes(status)) filter.status = status;

    const search = toText(req.query.search);
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { firstName: pattern },
        { lastName: pattern },
        { email: pattern },
        { packageName: pattern },
        { phone: pattern },
        { gcashReference: pattern },
        { date: pattern },
      ];
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    res.json({
      appointments,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("All appointments error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* UPDATE: customer reschedules their own appointment */
export const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id." });
    }

    const appointment = await Appointment.findById(id);

    if (!appointment || !appointment.user.equals(req.user._id)) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (!["Pending", "Confirmed"].includes(appointment.status)) {
      return res
        .status(400)
        .json({ message: "This appointment can no longer be rescheduled." });
    }

    if (appointment.rescheduleCount >= MAX_RESCHEDULES) {
      return res
        .status(400)
        .json({ message: "Reschedule limit reached for this appointment." });
    }

    const date = toText(req.body.date);
    const time = toText(req.body.time);

    const slotError = checkSlot(date, time);
    if (slotError) return res.status(400).json({ message: slotError });

    if (date === appointment.date && time === appointment.time) {
      return res
        .status(400)
        .json({ message: "That is already your current schedule." });
    }

    appointment.date = date;
    appointment.time = time;
    appointment.rescheduleCount += 1;
    await appointment.save();

    res.json({ appointment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: SLOT_TAKEN });
    }
    console.error("Reschedule error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* UPDATE: cancel (owner or admin) */
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id." });
    }

    const appointment = await Appointment.findById(id);
    const isOwner = appointment?.user.equals(req.user._id);

    if (!appointment || (!isOwner && req.user.role !== "admin")) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (["Cancelled", "Completed"].includes(appointment.status)) {
      return res.status(400).json({
        message: `A ${appointment.status.toLowerCase()} appointment cannot be cancelled.`,
      });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.json({ appointment });
  } catch (error) {
    console.error("Cancel error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* UPDATE: admin changes status (approve, complete, cancel) */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = toText(req.body.status);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id." });
    }

    if (!ALL_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    appointment.status = status;
    await appointment.save();

    res.json({ appointment });
  } catch (error) {
    /* Re-activating a cancelled appointment can hit the slot index */
    if (error.code === 11000) {
      return res.status(409).json({ message: SLOT_TAKEN });
    }
    console.error("Status update error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* DELETE (admin) */
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id." });
    }

    const deleted = await Appointment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found." });
    }

    if (deleted.gcashReceipt) {
      await fs
        .unlink(path.join(RECEIPT_DIR, deleted.gcashReceipt))
        .catch(() => {});
    }

    res.json({ message: "Appointment deleted." });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* ---------- STUDIO SETTINGS ---------- */

const TEXT_SETTINGS = [
  "studioName",
  "contactEmail",
  "contactPhone",
  "address",
  "openTime",
  "closeTime",
  "advanceBooking",
  "gcashName",
  "gcashNumber",
];

const formatSettings = (doc) => ({
  ...Object.fromEntries(TEXT_SETTINGS.map((field) => [field, doc[field]])),
  emailAlerts: doc.emailAlerts,
});

/* READ: public, customers need the GCash details and studio info */
export const getSettings = async (req, res) => {
  try {
    const doc = await Settings.findOneAndUpdate(
      { key: "studio" },
      { $setOnInsert: { key: "studio" } },
      { upsert: true, new: true }
    );

    res.json({ settings: formatSettings(doc) });
  } catch (error) {
    console.error("Get settings error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* UPDATE: admin only */
export const updateSettings = async (req, res) => {
  try {
    const changes = {};

    for (const field of TEXT_SETTINGS) {
      if (req.body[field] === undefined) continue;

      const value = toText(req.body[field]);
      if (!value || value.length > 200) {
        return res.status(400).json({ message: `Invalid value for ${field}.` });
      }
      changes[field] = value;
    }

    if (req.body.emailAlerts !== undefined) {
      if (typeof req.body.emailAlerts !== "boolean") {
        return res.status(400).json({ message: "Invalid value for emailAlerts." });
      }
      changes.emailAlerts = req.body.emailAlerts;
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const field of ["openTime", "closeTime"]) {
      if (changes[field] && !timePattern.test(changes[field])) {
        return res.status(400).json({ message: `Invalid time for ${field}.` });
      }
    }

    if (
      changes.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.contactEmail)
    ) {
      return res.status(400).json({ message: "Invalid contact email." });
    }

    const doc = await Settings.findOneAndUpdate(
      { key: "studio" },
      { $set: changes },
      { upsert: true, new: true }
    );

    res.json({ settings: formatSettings(doc) });
  } catch (error) {
    console.error("Update settings error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* READ: dashboard numbers across ALL appointments (admin) */
export const getAppointmentStats = async (req, res) => {
  try {
    const [counts] = await Appointment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $in: ["$status", ["Pending", "Confirmed"]] }, 1, 0],
            },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
          revenue: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Confirmed", "Completed"]] },
                "$total",
                0,
              ],
            },
          },
        },
      },
    ]);

    res.json({
      stats: {
        total: counts?.total || 0,
        active: counts?.active || 0,
        cancelled: counts?.cancelled || 0,
        revenue: counts?.revenue || 0,
      },
    });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* READ: receipt image (the booking's owner or an admin only) */
export const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid appointment id." });
    }

    const appointment = await Appointment.findById(id).select(
      "user gcashReceipt"
    );
    const isOwner = appointment?.user.equals(req.user._id);

    if (
      !appointment ||
      !appointment.gcashReceipt ||
      (!isOwner && req.user.role !== "admin")
    ) {
      return res.status(404).json({ message: "Receipt not found." });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.sendFile(appointment.gcashReceipt, { root: RECEIPT_DIR }, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({ message: "Receipt file not found." });
      }
    });
  } catch (error) {
    console.error("Receipt error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};