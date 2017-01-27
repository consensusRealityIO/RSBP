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

    let input = $("#currency-amount-input-field")[0];
    let error = input.checkValidity() ? "" : "Enter Amount";

    $("#currency-amount-input-error").text(error);
  };

  $(document).ready(function () {
    console.info("Initializing pay button controller...");
    $("#currency-amount-input-field").on("keyup", update);
    $("#currency-amount-input-field").on("change", update);
    window.addEventListener("connectivity", update);
    window.addEventListener("rate", update);
    console.info("Pay button controller initialized");
  });
}());
