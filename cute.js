'use strict';

const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const _ = require('lodash');

const app = express();

let message;
let searchTerm;

function _loadJSON(res) {
    request({
        url: process.env.DATA_SOURCE,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            // cute = body;
            // 3. let's parse the JSON
            _parseData(body, res);
        }
    });
}

function _parseData(json, res) {

    // console.log('_parseData', searchTerm);
    let url;
    let message;

    //NV: Set synonyms
    let dogTerm = ['doggy','doggie','puppy','pupper','pup','pooch','poochie','hound','mutt','woof','canine','dawg','doglet','doggo','doggos','douglet'];
    let puppyTerm = ['puppy','pup','puppers','puppies','pupper','pups'];
    let catTerm = ['cat','kitten','kitteh','kittycat','kitty cat','kitty','cat','pussy','puss'];
    let kittyTerm = ['kitten','kitteh','kittycat','kitty cat'];
    let kittenTerm = ['kitty','kitteh','kittycat','kitty cat'];
    let rabbitTerm = ['rabbit','bunny','bunneh','bunnies','bunny rabbit','bun'];
    let bunnyTerm = ['bunny','bunneh','bunnies','bunny rabbit','bun'];
    let randomTerm = ['random','rando','cute','any','anything','something','fun','aww','awww','awwww','animal','picture','gif','stuff','creature','something','whatever','thing','cutie',':nothing-to-find:'];

    const foundData = json.filter(function(data) {
        if (dogTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('dog');
        }
        if (puppyTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('puppy');
        }
        if (catTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('cat');
        }
        if (kittyTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('kitty');
        }
        if (kittenTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('kitten');
        }
        if (rabbitTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('rabbit');
        }
        if (bunnyTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes('bunny');
        }
        if (randomTerm.indexOf(searchTerm) >= 0) {
            return data.tags && data.tags.includes(searchTerm);
        }
        else {
            return data.tags && data.tags.includes(searchTerm);
        }
    });

    // console.log('foundData', foundData, foundData.length);

    let data;
    if (foundData.length) {
        // If the search was a success, just show the gif.

        data = _.sample(foundData);
        console.log('[QUERY] FOUND |', searchTerm );
    } else {
        // random, since we didn't find what we were looking for
        // but, first we need to decide which case we are ... no searchTerm or just not found?

        // let notFoundMessage = ":upside_down_face: We couldn't find anything for *'" + searchTerm + "'*. Here's a cute rando!";
        // message = searchTerm == randomTerm ? randoMessage : notFoundMessage;

        //NV: I know there's a better way to do this.

        if (randomTerm.indexOf(searchTerm) >= 0) {
            //NV: If the NOT_FOUND is a randomTerm, just give a random gif. Otherwise, throw out an error message
            message = "";
            data = _.sample(json);
            console.log('[QUERY] NOT_FOUND |', searchTerm );
        } else {
            //NV: If the NOT_FOUND is a true not found, give a puppy gif and error message
            message = "That doesn't sound very cute. Here's a puppy:";
            const foundData = json.filter(function(data) {
                return data.tags && data.tags.includes('puppy');
            });
            data = _.sample(foundData);
            console.log('[QUERY] NOT_FOUND |', searchTerm );
        }
    }

    url = data.url;

    console.log('url', url);

    var response = {
        "as_user": true,
        "response_type": "in_channel",
        "attachments": [
            {
                "text": message,
                "image_url": url,
                "mrkdwn_in": ["text"]
            }
        ]
    }
    res.json(response);
}

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/slack-auth', function(req, res) {
    let data = {form: {
        client_id: '2151820749.106669571431',
        client_secret: 'b8e20b5ad727f0be79e8d036f548e84e',
        code: req.query.code
    }};

    request.post('https://slack.com/api/oauth.access', data, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // You are done.
            // sk: redirect to a cute gif or a thank you?
            res.redirect('https://67.media.tumblr.com/23f9f2f6d0875c0cee7dc030bf669cd9/tumblr_nhx3ayoCBZ1u4nbmvo1_500.gif');

            // sk: if we want to do this, we need to adjust the code in the Add to Slack button to include `team%3Aread` in the scope
            // `scope=commands+team%3Aread`

            // If you want to get team info, you need to get the token here
            // let token = JSON.parse(body).access_token; // Auth token

            // Get the team domain name to redirect to the team URL after auth
            // request.post('https://slack.com/api/team.info', {form: {token: token}}, function (error, response, body) {
            //     if (!error && response.statusCode == 200) {
            //         if(JSON.parse(body).error == 'missing_scope') {
            //             res.send('Phteven has been added to your team!');
            //         } else {
            //             let team = JSON.parse(body).team.domain;
            //             res.redirect('http://' +team+ '.slack.com');
            //         }
            //     }
            // });
        }
    });
});

app.post('/', function(req, res) {
    if (!req.body) {
        return res.sendStatus(400);
    }

    if (req.body.token == 'aTcXXq7tIwSGZXMzQgmOaN7z') {

        // 1. do we have a searchTerm?
        if (req.body.text) {
            searchTerm = req.body.text.toLowerCase();
            console.log( "searchTerm", searchTerm );
        } else {
            console.log("random (since there is no searchTerm)");
            searchTerm = ':nothing-to-find:';
        }

        // 2. let's get some data (need to pass along the response)
        _loadJSON(res);
    }
});


app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

