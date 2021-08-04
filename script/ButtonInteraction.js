/*
    Functions for button interaction 
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { camera, scene, objsToTest, renderer, mouse, vrControl, selectState } from '/360videodemo/script/script.js';


let curr; // keep track of current object selected
const raycaster = new THREE.Raycaster();

// Update state of buttons in each animation loop
function updateButtons() {
    let intersect;

    if (!scene.getObjectByName('UI').visible) curr = null; //if menu disappears, clear selection

    if (renderer.xr.isPresenting) { // Entered VR
        vrControl.setFromController(0, raycaster.ray);
        intersect = raycast();

        if (intersect) {
            vrControl.setPointerAt(0, intersect.point);
        }

    } else if (mouse.x !== null && mouse.y !== null) { // Not entered VR
        raycaster.setFromCamera(mouse, camera);
        intersect = raycast();
    }

    // Intersected with an object
    if (intersect && intersect.object.isUI && intersect.object.visible) {
        // Set state as selected
        if (selectState) {
            if (!(intersect.object.name === 'signin' && !scene.getObjectByName('clips').visible)) {
                if (scene.getObjectByName('popsign')){
                    if (!(intersect.object.name === 'input' && !scene.getObjectByName('popsign').visible)){
                        intersect.object.setState('selected');
                        if (intersect.object.name !== 'vidcontrols' && intersect.object.name !== 'signin' 
                            && intersect.object.name !== 'keys' && intersect.object.name !== 'input'){
                            curr = intersect.object;
                        }
                    }
                } else {
                    intersect.object.setState('selected');
                    if (intersect.object.name !== 'vidcontrols' && intersect.object.name !== 'signin' 
                        && intersect.object.name !== 'keys' && intersect.object.name !== 'input'){
                        curr = intersect.object;
                    }
                }
            }
        }
        // Set state as hovered 
        else {
            intersect.object.setState('hovered');
        }
    } 

    // Set state as idle
    objsToTest.forEach((obj) => {
        if ((!intersect || obj !== intersect.object) && obj.isUI && obj !== curr) {
            obj.setState('idle');
        }
    });
}

function raycast() {
    return objsToTest.reduce((closestIntersection, obj) => {
        const intersection = raycaster.intersectObject(obj, true);
        if (!intersection[0]) return closestIntersection;
        if (!closestIntersection || intersection[0].distance < closestIntersection.distance) {
            intersection[0].object = obj;
            return intersection[0];
        } else {
            return closestIntersection;
        }
    }, null);
}

export { updateButtons, raycast };