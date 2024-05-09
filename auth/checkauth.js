// TODO : WHEN CALLED, MAKE A FETCH REQUEST
// WITHIN THE SERVER, AND RETURN, 
// IF LOGGED IN, THEN THE STATUS OF AUTH AND EMAIL ID
// ELSE RETURN FALSE AND NULL EMAIL ID

const res = require("express/lib/response");
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
let answer = {
    isLoggedIn: false,
    email: null
}

const authQueryUrl = `${baseUrl}/accounts/googlelogin/querylogin`;
console.log("authquery=", authQueryUrl);

module.exports = async function checkAuth(req) {
    ;
    const result = await fetch(authQueryUrl, { 
        headers: req.headers
    }).then(response =>
        response.json().then((data)=>{
            console.log("data=",data);
            return data;
        }
    )).catch((err)=>{
        return answer;
    })

    return result;
}