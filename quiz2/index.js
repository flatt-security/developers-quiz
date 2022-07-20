const express = require("express");
const { execSync } = require("child_process");
const app = express();

/*
    local ping check
*/
app.get("/", function(req, res) {
    const ip_address = req.query.ip;

    if(!ip_address){
        res.send("?ip=[your_ip]");
        return;
    }

    if(ip_address.length > 16){
        res.send("Error! IP is too long.");
        return;
    }

    if(/[!@#$%\^&*()\-_+=\[\] {}'";:,:?~\\]/.exec(ip_address)){
        res.send("Error! Your request is filtered!");
        return;
    }

    const cmd = "sh -c 'ping -c 1 " + ip_address + "' 2>&1 >/dev/null; true";
    const stderr = execSync(cmd, {"timeout": 1000});
    if(stderr != ""){
        res.send("Error! " + stderr);
        return;
    }

    res.send("Your IP is in a good state!");
});

app.listen(1337);