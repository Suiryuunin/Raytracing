import * as THREE from 'three';
import { Engine } from './engine';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

"use strict";

let viewport = [window.innerWidth, window.innerHeight];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.IcosahedronGeometry( 1, 1 );
const material = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
const ico = new THREE.Mesh( geometry, material );
scene.add( ico );

const geometry2 = new THREE.BoxGeometry( 2, 3, 2 );
const material2 = new THREE.MeshStandardMaterial( { color: 0x00000 } );
const ico2 = new THREE.Mesh( geometry2, material2 );
ico2.name = "reflect";
ico2.position.set(0, 0, 3);
scene.add( ico2 );

const planeG = new THREE.PlaneGeometry( 10, 10 );
const gray = new THREE.MeshStandardMaterial({color: 0xAAAAAA, side: THREE.DoubleSide});
const plane = new THREE.Mesh(planeG, gray);
plane.rotateX(-Math.PI/2);
plane.position.setY(-1);
scene.add(plane);

camera.position.z = 5;


const raycaster = new THREE.Raycaster();

const update = () =>
{
    controls.update();
};

const canvas = document.getElementById("Viewport");
const ctx = canvas.getContext("2d");

// Pixel Size
let ps = Math.round(window.innerWidth/125/2)*2;

const buffer = document.createElement("canvas").getContext("2d");


let dir = new THREE.Vector3();

const lightV = new THREE.Vector3(10, 10, 10);

renderer.render(scene, camera);

const calculateReflections = (i1, r) => {
    dir.subVectors( r.ray.direction, i1[0].face.normal ).normalize();
    dir.multiplyVectors(dir, new THREE.Vector3(1,1,-1))

    const rc = new THREE.Raycaster(i1[0].point, dir);
    const i2 = rc.intersectObjects(scene.children);
    if (i2.length>0)
    {
        let c;
        let theta;
        if ( ico2 != i2[0].object )
        {
            c = i2[0].object.material.color;
            dir.subVectors( lightV, i2[0].point ).normalize();
            theta = i2[0].face.normal.angleTo(dir);
        }
        else if (i2.length > 1)
        {
            c = i2[1].object.material.color;
            dir.subVectors( lightV, i2[1].point ).normalize();
            theta = i2[1].face.normal.angleTo(dir);
        }
        else
        {
            c = i2[0].object.material.color;
            dir.subVectors( lightV, i2[0].point ).normalize();
            theta = i2[0].face.normal.angleTo(dir);
        }

        
                            
        let i = Math.cos(theta);

        return {r: c.r*i, g: c.g*i, b: c.b*i};
    }

    return {r:0, g:0, b:0};
};

const updateRender = () =>
{
    for (let x = 0; x < viewport[0]; x+=ps)
    {
        for (let y = 0; y < viewport[1]; y+=ps)
        {
            const pixel = new THREE.Vector2(( x / window.innerWidth ) * 2 - 1, -( y / window.innerHeight ) * 2 + 1);
            raycaster.setFromCamera(pixel, camera);
            const intersects = raycaster.intersectObjects(scene.children);
    
            let color = {};
            let intensity = 1;
            if (intersects.length > 0)
            {
                if (intersects[0].object.name == "reflect")
                {
                    color = calculateReflections(intersects, raycaster);
                }
                else
                {
                    dir.subVectors( lightV, intersects[0].point ).normalize();

                    const raycaster2 = new THREE.Raycaster(intersects[0].point, dir);
                    const intersects2 = raycaster2.intersectObjects(scene.children);
                    if (intersects2.length > 1 || (intersects2.length == 1 && intersects2[0].distance > 0.00001))
                    {
                        color = {r:0, g:0, b:0};
                    }
                    else
                    {
                        if (intersects[0].object.isMesh)
                        {
                            color = intersects[0].object.material.color;
                            const theta = intersects[0].face.normal.angleTo(dir);
                            
                            intensity = Math.cos(theta);
                        }
                        else
                        {
                            intensity = 1;
                        }
                    }
                }
                
            }
            else
            {
                color = {r: 0, g: 0, b: 0};
            }
            
    
            buffer.fillStyle = `rgb(${color.r*255*intensity},${color.g*255*intensity},${color.b*255*intensity})`;
            buffer.fillRect(x, y, ps, ps);
        }
    }

    ctx.drawImage(
        buffer.canvas,
        0, 0,
        buffer.canvas.width, buffer.canvas.height,
        0, 0,
        canvas.width, canvas.height
    );
}

const render = () => {
    
    updateRender();
    
};

const engine = new Engine(30, update, render);
engine.start();

canvas.width = buffer.canvas.width = window.innerWidth;
canvas.height = buffer.canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    canvas.width = buffer.canvas.width = window.innerWidth;
    canvas.height = buffer.canvas.height = window.innerHeight;

    updateRender();

    viewport = [window.innerWidth, window.innerHeight];
    ps = Math.round(window.innerWidth/125/2)*2;
});