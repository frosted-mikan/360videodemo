// use /script/VRButton.js for localhost
// use /360videodemo/script/VRButton.js for github pages
import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { VRButton } from '/360videodemo/script/VRButton.js';
import VRControl from '/360videodemo/script/VRControl.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/DragControls.js';

let camera, scene, renderer, vrControl, orbitControls, dragControls;
let objsToTest = []; //for buttons
let dragObjs = []; //for dragging
let popupsArr;


const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false;

window.addEventListener('pointermove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('pointerdown', () => {selectState = true});

window.addEventListener('pointerup', () => {selectState = false});

window.addEventListener('touchstart', (event) => {
    selectState = true;
    mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('touchend', () => {
    selectState = false;
    mouse.x = null;
    mouse.y = null;
});


// UI disappears if idle for 10 seconds: mouse ver. 
var timeout;
document.onmousemove = function() {
  clearTimeout(timeout);
  timeout = setTimeout(function() {
      const curr = scene.getObjectByName('UI');
      if (curr.visible){
          deleteUI();
      }
    }, 10000);
}


init();
animate();
makeMenuUI(); 

function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    camera.layers.enable(1); // render left view when no stereo available

    // Video
    const video = document.getElementById('video');
    video.play();

    const texture = new THREE.VideoTexture(video);

    scene = new THREE.Scene();

    // Left eye
    const geometry1 = new THREE.SphereGeometry(500, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry1.scale(-1, 1, 1);

    const uvs1 = geometry1.attributes.uv.array;

    for (let i = 0; i < uvs1.length; i += 2) {
        uvs1[i] *= 0.5;
    }

    const material1 = new THREE.MeshBasicMaterial({map: texture});

    const mesh1 = new THREE.Mesh(geometry1, material1);
    mesh1.rotation.y = - Math.PI / 2;
    mesh1.layers.set(1); // display in left eye only
    scene.add(mesh1);

    // Right eye
    const geometry2 = new THREE.SphereGeometry(500, 60, 40);
    geometry2.scale(-1, 1, 1);

    const uvs2 = geometry2.attributes.uv.array;

    for (let i = 0; i < uvs2.length; i += 2) {
        uvs2[i] *= 0.5;
        // uvs2[i] += 0.5; // for stereoscopic view
    }

    const material2 = new THREE.MeshBasicMaterial({map: texture});

    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.rotation.y = - Math.PI / 2;
    mesh2.layers.set(2); // display in right eye only
    scene.add(mesh2);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    container.appendChild(renderer.domElement);

    // Orbit controls for no VR
    orbitControls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    orbitControls.target = new THREE.Vector3(0, 1, -1.8);

    // Drag controls
    dragControls = new DragControls(dragObjs, camera, renderer.domElement);
    dragControls.transformGroup = true;

    dragControls.addEventListener('dragstart', function () {
        orbitControls.enabled = false;
    });
    dragControls.addEventListener('dragend', function () {
        orbitControls.enabled = true;
    });

    //

    document.body.appendChild(VRButton.createButton(renderer));

    window.addEventListener('resize', onWindowResize);

    vrControl = VRControl(renderer, camera, scene);

    scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);

    vrControl.controllers[0].addEventListener('selectstart', () => {selectState = true});
    vrControl.controllers[0].addEventListener('selectend', () => {selectState = false});
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    ThreeMeshUI.update();
    orbitControls.update(); // for OrbitControls
    renderer.render(scene, camera);
    updateButtons(); // for buttons 
}

// Create Popup UI - called from makeMenuUI()
function makePopupUI() {
    const container = new THREE.Group({
        height: 1.1,
        width: 2, 
        alignContent: 'right'
    }); //contains all popup UI
    const exitContain = new ThreeMeshUI.Block({ //contains exit button
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        alignContent: 'right',
        justifyContent: 'start',
        height: 1.1,
        width: 1,
        padding: 0.05
    });
    container.name = "popUI"; 
    container.position.set(0, 0.75, 0);
    container.rotation.x = 0.15;
    container.add(exitContain);
    scene.add(container);

    // Options for component.setupState().
    const hoveredStateAttributes = {
        state: "hovered",
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color(0x999999),
            backgroundOpacity: 1,
            fontColor: new THREE.Color(0xffffff)
        },
    };

    const idleStateAttributes = {
        state: "idle",
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color(0x666666),
            backgroundOpacity: 0.3,
            fontColor: new THREE.Color(0xffffff)
        },
    };

    // Exit button 
    const exit = new ThreeMeshUI.Block({
        width: 0.08,
        height: 0.08,
        justifyContent: 'center',
        alignContent: 'center'
    });
    exit.add(
        new ThreeMeshUI.Text({content:"X"})
    );

    const selectedAttributes = {
        offset: 0.02,
        backgroundColor: new THREE.Color(0x777777),
        fontColor: new THREE.Color(0x222222)
    };

    exit.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI(exit);
        }
    });
    exit.setupState(hoveredStateAttributes);
    exit.setupState(idleStateAttributes);

    exitContain.add(exit);
    objsToTest.push(exit);

    // Create actual popups
    const popupAttributes = {
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        height: 1.1,
        width: 1,
        alignContent: 'left', 
        justifyContent: 'start', 
        padding: 0.1,
        fontColor: new THREE.Color(0xFFFFFF),
        fontSize: 0.05
    };

    const popTranscript = new ThreeMeshUI.Block(popupAttributes);
    const popDetails = new ThreeMeshUI.Block(popupAttributes);
    const popClips = new ThreeMeshUI.Block(popupAttributes);
    const popShare = new ThreeMeshUI.Block(popupAttributes);
    const popCite = new ThreeMeshUI.Block(popupAttributes);

    popTranscript.position.set(0, 0.005, 0);
    popDetails.position.set(0, 0.005, 0);
    popClips.position.set(0, 0.005, 0);
    popShare.position.set(0, 0.005, 0);
    popCite.position.set(0, 0.005, 0);

    //Signin popup block
    const popSign = new ThreeMeshUI.Block(popupAttributes);
    popSign.add(
        new ThreeMeshUI.Text({
            content: 'Sign in:\n------\n\nemail: *****\npassword: ******'
        })
    );
    popSign.position.set(1.1, 0.005, 0); //move to right

    //Add exit to signin popup (deletePopupUI to parent obj)
    // Signup Exit button 
    const signExitContain = new ThreeMeshUI.Block({ //contains exit button
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        alignContent: 'right',
        justifyContent: 'start',
        height: 1.1,
        width: 1,
        padding: 0.05
    });
    const signExit = new ThreeMeshUI.Block({
        width: 0.08,
        height: 0.08,
        justifyContent: 'center',
        alignContent: 'center'
    });
    signExit.add(
        new ThreeMeshUI.Text({content:"X"})
    );

    signExit.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI(signExit); 
        }
    });
    signExit.setupState(hoveredStateAttributes);
    signExit.setupState(idleStateAttributes);

    signExitContain.add(signExit);
    objsToTest.push(signExit);

    popSign.add(signExitContain);

    //Button on signin to submit 
    const submitBut = new ThreeMeshUI.Block({
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        alignContent: 'center',
        justifyContent: 'center',
        height: 0.1, 
        width: 0.2, 
        contentDirection: 'row-reverse'
    });
    submitBut.add(
        new ThreeMeshUI.Text({
            content: 'Submit'
        })
    );
    //Config for submit button 
    submitBut.setupState({
        state: "selected",
        attributes:selectedAttributes,
        onSet: () => {
            //make signin popup disappear
            popSign.visible = false;
            //Update clips popup
            //delete existing children of popClips
            for (var i = popClips.children.length - 1; i >= 0; i--) {
                popClips.remove(popClips.children[i]);
            }
            //add new clip static text
            popClips.add(
                new ThreeMeshUI.Text({
                    content: 'Clips\n------ \n\n 0:00:00 A new clip here'
                })
            );        
        }
    });
    submitBut.setupState(hoveredStateAttributes);
    submitBut.setupState(idleStateAttributes);
    objsToTest.push(submitBut);
    popSign.add(submitBut);

    //Add signin popup to container
    popSign.visible = false;
    container.add(popSign);
    
    //Button on Clips popup to signin
    const signinBut = new ThreeMeshUI.Block({
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        alignContent: 'center',
        justifyContent: 'center',
        height: 0.1, 
        width: 0.3, 
        contentDirection: 'row-reverse'
    });
    signinBut.add(
        new ThreeMeshUI.Text({
            content: 'Create Clip'
        })
    );

    //Config for signin button 
    signinBut.setupState({
        state: "selected",
        attributes:selectedAttributes,
        onSet: () => {
            //make signin popup appear
            popSign.visible = true;
        }
    });
    signinBut.setupState(hoveredStateAttributes);
    signinBut.setupState(idleStateAttributes);
    objsToTest.push(signinBut);
    popClips.add(signinBut);
    
    popTranscript.add(
        new ThreeMeshUI.Text({
            content: 'Transcript\n------ \n0:00:00 TRANSCRIPT OF VIDEO FILE:\n\n0:00:50 UNKNOWN: The dream is building machines that can go anywhere a person or animal can go, thats how I see the future'
        })
    );
    popDetails.add(
        new ThreeMeshUI.Text({
            content: 'Details\n------ \nAbstract \nGo face-to-face with the worlds most advanced robots and get a rare look inside Boston Dynamics top secret lab, never before open to the public...until now.\n\nRelease Date\n2017'
        })
    );
    popClips.add(
        new ThreeMeshUI.Text({
            content: 'Clips\n------ \n\nNo Clips Found'
        }),
    );
    popShare.add(
        new ThreeMeshUI.Text({
            content: 'Hello Robot\n\nDirected by David Gelb, With Marc Raibert, Produced by Ari Palitz, In The Possible (Los Angeles, CA: Within, 2017), 11 minutes\n\nTo embed your video in an LMS or other website\n------ \nhttps://video.alexanderstreet.com/watch/hello-robot'
        })
    );
    popCite.add(
        new ThreeMeshUI.Text({
            content: 'Choose a citation style\n------ \nMLA8\n\n"Hello, Robot." , directed by David Gelb., produced by Ari Palitz., Within, 2017. Alexander Street, https://video.alexanderstreet.com/watch/hello-robot.'
        })
    );
        
    popTranscript.visible = popDetails.visible = popClips.visible = popShare.visible = popCite.visible = false;
    container.add(popTranscript, popDetails, popClips, popShare, popCite);
    
    // Toggle visibility between popups
    popupsArr = [popTranscript, popDetails, popClips, popShare, popCite];

    // Handle container visibility 
    container.visible = false;
}

