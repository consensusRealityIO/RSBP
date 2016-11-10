/* global console */
/* global window */
/* global document */
/* global $ */
/* global RSBP */

(function () {

  "use strict";

  let update = function () {
    if (RSBP.isOnline() && RSBP.isRateValid()) {
      console.info("Enabling pay button");
      $("#pay-button").prop("disabled", false);
    } else {
      console.info("Disabling pay button");
      $("#pay-button").prop("disabled", true);
    }
  };

  $(document).ready(function () {
    update();
    window.addEventListener("connectivity", update);
    window.addEventListener("rate", update);
  });
}());
