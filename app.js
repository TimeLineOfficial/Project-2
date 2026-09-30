/**
 * Independent Bookstore Events Portal
 * Vanilla JavaScript Implementation (NFR & Telemetry Compliant)
 */

(function () {
  'use strict';

  // --- Initial Bookstore Events Data ---
  const INITIAL_EVENTS = [
    {
      id: 'EVT-101',
      title: 'An Evening with Colson Whitehead: The Harlem Shuffle',
      category: 'Author Reading',
      author: 'Colson Whitehead',
      date: 'Thursday, Oct 15, 2026',
      time: '7:00 PM - 8:30 PM',
      location: 'Main Hallway & Reading Nook',
      availableSeats: 45,
      price: 'Free Admission',
      description: 'Two-time Pulitzer Prize winner Colson Whitehead discusses his bestselling crime novel and answers audience questions followed by a book signing session.'
    },
    {
      id: 'EVT-102',
      title: 'Sci-Fi & Speculative Fiction Monthly Discussion',
      category: 'Book Club',
      author: 'Hosted by Bookshop Staff',
      date: 'Saturday, Oct 17, 2026',
      time: '5:00 PM - 6:30 PM',
      location: 'Mezzanine Coffee Lounge',
      availableSeats: 18,
      price: 'Free Admission',
      description: 'This month we delve into Klara and the Sun by Kazuo Ishiguro. Coffee and artisanal pastries provided for all registered attendees.'
    },
    {
      id: 'EVT-103',
      title: 'Memoir & Creative Nonfiction Masterclass',
      category: 'Writing Workshop',
      author: 'Led by Prof. Elena Rostova',
      date: 'Sunday, Oct 18, 2026',
      time: '11:00 AM - 1:30 PM',
      location: 'Workshop Studio B',
      availableSeats: 12,
      price: '$15 Supply Fee',
      description: 'Learn structure, voice, and personal narration techniques in an intensive 2.5 hour hands-on writing workshop with personal feedback.'
    },
    {
      id: 'EVT-104',
      title: 'Weekend Children’s Picture Book Storytime & Craft',
      category: 'Children Storytime',
      author: 'Storyteller Barnaby',
      date: 'Saturday, Oct 24, 2026',
      time: '10:30 AM - 11:30 AM',
      location: 'Children’s Corner',
      availableSeats: 25,
      price: 'Free Admission',
      description: 'Interactive reading of classic picture books followed by a themed bookmark crafting session for kids aged 3-8.'
    },
    {
      id: 'EVT-105',
      title: 'Open Mic Poetry & Spoken Word Showcase',
      category: 'Poetry Open Mic',
      author: 'Local Poets Collective',
      date: 'Friday, Oct 30, 2026',
      time: '8:00 PM - 10:00 PM',
      location: 'Main Stage',
      availableSeats: 30,
      price: 'Free Admission',
      description: 'Local poets and writers share original works. Sign-up sheet opens at 7:30 PM at the front desk.'
    },
    {
      id: 'EVT-106',
      title: 'Translating Japanese Literature: Panel & Q&A',
      category: 'Author Reading',
      author: 'Translator Panel',
      date: 'Wednesday, Nov 4, 2026',
      time: '6:30 PM - 8:00 PM',
      location: 'Main Hallway',
      availableSeats: 20,
      price: 'Free Admission',
      description: 'Renowned literary translators explore the nuances of bringing contemporary Japanese fiction to English-speaking readers.'
    }
  ];

  // --- State Management ---
  let eventsState = [...INITIAL_EVENTS];
  let activeCategory = 'ALL';
  let searchQuery = '';
  let selectedEventForRSVP = null;

  // --- DOM Element References ---
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  const pillBtns = document.querySelectorAll('.pill-btn');
  const eventsGrid = document.getElementById('events-grid');
  const emptyState = document.getElementById('empty-state');
  const loadingSpinner = document.getElementById('loading-spinner');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const simSlowBtn = document.getElementById('sim-slow-btn');
  const eventCountBadge = document.getElementById('event-count-badge');

  // Custom Select References
  const customSelectContainer = document.getElementById('custom-category-select');
  const categorySelectTrigger = document.getElementById('category-select-trigger');
  const categoryDropdownList = document.getElementById('category-dropdown-list');
  const selectedCategoryText = document.getElementById('selected-category-text');
  const customOptions = document.querySelectorAll('.custom-option');

  // Modal References
  const rsvpModal = document.getElementById('rsvp-modal');
  const rsvpForm = document.getElementById('rsvp-form');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const eventSummaryBox = document.getElementById('event-summary-box');
  const formErrorAlert = document.getElementById('form-error-alert');
  const toastContainer = document.getElementById('toast-container');

  // Form Field References
  const attendeeNameInput = document.getElementById('attendee-name');
  const attendeeEmailInput = document.getElementById('attendee-email');
  const attendeesCountInput = document.getElementById('attendees-count');
  const attendeeNotesInput = document.getElementById('attendee-notes');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const countError = document.getElementById('count-error');

  // --- Telemetry Simulation Logger ---
  function logTelemetry(actionName, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[Analytics] User interacted with Independent Bookstore Events Page | Action: ${actionName} | Timestamp: ${timestamp}`, details);
  }

  // --- XSS Security Sanitizer ---
  function sanitizeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Toast Notification ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span aria-hidden="true">✅</span> <span>${sanitizeHTML(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // --- Filter & Render Logic ---
  function getFilteredEvents() {
    return eventsState.filter(evt => {
      const matchesCategory = activeCategory === 'ALL' || evt.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        evt.title.toLowerCase().includes(q) || 
        evt.author.toLowerCase().includes(q) || 
        evt.description.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q);
      
      return matchesCategory && matchesSearch;
    });
  }

  function renderEvents() {
    const filtered = getFilteredEvents();
    eventCountBadge.textContent = filtered.length;

    // Unhappy Path: Handle Empty States
    if (filtered.length === 0) {
      eventsGrid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    eventsGrid.innerHTML = filtered.map(evt => `
      <article class="event-card" id="card-${evt.id}">
        <div>
          <div class="event-badge-row">
            <span class="event-category-badge">${sanitizeHTML(evt.category)}</span>
            <span class="event-date-tag">${sanitizeHTML(evt.date)}</span>
          </div>
          <h4 class="event-title" style="margin-top: 10px;">${sanitizeHTML(evt.title)}</h4>
          <p class="event-author">${sanitizeHTML(evt.author)}</p>
          <p class="event-desc" style="margin-top: 8px;">${sanitizeHTML(evt.description)}</p>
        </div>

        <div>
          <div class="event-meta-list">
            <div class="meta-item">
              <span>🕒</span> <span>${sanitizeHTML(evt.time)}</span>
            </div>
            <div class="meta-item">
              <span>📍</span> <span>${sanitizeHTML(evt.location)}</span>
            </div>
            <div class="meta-item">
              <span>🎟️</span> <span>${evt.availableSeats} Seats Available • ${sanitizeHTML(evt.price)}</span>
            </div>
          </div>

          <button 
            type="button" 
            class="btn btn-primary rsvp-btn" 
            style="width: 100%; margin-top: 16px;" 
            data-event-id="${evt.id}"
            aria-label="RSVP for ${sanitizeHTML(evt.title)}"
          >
            RSVP / Register Attendance
          </button>
        </div>
      </article>
    `).join('');

    // Attach RSVP click handlers
    document.querySelectorAll('.rsvp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.currentTarget.getAttribute('data-event-id');
        openRSVPModal(eventId);
      });
    });
  }

  // --- Async Connectivity Simulation (Bad Connectivity NFR) ---
  function triggerAsyncUpdate(callback, delayMs = 400) {
    loadingSpinner.classList.remove('hidden');
    eventsGrid.style.opacity = '0.3';

    setTimeout(() => {
      callback();
      loadingSpinner.classList.add('hidden');
      eventsGrid.style.opacity = '1';
    }, delayMs);
  }

  // --- Event Handlers ---
  function handleSearchInput(e) {
    searchQuery = e.target.value;
    logTelemetry('Event Search Performed', { query: searchQuery });
    triggerAsyncUpdate(renderEvents, 300);
  }

  // --- Custom Select Dropdown Helpers ---
  function toggleCustomDropdown() {
    const isOpen = customSelectContainer.classList.contains('open');
    if (isOpen) {
      closeCustomDropdown();
    } else {
      customSelectContainer.classList.add('open');
      categoryDropdownList.classList.remove('hidden');
      categorySelectTrigger.setAttribute('aria-expanded', 'true');
    }
  }

  function closeCustomDropdown() {
    customSelectContainer.classList.remove('open');
    categoryDropdownList.classList.add('hidden');
    categorySelectTrigger.setAttribute('aria-expanded', 'false');
  }

  function handleCategoryChange(category) {
    activeCategory = category;
    categorySelect.value = category;

    // Update Custom Select UI
    const matchingOption = Array.from(customOptions).find(opt => opt.getAttribute('data-value') === category);
    if (matchingOption) {
      selectedCategoryText.textContent = matchingOption.textContent;
    }

    customOptions.forEach(opt => {
      const isMatch = opt.getAttribute('data-value') === category;
      opt.classList.toggle('active', isMatch);
      opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    closeCustomDropdown();

    // Sync Category Pills
    pillBtns.forEach(btn => {
      const isMatch = btn.getAttribute('data-category') === category;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    logTelemetry('Category Filter Selected', { category });
    triggerAsyncUpdate(renderEvents, 300);
  }

  function resetFilters() {
    searchQuery = '';
    activeCategory = 'ALL';
    searchInput.value = '';
    categorySelect.value = 'ALL';
    
    selectedCategoryText.textContent = 'All Event Categories';
    customOptions.forEach(opt => {
      const isAll = opt.getAttribute('data-value') === 'ALL';
      opt.classList.toggle('active', isAll);
      opt.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });

    pillBtns.forEach(btn => {
      const isAll = btn.getAttribute('data-category') === 'ALL';
      btn.classList.toggle('active', isAll);
      btn.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });

    closeCustomDropdown();
    logTelemetry('Filters Reset', {});
    triggerAsyncUpdate(renderEvents, 400);
  }

  // --- Modal Logic & Form Validation (Unhappy Path) ---
  function openRSVPModal(eventId) {
    const eventObj = eventsState.find(e => e.id === eventId);
    if (!eventObj) return;

    selectedEventForRSVP = eventObj;
    document.getElementById('event-id-input').value = eventId;

    eventSummaryBox.innerHTML = `
      <div class="event-summary-title">${sanitizeHTML(eventObj.title)}</div>
      <div class="event-summary-meta">${sanitizeHTML(eventObj.date)} • ${sanitizeHTML(eventObj.time)}</div>
      <div class="event-summary-meta">Location: ${sanitizeHTML(eventObj.location)}</div>
    `;

    // Clear previous form validation errors
    clearFormErrors();
    rsvpForm.reset();
    attendeesCountInput.value = '1';

    rsvpModal.classList.remove('hidden');
    attendeeNameInput.focus();

    logTelemetry('RSVP Modal Opened', { eventId: eventObj.id, title: eventObj.title });
  }

  function closeRSVPModal() {
    rsvpModal.classList.add('hidden');
    selectedEventForRSVP = null;
    clearFormErrors();
    logTelemetry('RSVP Modal Closed', {});
  }

  function clearFormErrors() {
    formErrorAlert.classList.add('hidden');
    [attendeeNameInput, attendeeEmailInput, attendeesCountInput].forEach(input => {
      input.classList.remove('invalid');
    });
    [nameError, emailError, countError].forEach(err => {
      err.classList.add('hidden');
    });
  }

  // --- Form Submission & Validation (Unhappy Path Input Handling) ---
  function handleRSVPSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    let isValid = true;
    const nameVal = attendeeNameInput.value.trim();
    const emailVal = attendeeEmailInput.value.trim();
    const countVal = parseInt(attendeesCountInput.value, 10);
    const notesVal = attendeeNotesInput.value;

    // Validate Name
    if (!nameVal || nameVal.length < 2) {
      attendeeNameInput.classList.add('invalid');
      nameError.classList.remove('hidden');
      isValid = false;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      attendeeEmailInput.classList.add('invalid');
      emailError.classList.remove('hidden');
      isValid = false;
    }

    // Validate Count
    if (isNaN(countVal) || countVal < 1 || countVal > 10) {
      attendeesCountInput.classList.add('invalid');
      countError.classList.remove('hidden');
      isValid = false;
    }

    if (!isValid) {
      formErrorAlert.classList.remove('hidden');
      logTelemetry('RSVP Form Submission Failed Validation', {
        nameValid: nameVal.length >= 2,
        emailValid: emailRegex.test(emailVal),
        countValid: !isNaN(countVal) && countVal >= 1 && countVal <= 10
      });
      return;
    }

    // Sanitize XSS in notes before storing / logging
    const sanitizedNotes = sanitizeHTML(notesVal);

    // Update Available Seats
    if (selectedEventForRSVP) {
      selectedEventForRSVP.availableSeats = Math.max(0, selectedEventForRSVP.availableSeats - countVal);
    }

    closeRSVPModal();
    renderEvents();

    showToast(`RSVP Confirmed for ${countVal} attendee(s)! Confirmation sent to ${sanitizeHTML(emailVal)}.`);

    logTelemetry('RSVP Form Successfully Submitted', {
      eventId: selectedEventForRSVP ? selectedEventForRSVP.id : null,
      attendeeName: nameVal,
      attendeeEmail: emailVal,
      count: countVal,
      sanitizedNotes: sanitizedNotes
    });
  }

  // --- Initialize Event Listeners ---
  function init() {
    // Search & Category Filters
    searchInput.addEventListener('input', handleSearchInput);
    categorySelect.addEventListener('change', (e) => handleCategoryChange(e.target.value));

    // Custom Select Component Events
    if (categorySelectTrigger && categoryDropdownList) {
      categorySelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCustomDropdown();
      });

      customOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.getAttribute('data-value');
          handleCategoryChange(val);
        });

        opt.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            const val = opt.getAttribute('data-value');
            handleCategoryChange(val);
          }
        });
      });

      // Close custom dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (customSelectContainer && !customSelectContainer.contains(e.target)) {
          closeCustomDropdown();
        }
      });
    }

    pillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        handleCategoryChange(cat);
      });
    });

    resetFiltersBtn.addEventListener('click', resetFilters);

    simSlowBtn.addEventListener('click', () => {
      logTelemetry('Simulated 3G Slow Connection Triggered', {});
      triggerAsyncUpdate(renderEvents, 1200);
    });

    // Modal Control Events
    closeModalBtn.addEventListener('click', closeRSVPModal);
    cancelModalBtn.addEventListener('click', closeRSVPModal);

    // Keyboard ESC to close modal & custom dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (categoryDropdownList && !categoryDropdownList.classList.contains('hidden')) {
          closeCustomDropdown();
        }
        if (rsvpModal && !rsvpModal.classList.contains('hidden')) {
          closeRSVPModal();
        }
      }
    });

    // Form Submission
    rsvpForm.addEventListener('submit', handleRSVPSubmit);

    // Initial Telemetry & Render
    logTelemetry('Independent Bookstore Events Page Initialized', { initialEventCount: eventsState.length });
    renderEvents();
  }

  // DOM Content Loaded Execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
