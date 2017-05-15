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
{{#each resource}}
    initialize{{@key}}Routes()
{{/each}}
    initializeSwaggerRoute(path: "{{swaggerfile}}")
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
