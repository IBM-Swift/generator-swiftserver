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

'use strict'

var debug = require('debug')('generator-swiftserver:lib:sdkGenHelper')
var fs = require('fs')
var path = require('path')
var chalk = require('chalk')
var unzip = require('unzip2')
var config = require('../config')
var Promise = require('bluebird')
var request = require('request')
var requestAsync = Promise.promisify(request)
Promise.promisifyAll(request)

function getStatusAsync (generatedID) {
  var getStatusURL = `${config.sdkGenURL}${generatedID}/status`
  return requestAsync({
    headers: { 'Accept': 'application/json' },
    url: getStatusURL
  })
    .then(response => {
      var status
      try {
        status = JSON.parse(response.body).status
      } catch (err) {
        debug('failed to parse response.body:', response.body)
        err.message = chalk.red(err.message + ': failed to parse async status response body ' + response.body)
        throw err
      }
      switch (status) {
        case 'FINISHED':
          return true

        case 'VALIDATION_FAILED':
        case 'FAILED':
          throw new Error(chalk.red('SDK generator creation failed with status: ', status))

        default:
          return false
      }
    })
}

exports.performSDKGenerationAsync = function (sdkName, sdkType, fileContent) {
  var startGenURL = `${config.sdkGenURL}${sdkName}/${sdkType}`
  debug(`starting SDK generation job for ${sdkName} using ${startGenURL}`)
  return request.postAsync({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    url: startGenURL,
    body: fileContent
  })
    .then(function (response) {
      var body
      try {
        body = JSON.parse(response.body)
      } catch (err) {
        err.message = chalk.red(err.message + ': failed to parse response body')
        throw err
      }
      if (body.job && body.job.id) {
        return body.job.id
      }
      throw new Error(chalk.red('SDK generation error:', response.statusCode, response.statusMessage, body.message))
    })
    .tap(generatedID => debug(`SDK generation job for ${sdkName} started with id ${generatedID}`))
    .then(generatedID => checkUntilFinished(generatedID))

  function checkUntilFinished (generatedID, count) {
    count = count || 1
    debug(`#${count} checking status of SDK generation job with id ${generatedID} (for ${sdkName})`)
    return getStatusAsync(generatedID)
        .then(finished => {
          if (finished) {
            debug(`SDK generation job with id ${generatedID} (for ${sdkName}) is complete`)
            return generatedID
          } else {
            if (count <= 10) {
              return Promise.delay(config.sdkGenCheckDelay).then(() => checkUntilFinished(generatedID, count + 1))
            } else {
              throw new Error(chalk.red('Timeout error, couldn\'t generate SDK within timeout.'))
            }
          }
        })
  }
}

exports.getClientSDKAsync = function (sdkName, generatedID) {
  var clientDownloadURL = config.sdkGenURL + generatedID
  // Use the non-async version of request.get() here because
  // we are going to use .pipe() to stream the data to disk
  return new Promise((resolve, reject) => {
    debug(`starting client SDK download for ${sdkName} from ${clientDownloadURL}`)
    request.get({
      headers: { 'Accept': 'application/zip' },
      url: clientDownloadURL
    })
    .on('error', err => {
      reject(new Error(chalk.red('Getting client SDK failed with error: ', err.message)))
    })
    .pipe(fs.createWriteStream(sdkName + '.zip'))
    .on('close', resolve)
  }).tap(() => debug(`finished client SDK download for ${sdkName} from ${clientDownloadURL}`))
}

exports.getServerSDKAsync = function (sdkName, generatedID) {
  var serverDownloadURL = config.sdkGenURL + generatedID
  // Use the non-async version of request.get() here because
  // we are going to use .pipe() to stream the data to disk
  return new Promise((resolve, reject) => {
    var tempDir = fs.mkdtempSync('/tmp/')
    debug(`starting server SDK download and unzip for ${sdkName} from ${serverDownloadURL} to ${tempDir}`)
    request.get({
      headers: { 'Accept': 'application/zip' },
      url: serverDownloadURL
    })
    .on('error', err => {
      reject(new Error(chalk.red('Getting server SDK failed with error: ', err.message)))
    })
    .pipe(unzip.Extract({ path: tempDir }))
    .on('close', () => {
      debug(`finished server SDK download and unzip for ${sdkName} from ${serverDownloadURL} to ${tempDir}`)

      var sdkDir = path.join(tempDir, sdkName)
      debug(`reading package dependencies from server SDK ${sdkName} in ${sdkDir}`)
      var packages = readPackageDependencies(sdkName, sdkDir)

      resolve({ tempDir: tempDir, dirname: sdkName, packages: packages })
    })
  })
}

function readPackageDependencies (sdkName, sdkDir) {
  var originFile = fs.readFileSync(sdkDir + '/Package.swift', 'utf8')
  var originMatches = originFile.match(/\.\bPackage\b.*/g)
  if (originMatches) {
    debug(`found ${originMatches.length} package dependencies in server SDK ${sdkName}`)
    return originMatches.map(m => m + '\n').join('        ') + ','
  } else {
    debug(`found no package dependencies in server SDK ${sdkName}`)
    return ''
  }
}
