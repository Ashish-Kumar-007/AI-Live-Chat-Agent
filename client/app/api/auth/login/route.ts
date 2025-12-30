import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Generate JWT token
    // In production, this should call your backend auth endpoint
    const secret = process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || "your-secret-key";
    const token = jwt.sign(
      { id: userId, userId: userId },
      secret,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token, userId });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}

