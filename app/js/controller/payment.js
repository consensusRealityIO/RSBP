/* global window */
/* global document */
/* global $ */
/* global RSBP_CONFIG */
/* global RSBP */

(function () {

  "use strict";

  let payeeName = RSBP_CONFIG.payee.name;
  let address = RSBP_CONFIG.payee.address;
  let currency = RSBP_CONFIG.payee.currency;
  let amount = RSBP_CONFIG.payee.amount;

  $(document).ready(function () {
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
