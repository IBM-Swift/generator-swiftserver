import Foundation
import CouchDB
import CloudFoundryConfig

extension CouchDBClient {

   public convenience init(service: CloudantService) {

       let connProperties = ConnectionProperties(host: service.host,
                                                   port: Int16(service.port),
                                                   secured: true,
                                                   username: service.username,
                                                   password: service.password)

       self.init(connectionProperties: connProperties)
   }
}
