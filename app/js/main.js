/* global console */
/* global document */
/* global $ */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {
  $(document).ready(function() {

    "use strict";

    console.info("Starting app...");

    const ADDRESS = RSBP_CONFIG.payee.address;
    const PAYEE_NAME = RSBP_CONFIG.payee.name;
    const CURRENCY = RSBP_CONFIG.payee.currency;
    const AMOUNT = RSBP_CONFIG.payee.amount;

    document.title = PAYEE_NAME;

    $("#logo-link").prop("href", "https://insight.bitpay.com/address/" + ADDRESS);

    // Setup currency button
    $("#currency-button").text(CURRENCY);

    // Setup currency amount input field
    $("#currency-amount-input-field").val(AMOUNT);

    // Log payment modal state
    $("#payment-modal").on("shown.bs.modal", function () {
      console.info("Showing payment modal...");
    });
    $("#payment-modal").on("hidden.bs.modal", function () {
      console.info("Payment modal hidden");
    });

    // Start services
    RSBP.connector.start();
    RSBP.rate.start();

    console.info("App started");
  });
}());
