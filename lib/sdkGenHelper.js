/*
 * Copyright IBM Corporation 2016-2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('fs');
var request = require('request');
var unzip = require('unzip');
var Rsync = require('rsync');

exports.performSDKGeneration = function(sdkName, sdkType, fileContent, callback) {

  var baseURL = "https://mobilesdkgen.stage1.ng.bluemix.net/sdkgen/api/generator/"
  var startGenURL = baseURL + sdkName + "/" + sdkType; // ex. ios_swift or server_swift
  
  request.post({
    headers: {'Accept' : 'application/json',
              'Content-Type' : 'application/json'},
    url:     startGenURL,
    body: fileContent
  }, function(error, response, body){
    body = JSON.parse(body);

    var job = body['job']
    var genID = job['id'];

    var sdkReady = false
    function getStatus() {
      if (!sdkReady) {
        request.get({
          headers: {'Accept' : 'application/json'},
          url: baseURL + genID + "/status"
        }, function(error, response, body){
          body = JSON.parse(body);

          if (body['status'] === "FINISHED") {
            sdkReady = true
            getSDK();
          }
        })
      }
    }

    function getSDK() {

      request.get({
        headers: {'Accept' : 'application/zip'},
        url: baseURL + genID
      })
      .pipe(fs.createWriteStream(sdkName + '.zip'))
      .on('finish', function () {
      	if(sdkType === 'server_swift') {
      		extractNewContent(sdkName, callback);
      	} else {
      		callback();
      	}
      });
    }

    // Goes through 10 get requests as needed for a 30 second timeout
    (function myLoop (i) {          
       setTimeout(function () {   
          getStatus()
          if (!sdkReady && --i) myLoop(i); // decrement i and call myLoop again if i > 0
       }, 3000)
    })(10);
  });
}

function extractNewContent(sdkName, callback) {

	fs.createReadStream(sdkName + '.zip')
	  .pipe(unzip.Extract({ path: '.' })
	  .on('close', function () {

		var originFile = fs.readFileSync('./' + sdkName + '/Package.swift', 'utf8');
		var originMatches = originFile.match(/\.\bPackage\b.*/g);
		var packages = '';

		if(originMatches != null && originMatches.length > 0) {

			var index; 
			for (index = 0; index < originMatches.length; index++) {
				packages += originMatches[index];
				if(index + 1 == originMatches.length) packages += ',';
				packages += '\n\t\t\t\t'
			}
		} else {
			console.log("Failed to find matches for Package dependencies.");
		}

		// Extract Package name
		var nameMatch = originFile.match(/"(.*?)"/i);
		if(nameMatch != null && nameMatch.length >= 2) {
			// Get group 1 result, parsing out quotes just in case
			var desiredMatch = nameMatch[1].replace(/['"]+/g, '');
			callback([desiredMatch], packages);

		} else {
			console.log("Failed to find match for Package name.")
			callback('', packages);
		}
	}));

}

exports.integrateServerSDK = function(sdkName, callback) {

	var destination = './Sources/' + sdkName;
	if (!fs.existsSync(destination)){
	  fs.mkdirSync(destination);
	}

	// Write source files to app's Source folder
	var rsync = new Rsync()
	.flags('av')
	.source('./' + sdkName + '/Sources/')
	.destination(destination);
	// Execute the resync command
	rsync.execute(function(error, code, cmd) {
		if(error) {
		  console.log("Finished Rsync with error " + error);
		}
		callback();
	});
};