function deletePopupUI(obj) {
    //obj: exit, obj.parent: exitContain, obj.parent.parent: container or popSign
    const curr = obj.parent.parent;
    curr.visible = false;
}

// MENU BUTTONS UI -------------------------------------------------------------------
function makeMenuUI() {
    const menuContain = new ThreeMeshUI.Block({
        height: 0.3,
        width: 2.3,
        justifyContent: 'center',
        contentDirection: 'row-reverse', //for buttons to be horizontal
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png'
    });

    menuContain.name = "UI";
    menuContain.position.set(0, 0.88, -1);
    menuContain.rotation.x = -0.55;
    scene.add(menuContain);

    // BUTTONS
    const buttonOptions = {
        width: 0.4,
        height: 0.15,
        justifyContent: 'center',
        alignContent: 'center',
        offset: 0.05,
        margin: 0.02,
        borderRadius: 0.075
    };

    // Options for component.setupState().
    const hoveredStateAttributes = {
        state: "hovered",
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color(0x999999),
            backgroundOpacity: 1,
            fontColor: new THREE.Color(0xffffff)
        },
    };

    const idleStateAttributes = {
        state: "idle",
        attributes: {
            offset: 0.035,
            backgroundColor: new THREE.Color(0x666666),
            backgroundOpacity: 0.3,
            fontColor: new THREE.Color(0xffffff)
        },
    };

    // Create the menu buttons 
    const buttonTranscript = new ThreeMeshUI.Block(buttonOptions);
    const buttonDetails = new ThreeMeshUI.Block(buttonOptions);
    const buttonClips = new ThreeMeshUI.Block(buttonOptions);
    const buttonShare = new ThreeMeshUI.Block(buttonOptions);
    const buttonCite = new ThreeMeshUI.Block(buttonOptions);

    // Add text to the buttons
    buttonTranscript.add(
        new ThreeMeshUI.Text({content: "Transcript"})
    );
    buttonDetails.add(
        new ThreeMeshUI.Text({content: "Details"})
    );
    buttonClips.add(
        new ThreeMeshUI.Text({content: "Clips"})
    );
    buttonShare.add(
        new ThreeMeshUI.Text({content: "Share"})
    );
    buttonCite.add(
        new ThreeMeshUI.Text({content: "Cite"})
    );

    // Create all popups (all default hidden) 
    makePopupUI();

    // Create states for the buttons
    const selectedAttributes = {
        offset: 0.02,
        backgroundColor: new THREE.Color(0x777777),
        fontColor: new THREE.Color(0x222222)
    };

    buttonTranscript.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(0);
        }
    });
    buttonTranscript.setupState(hoveredStateAttributes);
    buttonTranscript.setupState(idleStateAttributes);

    buttonDetails.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(1);
        }
    });
    buttonDetails.setupState(hoveredStateAttributes);
    buttonDetails.setupState(idleStateAttributes);

    buttonClips.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(2);
        }
    });
    buttonClips.setupState(hoveredStateAttributes);
    buttonClips.setupState(idleStateAttributes);

    buttonShare.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(3);
        }
    });
    buttonShare.setupState(hoveredStateAttributes);
    buttonShare.setupState(idleStateAttributes);

    buttonCite.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(4);
        }
    });
    buttonCite.setupState(hoveredStateAttributes);
    buttonCite.setupState(idleStateAttributes);

    // Add all buttons to menu
    buttonTranscript.name = 'test';
    menuContain.add(buttonCite, buttonShare, buttonClips, buttonDetails, buttonTranscript);

    const pop = scene.getObjectByName('popUI');
    menuContain.add(pop); // add popUI to menucontain to drag together
    dragObjs.push(menuContain);

    objsToTest.push(buttonTranscript, buttonDetails, buttonClips, buttonShare, buttonCite);
    
    // Handle visibility of UI, and add entire UI to objsToTest
    menuContain.visible = false;
    menuContain.children.forEach(function(obj){
        obj.visible = false;
    });
    objsToTest.push(menuContain);

}

