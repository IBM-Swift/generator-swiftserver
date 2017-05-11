import Foundation
import Conversation1
import CloudFoundryConfig

extension Conversation1 {

   public convenience init(service: WatsonConversationService) {

       self.init(username: service.username, password: service.password, version: service.version)
   }
}
