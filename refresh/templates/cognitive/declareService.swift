var username: String? // = "username-goes-here"
var password: String? // = "password-goes-here"
let version = "2017-04-19"  // use today's date for the most recent version
    
let workspaceID: String? // = "workspace-id-goes-here"
    
var conversation: Conversation?   //= Conversation(username: username, password: password, version: version)
    
let failure = { (error: Swift.Error) in print(error) }
    
var context: Context? // save context to continue conversation

