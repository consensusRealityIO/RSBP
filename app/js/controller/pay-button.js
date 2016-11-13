/* global console */
/* global window */
/* global document */
/* global $ */
/* global RSBP */

(function () {

  "use strict";

  let update = function () {
    let disabled = $("#pay-button").prop("disabled") || false;
    if (RSBP.connector.isOnline() && RSBP.rate.isValid()) {
      if (disabled) {
        console.info("Enabling pay button");
        $("#pay-button").prop("disabled", false);
      }
    } else if (!disabled) {
      console.info("Disabling pay button");
      $("#pay-button").prop("disabled", true);
    }
  };

  $(document).ready(function () {
    console.info("Initializing pay button controller...");
    update();
    window.addEventListener("connectivity", update);
    window.addEventListener("rate", update);
    console.info("Pay button controller initialized");
  });
}());
