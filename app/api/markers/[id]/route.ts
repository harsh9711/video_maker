import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Marker from "@/app/models/Marker";

async function getMarkerById(id: string) {
  const marker = await Marker.findById(id);
  if (!marker) {
    throw new Error("Marker not found");
  }
  return marker;
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Marker ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const marker = await getMarkerById(id);

    const updatedMarker = await Marker.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedMarker);
  } catch (error) {
    console.error("Error updating marker:" );
    return NextResponse.json(
       { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Marker ID is required" },
        { status: 400 }
      );
    }

    await getMarkerById(id);
    await Marker.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "Marker deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting marker:", error);
    return NextResponse.json(
      { error: error || "Failed to delete marker" },
      { status: 500 }
    );
  }
}
