"use strict";

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
	alert('Error: Your browser is unsupported, the application may not function as expected.');
}

function fileChange() {
	var file = document.getElementById("file").files[0];
	document.getElementById("fileinfo").innerHTML = "<b>File data:</b><br/>" +
		"Name: " + file.name + "<br/>" +
		"Type: " + file.type;
}

window.onload = function() {
	document.getElementById("file").addEventListener("change", fileChange, false);
}

function Log(time, serverName, message) {
	this.time = time;
	this.server = serverName;
	this.message = message;
	return this;
}

function ChatLog(time, serverName, message, sender) {
	this.time = time;
	this.server = serverName;
	this.message = message;
	this.sender = sender;
	return this;
}

function JoinLeaveLog(time, serverName, message, world) {
	this.time = time;
	this.server = serverName;
	this.message = message;
	this.world = world;
	return this;
}

function WorldInfoLog(time, serverName, message) {
	this.time = time;
	this.server = serverName;
	this.message = message;
	return this;
}

function ElseLog(message) {
	this.message = message;
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
	
	var adminColor = document.getElementById("admincolor").value;
	var modColor = document.getElementById("modcolor").value;
	var chatMessageColor = document.getElementById("chatMessageColor").value;
	var joinLeaveMessageColor = document.getElementById("joinLeaveMessageColor").value;
	var worldInfoMessageColor = document.getElementById("worldInfoMessageColor").value;
	var consoleColor = document.getElementById("consoleColor").value;

	var admins = document.getElementById("adminnames").value.split('\n');
	var mods = document.getElementById("modnames").value.split('\n');
	admins = admins.map(function(name) {
		return name.toUpperCase();
	});
	mods = mods.map(function(name) {
		return name.toUpperCase();
	});
	
	var showTime = document.getElementById("showTime").checked;
	var showDate = document.getElementById("showDate").checked;
	var showChatMessages = document.getElementById("showChatMessages").checked;
	var showJoinLeaveMessages = document.getElementById("showJoinLeaveMessages").checked;
	var showWorldInfoMessages = document.getElementById("showWorldInfo").checked;
	var showConsoleCommands = document.getElementById("showConsoleCommands").checked;
	
	var file = document.getElementById("file").files[0];
	var reader = new FileReader();

	reader.onload = function(progressEvent) {
		var lines = this.result.split("\n");
		lines.pop();
		try {
			var logs = lines.map(function(line) {
				var lineData = line.split(" ");
				
				var time = new Date(Date.parse(lineData[0] + "T" + lineData[1] + "Z"));
				if (time.toString() == "Invalid Date") {
					return new ElseLog(line)
				}
				
				var message = lineData.slice(3).join(" ");
				
				var i = message.indexOf("/");
				if (i == 0) {
					return new HelpLog(message);
				}
				
				var i = message.indexOf(": ");
				if (i != -1) {
					var sender = message.slice(0, i);
					if (sender.toUpperCase() == sender) {
						return new ChatLog(time, lineData[2], message, sender);
					}
				}
				
				var i = message.indexOf(" - ");
				if (i != -1) {
					var world = message.slice(0, i);
					if (world.toUpperCase() == world) {
						// You could get more information out of the join/leave logs, but I don't think it's useful.
						return new JoinLeaveLog(time, lineData[2], message, world);
					}
				}
				
				var worldInfoMessages = [
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
				var isWorldInfo = worldInfoMessages.some(function(m) {
					var i = message.indexOf(m);
					if (i == 0) {
						return true;
					} else {
						return false;
					}
				});
				if (isWorldInfo) {
					return new WorldInfoLog(time, lineData[2], message);
				}
				
				return new Log(time, lineData[2], message);
			});
		} catch(error) {
			alert(error);
			return;
		}
	
		var html = "";
		logs.forEach(function(log) {
			var line = log.message;
			if (showTime) {
				if (log.time !== "Invalid Date" && log.time !== undefined) {
					line = log.time.toLocaleTimeString()  + " " + line;
				}
			}
			if (showDate) {
				if (log.time !== "Invalid Date" && log.time !== undefined) {
					line = log.time.toLocaleDateString() + " " + line;
				}
			}
			if (log instanceof ChatLog) {
				if (showChatMessages) {
					if (admins.indexOf(log.sender) != -1) {
						line = '<span style="color: ' + adminColor + '">' + line + "</span>";
					} else if (mods.indexOf(log.sender) != -1) {
						line = '<span style="color: ' + modColor + '">' + line + "</span>";
					} else {
						line = '<span style="color: ' + chatMessageColor + '">' + line + "</span>";
					}
				} else {
					return;
				}
			} else if (log instanceof JoinLeaveLog) {
				if (showJoinLeaveMessages) {
					line = '<span style="color: ' + joinLeaveMessageColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (log instanceof WorldInfoLog) {
				if (showWorldInfoMessages) {
					line = '<span style="color: ' + worldInfoMessageColor + '">' + line + "</span>";
				} else {
					return;
				}
			} else if (log instanceof ElseLog) {
				if (showConsoleCommands) {
					line = '<span style="color: ' + consoleColor + '">' + line + "</span>";
				} else {
					return;
				}
			}
			html += line + "<br/>";
		});
		document.getElementById("filedata").innerHTML = html;
	};
	reader.readAsText(file);
}