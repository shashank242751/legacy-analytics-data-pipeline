// GA key stored in frontend_demo/.env → GA_MEASUREMENT_ID

// Helper to log actions to UI
function logEvent(message, type = 'event') {
  const logBox = document.getElementById('event-log');
  const entry = document.createElement('p');
  entry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  logBox.prepend(entry);
}

// 1. Navigation Click Tracking (Virtual Pageviews)
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const pageName = link.getAttribute('data-page');
    const pagePath = `/${pageName}`;
    const pageTitle = `Page - ${pageName.toUpperCase()}`;

    if (typeof gtag === 'function') {
      gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.origin + pagePath,
        page_path: pagePath,
      });
      logEvent(`Sent 'page_view' for ${pagePath}`);
    } else {
      logEvent(`gtag not available. Event simulated: page_view (${pagePath})`, 'info');
    }
  });
});

// 2. Custom Button Click Tracking
const primaryBtn = document.getElementById('btn-cta-primary');
const secondaryBtn = document.getElementById('btn-cta-secondary');
const mockActionBtn = document.getElementById('btn-custom-purchase');

function trackButtonClick(buttonLabel, actionType) {
  if (typeof gtag === 'function') {
    gtag('event', 'button_click', {
      button_label: buttonLabel,
      action_type: actionType,
      click_timestamp: Date.now(),
    });
    logEvent(`Sent 'button_click' (label: "${buttonLabel}", action: "${actionType}")`);
  } else {
    logEvent(`gtag not available. Event simulated: button_click (${buttonLabel})`, 'info');
  }
}

primaryBtn.addEventListener('click', () => {
  trackButtonClick('Sign Up', 'signup_click');
});

secondaryBtn.addEventListener('click', () => {
  trackButtonClick('Explore Docs', 'explore_docs');
});

mockActionBtn.addEventListener('click', () => {
  if (typeof gtag === 'function') {
    gtag('event', 'poc_action', {
      action_name: 'mock_checkout',
      value: 49.99,
      currency: 'USD',
    });
    logEvent(`Sent custom event 'poc_action' (mock_checkout, value: 49.99 USD)`);
  } else {
    logEvent(`gtag not available. Event simulated: poc_action`, 'info');
  }
});


