const path = require('path');
const express = require('express')
const session = require('express-session');
const app = express()
const port = process.env.PORT || 3000

var db = require("./db.js");
const content = require("./content.json")

app.use('/public', express.static('public'));
app.use(session({
    secret: 'ssshhhhh'
}));
app.use(express.json())
app.set('view-engine', 'ejs')
app.use(express.urlencoded({
    extended: false
}))

info = {
    sessionId: Math.random(),
    sessionTitle: '',
    maxParticipants: 10,
    currentParticipants: 0,
    startDate: new Date(),
    closingDate: new Date(),
    isReady: false,
    isOpen: false,
}

let nickname_updated = false;

startNewSession()

// start page: language selection
app.get('/', function (req, res) {
    res.render('lang.ejs')
});

// login page
app.get('/login', function (req, res) {
    sess = req.session;
    const cont = getLanguageContent(req, res)
    if (cont) {
        res.render('login.ejs', {
            content: cont
        })
    }
});

// end page
app.get('/end', function (req, res) {
    sess = req.session;
    const cont = getLanguageContent(req, res)
    if (cont) {
        res.render('end.ejs', {
            content: cont
        })
    }
});

// controls page
app.get('/controls', function (req, res) {
    res.render('controls.ejs', info)
});

// archive page
app.get('/archive', function (req, res) {
    db.getAllStories(function (data) {

        // this groups stories by workshop's sessionID
        var groupBy = function (xs, key) {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        const asd = groupBy(data, 'sessionId');
        const entries = Object.entries(asd);
        const cont = getLanguageContent(req, res)
        if (cont) {
            res.render('archive.ejs', {
                workshops: entries,
                content: cont
            })
        }
    })
});

// room page
app.get('/room', function (req, res) {
    sess = req.session;
    if (sess.currentStep < 2) {
        sess.currentStep = 2
    }
    if (sess.email) { // if user is "logged", give the "room" page
        const cont = getLanguageContent(req, res)
        if (cont) {
            res.render('room.ejs', {
                content: cont,
                email: sess.email,
                nickname: sess.nickname,
                welcomeBack: false,
                currentStep: sess.currentStep
            })
        }
    } else { // else, redirect the user to re-login
        res.redirect('/')
    }
});

// find the current selected language content
function getLanguageContent(req, res) {
    sess = req.session;
    const cont = content[sess.lang]
    if (!cont) {
        res.redirect('/')
        return;
    } else {
        return cont;
    }
}

//// USERS
// this gets called after the user selects the language
app.post('/lang', function (req, res) {
    sess = req.session
    sess.lang = req.body.lang
    res.redirect('/login')
})

// this gets called when the user "logs in" with his/her e-mail 
app.post('/login', function (req, res) {
    db.saveUser(req.body, function (data) {
        sess = req.session
        sess.email = req.body.email

        // we search the database if we already have the email, we attach it to the saved nickname
        db.getUserNickname(req.body.email, function (data) {
            sess.nickname = data.nickname

            // search if the user was already connected to the current workshop (maybe is reconnecting)
            // and we redirect him/her to the correct page
            db.searchUserInCurrentWorkshop(req.body.email, function (data) {
                console.log('found user:', data, req.body.email);
                if (data.length <= 0) {
                    res.redirect('/user')
                    sess.currentStep = 0
                } else {
                    if (sess.currentStep == 1) {
                        res.redirect('/workshop')
                    } else if (sess.currentStep == 2 || sess.currentStep == 3) {
                        res.redirect('/room')
                    } else {
                        res.redirect('/room')
                    }

                }
            })

        })
    })
})

// give the user page
app.get('/user', function (req, res) {
    sess = req.session;
    let email = "nobody";
    if (sess.email) {
        email = sess.email
        db.getUserData(email, function (data) {
            const cont = getLanguageContent(req, res)
            if (cont) {
                res.render('user.ejs', {
                    content: cont,
                    stories: data,
                    info: info,
                    email: email,
                    nickname: sess.nickname,
                    nickname_updated: nickname_updated
                })
                nickname_updated = false;
            }
        })
    } else { // redirect the user to re-login
        res.redirect('/')
    }
});

// this gets called when the user changes nickname by clicking "Update" in the user page
app.post('/nickname', function (req, res) {
    sess = req.session;
    sess.nickname = req.body.nickname;
    console.log(sess);
    db.saveUser({
        email: sess.email,
        nickname: sess.nickname
    }, function (data) {
        nickname_updated = true;
        res.redirect('/user')
    })
});

// enter the workshop
app.get('/workshop', function (req, res) {
    if (!info.isOpen) { // if no workshop is open, redirect to start page
        res.redirect('/')
        return;
    }
    sess = req.session;
    let welcomeBack = false
    sess.currentStep = 1
    if (sess.email) {
        if (sess.alreadyInWorkshop) {
            console.log("already in workshop");
            welcomeBack = true

        } else {
            sess.alreadyInWorkshop = true
            addParticipant(sess.email)
        }
        const cont = getLanguageContent(req, res)
        if (cont) {
            res.render('workshop.ejs', {
                content: cont,
                email: sess.email,
                welcomeBack: welcomeBack,
                nickname: sess.nickname
            })
        }
    } else {
        res.redirect('/')
    }
})
/////



///// STORIES

app.post('/answer', function (req, res) {
    sess = req.session;
    sess.currentStep = 3
    db.saveStory(req.body, function (data) {
        res.send(data)
    })
})

app.post('/story', function (req, res) {
    sess = req.session;
    console.log(req.body);

    req.body.sessionId = info.sessionId
    req.body.sessionTitle = info.sessionTitle
    req.body.email = sess.email

    db.getUserNickname(req.body.email, function (user) {
        req.body.author = user.nickname
        db.saveStory(req.body, function (data) {
            res.redirect('/room')
            // res.send(data)
        })
    })
});

app.get('/stories', function (req, res) {
    db.getCurrentWorkshopStories(function (data) {
        res.send(data);
    })
});

app.get('/storyForMe', function (req, res) {
    sess = req.session;
    assignedStories.forEach(el => {
        if (el.userEmail == sess.email) {
            res.send(el.story)
        }
    });
});

/////


app.get('/info', function (req, res) {
    res.send(info)
});

app.post('/start', function (req, res) {
    start()
    // res.redirect('/controls')
    res.send('/controls')
});

app.post('/end_session', function (req, res) {

    startNewSession()
    // res.redirect('/controls')
    res.send('/controls')
});

app.post('/open_workshop', function (req, res) {
    info.isOpen = true
    res.redirect('/controls')
});

app.post('/update_info', function (req, res) {
    console.log(req.body);
    info.maxParticipants = req.body.maxParticipants
    info.sessionTitle = req.body.sessionTitle
    saveSessionInfo()
    res.redirect('/controls')
});

app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`)
})



function addParticipant(email) {

    db.getUserNickname(email, function (user) {
        // save an empty story to enter the workshop
        let emptyStory = {
            email: email,
            sessionId: info.sessionId,
            sessionTitle: info.sessionTitle,
            author: user.nickname
        }

        db.saveStory(emptyStory, function (data) {
            info.currentParticipants++;
        })
    })
}

function startNewSession() {
    info.isOpen = false;
    info.isReady = false;
    info.currentParticipants = 0
    info.sessionId = Date.now()
    info.sessionTitle = "workshop_" + Date.now() // give random workshop name placeholder
    saveSessionInfo();
}

function saveSessionInfo() {
    db.saveInfo(info, function (result) {
        console.log(result);
    })
}

function start() {
    assignStories();
    info.isReady = true
}

let assignedStories = []

// this shuffle the stories and assign them to all the participants
function assignStories() {

    console.log("SHUFFLE STORIES!!!");
    assignedStories = []

    db.getCurrentWorkshopStories(function (res) {

        let users = res
        let storiesToAssign = users.slice(0) // copy array

        console.log(users);

        for (let i = 0; i < users.length; i++) {

            let currentUser = users[i];

            let storyToAssignIndex = i - 1;
            if (storyToAssignIndex < 0) {
                storyToAssignIndex = users.length - 1
            }
            let storyToAssign = storiesToAssign[storyToAssignIndex]

            let temp = { // create an obj with the story assigned to the requesting user
                userEmail: currentUser.email, // requesting user
                story: storyToAssign
            }
            assignedStories.push(temp)
        }

        console.log(assignedStories);

    })

}