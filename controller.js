var Token = require('./models/token')

function Controller() {

    this.saveToken = function (body, res) {   
        console.log(body)   
        Token.findOne({ email: body.email }).lean()
        .exec((err, result) => {
            if (err) {
                res.json({ status: 0, data: "Failed"})
            } else {
                if (result) {                    
                    Token.findByIdAndUpdate(result._id, { token: body.token })
                    .exec((err, result) => {
                        res.json({ status: 1, data: "Success"})
                    })                    
                } else {
                    var newToken = new Token(body)
                    newToken.save((err) => {
                        if (err) {
                            console.log(err)
                        }
                        res.json({ status: 1, data: "Success"})
                    })                                   
                }
            }
        })       
    }

    this.getTokenByEmail = function (email, res) {   
        console.log(email)   
        Token.findOne({ email: email }).lean()
        .exec((err, result) => {
            if (err) {
                res.json({ status: 0, data: "Failed"})
            } else {
                if (result) {                    
                    res.json({ status: 1, token: result.token})                
                } else {
                    res.json({ status: 0, data: "Token not found."})
                }
            }
        })       
    }
}

module.exports = new Controller()