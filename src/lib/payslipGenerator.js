export function generatePayslipHTML(slip, user = {}) {
  const formatNum = (val) => {
    if (val === undefined || val === null || val === '') return '0.00';
    const cleanVal = String(val).replace(/[^\d.]/g, '');
    const num = Number(cleanVal);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Employee details fallback from slip or user
  const empId = slip.employeeId || user.employeeId || 'EMP-2026';
  const empName = slip.userName || user.name || 'Staff Member';
  const designation = slip.designation || user.designation || user.role || 'Employee';
  const department = slip.department || user.department || 'Operations';
  const band = slip.band || 'H1';
  const location = slip.location || 'Hyderabad, Madhapur';
  const dateOfJoining = slip.dateOfJoining || user.dateOfJoining || user.dob || '01/01/2024';
  const daysWorked = slip.daysWorked !== undefined ? slip.daysWorked : 30;
  const period = slip.period || 'June 1 - June 30, 2026';
  const uanNumber = slip.uanNumber || user.uanNumber || 'N/A';
  const panNumber = slip.panNumber || slip.panCard || user.panNumber || user.panCard || 'N/A';
  const bankName = slip.bankName || user.bankName || 'HDFC Bank';

  const accountNumber = slip.accountNumber || user.bankAccountNumber || '•••• 8902';
  const ifscCode = slip.ifscCode || user.bankIfscCode || 'HDFC0001234';

  // Earnings calculation
  const basic = Number(slip.basic || 0);
  const hra = Number(slip.hra || 0);
  const medical = Number(slip.medical || 0);
  const incentives = Number(slip.incentives || (slip.allowances || 0));
  const performancePay = Number(slip.performancePay || 0);
  const bonus = Number(slip.bonus || 0);

  const calculatedGross = basic + hra + medical + incentives + performancePay + bonus;
  const gross = slip.gross !== undefined && Number(slip.gross) > 0 ? Number(slip.gross) : calculatedGross;

  // Deductions calculation
  const pf = Number(slip.pf || 0);
  const healthInsurance = Number(slip.healthInsurance || 0);
  const lop = Number(slip.lop || 0);
  const employeeSavings = Number(slip.employeeSavings || 0);
  const adminTax = Number(slip.adminTax !== undefined ? slip.adminTax : (slip.professionalTax || 0));

  const calculatedDeductions = pf + healthInsurance + lop + employeeSavings + adminTax;
  const totalDeductions = slip.deductions !== undefined && Number(slip.deductions) > 0 ? Number(slip.deductions) : calculatedDeductions;


  // Net Salary
  const net = slip.net !== undefined ? Number(slip.net) : (gross - totalDeductions);
  const netPayable = slip.netPayable !== undefined && Number(slip.netPayable) > 0 ? Number(slip.netPayable) : net;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payslip - ${period} - ${empName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 24px;
          color: #1e293b;
          background-color: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          font-size: 11px;
        }
        @media print {
          body { padding: 15mm 15mm; }
          html, body { height: auto; overflow: visible; }
          .no-print { display: none !important; }
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .company-info {
          text-align: right;
        }
        .company-name {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 3px;
          letter-spacing: -0.5px;
        }
        .company-details {
          font-size: 10px;
          color: #64748b;
          line-height: 1.4;
          font-weight: 500;
        }
        .logo {
          height: 48px;
        }
        .title-section {
          text-align: center;
          margin-bottom: 16px;
          background: #f8fafc;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .slip-title {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0;
        }
        .slip-period {
          font-size: 11px;
          color: #475569;
          font-weight: 700;
          margin-top: 4px;
        }
        .section-heading {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #cbd5e1;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
          font-size: 10px;
        }
        .info-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px dashed #f1f5f9;
          padding: 3.5px 0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #64748b;
        }
        .info-value {
          font-weight: 700;
          color: #0f172a;
        }
        .tables-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .salary-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
        }
        .salary-table th {
          background-color: #0f172a;
          color: #ffffff;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 7px 10px;
          text-align: left;
        }
        .salary-table th:nth-child(even), .salary-table td:nth-child(even) {
          text-align: right;
        }
        .salary-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-weight: 500;
        }
        .salary-table tr.total-row td {
          background-color: #f8fafc;
          font-weight: 800;
          border-top: 2px solid #0f172a;
          border-bottom: 2px solid #0f172a;
          font-size: 11px;
        }
        .summary-box {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          padding: 16px 20px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        .summary-label {
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
        }
        .summary-value {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #ffffff;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding: 0 20px;
        }
        .sig-box {
          text-align: center;
          font-size: 10px;
          font-weight: 600;
          color: #64748b;
        }
        .sig-line {
          width: 140px;
          border-top: 1px solid #94a3b8;
          margin-bottom: 6px;
          margin-top: 35px;
        }
        .footer-note {
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          margin-top: 20px;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img class="logo" src="/logo.png" alt="HRA Groups Logo" style="height: 44px; width: auto; object-fit: contain;" onerror="this.src='/logo_transparent.png'" />
        </div>
        <div class="company-info">
          <div class="company-name">HRA GROUPS PRIVATE LIMITED</div>
          <div class="company-details">
            Madhapur, Hyderabad - 500081, Telangana, India.<br/>
            contact@hragroups.com | +91 9676272283
          </div>
        </div>
      </div>


      <div class="title-section">
        <h1 class="slip-title">PAYSLIP</h1>
        <div class="slip-period">Pay Period: ${period}</div>
      </div>

      <div class="section-heading">1. Employee Information</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">Employee ID</span>
            <span class="info-value">${empId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Employee Name</span>
            <span class="info-value">${empName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Designation / Role</span>
            <span class="info-value">${designation}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Department</span>
            <span class="info-value">${department}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Band</span>
            <span class="info-value" style="color: #4f46e5; font-weight: 900;">${band}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Location</span>
            <span class="info-value">${location}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date of Joining</span>
            <span class="info-value">${dateOfJoining}</span>
          </div>
        </div>

        <div class="info-card">
          <div class="info-row">
            <span class="info-label">No. of Days Worked</span>
            <span class="info-value">${daysWorked}</span>
          </div>
          <div class="info-row">
            <span class="info-label">UAN Number</span>
            <span class="info-value">${uanNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">PAN Number</span>
            <span class="info-value">${panNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Bank Name</span>
            <span class="info-value">${bankName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Account Number</span>
            <span class="info-value">${accountNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">IFSC Code</span>
            <span class="info-value">${ifscCode}</span>
          </div>
        </div>
      </div>

      <div class="section-heading">2. Salary Structure Breakdown</div>
      <div class="tables-container">
        <!-- Earnings Table -->
        <div>
          <table class="salary-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td>${formatNum(basic)}</td>
              </tr>
              <tr>
                <td>House Rent Allowance (HRA)</td>
                <td>${formatNum(hra)}</td>
              </tr>
              <tr>
                <td>Medical Allowance</td>
                <td>${formatNum(medical)}</td>
              </tr>
              <tr>
                <td>Incentives</td>
                <td>${formatNum(incentives)}</td>
              </tr>
              <tr>
                <td>Performance Pay</td>
                <td>${formatNum(performancePay)}</td>
              </tr>
              <tr>
                <td>Bonus</td>
                <td>${formatNum(bonus)}</td>
              </tr>
              <tr class="total-row">
                <td>Gross Earnings</td>
                <td>₹${formatNum(gross)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Deductions Table -->
        <div>
          <table class="salary-table">
            <thead>
              <tr>
                <th>Deductions</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Provident Fund (PF)</td>
                <td>${formatNum(pf)}</td>
              </tr>
              <tr>
                <td>Health Insurance Premium</td>
                <td>${formatNum(healthInsurance)}</td>
              </tr>
              <tr>
                <td>LOP (No of Days)</td>
                <td>${formatNum(lop)}</td>
              </tr>

              <tr>
                <td>Employee Savings</td>
                <td>${formatNum(employeeSavings)}</td>
              </tr>
              <tr>
                <td>Admin Tax</td>
                <td>${formatNum(adminTax)}</td>
              </tr>
              <tr class="total-row">
                <td>Total Deductions</td>
                <td>₹${formatNum(totalDeductions)}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Net Summary Box -->
      <div class="summary-box">
        <div class="summary-item">
          <span class="summary-label">Net Salary</span>
          <span class="summary-value">₹${formatNum(net)}</span>
        </div>
        <div class="summary-item" style="text-align: right;">
          <span class="summary-label">Net Salary Payable</span>
          <span class="summary-value" style="color: #34d399;">₹${formatNum(netPayable)}</span>
        </div>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <div class="sig-line"></div>
          Employee Signature
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          Authorized HR Signature
        </div>
      </div>

      <div class="footer-note">
        This is a computer-generated document and requires no physical signature if digitally verified.<br/>
        HRA GROUPS PRIVATE LIMITED • Confidential Payroll Document
      </div>
    </body>
    </html>
  `;
}

export function printOrDownloadPayslip(slip, user, action = 'print') {
  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    alert('Please allow popups in your browser to view or print the payslip.');
    return;
  }

  const htmlContent = generatePayslipHTML(slip, user);
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };
}
