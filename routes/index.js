const express = require('express');
const router = express.Router();
const rp = require('request-promise');


const readJson = require("r-json");
const Logger = require("bug-killer");
const p = require('bluebird');
const _ = require('underscore');
const google = require('googleapis');
var sampleClient = require('../sampleclient');
var util = require('util');

// initialize the Youtube API library
var youtube = google.youtube({
    version: 'v3',
    auth: sampleClient.oAuth2Client
});

const list = p.promisify(youtube.search.list)
const getToken = p.promisify(sampleClient.oAuth2Client.getToken, {
    context: sampleClient.oAuth2Client
})




const CREDENTIALS = readJson(`${__dirname}/../credentials.json`);

function getErrorGif() {
    const options = {
        uri: 'http://api.giphy.com/v1/gifs/search',
        qs: {
            q: 'zoidberg',
            api_key: CREDENTIALS.giphy.api_key

        },
        headers: {
            'User-Agent': 'Request-Promise'
        },
        json: true // Automatically parses the JSON string in the response
    };
    return rp(options).then((json) => {
        const randomIndex = _.random(0, json.data.length);
        return json.data[randomIndex].images.original.url;
    }).
    catch((err) => {
        Logger.log('Error getting gif: ' + err, 'error');

    });
}

function createJsonString(json) {
    let cache = [];
    return JSON.stringify(json, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    }, 4);
}
/* POST home page. */
router.post('/see', function(req, res, next) {
    const data = createJsonString(req.body);
    console.log(data);
    res.render('index', {
        title: 'Express',
        data
    });
});


/* POST home page. */
router.get('/oauth2callback', function(req, res, next) {
    Logger.log("Trying to get the token using the following code: " + req.query.code);
    getToken(req.query.code)
        .then((tokens) => {
            Logger.log("Got the tokens.");
            sampleClient.oAuth2Client.setCredentials(tokens);
            sampleClient.isAuthenticated = true;
            res.redirect('do_things');
        })
        .catch((err) => {
            getErrorGif()
                .then((errorImageUrl) => {
                    res.render('error', {
                        error: err,
                        errorImageUrl
                    });
                });
            Logger.log(err);
        });
});

router.post('/make_playlist', function(req, res, next) {
    let options = {
        part: 'snippet',
        q: 'deadmau5',
        maxResults: 3,
        order: 'rating',
        topicId: '/m/04rlf',
        type: 'video'
    };
    list(options)
        .then((data) => {
            let d2 = data.items.map((item) => {
                Logger.log('info item: '+ createJsonString(item)    ,  'info')
                ({
                    snippet: {title: title},
                    snippet: {publishedAt: date},
                    id: {videoId: videoId},
                    snippet: {description: description},
                    snippet: {thumbnails: {medium: {url: thumbnail}}}
                } = item)
            });

            Logger.log('search data: ' + createJsonString(d2), 'info');
            res.render('do_things', {
                title: 'Let\'s do things!',
                d2
            });
        })
        .catch((error) => {
            Logger.log('Error: ' + error, 'error');
            getErrorGif().then((errorImageUrl) => {
                res.render('error', {
                    error,
                    errorImageUrl
                });
            });
        });
});
// ytsearch(options)
//     .then((data) => {
//         Logger.log('search data: ' + createJsonString(data));
//         res.render('do_things', { title: 'Let\'s do things!', data });
//     })
//     .catch((error) => {
//         Logger.log('Error: ' + error, 'error');
//         getErrorGif().then((errorImageUrl) => {
//             res.render('error', { error, errorImageUrl });
//         });
//     });

router.get('/do_things', function(req, res, next) {

    res.render('do_things', {
        title: 'Let\'s do things!'
    });

});

/* GET home page. */
router.get('/', function(req, res, next) {

    const scopes = [
        'https://www.googleapis.com/auth/youtube'
    ];
    sampleClient.execute(scopes, () => {
        console.log('sampleClient: ' + createJsonString(arguments));
    });

    // let authUrl = oauth.generateAuthUrl({
    //     access_type: "offline",
    //     scope: ["https://www.googleapis.com/auth/youtube"]
    // });
    // rp(authUrl).then((arg) => {
    //     res.render('index', {
    //         title: 'Express',
    //         html: arg
    //     });
    // }).catch((error) => {
    //     res.render('error', {
    //         error
    //     });
    // });
});




module.exports = router;
