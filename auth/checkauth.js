// TODO : WHEN CALLED, MAKE A FETCH REQUEST
// WITHIN THE SERVER, AND RETURN, 
// IF LOGGED IN, THEN THE STATUS OF AUTH AND EMAIL ID
// ELSE RETURN FALSE AND NULL EMAIL ID

// const passport = require('passport');

const res = require("express/lib/response");
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
let answer = {
    isLoggedIn: false,
    email: null
}

const authQueryUrl = `${baseUrl}/accounts/googlelogin/querylogin`;
console.log("authquery=", authQueryUrl);

module.exports = async function checkAuth(req) {
    console.log("autqueryurl=", authQueryUrl);
    const result = await fetch(authQueryUrl, { 
        headers: req.headers
    }).then((response) =>
        response.json().then((data)=>{
            console.log("req=",req);
            console.log("data=",data);
            return data;
        }
    )).catch((err)=>{
        return answer;
    })

    return result;
}

// module.exports = async function f(req){
//     console.log("called checkauth2\nnow, will make a fetch call")
//     const result = await fetch(authQueryUrl, {headers:req.headers}).then((response)=>{
//         response.json().then((data)=>{
//             console.log("response from fetch:", data);
//             return data;
//         })
//     }).catch((err)=>{
//         console.log("error in checkauth/fetch:", err);
//         return answer
//     })
//     return result
// }