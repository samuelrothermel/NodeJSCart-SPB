import {
  ApiError,
  Client,
  Environment,
  LogLevel,
  OrdersController,
  PaymentsController,
} from '@paypal/paypal-server-sdk';
import { paypalClientID, paypalSecret } from '../config/env.js';

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: paypalClientID,
    oAuthClientSecret: paypalSecret,
  },
  timeout: 0,
  environment: Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: {
      logBody: true,
    },
    logResponse: {
      logHeaders: true,
    },
  },
});

const ordersController = new OrdersController(client);
const paymentsController = new PaymentsController(client);

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
export const createCheckoutOrder = async (cart, shippingAddress) => {
  const payload = {
    body: {
      intent: 'CAPTURE',
      payment_source: {
        paypal: {
          experience_context: {
            shipping_preference: 'SET_PROVIDED_ADDRESS',
            user_action: 'PAY_NOW',
            return_url: 'https://example.com/return',
            cancel_url: 'https://example.com/cancel',
          },
        },
      },
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'USD',
            value: cart.totalPrice.toFixed(2),
            breakdown: {
              item_total: {
                currencyCode: 'USD',
                value: cart.totalPrice.toFixed(2),
              },
              shipping: {
                currencyCode: 'USD',
                value: '0.00',
              },
            },
          },
          shipping: {
            type: 'SHIPPING',
            name: {
              full_name: shippingAddress.name,
            },
            email_address: shippingAddress.email,
            phone_number: {
              country_code: '1',
              national_number: shippingAddress.phone,
            },
            address: {
              addressLine1: shippingAddress.address,
              adminArea2: shippingAddress.city,
              adminArea1: shippingAddress.state,
              postalCode: shippingAddress.zip,
              countryCode: shippingAddress.country,
            },
          },
        },
      ],
    },
    prefer: 'return=minimal',
  };

  console.log(
    'Payload being sent to PayPal API:',
    JSON.stringify(payload, null, 2)
  );

  try {
    const { body, ...httpResponse } = await ordersController.ordersCreate(
      payload
    );
    console.log('Response from PayPal API:', JSON.parse(body));
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    console.error('Error creating order with PayPal API:', error);
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
  }
};

export const createAccelOrder = async cart => {
  const payload = {
    body: {
      intent: 'CAPTURE',
      payment_source: {
        paypal: {
          experience_context: {
            shipping_preference: 'GET_FROM_FILE',
            user_action: 'PAY_NOW',
            return_url: 'https://example.com/return',
            cancel_url: 'https://example.com/cancel',
          },
        },
      },
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'USD',
            value: cart.totalPrice.toFixed(2),
            breakdown: {
              item_total: {
                currencyCode: 'USD',
                value: cart.totalPrice.toFixed(2),
              },
              shipping: {
                currencyCode: 'USD',
                value: '0.00',
              },
            },
          },
          shipping: {
            options: [
              {
                id: '1',
                amount: {
                  currencyCode: 'USD',
                  value: '0.00',
                },
                type: 'SHIPPING',
                label: 'Free Shipping',
                selected: true,
              },
              {
                id: '2',
                amount: {
                  currencyCode: 'USD',
                  value: '10.00',
                },
                type: 'SHIPPING',
                label: 'Express Shipping',
                selected: false,
              },
            ],
          },
        },
      ],
    },
    prefer: 'return=minimal',
  };
  console.log(
    'Payload being sent to PayPal API:',
    JSON.stringify(payload, null, 2)
  );
  try {
    const { body, ...httpResponse } = await ordersController.ordersCreate(
      payload
    );
    console.log('Response from PayPal API:', JSON.parse(body));
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    console.error('Error creating order with PayPal API:', error);
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
  }
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
export const captureOrder = async orderID => {
  const payload = {
    id: orderID,
    prefer: 'return=minimal',
  };

  try {
    const { body, ...httpResponse } = await ordersController.ordersCapture(
      payload
    );
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
  }
};

/**
 * Authorize payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_authorize
 */
export const authorizeOrder = async orderID => {
  const payload = {
    id: orderID,
    prefer: 'return=minimal',
  };

  try {
    const { body, ...httpResponse } = await ordersController.ordersAuthorize(
      payload
    );
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
  }
};

/**
 * Captures an authorized payment, by ID.
 * @see https://developer.paypal.com/docs/api/payments/v2/#authorizations_capture
 */
export const captureAuthorize = async authorizationId => {
  const payload = {
    authorizationId: authorizationId,
    prefer: 'return=minimal',
    body: {
      finalCapture: false,
    },
  };

  try {
    const { body, ...httpResponse } =
      await paymentsController.authorizationsCapture(payload);
    return {
      jsonResponse: JSON.parse(body),
      httpStatusCode: httpResponse.statusCode,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(error.message);
    }
  }
};
