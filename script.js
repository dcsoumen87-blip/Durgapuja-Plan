(() => {
  const $ = (id) => document.getElementById(id);
  const panels = [...document.querySelectorAll(".panel")];

  let active = 0;
  let submitLock = false;
  let emailJsReady = false;
  let lastPlanText = "";

  const chosenPlaces = new Set();
  const chosenActivities = new Set();

  const EMAILJS_PUBLIC_KEY = "T3_hyH48oEjbcJKDo";
  const EMAILJS_SERVICE_ID = "service_jlilyv7";
  const EMAILJS_TEMPLATE_ID = "template_dc6whq5";

  const today = new Date();
  const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);

  $("date").min = localToday;
  if (!$("date").value) $("date").value = localToday;

  function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");

    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      $("toast").classList.remove("show");
    }, 4000);
  }

  function showPanel(number) {
    active = number;

    panels.forEach((panel, index) => {
      panel.classList.toggle("active", index === number);
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (number === 5) renderSummary();
    if (number === 7) renderSuccessSummary();
  }

  function prettyDate(value) {
    if (!value) return "Not selected";

    return new Date(value + "T12:00:00").toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  }

  function selectedPlaceList() {
    const places = [...chosenPlaces].filter(
      place => place !== "Custom place"
    );

    const customPlace = $("customPlace").value.trim();

    if (chosenPlaces.has("Custom place") && customPlace) {
      places.push(customPlace);
    }

    return places;
  }

  function makePlanText() {
    const places = selectedPlaceList();
    const activities = [...chosenActivities];

    return [
      "Our Durga Puja Plan ❤️",
      `Date: ${prettyDate($("date").value)}`,
      `Time: ${$("timeSlot").value}`,
      `Places: ${places.join(", ") || "None"}`,
      `Activities: ${activities.join(", ") || "None"}`,
      `Special request: ${$("special").value.trim() || "None"}`,
      `Message: ${$("message").value.trim() || "None"}`
    ].join("\n");
  }

  function addRow(icon, key, value) {
    const row = document.createElement("div");
    row.className = "summary-row";

    const iconElement = document.createElement("div");
    iconElement.className = "summary-icon";
    iconElement.textContent = icon;

    const keyElement = document.createElement("div");
    keyElement.className = "summary-key";
    keyElement.textContent = key;

    const valueElement = document.createElement("div");
    valueElement.className = "summary-value";
    valueElement.textContent = value || "—";

    row.append(iconElement, keyElement, valueElement);
    return row;
  }

  function renderSummary() {
    const box = $("summary");
    box.replaceChildren();

    box.append(
      addRow("🗓️", "Tarikh", prettyDate($("date").value)),
      addRow("🕒", "Shomoy", $("timeSlot").value),
      addRow(
        "📍",
        "Jaiga (Selected)",
        selectedPlaceList().join(", ") || "Not selected"
      ),
      addRow(
        "🎟️",
        "Activities",
        [...chosenActivities].join(", ") || "Not selected"
      ),
      addRow(
        "💌",
        "Special Request",
        $("special").value.trim() || "None"
      ),
      addRow(
        "💗",
        "Tomar Message",
        $("message").value.trim() || "None"
      )
    );
  }

  function renderSuccessSummary() {
    $("successSummary").textContent = makePlanText();
  }

  function updateCount(inputId, countId) {
    $(countId).textContent = $(inputId).value.length;
  }

  $("special").addEventListener("input", () => {
    updateCount("special", "specialCount");
  });

  $("message").addEventListener("input", () => {
    updateCount("message", "messageCount");
  });

  $("yesBtn").addEventListener("click", () => showPanel(1));

  $("maybeBtn").addEventListener("click", () => {
    toast("No pressure — dekhe nao, tarpor cholo ♡");
  });

  document.querySelectorAll("[data-next]").forEach(button => {
    button.addEventListener("click", () => {
      if (active === 1 && $("date").value < localToday) {
        toast("Please choose a valid date ♡");
        return;
      }

      if (active === 2 && chosenPlaces.size === 0) {
        toast("At least one place select koro ♡");
        return;
      }

      if (
        active === 2 &&
        chosenPlaces.has("Custom place") &&
        !$("customPlace").value.trim()
      ) {
        toast("Custom place-ta likhe dao ♡");
        return;
      }

      if (active === 3 && chosenActivities.size === 0) {
        toast("At least one activity select koro ♡");
        return;
      }

      showPanel(active + 1);
    });
  });

  document.querySelectorAll("[data-back]").forEach(button => {
    button.addEventListener("click", () => {
      showPanel(Math.max(0, active - 1));
    });
  });

  document.querySelectorAll("[data-place]").forEach(button => {
    button.addEventListener("click", () => {
      const place = button.dataset.place;

      if (chosenPlaces.has(place)) {
        chosenPlaces.delete(place);
      } else {
        chosenPlaces.add(place);
      }

      button.classList.toggle("selected", chosenPlaces.has(place));

      $("customPlaceWrap").classList.toggle(
        "hidden",
        !chosenPlaces.has("Custom place")
      );
    });
  });

  document.querySelectorAll("[data-activity]").forEach(button => {
    button.addEventListener("click", () => {
      const activity = button.dataset.activity;

      if (chosenActivities.has(activity)) {
        chosenActivities.delete(activity);
      } else {
        chosenActivities.add(activity);
      }

      button.classList.toggle(
        "selected",
        chosenActivities.has(activity)
      );
    });
  });

  $("reviewBtn").addEventListener("click", () => showPanel(5));

  function initEmailJS() {
    if (emailJsReady) return true;

    if (!window.emailjs) {
      throw new Error(
        "EmailJS library load hoyni. Internet check kore reload koro."
      );
    }

    window.emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY
    });

    emailJsReady = true;
    return true;
  }

  async function deliverPlan() {
    initEmailJS();

    const places = selectedPlaceList();
    const activities = [...chosenActivities];

    const specialRequest = $("special").value.trim() || "None";
    const personalMessage = $("message").value.trim() || "None";

    // These names must match the variables in EmailJS Template.
    const templateParams = {
      from_name: "Your Durga Puja Planner",
      puja_date:
        `${prettyDate($("date").value)} · ${$("timeSlot").value}`,
      selected_places: places.join(", ") || "No places selected",
      activities: activities.join(", ") || "No activities selected",
      message:
        `Special request: ${specialRequest}\n` +
        `Personal message: ${personalMessage}`
    };

    return window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
  }

  $("submitBtn").addEventListener("click", async () => {
    if (submitLock) return;

    if (!$("date").value) {
      toast("Date-ta select koro ♡");
      showPanel(1);
      return;
    }

    submitLock = true;
    $("submitBtn").disabled = true;

    lastPlanText = makePlanText();

    showPanel(6);
    $("progressBar").style.width = "0%";

    let progress = 0;

    const progressTimer = setInterval(() => {
      progress = Math.min(92, progress + 10);
      $("progressBar").style.width = `${progress}%`;
    }, 250);

    try {
      const response = await deliverPlan();

      clearInterval(progressTimer);
      $("progressBar").style.width = "100%";

      $("loadingCaption").textContent = "Almost ready... ♡";

      console.log("EmailJS success:", response);

      showPanel(7);
      toast("Plan submitted successfully! ❤️");
    } catch (error) {
      clearInterval(progressTimer);
      showPanel(5);

      console.error("EmailJS send failed:", error);

      const details =
        error?.text ||
        error?.message ||
        (typeof error === "string" ? error : "Unknown error");

      toast(`Email failed: ${details}`);
    } finally {
      submitLock = false;
      $("submitBtn").disabled = false;
    }
  });

  $("restartBtn").addEventListener("click", () => {
    chosenPlaces.clear();
    chosenActivities.clear();

    document.querySelectorAll(".tile.selected").forEach(element => {
      element.classList.remove("selected");
    });

    $("customPlace").value = "";
    $("customPlaceWrap").classList.add("hidden");

    $("special").value = "";
    $("message").value = "";

    updateCount("special", "specialCount");
    updateCount("message", "messageCount");

    $("date").value = localToday;
    $("timeSlot").value = "Evening (5 PM - 9 PM)";

    showPanel(0);
  });

  $("shareBtn").addEventListener("click", async () => {
    const text = lastPlanText || makePlanText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Our Durga Puja Plan ♡",
          text
        });
      } catch (error) {
        // User cancelled sharing.
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast("Plan copied — share it with your favorite person ♡");
      } catch (error) {
        toast("Sharing not supported. Copy the plan manually.");
      }
    }
  });
})();
