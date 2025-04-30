// import dotenv from "dotenv";
// dotenv.config();

// const paypalConfig = {
//     clientId: process.env.PAYPAL_CLIENT_ID,
//     secret: process.env.PAYPAL_SECRET,
//     apiBaseUrl: "https://api-m.sandbox.paypal.com", // Use "https://api-m.paypal.com" for live mode
// };

// export default paypalConfig;


import paypal from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";

dotenv.config();

function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_SECRET;

  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  // Use `LiveEnvironment` for production: `new paypal.core.LiveEnvironment(clientId, clientSecret);`
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

export default { client };
