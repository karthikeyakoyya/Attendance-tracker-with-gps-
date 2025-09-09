// index.js (Corrected with modern 'import' syntax)

import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';

// --- Boilerplate to get __dirname in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ---------------------------------------------------

const app = express();
const PORT = 3000; // Define the port

app.use(cors());
app.use(bodyParser.json());
// --- EDIT: Serve static files from the 'UP' directory, which is one level above the current directory ---
app.use(express.static(path.join(__dirname, '..', 'UP')));

let students = [];
let attendance = [];

// Load students data
try {
  // Use path.join to create a robust file path
  students = JSON.parse(fs.readFileSync(path.join(__dirname, "students.json"), "utf-8"));
  console.log(`Loaded ${students.length} student records.`);
} catch (error) {
  console.error("Error loading students.json:", error.message);
  console.log("Please run the data conversion script to generate students.json.");
}

// Load attendance data (or initialize if not found)
try {
  attendance = JSON.parse(fs.readFileSync(path.join(__dirname, "attendance.json"), "utf-8"));
  console.log(`Loaded ${attendance.length} attendance records.`);
} catch (error) {
  console.warn("attendance.json not found, initializing with empty array.");
  attendance = [];
}

/**
 * Helper function to save attendance data to file.
 */
function saveAttendance() {
  fs.writeFileSync(path.join(__dirname, "attendance.json"), JSON.stringify(attendance, null, 2));
}

// --- EDIT: Serve login.html from the 'UP' directory when the root URL is accessed ---
app.get("/", (req, res) => {
  res.sendFile(path.join("C:\\Users\\karthik\\OneDrive\\Desktop\\New folder\\up", 'login.html'));
});

/**
 * Login endpoint for both students and admins.
 * Admin credentials: adminNo: "admin", rollNo: "adminpass"
 * Student credentials from students.json
 */
app.post("/login", (req, res) => {
    const { adminNo, rollNo, role } = req.body;

    if (!adminNo || !rollNo || !role) {
        return res.status(400).json({ success: false, message: "Admin number, roll number, and role are required." });
    }

    // Admin login
    if (role === "admin") {
        if (adminNo === "admin" && rollNo === "adminpass") {
            return res.json({ success: true, user: { adminNo: "admin", name: "Administrator", role: "admin" } });
        }
    }
    if (role === "admin" && adminNo == "sujoy" && password =="saha123") {
        window.location.href = "C:\\Users\\karthik\\OneDrive\\Desktop\\New folder\\admin -panel\\admin.html";
    }
    // Student login
    if (role === "student") {
        // Find the student, ignoring case for adminNo and using correct keys
        const user = students.find(s =>
            s['admin no'].toLowerCase() === adminNo.toLowerCase() && String(s['roll no']) === String(rollNo)
        );
        if (user) {
            // Return a user object with a consistent structure
            const studentUser = {
                adminNo: user['admin no'],
                rollNo: user['roll no'],
                name: user.name,
                role: "student"
            };
            return res.json({ success: true, user: studentUser });
        }
    }

    res.status(401).json({ success: false, message: "Invalid credentials or role." });
});


/**
 * Endpoint to get students by section (for admin).
 */
app.get("/students/section/:section", (req, res) => {
  const section = req.params.section.toUpperCase();
  const list = students.filter(s => s.section === section);
  res.json(list);
});

/**
 * Endpoint to record attendance.
 * Expects: { adminNo, date, status, latitude, longitude }
 */
app.post("/attendance", (req, res) => {
  const record = req.body;

  if (!record.adminNo || !record.date || !record.status) {
    return res.status(400).json({ success: false, message: "Missing required attendance fields." });
  }

  // Geolocation check
  const validLatitude = 23.5492;  // NIT Durgapur Latitude
  const validLongitude = 87.2912; // NIT Durgapur Longitude
  const maxDistanceKm = 0.5; // 500 meters radius

  if (record.latitude && record.longitude) {
    const distance = calculateDistance(validLatitude, validLongitude, record.latitude, record.longitude);
    if (distance > maxDistanceKm) {
      record.status = "absent";
      record.reason = `Out of campus range (${distance.toFixed(2)} km away)`;
      console.log(`Student ${record.adminNo} marked absent due to distance.`);
    }
  }

  // Avoid duplicate entries for the same student on the same date
  const existingRecordIndex = attendance.findIndex(a => a.adminNo === record.adminNo && a.date === record.date);
  if (existingRecordIndex !== -1) {
      attendance[existingRecordIndex] = record; // Update existing record
  } else {
      attendance.push(record); // Add new record
  }

  saveAttendance();
  res.json({ success: true, message: "Attendance recorded successfully!" });
});

/**
 * Endpoint to get attendance history for a specific student (for admin).
 */
app.get("/attendance/:adminNo", (req, res) => {
  const adminNo = req.params.adminNo.toLowerCase();
  const studentAttendance = attendance.filter(r => r.adminNo.toLowerCase() === adminNo);
  res.json(studentAttendance);
});

/**
 * Endpoint to get attendance history for the logged-in student.
 */
app.get("/student-attendance/:adminNo", (req, res) => {
  const adminNo = req.params.adminNo.toLowerCase();
  const studentRecords = attendance.filter(r => r.adminNo.toLowerCase() === adminNo);
  res.json(studentRecords);
});

/**
 * Dummy Time Table Data
 */
const timeTableData = {
  "X": [
    { day: "Monday", time: "09:00 - 10:00", subject: "Operating Systems", faculty: "Dr. A. Sharma", room: "LH1" },
    { day: "Monday", time: "10:00 - 11:00", subject: "Database Management", faculty: "Prof. S. Roy", room: "LH2" },
    { day: "Tuesday", time: "11:00 - 12:00", subject: "Computer Networks", faculty: "Dr. B. Sen", room: "LH3" },
  ],
  "Y": [
    { day: "Monday", time: "09:00 - 10:00", subject: "Data Structures", faculty: "Dr. P. Choudhury", room: "LH4" },
    { day: "Monday", time: "10:00 - 11:00", subject: "Algorithms", faculty: "Prof. D. Mitra", room: "LH5" },
    { day: "Tuesday", time: "11:00 - 12:00", subject: "Software Engineering", faculty: "Dr. S. Bhattacharjee", room: "LH6" },
  ]
};

/**
 * Endpoint to get time table by section.
 */
app.get("/timetable/:section", (req, res) => {
  const section = req.params.section.toUpperCase();
  if (timeTableData[section]) {
    res.json(timeTableData[section]);
  } else {
    res.status(404).json({ message: "Time table not found for this section." });
  }
});


/**
 * Haversine formula to calculate distance between two lat/lon points.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});