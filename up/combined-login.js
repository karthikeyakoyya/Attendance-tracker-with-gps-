// combined-login.js
// This script handles the login functionality for both students and admins.

/**
 * Displays a custom modal message instead of using alert().
 * @param {string} message The message to display.
 * @param {string} type The type of message (e.g., 'success', 'error', 'warning').
 */
function showMessageModal(message, type = 'info') {
  const modalElement = document.getElementById('messageModal');
  const modalBody = document.getElementById('messageModalBody');
  const modalTitle = document.getElementById('messageModalLabel');

  if (!modalElement || !modalBody || !modalTitle) {
    console.error("Message modal elements not found.");
    // Fallback to alert if modal elements are missing
    alert(message);
    return;
  }

  modalBody.textContent = message;
  let titleText = 'Information';
  let titleClass = 'text-primary'; // Default info color

  switch (type) {
    case 'success':
      titleText = 'Success!';
      titleClass = 'text-success';
      break;
    case 'error':
      titleText = 'Error!';
      titleClass = 'text-danger';
      break;
    case 'warning':
      titleText = 'Warning!';
      titleClass = 'text-warning';
      break;
  }

  modalTitle.textContent = titleText;
  modalTitle.className = `modal-title ${titleClass}`; // Apply color class to title

  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}


/**
 * Handles the login attempt when the form is submitted.
 * It sends the user ID, password, and selected role to the server.
 */
async function handleLogin() {
  const role = document.getElementById("role")?.value;
  const userId = document.getElementById("userid")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!role || (role !== "student" && role !== "admin")) {
    return showMessageModal("⚠️ Please select a valid role (Admin or Student).", 'warning');
  }

  if (!userId || !password) {
    return showMessageModal("⚠️ Please enter both User ID and Password.", 'warning');
  }

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminNo: userId, // adminNo is now the userId (student ID or "admin")
        rollNo: password, // rollNo is now the password (student roll no or "adminpass")
        role: role // Pass the selected role to the server
      })
    });

    if (!response.ok) {
      // Handle HTTP errors (e.g., 401 Unauthorized, 500 Internal Server Error)
      const errorData = await response.json();
      throw new Error(errorData.message || `Server returned ${response.status}`);
    }

    const data = await response.json();
    
    
    if (data.success && data.user) {
      // Store user data in localStorage for later use on dashboard pages
      localStorage.setItem("adminNo", data.user.adminNo);
      localStorage.setItem("name", data.user.name);
      localStorage.setItem("role", data.user.role); // Store the role

      // Only store section if it exists (for students)
      if (data.user.section) {
        localStorage.setItem("section", data.user.section);
      }

      // Redirect based on role
      
      if (role === "admin") {
        window.location.href = "admin.html";
      } else { // Student role
        window.location.href = "index.html";
      }
    } else {
      showMessageModal("❌ Invalid credentials. Please try again.", 'error');
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessageModal(`An error occurred during login: ${error.message}`, 'error');
  }
}

// Attach the handleLogin function to the login button click event
document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("loginButton");
  if (loginButton) {
    loginButton.addEventListener("click", handleLogin);
  }

  // Allow pressing Enter key to submit login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent default form submission
        handleLogin();
      }
    });
  }
});
// In up/combined-login.js

async function handleLogin() {
  const role = document.getElementById('role').value;
  const userId = document.getElementById('userid').value;
  const password = document.getElementById('password').value;

  if (!role || !userId || !password) {
    alert('Please fill in all fields.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: role,
        adminNo: userId, // 'adminNo' is used for the user ID field
        rollNo: password   // 'rollNo' is used for the password field
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // --- NEW: SAVE USER DATA AND REDIRECT ---
      // The server sends back the user object on successful login
      sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));

      // Redirect to the correct dashboard based on role
      if (data.user.role === 'admin') {
        // Assuming you have an admin dashboard, e.g., 'admin.html'
        // window.location.href = 'admin.html';
        alert('Admin login successful!');
        window.location.href = 'C:\\Users\\karthik\\OneDrive\\Desktop\\New folder\\admin -panel\\admin.html'
         // Placeholder for admin redirect
      } else {
        window.location.href = 'index.html'; // Redirect to the student page
      }
      // ------------------------------------------

    } else {
      alert(`Login Failed: ${data.message}`);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login. Please try again.');
  }
}