import { Otp } from "./Otp.js";

export async function createOtp(data, opts = {}) {
  const otp = new Otp(data);

  return await otp.save(opts);
}

export async function findLatestUnconsumed(email, purpose) {
  return await Otp.findOne({
    email,
    purpose,
    consumedAt: null,
  })
    .sort({ createdAt: -1 })
    .exec();
}

export async function updateOtp(otpDoc, opts = {}) {
  return await otpDoc.save(opts);
}

export const otpRepository = {
  createOtp,
  findLatestUnconsumed,
  updateOtp,
};