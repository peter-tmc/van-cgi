var paraboloid_points = [];
var paraboloid_normals = [];
var paraboloid_faces = [];
var paraboloid_edges = [];

var paraboloid_points_buffer;
var paraboloid_normals_buffer;
var paraboloid_faces_buffer;
var paraboloid_edges_buffer;

var paraboloid_LATS=30;
var paraboloid_LONS=25;

function paraboloidInit(gl, nlat, nlon) {
    nlat = nlat | paraboloid_LATS;
    nlon = nlon | paraboloid_LONS;
    paraboloidBuild(nlat, nlon);
    paraboloidUploadData(gl);
}

// Generate points using polar coordinates
function paraboloidBuild(nlat, nlon) 
{
    // phi will be latitude
    // theta will be longitude
 
    var d_phi = 2*Math.PI / (nlat);
    var d_theta = (Math.PI /2)/ nlon;
    var r = 1;
    
    // Generate north polar cap
    var north = vec3(0,0,0);
    paraboloid_points.push(north);
    paraboloid_normals.push(vec3(0,1,0));
    
    // Generate middle
    for(var i=0, phi=Math.PI-d_phi; i<nlat; i++, phi-=d_phi) { //latitude
        for(var j=0, theta=Math.PI /2; j<nlon; j++, theta-=d_theta) { //longitude
            var x=r*Math.sin(phi)*Math.sin(theta);
            var z=r*Math.cos(phi)*Math.sin(theta);
            var y = x*x+ z*z;
            var pt = vec3(x,y,z);
            paraboloid_points.push(pt);
            var n = vec3(pt);
            paraboloid_normals.push(normalize(n));
        }
    }
    
    // Generate norh south cap
    /*var south = vec3(0,0,0);
    paraboloid_points.push(south);
    paraboloid_normals.push(vec3(0,-1,0));*/
    
    // Generate the faces
    
    // north pole faces
    for(var i=0; i<nlat-1; i++) {
        paraboloid_faces.push(0);
        paraboloid_faces.push(nlon*(i+1));
        
         //paraboloid_points.length-i*nlon-1
        paraboloid_faces.push(nlon*(i+2));
    }
    paraboloid_faces.push(0);
    paraboloid_faces.push(nlon*nlat);
    paraboloid_faces.push(nlon);
    
    
    
    // general middle faces
    var offset=1;
    
    for(var i=0; i<nlat-1; i++) {
        for(var j=0; j<nlon-1; j++) {
            var p = offset+i*nlon+j;
            paraboloid_faces.push(p);
            paraboloid_faces.push(p+nlon);
            paraboloid_faces.push(p+nlon+1);

            paraboloid_faces.push(p);
            paraboloid_faces.push(p+nlon+1);
            paraboloid_faces.push(p+1);
            
        }
    }
    for(var k=0; k<nlon-1; k++) {
        p=offset+k;
        
        paraboloid_faces.push(p+1);
        paraboloid_faces.push(p+(nlat-1)*(nlon));
        paraboloid_faces.push(p);
        
            
        
        paraboloid_faces.push(p+nlon*(nlat-1)+1);
        paraboloid_faces.push(p+(nlat-1)*(nlon));
        paraboloid_faces.push(p+1);
        
    }
    
    // south pole faces
    /*var offset = 1 + (nlat-1) * nlon;
    for(var j=0; j<nlon-1; j++) {
        paraboloid_faces.push(offset+nlon);
        paraboloid_faces.push(offset+j);
        paraboloid_faces.push(offset+j+1);
    }
    paraboloid_faces.push(offset+nlon);
    paraboloid_faces.push(offset+nlon-1);
    paraboloid_faces.push(offset);
    */
    // Build the edges
    for(var i=0; i<nlat; i++) {
        paraboloid_edges.push(0);   // North pole 
        paraboloid_edges.push(paraboloid_points.length-i*nlon-1);
    }

    for(var i=0; i<nlat; i++) {
        for(var j=0; j<nlon;j++) {
           
            var p = 1+ i*nlon + j;
            paraboloid_edges.push(p);   // horizontal line (same latitude)
            if(j!=nlon-1) 
                paraboloid_edges.push(p+1);
            else paraboloid_edges.push(p-nlon);
            
            if(i!=nlat-1) {
                paraboloid_edges.push(p);   // vertical line (same longitude)
                paraboloid_edges.push(p+nlon);
            }
            else {
                paraboloid_edges.push(p);
                paraboloid_edges.push(1+j);
            }
        }
        
    }
}

function paraboloidUploadData(gl)
{
    paraboloid_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(paraboloid_points), gl.STATIC_DRAW);
    
    paraboloid_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(paraboloid_normals), gl.STATIC_DRAW);
    
    paraboloid_faces_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_faces_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(paraboloid_faces), gl.STATIC_DRAW);
    
    paraboloid_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(paraboloid_edges), gl.STATIC_DRAW);
}

function paraboloidDrawWireFrame(gl, program)
{    
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_edges_buffer);
    gl.drawElements(gl.LINES, paraboloid_edges.length, gl.UNSIGNED_SHORT, 0);
}

function paraboloidDrawFilled(gl, program)
{
    gl.useProgram(program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, paraboloid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, paraboloid_faces_buffer);
    gl.drawElements(gl.TRIANGLES, paraboloid_faces.length, gl.UNSIGNED_SHORT, 0);
}

function paraboloidDraw(gl, program, filled=false) {
	if(filled) paraboloidDrawFilled(gl, program);
	else paraboloidDrawWireFrame(gl, program);
}