// Make the chosen popup visible, hide all others
function showPop(id) {
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
        if (object.name != 'popUI') object.visible = true;
    });
}

function updateButtons() {
    let intersect;

    if (renderer.xr.isPresenting) { // Entered VR
        // console.log('XR is presenting');

        vrControl.setFromController(0, raycaster.ray);
        intersect = raycast();

        if (intersect && intersect.object.visible) {
            // console.log('is intersect');
            vrControl.setPointerAt(0, intersect.point);
        }

    } else if (mouse.x !== null && mouse.y !== null) { // Not entered VR
        // console.log('No XR');

        raycaster.setFromCamera(mouse, camera);
        intersect = raycast();
    }

    if (intersect && intersect.object.isUI && intersect.object.visible) {
        // console.log('intersect && obj.isUI');

        if (selectState) {
            intersect.object.setState('selected');
        } else {
            intersect.object.setState('hovered');
        }
    } else {
        // Have no intersect include not in UI
        // include containers in objsToTest
        // console.log('no visible intersect');
        // console.log('selectstate:');
        // console.log(selectState);

        // Call up/dismiss menu when area outside UI is clicked (2743)
        if (selectState) {
            deleteUI();
            menuUIVisible();
        }
    }

    objsToTest.forEach((obj) => {
        if ((!intersect || obj !== intersect.object) && obj.isUI) {
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
