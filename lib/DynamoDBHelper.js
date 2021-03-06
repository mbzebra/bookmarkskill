/**
 * This file is a clone of Alexa Skills SDK for Node JS written by http://github.com/deegles
 * https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs/blob/master/lib/DynamoAttributesHelper.js
 * 
 */

'use strict';
var aws = require('aws-sdk');
var table = "BookMarkTable"
var doc;

module.exports = (function() {
    return {
        get: function(userId, callback) {
            if(!table) {
                callback('DynamoDB Table name is not set.', null);
            }

            if(!doc) {
                doc = new aws.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
            }

            var params = {
                Key: {
                    userId: userId
                },
                TableName: table,
                ConsistentRead: true
            };

            doc.get(params, function(err, data){
                if(err) {
                    console.log('get error: ' + JSON.stringify(err, null, 4));

                    if(err.code === 'ResourceNotFoundException') {
                        var dynamoClient = new aws.DynamoDB();
                        newTableParams['TableName'] = table;
                        dynamoClient.createTable(newTableParams, function (err, data) {
                            if(err) {
                                console.log('Error creating table: ' + JSON.stringify(err, null, 4));
                            }
                            console.log('Creating table ' + table + ':\n' + JSON.stringify(data));
                            callback(err, {});
                        });
                    } else {
                        callback(err, null);
                    }
                } else {
                    console.log("before empty");
                    if(isEmptyObject(data)) {
                        console.log("its empty");
                        callback(null, {} , {});
                    } else {
                        console.log("Data is" + JSON.stringify(data));
                        callback(null, data);
                    }
                }
            });
        },

        set: function(userId, bookName, pageNumber, callback) {
            if(!table) {
                callback('DynamoDB Table name is not set.', null);
            }

            if(!doc) {
                doc = new aws.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
            }

            var params = {
                Item: {
                    userId: userId,
                    bookName: bookName,
                    bookmarkPage : pageNumber
                },
                TableName: table
            };

            doc.put(params, function(err, data) {
                if(err) {
                    console.log('Error during DynamoDB put:' + err);
                }
                callback(err, data);
            });
        }
    };
})();

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

var newTableParams = {
    AttributeDefinitions: [
        {
            AttributeName: 'userId',
            AttributeType: 'S'
        }
    ],
    KeySchema: [
        {
            AttributeName: 'userId',
            KeyType: 'HASH'
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};