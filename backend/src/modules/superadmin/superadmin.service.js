import { userRepository } from "../user/user.repository.js";
import { otpRepository } from "../otp/otp.repository.js";
import { hashCode } from "../otp/Otp.js";
// import { env } from "../../config/env.js";
import { generateOtpCode, sendOtpEmail } from "../../utils/email.service.js";

export async function loginStep1(email, password) {
  const user = await userRepository.findByEmail(email, "+passwordHash role emailVerified isBlocked isDeleted");
  if (!user) throw new Error("Invalid credentials");
  if (user.role !== "superadmin") throw new Error("Access denied: Super admin account required");

  const match = await user.comparePassword(password);
  if (!match) throw new Error("Invalid credentials");
  if (user.isDeleted) throw new Error("Account has been deactivated");
  if (user.isBlocked) throw new Error("Account is blocked");
  if (!user.emailVerified) throw new Error("Email not verified");

  const code = generateOtpCode();
  await otpRepository.createOtp({
    email,
    codeHash: hashCode(code),
    purpose: "login_admin",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOtpEmail(email, code, "Super Admin Login OTP Code");
  return { message: "OTP sent to your admin email" };
}

export async function loginStep2(email, code) {
  const user = await userRepository.findByEmail(email, "+passwordHash role emailVerified isBlocked isDeleted");
  if (!user || user.role !== "superadmin") throw new Error("Invalid credentials");
  if (user.isDeleted) throw new Error("Account has been deactivated");
  if (user.isBlocked) throw new Error("Account is blocked");

  const otp = await otpRepository.findLatestUnconsumed(email, "login_admin");
  if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
    throw new Error("Invalid or expired OTP");
  }

  otp.consumedAt = new Date();
  await otpRepository.updateOtp(otp);

  return { user: user.toPublic() };
}

export async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.role !== "superadmin" || user.isDeleted) throw new Error("Admin not found");

  const code = generateOtpCode();
  await otpRepository.createOtp({
    email,
    codeHash: hashCode(code),
    purpose: "verify",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendOtpEmail(email, code, "Super Admin Reset Password OTP");
}

export async function resetPassword(email, code, newPassword) {
  const otp = await otpRepository.findLatestUnconsumed(email, "verify");
  if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
    throw new Error("Invalid or expired OTP");
  }

  otp.consumedAt = new Date();
  await otpRepository.updateOtp(otp);

  const user = await userRepository.findByEmail(email);
  if (!user || user.role !== "superadmin" || user.isDeleted) throw new Error("Admin not found");

  await user.setPassword(newPassword);
  await user.save();
}

export const superAdminService = {
  loginStep1,
  loginStep2,
  forgotPassword,
  resetPassword,
};
