import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  type: { type: String, enum: ["nav", "click"], required: true },
  path: { type: String, required: true },
  label: { type: String, default: "" },
  duration: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now }
});

const sessionFlowSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
    userAgent: { type: String, default: "" },
    totalDuration: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    events: [eventSchema]
  },
  { timestamps: true }
);

sessionFlowSchema.index({ sessionId: 1 });
sessionFlowSchema.index({ deviceId: 1 });
sessionFlowSchema.index({ userId: 1 });
sessionFlowSchema.index({ updatedAt: -1 });

export default mongoose.models.SessionFlow || mongoose.model("SessionFlow", sessionFlowSchema);
