const express = require('express');
const router = express.Router();
const rp = require('request-promise');


const readJson = require('r-json');
const Logger = require('bug-killer');
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

}

function doError(error, res) {
    getErrorGif().then((errorImageUrl) => {
        res.render('do_things');
    }).catch((err) => {
        Logger.log('Error getting gif: ' + err, 'error');
        res.render('error', {
            error

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
    Logger.log('Trying to get the token using the following code: ' + req.query.code);
    getToken(req.query.code)
        .then((tokens) => {
            Logger.log('Got the tokens.' + createJsonString(tokens));
            oAuth2Client.setCredentials(tokens);
            //sampleClient.isAuthenticated = true;
            res.render('close_window');
        })
        .catch((err) => {
            Logger.log('oauth error' + err);
            doError(err, res)
        });
});
function getDupIds(items){
    return _.chain(items)
                    .map((item) => {
                        return {
                            id: item.id,
                            videoId: item.snippet.resourceId.videoId
                        }
                    })
                    .groupBy((x) => {
                        return x.videoId
                    })
                    .filter((x) => {
                        return x.length > 1
                    })
                    .flatten()
                    .map((x) => {
                        return x.id
                    })
                    .value()
}
router.get('/remove_dups', function(req, res, next) {

    playlistItems({
            part: 'snippet',
            playlistId: 'PL64D0E5AFD257405A',
            maxResults: 50
        })
        .then((response) => {

            function agAg(resp) {
                // get videos not already in the playlist
                const dupIds = getDupIds(resp.items)
                if (dupIds.length == 0 && !resp.nextPageToken) {
                    return
                }
                Logger.log("deleted this many items out of: " + dupIds.length + " / " + resp.items.length)
                p.some(dupIds.map((id) => {
                        return deletePlaylistItem({
                            id
                        })
                    }), parseInt(dupIds.length * 0.50))
                    .then(() => {
                        const options = {
                            part: 'snippet',
                            playlistId: 'PL64D0E5AFD257405A',
                            maxResults: 50
                        }
                        const nextPageToken = resp.nextPageToken;
                        if(nextPageToken && dupIds.length==0){
                            options.pageToken=nextPageToken
                        }
                        return playlistItems(options)
                    })
                    .then((resp) => {
                        agAg(resp)
                    })
                    .catch((err) => {
                        Logger.log('delete playlist item error 11: ' + err);
                        doError(err, res)
                    });
            }
            agAg(response)
        })
        .catch((err) => {
            Logger.log('delete playlist item error' + err);
            doError(err, res)
        });

})
router.post('/make_playlist', function(req, res, next) {
    readFile('../searchResults.json', 'utf-8')
        .then((data) => {
            function againAgain(d2) {
                if (!d2 || d2.length < 1) {
                    return
                }

                const insertPromises = d2.map((datum) => {
                    const details = {
                        videoId: datum.videoId,
                        kind: 'youtube#video'
                    }
                    return insertPlaylistItem({
                        part: 'snippet',
                        resource: {
                            snippet: {
                                playlistId: 'PL64D0E5AFD257405A',
                                resourceId: details
                            }
                        }
                    })
                })

                p.some(insertPromises, parseInt(insertPromises.length * 0.95))
                    .then(() => {
                        Logger.log('number of video insert attempts: ' + d2.length)
                        return playlistItems({
                            part: 'snippet',
                            playlistId: 'PL64D0E5AFD257405A',
                            maxResults: 50
                        })
                    })
                    .then((response) => {
                        const playlistVideoIds = response.items.map((item) => {
                                return item.snippet.resourceId.videoId
                            })
                            // get videos not already in the playlist
                        const d3 = d2.filter((x) => {
                            return !playlistVideoIds.includes(x.videoId);
                        })
                        againAgain(d3)
                    }).catch((error) => {
                        Logger.log('video insert: ' + error, 'error')
                    })
            }

            againAgain(JSON.parse(data))
                // data = JSON.parse(data)

            //Logger.log('search data: ' + createJsonString(data), 'info');
            res.render('do_things', {
                title: 'Let\'s do things!',
                data
            });
        })
        .catch((error) => {
            doError(error, res)
        });






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
    //                         Logger.log('saved file: ' + query)
    //                     })
    //                 return result
    //             });


    //         })
    //         .catch((error) => {
    //             Logger.log('Search: " + options.q + "\n' + error, 'error')
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
    //                     Logger.log('Inserted: " + datum.query +"\n\t' + datum.title)
    //                 })
    //                 .catch((error) => {
    //                     Logger.log('Insert: ' + error, 'error')
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
router.get('/', function(req, res, next) {
    res.render('index2', {
        title: 'Express',
        html: {}
    })
});



module.exports = router;
