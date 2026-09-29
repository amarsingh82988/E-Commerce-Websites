import mongoose from "mongoose";
import { userRepository } from "./user.repository.js";
import { otpRepository } from "../otp/otp.repository.js";
import { hashCode } from "../otp/Otp.js";
// import { env } from "../../config/env.js";
import { generateOtpCode, sendOtpEmail } from "../../utils/email.service.js";

export async function register(name, email, password, phone, role = "customer") {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await userRepository.createUser({
      name,
      email,
      phone,
      role,
    }, { session });

    await user.setPassword(password);
    await user.save({ session });

    const code = generateOtpCode();

    await otpRepository.createOtp({
      email,
      codeHash: hashCode(code),
      purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }, { session });

    await sendOtpEmail(email, code, "Verify your Apne Hath Crafts Account");

    await session.commitTransaction();
    session.endSession();
    return user;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function verifyEmail(email, code) {
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
    if (!user) {
      throw new Error("User not found");
    }

    user.emailVerified = true;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function loginStep1(email, password) {
  const user = await userRepository.findByEmail(
    email,
    "+passwordHash emailVerified isBlocked isDeleted role name",
  );

  if (!user) throw new Error("Invalid credentials");
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
      purpose: "login",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    }, { session });

    await sendOtpEmail(email, code, "Your Login OTP Code");

    await session.commitTransaction();
    session.endSession();

    return {
      message: "OTP sent",
      role: user.role,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function loginStep2(email, code) {
  const user = await userRepository.findByEmail(
    email,
    "+passwordHash emailVerified isBlocked isDeleted role name",
  );

  if (!user) throw new Error("Invalid credentials");
  if (user.isDeleted) throw new Error("Account has been deactivated");
  if (user.isBlocked) throw new Error("Account is blocked");

  const otp = await otpRepository.findLatestUnconsumed(email, "login");
  if (!otp || otp.expiresAt < new Date() || otp.codeHash !== hashCode(code)) {
    throw new Error("Invalid or expired OTP");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    otp.consumedAt = new Date();
    await otpRepository.updateOtp(otp, { session });

    const addresses = await userRepository.getAddresses(user._id);

    await session.commitTransaction();
    session.endSession();

    return {
      user: user.toPublic(addresses),
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.isDeleted) {
    throw new Error("User not found");
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

    await sendOtpEmail(email, code, "Reset Password OTP Code");

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function resetPassword(email, code, newPassword) {
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
    if (!user || user.isDeleted) {
      throw new Error("User not found");
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
}

export async function getProfile(userId) {
  const user = await userRepository.findById(userId);
  if (!user || user.isDeleted) throw new Error("User not found");
  const addresses = await userRepository.getAddresses(userId);
  return user.toPublic(addresses);
}

export async function updateProfile(userId, updateData) {
  let addressUpdate = undefined;
  if (updateData.addresses !== undefined) {
    addressUpdate = updateData.addresses;
    delete updateData.addresses;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const user = await userRepository.updateUser(userId, updateData, { session });
    if (!user || user.isDeleted) {
      throw new Error("User not found");
    }

    let currentAddresses = await userRepository.getAddresses(userId);
    if (addressUpdate !== undefined) {
      currentAddresses = await userRepository.updateAddresses(userId, addressUpdate, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return user.toPublic(currentAddresses);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export const userService = {
  register,
  verifyEmail,
  loginStep1,
  loginStep2,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};
