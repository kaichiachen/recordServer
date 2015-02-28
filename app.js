var express = require("express");
var querystring = require("querystring");
var io = require('socket.io'); 
var dl  = require('delivery');
var fs = require('fs')
var app = express();
var http = require('http');
var server = http.createServer(app);
var version = '1.0.0';
var sockets = null
http.post = require('http-post');
var port = 1114;
app.use(require('body-parser')()); // for post 
app.use(require('connect-multiparty')()); // for post binary

app.post('/shot', takeshot);
app.post('/shot/list', shotlist);
app.post('/shot/name', shotname);

var serv_io = io.listen(server);
var delivery = null;
serv_io.sockets.on('connection', function(socket) {
	console.log('socket connect')
	delivery = dl.listen(socket);
	sockets = socket
})

function takeshot(req,res){
	var flag = false
	serv_io.sockets.emit('from_server_shot', {'message':'shot'});
	delivery.on('receive.success',function(file){
		fs.writeFile('photo/' + 'image', file.buffer, function(err){
			if(err){
				console.log('File could not be saved: ' + err);
				res.status(400).send({valid:false});
			}else{
				console.log('File ' + __dirname + '/photo/' + 'image' + " saved");
				if(flag == false){
					res.sendFile(__dirname + '/photo/' + 'image')
					flag = true
				}
			}
		});
	});

}

function shotlist(req,res) {
	var flag = false
	serv_io.sockets.emit('from_server_shot_list', {'message':'list'});
	sockets.on('from_client_shot_list', function(data){
		if(flag == false){
			res.status(200).send({list:data})
			flag = true
		} 
	})
}

function shotname(req,res) {
	if(req.body.name){
		serv_io.sockets.emit('from_server_shot_name', {'name':req.body.name});
		var flag = false
		delivery.on('receive.success',function(file){
			fs.writeFile('photo/' + 'image', file.buffer, function(err){
				if(err){
					console.log('File could not be saved: ' + err);
					res.status(400).send({valid:false});
				}else{
					console.log('File ' + __dirname + 'photo/' + 'image' + " saved");
					if(flag == false){
						res.sendFile(__dirname + '/photo/' + 'image')
						flag = true
					}
				}
			});
		});
	} else {
		res.status(400).send({valid:false})
	}
}

server.timeout = 0;
server.listen(port);
console.log('Server Start at port ' + port);