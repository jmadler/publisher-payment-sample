function toBackendFormat(instrumentResponse) {
  
  /*
  
  I need to go from this:
  
          {
            details: {
              billingAddress: {}
              cardNumber
              cardSecuritycode
              cardholderName
              expiryMonth
              expiryYear
            }
            methodName: 'visa',
            payerEmail: 'xxx@google.com',
            payerPhone: '(646) 493-4493',
            shippingAddress: {
              addressLine: [
                0: "1600 Amphitheatre Pkwy"
              ],
              careOf: ""
              city: "Mountain View"
              country: "US"
              dependentLocality: ""
              languageCode: "en"
              organization: "Google"
              phone: '(646) 493-4493'
              postalCode: "94043"
              recipient: "Work"
              region: "CA"
              sortingCode: ""
            },
            shippingOption: 'freeUSShipping'
          }
  
  to this:
  
        <div><label for="billing-name">Name</label> 
        <div><label for="billing-cardnumber">Credit Card Number</label>
        <div><label for="billing-csc">Card Security Code</label>
        <div><label for="billing-exp">Expiry Month/Year</label> 
        <div><label for="billing-method">Expiry Month/Year</label>
        <div><label for="billing-addr1">Street Address (Line 1)</label>
        <div><label for="billing-addr2">Street Address (Line 2)</label>
        <div><label for="billing-city">City</label>
        <div><label for="billing-state">State</label>
        <div><label for="billing-zip">Zip Code</label>
        <div><label for="billing-phone">Phone Number</label> 
        <div><label for="shipping-name">First Name</label>
        <div><label for="shipping-addr1">Street Address (Line 1)</label>
        <div><label for="shipping-addr2">Street Address (Line 2)</label>
        <div><label for="shipping-city">City</label>
        <div><label for="shipping-state">State</label>
        <div><label for="shipping-zip">Zip Code</label> 
        <div><label for="shipping-phone">Phone Number</label>
  
  */

  return data;
  
}
if (window.PaymentRequest) {
  console.log('register clicked');
  var supportedInstruments = [{
    supportedMethods: ['amex', 'diners', 'discover', 'jcb', 'mastercard', 'unionpay', 'visa']
  }];
  var details = {
    total: { label: 'Monthly Subscription', amount: {currency: 'USD', value: '65.00'} },
    displayItems: [
      {
        label: 'Monthly subscription',
        amount: {currency: 'USD', value: '65.00'},
      },
    ],
    shippingOptions: [{
      id: 'freeUSShipping',
      label: 'Free shipping across the US',
      amount: {currency: 'USD', value: '0.00'},
      selected: true,
    }]
  };
  var options = {
    requestShipping: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
  };
  try {
    new PaymentRequest(supportedInstruments, details, options)
       .show()
       .then(function(instrumentResponse) {
          var data = new FormData(document.getElementById('registerForm'));
          data.set('billing-name', instrumentResponse.details.cardholderName);
          data.set('billing-cardnumber', instrumentResponse.details.cardNumber);
          data.set('billing-exp', instrumentResponse.details.expiryMonth + '/' + instrumentResponse.details.expiryYear);
          data.set('billing-csc', instrumentResponse.details.cardSecurityCode);
          data.set('billing-method', instrumentResponse.methodName);

          data.set('billing-addr1', instrumentResponse.details.billingAddress.addressLine[0])
          data.set('billing-addr2', instrumentResponse.details.billingAddress.addressLine[1])
          data.set('billing-state', instrumentResponse.details.billingAddress.region)
          data.set('billing-city', instrumentResponse.details.billingAddress.city)
          data.set('billing-state', instrumentResponse.details.billingAddress.region)
          data.set('billing-zip', instrumentResponse.details.billingAddress.postalCode)
          data.set('billing-phone', instrumentResponse.details.billingAddress.shippingPhone)

          data.set('shipping-name', instrumentResponse.details.cardholderName)
          data.set('shipping-addr1', instrumentResponse.shippingAddress.addressLine[0])
          data.set('shipping-addr2', instrumentResponse.shippingAddress.addressLine[1])
          data.set('shipping-state', instrumentResponse.shippingAddress.region)
          data.set('shipping-city', instrumentResponse.shippingAddress.city)
          data.set('shipping-state', instrumentResponse.shippingAddress.region)
          data.set('shipping-zip', instrumentResponse.shippingAddress.postalCode)
          data.set('shipping-phone', instrumentResponse.shippingAddress.shippingPhone)
  
          // Are there any client-side form validations that we might be circumventing here?

          console.log(instrumentResponse);
          for (var i of data.entries()) {
            console.log(i[0] + ': ' + i[1]);
          }
          return fetch('/pay', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            body: data
          }).then( res => {
            if (res.status === 200 ) {
              instrumentResponse.complete("success");
              window.location.reload();
            } else {
              instrumentResponse.complete("fail");
              throw 'Payment Error';
            }
         }).catch(function(err) {
            console.log(err);
         });
       });
  } catch(err) {
    console.log(err);
  }
}
