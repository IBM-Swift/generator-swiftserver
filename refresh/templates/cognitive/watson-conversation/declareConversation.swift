var username: String? 
var password: String?

let version = "<%- conversationService.version %>"
let workspaceID: String = "<%- conversationService.workspaceID %>" 

var conversation: Conversation?
 
let failure = { (error: Swift.Error) in print(error) }
 
var context: Context? // save context to continue conversation

