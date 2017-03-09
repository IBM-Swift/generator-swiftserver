    server = try (mongoURL: "mongodb://<%- service.credentials.username || 'username' %>:<%- service.credentials.password || 'password' %>@<%- service.credentials.host || 'localhost' %>")
