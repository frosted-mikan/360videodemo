/*
    Functions for button interaction 
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { camera, scene, objsToTest, renderer, mouse, vrControl, selectState } from '/360videodemo/script/script.js';
import { menuUIVisible, deleteUI } from '/360videodemo/script/MenuCreation.js';


let curr; // keep track of current object selected
const raycaster = new THREE.Raycaster();


function updateButtons() {
    let intersect;

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

    if (intersect && intersect.object.isUI && intersect.object.visible) {
        if (selectState) {
            if (!(intersect.object.name == 'signin' && !scene.getObjectByName('clips').visible)) {
                intersect.object.setState('selected');
                if (intersect.object.name != 'vidcontrols'){
                    curr = intersect.object;
                }
            }
        } else {
            intersect.object.setState('hovered');
        }
    } else {

        // TODO: main menu doesn't disappear on click 
        // Call up/dismiss menu when area outside UI is clicked (2743)
        if (selectState) {
            deleteUI();
            menuUIVisible();
        }
    }

    objsToTest.forEach((obj) => {
        if ((!intersect || obj !== intersect.object) && obj.isUI && obj != curr) {
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