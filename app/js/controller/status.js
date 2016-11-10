/* global window */
/* global document */
/* global $ */
/* global RSBP */

(function () {

  "use strict";

  let firstOnline = false;
  let firstRate = false;
  let update = function () {
    $("#status-div").addClass("invisible");
    $("#status-div").removeClass("alert-info");
    $("#status-div").removeClass("alert-warning");
    $("#status-div").removeClass("alert-danger");
    $("#status-content").text("");
    if (!firstOnline || !firstRate) {
      if (!firstOnline) {
        if (RSBP.isOnline()) {
          firstOnline = true;
          if (!firstRate) {
            if (RSBP.isRateValid()) {
              firstRate = true;
            } else {
              $("#status-div").removeClass("invisible");
              $("#status-div").addClass("alert-info");
              $("#status-content").text("Getting the exchange rate...");
            }
          }
        } else {
          $("#status-div").removeClass("invisible");
          $("#status-div").addClass("alert-info");
          $("#status-content").text("Connecting...");
        }
      } else {
        if (RSBP.isRateValid()) {
          firstRate = true;
        } else {
          $("#status-div").removeClass("invisible");
          $("#status-div").addClass("alert-info");
          $("#status-content").text("Getting the exchange rate...");
        }
      }
    } else if (!RSBP.isOnline()) {
      $("#status-div").removeClass("invisible");
      $("#status-div").addClass("alert-danger");
      $("#status-content").text("Disconnected. Reconnecting...");
    } else if (!RSBP.isRateValid()) {
      $("#status-div").removeClass("invisible");
      $("#status-div").addClass("alert-warning");
      $("#status-content").text("Exchange rate expired. Getting a new one...");
    }
  };

  $(document).ready(function () {
    update();
    window.addEventListener("connectivity", update);
    window.addEventListener("rate", update);
  });
}());
