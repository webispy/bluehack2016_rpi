var hid = require('node-hid');
var async = require('async');
var lame = require('lame');
var fs = require('fs');
var Speaker = require('speaker');
var volume = require('pcm-volume');
var dev = new hid.HID(7247, 2);
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

keys = {
	83: 'NumLock', 84: '/', 85: '*', 86: '-',
	87: '+', 42: '<-', 88: 'Enter',
	89: '1', 90: '2', 91: '3',
	92: '4', 93: '5', 94: '6',
	95: '7', 96: '8', 97: '9',
	98: '0', 99: '.',
 };

var list = [
	{ file:0, name:0 },
	{ file:"/home/pi/Downloads/myage.mp3", name:'내나이가어때서' },
	{ file:"/home/pi/Downloads/battery.mp3", name:'사랑의배터리' },
	{ file:"/home/pi/Downloads/moojogun.mp3", name:'무조건' },
	{ file:"/home/pi/Downloads/sanda.mp3", name:'산다는건' },
	{ file:"/home/pi/Downloads/shabang.mp3", name:'샤방샤방'},
	{ file:"/home/pi/Downloads/ahchoo.mp3", name:'아~추!'},
	{ file:"/home/pi/Downloads/napal.mp3", name:'나팔바지'},
	{ file:"/home/pi/Downloads/naeng.mp3", name:'냉면'},
	{ file:"/home/pi/Downloads/dongyo.mp3", name:'손자노래'},
];

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
	console.log('connected');
});


http.listen(3000, function(){
	console.log('listening');
});

var is_play = 0;
var stream = null;
var dec = null;
var spk = null;

dev.on('data', function(data) {
	if (data[2] == 0)
		return;

	var key = keys[data[2]];

	process.stdout.write('data: ' + key + '\n');


	if (key >= '1' && key <= '9') {
		if (stream) {
			stream.unpipe();
			stream = null;
		}
		if (dec) {
			dec.unpipe();
			dec = null;
		}
		if (spk) {
			spk.close();
			spk = null;
		}

		io.emit('key', key);
		io.emit('title', list[key].name);

		console.log(list[key].file);

		if (list[key].file == 0)
			return;

		stream = fs.createReadStream(list[key].file);
		stream.on('end', function(){ console.log('STREAM END'); });

		dec = stream.pipe(new lame.Decoder);
		dec.on('end', function(){ console.log('DEC END'); });
		dec.on('finish', function(){ console.log('DEC FINISH'); });
		dec.on('unpipe', function(){ console.log('DEC UNPIPE'); });
		dec.on('drain', function(){ console.log('DEC DRAIN'); });
		dec.on('error', function(){ console.log('DEC ERROR'); });
		dec.on('close', function(){ console.log('DEC CLOSE'); });

		spk = dec.pipe(new Speaker());	
		spk.on('pipe', function(){ console.log('SPK PIPE'); });
		spk.on('unpipe', function(){ console.log('SPK UNPIPE'); });
		spk.on('drain', function(){ console.log('SPK DRAIN'); });
		spk.on('error', function(){ console.log('SPK ERROR'); });
		spk.on('close', function(){ console.log('SPK CLOSE'); });

	}
	else {
		io.emit('key', key);
		if (key != "0")
				io.emit('title', "");
	}

});

