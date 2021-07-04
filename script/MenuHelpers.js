/*
    Functions for menu interaction/creation
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { scene, objsToTest } from '/360videodemo/script/script.js';
import { popupsArr, underArr } from '/360videodemo/script/MenuCreation.js';
import { deleteKeyboard } from '/360videodemo/script/Keyboard.js';


// Hide visibility of just the popup
function deletePopupUI(obj, option) {
    //obj: exit, obj.parent: exitContain, obj.parent.parent: container or popSign
    const curr = obj.parent.parent;
    curr.visible = false;
    if (option == 'exit') showUnder(9); //get rid of underline on menu
}

// Make an underline, given coordinates (for the white underlines)
function makeUnderlines(x, y, z) {
    const box = new THREE.PlaneGeometry(0.04, 0.007);
    const material = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    const plane = new THREE.Mesh(box, material);
    plane.position.set(x, y, z);
    plane.rotation.x = -0.5;
    plane.name = "underline";
    plane.visible = false;
    scene.getObjectByName('UI').add(plane);
    return plane;
}

// Toggle visibility of chosen underline
function showUnder(id) {
    underArr.forEach((under, i) => {
		under.visible = i === id ? true : false;
	});
}

// Toggle visibility of the chosen popup
function showPop(id) {
    if (id != 2) {
        if (scene.getObjectByName('keysFull')) deleteKeyboard(); //delete keyboard if not clips
    }
    const curr = scene.getObjectByName('popUI');
    if (!curr.visible){
        curr.visible = true;
    }
	popupsArr.forEach((pop, i) => {
		pop.visible = i === id ? true : false;
	});
};

// Hide visibility of all UI present 
function deleteUI() {
    const curr = scene.getObjectByName('UI');
    curr.visible = false;
    curr.children.forEach(function(object){
        object.visible = false;
    });
}

// Make menu bar visible 
function menuUIVisible() {
    const curr = scene.getObjectByName('UI');
    curr.visible = true;
    curr.children.forEach(function(object){
        if (object.name != 'popUI' && object.name != 'underline') object.visible = true;
    });
}

// Create Video Controls 
function makeVideoControls() {
    // container for all video controls
    const controlsContain = new ThreeMeshUI.Block({
        height: 0.12,
        width: 0.6, 
        justifyContent:'center',
        contentDirection: 'row-reverse',
        backgroundOpacity: 1,
        margin: 0.03
    });
    controlsContain.position.set(0, -0.15, -0.3);
    controlsContain.rotation.x = -0.5;
    controlsContain.name = "controlsContain";
    scene.add(controlsContain);

    // State properties for video controls
    const idleStateControls = {
        state: "idle",
        attributes: {
            backgroundColor: new THREE.Color(0xFFFFFF)
        }
    };
    const hoveredStateAttributes = {
        state: "hovered",
        attributes: {
            backgroundColor: new THREE.Color(0xc2c2c2),
            backgroundOpacity: 1
        },
    };
    const selectedAttributes = {
        offset: 0.02,
        backgroundColor: new THREE.Color(0xc2c2c2),
        backgroundOpacity: 1
    };

    // Play/pause button
    const playpause = new ThreeMeshUI.Block({
        height: 0.07,
        width: 0.07,
        justifyContent: 'start',
        alignContent: 'center',
        padding: 0.02,
        margin: 0.02
    });

    const video = document.getElementById('video');

    const play = new THREE.TextureLoader().load('/360videodemo/assets/play.png');
    
    const pause = new THREE.TextureLoader().load('/360videodemo/assets/pause.png');
    
    playpause.set({backgroundTexture: pause});
    let trigger = true; //video starts playing automatically

    playpause.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            if (trigger){
                playpause.set({backgroundTexture: play});
                video.pause();
                trigger = false;
            }else {
                playpause.set({backgroundTexture: pause});
                video.play();
                trigger = true;
            }
        }
    });
    playpause.setupState(hoveredStateAttributes);
    playpause.setupState(idleStateControls);

    // Fastfoward button
    const fastForward = new ThreeMeshUI.Block({
        height: 0.07,
        width: 0.07,
        justifyContent: 'start',
        alignContent: 'center',
        padding: 0.02
    });
    const forward = new THREE.TextureLoader().load('/360videodemo/assets/fastforward.png');
    fastForward.set({backgroundTexture: forward});
    fastForward.setupState({
        state: "selected", 
        attributes: selectedAttributes,
        onSet: () => { 
            video.currentTime = video.duration; 
        }
    });
    fastForward.setupState(hoveredStateAttributes);
    fastForward.setupState(idleStateControls);

    // Rewind button
    const rewind = new ThreeMeshUI.Block({
        height: 0.07,
        width: 0.07,
        justifyContent: 'start',
        alignContent: 'center',
        padding: 0.02
    });
    const rewindIcon = new THREE.TextureLoader().load('/360videodemo/assets/rewind.png');
    rewind.set({backgroundTexture: rewindIcon});
    rewind.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            video.currentTime = 0;
        }
    });
    rewind.setupState(hoveredStateAttributes);
    rewind.setupState(idleStateControls);
    
    // To create margins around the control buttons 
    const filler1 = new ThreeMeshUI.Block({
        height: 0.1,
        width: 0.08, 
        backgroundOpacity: 0
    });
    const filler2 = new ThreeMeshUI.Block({
        height: 0.1,
        width: 0.08,
        backgroundOpacity: 0
    });

    // Add all video controls to container 
    fastForward.name = playpause.name = rewind.name = 'vidcontrols';
    controlsContain.add(fastForward, filler1, playpause, filler2, rewind);
    objsToTest.push(fastForward, playpause, rewind);

}

export { deletePopupUI, makeUnderlines, showUnder, showPop, deleteUI, menuUIVisible, makeVideoControls };
