import mongoose, { Schema, Document } from "mongoose";

export interface IMarker extends Document {
  videoId: string;
  timestamp: number;
  content: string;
  type: string;
  data?: {
    title?: string;
    description?: string;
    fontSize?: string;
    textColor?: string;
    backgroundColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MarkerSchema = new Schema<IMarker>(
  {
    videoId: { type: String, required: true },
    timestamp: { type: Number, required: true },
    content: { type: String, required: true },
    type: { type: String, required: true },
    data: {
      title: String,
      description: String,
      fontSize: String,
      textColor: String,
      backgroundColor: String,
    },
  },
  {
    timestamps: true,
  }
);

const Marker =
  mongoose.models.Marker || mongoose.model<IMarker>("Marker", MarkerSchema);
export default Marker;
