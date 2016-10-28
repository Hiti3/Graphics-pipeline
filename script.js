var vertices = [];
var newVertices = [];
var edges = [];
var canvas; var ctx;
var doDraw = true;

var rotation; var scale; var translation;
var defaultFile;

// onDocumentReady function
$(function() {
    getCanvas();
    setCanvasSize();
    requestFile(document.getElementById("default").value);

	document.getElementById("myList").onchange = function() {
	  requestFile(this.value);
	  document.getElementById("file");
	};
});

function requestFile(fileName) {
	$.get(fileName, function(data) {
		parseFile(data);
  	});
}

function readFile(input) {
	var file;
	if (input.files && input.files[0]) {
		file = input.files[0];
	}
	if (file) {
		var reader = new FileReader();
		reader.onload = function() {
			parseFile(this.result);
		};
		reader.readAsText(file);
	}
}

function parseFile(file) {
	edges = [];
	vertices = [];

	var lines = file.split('\n');
	var line;
	var coordinates;
	for (var i = 0; i < lines.length; i++) {
		line = lines[i];
		coordinates = line.split(" ");
		if (line[0] == "v") {
  			var tmp = [];
  			for (var j = 0; j < coordinates.length; j++) {
				if (j > 0)
      				tmp.push(parseFloat(coordinates[j]));		
  			}
  			vertices.push(tmp);
		}
		if (line[0] == "f") {
	  		var tmp = [];
	  		for (var j = 0; j < coordinates.length; j++) {
	    		if (j > 0)
	      			tmp.push(parseInt(coordinates[j]));
	  		}
  			edges.push(tmp);
		}
	}
	start(); 
}

function start() {
	initTransformationMatrices();
	refresh();
}

function initTransformationMatrices() {
	rotation = mat4.create();
	scale = mat4.create();
	translation = mat4.create();
}

function getTRS() {
	var TRS = mat4.create();
	mat4.multiply(TRS, TRS, scale);
	mat4.multiply(TRS, TRS, rotation);
	mat4.multiply(TRS, TRS, translation);

	mat4.multiply(TRS, TRS, translate(0,0,8));
	mat4.multiply(TRS, TRS, perspective(4));

	mat4.transpose(TRS, TRS);
	return TRS;
}

function calculateTransformationChanges() {
	var M = getTRS();
	var vertex; var newVertex;
	newVertices = [];

	for (var i = 0; i < vertices.length; i++) {
		vertex = vertices[i]; vertex[3] = 1;
		newVertex = [];

		vec4.transformMat4(newVertex, vertex, M);
		if (newVertex[3] > 0) {
			doDraw = false;
			$("#alert").html("Object is behind the camera!");
			return;
		} else {
			if ($("#alert").text() != "")
				$("#alert").html("");
			
			doDraw = true;
		}
		newVertex = normalizeValues(newVertex);
		newVertices[i] = newVertex;
	}
}

function normalizeValues(newVertex) {
	for (var i = 0; i < newVertex.length; i++) {
		newVertex[i] /= newVertex[newVertex.length - 1];
	}
	return newVertex;
}

function refresh() {
  	calculateTransformationChanges();
	clearScreen();
	if (doDraw) {
  		draw();
	}
}

function getCanvas() {
    canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
}

function setCanvasSize() {
	var size = $(window).height() * 0.95;
	canvas.height = size;
	canvas.width = size;
}

function clearScreen(width, height) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function draw() {
	for (var i = 0; i < edges.length; i++) {
		drawPolygon(i);
	}
}

function drawPolygon(i) {
	ctx.beginPath();
	moveToPoint(i, 0);
	extendLineToPoint(i, 1);
	extendLineToPoint(i, 2);
	extendLineToPoint(i, 0);
	ctx.closePath();
	ctx.stroke();
}

function moveToPoint(vtx_select, vtx_dimension) {
	var vertex = getVertex(vtx_select, vtx_dimension);
	ctx.moveTo(canvas.width - parseInt(canvas.width / 2 + vertex[0] * canvas.width / 2), parseInt(canvas.height / 2 + vertex[1] * canvas.height / 2));
}

function extendLineToPoint(vtx_select, vtx_dimension) {
	var vertex = getVertex(vtx_select, vtx_dimension);
	ctx.lineTo(canvas.width - parseInt(canvas.width / 2 + vertex[0] * canvas.width / 2), parseInt(canvas.height / 2 + vertex[1] * canvas.height / 2));
}

