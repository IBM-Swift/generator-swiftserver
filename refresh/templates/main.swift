/*
 * Copyright IBM Corporation 2016
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

import Kitura
import HeliumLogger
import GeneratedSwiftServer
import Foundation
import LoggerAPI
import Generated

HeliumLogger.use()

guard let projectRoot = Application.findProjectRoot() else {
    Log.error("Cannot find project root")
    exit(1)
}

do {
    var config = try ApplicationConfiguration(configURL: projectRoot.appendingPathComponent("config.json"))
    if let environmentPort = ProcessInfo.processInfo.environment["PORT"].flatMap({ Int($0) }) {
        config.port = environmentPort
    }

    let application = GeneratedApplication(config: config)
    Log.info("Using store type \(config.adapterConfig)")
    let router = application.router

    Kitura.addHTTPServer(onPort: config.port, with: router)

    Kitura.run()
} catch let error as ConfigurationError {
    Log.error(error.defaultMessage())
    exit(1)
} catch {
    Log.error("\(error)")
    exit(1)
}
