import Kitura
import LoggerAPI
import {{{applicationModule}}}

do {

    let app = try App()
    try app.run()

} catch let error {
    Log.error(error.localizedDescription)
}
