{{!--
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
--}}
{{license}}

import Foundation
import Kitura
import LoggerAPI
import Configuration

public let router = Router()
public let manager = ConfigurationManager()
public var port: Int = 8080

public func initialize() throws {

    manager.load(file: "config.json", relativeFrom: .project)
           .load(.environmentVariables)

    port = manager["port"] as? Int ?? port

    router.all("/*", middleware: BodyParser())
{{#if web}}
    router.all("/", middleware: StaticFileServer())
{{/if}}
{{#each resource}}
    initialize{{@key}}Routes()
{{/each}}
    initializeSwaggerRoute(path: ConfigurationManager.BasePath.project.path + "/{{swaggerfile}}")
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
