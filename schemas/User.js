const mongoose = require("mongoose");
const listSchema = require("./List")

const mongooseEncryption = require('mongoose-encryption')
const db_enc_key = Uint8Array.prototype.slice.call(Buffer.from(process.env.DB_ENCKEY), 0,32)
const db_signing_key = Uint8Array.prototype.slice.call(Buffer.from(process.env.DB_SIGNING_KEY), 0,64)

const userSchema = new mongoose.Schema(
    {
        Name: String,
        email: String,
        Lists: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'List'
        }]
    }
)


userSchema.plugin(mongooseEncryption, {encryptionKey:db_enc_key,signingKey:db_signing_key, excludeFromEncryption:['_id', '__v']})

module.exports =  userSchema
