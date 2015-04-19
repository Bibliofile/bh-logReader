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

var worldLogMsgs = [
	"Creating new world named ",
	"Loading world named ",
	"loading world with size:",
	"not enough food found near by. Trying with new random seed.",
	"using seed:",
	"save delay:",
	"best start pos:",
	"World load complete.",
	"Exiting World.",
	"Renamed ",
	"attempt to reconnect from same device",
	"trying to load plant already loaded"
];

var serverAutoMsgs = [
	"PVP is now *",
	"Privacy setting changed to *",
	"PVP was already *",
	"Reloaded lists.",
	// To do
];
serverAutoMsgs = serverAutoMsgs.map(function(msg) {
	return msg.split("*");
});

var commandMsgs = [
	"\n/HELP*",
	"* has been added to the *",
	"Adminlist:\n*",
	"Modlist:\n*",
	"*was not on the *",
	"*has been removed from the *",
	"Whitelist cleared.",
	"There are * players connected:\n"
	// To do
];
commandMsgs = commandMsgs.map(function(msg) {
	return msg.split("*");
});

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

function ServerAutoMsg(msg, strippedMsg) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.strippedMsg = strippedMsg;
	return this;
}

function ServerChatMsg(msg, strippedMsg) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.strippedMsg = strippedMsg;
	return this;
}

function CommandMsg(msg, sender) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.sender = sender;
	return this;
}

function JoinLeaveMsg(msg, world) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	this.world = world;
	return this;
}

function WorldLogMsg(msg) {
	Msg.call(this, msg.time, msg.serverName, msg.message);
	return this;
}

function matchString(parsedStrs, str) {
	return parsedStrs.some(function(v) {
		var lastIndex = 0;
		var maxIndex = v.length - 1;
		return v.every(function(m, i) {
			var index = str.indexOf(m, lastIndex);
			if (index >= lastIndex) {
				if (i == maxIndex && m != "" && (m.length + index) != str.length) {
					return false;
				}
				lastIndex = index;
				return true;
			}
			return false;
		});
	});
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
	var worldLogMsgColor = document.getElementById("worldLogMsgColor").value;
	var commandMsgColor = document.getElementById("commandMsgColor").value;
	var serverChatMsgColor = document.getElementById("serverChatMsgColor").value;
	var serverAutoMsgColor = document.getElementById("serverAutoMsgColor").value;

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
	var showWorldLogMsgs = document.getElementById("showWorldLogMsgs").checked;
	var showCommandMsgs = document.getElementById("showCommandMsgs").checked;
	var showServerChatMsgs = document.getElementById("showServerChatMsgs").checked;
	var showServerAutoMsgs = document.getElementById("showServerAutoMsgs").checked;
	
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
				var sender = message.slice(0, i).toUpperCase();
				var strippedMsg = message.slice(i+2);
				
				if (strippedMsg.length > 0 && strippedMsg[0] == "/") {
					return new CommandMsg(msg, sender);
				}
				
				if (sender == "SERVER") {
					if (matchString(commandMsgs, strippedMsg)) {
						return new CommandMsg(msg, sender);
					}
					if (matchString(serverAutoMsgs, strippedMsg)) {
						return new ServerAutoMsg(msg, strippedMsg);
					}
					
					return new ServerChatMsg(msg, strippedMsg);
				}
				
				return new ChatMsg(msg, sender, strippedMsg);
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
			if (worldLogMsgs.some(function(m) { return message.indexOf(m) == 0; })) {
				return new WorldLogMsg(msg);
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
			} else if (msg instanceof WorldLogMsg) {
				if (showWorldLogMsgs) {
					line = '<span style="color: ' + worldLogMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (msg instanceof CommandMsg) {
				if (showCommandMsgs) {
					line = '<span style="color: ' + commandMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (msg instanceof ServerChatMsg) {
				if (showServerChatMsgs) {
					line = '<span style="color: ' + serverChatMsgColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (msg instanceof ServerAutoMsg) {
				if (showServerAutoMsgs) {
					line = '<span style="color: ' + serverAutoMsgColor + '">' + line + "</span>";
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
