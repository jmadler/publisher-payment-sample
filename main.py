import hashlib, logging
from flask import Flask, request, render_template, flash, redirect, url_for, session
from google.appengine.ext import ndb
app = Flask(__name__)
app.secret_key = 'UfHeANzSknQ4Nv7aTpOR'
# XXX add SL
# XXX refactor
# XXX add comments throughout
# XXX lint
# XXX security

@app.route('/register', methods=['POST', 'GET'])
def register():
  if request.method == 'POST': 
    # is username taken?
    if not request.form.get('username'):
      # note that the MultiDict that flask uses in request.form could have multiple values for the asme key.  we get just the first one.
      # here we prevent issues by only having one on the client-side, and noting that potenitally mialicious mlformed requests could include multiple values
      flash('no username provided')
      return render_template('register.html')
    if get_user(request.form.get('username')):
      flash('username already taken')
      return render_template('register.html')
    else:
      if request.form.get('password') != request.form.get('password-confirm'):
        flash('passwords do not match')
        return
      user = User()
      setattr(user, 'username', request.form.get('username'))
      setattr(user, 'password', hashlib.sha512((request.form.get('password'))).hexdigest())
      setattr(user, 'email', request.form.get('email'))
      user.key = ndb.Key(User, user.username)
      user.put()
      flash('succesfully registered')
      return render_template('subscribe.html')
  else:
    return render_template('register.html')

@app.route('/login', methods=['POST', 'GET'])
def login():
  returnto = request.values.get('returnto') or 'index'
  if request.method == 'POST': 
    if request.form.get('username'):
      logging.warn( request.form.get('username') )
      user = get_user(request.form.get('username'))
      if not user:
        flash('user does not exist')
        return render_template('login.html')
      if not request.form.get('password'):
        flash('password required')
        return render_template('login.html')
    else:
        flash('username required')
        return render_template('login.html')
    if hashlib.sha512((request.form.get('password'))).hexdigest() == user.password:
      flash('successfully logged-in')
      session['username'] = user.username
      return redirect(url_for(returnto)) 
    else:
      flash('Unable to login')
      return render_template('login.html')
  else:
    return render_template('login.html', returnto=returnto)

@app.route('/subscribe', methods=['POST', 'GET'])
def subscribe():
  if not session.get('username'):
    flash('not logged in')
    return redirect(url_for('login', returnto='subscribe'))
  user = get_user(session.get('username'))
  if user.is_subscribed == True:
    flash('You are already subscribed! :)')
    return redirect(url_for("index"))
  if request.method == 'POST': 
    if request.form.get('form') == 'productForm':
        return render_template('subscribe.html', showForm=True)
    else: 
      if process_payment(user):
        data = request.form
        # we do not validate data
        billing_addr = Address()
        billing_addr.name = data.get('billing-name')
        billing_addr.addr1 = data.get('billing-addr1')
        billing_addr.addr2 = data.get('billing-addr2')
        billing_addr.city = data.get('billing-city')
        billing_addr.state = data.get('billing-state')
        billing_addr.zip = data.get('billing-zip')
        billing_addr.phone = data.get('billing-phone')
        billing_info = BillingInfo()
        billing_info.addr = billing_addr
        billing_info.csc = int(data.get('billing-csc'))
        billing_info.name = data.get('billing-name')
        billing_info.exp = data.get('billing-exp')
        billing_info.cardnumber = data.get('billing-cardnumber')
        user.billing_info = billing_info
        shipping_addr = Address()
        shipping_addr.name = data.get('shipping-name')
        shipping_addr.addr1 = data.get('shipping-addr1')
        shipping_addr.addr2 = data.get('shipping-addr2')
        shipping_addr.city = data.get('shipping-city')
        shipping_addr.state = data.get('shipping-state')
        shipping_addr.zip = data.get('shipping-zip')
        shipping_addr.phone = data.get('shipping-phone')
        user.shipping_addr = shipping_addr
        user.is_subscribed = True
        user.put()
        flash('succesfully subscribed')
        return render_template('subscribe.html')
      else:
        flash('could not process payment :(')
        return render_template('subscribe.html')
  else:
    return render_template('subscribe.html')

@app.route('/logout')
def logout():
  # delete the session
  session.clear()
  return redirect(url_for("index"))

@app.route('/')
def index():
  return render_template('index.html');

@app.route('/favicon.ico')
def favicon():
  return app.send_static_file('/static/favicon.ico')

@app.route('/<pagename>')
def view_page(pagename):
  return render_template('page/' + pagename)

@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404

@app.errorhandler(500)
def application_error(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500

def credential_match():
  return False

def get_user(username):
  user = ndb.Key(User, username).get()
  if user:
    return user
  else:
    return False

def process_payment(user):
  # no-op.
  return True

class Address(ndb.Model):
  name = ndb.StringProperty()
  addr1 = ndb.StringProperty()
  addr2 = ndb.StringProperty()
  city = ndb.StringProperty()
  state = ndb.StringProperty()
  zip = ndb.StringProperty()
  phone = ndb.StringProperty()

class BillingInfo(ndb.Model):
  name = ndb.StringProperty()
  csc = ndb.IntegerProperty()
  exp = ndb.StringProperty()
  cardnumber = ndb.StringProperty()
  addr = ndb.LocalStructuredProperty(Address)

class User(ndb.Model): 
  username = ndb.StringProperty()
  password = ndb.StringProperty()
  email = ndb.StringProperty()
  billing_info = ndb.LocalStructuredProperty(BillingInfo)
  shipping_addr = ndb.LocalStructuredProperty(Address)
  is_subscribed = ndb.BooleanProperty()

