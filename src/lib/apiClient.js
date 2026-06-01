// Resilient API Client with offline/unreachable MongoDB localStorage fail-safe fallback

const DEFAULT_SEEDS = [
  {
    id: "seed-1",
    name: "HRA Admin",
    email: "hragroups@gmail.com",
    password: "Hraconnect@7890",
    role: "Admin",
    department: "Operations",
    permissions: "Full Access",
    status: "Active",
    session: "Offline",
    initials: "HA",
    badgeColor: "bg-slate-900 text-white",
    profileCompleted: true,
    verificationStatus: "Approved",
    phone: "9876543210",
    dob: "1988-04-12",
    address: "HQ Operations Core Room",
    emergencyContactName: "Security Desk",
    emergencyContactPhone: "9876543211"
  },
  {
    id: "seed-2",
    name: "Sarah Jenkins",
    email: "sarah.j@hraconnect.com",
    password: "password123",
    role: "HR",
    department: "Human Resources",
    permissions: "Read/Write",
    status: "Active",
    session: "Offline",
    initials: "SJ",
    badgeColor: "bg-indigo-600 text-white",
    profileCompleted: true,
    verificationStatus: "Approved",
    phone: "9876543210",
    dob: "1991-08-23",
    address: "HRA Office Desk 4",
    emergencyContactName: "Daniel Jenkins",
    emergencyContactPhone: "9876543212"
  },
  {
    id: "seed-3",
    name: "Daniel Cooper",
    email: "daniel.c@hraconnect.com",
    password: "password123",
    role: "Manager",
    department: "Engineering",
    permissions: "Read/Write",
    status: "Active",
    session: "Offline",
    initials: "DC",
    badgeColor: "bg-emerald-600 text-white",
    profileCompleted: true,
    verificationStatus: "Approved",
    phone: "9876543210",
    dob: "1989-11-05",
    address: "HQ Tech Suite B",
    emergencyContactName: "Mary Cooper",
    emergencyContactPhone: "9876543213"
  },
  {
    id: "seed-4",
    name: "John Doe",
    email: "employee@hraconnect.com",
    password: "password123",
    role: "Employee",
    department: "Engineering",
    permissions: "Read/Write",
    status: "Active",
    session: "Offline",
    initials: "JD",
    badgeColor: "bg-rose-600 text-white",
    profileCompleted: true,
    verificationStatus: "Approved",
    phone: "9876543210",
    dob: "1993-02-14",
    address: "123 Operational Avenue",
    emergencyContactName: "Jane Doe",
    emergencyContactPhone: "9876543214"
  },
  {
    id: "seed-5",
    name: "Jane Smith",
    email: "intern@hraconnect.com",
    password: "password123",
    role: "Intern",
    department: "Design",
    permissions: "Read Only",
    status: "Active",
    session: "Offline",
    initials: "JS",
    badgeColor: "bg-amber-600 text-white",
    profileCompleted: true,
    verificationStatus: "Approved",
    phone: "9876543210",
    dob: "1997-06-30",
    address: "456 Learning Way",
    emergencyContactName: "Bob Smith",
    emergencyContactPhone: "9876543215"
  },
  {
    id: "seed-6",
    name: "Elena Rostova",
    email: "elena.r@hraconnect.com",
    password: "password123",
    role: "HR",
    department: "Human Resources",
    permissions: "Read Only",
    status: "Suspended",
    session: "Offline",
    initials: "ER",
    badgeColor: "bg-purple-600 text-white",
    profileCompleted: true,
    verificationStatus: "Approved",
    phone: "9876543210",
    dob: "1992-09-12",
    address: "789 HR Boulevard",
    emergencyContactName: "Alex Rostov",
    emergencyContactPhone: "9876543216"
  }
];

function initializeLocalStorage() {
  if (typeof window === "undefined") return;
  const existing = localStorage.getItem("hra_users");
  if (!existing) {
    localStorage.setItem("hra_users", JSON.stringify(DEFAULT_SEEDS));
  }
}

