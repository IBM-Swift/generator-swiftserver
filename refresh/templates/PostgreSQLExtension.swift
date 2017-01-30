import Foundation
import SwiftKuery
import SwiftKueryPostgreSQL
import BluemixConfig

extension PostgreSQLConnection {

   public convenience init(service: PostgreSQLService) {

       self.init(host: service.host, port: Int32(service.port),
                 options: [.userName(service.username),
                           .password(service.password),
                           .databaseName("databasename")])
   }

}
