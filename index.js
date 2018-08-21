const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
// Currently config is empty, so use default private testing key
const config = require('./config.json');
const stripe = require('stripe')(config.secret_key || 'sk_test_BQokikJOvBiI2HlWgH4olfQ2');

express().use(express.static(path.join(__dirname, 'public')))
  .get('/', (req, resp) => {
    resp.json({'hi': 'there'});
  }).post('/process_single_payment', (req, resp) => {
    console.log("POST processed?, " resp.body);

    const charge = stripe.charges.create({
      amount: parseFloat(resp.body.amount);
      currency: 'usd',
      description: 'Testing single charge',
      source: resp.body.stripeToken
    });

  }).post('/process_subscription_payment', (req, resp) => {
    // For a subscription, create a Stripe Customer instance before creating a Subscription instance.
    console.log("POST form body? ", resp.body);
    const customer = stripe.customer.create({
      email: resp.body.stripeEmail,
      source: resp.body.stripeToken
    });
/*
    const plan = stripe.plans.create({
      product: 'prod_DSJtPFPvfe9EPD',
      nickname: 'Test Sub #1',
      currency: 'usd',
      interval: 'month',
      amount: 10000
    });
    */
    
    const subscription = stripe.subscription.create({
      customer: customer.id,
      items: {plan: 'prod_DS9nvwutZuzrce'}
    });
  }).listen(PORT, () => console.log(`Listening on port ${PORT}...`));