export const apiClient = {
  // Login standard session authentication
  login: async (email, password) => {
    initializeLocalStorage();
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Try to communicate with MongoDB backend Route Handler
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem("currentUser", JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        const errorData = await response.json();
        // If DB throws error, fall back to offline/localStorage check instead of throwing
        console.warn("DB Auth failed, attempting LocalStorage fallback...", errorData.message);
      }
    } catch (err) {
      console.warn("MongoDB auth server unreachable. Falling back to LocalStorage...", err);
    }

    // LocalStorage Fallback logic
    if (typeof window !== "undefined") {
      const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const matchedUser = users.find(u => u.email.toLowerCase().trim() === normalizedEmail);

      if (matchedUser) {
        if (password === matchedUser.password) {
          // Set session status to Online
          matchedUser.session = "Online";
          localStorage.setItem("hra_users", JSON.stringify(users));

          const sessionPayload = { ...matchedUser };
          delete sessionPayload.password; // Do not leak password in session state

          localStorage.setItem("currentUser", JSON.stringify(sessionPayload));
          return { success: true, user: sessionPayload };
        } else {
          return { success: false, message: "Invalid secure credentials. Password incorrect." };
        }
      }
    }

    return { success: false, message: "Invalid credentials. Account workspace not found." };
  },

  // Request password recovery code
  requestPasswordCode: async (email) => {
    initializeLocalStorage();
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_code", email: normalizedEmail })
      });
      
      const data = await response.json();
      if (response.ok) {
        return { success: true, code: data.code, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Simulating code generation locally...", err);
      
      if (typeof window !== "undefined") {
        const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
        const userExists = users.some(u => u.email.toLowerCase().trim() === normalizedEmail);
        if (!userExists) {
          return { success: false, message: "No registered workspace account found with that email address." };
        }
        
        const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
        const updatedUsers = users.map(u => {
          if (u.email.toLowerCase().trim() === normalizedEmail) {
            return { ...u, resetCode: mockCode, resetCodeExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
          }
          return u;
        });
        localStorage.setItem("hra_users", JSON.stringify(updatedUsers));
        
        return { 
          success: true, 
          code: mockCode, 
          message: "Offline local simulation mode: A secure code has been generated." 
        };
      }
    }
    return { success: false, message: "Network connection error" };
  },

  // Apply password reset using code
  resetPassword: async (email, code, newPassword) => {
    initializeLocalStorage();
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", email: normalizedEmail, code, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        if (typeof window !== "undefined") {
          const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const updated = users.map(u => {
            if (u.email.toLowerCase().trim() === normalizedEmail) {
              return { ...u, password: newPassword, resetCode: "", resetCodeExpires: null };
            }
            return u;
          });
          localStorage.setItem("hra_users", JSON.stringify(updated));
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Applying password reset in LocalStorage...", err);

      if (typeof window !== "undefined") {
        const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
        const matched = users.find(u => u.email.toLowerCase().trim() === normalizedEmail);

        if (!matched) {
          return { success: false, message: "User account not found." };
        }

        if (!matched.resetCode || matched.resetCode !== code.trim()) {
          return { success: false, message: "Invalid secure verification code." };
        }

        if (new Date() > new Date(matched.resetCodeExpires)) {
          return { success: false, message: "Verification code has expired." };
        }

        const updated = users.map(u => {
          if (u.email.toLowerCase().trim() === normalizedEmail) {
            return { ...u, password: newPassword, resetCode: "", resetCodeExpires: null };
          }
          return u;
        });
        localStorage.setItem("hra_users", JSON.stringify(updated));

        return { success: true, message: "Password reset successfully in local memory context." };
      }
    }
    return { success: false, message: "Network connection error" };
  },

  // Change password for active session
  changePassword: async (email, currentPassword, newPassword) => {
    initializeLocalStorage();
    const normalizedEmail = email.toLowerCase().trim();

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, currentPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        if (typeof window !== "undefined") {
          const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const updated = users.map(u => {
            if (u.email.toLowerCase().trim() === normalizedEmail) {
              return { ...u, password: newPassword };
            }
            return u;
          });
          localStorage.setItem("hra_users", JSON.stringify(updated));
        }
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Attempting password update locally...", err);

      if (typeof window !== "undefined") {
        const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
        const idx = users.findIndex(u => u.email.toLowerCase().trim() === normalizedEmail);

        if (idx === -1) {
          return { success: false, message: "User account not found." };
        }

        const matchedUser = users[idx];
        if (currentPassword !== matchedUser.password) {
          return { success: false, message: "Your current password is incorrect." };
        }

        users[idx].password = newPassword;
        localStorage.setItem("hra_users", JSON.stringify(users));

        return { success: true, message: "Password updated successfully in local memory." };
      }
    }
    return { success: false, message: "Network connection error" };
  },

  // Get list of all accounts
  getUsers: async () => {
    initializeLocalStorage();

    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const users = await response.json();
        // Sync with local storage
        if (typeof window !== "undefined") {
          // Keep passwords from localStorage for offline logins
          const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const synced = users.map(u => {
            const match = localUsers.find(lu => lu.email === u.email);
            return match ? { ...u, password: match.password } : u;
          });
          localStorage.setItem("hra_users", JSON.stringify(synced));
        }
        return users;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting users list from LocalStorage...", err);
    }

    // LocalStorage Fallback list
    if (typeof window !== "undefined") {
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      return localUsers.map(u => {
        const payload = { ...u };
        return payload;
      });
    }
    return DEFAULT_SEEDS;
  },

  // Create new user record
  createUser: async (userData) => {
    initializeLocalStorage();
    const { name, email, password, role, department, permissions, status } = userData;

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, department, permissions, status })
      });

      if (response.ok) {
        const newUser = await response.json();
        // Also append password locally for offline auth support
        if (typeof window !== "undefined") {
          const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
          localUsers.push({ ...newUser, password });
          localStorage.setItem("hra_users", JSON.stringify(localUsers));
        }
        return { success: true, user: newUser };
      } else {
        const err = await response.json();
        console.warn("DB user creation failed, attempting LocalStorage save...", err.message);
        return { success: false, message: err.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Creating user directly in LocalStorage...", err);
    }

    // LocalStorage fallback create
    if (typeof window !== "undefined") {
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const normalizedEmail = email.toLowerCase().trim();

      if (localUsers.some(u => u.email.toLowerCase().trim() === normalizedEmail)) {
        return { success: false, message: "User with this email already exists in system context" };
      }

      const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";
      const colors = [
        "bg-slate-900 text-white",
        "bg-indigo-600 text-white",
        "bg-emerald-600 text-white",
        "bg-rose-600 text-white",
        "bg-purple-600 text-white",
        "bg-amber-600 text-white"
      ];
      const badgeColor = colors[normalizedEmail.length % colors.length];

      const isApprovedRole = role === "Admin" || role === "HR" || role === "Manager";
      const profileCompleted = isApprovedRole;
      const verificationStatus = isApprovedRole ? "Approved" : "Unsubmitted";

      const newUser = {
        id: `local-${Date.now()}`,
        name,
        email: normalizedEmail,
        password,
        role,
        department: department || "Operations",
        permissions: permissions || "Read/Write",
        status: status || "Active",
        session: "Offline",
        initials,
        badgeColor,
        profileCompleted,
        verificationStatus,
        phone: "",
        dob: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: ""
      };

      localUsers.push(newUser);
      localStorage.setItem("hra_users", JSON.stringify(localUsers));

      return { success: true, user: newUser };
    }

    return { success: false, message: "System environment unavailable" };
  },

  // Delete user record by ID (with resilient LocalStorage fallback)
  deleteUser: async (id) => {
    initializeLocalStorage();

    try {
      // First, attempt to delete via MongoDB API
      const response = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // If DB deletion succeeded, also sync LocalStorage immediately
        if (typeof window !== "undefined") {
          const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const updatedUsers = localUsers.filter(u => u.id !== id && u._id !== id);
          localStorage.setItem("hra_users", JSON.stringify(updatedUsers));
        }
        return { success: true, message: "User deleted successfully from database and local storage" };
      } else {
        const err = await response.json();
        console.warn("DB user deletion failed, attempting LocalStorage purge...", err.message);
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting user directly from LocalStorage...", err);
    }

    // LocalStorage fallback delete
    if (typeof window !== "undefined") {
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const initialLength = localUsers.length;
      // Filter out by either id (for local-*) or possible db _id
      const updatedUsers = localUsers.filter(u => u.id !== id && u._id !== id);
      
      if (updatedUsers.length < initialLength) {
        localStorage.setItem("hra_users", JSON.stringify(updatedUsers));
        return { success: true, message: "User deleted successfully from local storage context" };
      } else {
        return { success: false, message: "User not found in local workspace scope" };
      }
    }

    return { success: false, message: "System environment unavailable" };
  },

  // Clear current active session
  logout: () => {
    if (typeof window !== "undefined") {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (currentUser) {
        // Mark session as offline in localStorage list
        const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
        const idx = localUsers.findIndex(u => u.email === currentUser.email);
        if (idx !== -1) {
          localUsers[idx].session = "Offline";
          localStorage.setItem("hra_users", JSON.stringify(localUsers));
        }
      }
      localStorage.removeItem("currentUser");
    }
  },

  // Submit profile completion details (with resilient LocalStorage fallback)
  submitProfile: async (id, details) => {
    initializeLocalStorage();
    const { phone, dob, address, emergencyContactName, emergencyContactPhone, aadhaarNumber, userPhoto, aadhaarPhoto } = details;

    let email = "";
    if (typeof window !== "undefined") {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (currentUser) {
        email = currentUser.email;
      }
    }

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          email,
          action: "submit_profile",
          phone,
          dob,
          address,
          emergencyContactName,
          emergencyContactPhone,
          aadhaarNumber,
          userPhoto,
          aadhaarPhoto
        })
      });

      if (response.ok) {
        // Also update local cache for the active session and index
        if (typeof window !== "undefined") {
          // Update active session profile Completed & status
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
          if (currentUser && (currentUser.id === id || currentUser._id === id)) {
            currentUser.phone = phone;
            currentUser.dob = dob;
            currentUser.address = address;
            currentUser.emergencyContactName = emergencyContactName;
            currentUser.emergencyContactPhone = emergencyContactPhone;
            currentUser.aadhaarNumber = aadhaarNumber;
            currentUser.userPhoto = userPhoto;
            currentUser.aadhaarPhoto = aadhaarPhoto;
            currentUser.verificationStatus = "Pending";
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
          }
          
          // Update local storage user list
          const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const idx = localUsers.findIndex(u => u.id === id || u._id === id);
          if (idx !== -1) {
            localUsers[idx].phone = phone;
            localUsers[idx].dob = dob;
            localUsers[idx].address = address;
            localUsers[idx].emergencyContactName = emergencyContactName;
            localUsers[idx].emergencyContactPhone = emergencyContactPhone;
            localUsers[idx].aadhaarNumber = aadhaarNumber;
            localUsers[idx].userPhoto = userPhoto;
            localUsers[idx].aadhaarPhoto = aadhaarPhoto;
            localUsers[idx].verificationStatus = "Pending";
            localStorage.setItem("hra_users", JSON.stringify(localUsers));
          }
        }
        return { success: true, message: "Profile details submitted for verification" };
      } else {
        const errData = await response.json();
        return { success: false, message: errData.message || "Failed to submit profile details." };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Submitting profile directly to LocalStorage...", err);
    }

    // LocalStorage fallback submission
    if (typeof window !== "undefined") {
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const idx = localUsers.findIndex(u => u.id === id || u._id === id);
      if (idx !== -1) {
        localUsers[idx].phone = phone;
        localUsers[idx].dob = dob;
        localUsers[idx].address = address;
        localUsers[idx].emergencyContactName = emergencyContactName;
        localUsers[idx].emergencyContactPhone = emergencyContactPhone;
        localUsers[idx].aadhaarNumber = aadhaarNumber;
        localUsers[idx].userPhoto = userPhoto;
        localUsers[idx].aadhaarPhoto = aadhaarPhoto;
        localUsers[idx].verificationStatus = "Pending";
        localStorage.setItem("hra_users", JSON.stringify(localUsers));

        // Update active session
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
        if (currentUser && (currentUser.id === id || currentUser._id === id)) {
          currentUser.phone = phone;
          currentUser.dob = dob;
          currentUser.address = address;
          currentUser.emergencyContactName = emergencyContactName;
          currentUser.emergencyContactPhone = emergencyContactPhone;
          currentUser.aadhaarNumber = aadhaarNumber;
          currentUser.userPhoto = userPhoto;
          currentUser.aadhaarPhoto = aadhaarPhoto;
          currentUser.verificationStatus = "Pending";
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        return { success: true, message: "Profile details submitted locally for verification" };
      }
    }

    return { success: false, message: "System environment unavailable" };
  },

  // Verify and Approve Profile Details (with resilient LocalStorage fallback)
  approveProfile: async (id, email) => {
    initializeLocalStorage();

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, action: "verify_approve" })
      });

      if (response.ok) {
        if (typeof window !== "undefined") {
          // Update in local users list
          const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const idx = localUsers.findIndex(u => u.id === id || u._id === id);
          if (idx !== -1) {
            localUsers[idx].profileCompleted = true;
            localUsers[idx].verificationStatus = "Approved";
            localUsers[idx].status = "Active";
            localStorage.setItem("hra_users", JSON.stringify(localUsers));
          }

          // If the approved user is current session (e.g. self, though rare)
          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
          if (currentUser && (currentUser.id === id || currentUser._id === id)) {
            currentUser.profileCompleted = true;
            currentUser.verificationStatus = "Approved";
            currentUser.status = "Active";
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
          }
        }
        return { success: true, message: "Profile verified and approved successfully" };
      } else {
        const errData = await response.json();
        return { success: false, message: errData.message || "Failed to approve profile." };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Approving profile directly in LocalStorage...", err);
    }

    // LocalStorage fallback approval
    if (typeof window !== "undefined") {
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const idx = localUsers.findIndex(u => u.id === id || u._id === id);
      if (idx !== -1) {
        localUsers[idx].profileCompleted = true;
        localUsers[idx].verificationStatus = "Approved";
        localUsers[idx].status = "Active";
        localStorage.setItem("hra_users", JSON.stringify(localUsers));

        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
        if (currentUser && (currentUser.id === id || currentUser._id === id)) {
          currentUser.profileCompleted = true;
          currentUser.verificationStatus = "Approved";
          currentUser.status = "Active";
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        return { success: true, message: "Profile verified and approved locally" };
      }
    }

    return { success: false, message: "User not found in local workspace scope" };
  },

  // Reject and prompt profile correction (with resilient LocalStorage fallback)
  rejectProfile: async (id, email) => {
    initializeLocalStorage();

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, action: "verify_reject" })
      });

      if (response.ok) {
        if (typeof window !== "undefined") {
          const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const idx = localUsers.findIndex(u => u.id === id || u._id === id);
          if (idx !== -1) {
            localUsers[idx].profileCompleted = false;
            localUsers[idx].verificationStatus = "Rejected";
            localStorage.setItem("hra_users", JSON.stringify(localUsers));
          }

          const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
          if (currentUser && (currentUser.id === id || currentUser._id === id)) {
            currentUser.profileCompleted = false;
            currentUser.verificationStatus = "Rejected";
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
          }
        }
        return { success: true, message: "Profile verification rejected successfully" };
      } else {
        const errData = await response.json();
        return { success: false, message: errData.message || "Failed to reject profile." };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Rejecting profile directly in LocalStorage...", err);
    }

    // LocalStorage fallback rejection
    if (typeof window !== "undefined") {
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const idx = localUsers.findIndex(u => u.id === id || u._id === id);
      if (idx !== -1) {
        localUsers[idx].profileCompleted = false;
        localUsers[idx].verificationStatus = "Rejected";
        localStorage.setItem("hra_users", JSON.stringify(localUsers));

        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
        if (currentUser && (currentUser.id === id || currentUser._id === id)) {
          currentUser.profileCompleted = false;
          currentUser.verificationStatus = "Rejected";
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        return { success: true, message: "Profile verification rejected locally" };
      }
    }

    return { success: false, message: "User not found in local workspace scope" };
  },

  // Get current active session
  getCurrentSession: () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("currentUser");
      return user ? JSON.parse(user) : null;
    }
    return null;
  },

  // Get all payrolls or payrolls filtered by employee email
  getPayrolls: async (userEmail = null) => {
    try {
      // Try MongoDB API first
      const url = userEmail
        ? `/api/payroll?email=${encodeURIComponent(userEmail)}`
        : `/api/payroll`;
      const response = await fetch(url);
      if (response.ok) {
        const payrolls = await response.json();
        console.log("[PAYROLL] Fetched from MongoDB API:", payrolls.length, "records");
        // Sync to localStorage as cache
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_payrolls", JSON.stringify(payrolls));
        }
        return payrolls;
      }
    } catch (err) {
      console.warn("[PAYROLL] MongoDB API unreachable. Falling back to localStorage...", err);
    }

    // LocalStorage fallback
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("hra_payrolls");
      let payrollsList = [];
      if (!existing) {
        payrollsList = [];
      } else {
        payrollsList = JSON.parse(existing);
      }

      if (userEmail) {
        return payrollsList.filter(p => p.userEmail.toLowerCase().trim() === userEmail.toLowerCase().trim());
      }
      return payrollsList;
    }
    return [];
  },

  // Create new payroll record
  createPayroll: async (payrollData) => {
    try {
      // Try MongoDB API first
      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payrollData),
      });

      if (response.ok) {
        const newPayroll = await response.json();
        console.log("[PAYROLL] Created in MongoDB:", newPayroll.id);
        // Also sync to localStorage cache
        if (typeof window !== "undefined") {
          const existing = localStorage.getItem("hra_payrolls") || "[]";
          const payrollsList = JSON.parse(existing);
          payrollsList.unshift(newPayroll);
          localStorage.setItem("hra_payrolls", JSON.stringify(payrollsList));
        }
        return { success: true, payroll: newPayroll };
      } else {
        const errData = await response.json();
        console.warn("[PAYROLL] DB creation failed:", errData.message);
      }
    } catch (err) {
      console.warn("[PAYROLL] MongoDB API unreachable. Creating payroll in localStorage...", err);
    }

    // LocalStorage fallback
    if (typeof window !== "undefined") {
      const existing = localStorage.getItem("hra_payrolls") || "[]";
      const payrollsList = JSON.parse(existing);
      
      const newPayroll = {
        id: `PAY-${Date.now()}`,
        ...payrollData,
        date: new Date().toISOString().split("T")[0]
      };

      payrollsList.unshift(newPayroll);
      localStorage.setItem("hra_payrolls", JSON.stringify(payrollsList));
      return { success: true, payroll: newPayroll };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Get all corporate holidays (with resilient local storage fallback)
  getHolidays: async () => {
    try {
      const response = await fetch("/api/holidays");
      if (response.ok) {
        const holidays = await response.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_holidays", JSON.stringify(holidays));
        }
        return holidays;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting holidays list from LocalStorage...", err);
    }

    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("hra_holidays") || "[]");
    }
    return [];
  },

  // Create new holiday record
  createHoliday: async (holidayData) => {
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayData)
      });
      if (response.ok) {
        const newHol = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
          stored.push(newHol);
          localStorage.setItem("hra_holidays", JSON.stringify(stored));
        }
        return { success: true, holiday: newHol };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Saving holiday locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
      const newHol = { id: `local-${Date.now()}`, ...holidayData };
      stored.push(newHol);
      localStorage.setItem("hra_holidays", JSON.stringify(stored));
      return { success: true, holiday: newHol };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Update an existing holiday
  updateHoliday: async (id, holidayData) => {
    try {
      const response = await fetch("/api/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...holidayData })
      });
      if (response.ok) {
        const updated = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
          const idx = stored.findIndex(h => h.id === id);
          if (idx !== -1) {
            stored[idx] = updated;
            localStorage.setItem("hra_holidays", JSON.stringify(stored));
          }
        }
        return { success: true, holiday: updated };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating holiday locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
      const idx = stored.findIndex(h => h.id === id);
      if (idx !== -1) {
        stored[idx] = { id, ...holidayData };
        localStorage.setItem("hra_holidays", JSON.stringify(stored));
      }
      return { success: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Delete a holiday
  deleteHoliday: async (id) => {
    try {
      const response = await fetch(`/api/holidays?id=${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
          const filtered = stored.filter(h => h.id !== id);
          localStorage.setItem("hra_holidays", JSON.stringify(filtered));
        }
        return { success: true };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting holiday locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_holidays") || "[]");
      const filtered = stored.filter(h => h.id !== id);
      localStorage.setItem("hra_holidays", JSON.stringify(filtered));
      return { success: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Get custom events
  getEvents: async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const events = await response.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_calendar_events", JSON.stringify(events));
        }
        return events;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting events list from LocalStorage...", err);
    }

    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("hra_calendar_events") || "[]");
    }
    return [];
  },

  // Create event
  createEvent: async (eventData) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      });
      if (response.ok) {
        const newEv = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_calendar_events") || "[]");
          stored.push(newEv);
          localStorage.setItem("hra_calendar_events", JSON.stringify(stored));
        }
        return { success: true, event: newEv };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Saving event locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_calendar_events") || "[]");
      const newEv = { id: `local-${Date.now()}`, ...eventData };
      stored.push(newEv);
      localStorage.setItem("hra_calendar_events", JSON.stringify(stored));
      return { success: true, event: newEv };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Get all corporate announcements
  getAnnouncements: async () => {
    try {
      const response = await fetch("/api/announcements");
      if (response.ok) {
        const data = await response.json();
        if (data.success && typeof window !== "undefined") {
          localStorage.setItem("hra_announcements", JSON.stringify(data.announcements));
        }
        return data.success ? data.announcements : [];
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting announcements from LocalStorage...", err);
    }

    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("hra_announcements") || "[]");
    }
    return [];
  },

  // Create new announcement (HR/Admin only)
  createAnnouncement: async (announcementData) => {
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementData),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_announcements") || "[]");
          stored.unshift(data.announcement);
          localStorage.setItem("hra_announcements", JSON.stringify(stored));
        }
        return data;
      } else {
        const err = await response.json();
        console.warn("DB announcement creation failed:", err.message);
        return { success: false, message: err.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Creating announcement directly in LocalStorage...", err);
    }

    // LocalStorage fallback for creating an announcement
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_announcements") || "[]");
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

      const localNew = {
        id: `local-${Date.now()}`,
        title: announcementData.title,
        content: announcementData.content,
        category: announcementData.category || "General",
        priority: announcementData.priority || "Medium",
        createdByName: currentUser?.name || "HR Officer",
        createdByEmail: currentUser?.email || "hragroups@gmail.com",
        createdByRole: currentUser?.role || "HR",
        targetRole: announcementData.targetRole || "All",
        pinned: Boolean(announcementData.pinned),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      stored.unshift(localNew);
      localStorage.setItem("hra_announcements", JSON.stringify(stored));
      return { success: true, announcement: localNew, offline: true };
    }
    return { success: false, message: "System environment unavailable" };
  },

  // Delete an announcement by ID
  deleteAnnouncement: async (id) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      const emailQuery = currentUser ? `&email=${encodeURIComponent(currentUser.email)}` : "";
      const response = await fetch(`/api/announcements?id=${id}${emailQuery}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_announcements") || "[]");
          const filtered = stored.filter((a) => a.id !== id && a._id !== id);
          localStorage.setItem("hra_announcements", JSON.stringify(filtered));
        }
        return data;
      } else {
        const err = await response.json();
        console.warn("DB announcement deletion failed:", err.message);
        return { success: false, message: err.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting announcement from LocalStorage...", err);
    }

    // LocalStorage fallback
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_announcements") || "[]");
      const filtered = stored.filter((a) => a.id !== id && a._id !== id);
      localStorage.setItem("hra_announcements", JSON.stringify(filtered));
      return { success: true, message: "Deleted successfully from local storage", offline: true };
    }
    return { success: false, message: "System environment unavailable" };
  }
};

