import fetch from 'node-fetch';
import { paypalClientID, paypalSecret } from '../config/env.js';

export const createOrder = async (cart) => {
  const response = await fetch(
    'https://api-m.sandbox.paypal.com/v2/checkout/orders',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${paypalClientID}:${paypalSecret}`,
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: cart.totalPrice.toFixed(2),
            },
          },
        ],
      }),
    },
  );
  return response.json();
};

export const captureOrder = async (orderID) => {
  const response = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(
          `${paypalClientID}:${paypalSecret}`,
        ).toString('base64')}`,
      },
    },
  );
  return response.json();
};
