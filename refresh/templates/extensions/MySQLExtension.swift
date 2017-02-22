import Foundation
import MySQL
import CloudFoundryConfig
import LoggerAPI

extension Database {

   public convenience init(service: MySQLService) throws {
       try self.init(
           host: service.host,
           user: service.username,
           password: service.password,
           database: service.database,
           port: UInt(service.port)
       )
   }

}
