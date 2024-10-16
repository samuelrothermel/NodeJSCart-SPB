document.addEventListener('DOMContentLoaded', () => {
  paypal
    .Buttons({
      style: {
        shape: 'rect',
        layout: 'vertical',
        color: 'gold',
        label: 'paypal',
      },
      createOrder: function (data, actions) {
        return fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (orderData) {
            return orderData.id;
          });
      },
      onApprove: function (data, actions) {
        return fetch(`/api/orders/${data.orderID}/capture`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
          }),
        })
          .then(function (res) {
            return res.json();
          })
          .then(function (orderData) {
            alert('Transaction completed');
            window.location.href = '/';
          })
          .catch(function (err) {
            console.error('Error during capture:', err);
            alert('There was an issue with the payment');
          });
      },
    })
    .render('#paypal-button-container');
});
