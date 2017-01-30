import Foundation
import MongoKitten
import SSLService
import BluemixConfig
import LoggerAPI

extension Server {

   public convenience init(service: MongoDBService) {

       let authorization: MongoCredentials = MongoCredentials(username: service.username, password: service.password, database: "admin")

       var sslSettings: SSLSettings = false
       if let data = Data(base64Encoded: service.certificate),
           let decodedCert = String(data: data, encoding: .utf8) {

           let trimmedCert = decodedCert.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)

           sslSettings = SSLSettings(booleanLiteral: true)
           #if os(Linux)
               let config = SSLService.Configuration(withPEMCertificateString: trimmedCert)
               sslSettings.configuration = config
           #endif
       }

       do {
           try self.init(ClientSettings(host: MongoHost(hostname: service.host, port: UInt16(service.port)), sslSettings: sslSettings, credentials: authorization))
       } catch {
           Log.info("MongoDB is not available on host: \(service.host) and port: \(service.port)")
           exit(1)
       }
   }
}
