// convert.js
const xlsx = require("xlsx");
const fs = require("fs");

const workbook = xlsx.readFile("cs data set.xlsx");
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

console.log("Sample row:", data[0]);

const students = data.map((row, index) => {
  const adminNo = row["Admin Number"] || row["Admin No"] || row["adminNo"] || row["admin no"];
  const rollNo = row["Roll Number"] || row["Roll No"] || row["rollNo"] || row["roll no"];
  const name = row["Name"] || row["name"];
  const id = index + 1;
  const section = id <= 100 ? "X" : "Y";

  return { id, adminNo, rollNo, name, section };
}).filter(s => s.adminNo && s.rollNo && s.name);

fs.writeFileSync("students.json", JSON.stringify(students, null, 2));
console.log(`✅ students.json generated with ${students.length} records`);
