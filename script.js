/**
 * Exam Countdown — Main Application Script
 * Handles countdown logic, validation, localStorage persistence,
 * and UI interactions.
 */

/* ============================================
   DOM References
   ============================================ */

const examForm = document.getElementById('exam-form');
const examNameInput = document.getElementById('exam-name');
const examDateInput = document.getElementById('exam-date');
const examTimeInput = document.getElementById('exam-time');
const validationMessage = document.getElementById('validation-message');
const resetBtn = document.getElementById('reset-btn');

const examDisplayName = document.getElementById('exam-display-name');
const examDisplayDate = document.getElementById('exam-display-date');
const examDisplayTime = document.getElementById('exam-display-time');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const statusCard = document.getElementById('status-card');
const statusText = document.getElementById('status-text');

const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

/* ============================================
   Constants & State
   ============================================ */

const STORAGE_KEY = 'examCountdownData';
let countdownInterval = null;
let targetDate = null;

/* ============================================
   Utility Functions
   ============================================ */

/**
 * Pad a number to two digits for display.
 */
function pad(num) {
  return String(num).padStart(2, '0');
}

/**
 * Get today's date at midnight (local time) for comparison.
 */
function getTodayMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Parse exam date (YYYY-MM-DD) and time (HH:MM) into a precise Date.
 */
function parseExamDateTime(dateString, timeString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Format stored date/time for the countdown display.
 */
function formatDisplayDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDisplayTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Save exam data to localStorage.
 */
function saveToStorage(name, dateString, timeString) {
  const data = { examName: name, examDate: dateString, examTime: timeString };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load exam data from localStorage.
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clear saved data from localStorage.
 */
function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Show a validation message to the user.
 */
function showValidation(message) {
  validationMessage.textContent = message;
}

/**
 * Clear validation message and error styling.
 */
function clearValidation() {
  validationMessage.textContent = '';
  examNameInput.classList.remove('input-error');
  examDateInput.classList.remove('input-error');
  examTimeInput.classList.remove('input-error');
}

/**
 * Set minimum date on the date input to today (prevents past dates in picker).
 */
function setMinDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = pad(today.getMonth() + 1);
  const dd = pad(today.getDate());
  examDateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);
}

/* ============================================
   Validation
   ============================================ */

/**
 * Validate form inputs. Returns true if valid.
 */
function validateInputs() {
  clearValidation();

  const name = examNameInput.value.trim();
  const dateStr = examDateInput.value;
  const timeStr = examTimeInput.value;

  if (!name) {
    examNameInput.classList.add('input-error');
    showValidation('Please enter an exam name.');
    examNameInput.focus();
    return false;
  }

  if (!dateStr) {
    examDateInput.classList.add('input-error');
    showValidation('Please select an exam date.');
    examDateInput.focus();
    return false;
  }

  if (!timeStr) {
    examTimeInput.classList.add('input-error');
    showValidation('Please select an exam time.');
    examTimeInput.focus();
    return false;
  }

  const selectedDate = new Date(dateStr);
  selectedDate.setHours(0, 0, 0, 0);
  const today = getTodayMidnight();

  if (selectedDate < today) {
    examDateInput.classList.add('input-error');
    showValidation('Please select today or a future date. Past dates are not allowed.');
    examDateInput.focus();
    return false;
  }

  const examDateTime = parseExamDateTime(dateStr, timeStr);
  const now = new Date();

  if (examDateTime <= now) {
    examDateInput.classList.add('input-error');
    examTimeInput.classList.add('input-error');
    showValidation('Please select a future date and time. The exam cannot be in the past.');
    examTimeInput.focus();
    return false;
  }

  return true;
}

/* ============================================
   Countdown Logic
   ============================================ */

/**
 * Calculate time remaining until target date/time.
 */
function getTimeRemaining() {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { total: diff, days, hours, minutes, seconds, passed: false };
}

/**
 * Update the countdown display elements.
 */
function updateCountdownDisplay() {
  const remaining = getTimeRemaining();

  daysEl.textContent = pad(remaining.days);
  hoursEl.textContent = pad(remaining.hours);
  minutesEl.textContent = pad(remaining.minutes);
  secondsEl.textContent = pad(remaining.seconds);

  updateStatus(remaining);
}

/**
 * Apply status styling based on days remaining.
 */
function updateStatus(remaining) {
  statusCard.className = 'status-card';

  if (remaining.passed) {
    statusCard.classList.add('status-grey');
    statusText.textContent = 'Exam Date Passed';
    return;
  }

  const days = remaining.days;

  if (days > 30) {
    statusCard.classList.add('status-green');
    statusText.textContent = `${days} days to go`;
  } else if (days >= 8) {
    statusCard.classList.add('status-yellow');
    statusText.textContent = `${days} days to go`;
  } else if (days >= 1) {
    statusCard.classList.add('status-red');
    statusText.textContent = `${days} days to go`;
  } else {
    statusCard.classList.add('status-red');
    statusText.textContent = '0 days to go';
  }
}

/**
 * Start the countdown interval (updates every second).
 */
function startCountdown(name, dateString, timeString) {
  targetDate = parseExamDateTime(dateString, timeString);
  examDisplayName.textContent = name;
  examDisplayDate.textContent = formatDisplayDate(dateString);
  examDisplayTime.textContent = formatDisplayTime(timeString);

  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  updateCountdownDisplay();
  countdownInterval = setInterval(updateCountdownDisplay, 1000);
}

/**
 * Stop the countdown and reset the UI.
 */
function resetCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  targetDate = null;

  examNameInput.value = '';
  examDateInput.value = '';
  examTimeInput.value = '';
  examDisplayName.textContent = '—';
  examDisplayDate.textContent = '—';
  examDisplayTime.textContent = '—';

  daysEl.textContent = '00';
  hoursEl.textContent = '00';
  minutesEl.textContent = '00';
  secondsEl.textContent = '00';

  statusCard.className = 'status-card status-default';
  statusText.textContent = 'Set an exam to begin';

  clearValidation();
  clearStorage();
}

/* ============================================
   Event Handlers
   ============================================ */

examForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!validateInputs()) return;

  const name = examNameInput.value.trim();
  const dateStr = examDateInput.value;
  const timeStr = examTimeInput.value;

  saveToStorage(name, dateStr, timeStr);
  startCountdown(name, dateStr, timeStr);
  clearValidation();
});

resetBtn.addEventListener('click', () => {
  resetCountdown();
});

examNameInput.addEventListener('input', () => {
  examNameInput.classList.remove('input-error');
  if (examNameInput.value.trim()) validationMessage.textContent = '';
});

examDateInput.addEventListener('input', () => {
  examDateInput.classList.remove('input-error');
  if (examDateInput.value && examTimeInput.value) validationMessage.textContent = '';
});

examTimeInput.addEventListener('input', () => {
  examTimeInput.classList.remove('input-error');
  if (examTimeInput.value) validationMessage.textContent = '';
});

/* ============================================
   Navigation — Mobile Menu
   ============================================ */

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('active');
  navToggle.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.nav-link, .hero-btn').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ============================================
   Restore Saved Data on Page Load
   ============================================ */

function init() {
  setMinDate();

  const saved = loadFromStorage();

  if (saved && saved.examName && saved.examDate) {
    examNameInput.value = saved.examName;
    examDateInput.value = saved.examDate;
    // Support older saves without a time field
    examTimeInput.value = saved.examTime || '23:59';

    startCountdown(saved.examName, saved.examDate, examTimeInput.value);
  }
}

document.addEventListener('DOMContentLoaded', init);
