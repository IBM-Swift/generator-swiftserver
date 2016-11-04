import Kitura
import HeliumLogger
import GeneratedSwiftServer
import Foundation
import LoggerAPI

HeliumLogger.use()

guard let projectRoot = Application.findProjectRoot() else {
    Log.error("Cannot find project root")
    exit(1)
}

let application = Application(projectRoot: projectRoot)
let router = application.router
let port = application.port

Kitura.addHTTPServer(onPort: port, with: router)

Kitura.run()
