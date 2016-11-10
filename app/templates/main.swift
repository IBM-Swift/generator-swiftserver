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
    let port = try readConfig(configURL: projectRoot.appendingPathComponent("config.json"))
    let application = Application(projectRoot: projectRoot)
    let router = application.router

    Kitura.addHTTPServer(onPort: port, with: router)

    Kitura.run()
} catch let error as ConfigurationError {
    Log.error(error.defaultMessage())
    exit(1)
} catch {
    Log.error("\(error)")
    exit(1)
}
