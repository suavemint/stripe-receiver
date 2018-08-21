const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');

const PORT = process.env.PORT || 5000;

// Currently config is empty, so use default private testing key
const config = require('./config.json');
const stripe = require('stripe')(config.secret_key || 'sk_test_BQokikJOvBiI2HlWgH4olfQ2');

express().use(express.static(path.join(__dirname, 'public')))
  .use(bodyparser.json())
  .use(bodyparser.urlencoded({extended: true}))
  .get('/', (req, resp) => {
    resp.json({'hi': 'there'});
  }).post('/process_payment', (req, resp) => {
    console.log("POST form body? ", req.body);

    if(req.body.singlePayment === true){
      console.log("FOUND SINGLE PAYMENT!"); 

      stripe.charges.create({
        amount: 299700,
        currency: 'usd',
        description: 'test single charge',
        source: req.body.stripeToken 
      }).then(function(charge){
        console.log("Charge object returned? ", charge); 
      }).catch(cerr => console.log('charge error: ', cerr));
    }
    else {
      console.log("FOUND SUBSCRIPTION");
      stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
      }).then(function(customer){
        stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {plan: 'plan_DSVe2YxyuNPNTF'}
          ]
        }).then(function(sub){
          console.log("subscription? ", sub); 
          //resp.status(200);
        }).catch( serr => console.log('sub error: ', serr));
      }).catch(err => console.log('customer error: ', err));
    }
    //return resp.status(200);
    resp.redirect('back');
  }).listen(PORT, () => console.log(`Listening on port ${PORT}...`));
