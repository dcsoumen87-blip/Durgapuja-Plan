(() => {
  const $ = id => document.getElementById(id);
  const panels = [...document.querySelectorAll(".panel")];

  let active = 0;
  let submitting = false;
  const places = new Set();
  const activities = new Set();
  let finalPlan = "";

  // Use the device's local date.
  const now = new Date();
  const today = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);

  $("date").min = today;
  $("date").value = today;

  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      $("toast").classList.remove("show");
    }, 2500);
  }

  function showPanel(index) {
    active = index;

    panels.forEach((panel, i) => {
      panel.classList.toggle("active", i === index);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (index === 5) renderSummary();
    if (index === 7) renderSuccessSummary();
  }

  function prettyDate(value) {
    if (!value) return "Not selected";

    return new Date(value + "T12:00:00")
      .toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
  }

  function getPlaces() {
    const result = [...places].filter(
      place => place !== "Custom place"
    );

    const custom = $("customPlace").value.trim();

    if (places.has("Custom place") && custom) {
      result.push(custom);
    }

    return result;
  }

  function getPlan() {
    return [
      "Our Durga Puja Plan ♡",
      `Date: ${prettyDate($("date").value)}`,
      `Time: ${$("timeSlot").value}`,
      `Places: ${getPlaces().join(", ") || "Not selected"}`,
      `Activities: ${[...activities].join(", ") || "Not selected"}`,
      `Special request: ${$("special").value.trim() || "None"}`,
      `Message: ${$("message").value.trim() || "None"}`
    ].join("\n");
  }

  // Safely create summary rows without injecting user text as HTML.
  function addRow(icon, label, value) {
    const row = document.createElement("div");
    row.className = "summary-row";

    const iconElement = document.createElement("div");
    iconElement.textContent = icon;

    const labelElement = document.createElement("div");
    labelElement.className = "summary-key";
    labelElement.textContent = label;

    const valueElement = document.createElement("div");
    valueElement.className = "summary-value";
    valueElement.textContent = value || "—";

    row.append(iconElement, labelElement, valueElement);
    return row;
  }

  function renderSummary() {
    const summary = $("summary");
    summary.replaceChildren();

    const rows = [
      ["🗓️", "Tarikh", prettyDate($("date").value)],
      ["🕒", "Shomoy", $("timeSlot").value],
      ["📍", "Jaiga", getPlaces().join(", ")],
      ["🎟️", "Activities", [...activities].join(", ")],
      ["💌", "Special Request", $("special").value.trim()],
      ["💗", "Tomar Message", $("message").value.trim()]
    ];

    rows.forEach(([icon, label, value]) => {
      summary.appendChild(addRow(icon, label, value));
    });
  }

  function renderSuccessSummary() {
    $("successSummary").textContent = getPlan();
  }

  // Character counters.
  $("special").addEventListener("input", () => {
    $("specialCount").textContent = $("special").value.length;
  });

  $("message").addEventListener("input", () => {
    $("messageCount").textContent = $("message").value.length;
  });

  // Welcome screen.
  $("yesBtn").addEventListener("click", () => showPanel(1));

  $("maybeBtn").addEventListener("click", () => {
    toast("No pressure — dekhe nao, tarpor cholo ♡");
  });

  // Next buttons and basic validation.
  document.querySelectorAll("[data-next]").forEach(button => {
    button.addEventListener("click", () => {
      if (active === 1) {
        if (!$("date").value || $("date").value < today) {
          toast("Please choose a valid date ♡");
          return;
        }
      }

      if (active === 2) {
        if (places.size === 0) {
          toast("At least one place select koro ♡");
          return;
        }

        if (
          places.has("Custom place") &&
          !$("customPlace").value.trim()
        ) {
          toast("Custom place-ta likhe dao ♡");
          return;
        }
      }

      if (active === 3 && activities.size === 0) {
        toast("At least one activity select koro ♡");
        return;
      }

      showPanel(active + 1);
    });
  });

  // Back and Edit buttons.
  document.querySelectorAll("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
      showPanel(Math.max(0, active - 1));
    });
  });

  // Multi-select locations.
  document.querySelectorAll("[data-place]").forEach(button => {
    button.addEventListener("click", () => {
      const place = button.dataset.place;

      if (places.has(place)) {
        places.delete(place);
      } else {
        places.add(place);
      }

      button.classList.toggle("selected", places.has(place));

      $("customPlaceWrap").classList.toggle(
        "hidden",
        !places.has("Custom place")
      );
    });
  });

  // Multi-select activities.
  document.querySelectorAll("[data-activity]").forEach(button => {
    button.addEventListener("click", () => {
      const activity = button.dataset.activity;

      if (activities.has(activity)) {
        activities.delete(activity);
      } else {
        activities.add(activity);
      }

      button.classList.toggle(
        "selected",
        activities.has(activity)
      );
    });
  });

  // Final review.
  $("reviewBtn").addEventListener("click", () => {
    showPanel(5);
  });

  /*
   * EMAIL SETUP:
   * Configure a secure backend endpoint here after deployment.
   * Never place email-provider secrets in this public file.
   *
   * Until configured, the website uses demo mode.
   * Demo mode does NOT send an email.
   */
  const EMAIL_ENDPOINT = "";

  async function submitPlan(plan) {
    if (!EMAIL_ENDPOINT) {
      await new Promise(resolve => setTimeout(resolve, 1800));
      return { demo: true };
    }

    const response = await fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan })
    });

    if (!response.ok) {
      throw new Error("Could not submit the plan");
    }

    return { demo: false };
  }

  // Submit -> loading -> success.
  $("submitBtn").addEventListener("click", async () => {
    if (submitting) return;

    if (!$("date").value) {
      toast("Date-ta select koro ♡");
      showPanel(1);
      return;
    }

    submitting = true;
    $("submitBtn").disabled = true;
    finalPlan = getPlan();

    showPanel(6);
    $("progressBar").style.width = "0%";

    let progress = 0;

    const timer = setInterval(() => {
      progress = Math.min(92, progress + 10);
      $("progressBar").style.width = progress + "%";
    }, 180);

    try {
      const result = await submitPlan(finalPlan);

      clearInterval(timer);
      $("progressBar").style.width = "100%";

      showPanel(7);

      if (result.demo) {
        toast("Demo mode: email delivery is not configured.");
      }
    } catch (error) {
      clearInterval(timer);
      showPanel(5);
      toast("Submit failed. Please try again.");
    } finally {
      submitting = false;
      $("submitBtn").disabled = false;
    }
  });

  // Start again.
  $("restartBtn").addEventListener("click", () => {
    places.clear();
    activities.clear();

    document.querySelectorAll(".tile.selected")
      .forEach(button => button.classList.remove("selected"));

    $("customPlace").value = "";
    $("customPlaceWrap").classList.add("hidden");

    $("special").value = "";
    $("message").value = "";
    $("specialCount").textContent = "0";
    $("messageCount").textContent = "0";

    $("date").value = today;
    $("timeSlot").selectedIndex = 2;

    finalPlan = "";
    showPanel(0);
  });

  // Share the completed plan.
  $("shareBtn").addEventListener("click", async () => {
    const text = finalPlan || getPlan();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Our Durga Puja Plan ♡",
          text
        });
      } catch (error) {
        // The user may cancel sharing.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast("Plan copied — share it with your favorite person ♡");
    } catch (error) {
      toast("Please copy the plan from the summary manually.");
    }
  });
})();
