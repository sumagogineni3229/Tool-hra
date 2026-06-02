import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Insurance from "@/lib/models/Insurance";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/auth";

// GET: HR/Admin → all records; Employee → own record by email
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    console.log("[INSURANCE GET DEBUG] token:", token ? "exists" : "missing", "payload:", payload);

    const isPrivileged =
      payload && (payload.role === "HR" || payload.role === "Admin");

    let records = [];

    if (isPrivileged && !emailParam) {
      // HR / Admin fetching all insurance records
      records = await Insurance.find({}).sort({ createdAt: -1 }).lean();
    } else {
      // Employee fetching their own record, or HR filtering by email
      const email = emailParam || payload?.email;
      if (!email) {
        return NextResponse.json(
          { success: false, message: "Email required" },
          { status: 400 }
        );
      }
      records = await Insurance.find({
        employeeEmail: email.toLowerCase().trim(),
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    // Recompute status on-the-fly for any drift (policy may have expired since last save)
    const now = new Date();
    const enriched = records.map((r) => {
      const expiry = new Date(r.expiryDate);
      const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      let computedStatus = r.status;
      if (r.status !== "Cancelled") {
        if (daysToExpiry <= 0) computedStatus = "Expired";
        else if (daysToExpiry <= 30) computedStatus = "Expiring Soon";
        else computedStatus = "Active";
      }
      return { ...r, status: computedStatus, daysToExpiry };
    });

    return NextResponse.json({ success: true, insurance: enriched });
  } catch (err) {
    console.error("Insurance GET error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// POST: HR/Admin creates a new insurance policy record
export async function POST(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) payload = await verifyToken(token);

    console.log("[INSURANCE POST DEBUG] token:", token ? "exists" : "missing", "payload:", payload);

    const isPrivileged =
      payload && (payload.role === "HR" || payload.role === "Admin");
    if (!isPrivileged) {
      console.log("[INSURANCE POST DEBUG] Unauthorized: isPrivileged is false");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      employeeEmail,
      employeeName,
      providerName,
      policyNumber,
      insuranceType,
      coverageAmount,
      premiumAmount,
      startDate,
      expiryDate,
      policyDocUrl,
      insuranceCardUrl,
      notes,
    } = body;

    // Required field validation
    if (
      !employeeEmail ||
      !providerName ||
      !policyNumber ||
      !insuranceType ||
      !coverageAmount ||
      !premiumAmount ||
      !startDate ||
      !expiryDate
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Resolve employee ID
    const employee = await User.findOne({
      email: employeeEmail.toLowerCase().trim(),
    });
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    const newRecord = new Insurance({
      employeeId: employee._id,
      employeeEmail: employeeEmail.toLowerCase().trim(),
      employeeName: employeeName || employee.name,
      providerName,
      policyNumber,
      insuranceType,
      coverageAmount: Number(coverageAmount),
      premiumAmount: Number(premiumAmount),
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      policyDocUrl: policyDocUrl || "",
      insuranceCardUrl: insuranceCardUrl || "",
      notes: notes || "",
    });

    await newRecord.save();

    return NextResponse.json(
      { success: true, insurance: newRecord },
      { status: 201 }
    );
  } catch (err) {
    console.error("Insurance POST error:", err);
    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: "Policy number already exists. Use a unique policy number.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// PATCH: HR/Admin updates an existing insurance record (edit or renew)
export async function PATCH(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) payload = await verifyToken(token);

    const isPrivileged =
      payload && (payload.role === "HR" || payload.role === "Admin");
    if (!isPrivileged) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Record ID required" },
        { status: 400 }
      );
    }

    // Convert numeric fields
    if (updates.coverageAmount) updates.coverageAmount = Number(updates.coverageAmount);
    if (updates.premiumAmount) updates.premiumAmount = Number(updates.premiumAmount);
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.expiryDate) updates.expiryDate = new Date(updates.expiryDate);

    const updated = await Insurance.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, insurance: updated });
  } catch (err) {
    console.error("Insurance PATCH error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// DELETE: HR/Admin removes an insurance record
export async function DELETE(request) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    let payload = null;
    if (token) payload = await verifyToken(token);

    const isPrivileged =
      payload && (payload.role === "HR" || payload.role === "Admin");
    if (!isPrivileged) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID required" },
        { status: 400 }
      );
    }

    const deleted = await Insurance.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (err) {
    console.error("Insurance DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
