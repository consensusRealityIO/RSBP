/* global document */
/* global $ */
/* global RSBP_CONFIG */

(function () {
  $(document).ready(function() {

    "use strict";
    
    let currency = RSBP_CONFIG.payee.currency;
    let amount = RSBP_CONFIG.payee.amount;

    // Setup currency button
    $("#currency-button").text(currency);

    // Setup currency amount input field
    $("#currency-amount-input-field").val(amount);
  });
}());
