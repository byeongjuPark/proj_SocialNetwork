const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

let UserSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    passoword: String,
    profile: String,
    post: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],

    liked_posts: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    liked_comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    friends:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    friedRequests:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);
let User = mongoose.model("User", UserSchema);
module.exports = User;