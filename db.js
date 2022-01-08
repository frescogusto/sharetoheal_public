const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

require('dotenv').config()
if (process.env.MONGO_URL) {
    console.log(process.env.MONGO_URL);
} else {
    console.log("'MONGO_URL' env variable is missing. please configure your .env file");
}
const db_url = process.env.MONGO_URL;

mongoose.connect(db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));



/// USER
// this is the schema to save user informations
const UserSchema = new Schema({
    email: String,
    nickname: {
        type: String,
        default: 'anonymous'
    },
    workshops: [String],
});
const User = mongoose.model('User', UserSchema);

module.exports.saveUser = function (data, callback) {
    console.log(data);
    User.findOneAndUpdate({
            email: data.email
        },
        data, {
            upsert: true, // to create the doc if not exists
            new: true // to return the new updated document
        },
        function (err, doc) {
            if (err) return console.error(err);
            // if data has an id, it means we are updating an existing doc
            // if data has no id, it means it's a new document
            callback(doc)
        });
};

module.exports.getUserData = function (data, callback) {
    Story.find({
        email: data
    }, function (err, results) {
        if (err) return console.error(err);
        callback(results)
    })
};

module.exports.getUserNickname = function (data, callback) {
    User.findOne({
        email: data
    }, function (err, results) {
        if (err) return console.error(err);
        callback(results)
    })
};

/////




//// STORY

const StorySchema = new Schema({
    // id: ObjectId,
    author: String,
    email: String,
    location: String,
    title: String,
    body: String,
    keywords: String,
    answer: {
        type: String,
        default: null
    },
    sessionId: String,
    sessionTitle: String,
}, {
    timestamps: true
});

// export the schema
const Story = mongoose.model('Story', StorySchema);

// this saves a new story in db or updates an existing one
// if _id is supplied, it will try to look for one to update
// else it will save a new one with a new _id
module.exports.saveStory = function (data, callback) {
    console.log(data);
    Story.findOneAndUpdate({
            // _id: mongoose.Types.ObjectId(data._id),
            email: data.email,
            sessionId: data.sessionId,
        },
        data, {
            upsert: true, // to create the doc if not exists
            new: true // to return the new updated document
        },
        function (err, doc) {
            if (err) return console.error(err);
            // if data has an id, it means we are updating an existing doc
            // if data has no id, it means it's a new document
            callback(doc)
        });
};

// kek
module.exports.searchUserInCurrentWorkshop = function (_email, callback) {
    Story.find({
        sessionId: info.sessionId,
        email: _email
    }, function (err, results) {
        if (err) return console.error(err);
        callback(results);
    })
}

// get all stories
module.exports.getAllStories = function (callback) {
    Story.find({}, function (err, results) {
        if (err) return console.error(err);
        callback(results);
    }).sort({
        createdAt: -1 // this gives stories in chronological order from the most recent
    })
}

// get stories only of current session
module.exports.getCurrentWorkshopStories = function (callback) {

    Story.find({
        sessionId: info.sessionId
    }, function (err, results) {
        if (err) return console.error(err);
        callback(results);
    })
}

// find a specific story by id
module.exports.findStory = function (id, callback) {
    Story.find({
        id: id
    }, function (err, results) {
        if (err) return console.error(err);

        if (results.length > 0) {
            callback(results[0])
        } else {
            callback(null)
        }
    })

};

// these are the current workshop infos
const InfoSchema = new Schema({
    _id: {
        type: String,
        default: '000000000000'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    maxParticipants: {
        type: Number,
        default: 20
    },
    sessionId: {
        type: Number
    },
    sessionTitle: String
})

const Info = mongoose.model('Info', InfoSchema);

module.exports.saveInfo = function (data, callback) {
    console.log(data);
    Info.findOneAndUpdate({
            _id: mongoose.Types.ObjectId('000000000000'),
        },
        data, {
            upsert: true, // to create the doc if not exists
            new: true // to return the new updated document
        },
        function (err, doc) {
            if (err) return console.error(err);
            callback(doc)
        });
};

module.exports.getInfo = function (id, callback) {

    Info.find(function (err, results) {
        if (err) return console.error(err);
        console.log(results);
        // callback(results);
    })

};