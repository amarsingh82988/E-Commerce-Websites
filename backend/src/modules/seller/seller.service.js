import mongoose from "mongoose";
import { userRepository } from "../user/user.repository.js";
import { otpRepository } from "../otp/otp.repository.js";
import { hashCode } from "../otp/Otp.js";
// import { env } from "../../config/env.js";
import { Order as _Order } from "../order/Order.js";
import { generateOtpCode, sendOtpEmail } from "../../utils/email.service.js";

export const register = async (name, email, password, phone) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new Error("User with this email already exists");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await userRepository.createUser({ name, email, phone, role: "seller" }, { session });
    await user.setPassword(password);
    await user.save({ session });

    const code = generateOtpCode();
    await otpRepository.createOtp({
      email,
      codeHash: hashCode(code),
      purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }, { session });

    await sendOtpEmail(email, code, "Verify Seller Account");

    await session.commitTransaction();
    session.endSession();
    return user;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const verifyEmail = async (email, code) => {
  const otp = await otpRepository.findLatestUnconsumed(email, "verify");
  if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
    throw new Error("Invalid or expired OTP");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    otp.consumedAt = new Date();
    await otpRepository.updateOtp(otp, { session });

    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    user.emailVerified = true;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const loginStep1 = async (email, password) => {
  const user = await userRepository.findByEmail(
    email,
    "+passwordHash role emailVerified isBlocked isDeleted",
  );

  if (!user) throw new Error("Invalid credentials");
  if (!["seller", "superadmin"].includes(user.role)) throw new Error("Access denied");
  
  const match = await user.comparePassword(password);
  if (!match) throw new Error("Invalid credentials");
  if (user.isDeleted) throw new Error("Account has been deactivated");
  if (user.isBlocked) throw new Error("Account is blocked");
  if (!user.emailVerified) throw new Error("Email not verified");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const code = generateOtpCode();

    await otpRepository.createOtp({
      email,
      codeHash: hashCode(code),
      purpose: "login_admin",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }, { session });

    await sendOtpEmail(email, code, "Seller Login OTP Code");

    await session.commitTransaction();
    session.endSession();

    return {
      message: "OTP sent",
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const loginStep2 = async (email, code) => {
  const user = await userRepository.findByEmail(
    email,
    "+passwordHash role emailVerified isBlocked isDeleted",
  );

  if (!user || !["seller", "superadmin"].includes(user.role)) {
    throw new Error("Invalid credentials");
  }
  if (user.isDeleted) throw new Error("Account has been deactivated");
  if (user.isBlocked) throw new Error("Account is blocked");

  const otp = await otpRepository.findLatestUnconsumed(email, "login_admin");

  if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
    throw new Error("Invalid or expired OTP");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    otp.consumedAt = new Date();
    await otpRepository.updateOtp(otp, { session });

    await session.commitTransaction();
    session.endSession();

    return {
      user: user.toPublic(),
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);

  if (!user || !["seller", "superadmin"].includes(user.role) || user.isDeleted) {
    throw new Error("Admin not found");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const code = generateOtpCode();

    await otpRepository.createOtp({
      email,
      codeHash: hashCode(code),
      purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }, { session });

    await sendOtpEmail(email, code, "Seller Reset Password OTP");

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const resetPassword = async (email, code, newPassword) => {
  const otp = await otpRepository.findLatestUnconsumed(email, "verify");

  if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
    throw new Error("Invalid or expired OTP");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    otp.consumedAt = new Date();
    await otpRepository.updateOtp(otp, { session });

    const user = await userRepository.findByEmail(email);

    if (!user || !["seller", "superadmin"].includes(user.role) || user.isDeleted) {
      throw new Error("Admin not found");
    }

    await user.setPassword(newPassword);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const sellerService = {
  register,
  verifyEmail,
  loginStep1,
  loginStep2,
  forgotPassword,
  resetPassword,
};
