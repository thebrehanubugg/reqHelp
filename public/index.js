const socket = io.connect("/");
let studentsInQueue = new Map();

function hideAll() {
	$("#homePageTeach").hide();
	$("#gettingStartedTeach").hide();
	$("#gettingStartedStudent").hide();
	$("#startedClassTeach").hide();
	$("#studentInTeachersRoom").hide();
	$("#teacherRoomNotExistent").hide();
}

hideAll();

$("#goTeach").click(() => {
	$("#teachOrStudent").hide();
	$("#gettingStartedTeach").show();
	$("#signup").hide();
	$("#bigCircle").css("width", $("#buttonSignupInstead").width() + 12);
});

$("#goStudy").click(() => {
	$("#teachOrStudent").hide();
	$("#gettingStartedStudent").show();
});

$("#buttonSignupInstead").click(() => {
	$("#signup").toggle();
	$("#login").toggle();
});

function signUp() {
	socket.emit('signUp', {
		username: $("#usernameS").val(),
		password: $("#passwordS").val()
	});
	sessionStorage.setItem("username", $("#usernameS").val());
	$("#usernameS").val("");
	$("#passwordS").val("");
}

$("#buttonSignup").click(function() {
	signUp();
});

$("#passwordS").keypress(event => {
	let key = event.keyCode;
	if (key == 13) {
		signUp();
	}
});

$("#buttonLoginInstead").click(() => {
	$("#signup").toggle();
	$("#login").toggle();
});

function login() {
	socket.emit('login', {
		username: $("#usernameL").val(),
		password: $("#passwordL").val()
	});
	sessionStorage.setItem("username", $("#usernameL").val());
	$("#usernameL").val("");
	$("#passwordL").val("");
}

$("#buttonLogin").click(function() {
	login();
});

$("#passwordL").keypress(event => {
	let key = event.keyCode;
	if (key == 13) {
		login();
	}
});

socket.on('failedAuth', () => {
	hideAll();
	$("#gettingStartedTeach").show();
});

socket.on('usernameNotExist', () => {
	alert("This username does not exist");
});

socket.on('incorrectPassword', () => {
	alert("This password is incorrect");
});

socket.on('toTable', (serverInfo) => {
	//redirect to the home page for specific users (need to send username);
	if (serverInfo.token != null) {
		window.sessionStorage.setItem('token', serverInfo.token);
		window.sessionStorage.setItem('username', serverInfo.username);
		window.sessionStorage.setItem('teachname', serverInfo.teachname);
		window.sessionStorage.setItem('teachRoomCode', serverInfo.yourRoomCode);
		//"reload" the page
		$("#gettingStartedTeach").hide();
		$("#homePageTeach").show();
		$(".settingsPage").hide();
		$("#confirmSettingChanges").hide();
		$("#teacherClassOptions").hide();
	} else {
		window.sessionStorage.setItem('teachname', serverInfo.teachname);
	}
	$("#teacherTrueName").text(window.sessionStorage.getItem('teachname'));
});

$("#settingsPage").click(function() {
	$(".settingsPage").toggle();
	$("#teacherStartClass").toggle();
	//if options are visible and you're pulling open settings, close
	//if options are not visible and you're pulling, nothing
	//need to save current options value when closing if it was open
	if ($(".settingsPage").is(":visible") && $("#teacherClassOptions").is(":visible")) {
		//need to hide it, but restore it when we exit
		window.sessionStorage.setItem('teacherClassOptionsStillThere', true);
		$("#teacherClassOptions").hide();
	} else if ($(".settingsPage").is(":hidden") && window.sessionStorage.getItem('teacherClassOptionsStillThere') == "true") {
		//check to see if the window should be opened
		$("#teacherClassOptions").show();
	} else if ($(".settingsPage").is(":visible") && $("#teacherClassOptions").is(":hidden")) {
		//set teach to false and leave it on that
		window.sessionStorage.setItem('teacherClassOptionsStillThere', false);
	} else {
		window.sessionStorage.setItem('teacherClassOptionsStillThere', false);
	}
	setTimeout(hideSettingsCheck, 300);
});

$("#nameChange").keypress(event => {
	//if any event, enable to confirm button at the bottom of the page
	$("#confirmSettingChanges").show();
});