function getVertex(vtx_select, vtx_dimension) {
	var vertex_index = edges[vtx_select][vtx_dimension] - 1;
	var vertex = [];
	for (var i = 0; i <= 1; i++) {
		vertex[i] = newVertices[vertex_index][i];
	}
	return vertex;
}

function rotateX(alpha) {
	var R = mat4.create();
	R[5] = R[10] = Math.cos(alpha * (Math.PI / 180));
	R[6] = - Math.sin(alpha * (Math.PI / 180));
	R[9] = Math.sin(alpha * (Math.PI / 180));
	return R;
}

function rotateY(alpha) {
	var R = mat4.create();
	R[0] = R[10] = Math.cos(alpha * (Math.PI / 180));
	R[2] = - Math.sin(alpha * (Math.PI / 180));
	R[8] = Math.sin(alpha * (Math.PI / 180));
	return R;
}

function rotateZ(alpha) {
	var R = mat4.create();
	R[0] = R[5] = Math.cos(alpha * (Math.PI / 180));
	R[1] = - Math.sin(alpha * (Math.PI / 180));
	R[4] = Math.sin(alpha * (Math.PI / 180));
	return R;
}

function translate(dx, dy, dz) {
	var T = mat4.create();
	T[3] = dx; T[7] = dy; T[11] = dz;
	return T;
}
function scaling(sx, sy, sz) {
	var S = mat4.create();
	S[0] = sx; S[5] = sy; S[10] = sz;
	return S;
}
function perspective(d) {
	var P = mat4.create();
	P[14] = parseFloat(- 1 / d); P[15] = 0;
	return P;
}

var keyEvents = { 37: false, 38: false, 39: false, 40: false, 18: false, 16: false, 65: false, 68: false, 87: false, 83: false, 81: false, 69: false };

$(document).keydown(function(e) {
    if (e.keyCode in keyEvents) {
        keyEvents[e.keyCode] = true;
        
        if (keyEvents[18]) {
        	if (keyEvents[38]) {
	   			mat4.multiply(translation, translation, translate(0, 0, 0.2));
				console.log("z up");
				refresh();
        	}
        	if (keyEvents[40]) {
	   			mat4.multiply(translation, translation, translate(0, 0, - 0.2));
				console.log("z down");
				refresh();
        	}
        }
        else if (keyEvents[16]) {
        	if (keyEvents[38]) {
				mat4.multiply(scale, scale, scaling(1.05, 1.05, 1.05));
				refresh();
				console.log("scale up");
        	}
        	if (keyEvents[40]) {
				mat4.multiply(scale, scale, scaling(0.95, 0.95, 0.95));
				refresh();
				console.log("scale down");
        	}
        }
        else if (keyEvents[37]) {
			mat4.multiply(translation, translation, translate(- 0.05, 0, 0));
			refresh();
			console.log("translate -x");
        }
    	else if (keyEvents[39]) {
			mat4.multiply(translation, translation, translate(0.05, 0, 0));
			refresh();
			console.log("translate x");
        }
        else if (keyEvents[38]) {
			mat4.multiply(translation, translation, translate(0, 0.05, 0));
			refresh();
			console.log("translate y");
        }
    	else if (keyEvents[40]) {
			mat4.multiply(translation, translation, translate(0, - 0.05, 0));
			refresh();
			console.log("translate -y");
        }
        else if (keyEvents[87]) {
			mat4.multiply(rotation, rotation, rotateX(12));
			refresh();
			console.log("rotateX");
        }
        else if (keyEvents[83]) {
			mat4.multiply(rotation, rotation, rotateX(-12));
			refresh();
			console.log("-rotateX");
        }
        else if (keyEvents[68]) {
			mat4.multiply(rotation, rotation, rotateY(12));
			refresh();
			console.log("rotateY");
        }
        else if (keyEvents[65]) {
			mat4.multiply(rotation, rotation, rotateY(-12));
			refresh();
			console.log("-rotateY");
        }
        else if (keyEvents[81]) {
			mat4.multiply(rotation, rotation, rotateZ(12));
			refresh();
			console.log("rotateZ");
        }
        else if (keyEvents[69]) {
			mat4.multiply(rotation, rotation, rotateZ(-12));
			refresh();
			console.log("-rotateZ");
        }
    }
}).keyup(function(e) {
    if (e.keyCode in keyEvents) {
        keyEvents[e.keyCode] = false;
    }
});