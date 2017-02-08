import Foundation
import SwiftRedis
import CloudFoundryConfig
import LoggerAPI

extension Redis {

   func connect(service: RedisService, callback: (NSError?) -> Void) {

       if !self.connected {

           self.connect(host: service.host, port: Int32(service.port)) {
               error in

               guard error == nil else {
                   Log.error("Failed to connect to Redis server")
                   callback(error)
                   return
               }

               Log.info("Authenicate password for Redis")
               self.auth(service.password) {
                   error in

                   guard error != nil else {
                       Log.error("Failed to authenicate to Redis server")

                       callback(error)
                       return
                   }
                   callback(nil)
               }
           }

       } else {
           Log.info("Already connected to Redis server")
           callback(nil)
       }
   }
}
