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

  let update = function () {
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
    update();
    window.addEventListener("connectivity", update);
    window.addEventListener("rate", update);
    console.info("App status controller initialized");
  });
}());