function hideSettingsCheck() {
	//check to see if the inputs have changed
	$("#nameChange").val() != "" ? $("#confirmSettingChanges").show() : $("#confirmSettingChanges").hide();
	$(".settingsPage").is(":visible") ? setTimeout(hideSettingsCheck, 300) : console.log("don't display");
}

$("#closeSettingsPage").click(function() {
	$(".settingsPage").hide();
	$("#teacherStartClass").show();
	if (window.sessionStorage.getItem('teacherClassOptionsStillThere') == "true") {
		$("#teacherClassOptions").show();
	}
});

$("#confirmSettingChanges").click(function() {
	$(".settingsPage").toggle();
	$("#teacherStartClass").toggle();
	$("#confirmSettingChanges").hide();
	//send new teacher name to update the database
	if (window.sessionStorage.getItem('teacherClassOptionsStillThere') == "true") {
		$("#teacherClassOptions").show();
	}
	if ($("#nameChange").val() != "") {
		socket.emit('newTeacherDisplayName', {
			name: $("#nameChange").val(),
			token: window.sessionStorage.getItem('token'),
			username: window.sessionStorage.getItem('username')
		});
		$("#nameChage").val("");
	}
});

$("#teacherStartClass").click(() => {
	$("#teacherClassOptions").toggle();
});

$("#startClass").click(() => {
	$("#homePageTeach").hide();
	window.sessionStorage.setItem('closedOrOpenRoom', $("#whatHappensToStudent").prop("checked"));
	socket.emit('teacherStartingClass', {
		usernameCode: window.sessionStorage.getItem('username'),
		token: window.sessionStorage.getItem('token'),
		newRoomCode: window.sessionStorage.getItem('teachRoomCode'),
		closedOrOpen: window.sessionStorage.getItem('closedOrOpenRoom')
	});
	socket.on('cleanTeacherRoomStart', () => {
		$("#startedClassTeach").show();
		$("#currentStudentQueue").hide();
		window.sessionStorage.getItem('closedOrOpenRoom') == "true" ? ($("#currentStudentQueueOpen").show(), window.sessionStorage.setItem('queueLength', 0)) : $("#currentStudentQueueOpen").hide();
		$("#teachersClass").text(window.sessionStorage.getItem('teachname') + "'s room");
		$(".badge1").attr("data-badge", window.sessionStorage.getItem('queueLength'));
		if ($(".badge1").attr("data-badge") == 0) {
			$(".badge1").removeAttr("data-badge");
		}
		$("#teachersRoomID").text("Room code - " + window.sessionStorage.getItem('teachRoomCode'));
	});
});

socket.on('studentHasJoinedTheRoomQueue', (serverInfo) => {
	//make notification bar show
	studentsInQueue[serverInfo.studentSocket] = serverInfo.name;
	window.sessionStorage.setItem('queueLength', parseInt(window.sessionStorage.getItem('queueLength'), 10) + 1);
	$(".badge1").attr("data-badge", window.sessionStorage.getItem('queueLength'));
	$("#noStudentsCurrently").hide();
	$("#studentListinQueue").append(
		"<li id='" + serverInfo.name + "'> <span  id='" + serverInfo.studentSocket + "'>" + serverInfo.name + "</span> " +
		"<br> <button class='accepting' id='" + serverInfo.studentSocket + "'> Allow </button> <button class='denying' id='" + serverInfo.studentSocket + "'> Deny </button> </li>"
	);
});

$("#currentStudentQueueOpen").click(() => {
	//open up the queue div
	parseInt(window.sessionStorage.getItem('queueLength'), 10) > 0 ? $("#noStudentsCurrently").hide() : $("#noStudentsCurrently").show();
	$("#currentStudentQueue").toggle();
});

$("#closeQueuePage").click(() => {
	$("#currentStudentQueue").hide();
});

$(document).on('click', '.accepting', function() {
	let studentID = $(this).attr("id");
	//remove them from the queue
	let studentName = studentsInQueue[studentID];
	window.sessionStorage.setItem('queueLength', parseInt(window.sessionStorage.getItem('queueLength'), 10) - 1);
	parseInt(window.sessionStorage.getItem('queueLength'), 10) == 0 ? ($(".badge1").removeAttr("data-badge"), $("#noStudentsCurrently").show()) : $(".badge1").attr("data-badge", window.sessionStorage.getItem('queueLength'));
	$("#" + studentName).remove();
	//add them into the normal room
	$("#studentListinClass").append(
		"<li class='allStudentsinRoom' id='" + studentID + "'> <span id='" + studentName + "'>" + studentName + 
		"</span> <button class='helpedStudent' id='" + studentID + "'> Helped </button></li>"
	);
	//then message that socket, notifying that it has joined the room
	socket.emit('studentCanJoinTeacherRoom', {
		studentName: studentName,
		studentID: studentID,
		token: window.sessionStorage.getItem('token'),
		teacherName: window.sessionStorage.getItem('teachname')
	});
});

