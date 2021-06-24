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
let underArr; //toggle between underlines


const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();
mouse.x = mouse.y = null;

let selectState = false; // whether buttons have been selected


// EventListeners for mouse
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
// TESTING UI
// document.querySelector('button').addEventListener('click', openFullscreen);

// Load the fonts 
var font_json_bold = "/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json";
var font_png_bold = "/360videodemo/assets/AvenirNextLTPro-Bold.png";
var font_json = "/360videodemo/assets/AvenirNextLTPro-Regular-msdf.json";
var font_png = "/360videodemo/assets/AvenirNextLTPro-Regular.png";

openFullscreen(); // TESTING



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
    renderer.localClippingEnabled = true; // FOR HIDDENOVERFLOW
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

    // Add video to div container
    container.appendChild(renderer.domElement);

    // Orbit controls (for no VR)
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

    // Set up VR controls
    vrControl = VRControl(renderer, camera, scene);
    scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);
    vrControl.controllers[0].addEventListener('selectstart', onSelectStart);
    vrControl.controllers[0].addEventListener('selectend', onSelectEnd);

    scene.add(camera);

}

// For dragging in VR 
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

// Resizing window in no VR
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Render and animate 
function animate() {
    renderer.setAnimationLoop(render);
}
function render() {
    ThreeMeshUI.update();
    orbitControls.update(); // for OrbitControls
    renderer.render(scene, camera);
    updateButtons(); // for buttons 
}

