module.exports = 
[
    { path : "/", handler : "home_get", method: "get" },
    { path : "/users", handler : "user_post", method: "post" },
    { path : "/users/:id", handler : "user_post", method: "post" }
]