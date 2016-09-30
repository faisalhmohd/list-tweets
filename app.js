#! /usr/bin/env node

'use strict'

const Twit = require('twit'),
    fs = require('fs'),
    NodeXls = require('node-xls'),
    async = require('async'),
    commandLineArgs = require('command-line-args'),
    optionDefinitions = [{
        name: 'twitterHandle',
        alias: 't',
        type: String
    }, {
        name: 'directory',
        alias: 'd',
        type: String
    }, {
        name: 'count',
        alias: 'c',
        type: Number
    }],
    options = commandLineArgs(optionDefinitions);

if (!options.twitterHandle) {
    console.log("Please provide a valid Twitter Handle");
    process.exit();
} else if (!options.directory) {
    console.log("Please provide a valid Directory");
    process.exit();
} else if (!options.count) {
    options.count = 20;
}


let T = new Twit({
        consumer_key: '',
        consumer_secret: '',
        access_token: '',
        access_token_secret: ''
    }),
    headings = ["Date", "URL", "Tweet", "ID"],
    content = [],
    tool = new NodeXls(),
    lastID = "",
    params = {
        screen_name: options.twitterHandle,
        contributor_details: false,
        exclude_replies: true
    },
    fetchTweets = (callback) => {
        async.waterfall([
            (cb) => {
                T.get('statuses/user_timeline', params, (err, data, response) => {
                    if (err) {
                        cb("Error at API call");
                    }
                    cb(null, data)
                })
            },
            (tweets, cb) => {
                tweets.forEach((tweet, index, array) => {
                    if (index == array.length - 1) {
                        params.max_id = tweet.id_str;
                        setTimeout(function() {
                            cb(null);
                        }, 1000);
                    } else {
                        content.push({
                            Date: tweet.created_at,
                            URL: "https://twitter.com/statuses/" + tweet.id_str,
                            Tweet: tweet.text,
                            ID: tweet.id_str
                        })
                    }

                })
            },
        ], (err) => {
            if (err) {
                return callback("Error at waterfall end cb");
            }
            callback(null);
        });
    }

async.timesSeries(Math.floor(options.count / 20), function(n, next) {
    fetchTweets((err) => {
        console.log("Currently on " + (n + 1) * 20 + " tweets...");
        next(err);
    });
}, (err) => {
    if (err) {
        return callback("Error at waterfall end cb");
    }
    let xls = tool.json2xls(content, {
        order: headings
    });
    fs.writeFileSync(options.directory + '.xlsx', xls, 'binary');
    console.log("Tweets processed. Output available at " + options.directory + ".xlsx");
});
