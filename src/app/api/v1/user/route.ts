import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(
  req: NextRequest,
  res: NextResponse,
): Promise<NextResponse> {
  try {

    const { firstName, lastName, email, password } = await req.json();


    // todo: add zod validation here
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          message: "Please provide all the fields some are missing",
        },
        {
          status: 400,
        },
      );
    }

    // hashing pass
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    if (!newUser) {
      return NextResponse.json({
        message: "Error while storing user in database",
      });
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        data: newUser,
      },
      {
        status: 201,
      },
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        message: "Internal server error while creating user",
      },
      {
        status: 500,
      },
    );
  }
}
