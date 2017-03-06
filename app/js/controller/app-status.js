/* global window */
/* global console */
/* global document */
/* global $ */
/* global RSBP */

(function () {

  "use strict";

  let firstOnline = false;
  let firstRate = false;

  let resetHtml = function () {
    $("#app-status-div").addClass("invisible");
    $("#app-status-div").removeClass("alert-info");
    $("#app-status-div").removeClass("alert-warning");
    $("#app-status-div").removeClass("alert-danger");
    $("#app-status-icon").removeClass("glyphicon-exclamation-sign");
    $("#app-status-content").text("");
  };

  let setWaitFirstRateHtml = function () {
    $("#app-status-div").removeClass("invisible");
    $("#app-status-div").addClass("alert-info");
    $("#app-status-icon").addClass("glyphicon-exclamation-sign");
    $("#app-status-content").text("Getting the exchange rate...");
  };

  let setWaitRateHtml = function () {
    $("#app-status-div").removeClass("invisible");
    $("#app-status-div").addClass("alert-warning");
    $("#app-status-icon").addClass("glyphicon-exclamation-sign");
    $("#app-status-content").text("Exchange rate expired. Getting a new one...");
  };

  let setWaitFirstOnlineHtml = function () {
    $("#app-status-div").removeClass("invisible");
    $("#app-status-div").addClass("alert-info");
    $("#app-status-icon").addClass("glyphicon-exclamation-sign");
    $("#app-status-content").text("Connecting...");
  };

  let setWaitOnlineHtml = function () {
    $("#app-status-div").removeClass("invisible");
    $("#app-status-div").addClass("alert-danger");
    $("#app-status-icon").addClass("glyphicon-exclamation-sign");
    $("#app-status-content").text("Disconnected. Reconnecting...");
  };

  let updateForm = function () {
    let valid = $("#order-form")[0].checkValidity() &&
                RSBP.connector.isOnline() &&
                RSBP.rate.isValid();

    $("#pay-button").prop("disabled", !valid);

    let input = $("#currency-amount-input-field")[0];
    let error = !firstOnline || input.checkValidity() ? "" : "Enter Valid Amount";

    $("#currency-amount-input-error").text(error);
  };

  let updateStatus = function () {
    resetHtml();

    if (!firstOnline || !firstRate) {
      if (!firstOnline) {
        if (RSBP.connector.isOnline()) {
          firstOnline = true;
          if (!firstRate) {
            if (RSBP.rate.isValid()) {
              firstRate = true;
            } else {
              setWaitFirstRateHtml();
            }
          }
        } else {
          setWaitFirstOnlineHtml();
        }
      } else {
        if (RSBP.rate.isValid()) {
          firstRate = true;
        } else {
          setWaitFirstRateHtml();
        }
      }
    } else if (!RSBP.connector.isOnline()) {
      setWaitOnlineHtml();
    } else if (!RSBP.rate.isValid()) {
      setWaitRateHtml();
    }
  };

  $(document).ready(function () {
    console.info("Initializing app status controller...");
    $("#currency-amount-input-field").on("keyup", updateForm);
    $("#currency-amount-input-field").on("change", updateForm);
    window.addEventListener("connectivity", updateStatus);
    window.addEventListener("rate", updateStatus);
    updateStatus();
    console.info("App status controller initialized");
  });
}());
