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
var Rsync = require('rsync');

exports.performSDKGeneration = function(sdkName, sdkType, fileContent, callback) {

  var baseURL = "https://mobilesdkgen.ng.bluemix.net/sdkgen/api/generator/"
  var startGenURL = baseURL + sdkName + "/" + sdkType; // ex. ios_swift or server_swift
  var authToken = "";
  
  request.post({
    headers: {'Accept' : 'application/json',
              'Content-Type' : 'application/json',
              'Authorization' : 'Bearer ' + authToken},
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
          headers: {'Accept' : 'application/json',
                    'Authorization' : 'Bearer ' + authToken},
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
        headers: {'Accept' : 'application/zip',
                  'Authorization' : 'Bearer ' + authToken},
        url: baseURL + genID
      })
      .pipe(fs.createWriteStream(sdkName + '.zip'))
      .on('finish', function () {
        callback('thisIsOne', 'thisIsTwo');
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

// TODO: create function to unzip SDK, get new packages and return.

exports.integrateServerSDK = function(sdkName) {

	// Works on command line, mv won't work because it doesn't merge
	var destination = './Sources/' + sdkName;
	if (!fs.existsSync(destination)){
	  fs.mkdirSync(destination);
	}

	// Write source files to app's Source folder
	var rsync = new Rsync()
	.flags('av')
	.source('./' + sdkName + '/Sources/')
	.destination(destination);
	console.log(rsync.cwd());
	// Execute the command
	rsync.execute(function(error, code, cmd) {
		if(error) {
		  console.log("Finished Rsync with error " + error);
		}

		// Add new Package dependencies
		var regex = /\.\bPackage\b.*/g;
		var originFile = fs.readFileSync('./' + sdkName + '/Package.swift', 'utf8');
		// console.log("file -> " + originFile);
		var destinationFile = fs.readFileSync('./Package.swift', 'utf8');
		// console.log("otherFile -> " + destinationFile);
		var originMatches = originFile.match(regex);
		var destinationMatches = destinationFile.match(regex);

		var lastItem = destinationMatches.pop();
		var filePosition = destinationFile.indexOf(lastItem) + lastItem.length;

		var newPackages = '';
		var index;
		for (index = 0; index < originMatches.length; index++) {
		  // write match to position index
		  newPackages = newPackages + '\n\t\t\t\t' + originMatches[index];
		  console.log("progress: " + newPackages);
		}
		var output = [destinationFile.slice(0, filePosition), newPackages, destinationFile.slice(filePosition)].join('');
		console.log(output);
		
		// Add new Targets
		// var targetRegex = /\.\bTarget\b[^\]]*/g;
		// var targetMatches = output.match(targetRegex);
		// if(targetMatches.count < 1) return ''
		// filePosition = output.indexOf(targetMatches[0]) + targetMatches[0].length;
		// console.log("latest position " + filePosition);


		fs.writeFileSync('./Package.swift', output);
		console.log("am here");
	});
	console.log("also here")

};