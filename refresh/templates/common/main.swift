import Foundation
import Kitura
import LoggerAPI
import HeliumLogger
import {{{applicationModule}}}

do {

    HeliumLogger.use(LoggerMessageType.info)

    let app = try App()
    try app.run()

} catch let error {
    Log.error(error.localizedDescription)
}
