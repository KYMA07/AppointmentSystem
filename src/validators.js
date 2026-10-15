const namePattern = /^\p{L}[\p{L}\s.'-]*$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(09\d{9}|\+639\d{9})$/;

export const validateName = (value, label) => {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2) return `${label} must be at least 2 characters.`;
  if (v.length > 50) return `${label} is too long.`;
  if (!namePattern.test(v))
    return `${label} can only contain letters, spaces, . ' and -.`;
  return "";
};

export const validateEmail = (value) => {
  const v = value.trim();
  if (!v) return "Email is required.";
  if (!emailPattern.test(v)) return "Enter a valid email address.";
  return "";
};

export const validatePhone = (value) => {
  const v = value.replace(/[\s-]/g, "");
  if (!v) return "Phone number is required.";
  if (!phonePattern.test(v)) return "Use a PH mobile number like 09123456789.";
  return "";
};

export const validatePassword = (value) => {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value))
    return "Use at least one letter and one number.";
  return "";
};

export const validateConfirm = (password, confirm) => {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return "";
};

/* Keep only fields that actually have an error */
const compact = (errors) =>
  Object.fromEntries(Object.entries(errors).filter(([, message]) => message));

export const validateCustomer = ({ firstName, lastName, email, phone }) =>
  compact({
    firstName: validateName(firstName, "First name"),
    lastName: validateName(lastName, "Last name"),
    email: validateEmail(email),
    phone: validatePhone(phone),
  });

export const validateRegister = (values) =>
  compact({
    ...validateCustomer(values),
    password: validatePassword(values.password),
    confirmPassword: validateConfirm(values.password, values.confirmPassword),
  });