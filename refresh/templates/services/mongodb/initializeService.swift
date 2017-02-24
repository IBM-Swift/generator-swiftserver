server = try (mongoURL: "mongodb://<%- serviceDef.username || 'username' %>:<%- serviceDef.password || 'password' %>@<%- serviceDef.host || 'localhost' %>")
