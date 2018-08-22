const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');

const PORT = process.env.PORT || 5000;

// Currently config is empty, so use default private testing key
const config = require('./config.json');
const stripe = require('stripe')(config.secret_key);
// TODO use this in detecting valid webhook POSTS.
const endpoint_secret = config.endpoint_secret;

express().use(express.static(path.join(__dirname, 'public')))
  .use(bodyparser.json())
  .use(bodyparser.urlencoded({extended: true}))
  .post('/process_payment', (req, resp) => {
    //console.log("POST form body? ", req.body);

    if(req.body.singlePayment === true){
     // console.log("FOUND SINGLE PAYMENT!"); 

      stripe.charges.create({
        amount: 299700,
        currency: 'usd',
        description: 'test single charge',
        source: req.body.stripeToken 
      }).then(charge => {
        console.log("Charge object returned? ", charge); 
        //resp.status(200).json({});
        resp.status(200).end();
      }).catch(cerr => console.log('charge error: ', cerr));
    }
    else {
//      console.log("FOUND SUBSCRIPTION");
      stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
      }).then(customer => {
        stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            plan: 'plan_DSVe2YxyuNPNTF'
          }],
          metadata: {
            installments_paid: 0 
          }
        }).then(sub => {
          //console.log("subscription? ", sub); 
          //resp.status(200).json({});
          resp.status(200).end();
        }).catch( serr => console.log('sub error: ', serr));
      }).catch(err => console.log('customer error: ', err));
    }
    //resp.send('');  // just gives blank page
    //return resp.status(200);
    //return resp.status(200);
    //resp.redirect('back');  // just redirects to get...
    //resp.end();  // just gives blank page
  }).post('/handle_webhook', (req, resp) => {
    console.log("/handle_webhook talking.");
    let signature = req.headers['stripe-signature'];
    console.log("signature retrieved from webhook? ", signature);
    console.log("event in body? ", req.body);
    console.log("do we need promises? ", stripe.webhooks.constructEvent(JSON.stringify(req.body), signature, endpoint_secret));
      stripe.webhooks.constructEvent(req.body, signature, endpoint_secret).then(event => { 
        console.log("event generated? ", event);
        console.log("event type? ", event.type);
        if(event.type === 'invoice.payment_succeeded'){
          // increment payments count
          // 1. get subscription line item
          console.log("going to incr... can see event.data.object.lines.data? ", event.data.object.lines.data);

          // 2. get metadata value
          let sub = event.data.object.lines.data[0];
          console.log("going to incr...can see metadata? ", sub.metadata);
          if(sub.metadata.installments_paid){
            // Get count
            let count = parseInt(sub.metadata.installments_paid);
            console.log("parsed count? ", count);
            count++;

            stripe.subscriptions.retrieve(sub.id).then( subscription => {
              console.log("subscription retrieved from stripe.subscriptions? ", subscription);
              subscription.metadata.installments_paid = count;
              subscription.save();

              if(count >= 2){
                subscription.delete();
              }
              resp.status(200);
            }).catch(serr => console.log('sub error: ', serr));
          }
        }
      }).catch(everr => console.log("EVent error: ", everr));

    //resp.json({received: true});
  }).listen(PORT, () => console.log(`Listening on port ${PORT}...`));
