let selectedSection = '';
let chartInstance = null;

function selectSection(section) {
  selectedSection = section;
  document.getElementById('selectedSection').textContent = section;
  document.getElementById('studentInputSection').style.display = 'block';
  document.getElementById('attendanceChart').style.display = 'none';
}

function fetchAttendance() {
  const studentId = document.getElementById('studentId').value.trim();

  // Dummy student data
  const dummyData = {
    "123": { present: 20, absent: 4, medical: 3, away: 1 },
    "456": { present: 18, absent: 6, medical: 2, away: 2 },
    "789": { present: 22, absent: 1, medical: 1, away: 2 }
  };

  const attendance = dummyData[studentId];

  if (!attendance) {
    alert("❌ Student ID not found! Please try 123, 456, or 789.");
    document.getElementById('attendanceChart').style.display = 'none';
    return;
  }

  const ctx = document.getElementById('attendanceChart');
  ctx.style.display = 'block';

  const data = {
    labels: ['Present', 'Absent', 'Medical Leave', 'Away from Location'],
    datasets: [{
      label: `Attendance for Student ${studentId} (Sec ${selectedSection})`,
      data: [attendance.present, attendance.absent, attendance.medical, attendance.away],
      backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'],
      borderRadius: 10,
      barThickness: 50
    }]
  };

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          precision: 0,
          grid: {
            color: 'rgba(0,0,0,0.05)'
          },
          ticks: {
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            color: '#333'
          }
        },
        tooltip: {
          backgroundColor: '#333',
          titleColor: '#fff',
          bodyColor: '#fff',
          titleFont: { weight: 'bold' },
          padding: 10,
          cornerRadius: 6
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}
