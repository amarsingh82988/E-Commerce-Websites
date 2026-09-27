import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    hero: {
      title: { type: String, default: "Handmade with Love" },
      subtitle: { type: String, default: "Discover unique, artisanal crafts made by local creators." },
      imageUrl: { type: String, default: "" },
      buttonText: { type: String, default: "Shop Now" },
      buttonLink: { type: String, default: "/shop" },
    },
    about: {
      title: { type: String, default: "Our Story" },
      content: { type: String, default: "Apne Hath Crafts was born out of a love for handmade, unique items." },
      imageUrl: { type: String, default: "" },
    },
    faqs: [
      {
        id: { type: String },
        question: { type: String },
        answer: { type: String },
      },
    ],
    policies: {
      shipping: { type: String, default: "" },
      returnPolicy: { type: String, default: "" },
      privacy: { type: String, default: "" },
      terms: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Content = mongoose.model("Content", contentSchema);
