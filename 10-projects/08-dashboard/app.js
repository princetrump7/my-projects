function generateMockData() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    revenue: {
      labels: months,
      data: months.map(() => Math.floor(Math.random() * 50000) + 10000),
    },
    users: {
      labels: months,
      data: months.map(() => Math.floor(Math.random() * 5000) + 1000),
    },
    traffic: {
      labels: ['Direct', 'Organic', 'Referral', 'Social', 'Email'],
      data: [30, 25, 20, 15, 10],
    },
    sales: {
      labels: months,
      data: months.map(() => Math.floor(Math.random() * 1000) + 200),
    },
  };
}

function createRevenueChart(data) {
  const ctx = document.getElementById('revenue-chart').getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.revenue.labels,
      datasets: [{
        label: 'Revenue ($)',
        data: data.revenue.data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function createUsersChart(data) {
  const ctx = document.getElementById('users-chart').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.users.labels,
      datasets: [{
        label: 'Active Users',
        data: data.users.data,
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function createTrafficChart(data) {
  const ctx = document.getElementById('traffic-chart').getContext('2d');
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: data.traffic.labels,
      datasets: [{
        data: data.traffic.data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(139, 92, 246, 0.7)',
        ],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function createSalesChart(data) {
  const ctx = document.getElementById('sales-chart').getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.sales.labels,
      datasets: [{
        label: 'Units Sold',
        data: data.sales.data,
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function initDashboard() {
  const mockData = generateMockData();
  createRevenueChart(mockData);
  createUsersChart(mockData);
  createTrafficChart(mockData);
  createSalesChart(mockData);
}

function setupDarkMode() {
  const toggle = document.getElementById('dark-mode-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  setupDarkMode();
});
