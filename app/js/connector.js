var RSBP = (function (RSBP, window, $) {

  "use strict";

  let online = false;

  let doOnline = function () {
    if (!online) {
      online = true;
      $(".status-div").addClass("invisible");
      $(".status-content").text("");
      console.info("App online");
    }
  };

  let doOffline = function () {
    if (online) {
      online = false;
      $(".status-div").removeClass("invisible");
      $(".status-content").text("Connection error");
      console.info("App offline");
    }
  };

  let setupWebSocket = function () {

    let TIMEOUT = 1500;

    let webSocket = new WebSocket("ws://echo.websocket.org/");

    let sentTimestamp = -1;
    let receivedTimestamp = -1;
    let ping = null;
    let checkConnectivity = null;

    webSocket.onopen = function(evt) {
      console.info("WebSocket opened");
      ping = window.setInterval(function () {
        sentTimestamp = Date.now();
        webSocket.send("{}");
      }, TIMEOUT);
      checkConnectivity = window.setInterval(function () {
        if (receivedTimestamp != -1 &&
            Math.abs(receivedTimestamp - sentTimestamp) <= TIMEOUT) {
          doOnline();
        } else {
          doOffline();
        }
      }, TIMEOUT);
    };

    webSocket.onclose = function(evt) {
      console.info("WebSocket closed");
      window.clearInterval(ping);
      window.clearInterval(checkConnectivity);
      doOffline();
      window.setTimeout(setupWebSocket, 1000);
    };

    webSocket.onmessage = function(evt) {
      receivedTimestamp = Date.now();
    };

    webSocket.onerror = function(evt) {
      console.error("WebSocket error: " + JSON.stringify(evt || {}));
      window.clearInterval(ping);
      window.clearInterval(checkConnectivity);
      doOffline();
    };
  };

  let fetch = function (url, callback) {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          callback(xhr.responseText, xhr.status);
        }
      };
      xhr.open("GET", url);
      xhr.send();
  };

  setupWebSocket();

  RSBP.fetch = fetch;

  return RSBP;

}(RSBP || {}, window, $));
