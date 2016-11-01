var RSBP = (function (RSBP, RSBP_CONFIG, window, $) {

  "use strict";

  let TIMEOUT = RSBP_CONFIG.connector.timeout;
  let RECONNECT_INTERVAL = RSBP_CONFIG.connector.reconnectInterval;
  let CORS_PROXY = RSBP_CONFIG.connector.corsProxy;

  let online = false;
  let connectivityEvent = new Event("connectivity");

  let isOnline = function () {
    return online;
  };

  let doOnline = function () {
    if (!online) {
      online = true;
      $(".status-div").addClass("invisible");
      $(".status-content").text("");
      console.info("App online");
      window.dispatchEvent(connectivityEvent);
    }
  };

  let doOffline = function () {
    if (online) {
      online = false;
      $(".status-div").removeClass("invisible");
      $(".status-content").text("Connection error");
      console.info("App offline");
      window.dispatchEvent(connectivityEvent);
    }
  };

  let setupWebSocket = function () {

    let webSocket = new WebSocket("wss://echo.websocket.org/");
    let receivedTime = -1;

    let ping = function () {
      webSocket.send(".");
    };

    let pingInterval = null;

    let checkConnectivity = function () {
      if (Math.abs(Date.now() - receivedTime) <= TIMEOUT) {
        doOnline();
      } else {
        doOffline();
      }
    };

    let checkConnectivityInterval = null;

    webSocket.onopen = function(evt) {
      console.info("WebSocket opened");
      pingInterval = window.setInterval(ping, TIMEOUT);
      ping();
      checkConnectivityInterval = window.setInterval(checkConnectivity, TIMEOUT);
      doOnline();
    };

    webSocket.onclose = function(evt) {
      console.info("WebSocket closed");
      window.clearInterval(pingInterval);
      window.clearInterval(checkConnectivityInterval);
      doOffline();
      window.setTimeout(setupWebSocket, RECONNECT_INTERVAL);
    };

    webSocket.onmessage = function(evt) {
      receivedTime = Date.now();
    };

    webSocket.onerror = function(evt) {
      console.error("WebSocket error: " + JSON.stringify(evt || {}));
      window.clearInterval(pingInterval);
      window.clearInterval(checkConnectivityInterval);
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

  let ajax = function (url, useCorsProxy = false) {
    if (useCorsProxy) {
      url = CORS_PROXY + url;
      console.info("Using CORS proxy: " + url);
    }
    return $.ajax(url);
  };

  doOnline();
  setupWebSocket();

  RSBP.isOnline = isOnline;
  RSBP.fetch = fetch; // for backward compatibility
  RSBP.ajax = ajax;

  return RSBP;

}(RSBP || {}, RSBP_CONFIG, window, $));
