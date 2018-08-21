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

    stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken
    }).then(function(customer){
      if(req.body.singlePayment){
        console.log("FOUND SINGLE PAYMENT!"); 

        stripe.charges.create({
          amount: 299700,
          currency: 'usd',
          description: 'test single charge',
          source: customer.id 
        }).then(function(charge){
          console.log("Charge object returned? ", charge); 
        });
      }
      else {
        stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {plan: 'plan_DSLCqIDNQcYVc4'}
          ]
        }).then(function(sub){
          console.log("subscription? ", sub); 
          resp.status(200);
        }).catch( serr => console.log('sub error: ', serr));
      }
      console.log("customer has id or token? ", customer); 
    }).catch(err => console.log('c err: ', err));
  }).listen(PORT, () => console.log(`Listening on port ${PORT}...`));
