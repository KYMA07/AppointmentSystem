import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const run = async () => {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log("Admin already exists:", email);
  } else {
    await User.create({
      firstName: "Studio",
      lastName: "Admin",
      email,
      phone: "00000000000",
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    });
    console.log("Admin created:", email);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});