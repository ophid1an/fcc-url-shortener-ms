var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();
var appUrl = 'https://ophid1an-urlshort.herokuapp.com/';
var dbUrl = process.env.MONGO_URL;

app.set('port', (process.env.PORT || 8000));

app.use(express.static(__dirname + '/public'));



app.get('/:id', function (req, res) {
  mongo.connect(dbUrl, function(err, db) {
    if (err) throw err;
    var collection = db.collection('urls');
    collection.find({
      hash: +req.params.id,
    }).toArray(function(err, data) {
      if (err) throw err;

      if (data[0]) res.redirect(data[0].url);
      else res.json({error: 'Invalid short URL'});

      db.close();
    });
  });

});

app.get('/new/:id*', function (req, res) {
  var originalUrl = '' + req.params.id + req.params[0];
  if (originalUrl.indexOf('.') === -1 ) {
    res.json({
      error: 'Invalid URL'
    });
  }
  else {
    if (req.params.id.toLowerCase() !== 'http:' &&
      req.params.id.toLowerCase() !== 'https:')
        originalUrl = 'http://' + originalUrl;
    var hashedUrl = hash(originalUrl);

    mongo.connect(dbUrl, function(err, db) {
      if (err) throw err;
      var collection = db.collection('urls');
      collection.update({
        hash: +hashedUrl
      }, {
        $set: {
          url: originalUrl
        }, $setOnInsert: {
          hash: +hashedUrl
        }
      }, {
        upsert: true
      }, function(err, data) {
        if (err) throw err;
        db.close();
      });
    });

    res.json({
      original_url: originalUrl,
      short_url: appUrl + hash(originalUrl)
    });
  }


  function hash(str) {
    var hash = 0;
    for (var i=0;i<str.length;i++) {
      hash = (hash + str.charCodeAt(i)%5000) % 5000;
    }
    return hash;
  }

});



app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
