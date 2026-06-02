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

    // Clear any existing session cookie to avoid session drift
    if (typeof window !== "undefined") {
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    }

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
  getUsers: async (params = {}) => {
    initializeLocalStorage();

    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/users${queryString ? "?" + queryString : ""}`);
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
          // Only overwrite local list if we queried all users
          if (!params.verificationStatus && !params.id) {
            localStorage.setItem("hra_users", JSON.stringify(synced));
          }
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
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
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
  },

  // -------------------------------------------------------------
  // Organization Management API Client Methods
  // -------------------------------------------------------------

  // Get all departments
  getDepartments: async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const departments = await response.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_departments", JSON.stringify(departments));
        }
        return departments;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting departments list from LocalStorage...", err);
    }

    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("hra_departments") || "[]");
    }
    return [];
  },

  // Create new department
  createDepartment: async (deptData) => {
    const currentUser = apiClient.getCurrentSession();
    const emailQuery = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : "";
    try {
      const response = await fetch(`/api/departments${emailQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...deptData, email: currentUser?.email })
      });
      if (response.ok) {
        const newDept = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_departments") || "[]");
          stored.push(newDept);
          localStorage.setItem("hra_departments", JSON.stringify(stored));
        }
        return { success: true, department: newDept };
      } else {
        const err = await response.json();
        return { success: false, message: err.message || "Failed to create department" };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Saving department locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_departments") || "[]");
      const newDept = { id: `local-${Date.now()}`, ...deptData };
      stored.push(newDept);
      localStorage.setItem("hra_departments", JSON.stringify(stored));
      return { success: true, department: newDept, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Delete department
  deleteDepartment: async (id) => {
    const currentUser = apiClient.getCurrentSession();
    const emailQuery = currentUser ? `&email=${encodeURIComponent(currentUser.email)}` : "";
    try {
      const response = await fetch(`/api/departments?id=${id}${emailQuery}`, {
        method: "DELETE"
      });
      if (response.ok) {
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_departments") || "[]");
          const filtered = stored.filter(d => d.id !== id && d._id !== id);
          localStorage.setItem("hra_departments", JSON.stringify(filtered));
        }
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, message: err.message || "Failed to delete department" };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting department locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_departments") || "[]");
      const filtered = stored.filter(d => d.id !== id && d._id !== id);
      localStorage.setItem("hra_departments", JSON.stringify(filtered));
      return { success: true, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Get all teams
  getTeams: async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const teams = await response.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_teams", JSON.stringify(teams));
        }
        return teams;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting teams list from LocalStorage...", err);
    }

    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("hra_teams") || "[]");
    }
    return [];
  },

  // Create new team
  createTeam: async (teamData) => {
    const currentUser = apiClient.getCurrentSession();
    const emailQuery = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : "";
    try {
      const response = await fetch(`/api/teams${emailQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...teamData, email: currentUser?.email })
      });
      if (response.ok) {
        const newTeam = await response.json();
        
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_teams") || "[]");
          stored.push(newTeam);
          localStorage.setItem("hra_teams", JSON.stringify(stored));

          // Sync users locally
          const depts = JSON.parse(localStorage.getItem("hra_departments") || "[]");
          const dept = depts.find(d => d.id === teamData.departmentId || d._id === teamData.departmentId);
          const deptName = dept ? dept.name : teamData.departmentId;

          if (deptName) {
            const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
            const allAssigned = [teamData.managerId, ...(teamData.members || [])];
            users.forEach((u, i) => {
              if (allAssigned.includes(u.id) || allAssigned.includes(u._id)) {
                users[i].department = deptName;
              }
            });
            localStorage.setItem("hra_users", JSON.stringify(users));
          }
        }
        return { success: true, team: newTeam };
      } else {
        const err = await response.json();
        return { success: false, message: err.message || "Failed to create team" };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Saving team locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_teams") || "[]");
      const newTeam = { id: `local-${Date.now()}`, ...teamData };
      stored.push(newTeam);
      localStorage.setItem("hra_teams", JSON.stringify(stored));

      // Sync users locally
      const depts = JSON.parse(localStorage.getItem("hra_departments") || "[]");
      const dept = depts.find(d => d.id === teamData.departmentId || d._id === teamData.departmentId);
      const deptName = dept ? dept.name : teamData.departmentId;

      if (deptName) {
        const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
        const allAssigned = [teamData.managerId, ...(teamData.members || [])];
        users.forEach((u, i) => {
          if (allAssigned.includes(u.id) || allAssigned.includes(u._id)) {
            users[i].department = deptName;
          }
        });
        localStorage.setItem("hra_users", JSON.stringify(users));
      }

      return { success: true, team: newTeam, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Update an existing team
  updateTeam: async (id, teamData) => {
    const currentUser = apiClient.getCurrentSession();
    const emailQuery = currentUser ? `?email=${encodeURIComponent(currentUser.email)}` : "";
    try {
      const response = await fetch(`/api/teams${emailQuery}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...teamData, email: currentUser?.email })
      });
      if (response.ok) {
        const updatedTeam = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_teams") || "[]");
          const idx = stored.findIndex(t => t.id === id || t._id === id);
          if (idx !== -1) {
            stored[idx] = updatedTeam;
            localStorage.setItem("hra_teams", JSON.stringify(stored));
          }

          // Sync users locally
          const depts = JSON.parse(localStorage.getItem("hra_departments") || "[]");
          const dept = depts.find(d => d.id === teamData.departmentId || d._id === teamData.departmentId);
          const deptName = dept ? dept.name : teamData.departmentId;

          if (deptName) {
            const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
            const prevTeam = stored.find(t => t.id === id || t._id === id);
            const oldUsers = prevTeam ? [prevTeam.managerId, ...(prevTeam.members || [])].map(uid => uid.id || uid._id || uid) : [];
            const newUsers = [teamData.managerId, ...(teamData.members || [])].map(uid => uid.id || uid._id || uid);
            const removedUsers = oldUsers.filter(uid => !newUsers.includes(uid));

            users.forEach((u, i) => {
              const uIdStr = u.id || u._id;
              if (newUsers.includes(uIdStr)) {
                users[i].department = deptName;
              } else if (removedUsers.includes(uIdStr)) {
                users[i].department = "Operations";
              }
            });
            localStorage.setItem("hra_users", JSON.stringify(users));
          }
        }
        return { success: true, team: updatedTeam };
      } else {
        const err = await response.json();
        return { success: false, message: err.message || "Failed to update team" };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating team locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_teams") || "[]");
      const idx = stored.findIndex(t => t.id === id || t._id === id);
      const prevTeam = idx !== -1 ? stored[idx] : null;

      const newTeam = { id, ...teamData };
      if (idx !== -1) {
        stored[idx] = newTeam;
      } else {
        stored.push(newTeam);
      }
      localStorage.setItem("hra_teams", JSON.stringify(stored));

      // Sync users locally
      const depts = JSON.parse(localStorage.getItem("hra_departments") || "[]");
      const dept = depts.find(d => d.id === teamData.departmentId || d._id === teamData.departmentId);
      const deptName = dept ? dept.name : teamData.departmentId;

      if (deptName) {
        const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
        const oldUsers = prevTeam ? [prevTeam.managerId, ...(prevTeam.members || [])].map(uid => uid.id || uid._id || uid) : [];
        const newUsers = [teamData.managerId, ...(teamData.members || [])].map(uid => uid.id || uid._id || uid);
        const removedUsers = oldUsers.filter(uid => !newUsers.includes(uid));

        users.forEach((u, i) => {
          const uIdStr = u.id || u._id;
          if (newUsers.includes(uIdStr)) {
            users[i].department = deptName;
          } else if (removedUsers.includes(uIdStr)) {
            users[i].department = "Operations";
          }
        });
        localStorage.setItem("hra_users", JSON.stringify(users));
      }

      return { success: true, team: newTeam, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Delete a team
  deleteTeam: async (id) => {
    const currentUser = apiClient.getCurrentSession();
    const emailQuery = currentUser ? `&email=${encodeURIComponent(currentUser.email)}` : "";
    try {
      const response = await fetch(`/api/teams?id=${id}${emailQuery}`, {
        method: "DELETE"
      });
      if (response.ok) {
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_teams") || "[]");
          const team = stored.find(t => t.id === id || t._id === id);
          if (team) {
            const teamUsers = [team.managerId, ...(team.members || [])].map(uid => uid.id || uid._id || uid);
            const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
            users.forEach((u, i) => {
              if (teamUsers.includes(u.id) || teamUsers.includes(u._id)) {
                users[i].department = "Operations";
              }
            });
            localStorage.setItem("hra_users", JSON.stringify(users));
          }

          const filtered = stored.filter(t => t.id !== id && t._id !== id);
          localStorage.setItem("hra_teams", JSON.stringify(filtered));
        }
        return { success: true };
      } else {
        const err = await response.json();
        return { success: false, message: err.message || "Failed to delete team" };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting team locally...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_teams") || "[]");
      const team = stored.find(t => t.id === id || t._id === id);
      if (team) {
        const teamUsers = [team.managerId, ...(team.members || [])].map(uid => uid.id || uid._id || uid);
        const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
        users.forEach((u, i) => {
          if (teamUsers.includes(u.id) || teamUsers.includes(u._id)) {
            users[i].department = "Operations";
          }
        });
        localStorage.setItem("hra_users", JSON.stringify(users));
      }

      const filtered = stored.filter(t => t.id !== id && t._id !== id);
      localStorage.setItem("hra_teams", JSON.stringify(filtered));
      return { success: true, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Get tasks with local storage fallback
  getTasks: async (params = {}) => {
    const userEmail = params.email || "";
    try {
      const queryString = userEmail ? `?email=${encodeURIComponent(userEmail)}` : "";
      const response = await fetch(`/api/tasks${queryString}`);
      if (response.ok) {
        const data = await response.json();
        const tasks = data.tasks || [];
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_tasks", JSON.stringify(tasks));
        }
        return tasks;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Loading tasks from localStorage fallback...", err);
    }

    if (typeof window !== "undefined" && userEmail) {
      const allTasks = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const normalizedEmail = userEmail.toLowerCase().trim();
      const currentUser = localUsers.find(u => u.email.toLowerCase().trim() === normalizedEmail);
      const role = currentUser ? currentUser.role : "Employee";

      if (role === "Manager") {
        return allTasks.filter(t => t.assignedByEmail?.toLowerCase().trim() === normalizedEmail);
      } else if (role === "Employee" || role === "Intern") {
        // Resolve manager ID / team details in local storage
        const teams = JSON.parse(localStorage.getItem("hra_teams") || "[]");
        const userTeams = teams.filter(t => 
          t.members?.some(m => {
            const mId = m.id || m._id || m;
            const uId = currentUser?.id || currentUser?._id;
            return mId?.toString() === uId?.toString();
          })
        );
        const managerEmails = userTeams.map(t => {
          const mId = t.managerId?.id || t.managerId?._id || t.managerId;
          const mgr = localUsers.find(lu => (lu.id || lu._id)?.toString() === mId?.toString());
          return mgr ? mgr.email.toLowerCase().trim() : "";
        }).filter(Boolean);

        return allTasks.filter(t => {
          const directMatch = t.assignedTo?.toLowerCase().trim() === normalizedEmail;
          const roleAndManagerMatch = t.assignedTo === "all" &&
            (t.assigneeRole === "All" || t.assigneeRole === role) &&
            managerEmails.includes(t.assignedByEmail?.toLowerCase().trim());
          return directMatch || roleAndManagerMatch;
        });
      } else if (role === "Admin" || role === "HR") {
        return allTasks;
      }
      return allTasks;
    }
    return [];
  },

  // Create a new task with local storage fallback
  createTask: async (taskData) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData)
      });
      if (response.ok) {
        const data = await response.json();
        const newTask = data.task;
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
          stored.unshift(newTask);
          localStorage.setItem("hra_tasks", JSON.stringify(stored));
        }
        return { success: true, task: newTask };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Creating task in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const creatorEmail = taskData.managerEmail?.toLowerCase().trim();
      const creator = localUsers.find(u => u.email.toLowerCase().trim() === creatorEmail);

      const newTask = {
        id: `task-${Date.now()}`,
        _id: `task-${Date.now()}`,
        title: taskData.title,
        description: taskData.description || "",
        assignedBy: creator ? (creator.id || creator._id) : "local-manager",
        assignedByEmail: creatorEmail,
        assignedTo: taskData.assignedTo ? taskData.assignedTo.toLowerCase().trim() : "all",
        assigneeRole: taskData.assigneeRole || "All",
        dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        status: "pending",
        progress: 0,
        completionNotes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      stored.unshift(newTask);
      localStorage.setItem("hra_tasks", JSON.stringify(stored));
      return { success: true, task: newTask, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Update a task with local storage fallback
  updateTask: async (id, taskData) => {
    try {
      const response = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...taskData })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedTask = data.task;
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
          const idx = stored.findIndex(t => (t.id === id || t._id === id));
          if (idx !== -1) {
            stored[idx] = updatedTask;
            localStorage.setItem("hra_tasks", JSON.stringify(stored));
          }
        }
        return { success: true, task: updatedTask };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating task in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
      const idx = stored.findIndex(t => (t.id === id || t._id === id));
      if (idx !== -1) {
        const updated = {
          ...stored[idx],
          ...taskData,
          updatedAt: new Date().toISOString()
        };
        stored[idx] = updated;
        localStorage.setItem("hra_tasks", JSON.stringify(stored));
        return { success: true, task: updated, offline: true };
      }
      return { success: false, message: "Task not found locally" };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Delete a task with local storage fallback
  deleteTask: async (id) => {
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
          const filtered = stored.filter(t => t.id !== id && t._id !== id);
          localStorage.setItem("hra_tasks", JSON.stringify(filtered));
        }
        return { success: true };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting task in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_tasks") || "[]");
      const filtered = stored.filter(t => t.id !== id && t._id !== id);
      localStorage.setItem("hra_tasks", JSON.stringify(filtered));
      return { success: true, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Get projects with local storage fallback
  getProjects: async (params = {}) => {
    const userEmail = params.email || "";
    try {
      const queryString = userEmail ? `?email=${encodeURIComponent(userEmail)}` : "";
      const response = await fetch(`/api/projects${queryString}`);
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_projects", JSON.stringify(projects));
        }
        return projects;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Loading projects from localStorage fallback...", err);
    }

    if (typeof window !== "undefined" && userEmail) {
      const allProjects = JSON.parse(localStorage.getItem("hra_projects") || "[]");
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const normalizedEmail = userEmail.toLowerCase().trim();
      const currentUser = localUsers.find(u => u.email.toLowerCase().trim() === normalizedEmail);
      const role = currentUser ? currentUser.role : "Employee";

      if (role === "Manager") {
        return allProjects.filter(p => p.assignedByEmail?.toLowerCase().trim() === normalizedEmail);
      } else if (role === "Employee" || role === "Intern") {
        return allProjects.filter(p => 
          p.assignedMembers?.some(m => m.email?.toLowerCase().trim() === normalizedEmail)
        );
      } else if (role === "Admin" || role === "HR") {
        return allProjects;
      }
      return allProjects.filter(p => 
        p.assignedMembers?.some(m => m.email?.toLowerCase().trim() === normalizedEmail)
      );
    }
    return [];
  },

  // Create project with local storage fallback
  createProject: async (projectData) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData)
      });
      if (response.ok) {
        const data = await response.json();
        const newProj = data.project;
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_projects") || "[]");
          stored.unshift(newProj);
          localStorage.setItem("hra_projects", JSON.stringify(stored));
        }
        return { success: true, project: newProj };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Creating project in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_projects") || "[]");
      const localUsers = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const creatorEmail = projectData.managerEmail?.toLowerCase().trim();
      const creator = localUsers.find(u => u.email.toLowerCase().trim() === creatorEmail);

      const newProj = {
        id: `proj-${Date.now()}`,
        _id: `proj-${Date.now()}`,
        name: projectData.name,
        description: projectData.description || "",
        assignedBy: creator ? (creator.id || creator._id) : "local-manager",
        assignedByEmail: creatorEmail,
        assignedMembers: projectData.assignedMembers || [],
        startDate: projectData.startDate ? new Date(projectData.startDate).toISOString() : null,
        dueDate: projectData.dueDate ? new Date(projectData.dueDate).toISOString() : null,
        priority: projectData.priority || "Medium",
        status: "Not Started",
        progress: 0,
        attachedFiles: projectData.attachedFiles || [],
        comments: [],
        deliverables: [],
        activityTimeline: [
          {
            text: `Project created by ${creator ? creator.name : creatorEmail}`,
            user: creatorEmail,
            createdAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      stored.unshift(newProj);
      localStorage.setItem("hra_projects", JSON.stringify(stored));
      return { success: true, project: newProj, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Update project with local storage fallback
  updateProject: async (id, projectData) => {
    try {
      const response = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...projectData })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedProj = data.project;
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_projects") || "[]");
          const idx = stored.findIndex(p => (p.id === id || p._id === id));
          if (idx !== -1) {
            stored[idx] = updatedProj;
            localStorage.setItem("hra_projects", JSON.stringify(stored));
          }
        }
        return { success: true, project: updatedProj };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating project in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_projects") || "[]");
      const idx = stored.findIndex(p => (p.id === id || p._id === id));
      if (idx !== -1) {
        const current = stored[idx];
        const userEmail = projectData.updaterEmail || "system@hraconnect.com";
        const newTimeline = [...(current.activityTimeline || [])];

        // Mirror backend PUT changes for comments, deliverables, member contributions
        if (projectData.comment) {
          if (!current.comments) current.comments = [];
          current.comments.push({
            author: projectData.comment.author || "User",
            email: projectData.comment.email || userEmail,
            text: projectData.comment.text,
            createdAt: new Date().toISOString()
          });
          newTimeline.push({
            text: `Comment added by ${projectData.comment.author || userEmail}`,
            user: userEmail,
            createdAt: new Date().toISOString()
          });
        }

        if (projectData.deliverable) {
          if (!current.deliverables) current.deliverables = [];
          current.deliverables.push({
            name: projectData.deliverable.name,
            url: projectData.deliverable.url,
            size: projectData.deliverable.size,
            submittedBy: projectData.deliverable.submittedBy || userEmail,
            submittedAt: new Date().toISOString()
          });
          newTimeline.push({
            text: `Deliverable "${projectData.deliverable.name}" uploaded by ${projectData.deliverable.submittedBy || userEmail}`,
            user: userEmail,
            createdAt: new Date().toISOString()
          });
        }

        if (projectData.memberEmail && projectData.contributionProgress !== undefined) {
          if (current.assignedMembers) {
            const member = current.assignedMembers.find(
              m => m.email.toLowerCase().trim() === projectData.memberEmail.toLowerCase().trim()
            );
            if (member) {
              const oldVal = member.contributionProgress;
              member.contributionProgress = Number(projectData.contributionProgress);
              newTimeline.push({
                text: `Contribution progress of ${member.name} updated from ${oldVal}% to ${projectData.contributionProgress}%`,
                user: userEmail,
                createdAt: new Date().toISOString()
              });
            }
          }
        }

        // Handle general fields updates
        if (projectData.name !== undefined && current.name !== projectData.name) {
          newTimeline.push({ text: `Project name updated to "${projectData.name}"`, user: userEmail, createdAt: new Date().toISOString() });
          current.name = projectData.name;
        }
        if (projectData.description !== undefined) current.description = projectData.description;
        if (projectData.startDate !== undefined) current.startDate = projectData.startDate;
        if (projectData.dueDate !== undefined) current.dueDate = projectData.dueDate;
        if (projectData.priority !== undefined && current.priority !== projectData.priority) {
          newTimeline.push({ text: `Priority changed from ${current.priority} to ${projectData.priority}`, user: userEmail, createdAt: new Date().toISOString() });
          current.priority = projectData.priority;
        }
        if (projectData.status !== undefined && current.status !== projectData.status) {
          newTimeline.push({ text: `Status updated to "${projectData.status}"`, user: userEmail, createdAt: new Date().toISOString() });
          current.status = projectData.status;
        }
        if (projectData.progress !== undefined && current.progress !== Number(projectData.progress)) {
          newTimeline.push({ text: `Progress updated from ${current.progress}% to ${projectData.progress}%`, user: userEmail, createdAt: new Date().toISOString() });
          current.progress = Number(projectData.progress);
        }
        if (projectData.assignedMembers !== undefined) {
          current.assignedMembers = projectData.assignedMembers;
          newTimeline.push({ text: `Assigned team members updated`, user: userEmail, createdAt: new Date().toISOString() });
        }
        if (projectData.attachedFiles !== undefined) {
          current.attachedFiles = projectData.attachedFiles;
          newTimeline.push({ text: `Attached files list updated`, user: userEmail, createdAt: new Date().toISOString() });
        }

        current.activityTimeline = newTimeline;
        current.updatedAt = new Date().toISOString();

        stored[idx] = current;
        localStorage.setItem("hra_projects", JSON.stringify(stored));
        return { success: true, project: current, offline: true };
      }
      return { success: false, message: "Project not found locally" };
    }
    return { success: false, message: "Window environment not available" };
  },

  // Delete project with local storage fallback
  deleteProject: async (id) => {
    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_projects") || "[]");
          const filtered = stored.filter(p => p.id !== id && p._id !== id);
          localStorage.setItem("hra_projects", JSON.stringify(filtered));
        }
        return { success: true };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting project in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_projects") || "[]");
      const filtered = stored.filter(p => p.id !== id && p._id !== id);
      localStorage.setItem("hra_projects", JSON.stringify(filtered));
      return { success: true, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  // ─── Reports ──────────────────────────────────────────────
  getReports: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/reports${queryString ? "?" + queryString : ""}`);
      if (response.ok) {
        const data = await response.json();
        return data.reports || [];
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting reports from localStorage...", err);
    }
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("hra_reports") || "[]");
    }
    return [];
  },

  submitReport: async (reportData) => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (response.ok) {
        const data = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_reports") || "[]");
          stored.unshift(data.report);
          localStorage.setItem("hra_reports", JSON.stringify(stored));
        }
        return { success: true, report: data.report };
      }
      const err = await response.json();
      return { success: false, message: err.message };
    } catch (err) {
      console.warn("MongoDB API unreachable. Saving report to localStorage...", err);
    }
    if (typeof window !== "undefined") {
      const newReport = { ...reportData, _id: `local-${Date.now()}`, id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
      const stored = JSON.parse(localStorage.getItem("hra_reports") || "[]");
      stored.unshift(newReport);
      localStorage.setItem("hra_reports", JSON.stringify(stored));
      return { success: true, report: newReport, offline: true };
    }
    return { success: false, message: "Submission failed" };
  },

  updateReport: async (reportData) => {
    try {
      const response = await fetch("/api/reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (response.ok) {
        const data = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_reports") || "[]");
          const idx = stored.findIndex(r => r._id === reportData.id || r.id === reportData.id);
          if (idx !== -1) { stored[idx] = { ...stored[idx], ...reportData }; }
          localStorage.setItem("hra_reports", JSON.stringify(stored));
        }
        return { success: true, report: data.report };
      }
      const err = await response.json();
      return { success: false, message: err.message };
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating report in localStorage...", err);
    }
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_reports") || "[]");
      const idx = stored.findIndex(r => r._id === reportData.id || r.id === reportData.id);
      if (idx !== -1) { stored[idx] = { ...stored[idx], ...reportData }; localStorage.setItem("hra_reports", JSON.stringify(stored)); }
      return { success: true, offline: true };
    }
    return { success: false, message: "Update failed" };
  },

  deleteReport: async (id) => {
    try {
      const response = await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_reports") || "[]");
          localStorage.setItem("hra_reports", JSON.stringify(stored.filter(r => r._id !== id && r.id !== id)));
        }
        return { success: true };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Deleting report from localStorage...", err);
    }
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_reports") || "[]");
      localStorage.setItem("hra_reports", JSON.stringify(stored.filter(r => r._id !== id && r.id !== id)));
      return { success: true, offline: true };
    }
    return { success: false };
  },

  getTrainings: async () => {
    try {
      const response = await fetch("/api/trainings");
      if (response.ok) {
        const list = await response.json();
        if (typeof window !== "undefined") {
          localStorage.setItem("hra_trainings", JSON.stringify(list));
        }
        return list;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting trainings from localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hra_trainings");
      if (stored) return JSON.parse(stored);
      
      const defaults = [
        { id: "t-1", _id: "t-1", name: "Company Orientation", description: "Standard welcome pack and policies handbook.", category: "Onboarding", duration: "1 hour", status: "Active", materials: [{ name: "Intern Handbook.pdf", type: "PDF", url: "#" }] },
        { id: "t-2", _id: "t-2", name: "Internship Guidelines", description: "Rules, milestones, and grading structure.", category: "Onboarding", duration: "1.5 hours", status: "Active", materials: [{ name: "Guidelines.pdf", type: "PDF", url: "#" }] },
        { id: "t-3", _id: "t-3", name: "Workplace Ethics", description: "Best practices, communication, and harassment policies.", category: "Ethics", duration: "1 hour", status: "Active", materials: [{ name: "Ethics PPT.ppt", type: "PPT", url: "#" }] },
        { id: "t-4", _id: "t-4", name: "React Basics", description: "Components, hooks, state, and props.", category: "Development", duration: "3 hours", status: "Active", materials: [{ name: "React learning links", type: "Link", url: "https://react.dev" }] },
        { id: "t-5", _id: "t-5", name: "Node.js Fundamentals", description: "Express, APIs, middleware, and mongoose.", category: "Development", duration: "4 hours", status: "Active", materials: [{ name: "Node docs", type: "Link", url: "https://nodejs.org" }] }
      ];
      localStorage.setItem("hra_trainings", JSON.stringify(defaults));
      return defaults;
    }
    return [];
  },

  createTraining: async (trainingData) => {
    try {
      const response = await fetch("/api/trainings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trainingData)
      });
      if (response.ok) {
        const newTraining = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_trainings") || "[]");
          stored.push(newTraining);
          localStorage.setItem("hra_trainings", JSON.stringify(stored));
        }
        return { success: true, training: newTraining };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Creating training module in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_trainings") || "[]");
      const mockId = `training-${Date.now()}`;
      const mockTraining = {
        id: mockId,
        _id: mockId,
        name: trainingData.name,
        description: trainingData.description || "",
        category: trainingData.category || "General",
        duration: trainingData.duration || "1 hour",
        status: trainingData.status || "Active",
        materials: trainingData.materials || []
      };
      stored.push(mockTraining);
      localStorage.setItem("hra_trainings", JSON.stringify(stored));
      return { success: true, training: mockTraining, offline: true };
    }
    return { success: false, message: "Window environment not available" };
  },

  assignTraining: async (assignmentData) => {
    try {
      const response = await fetch("/api/trainings/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData)
      });
      if (response.ok) {
        const result = await response.json();
        // Force refresh local assignments from server
        try {
          const assignmentsRes = await fetch("/api/trainings/assign");
          if (assignmentsRes.ok) {
            const list = await assignmentsRes.json();
            if (typeof window !== "undefined") {
              localStorage.setItem("hra_training_assignments", JSON.stringify(list));
            }
          }
        } catch (e) {
          console.warn("Failed to fetch fresh assignments list", e);
        }
        return { success: true, message: result.message };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Simulating training assignment in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const trainings = JSON.parse(localStorage.getItem("hra_trainings") || "[]");
      const users = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const teams = JSON.parse(localStorage.getItem("hra_teams") || "[]");
      const assignments = JSON.parse(localStorage.getItem("hra_training_assignments") || "[]");

      const training = trainings.find(t => t._id === assignmentData.trainingId || t.id === assignmentData.trainingId);
      if (!training) {
        return { success: false, message: "Training module not found" };
      }

      let targets = [];
      if (assignmentData.assignedToType === "all") {
        targets = users.filter(u => u.role === "Intern");
      } else if (assignmentData.assignedToType === "team") {
        const team = teams.find(t => t._id === assignmentData.assignedToValue || t.id === assignmentData.assignedToValue);
        if (team && Array.isArray(team.members)) {
          // members in offline mode can be objects or string IDs
          const memberEmailsOrIds = team.members.map(m => typeof m === "object" ? m.email : m);
          targets = users.filter(u => u.role === "Intern" && (memberEmailsOrIds.includes(u.email) || memberEmailsOrIds.includes(u.id) || memberEmailsOrIds.includes(u._id)));
        }
      } else if (assignmentData.assignedToType === "department") {
        targets = users.filter(u => u.role === "Intern" && u.department === assignmentData.assignedToValue);
      } else if (assignmentData.assignedToType === "individual") {
        const targetUser = users.find(u => u.email === assignmentData.assignedToValue || u.id === assignmentData.assignedToValue || u._id === assignmentData.assignedToValue);
        if (targetUser && targetUser.role === "Intern") {
          targets = [targetUser];
        }
      }

      if (targets.length === 0) {
        return { success: false, message: "No interns found matching target criteria" };
      }

      let count = 0;
      targets.forEach(intern => {
        const exists = assignments.some(a => (a.trainingId === training._id || a.trainingId === training.id) && a.internEmail === intern.email);
        if (!exists) {
          const assignId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          assignments.push({
            id: assignId,
            _id: assignId,
            trainingId: training._id || training.id,
            trainingName: training.name,
            internId: intern.id || intern._id,
            internName: intern.name,
            internEmail: intern.email,
            dueDate: assignmentData.dueDate,
            status: "Not Started",
            completionPercentage: 0,
            createdAt: new Date().toISOString()
          });
          count++;
        }
      });

      localStorage.setItem("hra_training_assignments", JSON.stringify(assignments));
      return { success: true, message: `Assigned training successfully to ${count} intern(s) (Offline mode)` };
    }
    return { success: false, message: "Window environment not available" };
  },

  getTrainingAssignments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`/api/trainings/assign${queryString ? "?" + queryString : ""}`);
      if (response.ok) {
        const list = await response.json();
        // Only update local storage for all assignments if it was not filtered by internEmail specifically
        if (typeof window !== "undefined" && !params.internEmail) {
          localStorage.setItem("hra_training_assignments", JSON.stringify(list));
        }
        return list;
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Getting training assignments from localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_training_assignments") || "[]");
      if (params.internEmail) {
        const emailLower = params.internEmail.toLowerCase().trim();
        return stored.filter(a => a.internEmail.toLowerCase().trim() === emailLower);
      }
      return stored;
    }
    return [];
  },

  updateTrainingProgress: async (assignmentId, progressData) => {
    try {
      const response = await fetch("/api/trainings/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, ...progressData })
      });
      if (response.ok) {
        const updated = await response.json();
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_training_assignments") || "[]");
          const idx = stored.findIndex(a => a._id === assignmentId || a.id === assignmentId);
          if (idx !== -1) {
            stored[idx] = updated;
          } else {
            stored.push(updated);
          }
          localStorage.setItem("hra_training_assignments", JSON.stringify(stored));
        }
        return { success: true, assignment: updated };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating training progress in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_training_assignments") || "[]");
      const idx = stored.findIndex(a => a._id === assignmentId || a.id === assignmentId);
      if (idx !== -1) {
        const oldVal = stored[idx];
        const completionPercentage = progressData.completionPercentage !== undefined ? Number(progressData.completionPercentage) : oldVal.completionPercentage;
        const status = progressData.status !== undefined ? progressData.status : (completionPercentage === 100 ? "Completed" : oldVal.status);
        const updated = {
          ...oldVal,
          status,
          completionPercentage,
          completedAt: status === "Completed" ? new Date().toISOString() : oldVal.completedAt,
          certificateUrl: status === "Completed" ? `/certificates/cert-${assignmentId}.pdf` : oldVal.certificateUrl
        };
        stored[idx] = updated;
        localStorage.setItem("hra_training_assignments", JSON.stringify(stored));
        return { success: true, assignment: updated, offline: true };
      }
      return { success: false, message: "Assignment not found in localStorage" };
    }
    return { success: false, message: "Window environment not available" };
  },

  updateUserInternInfo: async (userId, internData) => {
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, ...internData })
      });
      if (response.ok) {
        const resData = await response.json();
        // Sync updated user back to localStorage users array
        if (typeof window !== "undefined") {
          const stored = JSON.parse(localStorage.getItem("hra_users") || "[]");
          const idx = stored.findIndex(u => u._id === userId || u.id === userId);
          if (idx !== -1) {
            stored[idx] = { ...stored[idx], ...resData.user };
            localStorage.setItem("hra_users", JSON.stringify(stored));
          }
        }
        return { success: true, user: resData.user };
      }
    } catch (err) {
      console.warn("MongoDB API unreachable. Updating user info in localStorage...", err);
    }

    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("hra_users") || "[]");
      const idx = stored.findIndex(u => u._id === userId || u.id === userId);
      if (idx !== -1) {
        const updatedUser = {
          ...stored[idx],
          ...internData,
          verificationStatus: internData.verificationStatus || stored[idx].verificationStatus || "Approved"
        };
        stored[idx] = updatedUser;
        localStorage.setItem("hra_users", JSON.stringify(stored));
        return { success: true, user: updatedUser, offline: true };
      }
      return { success: false, message: "User not found in localStorage" };
    }
    return { success: false, message: "Window environment not available" };
  }
};


