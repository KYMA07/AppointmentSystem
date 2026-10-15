import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const formatUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

export const register = async (req, res) => {
  try {
    const clean = (value) => (typeof value === "string" ? value.trim() : "");

    const firstName = clean(req.body.firstName);
    const lastName = clean(req.body.lastName);
    const phone = clean(req.body.phone);
    const email = clean(req.body.email).toLowerCase();
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!firstName || !lastName || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Please complete all required fields." });
    }

    if (
      firstName.length > 50 ||
      lastName.length > 50 ||
      phone.length > 20 ||
      email.length > 100
    ) {
      return res.status(400).json({ message: "One or more fields are too long." });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }

    if (password.length < 8 || password.length > 72) {
      return res
        .status(400)
        .json({ message: "Password must be 8 to 72 characters." })
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({
        message: "Password must include at least one letter and one number.",
      });
    }

    if (!/^(09\d{9}|\+639\d{9})$/.test(phone.replace(/[\s-]/g, ""))) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });

    if (existing) {
      return res
        .status(409)
        .json({ message: "That email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashed,
    });

    res.status(201).json({
      token: createToken(user),
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "That email is already registered." });
    }
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

export const getMe = (req, res) => {
  res.json({ user: formatUser(req.user) });
};

export const login = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter your email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    /*
      Same message for a wrong email and a wrong password.
      This avoids telling an attacker which emails exist.
    */
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      token: createToken(user),
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* UPDATE: own profile (email cannot be changed here) */
export const updateMe = async (req, res) => {
  try {
    const clean = (value) => (typeof value === "string" ? value.trim() : "");

    const firstName = clean(req.body.firstName);
    const lastName = clean(req.body.lastName);
    const phone = clean(req.body.phone);

    if (!firstName || !lastName || !phone) {
      return res
        .status(400)
        .json({ message: "Please complete all required fields." });
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ message: "One or more fields are too long." });
    }

    if (!/^(09\d{9}|\+639\d{9})$/.test(phone.replace(/[\s-]/g, ""))) {
      return res.status(400).json({ message: "Invalid phone number." });
    }

    const user = await User.findById(req.user._id);
    user.firstName = firstName;
    user.lastName = lastName;
    user.phone = phone;
    await user.save();

    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

/* UPDATE: change own password (customer or admin) */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res
        .status(400)
        .json({ message: "Please enter your current and new password." });
    }

    if (
      newPassword.length < 8 ||
      newPassword.length > 72 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      return res.status(400).json({
        message:
          "New password must be 8 to 72 characters with a letter and a number.",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        message: "New password must be different from the current one.",
      });
    }

    const user = await User.findById(req.user._id);

    /* 400, not 401: a 401 would make the client think the session expired */
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated." });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};