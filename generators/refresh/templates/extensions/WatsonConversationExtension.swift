import Foundation
import ConversationV1
import CloudFoundryConfig

extension Conversation {

   public convenience init(service: WatsonConversationService, version: String) {

        self.init(username: service.username, password: service.password, version: version)
        
    }
}
