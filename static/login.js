/** @TODO document me
 *
 */

function display_form(e) {
  // If we don't have the, let's instantiate a modal dialog for the
  // login flow.  The form is alreacy on-page as the hidden
  // "loginForm", so we just need to create a modal and bring into
  // view.
  var backgroundId = e.target.getAttribute('_toggle');
  var dialogBackground = document.getElementById(backgroundId);
  dialogBackground.style.display = 'block';
  window.onclick = function(event) {
    if (event.target == dialogBackground) {
      dialogBackground.style.display = 'none';
    }
  }
}

/** @TODO document me
 *
 */
function add_msg (msg) {
  var messageContainer = document.getElementById('messages');
  var messageElement = document.createElement('div');
  messageElement.className = 'flash';
  messageElement.innerHTML = msg;
  messageContainer.appendChild(messageElement);
}


/** @TODO document me
 *
 */

function submit_register (e) {
  // prevent the browser from submitting the form
  e.preventDefault();
  var registerForm = document.getElementById('registerForm');
  // try to register over the API
//  debugger;
  var registerFormData = new FormData(registerForm)
  return fetch('/register?type=json', {
    method: 'POST',
    body: registerFormData
  }).then(function(response) {
    response.json().then(function(json) {
      if (json.success) {
        // We're registered!  let's save the new creds
        var credentials = new PasswordCredential(registerForm);
        navigator.credentials.store(credentials);
        add_msg('Successfully registered and logged in');
        // Let's redirect to the subscription page. XXX
//        document.location = '/'; // XXX we should probably just update the tooltip
      } else {
        // It wasn't successful, so let's flash the messages
        json.messages.map(add_msg)
        // require user mediation so we don't auto-login with bad creds
        navigator.credentials.requireUserMediation();
        // and display the form in the future
        document.getElementById('loginButton').addEventListener('click', display_form);
      }
    });
  });
}

/** @TODO document me
 *
 */

function handle_logout () {
  // call the backend to clear the session and delete the cookie
  fetch('/logout', { method: 'GET', credentials: 'include', }).then(function() {
    // prevent auto-login
    debugger;
    if (navigator.credentials) {
      navigator.credentials.requireUserMediation();
    }
    // redirect to the index
    document.location = '/';
  });
}

/** @TODO document me
 *
 */

function handle_login (credentials) {
  if (!credentials) {
    // XXX
    return;
    debugger
  }
  var form = new FormData(document.getElementById('loginForm'));
  credentials.additionalData = form;
  // XXX CSRF stuff
  //debugger
  return fetch('/login?type=json', {
    method: 'POST',
    credentials: credentials
  }).then(function(response) {
    // If the response is good, we should update the UI and let the user know we've automatically logged them in.
    // Let's let the user know 
    // If the creds are bad, let's pass through to the login form so they can resolve any issues
    response.json().then(function(json) {
      if (json.success) {
        // Woohoo!  We're logged in.  
        if (document.location.pathname.match(/^\/page\//)) {
          // If it's a content page, let's update the tooltip. XXX 
          location.reload();
        } else {
          // Otherwise, let's redirect to the index page.
          document.location = '/';
        }
      } else {
        // It wasn't successful, so let's flash the messages
        json.messages.map(add_msg)
        // require user mediation so we don't auto-login with bad creds
        navigator.credentials.requireUserMediation();
        // and display the form in the future
        document.getElementById('loginButton').addEventListener('click', display_form);
      }
    });
  });
}

function subscribe (e) {
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
          return fetch('/subscribe?type=json', {
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

if (document.getElementById('logoutButton')) {
  document.getElementById('logoutButton').addEventListener('click', handle_logout);
} else if (document.getElementById('loginButton')) {
  if (navigator.credentials) {
    navigator.credentials.get({password: true, unmediated: true}).then(handle_login);
    document.getElementById('loginButton').addEventListener('click', 
      function() { 
        navigator.credentials.get({password: true}).then(handle_login) 
      }, 
      {once: true}
    );
  } else {
    document.getElementById('loginButton').addEventListener('click', display_form);
  }
}

if (document.getElementById('registerButton')) {
  if (navigator.credentials) {
    // If we have the Credential Management API, let's handle registration over
    // an API instead.  This will allow us to automatically save the
    // credentials for sucessful registrations
    document.getElementById('registerForm').addEventListener('submit', submit_register);
  }
  document.getElementById('registerButton').addEventListener('click', display_form);
}

if (document.getElementById('subscribeButton')) {
  if (window.PaymentRequest) {
    // If we have the Web Payments API, let's handle payments over
    // an API instead.  This will allow us to access forms of payment local to
    // the device.
    document.getElementById('subscribeButton').addEventListener('click', subscribe);
  } else {
    document.getElementById('subscribeButton').addEventListener('click', display_form);
  }
}


