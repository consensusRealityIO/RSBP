/* global document */
/* global $ */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {
  $(document).ready(function() {

    "use strict";

    const PAYEE_NAME = RSBP_CONFIG.payee.name;
    const CURRENCY = RSBP_CONFIG.payee.currency;
    const AMOUNT = RSBP_CONFIG.payee.amount;

    document.title = PAYEE_NAME;

    // Setup currency button
    $("#currency-button").text(CURRENCY);

    // Setup currency amount input field
    $("#currency-amount-input-field").val(AMOUNT);
    $("#currency-amount-input-field").keyup(function (evt) {
      if (evt.which == 13) { // "Enter" key
        $("#pay-button").trigger("click");
      }
    });

    // Start services
    RSBP.connector.start();
    RSBP.rate.start();
  });
}());
