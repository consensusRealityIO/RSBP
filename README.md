# RSBP
Real Simple Bitcoin Payments

Real Simple Bitcoin Payments is a single webpage that facilitates bitcoin payments, converting a fiat currency amount into a real-time bitcoin amount, creating the QR code, and acknowledging payment on the blockchain. 

Parameters can be hard coded in the file or passed in the URL. 

Parameters include:

currency - The three character currency code. i.e. BTC, USD, IDR, ZAR

amount - The amount in fiat currency to be converted to BTC

address - The Bitcoin address to be paid

discount - The discount percentage to be applied to the converstion rate

You can see a running example implementation here: https://consensusreality.io/payments/pay.html?address=1Ho5zPf5zvtCiUcAQaazH2auDrQz1ovfF6&currency=IDR&amount=1000000

3 minute How-to:
https://www.youtube.com/watch?v=Obe2nyewab4

## Installation

### Development ###

```sh
npm install
```

This will install the linters used by `RSBP` and run `bower install`. You can then check the code against the style rules by running `npm run-script lint`.

### Deployment ###

```sh
bower install
```

This will install the required client-side libraries in `app/bower_components`. You can then deploy the `app` folder according to your web server configuration.