// Create Popup UI - called from makeMenuUI() --------------------------------------------------------------
function makePopupUI() {
    const container = new THREE.Group({ //contains all popup UI
        height: 0.8,
        width: 1.8, 
        alignContent: 'right',
        hiddenOverflow: true // container must be a Block
    }); 
    const exitContain = new ThreeMeshUI.Block({ //contains exit button
        fontFamily: font_json_bold, 
        fontTexture: font_png_bold,
        alignContent: 'right',
        justifyContent: 'start',
        height: 0.8,
        width: 1.8,
        padding: 0.05
    });
    container.name = "popUI"; 
    container.position.set(0, 1, 1);
    // container.rotation.x = 0.25;
    container.add(exitContain);
    scene.add(container);

    // Options for component.setupState().
    const hoveredStateAttributes = {
        state: "hovered",
        attributes: {
            backgroundColor: new THREE.Color(0xd24f39),
            backgroundOpacity: 1
        },
    };

    const idleStateAttributes = {
        state: "idle",
        attributes: {
            backgroundOpacity: 1,
            backgroundColor: new THREE.Color(0x000000)
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
        backgroundColor: new THREE.Color(0xc72408),
        backgroundOpacity: 1
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
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        height: 0.8,
        width: 1.8,
        alignContent: 'left', 
        justifyContent: 'start', 
        padding: 0.1,
        fontColor: new THREE.Color(0xFFFFFF),
        fontSize: 0.04, 
        backgroundOpacity: 0.5
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

    // //Signin popup block
    // const popSign = new ThreeMeshUI.Block(popupAttributes);
    // popSign.add(
    //     new ThreeMeshUI.Text({
    //         content: 'Sign in:\n------\n\nemail: *****\npassword: ******'
    //     })
    // );
    // popSign.position.set(1.1, 0.005, 0); //move to right

    // //Add exit to signin popup (deletePopupUI to parent obj)
    // // Signup Exit button 
    // const signExitContain = new ThreeMeshUI.Block({ //contains exit button
    //     fontFamily: font_json_bold,
    //     fontTexture: font_png_bold,
    //     alignContent: 'right',
    //     justifyContent: 'start',
    //     height: 1.1,
    //     width: 1,
    //     padding: 0.05
    // });
    // const signExit = new ThreeMeshUI.Block({
    //     width: 0.08,
    //     height: 0.08,
    //     justifyContent: 'center',
    //     alignContent: 'center'
    // });
    // signExit.add(
    //     new ThreeMeshUI.Text({content:"X"})
    // );

    // signExit.setupState({
    //     state: "selected",
    //     attributes: selectedAttributes,
    //     onSet: () => {
    //         deletePopupUI(signExit); 
    //     }
    // });
    // signExit.setupState(hoveredStateAttributes);
    // signExit.setupState(idleStateAttributes);

    // signExitContain.add(signExit);
    // objsToTest.push(signExit);

    // popSign.add(signExitContain);

    // //Button on signin to submit 
    // const submitBut = new ThreeMeshUI.Block({
    //     fontFamily: font_json_bold,
    //     fontTexture: font_png_bold,
    //     alignContent: 'center',
    //     justifyContent: 'center',
    //     height: 0.1, 
    //     width: 0.2, 
    //     contentDirection: 'row-reverse'
    // });
    // submitBut.add(
    //     new ThreeMeshUI.Text({
    //         content: 'Submit'
    //     })
    // );
    // //Config for submit button 
    // submitBut.setupState({
    //     state: "selected",
    //     attributes:selectedAttributes,
    //     onSet: () => {
    //         //delete existing children of popClips (including popSign)
    //         popClips.remove(popSign);
    //         const signin = scene.getObjectByName('signin');
    //         const text = scene.getObjectByName('clipstext');
    //         popClips.remove(signin, text);

    //         //add new clip static text
    //         popClips.add(
    //             new ThreeMeshUI.Text({
    //                 content: 'Clips\n------ \n\n 0:00:00 A new clip here'
    //             })
    //         );    
    //     }
    // });
    // submitBut.setupState(hoveredStateAttributes);
    // submitBut.setupState(idleStateAttributes);
    // objsToTest.push(submitBut);
    // popSign.add(submitBut);

    // //Add signin popup to clips popup
    // popSign.visible = false;
    // popClips.add(popSign); 
    
    // //Button on Clips popup to signin
    // const signinBut = new ThreeMeshUI.Block({
    //     fontFamily: font_json_bold,
    //     fontTexture: font_png_bold,
    //     alignContent: 'center',
    //     justifyContent: 'center',
    //     height: 0.1, 
    //     width: 0.3, 
    //     contentDirection: 'row-reverse'
    // });
    // signinBut.add(
    //     new ThreeMeshUI.Text({
    //         content: 'Create Clip'
    //     })
    // );

    // //Config for signin button 
    // signinBut.setupState({
    //     state: "selected",
    //     attributes:selectedAttributes,
    //     onSet: () => {
    //         //make signin popup appear
    //         popSign.visible = true;
    //     }
    // });
    // signinBut.setupState(hoveredStateAttributes);
    // signinBut.setupState(idleStateAttributes);
    // signinBut.name = 'signin';
    // objsToTest.push(signinBut);
    // popClips.add(signinBut);

    // Red underline 
    const box = new THREE.PlaneGeometry(0.06, 0.02);
    const material = new THREE.MeshBasicMaterial({color: 0xd24f39});
    const plane = new THREE.Mesh(box, material);
    plane.position.set(-0.75, 0.23, 0.03);
    plane.visible = true;
    container.add(plane); 

    // Transcript Text
    const tranText = new ThreeMeshUI.Text({
        content: '0:00:00 TRANSCRIPT OF VIDEO FILE:\n\n0:00:50 UNKNOWN: The dream is building machines that can go anywhere a person or animal can go, thats how I see the future',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    popTranscript.add(
        new ThreeMeshUI.Text({
            content: 'Transcript\n',
            fontFamily: font_json_bold,
            fontTexture: font_png_bold,
            fontSize: 0.055
        }), 
        tranText
    );
    tranText.position.set(0, -0.05, 0);

    // Details Text
    const detText1 = new ThreeMeshUI.Text({
        content: 'Abstract \n',
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        fontSize: 0.045
    });
    const detText2 = new ThreeMeshUI.Text({
        content: 'Go face-to-face with the worlds most advanced robots and get a rare look inside Boston Dynamics top secret lab, never before open to the public...until now.\n',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    const detText3 = new ThreeMeshUI.Text({
        content: 'Release Date\n',
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        fontSize: 0.045
    });
    const detText4 = new ThreeMeshUI.Text({
        content: '2017\n',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    })
    popDetails.add(
        new ThreeMeshUI.Text({
            content: 'Details\n',
            fontFamily: font_json_bold,
            fontTexture: font_png_bold,
            fontSize: 0.055
        }),
        detText1, detText2, detText3, detText4
    );
    detText1.position.set(0, -0.05, 0);
    detText2.position.set(0, -0.055, 0);
    detText3.position.set(0, -0.1, 0);
    detText4.position.set(0, -0.105, 0);

    // Clips Text
    const clipsText1 = new ThreeMeshUI.Text({
        content: 'No Clips Found\n',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    })
    const clipsText = new ThreeMeshUI.Text({
        content: 'Clips\n',
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        fontSize: 0.055
    });
    clipsText.name = 'clipstext';
    popClips.add(clipsText, clipsText1);
    clipsText1.position.set(0, -0.05, 0);

    // Share Text 
    const shareText1 = new ThreeMeshUI.Text({
        content: 'Directed by David Gelb, With Marc Raibert, Produced by Ari Palitz, In The Possible (Los Angeles, CA: Within, 2017), 11 minutes\n\nTo embed your video in an LMS or other website\n------ \nhttps://video.alexanderstreet.com/watch/hello-robot',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    popShare.add(
        new ThreeMeshUI.Text({
            content: 'Hello Robot\n',
            fontFamily: font_json_bold,
            fontTexture: font_png_bold,
            fontSize: 0.055    
        }), shareText1
    );
    shareText1.position.set(0, -0.05, 0);

    // Cite Text
    const citeText1 = new ThreeMeshUI.Text({
        content: 'MLA8\n\n"Hello, Robot." , directed by David Gelb., produced by Ari Palitz., Within, 2017. Alexander Street, https://video.alexanderstreet.com/watch/hello-robot.',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    popCite.add(
        new ThreeMeshUI.Text({
            content: 'Choose a citation style\n',
            fontFamily: font_json_bold,
            fontTexture: font_png_bold,
            fontSize: 0.055    
        }), citeText1
    );
    citeText1.position.set(0, -0.05, 0);
    
    // Add all popups to container
    popTranscript.visible = popDetails.visible = popClips.visible = popShare.visible = popCite.visible = false;
    container.add(popTranscript, popDetails, popClips, popShare, popCite);
    
    // Toggle visibility between popups
    popupsArr = [popTranscript, popDetails, popClips, popShare, popCite];

    // Set container to invisible as default
    container.visible = false;
}

function deletePopupUI(obj) {
    //obj: exit, obj.parent: exitContain, obj.parent.parent: container or popSign
    const curr = obj.parent.parent;
    curr.visible = false;
}

// Make an underline, given coordinates 
function makeUnderlines(x, y, z) {
    const box = new THREE.PlaneGeometry(0.04, 0.007);
    const material = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    const plane = new THREE.Mesh(box, material);
    plane.position.set(x, y, z);
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
    

// MENU BUTTONS UI -------------------------------------------------------------------
function makeMenuUI() {
    // Group which contains all menu UI
    const menuContain = new THREE.Group(); 
    // const menuContain = new ThreeMeshUI.Block({
    //     height: 1,
    //     width: 1
    // });
    menuContain.name = "UI";
    scene.add(menuContain);
    // menuContain.position.set(0, 0, -1.5) 

    // BUTTONS
    const buttonOptions = {
        width: 0.26,
        height: 0.1,
        justifyContent: 'center',
        alignContent: 'center',
        padding: 0.04,
        fontSize: 0.03,
        backgroundOpacity: 0, 
        fontFamily: font_json_bold,
        fontTexture: font_png_bold
    };

    // Options for component.setupState().
    const hoveredStateAttributes = {
        state: "hovered",
        attributes: {
            backgroundColor: new THREE.Color(0xd24f39),
            backgroundOpacity: 1
        },
    };

    const idleStateAttributes = {
        state: "idle",
        attributes: {
            backgroundOpacity: 0
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
        backgroundColor: new THREE.Color(0xc72408),
        backgroundOpacity: 1
    };

    buttonTranscript.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(0);
            showUnder(0);
        }
    });
    buttonTranscript.setupState(hoveredStateAttributes);
    buttonTranscript.setupState(idleStateAttributes);

    buttonDetails.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(1);
            showUnder(1);
        }
    });
    buttonDetails.setupState(hoveredStateAttributes);
    buttonDetails.setupState(idleStateAttributes);

    buttonClips.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(2);
            showUnder(2);
        }
    });
    buttonClips.setupState(hoveredStateAttributes);
    buttonClips.setupState(idleStateAttributes);

    buttonShare.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(3);
            showUnder(3);
        }
    });
    buttonShare.setupState(hoveredStateAttributes);
    buttonShare.setupState(idleStateAttributes);

    buttonCite.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            showPop(4);
            showUnder(4);
        }
    });
    buttonCite.setupState(hoveredStateAttributes);
    buttonCite.setupState(idleStateAttributes);


    // Add all buttons to button menu 
    const buttonContain = new ThreeMeshUI.Block({
        height: 0.1, 
        width: 1.3,
        backgroundOpacity: 1,
        justifyContent: 'center',
        contentDirection: 'row-reverse' //for buttons to be horizontal
    });
    // buttonContain.position.set(0, 1, -1); //set position of main menu //use z=-1? 
    buttonContain.position.set(0, 0, -1.5) 
    buttonContain.rotation.x = -0.55;
    // buttonContain.position.set(0, 1.5, 1); //TESTING
    buttonContain.add(buttonCite, buttonShare, buttonClips, buttonDetails, buttonTranscript);
    objsToTest.push(buttonTranscript, buttonDetails, buttonClips, buttonShare, buttonCite);
    menuContain.add(buttonContain);

    // Make all underlines 
    const tranUnder = makeUnderlines(-0.52, 1.47, 1.03); 
    const detUnder = makeUnderlines(-0.26, 1.47, 1.03);
    const clipsUnder = makeUnderlines(0, 1.47, 1.03);
    const shareUnder = makeUnderlines(0.26, 1.47, 1.03);
    const citeUnder = makeUnderlines(0.52, 1.47, 1.03);
    underArr = [tranUnder, detUnder, clipsUnder, shareUnder, citeUnder];


    // Create video controls: play/pause, rewind and fastforward 
    // container for all video controls
    const controlsContain = new ThreeMeshUI.Block({
        height: 0.15,
        width: 1, 
        justifyContent:'center',
        contentDirection: 'row-reverse',
        backgroundOpacity: 0,
        margin: 0.03
    });
    controlsContain.position.set(0, 0.5, 1);
    menuContain.add(controlsContain);

    // New Idle State properties for video controls
    const idleStateControls = {
        state: "idle",
        attributes: {
            backgroundColor: new THREE.Color(0xFFFFFF)
        }
    };
    // Play/pause button
    const playpause = new ThreeMeshUI.Block({
        height: 0.1,
        width: 0.1,
        justifyContent: 'start',
        alignContent: 'center',
        padding: 0.02,
        margin: 0.02
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
    playpause.setupState(idleStateControls);
    controlsContain.add(playpause);
    objsToTest.push(playpause);

    // Fastfoward button
    const fastForward = new ThreeMeshUI.Block({
        height: 0.1,
        width: 0.1,
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
        height: 0.1,
        width: 0.1,
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

// Toggle visibility of the chosen popup
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
        if (object.name != 'popUI' && object.name != 'underline') object.visible = true;
    });
}

let curr; // keep track of current object selected

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
