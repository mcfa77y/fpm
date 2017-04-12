const express = require('express');
const router = express.Router();
const rp = require('request-promise');


const readJson = require("r-json");
const Logger = require("bug-killer");
const p = require('bluebird');
const _ = require('underscore');
const google = require('googleapis');
//var sampleClient = require('../sampleclient');
var util = require('util');


const CREDENTIALS = readJson(`${__dirname}/../credentials.json`);
var OAuth2 = google.auth.OAuth2;

const oAuth2Client = new OAuth2(
    CREDENTIALS.web.client_id,
    CREDENTIALS.web.client_secret,
    CREDENTIALS.web.redirect_uris[0]
);

// initialize the Youtube API library
const youtube = google.youtube({
    version: 'v3',
    auth: oAuth2Client
});

// PROMISIFY
const search = p.promisify(youtube.search.list)
const playlistItems = p.promisify(youtube.playlistItems.list)
const insertPlaylist = p.promisify(youtube.playlists.insert)
const insertPlaylistItem = p.promisify(youtube.playlistItems.insert)
const deletePlaylistItem = p.promisify(youtube.playlistItems.delete)
const appendFile = p.promisify(require('fs').appendFile)
const readFile = p.promisify(require('fs').readFile)
    // const getToken = p.promisify(sampleClient.oAuth2Client.getToken, {
    //     context: sampleClient.oAuth2Client
    // })


const getToken = p.promisify(oAuth2Client.getToken, {
    context: oAuth2Client
})



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
    return rp(options)
        .then((json) => {
            const randomIndex = _.random(0, json.data.length);
            return json.data[randomIndex].images.original.url;
        })
        .catch((err) => {
            Logger.log('Error getting gif: ' + err, 'error');

        });
}

function doError(error, res) {
    getErrorGif().then((errorImageUrl) => {
        res.render('error', {
            error,
            errorImageUrl
        });
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


/* POST home page. */
router.get('/oauth2callback', function(req, res, next) {
    Logger.log("Trying to get the token using the following code: " + req.query.code);
    getToken(req.query.code)
        .then((tokens) => {
            Logger.log("Got the tokens." + createJsonString(tokens));
            oAuth2Client.setCredentials(tokens);
            //sampleClient.isAuthenticated = true;
            res.render('close_window');
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
    p.props({
        data: getData(),
        playlistVideoIds: getPlayListVideoIds()
    }).then((result)=>{
        
    })

    readFile('../searchResults.json', 'utf-8')
        .then((data) => {
            data = JSON.parse(data)
            while (data.length > 0) {
                data.forEach((datum) => {
                    const details = {
                        videoId: datum.videoId,
                        kind: 'youtube#video'
                    }
                    insertPlaylistItem({
                            part: 'snippet',
                            resource: {
                                snippet: {
                                    playlistId: 'PL64D0E5AFD257405A',
                                    resourceId: details
                                }
                            }
                        })
                        .then((response) => {
                            Logger.log('datum.title: ' + datum.title)
                            Logger.log('datum.query: ' + datum.query)
                            Logger.log('response: ' + createJsonString(response.result))
                        })
                        .catch((error) => {
                            Logger.log("Insert: " + error, 'error')
                            // doError(error, res)
                        })
                })
                data = playlistItems({
                        part: 'snippet',
                        playlistId: 'PL64D0E5AFD257405A',
                        maxResults: 50
                    })
                    .then((response) => {
                        const playlistVideoIds = response.items.map((item) => {
                                return item.resourceId.videoId
                            })
                            // get videos not already in the playlist
                        debugger
                        return data.filter((x) => {
                            return !playlistVideoIds.includes(x.videoId);
                        })

                    })
                    .catch((error) => {
                        Logger.log("get playlist video ids: " + error, 'error')
                        // doError(error, res)
                    })

            }


            //Logger.log('search data: ' + createJsonString(data), 'info');
            res.render('do_things', {
                title: 'Let\'s do things!',
                data
            });
        })
        .catch((error) => {
            doError(error, res)
        });;






    // const searchPromises = req.body.bands.split(req.body.delimiter).map((query) => {
    //     const musicCategory = 10
    //     const options = {
    //         part: 'snippet',
    //         q: query,
    //         maxResults: 1,
    //         type: 'video',
    //         videoCategoryId: musicCategory
    //     };
    //     return search(options)
    //         .then((data) => {

    //             return data.items.map((item) => {

    //                 const snippet = item.snippet
    //                 const date = snippet.publishedAt
    //                 const description = snippet.description
    //                 const thumbnail = snippet.thumbnails.medium.url
    //                 const title = snippet.title
    //                 const videoId = item.id.videoId
    //                 const videoUrl = "https://www.youtube.com/watch?v=" + item.id.videoId
    //                 const result = {
    //                     date,
    //                     description,
    //                     thumbnail,
    //                     title,
    //                     videoId,
    //                     videoUrl,
    //                     query
    //                 }
    //                 // Logger.log('info item: ' + createJsonString(result), 'info')
    //                 appendFile('../searchResults.json', createJsonString(result) + ',', 'utf-8')
    //                     .then(() => {
    //                         Logger.log("saved file: " + query)
    //                     })
    //                 return result
    //             });


    //         })
    //         .catch((error) => {
    //             Logger.log("Search: " + options.q + "\n" + error, 'error')
    //             doError(error, res)
    //         })

    // })
    // p.reduce(searchPromises,
    //         (acc, promises) => {
    //             promises.forEach((p) => acc.push(p))
    //             return acc
    //         }, [])
    //     .then((data) => {

    //         data.forEach((datum) => {
    //             const details = {
    //                 videoId: datum.videoId,
    //                 kind: 'youtube#video'
    //             }
    //             insertPlaylistItem({
    //                     part: 'snippet',
    //                     resource: {
    //                         snippet: {
    //                             playlistId: 'PL64D0E5AFD257405A',
    //                             resourceId: details
    //                         }
    //                     }
    //                 }).then((response) => {
    //                     Logger.log("Inserted: " + datum.query +"\n\t" + datum.title)
    //                 })
    //                 .catch((error) => {
    //                     Logger.log("Insert: " + error, 'error')
    //                     doError(error, res)
    //                 })
    //         })

    //         // Logger.log('search data: ' + createJsonString(data), 'info');
    //         res.render('do_things', {
    //             title: 'Let\'s do things!',
    //             data
    //         });
    //     }).catch((error) => {
    //         doError(error, res)
    //     });


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
router.get('/oAuthUrl', function(req, res, next) {

    const scopes = [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtubepartner',
        'https://www.googleapis.com/auth/youtube.force-ssl'
    ];
    authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes.join(' ')
    });
    res.send(authorizeUrl)

});

/* GET home page. */
router.get('/link', function(req, res, next) {

    const scopes = [
        'https://www.googleapis.com/auth/youtube'
    ];
    authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes.join(' ')
    });
    rp(authorizeUrl).then((arg) => {
        res.render('index', {
            title: 'Express',
            html: arg
        });
    }).catch((error) => {
        Logger.log('Error: ' + error, 'error');
        getErrorGif().then((errorImageUrl) => {
            res.render('error', {
                error,
                errorImageUrl
            });
        });
    });

});


/* GET home page. */
router.get('/', function(req, res, next) {

    res.render('index2', {
        title: 'Express',
        html: {}
    })

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
