import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Marker from "@/app/models/Marker";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  try {
    await connectDB();
    const markers = await Marker.find({ videoId }).sort({ timestamp: 1 });
    return NextResponse.json(markers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch markers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    const marker = await Marker.create(body);
    return NextResponse.json(marker);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create marker" },
      { status: 500 }
    );
  }
}
