const express = require('express')
const http = require('http');
const app = express()
const path = require('path');
const port = 3000;
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const request = require('request');
const req = require('express/lib/request');

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/html/index.html'));
})

app.get('/device/:ip', (req,res) => {
    var deviceIP = req.params.ip;
    console.log(deviceIP);
    res.sendFile(path.join(__dirname, '/public/html/dash.html'));

});

io.on('connection', (socket) => {  
    console.log('a user connected');
    
    socket.on('login', (ip) => {
        if(ip != '') {
            console.log(socket.id + " Is Attempting To Login To " + ip);
            request('http://' + ip + "/connect", function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    console.log(socket.id + " Has Logged Into " + ip);
                    
                    if(body.includes("connected")) {
                       var str = body.charAt(body.indexOf(':') + 1);
                       console.log(str);
                        io.to(socket.id).emit("log-success", str, "http://"+ ip);

                    }
                } else {
                    console.log(socket.id + " Failed To Login To " + ip);
                    io.to(socket.id).emit("log-error", "Device At IP: " + ip + " Is Not Responsive, Or IP Does Not Exist. ")
                }
            });
        }
    });

    socket.on('toggle', (ip) => {
        if(ip != '') {
            console.log(socket.id + " Is Attempting To Check To Check " + ip);
            request('http://' + ip + "/connect", function (error, response, body) {
                if(!error && response.statusCode == 200) {
                    console.log(socket.id + " Has Checked " + ip);
                    
                    if(body.includes("connected")) {
                       var str = body.charAt(body.indexOf(':') + 1);
                        if(str == "0") {
                            request('http://' + ip + "/LED=ON", function (error, response, body) {
                                if(!error && response.statusCode == 200) {
                                    io.to(socket.id).emit("success", 1);
                                    console.log("Succ");
                                } else {
                                    console.log("Error");
                                    io.to(socket.id).emit("error");
                                }
                            });   
                        } else {
                            request('http://' + ip + "/LED=OFF", function (error, response, body) {
                                if(!error && response.statusCode == 200) {
                                    io.to(socket.id).emit("success", 0);
                                    console.log("Succ");
                                } else {
                                    console.log("Error");
                                    io.to(socket.id).emit("error");
                                }
                            }); 
                        }
                        
                        
                        
                    }
                } else {
                    console.log(socket.id + " Failed To Login To " + ip);
                    io.to(socket.id).emit("error", "Device At IP: " + ip + " Is Not Responsive, Or IP Does Not Exist. ")
                }
            });
        }
    });

});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

