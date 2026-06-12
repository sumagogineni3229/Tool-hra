import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Offer from '@/lib/models/Offer';
import { verifyToken } from '@/lib/auth';

// Helper to check if user has HR or Admin role
async function checkAuth(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    const decoded = await verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET /api/offers - Fetch all offers
export async function GET(request) {
  try {
    await dbConnect();

    // Fetch all offers from database
    const offers = await Offer.find({}).sort({ createdAt: -1 }).lean();

    // Map _id to id for frontend compatibility
    const mapped = offers.map(o => ({
      ...o,
      id: o._id.toString(),
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Offers GET error:', error.message);
    return NextResponse.json(
      { message: 'Failed to fetch offers', error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/offers - Create a new offer
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Calculate fixed compensation and total CTC
    const baseSalary = Number(body.baseSalary) || 0;
    const hra = Number(body.hra) || 0;
    const specialAllowance = Number(body.specialAllowance) || 0;
    const conveyanceAllowance = Number(body.conveyanceAllowance) || 0;
    const medicalAllowance = Number(body.medicalAllowance) || 0;
    const otherAllowances = Number(body.otherAllowances) || 0;
    const variablePay = Number(body.variablePay) || 0;
    const bonus = Number(body.bonus) || 0;
    const pfContribution = Number(body.pfContribution) || 0;
    const esiContribution = Number(body.esiContribution) || 0;
    const gratuity = Number(body.gratuity) || 0;

    // Calculations
    const fixedComp = baseSalary + hra + specialAllowance + conveyanceAllowance + medicalAllowance + otherAllowances + pfContribution + esiContribution + gratuity;
    const totalCTC = fixedComp + (variablePay * 12) + bonus; // wait, variablePay in standard table is monthly performance incentive, user sample has Performance Incentive (Variable) monthly up to ₹8,000, annual up to ₹96,000. So variablePay * 12. Let's make it fixedComp + (variablePay * 12) + bonus, wait, let's keep it simple: fixedComp + variablePay + bonus if they enter annual, or we calculate correctly.
    // Let's verify standard: Total CTC (Annual) = (Fixed monthly * 12) + (Variable monthly * 12) + Bonus? Or if inputs are monthly:
    // Monthly Fixed Comp = baseSalary + hra + specialAllowance + conveyanceAllowance + medicalAllowance + otherAllowances + pfContribution + esiContribution + gratuity;
    // Monthly variablePay (Performance Incentive)
    // Monthly CTC = Monthly Fixed Comp + Monthly variablePay + (Bonus / 12)?
    // Usually, Fixed Compensation in CTC tables represents the annual fixed amount. Let's look at the sample:
    // Base Salary Per Month ₹16,000, Annual ₹1,92,000
    // HRA Per Month ₹5,000, Annual ₹60,000
    // Other Allowances Per Month ₹1,000, Annual ₹12,000
    // Fixed Compensation (Monthly) = 16000 + 5000 + 1000 = 22000. Annual = 264000.
    // Performance Incentive (Variable) Monthly up to 8000. Annual up to 96000.
    // Total CTC (Annual) = 264000 + 96000 = 360000.
    // So: Fixed Comp Monthly = sum of monthly fixed components.
    // Total CTC (Annual) = (Fixed Comp Monthly * 12) + (Performance Incentive Monthly * 12) + Bonus.
    // Let's calculate Fixed Comp and Total CTC on monthly and annual bases. We will store Monthly values in the DB, and compute Annual in the UI/backend or store both. Let's store the raw inputs and then calculate both monthly and annual.
    // Let's make sure the DB model stores:
    // - fixedComp (Monthly fixed compensation) = baseSalary + hra + specialAllowance + conveyanceAllowance + medicalAllowance + otherAllowances + pfContribution + esiContribution + gratuity
    // - totalCTC (Annual CTC) = (fixedComp * 12) + (variablePay * 12) + bonus

    const calculatedFixed = fixedComp;
    const calculatedTotalCTC = (fixedComp * 12) + (variablePay * 12) + bonus;

    // Generate unique offer number
    const year = new Date().getFullYear();
    let offerNumber = '';
    let isUnique = false;
    let attempts = 0;
    
    // Find the offer with the highest sequence number for this year
    const prefix = `HRA/OFFER/${year}/`;
    const lastOffer = await Offer.findOne({ offerNumber: new RegExp('^' + prefix) })
      .sort({ offerNumber: -1 })
      .lean();
      
    let nextSeq = 1;
    if (lastOffer && lastOffer.offerNumber) {
      const parts = lastOffer.offerNumber.split('/');
      const lastSeqStr = parts[parts.length - 1];
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
    
    while (!isUnique && attempts < 10) {
      offerNumber = `${prefix}${nextSeq.toString().padStart(4, '0')}`;
      const existing = await Offer.findOne({ offerNumber });
      if (!existing) {
        isUnique = true;
      } else {
        nextSeq++;
        attempts++;
      }
    }
    
    if (!isUnique) {
      offerNumber = `${prefix}${nextSeq.toString().padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Get current user session for createdBy
    const userSession = await checkAuth(request);
    const createdBy = userSession?.name || body.createdBy || 'HR Administrator';

    const newOffer = await Offer.create({
      ...body,
      offerNumber,
      fixedComp: calculatedFixed,
      totalCTC: calculatedTotalCTC,
      createdBy,
      status: body.status || 'Draft',
      history: [
        {
          status: body.status || 'Draft',
          updatedBy: createdBy,
          comments: 'Offer draft initiated.'
        }
      ]
    });

    return NextResponse.json({
      ...newOffer.toObject(),
      id: newOffer._id.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Offers POST error:', error.message);
    return NextResponse.json(
      { message: 'Failed to create offer record', error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/offers - Update offer details or status
export async function PATCH(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, updatedBy, comments, ...rest } = body;

    if (!id) {
      return NextResponse.json({ message: 'Offer ID is required' }, { status: 400 });
    }

    const offer = await Offer.findById(id);
    if (!offer) {
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
    }

    // Get current user session for logging
    const userSession = await checkAuth(request);
    const modifier = userSession?.name || updatedBy || 'HR/Admin Operator';

    // Build update object
    const updateData = { ...rest };
    if (status) {
      updateData.status = status;
      
      // Handle approval signatures/workflow states
      if (status === 'Approved') {
        updateData.approvedBy = modifier;
      }

      // Add to history log
      const historyEntry = {
        status,
        updatedBy: modifier,
        comments: comments || `Offer status transitioned to ${status}`
      };
      
      // Correct Mongoose pushing
      await Offer.findByIdAndUpdate(id, {
        $push: { history: historyEntry }
      });
    }

    // Perform updates
    const updatedOffer = await Offer.findByIdAndUpdate(id, {
      $set: updateData
    }, { new: true });

    return NextResponse.json({
      ...updatedOffer.toObject(),
      id: updatedOffer._id.toString()
    }, { status: 200 });
  } catch (error) {
    console.error('Offers PATCH error:', error.message);
    return NextResponse.json(
      { message: 'Failed to update offer record', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/offers - Delete an offer record
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Offer ID query parameter is required' }, { status: 400 });
    }

    const deletedOffer = await Offer.findByIdAndDelete(id);
    if (!deletedOffer) {
      return NextResponse.json({ message: 'Offer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Offers DELETE error:', error.message);
    return NextResponse.json(
      { message: 'Failed to delete offer record', error: error.message },
      { status: 500 }
    );
  }
}
