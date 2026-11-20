const WEB3FORMS_ACCESS_KEYS = {
  interestForm: "31fd1332-e952-4343-9467-99a12013ec80",
  quickContactForm: "31fd1332-e952-4343-9467-99a12013ec80",
};
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

const mobileMenuToggle = document.querySelector("#mobileMenuToggle");
const mobileMenu = document.querySelector("#mobileMenu");

if (mobileMenuToggle && mobileMenu) {
  const closeMobileMenu = () => {
    mobileMenu.hidden = true;
    mobileMenuToggle.setAttribute("aria-expanded", "false");
    mobileMenuToggle.setAttribute(
      "aria-label",
      window.getLocalizedText("Open navigation menu")
    );
  };

  mobileMenuToggle.addEventListener("click", () => {
    const isExpanded = mobileMenuToggle.getAttribute("aria-expanded") === "true";
    mobileMenu.hidden = isExpanded;
    mobileMenuToggle.setAttribute("aria-expanded", String(!isExpanded));
    mobileMenuToggle.setAttribute(
      "aria-label",
      window.getLocalizedText(
        isExpanded ? "Open navigation menu" : "Close navigation menu"
      )
    );
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1280) {
      closeMobileMenu();
    }
  });
}

const formMessages = {
  interestForm: {
    success: "Thank you! Your class interest form has been sent.",
  },
  quickContactForm: {
    success: "Thank you! Your message has been sent.",
  },
};

function showFormMessage(status, state, message) {
  status.dataset.state = state;
  status.dataset.message = message;
  delete status.dataset.messageDetail;
  status.textContent = window.getLocalizedText(message);
  status.hidden = false;
}

async function submitForm(form) {
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const message = formMessages[form.id];
  const accessKey = WEB3FORMS_ACCESS_KEYS[form.id];

  if (!status) {
    console.error("Form submission could not start because required form elements are missing.");
    return;
  }

  if (!submitButton || !message) {
    console.error("Form submission could not start because required form elements are missing.");
    showFormMessage(
      status,
      "error",
      "We couldn't send your message because this form isn't configured correctly."
    );
    return;
  }

  if (form.dataset.submitting === "true") {
    return;
  }

  if (!accessKey) {
    showFormMessage(
      status,
      "error",
      "Form submissions are not configured yet. Please check the Web3Forms access keys in script.js."
    );
    return;
  }

  const originalButtonText = form.id === "interestForm" ? "Submit" : "Send";
  const formData = new FormData(form);
  const senderName =
    form.id === "quickContactForm"
      ? `${formData.get("first_name")} ${formData.get("last_name")}`.trim()
      : String(formData.get("first_name") || "");

  formData.append("access_key", accessKey);
  formData.set("from_name", senderName || "Website visitor");

  form.dataset.submitting = "true";
  submitButton.disabled = true;
  submitButton.textContent = window.getLocalizedText("Sending...");
  showFormMessage(status, "pending", "Sending your message...");

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });
    const result = await response.json();

    if (!response.ok || result.success !== true) {
      throw new Error(
        result.message || `The form could not be sent (HTTP ${response.status}).`
      );
    }

    form.reset();
    showFormMessage(status, "success", message.success);
  } catch (error) {
    console.error("Web3Forms submission failed.", error);
    showFormMessage(status, "error", "We couldn't send your message. Please try again.");
    if (window.siteLanguage === "en" && error instanceof Error && error.message) {
      status.dataset.messageDetail = error.message;
      status.textContent += ` ${error.message}`;
    }
  } finally {
    delete form.dataset.submitting;
    submitButton.disabled = false;
    submitButton.textContent = window.getLocalizedText(originalButtonText.trim());
  }
}

document
  .querySelectorAll("#interestForm, #quickContactForm")
  .forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void submitForm(form);
    });
  });
