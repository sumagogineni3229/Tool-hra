"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Calendar,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  Building,
  User,
  Users,
  Check,
  X,
  Shield,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Download,
  Printer,
  ArrowRight,
  TrendingUp,
  Globe,
  Trash2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function CreateOfferPage() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, create
  const [offers, setOffers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form State
  const [formData, setFormData] = useState({
    candidateName: "R. Naga Swapna",
    candidateId: "HRA-CAND-901",
    email: "nagaswapna@gmail.com",
    phone: "+91 9876543210",
    address: "Hyderabad, Telangana",
    position: "Telecaller Intern",
    department: "Operations",
    reportingManager: "Sarah Jenkins",

    employmentType: "Internship",
    gradeBand: "G3",
    workLocation: "Madhapur - Hyderabad",
    workMode: "Internship",
    joiningDate: "2026-05-25",
    probationPeriod: "None",
    noticePeriod: "15 Days",

    // Company profile
    companyName: "HRA GROUPS PRIVATE LIMITED",
    companyAddress: "Madhapur - Hyderabad",
    companyContact: "+91 9676272283",
    companyWebsite: "www.hragroups.com",
    companyLogo: "",

    // Working schedule
    workingDays: "Monday to Saturday",
    workingHours: "9:30 AM to 6:30 PM",

    // Compensation
    baseSalary: 16000,
    hra: 5000,
    specialAllowance: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    otherAllowances: 1000,
    variablePay: 8000, // Performance Incentive
    bonus: 0,
    pfContribution: 0,
    esiContribution: 0,
    gratuity: 0,

    // Internship specific
    internshipDuration: "3 Months",
    monthlyStipend: 6000,
    trainingProgram: "Telecalling & Customer Relations Training",
    internshipCertificateEligibility: "Yes",
    learningModules: "React, Next.js, Node.js, TailwindCSS",
    mentorAssigned: "Sarah Jenkins",

    // Detailed points from screenshots
    rolesResponsibilities: `Making outbound and follow-up calls to customers and prospects
Handling customer inquiries professionally
Maintaining communication records and reports
Supporting customer engagement activities
Coordinating with internal teams for operational support
Following communication standards and company processes
Completing assigned responsibilities within timelines
Participating in assigned organizational activities`,

    trainingSessions: `Communication and telecalling skills training
Customer handling and interaction practices
Workplace communication standards
Professional development sessions`,

    codeOfConduct: `Professional behavior and workplace discipline
Punctuality and commitment toward assigned work
Confidentiality of organizational information
Respectful communication with team members
Ethical work practices and professional standards`,

    performanceEvaluation: `Task completion and responsibility handling
Communication effectiveness
Attendance and punctuality
Team collaboration and participation
Learning attitude and professional development`,

    templateName: "Internship Offer Letter"
  });

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null); // For detail preview/workflow modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load offers & employees
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getOffers();
      setOffers(data || []);

      const allUsers = await apiClient.getUsers();
      setEmployees(allUsers || []);
    } catch (err) {
      console.error("Failed to load offer data:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.employmentType === "Internship") {
      setFormData(prev => ({
        ...prev,
        templateName: "Internship Offer Letter",
        rolesResponsibilities: (prev.rolesResponsibilities === "" || prev.rolesResponsibilities.includes("Executing operational") || prev.rolesResponsibilities.includes("operational and technical"))
          ? `Making outbound and follow-up calls to customers and prospects
Handling customer inquiries professionally
Maintaining communication records and reports
Supporting customer engagement activities
Coordinating with internal teams for operational support
Following communication standards and company processes
Completing assigned responsibilities within timelines
Participating in assigned organizational activities`
          : prev.rolesResponsibilities,
        trainingSessions: (prev.trainingSessions === "" || prev.trainingSessions.trim() === "" || prev.trainingSessions.includes("Onboarding and department") || prev.trainingSessions.includes("process walkthroughs"))
          ? `Communication and telecalling skills training
Customer handling and interaction practices
Workplace communication standards
Professional development sessions`
          : prev.trainingSessions,
        codeOfConduct: (prev.codeOfConduct === "" || prev.codeOfConduct.includes("schedules"))
          ? `Professional behavior and workplace discipline
Punctuality and commitment toward assigned work
Confidentiality of organizational information
Respectful communication with team members
Ethical work practices and professional standards`
          : prev.codeOfConduct,
        performanceEvaluation: (prev.performanceEvaluation === "" || prev.performanceEvaluation.includes("Accomplishment of quarterly"))
          ? `Task completion and responsibility handling
Communication effectiveness
Attendance and punctuality
Team collaboration and participation
Learning attitude and professional development`
          : prev.performanceEvaluation
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        templateName: prev.employmentType === "Contract" ? "Contract Employee Offer Letter" : "Employee Offer Letter",
        rolesResponsibilities: (prev.rolesResponsibilities === "" || prev.rolesResponsibilities.includes("outbound") || prev.rolesResponsibilities.includes("calls to customers"))
          ? `Executing operational and technical objectives for the assigned projects
Collaborating with cross-functional teams to design and deploy business solutions
Participating in departmental milestones, code reviews, and meetings
Maintaining clean documentation, logs, and progress reports`
          : prev.rolesResponsibilities,
        trainingSessions: (prev.trainingSessions === "" || prev.trainingSessions.includes("Communication and telecalling") || prev.trainingSessions.includes("telecalling skills"))
          ? ""
          : prev.trainingSessions,
        codeOfConduct: (prev.codeOfConduct === "" || prev.codeOfConduct.includes("organizational"))
          ? `Professional behavior and workplace discipline
Punctuality and commitment toward assigned schedules
Confidentiality of company property, source code, and client records
Respectful communication with team members and managers
Ethical work practices and compliance with corporate policies`
          : prev.codeOfConduct,
        performanceEvaluation: (prev.performanceEvaluation === "" || prev.performanceEvaluation.includes("Task completion"))
          ? `Accomplishment of quarterly performance key result areas (KRAs)
Quality and timeliness of deliverables
Technical competence and contribution to team growth
Alignment with company culture and values`
          : prev.performanceEvaluation
      }));
    }
  }, [formData.employmentType]);

  // Compensation Math
  const calculateCompensation = (data) => {
    const isIntern = data.employmentType === "Internship";

    if (isIntern) {
      const monthly = Number(data.monthlyStipend) || 0;
      return {
        monthlyFixed: monthly,
        annualFixed: monthly * 12,
        monthlyVariable: 0,
        annualVariable: 0,
        bonus: 0,
        fixedComp: monthly,
        totalCTC: monthly * 12
      };
    }

    const base = Number(data.baseSalary) || 0;
    const hra = Number(data.hra) || 0;
    const special = Number(data.specialAllowance) || 0;
    const conveyance = Number(data.conveyanceAllowance) || 0;
    const medical = Number(data.medicalAllowance) || 0;
    const other = Number(data.otherAllowances) || 0;
    const pf = Number(data.pfContribution) || 0;
    const esi = Number(data.esiContribution) || 0;
    const gratuity = Number(data.gratuity) || 0;

    const variable = Number(data.variablePay) || 0;
    const bonus = Number(data.bonus) || 0;

    const monthlyFixed = base + hra + special + conveyance + medical + other + pf + esi + gratuity;
    const annualFixed = monthlyFixed * 12;

    const monthlyVariable = variable;
    const annualVariable = variable * 12;

    const totalCTC = annualFixed + annualVariable + bonus;

    return {
      monthlyFixed,
      annualFixed,
      monthlyVariable,
      annualVariable,
      bonus,
      fixedComp: monthlyFixed,
      totalCTC
    };
  };

  const compResults = calculateCompensation(formData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image size should be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        companyLogo: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Form submission handler
  const handleSubmitOffer = async (e, customStatus = "Draft") => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const currentUser = apiClient.getCurrentSession();
    const payload = {
      ...formData,
      status: customStatus,
      createdBy: currentUser?.name || "HR Manager"
    };

    const res = await apiClient.createOffer(payload);
    if (res.success) {
      setSuccessMsg(`Offer created successfully in state "${customStatus}"!`);
      setOffers(prev => [res.offer, ...prev]);

      // Immediately show the preview modal so user can approve the saved draft
      if (customStatus === "Draft") {
        setSelectedOffer(res.offer);
        setShowPreviewModal(true);
      }

      // Switch to dashboard tab
      setTimeout(() => {
        setActiveTab("dashboard");
        setSuccessMsg("");
      }, 2000);
    } else {
      setErrorMsg(res.message || "Failed to create offer. Please try again.");
    }
    setSubmitting(false);
  };

  // Approval Workflow Handler
  const handleUpdateStatus = async (offerId, newStatus, comments = "") => {
    const currentUser = apiClient.getCurrentSession();
    const updatePayload = {
      status: newStatus,
      updatedBy: currentUser?.name || "HR/Admin Officer",
      comments: comments || `Offer status transitioned to ${newStatus}`
    };

    const res = await apiClient.updateOffer(offerId, updatePayload);
    if (res.success) {
      setOffers(prev => prev.map(o => (o.id === offerId || o._id === offerId) ? res.offer : o));
      if (selectedOffer && (selectedOffer.id === offerId || selectedOffer._id === offerId)) {
        setSelectedOffer(res.offer);
      }
      setSuccessMsg(`Offer updated to "${newStatus}"!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.message || "Failed to update offer status.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  // Delete Offer Handler
  const handleDeleteOffer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer letter permanently?")) {
      return;
    }
    const res = await apiClient.deleteOffer(id);
    if (res.success) {
      setOffers(prev => prev.filter(o => o.id !== id && o._id !== id));
      setSuccessMsg("Offer letter deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } else {
      setErrorMsg(res.message || "Failed to delete offer.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  };

  // Format Date to DD/MM/YYYY
  const formatDateDMY = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const dateObj = new Date(dateStr);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Printable Template Renderer (Matching Uploaded Screenshots exactly)
  const generateOfferLetterHTML = (offer) => {
    const results = calculateCompensation(offer);
    const dateFormatted = offer.createdAt ? formatDateDMY(offer.createdAt.split("T")[0]) : formatDateDMY(new Date().toISOString().split("T")[0]);
    const joiningFormatted = formatDateDMY(offer.joiningDate);
    const isIntern = offer.employmentType === "Internship";

    // Split textareas by line into list items
    const renderListItems = (text) => {
      if (!text) return "";
      return text.split("\n").filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join("");
    };

    let pagesContent = "";

    if (isIntern) {
      // 2-page document structure for Internship Offer Letter
      pagesContent = `
        <!-- PAGE 1 -->
        <div class="page-container">
          <div class="page-header-accent"></div>

          <!-- Logo -->
          <div class="logo-header">
            <img class="logo-img" src="/logo.png" alt="HRA Groups Logo" onerror="this.src='/logo_transparent.png'" />
          </div>

          <!-- Document Title -->
          <h1 class="document-title">Internship Offer Letter</h1>

          <!-- Date & Ref -->
          <div class="date-row">
            <span>Ref: <strong>${offer.offerNumber || 'Draft'}</strong></span>
            <span>Date: <strong>${dateFormatted}</strong></span>
          </div>

          <!-- Recipient -->
          <div class="recipient-block">
            <strong>To,</strong><br/>
            <strong>${offer.candidateName}</strong>
          </div>

          <!-- Opening Paragraph -->
          <p class="body-p">
            We are pleased to offer you the position of <strong>${offer.position}</strong> at <strong>${offer.companyName || "HRA GROUPS PRIVATE LIMITED"}</strong>. We are delighted to welcome you to our organization and believe that your dedication, communication skills, and willingness to learn will contribute positively to our team. This internship is designed to provide practical exposure, workplace learning, and professional development opportunities.
          </p>

          <!-- Internship Details Section -->
          <h3 class="section-title">Internship Details</h3>
          <div class="details-grid">
            <div class="grid-card">
              <span class="card-label">Position</span>
              <span class="card-value">${offer.position}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Company Name</span>
              <span class="card-value">${offer.companyName || "HRA GROUPS PRIVATE LIMITED"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Internship Duration</span>
              <span class="card-value">${offer.internshipDuration || "3 Months"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Onboarding Date</span>
              <span class="card-value">${joiningFormatted}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Working Days</span>
              <span class="card-value">${offer.workingDays || "Monday to Saturday"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Working Hours</span>
              <span class="card-value">${offer.workingHours || "9:30 AM to 6:30 PM"}</span>
            </div>
            <div class="grid-card" style="grid-column: span 2;">
              <span class="card-label">Mode of Work</span>
              <span class="card-value">${offer.workMode || "Internship"}</span>
            </div>
          </div>

          <!-- Stipend and Incentives Section -->
          <h3 class="section-title">Stipend and Incentives</h3>
          <div class="details-grid">
            <div class="grid-card" style="grid-column: span 2;">
              <span class="card-label">Monthly Stipend</span>
              <span class="card-value">₹${Number(offer.monthlyStipend || 0).toLocaleString("en-IN")}/- per month</span>
            </div>
          </div>
          <ul class="details-list font-medium">
            <li>Performance recognition based on contribution and participation.</li>
            <li>Learning opportunities and practical industry exposure.</li>
            <li>Internship completion certificate upon successful completion of internship terms.</li>
          </ul>

          <!-- Roles and Responsibilities Section -->
          <h3 class="section-title">Roles and Responsibilities</h3>
          <p class="body-intro">As a <strong>${offer.position}</strong>, your responsibilities include:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.rolesResponsibilities)}
          </ul>

          <!-- Footer -->
          <div class="page-number-footer">
            <span>HRA GROUPS PRIVATE LIMITED</span>
            <span>Page 1 of 2</span>
          </div>
        </div>

        <!-- PAGE 2 -->
        <div class="page-container page-break">
          <div class="page-header-accent"></div>

          <!-- Training Sessions & Learning Exposure -->
          <h3 class="section-title" style="margin-top: 25px;">Training Sessions & Learning Exposure</h3>
          <p class="body-intro">During the internship period, you will receive exposure to:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.trainingSessions)}
          </ul>

          <!-- Code of Conduct & Expectations -->
          <h3 class="section-title">Code of Conduct & Expectations</h3>
          <p class="body-intro">You are expected to maintain:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.codeOfConduct)}
          </ul>

          <!-- Performance Evaluation Section -->
          <h3 class="section-title">Performance Evaluation & Growth Opportunities</h3>
          <p class="body-intro">Performance may be evaluated based on:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.performanceEvaluation)}
          </ul>

          <p class="body-p" style="margin-top: 25px;">
            Successful completion of the internship may provide future growth opportunities based on organizational requirements and performance standards.
          </p>

          <p class="body-p">
            We are excited to welcome you to <strong>${offer.companyName || "HRA GROUPS PRIVATE LIMITED"}</strong> and look forward to supporting your professional learning journey. We wish you success and a rewarding internship experience with our organization.
          </p>
          
          <p class="body-p" style="font-weight: 800; color: #673de6; margin-top: 20px;">
            Welcome to HRA GROUPS and wishing you a great journey ahead.
          </p>

          <!-- Sign-Off & Corporate Stamp Block -->
          <div class="footer-signoff-row" style="margin-top: 30px;">
            <!-- Regards & Stamp Left -->
            <div class="stamp-col">
              <span class="regards-title">Regards,</span>
              
              <div style="display: flex; align-items: center; gap: 20px;">
                <!-- High fidelity corporate stamp -->
                <div class="circular-stamp">
                  <svg viewBox="0 0 100 100" class="stamp-svg" style="fill: transparent;">
                    <!-- Outer double circle -->
                    <circle cx="50" cy="50" r="45" stroke="#5025d1" stroke-width="1.8" fill="none" />
                    <circle cx="50" cy="50" r="42" stroke="#5025d1" stroke-width="0.6" fill="none" />
                    
                    <!-- Inner dashed circle -->
                    <circle cx="50" cy="50" r="28" stroke="#5025d1" stroke-width="0.6" fill="none" stroke-dasharray="0.8, 0.8" />
                    
                    <!-- Text paths -->
                    <path id="stampTextTop" d="M 14 50 A 36 36 0 0 1 86 50" fill="none" />
                    <path id="stampTextBottom" d="M 14 50 A 36 36 0 0 0 86 50" fill="none" />
                    
                    <text fill="#5025d1" font-size="8" font-weight="800" font-family="'Roboto', sans-serif" letter-spacing="1">
                      <textPath href="#stampTextTop" startOffset="50%" text-anchor="middle">HRA GROUPS</textPath>
                    </text>
                    
                    <text fill="#5025d1" font-size="8" font-weight="800" font-family="'Roboto', sans-serif" letter-spacing="1">
                      <textPath href="#stampTextBottom" startOffset="50%" text-anchor="middle">PVT LTD</textPath>
                    </text>
                    
                    <!-- Stars -->
                    <text x="17.5" y="52.5" fill="#5025d1" font-size="7.5" font-weight="bold" text-anchor="middle">★</text>
                    <text x="82.5" y="52.5" fill="#5025d1" font-size="7.5" font-weight="bold" text-anchor="middle">★</text>
                    
                    <!-- Center elements -->
                    <text x="50" y="42" fill="#5025d1" font-size="17" font-weight="900" font-family="'Roboto', sans-serif" text-anchor="middle" letter-spacing="0.5">HRA</text>
                    
                    <!-- Cursive Signature for P. Hemanth -->
                    <text x="50" y="52" fill="#5025d1" font-size="9" font-family="'Dancing Script', 'Brush Script MT', cursive" font-weight="bold" text-anchor="middle">P. Hemanth</text>
                    <line x1="30" y1="54" x2="70" y2="54" stroke="#5025d1" stroke-width="0.8" />
                    
                    <!-- Subtexts -->
                    <text x="50" y="63" fill="#5025d1" font-size="4.8" font-weight="700" font-family="'Roboto', sans-serif" text-anchor="middle">Founder & CEO</text>
                    <text x="50" y="69" fill="#5025d1" font-size="5.2" font-weight="700" font-family="'Roboto', sans-serif" text-anchor="middle">Hemanth Pulavarthi</text>
                  </svg>
                </div>

                ${offer.companyLogo ? `
                  <!-- Custom Org Logo -->
                  <div class="custom-org-logo-container">
                    <img src="${offer.companyLogo}" alt="Organization Logo" class="custom-org-logo-img" />
                  </div>
                ` : ''}
              </div>

              <span class="sign-name">HRA GROUPS MANAGEMENT</span>
            </div>

            <!-- Address contact block Right -->
            <div class="contact-card">
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div class="contact-info-text">
                  <div class="label">ADDRESS</div>
                  <div class="value">${offer.companyAddress || "Madhapur - Hyderabad"}</div>
                </div>
              </div>

              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div class="contact-info-text">
                  <div class="label">CONTACT</div>
                  <div class="value">${offer.companyContact || "+91 9676272283"}</div>
                </div>
              </div>

              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <div class="contact-info-text">
                  <div class="label">WEBSITE</div>
                  <div class="value">${offer.companyWebsite || "www.hragroups.com"}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="page-number-footer">
            <span>HRA GROUPS PRIVATE LIMITED</span>
            <span>Page 2 of 2</span>
          </div>
        </div>
      `;
    } else {
      // 3-page document structure for Employee / Operations Executive with Annexure Table
      pagesContent = `
        <!-- PAGE 1 -->
        <div class="page-container">
          <div class="page-header-accent"></div>

          <!-- Logo -->
          <div class="logo-header">
            <img class="logo-img" src="/logo.png" alt="HRA Groups Logo" onerror="this.src='/logo_transparent.png'" />
          </div>

          <!-- Document Title -->
          <h1 class="document-title">Employment Offer Letter</h1>

          <!-- Date & Ref -->
          <div class="date-row">
            <span>Ref: <strong>${offer.offerNumber || 'Draft'}</strong></span>
            <span>Date: <strong>${dateFormatted}</strong></span>
          </div>

          <!-- Recipient -->
          <div class="recipient-block">
            <strong>To,</strong><br/>
            <strong>${offer.candidateName}</strong><br/>
            ${offer.email}<br/>
            ${offer.phone}
          </div>

          <p class="body-p">
            We are pleased to offer you the position of <strong>${offer.position}</strong> in our <strong>${offer.department}</strong> division at <strong>${offer.companyName || "HRA GROUPS PRIVATE LIMITED"}</strong>. Your joining date is set for <strong>${joiningFormatted}</strong> under the mentorship of <strong>${offer.reportingManager || "Department Lead"}</strong>.
          </p>

          <!-- Employment Details Section -->
          <h3 class="section-title">Employment Details</h3>
          <div class="details-grid">
            <div class="grid-card">
              <span class="card-label">Position</span>
              <span class="card-value">${offer.position}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Company Name</span>
              <span class="card-value">${offer.companyName || "HRA GROUPS PRIVATE LIMITED"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Onboarding Date</span>
              <span class="card-value">${joiningFormatted}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Working Days</span>
              <span class="card-value">${offer.workingDays || "Monday to Saturday"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Working Hours</span>
              <span class="card-value">${offer.workingHours || "9:30 AM to 6:30 PM"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Mode of Work</span>
              <span class="card-value">${offer.workMode || "Full-Time"}</span>
            </div>
          </div>

          <!-- Compensation and Benefits Section -->
          <h3 class="section-title">Compensation and Benefits</h3>
          <div class="details-grid">
            <div class="grid-card">
              <span class="card-label">Annual CTC</span>
              <span class="card-value">₹${Number(offer.totalCTC || 0).toLocaleString("en-IN")}/- per annum</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Probation Period</span>
              <span class="card-value">${offer.probationPeriod || "6 Months"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Notice Period</span>
              <span class="card-value">${offer.noticePeriod || "90 Days"}</span>
            </div>
            <div class="grid-card">
              <span class="card-label">Work Location</span>
              <span class="card-value">${offer.workLocation || "Madhapur - Hyderabad"}</span>
            </div>
          </div>
          <ul class="details-list font-medium">
            <li>Detailed compensation breakdown is provided in Annexure 1.</li>
            <li>Performance recognition and career advancement opportunities.</li>
            <li>Paid leaves and statutory benefits as per company policy.</li>
          </ul>

          <h3 class="section-title">Roles & Responsibilities</h3>
          <p class="body-intro">As a <strong>${offer.position}</strong>, your responsibilities include:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.rolesResponsibilities)}
          </ul>

          <!-- Footer -->
          <div class="page-number-footer">
            <span>HRA GROUPS PRIVATE LIMITED</span>
            <span>Page 1 of 3</span>
          </div>
        </div>

        <!-- PAGE 2 -->
        <div class="page-container page-break">
          <div class="page-header-accent"></div>

          <div style="height: 15px;"></div>

          ${offer.trainingSessions && offer.trainingSessions.trim() ? `
          <h3 class="section-title">Training Details</h3>
          <p class="body-intro">During your onboarding/employment, you will receive training/exposure to:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.trainingSessions)}
          </ul>
          ` : ""}

          <h3 class="section-title">Code of Conduct & Expectations</h3>
          <p class="body-intro">You are expected to maintain:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.codeOfConduct)}
          </ul>

          <h3 class="section-title">Performance Evaluation & KRAs</h3>
          <p class="body-intro">Your performance will be evaluated based on:</p>
          <ul class="details-list font-medium">
            ${renderListItems(offer.performanceEvaluation)}
          </ul>

          <p class="body-p" style="margin-top: 25px;">
            Please refer to the subsequent page for a comprehensive components-based structural breakdown of your Cost to Company (CTC) figures.
          </p>

          <!-- Footer -->
          <div class="page-number-footer">
            <span>HRA GROUPS PRIVATE LIMITED</span>
            <span>Page 2 of 3</span>
          </div>
        </div>

        <!-- PAGE 3 (Annexure 1 Table matching Image 3) -->
        <div class="page-container page-break">
          <div class="page-header-accent"></div>

          <h1 class="document-title" style="font-size: 18px; text-decoration: underline; margin-top: 30px; margin-bottom: 20px;">Annexure 1</h1>

          <!-- Annexure Table styled exactly like screenshot Image 3 -->
          <table class="annexure-table">
            <thead>
              <tr class="annexure-title-row">
                <th colspan="3">${offer.position} ${offer.gradeBand || "G3"}</th>
              </tr>
              <tr class="annexure-header-row">
                <th>Components</th>
                <th style="width: 200px;">Per month (INR)</th>
                <th style="width: 200px;">Annual (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base Salary</td>
                <td>${Number(offer.baseSalary || 0).toLocaleString("en-IN")}</td>
                <td>${(Number(offer.baseSalary || 0) * 12).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>House Rent Allowance (HRA)</td>
                <td>${Number(offer.hra || 0).toLocaleString("en-IN")}</td>
                <td>${(Number(offer.hra || 0) * 12).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>Other allowance including flexible components</td>
                <td>${(
          Number(offer.specialAllowance || 0) +
          Number(offer.conveyanceAllowance || 0) +
          Number(offer.medicalAllowance || 0) +
          Number(offer.otherAllowances || 0) +
          Number(offer.pfContribution || 0) +
          Number(offer.esiContribution || 0) +
          Number(offer.gratuity || 0)
        ).toLocaleString("en-IN")}</td>
                <td>${((
          Number(offer.specialAllowance || 0) +
          Number(offer.conveyanceAllowance || 0) +
          Number(offer.medicalAllowance || 0) +
          Number(offer.otherAllowances || 0) +
          Number(offer.pfContribution || 0) +
          Number(offer.esiContribution || 0) +
          Number(offer.gratuity || 0)
        ) * 12).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>Performance based Incentive (Variable)</td>
                <td>up to ${Number(offer.variablePay || 0).toLocaleString("en-IN")}</td>
                <td>up to ${(Number(offer.variablePay || 0) * 12).toLocaleString("en-IN")}</td>
              </tr>
              <tr class="highlight-row">
                <td>Fixed compensation (In Hand)</td>
                <td>${results.fixedComp.toLocaleString("en-IN")}</td>
                <td>${(results.fixedComp * 12).toLocaleString("en-IN")}</td>
              </tr>
              <tr class="highlight-row font-bold">
                <td>Cost to Company (CTC)</td>
                <td style="background-color: #fbfaff;"></td>
                <td>${results.totalCTC.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <!-- Sign-Off Footer -->
          <div class="footer-signoff-row" style="margin-top: 35px;">
            <!-- Regards & Stamp Left -->
            <div class="stamp-col">
              <span class="regards-title">Regards,</span>
              
              <div style="display: flex; align-items: center; gap: 20px;">
                <!-- Circular stamp -->
                <div class="circular-stamp">
                  <svg viewBox="0 0 100 100" class="stamp-svg" style="fill: transparent;">
                    <!-- Outer double circle -->
                    <circle cx="50" cy="50" r="45" stroke="#5025d1" stroke-width="1.8" fill="none" />
                    <circle cx="50" cy="50" r="42" stroke="#5025d1" stroke-width="0.6" fill="none" />
                    
                    <!-- Inner dashed circle -->
                    <circle cx="50" cy="50" r="28" stroke="#5025d1" stroke-width="0.6" fill="none" stroke-dasharray="0.8, 0.8" />
                    
                    <!-- Text paths -->
                    <path id="stampTextTop" d="M 14 50 A 36 36 0 0 1 86 50" fill="none" />
                    <path id="stampTextBottom" d="M 14 50 A 36 36 0 0 0 86 50" fill="none" />
                    
                    <text fill="#5025d1" font-size="8" font-weight="800" font-family="'Roboto', sans-serif" letter-spacing="1">
                      <textPath href="#stampTextTop" startOffset="50%" text-anchor="middle">HRA GROUPS</textPath>
                    </text>
                    
                    <text fill="#5025d1" font-size="8" font-weight="800" font-family="'Roboto', sans-serif" letter-spacing="1">
                      <textPath href="#stampTextBottom" startOffset="50%" text-anchor="middle">PVT LTD</textPath>
                    </text>
                    
                    <!-- Stars -->
                    <text x="17.5" y="52.5" fill="#5025d1" font-size="7.5" font-weight="bold" text-anchor="middle">★</text>
                    <text x="82.5" y="52.5" fill="#5025d1" font-size="7.5" font-weight="bold" text-anchor="middle">★</text>
                    
                    <!-- Center elements -->
                    <text x="50" y="42" fill="#5025d1" font-size="17" font-weight="900" font-family="'Roboto', sans-serif" text-anchor="middle" letter-spacing="0.5">HRA</text>
                    
                    <!-- Cursive Signature for P. Hemanth -->
                    <text x="50" y="52" fill="#5025d1" font-size="9" font-family="'Dancing Script', 'Brush Script MT', cursive" font-weight="bold" text-anchor="middle">P. Hemanth</text>
                    <line x1="30" y1="54" x2="70" y2="54" stroke="#5025d1" stroke-width="0.8" />
                    
                    <!-- Subtexts -->
                    <text x="50" y="63" fill="#5025d1" font-size="4.8" font-weight="700" font-family="'Roboto', sans-serif" text-anchor="middle">Founder &amp; CEO</text>
                    <text x="50" y="69" fill="#5025d1" font-size="5.2" font-weight="700" font-family="'Roboto', sans-serif" text-anchor="middle">Hemanth Pulavarthi</text>
                  </svg>
                </div>

                ${offer.companyLogo ? `
                  <!-- Custom Org Logo -->
                  <div class="custom-org-logo-container">
                    <img src="${offer.companyLogo}" alt="Organization Logo" class="custom-org-logo-img" />
                  </div>
                ` : ''}
              </div>

              <span class="sign-name">HRA GROUPS MANAGEMENT</span>
            </div>

            <!-- Address contact block Right -->
            <div class="contact-card">
              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div class="contact-info-text">
                  <div class="label">ADDRESS</div>
                  <div class="value">${offer.companyAddress || "Madhapur - Hyderabad"}</div>
                </div>
              </div>

              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <div class="contact-info-text">
                  <div class="label">CONTACT</div>
                  <div class="value">${offer.companyContact || "+91 9676272283"}</div>
                </div>
              </div>

              <div class="contact-item">
                <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <div class="contact-info-text">
                  <div class="label">WEBSITE</div>
                  <div class="value">${offer.companyWebsite || "www.hragroups.com"}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="page-number-footer">
            <span>HRA GROUPS PRIVATE LIMITED</span>
            <span>Page 3 of 3</span>
          </div>
        </div>
      `;
    }

    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <base href="${baseOrigin}/">
          <title>${offer.employmentType === 'Internship' ? 'Internship' : 'Employee'} Offer Letter - ${offer.candidateName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Dancing+Script:wght@700&display=swap');
            
            @page {
              size: A4;
              margin: 0;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Roboto', sans-serif;
              color: #334155;
              background-color: #f1f5f9;
              padding: 0;
            }
            .page-container {
              position: relative;
              width: 210mm;
              height: 297mm;
              margin: 20px auto;
              background-color: #ffffff;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
              padding: 55px 60px 70px 60px;
              box-sizing: border-box;
              overflow: hidden;
            }

            /* Decorative Header Accent (double geometric border) */
            .page-header-accent {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 10px;
              background-color: #646199;
              border-bottom: 3px solid #73a4a7;
            }
            
            /* Professional Page Number & Trademark Footer */
            .page-number-footer {
              position: absolute;
              bottom: 25px;
              left: 60px;
              right: 60px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8px;
              color: #94a3b8;
              font-weight: 600;
              border-top: 1px solid #f1f5f9;
              padding-top: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            /* Branding Header */
            .logo-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-top: 10px;
              margin-bottom: 15px;
            }
            .logo-img {
              height: 60px;
              object-fit: contain;
              display: block;
            }

            /* Titles */
            .document-title {
              font-size: 20px;
              font-weight: 900;
              color: #1e1b4b;
              text-align: center;
              margin-top: 30px;
              margin-bottom: 22px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .date-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .recipient-block {
              font-size: 12px;
              line-height: 1.6;
              color: #1e1b4b;
              margin-bottom: 25px;
            }
            .body-p {
              font-size: 11px;
              line-height: 1.6;
              color: #475569;
              margin-bottom: 18px;
              text-align: justify;
            }
            .body-intro {
              font-size: 11px;
              font-weight: 700;
              color: #1e1b4b;
              margin-bottom: 8px;
            }

            /* Sections & Custom Bullet lists */
            .section-title {
              font-size: 11px;
              font-weight: 900;
              color: #1e1b4b;
              margin-top: 22px;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-title::after {
              content: "";
              flex: 1;
              height: 1px;
              background: linear-gradient(90deg, #d7573b 0%, #e2e8f0 100%);
            }

            /* Dual-column Details Grid */
            .details-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .grid-card {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            .card-label {
              font-size: 7.5px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .card-value {
              font-size: 10.5px;
              font-weight: 700;
              color: #1e1b4b;
            }

            .details-list {
              list-style-type: none;
              margin-bottom: 18px;
            }
            .details-list li {
              font-size: 10.5px;
              color: #475569;
              line-height: 1.55;
              margin-bottom: 6px;
              position: relative;
              padding-left: 14px;
            }
            .details-list li::before {
              content: "■";
              color: #4f46e5;
              font-size: 7px;
              position: absolute;
              left: 0;
              top: 1px;
            }
            .font-medium li {
              font-weight: 500;
              color: #475569;
            }

            /* Modern Premium Table */
            .annexure-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 10px;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }
            .annexure-table th, .annexure-table td {
              border: 1px solid #e2e8f0;
              padding: 9px 12px;
              text-align: left;
            }
            .annexure-title-row th {
              background-color: #1e1b4b;
              text-align: center;
              font-weight: 800;
              font-size: 11.5px;
              color: #ffffff;
              padding: 11px;
              border: 1px solid #1e1b4b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .annexure-header-row th {
              background-color: #f8fafc;
              font-weight: 700;
              color: #1e1b4b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-size: 9.5px;
            }
            .annexure-table tbody tr td:nth-child(2),
            .annexure-table tbody tr td:nth-child(3) {
              text-align: right;
            }
            .annexure-table .highlight-row td {
              background-color: #eef2ff;
              font-weight: 700;
              color: #1e1b4b;
            }
            .annexure-table .font-bold td {
              font-weight: 800;
              font-size: 10.5px;
              color: #1e1b4b;
              background-color: #f8fafc;
            }

            /* Sign-Off Footer styling */
            .footer-signoff-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 35px;
            }
            .stamp-col {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .regards-title {
              font-size: 13px;
              font-weight: 800;
              color: #475569;
            }
            .sign-name {
              font-size: 10.5px;
              font-weight: 800;
              color: #1e1b4b;
              margin-top: 5px;
            }

            /* High fidelity circular stamp */
            .circular-stamp {
              position: relative;
              width: 120px;
              height: 120px;
              transform: rotate(-6deg);
              margin: 10px 0;
              background-color: transparent;
            }
            .stamp-svg {
              position: absolute;
              width: 100%;
              height: 100%;
              top: 0;
              left: 0;
            }
            .custom-org-logo-container {
              width: 120px;
              height: 120px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #f1f5f9;
              border-radius: 8px;
              padding: 8px;
              background-color: #ffffff;
            }
            .custom-org-logo-img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }

            /* Modern Contact Card */
            .contact-card {
              display: flex;
              flex-direction: column;
              gap: 8px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px;
              width: 250px;
            }
            .contact-item {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .contact-icon {
              width: 13px;
              height: 13px;
              color: #4f46e5;
              flex-shrink: 0;
            }
            .contact-item .label {
              font-size: 8px;
              font-weight: 800;
              color: #818cf8;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 1px;
            }
            .contact-item .value {
              font-size: 9px;
              font-weight: 600;
              color: #334155;
              line-height: 1.35;
            }

            /* Printing Rules */
            .no-print-bar {
              position: fixed;
              top: 15px;
              left: 50%;
              transform: translateX(-50%);
              background: #1e1b4b;
              color: white;
              padding: 10px 20px;
              border-radius: 9999px;
              display: flex;
              gap: 14px;
              align-items: center;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              z-index: 99999;
              font-size: 11px;
              font-family: 'Roboto', sans-serif;
            }
            .no-print-btn-primary {
              background: #4f46e5;
              color: white;
              border: none;
              padding: 6px 14px;
              border-radius: 9999px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.2s;
            }
            .no-print-btn-primary:hover {
              background: #3730a3;
            }
            .no-print-btn-secondary {
              background: transparent;
              border: 1px solid #818cf8;
              color: #c7d2fe;
              padding: 6px 12px;
              border-radius: 9999px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s;
            }
            .no-print-btn-secondary:hover {
              color: white;
              border-color: #818cf8;
            }

            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background-color: #ffffff;
                padding: 0;
              }
              .page-container {
                margin: 0;
                box-shadow: none;
                width: 210mm;
                height: 297mm;
                page-break-after: always;
              }
              .page-break {
                page-break-before: always;
              }
              .no-print-bar {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <span style="font-weight: 600; color: #d5dfff;">Offer Letter Preview Mode</span>
            <button class="no-print-btn-primary" onclick="window.print()">Print / Save as PDF</button>
            <button class="no-print-btn-secondary" onclick="window.close()">Close Preview</button>
          </div>
          ${pagesContent}
          <script>
            window.onload = function() {
              if (document.fonts) {
                document.fonts.ready.then(function() {
                  setTimeout(function() {
                    window.print();
                  }, 300);
                });
              } else {
                setTimeout(function() {
                  window.print();
                }, 1000);
              }
            };
          </script>
        </body>
      </html>
    `;
  };

  // Printable action
  const handlePrintOffer = (offer) => {
    const printWindow = window.open('', '_blank');
    const content = generateOfferLetterHTML(offer);
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  // Metrics calculation
  const totalOffers = offers.length;
  const draftOffersCount = offers.filter(o => o.status === "Draft").length;
  const sentOffers = offers.filter(o => o.status === "Sent").length;
  const acceptedOffers = offers.filter(o => o.status === "Accepted").length;
  const rejectedOffers = offers.filter(o => o.status === "Rejected").length;
  const expiredOffers = offers.filter(o => o.status === "Expired").length;

  // Joining This Month check
  const joiningThisMonth = offers.filter(o => {
    if (!o.joiningDate) return false;
    try {
      const joinDate = new Date(o.joiningDate);
      const today = new Date();
      return joinDate.getMonth() === today.getMonth() && joinDate.getFullYear() === today.getFullYear();
    } catch {
      return false;
    }
  }).length;

  // Filter & Search Logic
  const filteredOffers = offers.filter(offer => {
    const matchesSearch =
      offer.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.offerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || offer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Offer Management Module</h1>
          <p className="text-xs text-slate-500">Draft, approve, and send internship and employee offer letters. Automatically preview and print/download letter documents.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab(activeTab === "dashboard" ? "create" : "dashboard")}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {activeTab === "dashboard" ? (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Offer</span>
              </>
            ) : (
              <>
                <span>View Dashboard</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === "dashboard" ? (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Offers</span>
              <span className="text-xl font-bold text-slate-950 mt-2">{totalOffers}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Draft Offers</span>
              <span className="text-xl font-bold text-amber-600 mt-2">{draftOffersCount}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sent Offers</span>
              <span className="text-xl font-bold text-blue-600 mt-2">{sentOffers}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Accepted</span>
              <span className="text-xl font-bold text-emerald-600 mt-2">{acceptedOffers}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
              <span className="text-xl font-bold text-rose-600 mt-2">{rejectedOffers}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expired</span>
              <span className="text-xl font-bold text-slate-500 mt-2">{expiredOffers}</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Join This Month</span>
              <span className="text-xl font-bold text-indigo-600 mt-2">{joiningThisMonth}</span>
            </div>
          </div>

          {/* List panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Filter and search bar */}
            <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900 text-sm">Offer Verification Ledger</h3>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search candidate name, ref..."
                    className="pl-8 pr-4 py-2 w-full sm:w-60 rounded-xl border border-slate-200 text-xs bg-white text-slate-950 focus:outline-none focus:border-indigo-400 transition-all font-semibold"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-bold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                  <option value="Joined">Joined</option>
                </select>
              </div>
            </div>

            {/* Offers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Offer Ref / Date</th>
                    <th className="py-3.5 px-6">Candidate Details</th>
                    <th className="py-3.5 px-6">Role & Dept</th>
                    <th className="py-3.5 px-6">Compensation</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/60 text-xs font-semibold text-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold italic">
                        Loading offers ledger...
                      </td>
                    </tr>
                  ) : filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold italic">
                        No offers found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((offer) => {
                      const isIntern = offer.employmentType === "Internship";
                      const compensationVal = isIntern
                        ? `₹${Number(offer.monthlyStipend).toLocaleString("en-IN")}/Mo Stipend`
                        : `₹${Number(offer.totalCTC).toLocaleString("en-IN")}/Yr CTC`;

                      const dateFormatted = offer.createdAt ? formatDateDMY(offer.createdAt.split("T")[0]) : formatDateDMY(new Date().toISOString().split("T")[0]);

                      return (
                        <tr key={offer.id || offer._id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-900">{offer.offerNumber}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{dateFormatted}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-900">{offer.candidateName}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{offer.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-slate-900">{offer.position}</span>
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-1.5 py-0.2 rounded w-fit uppercase text-[8px] border border-indigo-100">
                                {offer.employmentType}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {compensationVal}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${offer.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              offer.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                offer.status === "Accepted" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                  offer.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                    offer.status === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                      "bg-slate-100 text-slate-600 border-slate-200"
                              }`}>
                              {offer.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              {offer.status === "Draft" ? (
                                <button
                                  onClick={() => handleUpdateStatus(offer.id || offer._id, "Approved", "Offer approved from list console.")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer animate-pulse"
                                >
                                  Approve
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedOffer(offer);
                                      setShowPreviewModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                  >
                                    View / Review
                                  </button>

                                  <button
                                    onClick={() => handlePrintOffer(offer)}
                                    className="p-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 flex items-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                                    title="Print / Download PDF"
                                  >
                                    <Printer className="w-3 h-3" />
                                    <span>PDF</span>
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleDeleteOffer(offer.id || offer._id)}
                                className="p-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 flex items-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                                title="Delete Offer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Form view */
        <form onSubmit={e => handleSubmitOffer(e, "Draft")} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Fields - 7 Columns */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-slate-900 text-sm">Candidate & Offer Specifications</h3>
                <p className="text-[11px] text-slate-400">Complete information brackets to dynamically compile contract templates.</p>
              </div>
              <select
                name="templateName"
                value={formData.templateName}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-bold"
              >
                <option value="Internship Offer Letter">Internship Template</option>
                <option value="Employee Offer Letter">Standard Employee Template</option>
                <option value="Sales Executive Offer Letter">Sales Executive Template</option>
                <option value="Operations Executive Offer Letter">Operations Executive Template</option>
                <option value="Work From Home Offer Letter">WFH Employee Template</option>
                <option value="Contract Employee Offer Letter">Contract Employee Template</option>
              </select>
            </div>

            {/* Candidate Info Section */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Information</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Candidate Name</label>
                  <input
                    required
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleChange}
                    placeholder="Candidate Name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Candidate ID</label>
                  <input
                    type="text"
                    name="candidateId"
                    value={formData.candidateId}
                    onChange={handleChange}
                    placeholder="e.g. HRA-CAND-901"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="candidate@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Permanent Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, City, PIN"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Position Applied For</label>
                  <input
                    required
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none font-bold"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Human Resource">Human Resource</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Reporting Manager</label>
                  <select
                    name="reportingManager"
                    value={formData.reportingManager}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none font-bold"
                  >
                    <option value="">Select Manager</option>
                    {employees.filter(u => u.role === "Manager" || u.role === "Admin").map(mgr => (
                      <option key={mgr.id || mgr._id} value={mgr.name}>
                        {mgr.name} ({mgr.department})
                      </option>
                    ))}
                    <option value="Sarah Jenkins">Sarah Jenkins (HR)</option>
                    <option value="Daniel Cooper">Daniel Cooper (Engineering)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employment Specifications */}
            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Details</span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none font-bold"
                  >
                    <option value="Full Time">Full-Time</option>
                    <option value="Part Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Grade / Band</label>
                  <input
                    type="text"
                    name="gradeBand"
                    value={formData.gradeBand}
                    onChange={handleChange}
                    placeholder="e.g. G1, G2, M1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Work Mode</label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none font-bold"
                  >
                    <option value="WFO">WFO (Office)</option>
                    <option value="WFH">WFH (Remote)</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Joining Date</label>
                  <input
                    required
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Probation Period</label>
                  <input
                    type="text"
                    name="probationPeriod"
                    value={formData.probationPeriod}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Notice Period</label>
                  <input
                    type="text"
                    name="noticePeriod"
                    value={formData.noticePeriod}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Work Location / Address</label>
                  <input
                    type="text"
                    name="workLocation"
                    value={formData.workLocation}
                    onChange={handleChange}
                    placeholder="e.g. Madhapur - Hyderabad"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Working Days</label>
                  <input
                    type="text"
                    name="workingDays"
                    value={formData.workingDays}
                    onChange={handleChange}
                    placeholder="Monday to Saturday"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Corporate Profile customization */}
            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Stamp & Layout Profile</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Corporate Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Working Hours</label>
                  <input
                    type="text"
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Company Contact Number</label>
                  <input
                    type="text"
                    name="companyContact"
                    value={formData.companyContact}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Corporate Website</label>
                  <input
                    type="text"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Corporate Office Hub</label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Corporate Logo (Upload image)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
                {formData.companyLogo && (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 w-fit">
                    <img src={formData.companyLogo} alt="Logo Preview" className="h-10 object-contain max-w-[150px]" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, companyLogo: "" }))}
                      className="text-xs text-rose-600 font-bold hover:text-rose-800 transition-colors"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Conditionally Render Internship Details or Regular Salaries */}
            {formData.employmentType === "Internship" ? (
              /* Internship Form Section */
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Internship Structure Details</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Internship Duration</label>
                    <input
                      type="text"
                      name="internshipDuration"
                      value={formData.internshipDuration}
                      onChange={handleChange}
                      placeholder="e.g. 3 Months"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Monthly Stipend (₹)</label>
                    <input
                      type="number"
                      name="monthlyStipend"
                      value={formData.monthlyStipend}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Mentor Assigned</label>
                    <input
                      type="text"
                      name="mentorAssigned"
                      value={formData.mentorAssigned}
                      onChange={handleChange}
                      placeholder="Mentor Name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Training Program</label>
                    <input
                      type="text"
                      name="trainingProgram"
                      value={formData.trainingProgram}
                      onChange={handleChange}
                      placeholder="e.g. Frontend Development BootCamp"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Certificate Eligibility</label>
                    <select
                      name="internshipCertificateEligibility"
                      value={formData.internshipCertificateEligibility}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none font-bold"
                    >
                      <option value="Yes">Yes, upon completion</option>
                      <option value="No">No (Uncertified training)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* Regular Compensation Form Section */
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Salary Structure (Monthly Components)</span>
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Base Salary (₹)</label>
                    <input
                      type="number"
                      name="baseSalary"
                      value={formData.baseSalary}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">HRA (₹)</label>
                    <input
                      type="number"
                      name="hra"
                      value={formData.hra}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Special Allow. (₹)</label>
                    <input
                      type="number"
                      name="specialAllowance"
                      value={formData.specialAllowance}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Other Allow. (₹)</label>
                    <input
                      type="number"
                      name="otherAllowances"
                      value={formData.otherAllowances}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Conveyance (₹)</label>
                    <input
                      type="number"
                      name="conveyanceAllowance"
                      value={formData.conveyanceAllowance}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Medical Allow. (₹)</label>
                    <input
                      type="number"
                      name="medicalAllowance"
                      value={formData.medicalAllowance}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Performance (₹)</label>
                    <input
                      type="number"
                      name="variablePay"
                      value={formData.variablePay}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Annual Bonus (₹)</label>
                    <input
                      type="number"
                      name="bonus"
                      value={formData.bonus}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">PF Contribution (Monthly ₹)</label>
                    <input
                      type="number"
                      name="pfContribution"
                      value={formData.pfContribution}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">ESI Contribution (Monthly ₹)</label>
                    <input
                      type="number"
                      name="esiContribution"
                      value={formData.esiContribution}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Gratuity Provision (Monthly ₹)</label>
                    <input
                      type="number"
                      name="gratuity"
                      value={formData.gratuity}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Annexure Points (Roles, Training, Conduct, KPIs) */}
            <div className="flex flex-col gap-4 border-t border-slate-100 pt-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Custom Annexure Details & Rules</span>
              </span>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Roles & Responsibilities (One item per line)</label>
                <textarea
                  rows={6}
                  name="rolesResponsibilities"
                  value={formData.rolesResponsibilities}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 font-medium"
                  placeholder="Enter one role/responsibility per line..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Training & Onboarding Details (One item per line)</label>
                <textarea
                  rows={4}
                  name="trainingSessions"
                  value={formData.trainingSessions}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 font-medium"
                  placeholder="Enter training/onboarding details..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Code of Conduct & Rules (One item per line)</label>
                <textarea
                  rows={4}
                  name="codeOfConduct"
                  value={formData.codeOfConduct}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 font-medium"
                  placeholder="Enter code of conduct points..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Evaluation Aspects & KRAs (One item per line)</label>
                <textarea
                  rows={4}
                  name="performanceEvaluation"
                  value={formData.performanceEvaluation}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 font-medium"
                  placeholder="Enter performance evaluation criteria or KRAs..."
                />
              </div>
            </div>
          </div>

          {/* Right Calculations & Actions - 5 Columns */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Compensation Ledger Preview */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm text-left flex flex-col gap-6">
              <div className="flex flex-col gap-1 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Calculated Financial Breakup</h3>
                <p className="text-[11px] text-slate-400">Preview calculated cost-to-company structures in real-time.</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/60 font-bold text-slate-400 uppercase text-[9px]">
                      <th className="py-2.5 px-3">Brackets</th>
                      <th className="py-2.5 px-3 text-right">Monthly (₹)</th>
                      <th className="py-2.5 px-3 text-right">Annual (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {formData.employmentType === "Internship" ? (
                      <>
                        <tr>
                          <td className="py-2.5 px-3">Consolidated Stipend</td>
                          <td className="py-2.5 px-3 text-right">₹{compResults.monthlyFixed.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 px-3 text-right">₹{compResults.annualFixed.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr className="bg-indigo-50/50 font-bold text-indigo-900 text-xs">
                          <td className="py-2.5 px-3">Total Internship Valuation</td>
                          <td className="py-2.5 px-3 text-right">—</td>
                          <td className="py-2.5 px-3 text-right">₹{compResults.totalCTC.toLocaleString("en-IN")}</td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="py-2 px-3">Base Salary</td>
                          <td className="py-2 px-3 text-right">₹{(Number(formData.baseSalary) || 0).toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3 text-right">₹{((Number(formData.baseSalary) || 0) * 12).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">House Rent Allowance (HRA)</td>
                          <td className="py-2 px-3 text-right">₹{(Number(formData.hra) || 0).toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3 text-right">₹{((Number(formData.hra) || 0) * 12).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">Other Allowances & Retirals</td>
                          <td className="py-2 px-3 text-right">
                            ₹{(
                              (Number(formData.specialAllowance) || 0) +
                              (Number(formData.conveyanceAllowance) || 0) +
                              (Number(formData.medicalAllowance) || 0) +
                              (Number(formData.otherAllowances) || 0) +
                              (Number(formData.pfContribution) || 0) +
                              (Number(formData.esiContribution) || 0) +
                              (Number(formData.gratuity) || 0)
                            ).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 px-3 text-right">
                            ₹{(
                              ((Number(formData.specialAllowance) || 0) +
                                (Number(formData.conveyanceAllowance) || 0) +
                                (Number(formData.medicalAllowance) || 0) +
                                (Number(formData.otherAllowances) || 0) +
                                (Number(formData.pfContribution) || 0) +
                                (Number(formData.esiContribution) || 0) +
                                (Number(formData.gratuity) || 0)) * 12
                            ).toLocaleString("en-IN")}
                          </td>
                        </tr>
                        <tr className="bg-emerald-50/40 text-emerald-800 font-bold text-xs">
                          <td className="py-2 px-3">Fixed Compensation (In Hand)</td>
                          <td className="py-2 px-3 text-right">₹{compResults.fixedComp.toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3 text-right">₹{(compResults.fixedComp * 12).toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">Performance Incentive (Variable)</td>
                          <td className="py-2 px-3 text-right">up to ₹{compResults.monthlyVariable.toLocaleString("en-IN")}</td>
                          <td className="py-2 px-3 text-right">up to ₹{compResults.annualVariable.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3">Bonus / Ex-Gratia</td>
                          <td className="py-2 px-3 text-right">—</td>
                          <td className="py-2 px-3 text-right">₹{compResults.bonus.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr className="bg-indigo-50 text-indigo-900 font-extrabold text-xs">
                          <td className="py-2.5 px-3">Cost to Company (CTC)</td>
                          <td className="py-2.5 px-3 text-right">—</td>
                          <td className="py-2.5 px-3 text-right">₹{compResults.totalCTC.toLocaleString("en-IN")}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-4 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workflow Approvals</span>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? "Processing..." : "Save Draft Option"}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={e => handleSubmitOffer(e, "Approved")}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Lock Offer</span>
                </button>
              </div>

              <div className="p-3 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-[10px] font-semibold flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Create offer letters as <strong>Drafts</strong> or directly <strong>Approve & Lock</strong> them to generate final printable PDFs and enable email dispatch.
                </span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Review details & workflow Modal */}
      {showPreviewModal && selectedOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden text-left border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offer Reference Detail</span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1 flex items-center gap-2">
                  <span>{selectedOffer.offerNumber}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${selectedOffer.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    selectedOffer.status === "Sent" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      selectedOffer.status === "Accepted" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                        selectedOffer.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-100" :
                          selectedOffer.status === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                    {selectedOffer.status}
                  </span>
                </h3>
              </div>

              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedOffer(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable details area */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Col - Candidate & Employment */}
                <div className="flex flex-col gap-5">
                  <div className="p-5 border border-slate-100 rounded-2xl flex flex-col gap-4 bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">Candidate Profile</span>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Candidate Name</span>
                        <span className="font-bold text-slate-900">{selectedOffer.candidateName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Candidate ID</span>
                        <span className="font-bold text-slate-800">{selectedOffer.candidateId || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Email</span>
                        <span className="font-bold text-slate-800">{selectedOffer.email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Phone</span>
                        <span className="font-bold text-slate-800">{selectedOffer.phone || "—"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Address</span>
                        <span className="font-bold text-slate-800">{selectedOffer.address || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border border-slate-100 rounded-2xl flex flex-col gap-4 bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">Employment Parameters</span>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Role Applied For</span>
                        <span className="font-bold text-slate-900">{selectedOffer.position}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Department</span>
                        <span className="font-bold text-slate-800">{selectedOffer.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Employment Type</span>
                        <span className="font-bold text-slate-800">{selectedOffer.employmentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Joining Date</span>
                        <span className="font-bold text-slate-800">{formatDateDMY(selectedOffer.joiningDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Work Mode / Location</span>
                        <span className="font-bold text-slate-800">{selectedOffer.workMode} / {selectedOffer.workLocation || "HQ"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Template Used</span>
                        <span className="font-bold text-slate-800">{selectedOffer.templateName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Col - Finances / Intern & Approval History */}
                <div className="flex flex-col gap-5">
                  {/* Finances / Intern Details */}
                  {selectedOffer.employmentType === "Internship" ? (
                    <div className="p-5 border border-slate-100 rounded-2xl flex flex-col gap-4 bg-slate-50/30">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">Internship Components</span>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Duration</span>
                          <span className="font-bold text-slate-900">{selectedOffer.internshipDuration}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Monthly Stipend</span>
                          <span className="font-bold text-slate-900">₹{Number(selectedOffer.monthlyStipend).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Training Program</span>
                          <span className="font-bold text-slate-800">{selectedOffer.trainingProgram}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Mentor Assigned</span>
                          <span className="font-bold text-slate-800">{selectedOffer.mentorAssigned || "—"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Learning Modules</span>
                          <span className="font-bold text-slate-800">{selectedOffer.learningModules || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 border border-slate-100 rounded-2xl flex flex-col gap-4 bg-slate-50/30">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">Financial Breakup</span>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Base Salary (Mo)</span>
                          <span className="font-bold text-slate-900">₹{Number(selectedOffer.baseSalary).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">HRA Allowance (Mo)</span>
                          <span className="font-bold text-slate-900">₹{Number(selectedOffer.hra).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Fixed Comp (Monthly)</span>
                          <span className="font-bold text-indigo-600">₹{Number(selectedOffer.fixedComp).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Total CTC (Annualized)</span>
                          <span className="font-bold text-indigo-600">₹{Number(selectedOffer.totalCTC).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Performance Pay (Mo)</span>
                          <span className="font-bold text-slate-800">up to ₹{Number(selectedOffer.variablePay).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px] uppercase">Allowances & Retirals</span>
                          <span className="font-bold text-slate-800">
                            ₹{(
                              (Number(selectedOffer.specialAllowance) || 0) +
                              (Number(selectedOffer.conveyanceAllowance) || 0) +
                              (Number(selectedOffer.medicalAllowance) || 0) +
                              (Number(selectedOffer.otherAllowances) || 0) +
                              (Number(selectedOffer.pfContribution) || 0) +
                              (Number(selectedOffer.esiContribution) || 0) +
                              (Number(selectedOffer.gratuity) || 0)
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* History Logs */}
                  <div className="p-5 border border-slate-100 rounded-2xl flex flex-col gap-4 bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">Approval History</span>
                    <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto">
                      {(selectedOffer.history || []).map((h, i) => (
                        <div key={i} className="flex gap-3 text-xs items-start border-l border-indigo-100 pl-3.5 relative ml-2">
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-indigo-500 -left-[5.5px] top-1.5 border border-white" />
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 uppercase text-[9px]">{h.status}</span>
                              <span className="text-[8px] text-slate-400 font-semibold">
                                {h.updatedAt ? new Date(h.updatedAt).toLocaleString("en-IN") : "—"}
                              </span>
                            </div>
                            <span className="text-slate-500 font-medium text-[10px]">{h.comments}</span>
                            <span className="text-[8px] text-slate-400 font-bold">Actor: {h.updatedBy}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Workflow Control Footer */}
            <div className="border-t border-slate-100 pt-6 mt-6 flex flex-wrap gap-3 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintOffer(selectedOffer)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate & Print Offer</span>
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this offer letter permanently?")) {
                      const id = selectedOffer._id || selectedOffer.id;
                      const res = await apiClient.deleteOffer(id);
                      if (res.success) {
                        setOffers(prev => prev.filter(o => o.id !== id && o._id !== id));
                        setShowPreviewModal(false);
                        setSelectedOffer(null);
                        setSuccessMsg("Offer letter deleted successfully.");
                        setTimeout(() => setSuccessMsg(""), 3000);
                      } else {
                        setErrorMsg(res.message || "Failed to delete offer.");
                        setTimeout(() => setErrorMsg(""), 3000);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Offer</span>
                </button>
              </div>

              <div className="flex gap-2">
                {selectedOffer.status === "Draft" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOffer._id || selectedOffer.id, "Approved", "Offer approved directly.")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Approve Offer
                  </button>
                )}

                {selectedOffer.status === "Approved" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOffer._id || selectedOffer.id, "Sent", "Offer letter dispatched to candidate email.")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Send Offer Letter
                  </button>
                )}

                {selectedOffer.status === "Sent" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedOffer._id || selectedOffer.id, "Accepted", "Candidate signed and returned the offer sheet.")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Mark Accepted
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedOffer._id || selectedOffer.id, "Rejected", "Candidate declined the parameters of this offer.")}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Mark Rejected
                    </button>
                  </>
                )}

                {selectedOffer.status === "Accepted" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOffer._id || selectedOffer.id, "Joined", "Candidate onboarding completed and user active in directory.")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Mark Joined
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
