/* global window */
/* global console */
/* global Event */
/* global WebSocket */
/* global $ */
/* global RSBP_CONFIG */

var RSBP = (function (RSBP) {

  "use strict";

  const TIMEOUT = RSBP_CONFIG.connector.timeout;
  const RECONNECT_INTERVAL = RSBP_CONFIG.connector.reconnectInterval;
  const CORS_PROXY = RSBP_CONFIG.connector.corsProxy;
  const CONNECTIVITY_EVENT = new Event("connectivity");

  let online = false;

  let isOnline = function () {
    return online;
  };

  let doOnline = function () {
    if (!online) {
      online = true;
      console.info("App is online");
      window.dispatchEvent(CONNECTIVITY_EVENT);
    }
  };

  let doOffline = function () {
    if (online) {
      online = false;
      console.info("App is offline");
      window.dispatchEvent(CONNECTIVITY_EVENT);
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

    webSocket.onopen = function() {
      console.info("WebSocket opened");
      pingInterval = window.setInterval(ping, TIMEOUT);
      ping();
      checkConnectivityInterval = window.setInterval(checkConnectivity, TIMEOUT);
      doOnline();
    };

    webSocket.onclose = function() {
      console.info("WebSocket closed");
      window.clearInterval(pingInterval);
      window.clearInterval(checkConnectivityInterval);
      doOffline();
      window.setTimeout(setupWebSocket, RECONNECT_INTERVAL);
    };

    webSocket.onmessage = function() {
      receivedTime = Date.now();
    };

    webSocket.onerror = function(evt) {
      console.error("WebSocket error: " + JSON.stringify(evt || {}));
      window.clearInterval(pingInterval);
      window.clearInterval(checkConnectivityInterval);
      doOffline();
    };
  };

  let ajax = function (url, useCorsProxy = false) {
    if (useCorsProxy) {
      url = CORS_PROXY + url;
      console.info("Using CORS proxy: " + url);
    }
    return $.ajax(url);
  };

  let start = function () {
    console.info("Starting connector service...");
    setupWebSocket();
    console.info("App is " + (isOnline() ? "online" : "offline"));
    console.info("Connector service started");
  };

  RSBP.connector = {
    start: start,
    isOnline: isOnline,
    ajax: ajax
  };

  return RSBP;

}(RSBP || {}));
