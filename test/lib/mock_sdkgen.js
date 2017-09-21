/*
 * Copyright IBM Corporation 2017
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
var nock = require('nock')
var path = require('path')

exports.mockClientSDKNetworkRequest = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithFile(
             200,
             path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
             { 'Content-Type': 'application/zip' }
           )
}

exports.mockClientSDKDownloadFailure = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithError({ message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' })
}

exports.mockClientSDKGenerationFailure = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FAILED' })
}

exports.mockClientSDKGenerationTimeout = function (applicationName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${applicationName}_iOS_SDK/ios_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .times(11)
           .reply(200, { status: 'VALIDATING' })
}

exports.mockServerSDKNetworkRequest = function (sdkName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${sdkName}_ServerSDK/server_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithFile(
             200,
             path.join(__dirname, '../resources/dummy_ServerSDK.zip'),
             { 'Content-Type': 'application/zip' }
           )
}

exports.mockServerSDKDownloadFailure = function (sdkName) {
  return nock('https://mobilesdkgen.ng.bluemix.net')
           .filteringRequestBody(/.*/, '*')
           .post(`/sdkgen/api/generator/${sdkName}_ServerSDK/server_swift`, '*')
           .reply(200, { job: { id: 'myid' } })
           .get('/sdkgen/api/generator/myid/status')
           .reply(200, { status: 'FINISHED' })
           .get('/sdkgen/api/generator/myid')
           .replyWithError({ message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' })
}
