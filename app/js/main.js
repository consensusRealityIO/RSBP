/* global document */
/* global $ */
/* global RSBP_CONFIG */

(function () {
  $(document).ready(function() {

    "use strict";

    let payeeName = RSBP_CONFIG.payee.name;
    let currency = RSBP_CONFIG.payee.currency;
    let amount = RSBP_CONFIG.payee.amount;

    document.title = payeeName;
    
    // Setup currency button
    $("#currency-button").text(currency);

    // Setup currency amount input field
    $("#currency-amount-input-field").val(amount);
  });
}());
