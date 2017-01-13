/* global console */
/* global window */
/* global document */
/* global $ */
/* global RSBP */

(function () {

  "use strict";

  let update = function () {
    let valid = $("#order-form")[0].checkValidity() &&
                RSBP.connector.isOnline() &&
                RSBP.rate.isValid();

    $("#pay-button").prop("disabled", !valid);
  };

  $(document).ready(function () {
    console.info("Initializing pay button controller...");
    update();
    $("#currency-amount-input-field").on("input", update);
    window.addEventListener("connectivity", update);
    window.addEventListener("rate", update);
    console.info("Pay button controller initialized");
  });
}());
