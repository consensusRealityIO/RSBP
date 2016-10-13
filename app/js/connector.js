var RSBP = (function (RSBP, window) {

  "use strict";

  window.addEventListener("load", function () {

    var online = function () {
      $(".status-div").addClass("invisible");
      $(".status-content").text("");
    };

    var offline = function () {
      $(".status-div").removeClass("invisible");
      $(".status-content").text("Connection error");
    };

    if (window.navigator.onLine) {
      console.info("App online on load");
      online();
    } else {
      console.info("App offline on load");
      offline();
    }

    window.addEventListener("offline", function () {
      console.info("App offline");
      offline();
    });

    window.addEventListener("online", function () {
      console.info("App online");
      online();
    });
  });

  var fetch = function (url) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      return JSON.parse(xhr.responseText);
  }

  RSBP.fetch = fetch;

  return RSBP;

}(RSBP || {}, window));
