/* global console */
/* global window */
/* global document */
/* global $ */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {
  $(document).ready(function() {

    let payeeName = RSBP_CONFIG.payee.name;
    let address = RSBP_CONFIG.payee.address;
    let currency = RSBP_CONFIG.payee.currency;
    let amount = RSBP_CONFIG.payee.amount;

    // Setup currency button
    $("#currency-button").text(currency);

    // Setup pay button controller
    let updatePayButton = function () {
      if (RSBP.isOnline() && RSBP.isRateValid()) {
        console.info("Enabling pay button");
        $("#pay-button").removeClass("disabled");
      } else {
        console.info("Disabling pay button");
        $("#pay-button").addClass("disabled");
      }
    };
    updatePayButton();
    window.addEventListener("connectivity", updatePayButton);
    window.addEventListener("rate", updatePayButton);

    // Setup status controller
    let firstOnline = false;
    let firstRate = false;
    let updateStatus = function () {
      $(".status-div").addClass("invisible");
      $(".status-div").removeClass("alert-info");
      $(".status-div").removeClass("alert-warning");
      $(".status-div").removeClass("alert-danger");
      $(".status-content").text("");
      if (!firstOnline || !firstRate) {
        if (!firstOnline) {
          if (RSBP.isOnline()) {
            firstOnline = true;
            if (!firstRate) {
              if (RSBP.isRateValid()) {
                firstRate = true;
              } else {
                $(".status-div").removeClass("invisible");
                $(".status-div").addClass("alert-info");
                $(".status-content").text("Getting the exchange rate...");
              }
            }
          } else {
            $(".status-div").removeClass("invisible");
            $(".status-div").addClass("alert-info");
            $(".status-content").text("Connecting...");
          }
        } else {
          if (RSBP.isRateValid()) {
            firstRate = true;
          } else {
            $(".status-div").removeClass("invisible");
            $(".status-div").addClass("alert-info");
            $(".status-content").text("Getting the exchange rate...");
          }
        }
      } else if (!RSBP.isOnline()) {
        $(".status-div").removeClass("invisible");
        $(".status-div").addClass("alert-danger");
        $(".status-content").text("Disconnected. Reconnecting...");
      } else if (!RSBP.isRateValid()) {
        $(".status-div").removeClass("invisible");
        $(".status-div").addClass("alert-warning");
        $(".status-content").text("Exchange rate expired. Getting a new one...");
      }
    };
    updateStatus();
    window.addEventListener("connectivity", updateStatus);
    window.addEventListener("rate", updateStatus);

    // Setup currency amount input field
    $("#currency-amount-input-field").val(amount);

    let blockChainCheckInterval = null;
    $("#pay-button").click(function () {
      let invoiceId = Math.floor(Math.random() * (900000 - 100000 + 1)) + 100000;
      let rate = RSBP.getRate();
      amount = $("#currency-amount-input-field").val();
      let paymentUri = "bitcoin:" + address + "?amount=" + (amount / rate).toFixed(8);
      if (payeeName) {
        paymentUri += "&message=invoice" + invoiceId + "&label=" + payeeName;
      }
      $("#qrcode").html(""); // reset qrcode
      $("#qrcode").qrcode(paymentUri);
      $("#qrcode-text").text(paymentUri);
      $("#qrcode-text").attr("href", paymentUri);

      if (currency !== "BTC") {
        $("#exchange-rate").text("Rate 1 BTC = " + rate.toLocaleString() + " " + currency);
        $("#total-price").text("Total " + amount.toLocaleString() + " " + currency + " (" +
              (amount/rate).toFixed(8) + " BTC)" );
      } else {
        $("#total-price").text("Total " + amount.toLocaleString() + " BTC");
      }

      $("#payment-confirmation").modal("toggle");

      // waiting animation
      $("#payment-confirmation-title").text("Waiting for payment");
      let ellipsisInterval = window.setInterval(function(){
        for (let i = 1; i <= 3; i++) {
          window.setTimeout(function() {
            $("#payment-confirmation-title").append(".");
          }, i * 250);
        }
        $("#payment-confirmation-title").text("Waiting for payment");
      }, 1000);

      RSBP.fetch("https://blockchain.info/q/addressbalance/"+address+"?cors=true", function (body) {
        let initialBalance = JSON.parse(body);
        blockChainCheckInterval = window.setInterval(function() {
          RSBP.fetch("https://blockchain.info/q/addressbalance/"+address+"?cors=true", function (body) {
            let balance = JSON.parse(body);
            if (balance > initialBalance) {
              if ((balance - initialBalance - (amount/rate).toFixed(8)) > 0) {
                window.clearInterval(blockChainCheckInterval);
                window.clearInterval(ellipsisInterval);
                $("#payment-confirmation-title").text();
                $("#payment-confirmation-title").append("<div class=\"alert alert-success\"><strong>Success!</strong> The payment has been received.</div>");
              } else {
                window.clearInterval(blockChainCheckInterval);
                window.clearInterval(ellipsisInterval);
                $("#payment-confirmation-title").text("Amount received is insufficient");

                // close modal after 1 second
                window.setTimeout(function(){$("#close-model").trigger("click");}, 1000);
                $("#currency-amount-input-field").val(amount / rate - rate * (balance - initialBalance));
                $("#pay-button").trigger("click");
              }
            }
          });
        }, 5 * 1000);
      });
    });

    // interpret <enter> keypress as click on the order button
    $("#currency-amount-input-field").keyup(function (evt) {
      if (evt.which == 13) {
        $("#pay-button").trigger("click");
      }
    });

    $("#close-modal").click(function(){
      window.clearInterval(blockChainCheckInterval);
    });

    $("#payment-confirmation").on("hidden.bs.modal", function () {
      window.clearInterval(blockChainCheckInterval);
    });
  });
}());
