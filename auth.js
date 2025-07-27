// Authentication System
class AuthSystem {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.init();
  }

  init() {
    this.checkAuthStatus();
    this.setupEventListeners();
  }

  // Check if user is already authenticated
  checkAuthStatus() {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("currentUser");

    if (token && user) {
      try {
        this.currentUser = JSON.parse(user);
        this.isAuthenticated = true;
        this.redirectToApp();
      } catch (error) {
        this.logout();
      }
    }
  }

  // Setup event listeners
  setupEventListeners() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Demo users for testing
    this.demoUsers = [
      {
        email: "admin@exportdoc.com",
        password: "admin123",
        name: "Admin User",
        role: "admin",
      },
      {
        email: "user@exportdoc.com",
        password: "user123",
        name: "Regular User",
        role: "user",
      },
    ];
  }

  // Handle login form submission
  async handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    const button = event.target.querySelector('button[type="submit"]');
    const originalText = button.textContent;

    // Show loading state
    button.classList.add("loading");
    button.textContent = "Signing in...";

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = this.authenticateUser(email, password);

      if (user) {
        this.login(user, remember);
        this.showSuccess("Login successful! Redirecting...");
        setTimeout(() => this.redirectToApp(), 1000);
      } else {
        this.showError("Invalid email or password");
      }
    } catch (error) {
      this.showError("Login failed. Please try again.");
    } finally {
      button.classList.remove("loading");
      button.textContent = originalText;
    }
  }

  // Authenticate user (demo implementation)
  authenticateUser(email, password) {
    return this.demoUsers.find(
      (user) => user.email === email && user.password === password
    );
  }

  // Login user
  login(user, remember = false) {
    this.currentUser = user;
    this.isAuthenticated = true;

    // Generate a simple token (in production, this would be from your backend)
    const token = btoa(
      JSON.stringify({
        email: user.email,
        role: user.role,
        timestamp: Date.now(),
      })
    );

    localStorage.setItem("authToken", token);
    localStorage.setItem("currentUser", JSON.stringify(user));

    if (remember) {
      localStorage.setItem("rememberMe", "true");
    }
  }

  // Logout user
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberMe");

    // Redirect to login
    if (window.location.pathname !== "/login.html") {
      window.location.href = "/login.html";
    }
  }

  // Redirect to main app
  redirectToApp() {
    if (window.location.pathname === "/login.html") {
      window.location.href = "/index.html";
    }
  }

  // Show error message
  showError(message) {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";

      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 5000);
    }
  }

  // Show success message
  showSuccess(message) {
    const errorDiv = document.getElementById("errorMessage");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";
      errorDiv.style.background = "#d4edda";
      errorDiv.style.color = "#155724";
      errorDiv.style.border = "1px solid #c3e6cb";

      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 3000);
    }
  }

  // Check if user has permission
  hasPermission(permission) {
    if (!this.isAuthenticated || !this.currentUser) {
      return false;
    }

    // Simple permission system
    const permissions = {
      admin: ["read", "write", "delete", "manage_users"],
      user: ["read", "write"],
    };

    return permissions[this.currentUser.role]?.includes(permission) || false;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

// Initialize auth system
const auth = new AuthSystem();

// Export for use in other files
window.auth = auth;
