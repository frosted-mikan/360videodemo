// use /script/VRButton.js for localhost
// use /360videodemo/script/VRButton.js for github pages
import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { VRButton } from '/360videodemo/script/VRButton.js';
import VRControl from '/360videodemo/script/VRControl.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';

let camera, scene, renderer, vrControl, controls;
let objsToTest = [];


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


init();
animate();
// makeMenuUI(); //for testing
// makePopupUI(); //for testing

function init() {
    const container = document.getElementById('container');
    container.addEventListener('click', function() {
        video.play();
    });

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    camera.layers.enable(1); // render left view when no stereo available

    // Video
    const video = document.getElementById('video');
    video.play();

    const texture = new THREE.VideoTexture(video);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);

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
    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1, -1.8);

    document.body.appendChild(VRButton.createButton(renderer));

    window.addEventListener('resize', onWindowResize);

    // Controllers: TODO: see how they work with createController()? 
    vrControl = VRControl(renderer, camera, scene);

    scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);

    vrControl.controllers[0].addEventListener('selectstart', () => {selectState = true});
    vrControl.controllers[0].addEventListener('selectend', () => {selectState = false});

    // createController(1); // probably only want right controller to be clickable
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
    controls.update(); // for OrbitControls
    renderer.render(scene, camera);
    updateButtons(); // for buttons 
}

// function createController(controllerId) {
//     const controller = renderer.xr.getController(controllerId);
//     camera.add(controller);

//     // Trigger controller 
//     controller.addEventListener('selectstart', () => { 
//         if (scene.getObjectByName('UI')){
//             deleteUI();
//         } else {
//             makeMenuUI();
//         }
//     });
// }

//TODO: Add disappear after 10 sec 
function deleteUI() {
    let array = [];
    scene.traverse(function(object) {
        if (object.name == "UI" || object.name == "popUI"){
            array.push(object);
        }
    });
    array.forEach(function(object){
        scene.remove(object); // TODO: object.visible = false? 
    });
}

// Create Popup UI - called from makeMenuUI()
function makePopupUI(selection) {
    // use /assets/Roboto-msdf.json for localhost
    // use /360videodemo/assets/Roboto-msdf.json for git
    const container = new ThreeMeshUI.Block({
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        alignContent: 'right',
        justifyContent: 'start',
        backgroundOpacity: 0
    });
    container.name = "popUI"; // TODO: this affects NUVO-2743
    container.position.set(0, 1.63, -1.2);
    container.rotation.x = -0.15;
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
            deletePopupUI();
        }
    });
    exit.setupState(hoveredStateAttributes);
    exit.setupState(idleStateAttributes);

    container.add(exit);
    objsToTest.push(exit);

    // Actual popup
    const popup = new ThreeMeshUI.Block({
        fontFamily: '/360videodemo/assets/Roboto-msdf.json',
        fontTexture: '/360videodemo/assets/Roboto-msdf.png',
        height: 1.1,
        width: 1,
        alignContent: 'left', 
        justifyContent: 'start', 
        padding: 0.1
    });

    popup.position.set(0, 0.005, 0);
    container.add(popup);

    if (selection == "transcript"){
        const popuptext = new ThreeMeshUI.Text({
            content: 'Transcript\n------ \n0:00:00 TRANSCRIPT OF VIDEO FILE:\n\n0:00:50 UNKNOWN: The dream is building machines that can go anywhere a person or animal can go, thats how I see the future',
            fontColor: new THREE.Color(0xFFFFFF),
            fontSize: 0.05
        });
        popup.add(popuptext);
    } else if (selection == "details"){
        const popuptext = new ThreeMeshUI.Text({
            content: 'Details\n------ \nAbstract \nGo face-to-face with the worlds most advanced robots and get a rare look inside Boston Dynamics top secret lab, never before open to the public...until now.\n\nRelease Date\n2017',
            fontColor: new THREE.Color(0xFFFFFF),
            fontSize: 0.05
        });
        popup.add(popuptext);
    } else if (selection == "clips"){
        // TODO: add extra popup for sign-in 
        const popuptext = new ThreeMeshUI.Text({
            content: 'Clips\n------ \n\nNo Clips Found',
            fontColor: new THREE.Color(0xFFFFFF),
            fontSize: 0.05
        });
        popup.add(popuptext);
    } else if (selection == "share"){
        const popuptext = new ThreeMeshUI.Text({
            content: 'Hello Robot\n\nDirected by David Gelb, With Marc Raibert, Produced by Ari Palitz, In The Possible (Los Angeles, CA: Within, 2017), 11 minutes\n\nTo embed your video in an LMS or other website\n------ \nhttps://video.alexanderstreet.com/watch/hello-robot',
            fontColor: new THREE.Color(0xFFFFFF),
            fontSize: 0.05
        });
        popup.add(popuptext);
    } else if (selection == "cite"){
        const popuptext = new ThreeMeshUI.Text({
            content: 'Choose a citation style\n------ \nMLA8\n\n"Hello, Robot." , directed by David Gelb., produced by Ari Palitz., Within, 2017. Alexander Street, https://video.alexanderstreet.com/watch/hello-robot.',
            fontColor: new THREE.Color(0xFFFFFF),
            fontSize: 0.05
        });
        popup.add(popuptext);
    }

}

function deletePopupUI() {
    // TODO: object visible = false? 
    if (scene.getObjectByName('popUI')){
        console.log('popup found');
    }
    const currpopup = scene.getObjectByName('popUI');
    console.log(currpopup);
    scene.remove(currpopup);
}

// MENU BUTTONS UI -------------------------------------------------------------------
function makeMenuUI() {
    // use /assets/Roboto-msdf.json for localhost
    // use /360videodemo/assets/Roboto-msdf.json for git
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
            deletePopupUI();
            makePopupUI('transcript');
        }
    });
    buttonTranscript.setupState(hoveredStateAttributes);
    buttonTranscript.setupState(idleStateAttributes);

    buttonDetails.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI();
            makePopupUI('details');
        }
    });
    buttonDetails.setupState(hoveredStateAttributes);
    buttonDetails.setupState(idleStateAttributes);

    buttonClips.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI();
            makePopupUI('clips');
        }
    });
    buttonClips.setupState(hoveredStateAttributes);
    buttonClips.setupState(idleStateAttributes);

    buttonShare.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI();
            makePopupUI('share');
        }
    });
    buttonShare.setupState(hoveredStateAttributes);
    buttonShare.setupState(idleStateAttributes);

    buttonCite.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI();
            makePopupUI('cite');
        }
    });
    buttonCite.setupState(hoveredStateAttributes);
    buttonCite.setupState(idleStateAttributes);

    // Add all buttons to menu
    menuContain.add(buttonCite, buttonShare, buttonClips, buttonDetails, buttonTranscript);
    objsToTest.push(buttonTranscript, buttonDetails, buttonClips, buttonShare, buttonCite);

}

function updateButtons() {
    let intersect;

    if (renderer.xr.isPresenting) {
        vrControl.setFromController(0, raycaster.ray);
        intersect = raycast();

        if (intersect) vrControl.setPointerAt(0, intersect.point);

    } else if (mouse.x !== null && mouse.y !== null) {
        raycaster.setFromCamera(mouse, camera);
        intersect = raycast();
    }

    if (intersect && intersect.object.isUI) {
        if (selectState) {
            intersect.object.setState('selected');
        } else {
            intersect.object.setState('hovered');
        }
    } else {
        // Call up/dismiss menu when area outside UI is clicked (2743)
        if (selectState) {
            if (scene.getObjectByName('UI')){
                deleteUI();
            } else {
                makeMenuUI();
            }    
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
