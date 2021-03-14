var canvas;
var gl;
var program;
var program2;

var aspect;

var mProjectionLoc, mModelViewLoc, colorModeLoc, colorLoc;

var matrixStack = [];
var ground=[];
var modelView;
var camera;
var colorMode;
var armElevationCurr=0;
var armRotationCurr=0;
var wheelRotationPerFrame=0;
var currWheelRotation=0;
var wheelDirection=0;
var acceleration=0;
var lastSpeed=0;
var colorMode2=false;
var speed = 0;
var x=0;
var z=0;
var yCurrRot=0;
var lastYRot=0;
var cameraChange=true;
var turn=false;

// Stack related operations
function pushMatrix() {
    var m =  mat4(modelView[0], modelView[1], modelView[2], modelView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    modelView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}
function multScale(s) { 
    modelView = mult(modelView, scalem(s)); 
}
function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}
function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}
function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

function fit_canvas_to_window()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    aspect = canvas.width / canvas.height;
    gl.viewport(0, 0,canvas.width, canvas.height);

}

window.onresize = function () {
    fit_canvas_to_window();
}

window.onload = function() {
    canvas = document.getElementById('gl-canvas');

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    fit_canvas_to_window();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //shader
    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);

    colorMode=false;
    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    colorLoc = gl.getUniformLocation(program, "color");
    colorModeLoc = gl.getUniformLocation(program, "colorMode");
    camera = [VP_DISTANCE, VP_DISTANCE,VP_DISTANCE];
    gl.uniform1f(colorModeLoc, false, flatten(colorMode));


    //shader2
    program2= initShaders(gl, 'default-vertex2', 'default-fragment');
    gl.useProgram(program2);


    mModelViewLoc2 = gl.getUniformLocation(program2, "mModelView");
    mProjectionLoc2 = gl.getUniformLocation(program2, "mProjection");
    colorLoc2 = gl.getUniformLocation(program2, "color");
    colorModeLoc2 = gl.getUniformLocation(program2, "colorMode");
    gl.uniform1f(colorModeLoc2, colorMode2);

    sphereInit(gl);
    torusInit(gl);
    cubeInit(gl);
    cylinderInit(gl);
    paraboloidInit(gl);
    render();
}

window.addEventListener("keyup", function() {
    switch (event.keyCode) {
        case 83: // ’S’ key
            if(wheelDirection!=0)
                turn=true;
            acceleration=0;
        break;
        case 87: // ’W’ key
            if(wheelDirection!=0)
                turn=true;
            acceleration=0;
        break;
    }
});

window.addEventListener("keydown", function() {
    switch (event.keyCode) {
        case 48: // ’0’ key
            camera= [VP_DISTANCE, VP_DISTANCE,VP_DISTANCE];
            cameraChange=true;
        break;
        case 49: // ’1’ key
            camera= [0, VP_DISTANCE, 1];
            cameraChange=true;
        break;
        case 50: // ’2’ key
            camera= [0, 0, VP_DISTANCE];
            cameraChange=true;
        break;
        case 51: // ’3’ key
            camera= [VP_DISTANCE, 0, 0];
            cameraChange=true;
        break;
        case 32: // ’Spacebar’ key
            colorMode=!colorMode;
            colorMode2=!colorMode2;
            gl.uniform1f(colorModeLoc, colorMode);
        break;
        case 65: // ’A’ key
            if(wheelDirection>-50)
                wheelDirection-=2;
            if(wheelDirection==0)
                turn=false;
            else turn=true;
        break;
        case 68: // ’D’ key
            if(wheelDirection<50)
                wheelDirection+=2;
            if(wheelDirection==0)
                turn=false;
            else turn=true;
        break;
        case 73: // ’I’ key
            if(armElevationCurr<130) {
                armElevationCurr+=2;
            }
        break;
        case 74: // ’J’ key
            armRotationCurr-=2; 
        break;
        case 75: // ’K’ key
            if(armElevationCurr>0) {
                armElevationCurr-=2;
            }
        break;
        case 76: // ’L’ key
            armRotationCurr+=2;
        break;
        case 83: // ’S’ key
            if(wheelDirection!=0)
                turn=true;
            acceleration=-1;
        break;
        case 87: // ’W’ key
            if(wheelDirection!=0)
                turn=true;
            acceleration=1;
        break;
    }
});

