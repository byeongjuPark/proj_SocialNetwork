const express = require("express");
const morgan = require("morgan");
const winston = require("winston");
const mongoose = require("mongoose");
const session = require("express-session");
const cookieParser = require('cookie-parser');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const socket = require("socket.io");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const Post = require("./models/Post");
const User = require("./models/User");

const port = process.env.PORT || 3000;
const onlineChatUsers = {};

// using .env file
dotenv.config();

const postRoutes = require("./routes/posts");
const userRoutes = require("./routes/users");
const app = express();

app.set("view engine", "ejs");

if(process.env.NODE_ENV === 'production'){
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

app.use(cookieParser(process.SECRET));
app.use(session({
    secret: process.env.SECRET, 
    resave: false,
    saveUnitialized: false
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/bangsoft')
  .then(() => console.log('Connected!')).catch((err) => {
    winston.error(err);
  })
/*
mongoose.connect("mongodb://127.0.01:27017/bangsoft", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log(err);
});
*/
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use("/", userRoutes);
app.use("/", postRoutes);

const server = app.listen(port, () => {
    winston.info(`App is running on ${port}`);
});

const io = socket(server);

const room = io.of("/chat");
room.on("connection", socket => {
    winston.info("new user : ", socket.id);
    room.emit("newUser", {socketID:socket.id});

    socket.on("newUser", data =>{
        if(!(data.name in onlineChatUsers)){
            onlineChatUsers[data.name] = data.socketID;
            socket.name = data.name;
            room.emit("updateUserList", Object.keys(onlineChatUsers));
            winston.info("Online users: "+ Object.keys(onlineChatUsers));
        }
    });

    socket.on("disconnect", () => {
        delete onlineChatUsers[socket.name];
        room.emit("updateUserList", Object.keys(onlineChatUsers));
        winston.info(`user ${socket.name} disconneceted`);
    });

    socket.on("chat", data => {
        winston.info(data);
        if(data.to === "Global Chat"){
            room.emit("chat", data);
        } else if(data.to){
            room.to(onlineChatUsers[data.name]).emit("chat", data);
            room.to(onlineChatUsers[data.to]).emit("chat", data);
        }
    });
})