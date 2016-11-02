if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream){
    document.querySelector('meta[name=viewport]')
      .setAttribute(
        'content',
        'initial-scale=1.0001, minimum-scale=1.0001, maximum-scale=1.0001, user-scalable=no'
      );
  }

$(document).ready(function() {

  var payeeName = RSBP_CONFIG.payee.name;
  var address = RSBP_CONFIG.payee.address;
  var currency = RSBP_CONFIG.payee.currency;
  var amount = RSBP_CONFIG.payee.amount;
  var discount = RSBP_CONFIG.payee.discount;

  // Setup currency button
  $('#currency-button').text(currency);

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

        $("#pay-button").click(function(e){
            var invoiceID = Math.floor(Math.random() * (900000 - 100000 + 1)) + 100000;

            let rate = RSBP.getRate();
            amount = $("#currency-amount-input-field").val();
            if (payeeName) {
              var payment_uri = 'bitcoin:'+address+'?amount='+(amount/rate).toFixed(8)+'&message=invoice'+invoiceID+'&label='+payeeName;
            } else {
              var payment_uri = 'bitcoin:'+address+'?amount='+(amount/rate).toFixed(8);
            }
            $('#qrcode').html("");  // reset from previous qrcode
            $('#qrcode').qrcode(payment_uri);
            $('#qrcode-text').text(payment_uri);
            $('#qrcode-text').attr("href", payment_uri);

            if (currency != "BTC") {
              $('#exchange-rate').text('Rate 1 BTC = ' + rate.toLocaleString() + ' ' + currency);
              $('#total-price').text('Total ' + amount.toLocaleString() + ' ' + currency + ' (' +
                    (amount/rate).toFixed(8) + ' BTC)' );
            } else {
              $('#total-price').text('Total ' + amount.toLocaleString() + ' BTC');
            }

            $("#payment-confirmation").modal('toggle');

            // waiting animation
            $("#payment-confirmation-title").text("Waiting for payment");
            var ellipsis = setInterval(function(){
                for (i = 1; i <= 3; i++) {
                setTimeout(function() {
                    $("#payment-confirmation-title").append(".");
                    }, i * 250);
                }
                $("#payment-confirmation-title").text("Waiting for payment");
                },1000);

            RSBP.fetch("https://blockchain.info/q/addressbalance/"+address+"?cors=true", function (body) {
              var initial_balance = JSON.parse(body);
              var blockchain_check = setInterval(function() {
                      RSBP.fetch("https://blockchain.info/q/addressbalance/"+address+"?cors=true", function (body) {
                        var balance = JSON.parse(body);
                        if (balance > initial_balance) {
                          if ((balance - initial_balance - (amount/rate).toFixed(8)) > 0) {
                            clearInterval(blockchain_check);
                            clearInterval(ellipsis);
                            $("#payment-confirmation-title").text();
                            $("#payment-confirmation-title").append('<div class="alert alert-success"><strong>Success!</strong> The payment has been received.</div>');
                          } else {
                            clearInterval(blockchain_check);
                            clearInterval(ellipsis);
                            $("#payment-confirmation-title").text("Amount received is insufficient");

                            // close after modal 1 s
                            setTimeout(function(){$("#close-model").trigger('click');}, 1000);
                            $("#currency-amount-input-field").val(amount/rate - rate*(balance - initial_balance));
                            $("#pay-button").trigger('click')
                          }
                        }
                      });
                    }, 5*1000);
            });
         });

         // interpret <enter> keypress as click on the 'order' button
         $('#currency-amount-input-field').keyup(function (e) {
                 if(e.which == 13) {
                 $('#pay-button').trigger('click');
                 }
                 });

         $("#close-modal").click(function(e){
                 clearInterval(blockchain_check);
                 });
         $('#payment-confirmation').on('hidden.bs.modal', function () {
                 clearInterval(blockchain_check);
                 });
});
