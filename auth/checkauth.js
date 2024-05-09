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

module.exports = async function checkAuth(req) {
    const result = await fetch(`${baseUrl}/accounts/googlelogin/querylogin`, { 
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