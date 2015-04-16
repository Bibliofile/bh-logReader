"use strict";

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
	alert('Error: Your browser is unsupported, the application may not function as expected.');
}

function fileChange() {
	var file = document.getElementById("file").files[0];
	document.getElementById("fileInfo").innerHTML = "<b>File data:</b><br>" +
		"Name: " + file.name + "<br>" +
		"Type: " + file.type;
}

window.onload = function() {
	document.getElementById("file").addEventListener("change", fileChange, false);
}

var worldInfoMsgs = [
	"Creating new world named ",
	"Loading world named ",
	"loading world with size:",
	"not enough food found near by. Trying with new random seed.",
	"using seed:",
	"save delay:",
	"best start pos:",
	"World load complete.",
	"Exiting World.",
	"Renamed "
];

function Msg(time, serverName, message) {
	this.time = time;
	this.server = serverName;
	this.message = message;
	return this;
}

function ChatMsg(msg, sender, strippedMsg) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.sender = sender;
	this.strippedMsg = strippedMsg;
	return this;
}

function ServerMsg(msg, strippedMsg) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.strippedMsg = strippedMsg;
	return this;
}

function CommandMsg(msg, sender, command) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.sender = sender;
	this.command = command;
	return this;
}

function JoinLeaveMsg(msg, world) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.world = world;
	return this;
}

function WorldInfoMsg(msg) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	return this;
}

function parseLogs() {        
	if (document.getElementById("file").value == "") {
		alert("Select a file first");
		return;
	}
	if (document.getElementById("file").files[0].type != "text/plain") {
		alert("This is not a log file");
		return;
	}
	
	var adminColor = document.getElementById("adminColor").value;
	var modColor = document.getElementById("modColor").value;
	var chatMsgColor = document.getElementById("chatMsgColor").value;
	var joinLeaveMsgColor = document.getElementById("joinLeaveMsgColor").value;
	var worldInfoMsgColor = document.getElementById("worldInfoMsgColor").value;
	var commandMsgColor = document.getElementById("commandMsgColor").value;
	var serverMsgColor = document.getElementById("serverMsgColor").value;

	var admins = document.getElementById("adminNames").value.split("\n");
	var mods = document.getElementById("modNames").value.split("\n");
	admins = admins.map(function(name) {
		return name.toUpperCase();
	});
	mods = mods.map(function(name) {
		return name.toUpperCase();
	});
	
	var showTime = document.getElementById("showTime").checked;
	var showDate = document.getElementById("showDate").checked;
	var showChatMsgs = document.getElementById("showChatMsgs").checked;
	var showJoinLeaveMsgs = document.getElementById("showJoinLeaveMsgs").checked;
	var showWorldInfoMsgs = document.getElementById("showWorldInfo").checked;
	var showCommandMsgs = document.getElementById("showCommandMsgs").checked;
	var showServerMsgs = document.getElementById("showServerMsgs").checked;
	
	var file = document.getElementById("file").files[0];
	var reader = new FileReader();

	reader.onload = function(progressEvent) {
		var lines = this.result.split("\n");
		lines.pop();
		
		// Parse all messages into Msg objects
		var msgs = [];
		var currentMsg = null;
		lines.forEach(function(line) {
			var lineData = line.split(" ");
			if (lineData.length < 4) {
				if (currentMsg) {
					currentMsg.message += "\n" + line;
				} else {
					alert("Invalid log file");
				}
				return;
			}
			
			var time = new Date(Date.parse(lineData[0] + "T" + lineData[1] + "Z"));
			if (time.toString() == "Invalid Date") {
				if (currentMsg) {
					currentMsg.message += "\n" + line;
				} else {
					alert("Invalid log file");
				}
				return;
			}
			
			var message = lineData.slice(3).join(" ");
			var msg = new Msg(time, lineData[2], message);
			if (currentMsg) {
				msgs.push(currentMsg);
			}
			currentMsg = msg;
		});
		if (currentMsg) {
			msgs.push(currentMsg);
		}
			
		
		// Determine the Msg objects in ChatMsg, CommandMsg, CommandResponseMsg, JoinLeaveMsg, WorldInfoMsg
		msgs = msgs.map(function(msg) {
			var message = msg.message;
			
			// Chat, command and command response message
			var i = message.indexOf(": ");
			if (i != -1) {
				var sender = message.slice(0, i);
				if (sender.toUpperCase() == sender) {
					var strippedMsg = message.slice(i+2);
					
					if (strippedMsg.length > 0 && strippedMsg[0] == "/") {
						return new CommandMsg(msg, sender, strippedMsg.slice(1));
					}
					
					if (sender == "SERVER") {
						return new ServerMsg(msg, strippedMsg);
					}
					
					return new ChatMsg(msg, sender, strippedMsg);
				}
			}
			
			// Join/leave message
			var i = message.indexOf(" - ");
			if (i != -1) {
				var world = message.slice(0, i);
				if (world.toUpperCase() == world) {
					return new JoinLeaveMsg(msg, world);
				}
			}
			
			// World info messages
			if (worldInfoMsgs.some(function(m) { return message.indexOf(m) == 0; })) {
				return new WorldInfoMsg(msg);
			}
			
			// Everything else
			return msg;
		});
		
	
		// Display the Msg objects
		var html = "";
		msgs.forEach(function(msg) {
			var line = msg.message.replace(/\n/g, "<br>");
			if (showTime) {
				line = msg.time.toLocaleTimeString()  + " " + line;
			}
			if (showDate) {
				line = msg.time.toLocaleDateString() + " " + line;
			}
			if (msg instanceof ChatMsg) {
				if (showChatMsgs) {
					if (admins.indexOf(msg.sender) != -1) {
						line = '<span style="color: ' + adminColor + '">' + line + "</span>";
					} else if (mods.indexOf(msg.sender) != -1) {
						line = '<span style="color: ' + modColor + '">' + line + "</span>";
					} else {
						line = '<span style="color: ' + chatMsgColor + '">' + line + "</span>";
					}
				} else {
					return;
				}
			} else if (msg instanceof JoinLeaveMsg) {
				if (showJoinLeaveMsgs) {
					line = '<span style="color: ' + joinLeaveMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (msg instanceof WorldInfoMsg) {
				if (showWorldInfoMsgs) {
					line = '<span style="color: ' + worldInfoMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (msg instanceof CommandMsg) {
				if (showCommandMsgs) {
					line = '<span style="color: ' + commandMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (msg instanceof ServerMsg) {
				if (showServerMsgs) {
					line = '<span style="color: ' + serverMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			}
			html += line + "<br>";
		});
		document.getElementById("fileData").innerHTML = html;
	};
	reader.readAsText(file);
}