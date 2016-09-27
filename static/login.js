function display_form() {
  // If we don't have the, let's instantiate a modal dialog for the
  // login flow.  The form is alreacy on-page as the hidden
  // "loginForm", so we just need to create a modal and bring into
  // view.
  var loginDialogBackground = document.getElementById('loginDialogBackground');
  loginDialogBackground.style.display = 'block';
  window.onclick = function(event) {
    if (event.target == loginDialogBackground) {
      loginDialogBackground.style.display = 'none';
    }
  }
}
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
        // XXX
      } else {
        // It wasn't successful, so let's flash the messages
        var messageContainer = document.getElementById('messages');
        json.messages.map(function(message) {
          var msg = document.createElement('div');
          msg.className = 'flash';
          msg.innerHTML = message;
          messageContainer.appendChild(msg);
        });
        // and display the form in the future
        document.getElementById('loginButton').addEventListener('click', display_form);
      }
    });
  });
}

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
