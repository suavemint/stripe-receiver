const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

express().use(express.static(path.join(__dirname, 'public')))
  .get('/', (req, resp) => {
    resp.json({'hi': 'there'});
  }).listen(PORT, () => console.log(`Listening on port ${PORT}...`));
