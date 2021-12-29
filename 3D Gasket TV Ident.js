"use strict";

var canvas;
var gl;

var positions = [];
var colors = [];
var speed = 100; 
var numTimesToSubdivide = 2;

var colorLoc;
var positionLoc;
var thetaLoc; 
var transLoc; 
var scaleLoc; 

var begin = false;
var axis = 2;
var theta = [0, 0, 0]; 
var rotationRate = -4.0; 
var cycle = 0;
var enlarge = false;
var stop = false;
var scale = 0.5;
var trans = [0, 0];
var transRate1 = (Math.random() -0.5 ) * 0.02; 
var transRate2 = (Math.random() -0.5 ) * 0.02; 

var vertices = [							// First, initialize the vertices of our 3D gasket
        vec3(0.0000,  0.0000, -1.0000),		// Four vertices on unit circle
        vec3(0.0000,  0.9428,  0.3333),		// Intial tetrahedron with equal length sides
        vec3(-0.8165, -0.4714,  0.3333),
        vec3(0.8165, -0.4714,  0.3333)
    ];
	
var baseColors = [
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(1.0, 1.0, 1.0),
    ];

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");


    //  Configure WebGL

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // enable hidden-surface removal

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
	
	colorLoc = gl.getAttribLocation(program, "aColor");
	positionLoc = gl.getAttribLocation(program, "aPosition");
	thetaLoc = gl.getUniformLocation(program, "uTheta"); //##
	transLoc = gl.getUniformLocation(program, "uTrans"); //##
	scaleLoc = gl.getUniformLocation(program, "uScale"); //##
	
	//event listeners for buttons
	
    document.getElementById("num-subdivision").onchange = function(event) {
         numTimesToSubdivide = parseInt(event.target.value);
    };
	
	var colorPickers1 = document.querySelector(".colorpicker1");
		colorPickers1.addEventListener("input", () => {
		baseColors[0] = hex2rgb(event.target.value);
    });
	
	var colorPickers2 = document.querySelector(".colorpicker2");
		colorPickers2.addEventListener("input", () => {
		baseColors[1] = hex2rgb(event.target.value);
    });
	
	var colorPickers3 = document.querySelector(".colorpicker3");
		colorPickers3.addEventListener("input", () => {
		baseColors[2] = hex2rgb(event.target.value);
    });

    document.getElementById("rotation-speed").onchange = function(event) {
        speed = 100 - event.target.value;
    };

    document.getElementById("play-button").onclick = function(event){
		begin = !begin;
    };

    document.getElementById("restart-button").onclick = function(event){
		initialize();
    }
	
    render();
};

function hex2rgb(hex) 
{	
	// turns hexadecimal notation to rgb value;
	
	var col = parseInt(hex.substring(1), 16);
	var R = ((col >> 16) & 255) / 255;
	var G = ((col >> 8) & 255) / 255;
	var B = (col & 255) / 255;
	return vec3(R, G, B);
}

function initialize() 
{	
	// initialize all variables when restart button is clicked
	
	begin = false;
	theta = [0, 0, 0]; 
	rotationRate = -4.0; 
	cycle = 0;
	enlarge = false;
	stop = false;
	scale = 0.5;
	trans = [0, 0];
	transRate1 = (Math.random() -0.5 ) * 0.02; 
	transRate2 = (Math.random() -0.5 ) * 0.02; 
	
	baseColors = [
       vec3(1.0, 0.0, 0.0),
       vec3(0.0, 1.0, 0.0),
       vec3(0.0, 0.0, 1.0),
       vec3(0.0, 0.0, 0.0),
    ];
}

function triangle( a, b, c, color )
{
    // add colors and vertices for one triangle

    colors.push(baseColors[color]);
    positions.push(a);
    colors.push(baseColors[color]);
    positions.push(b);
    colors.push(baseColors[color]);
    positions.push(c);
}

function tetra( a, b, c, d )
{
    // tetrahedron with each side using
    // a different color

    triangle(a, c, b, 0);
    triangle(a, c, d, 1);
    triangle(a, b, d, 2);
    triangle(b, c, d, 3);
}

function divideTetra(a, b, c, d, count)
{
    // check for end of recursion

    if (count === 0) {
        tetra(a, b, c, d);
    }

    // find midpoints of sides
    // divide four smaller tetrahedra

    else {
        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var ad = mix(a, d, 0.5);
        var bc = mix(b, c, 0.5);
        var bd = mix(b, d, 0.5);
        var cd = mix(c, d, 0.5);

        --count;

        divideTetra(a, ab, ac, ad, count);
        divideTetra(ab,  b, bc, bd, count);
        divideTetra(ac, bc,  c, cd, count);
        divideTetra(ad, bd, cd,  d, count);
    }
}

function renderObj() {
	colors = [];
	positions = [];
	divideTetra(vertices[0], vertices[1], vertices[2], vertices[3], numTimesToSubdivide);
	
	var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
}

function animation()
{
	theta[axis] += rotationRate;						//rotation
	if (Math.abs(theta[axis]) >= 180) {					//inverse rotation
		rotationRate *= -1;
		cycle++;
	}
	
	if (cycle >= 2 && Math.abs(theta[axis]) === 0) {	//stop rotation
		enlarge = true;
		rotationRate *= 0;
	}
	
	if (enlarge && !stop) 								//enlargement
		scale += 0.01;
	
	if (scale >= 0.62) {								//stop enlargement
		stop = true;

		trans[0] += transRate1;							//translation
		trans[1] += transRate2 ;
	}
	
	if (trans[0] >= 0.5 || trans[0] <= -0.5) 			//bouncing
		transRate1 *= -1;
	
	if (trans[1] >= 0.4 || trans[1] <= -0.7) 
		transRate2 *= -1;		
	
}

function render()
{
	renderObj();

	if (begin === true)
		animation();

	gl.uniform3fv(thetaLoc, theta);
	gl.uniform1f(scaleLoc, scale);
	gl.uniform2fv(transLoc, trans);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length);
	
	setTimeout(
        function () {requestAnimationFrame(render);},
        speed
    );
}
