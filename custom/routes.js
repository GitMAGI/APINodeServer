module.exports = 
[
    { path : "/", handler : "home_get", method: "get" },
    { path : "/users", handler : "user_get", method: "get" },
    { path : "/users/:id", handler : "user_get", method: "get" },
    { path : "/users", handler : "user_post", method: "post" },
    { path : "/users/:id", handler : "user_post", method: "post" },
    { path : "/tests", handler : "test_get", method: "get" },
    { path : "/tests/:id", handler : "test_get", method: "get" },
    { path : "/tests", handler : "test_post", method: "post" },
    { path : "/tests/:id", handler : "test_post", method: "post" },
]