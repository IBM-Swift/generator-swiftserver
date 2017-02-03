import Kitura
import LoggerAPI
import HeliumLogger
import <%- applicationModule %>

HeliumLogger.use(LoggerMessageType.info)

do {
    let controller = try Controller()
          
    Kitura.addHTTPServer(onPort: controller.port, with: controller.router)
    Kitura.run()
} catch let error {
    Log.error(error.localizedDescription)
}