const WHEEL_SCALE = 1.5;
const VAN_SCALE = 1;
const EIXO_SCALE= 1;
const PARABOLICA_SCALE= 1;
const ROTATION_WHEEL_SCALE= 1/50;
const GROUND_TILE_SCALE= 1;
const SUPPORT_SCALE= 1;

const GROUND= 750*GROUND_TILE_SCALE;
const DEFAULT_TILE_NUM=10;2

const VAN_LENGTH = 550*VAN_SCALE;
const VAN_height= 220*VAN_SCALE; //
const VAN_WIDTH= 190*VAN_SCALE;

const WHEEL_RADIUS= 50*WHEEL_SCALE;
const WHEEL_THICK= 17.5*WHEEL_SCALE;
const WHEEL_HEIGHT=0.8*WHEEL_THICK;

const AXIS_LENGTH=190*EIXO_SCALE;
const AXIS_RADIUS=17*EIXO_SCALE;

const SUPPORT_LENGTH= 40*SUPPORT_SCALE;
const SUPPORT_RADIUS= 20*SUPPORT_SCALE;

const ARM_LENGTH= 100*SUPPORT_SCALE;

const VP_DISTANCE = GROUND;


function Wheel(){ 
    multRotationX(90);
    multScale([WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    torusDrawWireFrame(gl, program);
}

function Van(){
    multTranslation([0, 130, 0]);
    multScale([VAN_LENGTH, VAN_height, VAN_WIDTH]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    cubeDrawWireFrame(gl, program);
} 

function Front(){
    multTranslation([315, 80, 0]);
    multScale([80, 120, VAN_WIDTH]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    cubeDrawWireFrame(gl, program);
}

function Axis(){
    multRotationX(90);
    multScale([AXIS_RADIUS, AXIS_LENGTH, AXIS_RADIUS]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    cylinderDrawWireFrame(gl, program);
}

function Support(){
    multTranslation([0, 260, 0]);
    multScale([SUPPORT_RADIUS, SUPPORT_LENGTH, SUPPORT_RADIUS]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    cylinderDrawWireFrame(gl, program);
}

function Arm(){
    multTranslation([60, 300, 0]);
    multRotationZ(90);
    multScale([SUPPORT_RADIUS, ARM_LENGTH, SUPPORT_RADIUS]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    cylinderDrawWireFrame(gl, program);

}

function Sphere(){
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    sphereDrawWireFrame(gl, program);
}

function AntennaConnection(){
    multTranslation([100, 310, 0]);
    multScale([SUPPORT_RADIUS, 40, SUPPORT_RADIUS]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    cylinderDrawWireFrame(gl, program);
}

function Antenna(){
    multTranslation([100, 330, 0]);
    multScale([70, 35, 70]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView)); 
    paraboloidDrawWireFrame(gl, program);
}
function calcGround() {
    ground=[];
    n=DEFAULT_TILE_NUM;
    size=2*GROUND/n;
    for(let i=-1*n; i<1.8*n; i++){
        for(let j=-n; j<1.8*n; j++){
            pushMatrix();
                multTranslation([-GROUND+i*(size),-70,-GROUND+j*size]);
                multScale([size, 20, size]);
                ground.push(modelView);
            popMatrix();
        }
    }
}

function Ground(projection){
    gl.useProgram(program2);
    gl.uniform1f(colorModeLoc2, colorMode2);
    gl.uniform3fv(colorLoc2, vec3(0.2, 0.2, 0.2));
    for(let i=0; i< ground.length; i++) {
        gl.uniformMatrix4fv(mModelViewLoc2, false, flatten(ground[i]));
        gl.uniformMatrix4fv(mProjectionLoc2, false, flatten(projection));
        cubeDrawWireFrame(gl, program2);     
    } 
}

function Window(){
    multScale([100, 100, 10]);
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView)); 
    cubeDrawWireFrame(gl, program);
}

function degrees_to_radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function render() 
{
    requestAnimationFrame(render);
    lastSpeed=speed;
    if(acceleration>0) {
        if(speed < 5000) {
            speed=speed+acceleration*10;
        }
        else speed=5000;
    }
    else {
        if(acceleration<0) {
            speed=speed+acceleration*10;
            if(speed<-5000) {
                speed=-5000;
            }
        }
    }



    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = lookAt(camera, [0,0,0], [0,1,0]);
    
    if(cameraChange) {
        calcGround();
        cameraChange=false;
    }
    Ground(projection);

    gl.useProgram(program);
    
    if(speed>100 || speed <-100) {
        lastx=x;
        x=x+1/2*(speed*Math.cos(degrees_to_radians(yCurrRot+wheelDirection)))/60; //SPEED IN cm/s
        xvar=x-lastx;
        lastz=z;
        z=z+1/2*(speed*-1*Math.sin(degrees_to_radians((yCurrRot+wheelDirection))))/60;
        xvar=x-lastx;
        zvar=z-lastz;
        d=Math.sqrt(xvar*xvar+zvar*zvar)*(speed/(Math.abs(speed)));
        wheelRotationPerFrame=((d)/(WHEEL_RADIUS))*180/Math.PI;
        currWheelRotation-=wheelRotationPerFrame;
        
        if(turn){
            r=360/Math.tan(degrees_to_radians((wheelDirection)));
            //yCurrRot+=w;
            yCurrRot+=(d/r)*(180/Math.PI);
            //front=wheelDirection;
        }
    }
    
    scene();
    
}

function scene() {
    multTranslation([x,0,z]);
    multRotationY(yCurrRot);  
        gl.uniform3fv(colorLoc, vec3(0.95, 0.686, 0.16));
        pushMatrix();
            multTranslation([-180,0,0]);
            pushMatrix();
                multTranslation([0,0,-91.5]);
                multRotationZ(currWheelRotation);
                Wheel();
            popMatrix();
                multTranslation([0,0,91.5]);
                multRotationZ(currWheelRotation);
                Wheel();
        popMatrix();
        pushMatrix();
            multTranslation([180,0,0]);
            pushMatrix();
                multTranslation([0,0,-91.5]);
                multRotationY(wheelDirection);
                multRotationZ(currWheelRotation);
                Wheel();
            popMatrix();
                multTranslation([0,0,91.5]);
                multRotationY(wheelDirection);
                multRotationZ(currWheelRotation);
                Wheel();
        popMatrix();
        pushMatrix();
            gl.uniform3fv(colorLoc, vec3(0.5,0.5,0.5));
            multTranslation([180,0,0]);
            Axis();
        popMatrix();
        pushMatrix();
            multTranslation([-180,0,0]);
            Axis();
        popMatrix();
        pushMatrix();
            gl.uniform3fv(colorLoc, vec3(0.925, 0.152, 0.619));
            Van();
        popMatrix();
        pushMatrix();
            
            Front();
        popMatrix();
            gl.uniform3fv(colorLoc, vec3(0.30,0.70,0.60));
        pushMatrix();
            multTranslation([280, 185, 0]);
            multRotationY(90);
            multScale([1.5, 0.8, 0]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([90, 185, 100]);
            multScale([1.5, 0.8, 0]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([90, 185, -100]);
            multScale([1.5, 0.8, 0]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-150, 185, 100]);
            multScale([1.5, 0.8, 0]);
            Window();
        popMatrix();
        pushMatrix();
            multTranslation([-150, 185, -100]);
            multScale([1.5, 0.8, 0]);
            Window();
        popMatrix(); 
        pushMatrix();
            multTranslation([225, 130, 100]);
            multScale([0.8, 2, 0]);
            Window();
        popMatrix(); 
        pushMatrix();
            gl.uniform3fv(colorLoc, vec3(1.0,1.0,0.0)); 
            Support();
        popMatrix();
            multTranslation([0, 300, 0]);
            multRotationY(armRotationCurr);
            multRotationZ(armElevationCurr);
            multTranslation([0, -300, 0]);
            pushMatrix();
                gl.uniform3fv(colorLoc, vec3(0.60,0.0,1.0));
                Arm();
            popMatrix();
            pushMatrix();
                gl.uniform3fv(colorLoc, vec3(0.4,0.7,0.6));
                multTranslation([0, 300, 0]);
                multScale([40, 40, 40]);
                Sphere();
            popMatrix();
            pushMatrix();
                gl.uniform3fv(colorLoc, vec3(0.1,0.6,0.75));
                AntennaConnection();
            popMatrix();
            
                gl.uniform3fv(colorLoc, vec3(0.456,0.666,0.3));
                Antenna();
            
        popMatrix();
    popMatrix();
}