$(document).on('click', '.denying', function() {
	let studentID = $(this).attr("id");
	let studentName = studentsInQueue[studentID];
	window.sessionStorage.setItem('queueLength', parseInt(window.sessionStorage.getItem('queueLength'), 10) - 1);
	parseInt(window.sessionStorage.getItem('queueLength'), 10) == 0 ? ($(".badge1").removeAttr("data-badge"), $("#noStudentsCurrently").show()) : $(".badge1").attr("data-badge", window.sessionStorage.getItem('queueLength'));
	$("#" + studentName).remove();
	socket.emit('studentKickedFromRoom', {
		studentName: studentName,
		studentID: studentID,
		token: window.sessionStorage.getItem('token'),
		teachRoomCode: window.sessionStorage.getItem('teachRoomCode'),
		closedOrOpen: window.sessionStorage.getItem('closeOrOpenRoom')
	});
});

socket.on('studentHasJoinedTheRoom', (serverInfo) => {
	$("#studentListinClass").append(
		"<li class='allStudentsinRoom' id='" + serverInfo.studentSocket + "'> <span id='" + serverInfo.name + "'>" + serverInfo.name + 
		"</span> <button class='helpedStudent id='" + serverInfo.studentSocket + "'> Helped </button> </li>"
	);
	$(".helpedStudent #" + serverInfo.studentSocket).hide();
});

//teacher closing tab
window.onunload = function() {
	//check for "teacherness"
	if (window.sessionStorage.getItem('token') != null && window.sessionStorage.getItem('token') != undefined) {
		socket.emit('teacherLeavingSite', {
			token: window.sessionStorage.getItem('token'),
			teacherIDCode: window.sessionStorage.getItem('teachRoomCode'),
			closedOrOpen: window.sessionStorage.getItem('closedOrOpenRoom')
		});
	}
};

$("#goToTeacherRoom").click(() => {
	$("#studentInTeachersRoom").show();
	//need to send the student name and teacher room the server;
	//first check if the room is online then need to see if it's closed or not
	window.sessionStorage.setItem('studentTeacherName', $("#teacherRoomIDJoiner").val());
	socket.emit('studentJoin', {
		name: $("#studentShownName").val(),
		teachID: window.sessionStorage.getItem('studentTeacherName')
	});
	socket.on('teachRoomNoExist', () => {
		$("#gettingStartedStudent").hide();
		$("#studentCurrentLocation").val(window.sessionStorage.getItem('studentTeacherName'));
		$("#teacherRoomNotExistent").show();
		$("#teacherRoomExist").hide();
	});
	socket.on('teacherRoomJoined', (serverInfo) => {
		$("#gettingStartedStudent").hide();
		$("#teacherRoomExist").show();
		$("#teacherRoomNotExistent").hide();
		//check if they're joining queue or going into the room
		//if 1 --> go into queue, otherwise jooin room
		window.sessionStorage.setItem('inOrOutOfRoom', serverInfo.queueOrJoin);
		if (serverInfo.queueOrJoin == "1") {
			$("#teacherNameForRoom").text(serverInfo.teacherName + "'s queue");
			$("#joinedRoomQueue").show();
			$("#fullyJoined").hide();
			$("#joiningTeachersRoomInABit").show();
		} else {
			$("#joiningTeachersRoomInABit").hide();
			$("#teacherNameForRoom").text(serverInfo.teacherName + "'s room");
			$("#fullyJoined").show();
		}
	});
	socket.on('trueJoinTeacherRoom', (serverInfo) => {
		$("#joinedRoomQueue").hide();
		$("#teacherNameForRoom").text(serverInfo.teacherName + "'s room");
		$("#fullyJoined").show();
	});
});

$("#requestHelpFromTeach").click(()=> {
	//update the teacher that this student needs help

});