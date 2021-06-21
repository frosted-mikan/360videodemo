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
let popupsArr; //toggle between the popups


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

// Enter VR mode on fullscreen
const video = document.getElementById('video');
function openFullscreen() {
    video.style.display = 'none';
    init();
    animate();
    makeMenuUI();
}
document.querySelector('button').addEventListener('click', openFullscreen);

    
// init();
// animate();
// makeMenuUI(); 

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
    // renderer.setSize(840, 304); //HERE
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    // const container = document.getElementById('container'); //??
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

    vrControl.controllers[0].addEventListener('selectstart', onSelectStart);
    vrControl.controllers[0].addEventListener('selectend', onSelectEnd);

    scene.add(camera);

}

function onSelectStart(event) {
    selectState = true;
    const controller = event.target;
    const intersection = raycast();

    if (intersection && intersection.object.visible && controller.userData.selected == undefined) {
        if (intersection.object.name == 'UI' || intersection.object.name == 'popUI'){
            const object = intersection.object;
            controller.attach(object);
            controller.userData.selected = object;   
        } 
    }
}

function onSelectEnd(event) {
    selectState = false; 
    const controller = event.target;
    if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;

        if (object.name == 'UI'){
            scene.attach(object);
        }else if (object.name == 'popUI'){
            const curr = scene.getObjectByName('UI');
            curr.attach(object);
        }
        controller.userData.selected = undefined;
    }
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
        width: 1, 
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
    container.position.set(0, 0.85, 0);
    container.rotation.x = 0.25;
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
    popClips.name = 'clips';
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
            //delete existing children of popClips (including popSign)
            popClips.remove(popSign);
            const signin = scene.getObjectByName('signin');
            const text = scene.getObjectByName('clipstext');
            popClips.remove(signin, text);

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

    //Add signin popup to clips popup
    popSign.visible = false;
    popClips.add(popSign); 
    
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
    signinBut.name = 'signin';
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
    const clipsText = new ThreeMeshUI.Text({
        content: 'Clips\n------ \n\nNo Clips Found'
    });
    clipsText.name = 'clipstext';
    popClips.add(clipsText);
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
        height: 0.45, //0.3
        width: 2.3,
        justifyContent: 'center',
        // contentDirection: 'row-reverse', //for buttons to be horizontal
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png'
    });

    menuContain.name = "UI";
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


    // Add all buttons to button menu 
    const buttonContain = new ThreeMeshUI.Block({
        height: 0.3, 
        width: 2.3,
        justifyContent: 'center',
        contentDirection: 'row-reverse' //for buttons to be horizontal
    });
    buttonContain.add(buttonCite, buttonShare, buttonClips, buttonDetails, buttonTranscript);
    objsToTest.push(buttonTranscript, buttonDetails, buttonClips, buttonShare, buttonCite);
    menuContain.add(buttonContain);


    // Create video controls: play/pause, rewind and fastforward 
    // container for all video controls
    const controlsContain = new ThreeMeshUI.Block({
        height: 0.15,
        width: 2, 
        justifyContent:'center',
        contentDirection: 'row-reverse'
    });
    menuContain.add(controlsContain);
    // Play/pause button
    const playpause = new ThreeMeshUI.Block({
        height: 0.15,
        width: 0.15,
        justifyContent: 'start',
        alignContent: 'center'
    });
    const play = new THREE.TextureLoader().load('/360videodemo/assets/play.png');
    const pause = new THREE.TextureLoader().load('/360videodemo/assets/pause.png');
    playpause.set({backgroundTexture: pause});
    let trigger = true; //video starts playing automatically
    const video = document.getElementById('video');
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
    playpause.setupState(idleStateAttributes);
    controlsContain.add(playpause);
    objsToTest.push(playpause);

    // Fastfoward button
    const fastForward = new ThreeMeshUI.Block({
        height: 0.15,
        width: 0.15,
        justifyContent: 'start',
        alignContent: 'center'
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
    fastForward.setupState(idleStateAttributes);

    // Rewind button
    const rewind = new ThreeMeshUI.Block({
        height: 0.15,
        width: 0.15,
        justifyContent: 'start',
        alignContent: 'center'
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
    rewind.setupState(idleStateAttributes);
    

    // Add all video controls to container 
    controlsContain.add(fastForward, playpause, rewind);
    objsToTest.push(fastForward, playpause, rewind);


    // Add popups to menuContain
    const pop = scene.getObjectByName('popUI');
    menuContain.add(pop); // add popUI to menucontain to drag together
    dragObjs.push(menuContain);

    
    // Handle visibility of UI, and add entire UI to objsToTest
    menuContain.visible = false;
    menuContain.children.forEach(function(obj){
        obj.visible = false;
    });
    objsToTest.push(menuContain);


    // 2745: Add entire menu as child of camera so it stays fixed in space
    // camera.add(menuContain); 
    // menuContain.position.set(0, 0, -1.5) 
    menuContain.position.set(0, 0.88, -1); //for dev
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
            if (!(intersect.object.name == 'signin' && !scene.getObjectByName('clips').visible))
            intersect.object.setState('selected');
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
