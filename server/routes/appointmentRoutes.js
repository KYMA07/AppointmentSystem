import express from "express";
import multer from "multer";
import {
  createAppointment,
  getBookedSlots,
  getMyAppointments,
    getAllAppointments,
  getAppointmentStats,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getReceipt,
} from "../controllers/appointmentController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

/* Receipt upload: kept in memory, checked, then saved by the controller */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ["image/png", "image/jpeg"].includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("INVALID_FILE_TYPE")),
});

const router = express.Router();

/* Public: times only, so the date picker can grey out taken slots */
router.get("/booked", getBookedSlots);

/* Customer */
router.post("/", protect, upload.single("gcashReceipt"), createAppointment);
router.get("/mine", protect, getMyAppointments);
router.patch("/:id/reschedule", protect, rescheduleAppointment);
router.patch("/:id/cancel", protect, cancelAppointment);
router.get("/:id/receipt", protect, getReceipt);

/* Admin */
router.get("/", protect, adminOnly, getAllAppointments);
router.get("/stats", protect, adminOnly, getAppointmentStats);
router.patch("/:id/status", protect, adminOnly, updateAppointmentStatus);
router.delete("/:id", protect, adminOnly, deleteAppointment);

export default router;