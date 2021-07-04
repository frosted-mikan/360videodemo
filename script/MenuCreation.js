/*
    Creates and maintains menu/popups/video controls
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { scene, objsToTest, dragObjs } from '/360videodemo/script/script.js';
import { deletePopupUI, makeUnderlines, showUnder, showPop, makeVideoControls } from '/360videodemo/script/MenuHelpers.js';
import { keyboard, deleteKeyboard } from '/360videodemo/script/Keyboard.js';
import { makeClips, makeTranscriptText } from '/360videodemo/script/PopupContent.js';


let popupsArr; //toggle between the popups
let underArr; //toggle between underlines

// Load the fonts 
var font_json_bold = "/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json";
var font_png_bold = "/360videodemo/assets/AvenirNextLTPro-Bold.png";
var font_json = "/360videodemo/assets/AvenirNextLTPro-Regular-msdf.json";
var font_png = "/360videodemo/assets/AvenirNextLTPro-Regular.png";


// Create Popup UI - called from makeMenuUI() --------------------------------------------------------------
function makePopupUI() {
    const container = new THREE.Group({ //contains all popup UI
        height: 0.8,
        width: 1.8, 
        alignContent: 'right'
    }); 
    const exitContain = new ThreeMeshUI.Block({ //contains exit button
        fontFamily: font_json_bold, 
        fontTexture: font_png_bold,
        alignContent: 'right',
        justifyContent: 'start',
        height: 0.8,
        width: 1.8,
        padding: 0.05,
        backgroundOpacity: 1
    });
    container.name = "popUI"; 
    container.position.set(0, 0.5, -0.3);
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
            backgroundColor: new THREE.Color(0xffffff)
        },
    };

    // Exit button 
    const exitIcon = new THREE.TextureLoader().load('/360videodemo/assets/exit.png');
    const exit = new ThreeMeshUI.Block({
        width: 0.08,
        height: 0.08,
        justifyContent: 'center',
        alignContent: 'center',
        backgroundTexture: exitIcon
    });

    const selectedAttributes = {
        offset: 0.02,
        backgroundColor: new THREE.Color(0xc72408),
        backgroundOpacity: 1
    };

    exit.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            deletePopupUI(exit, 'exit');
            //if keyboard was created, delete it 
            if (scene.getObjectByName('keysFull')) deleteKeyboard();
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
        fontSize: 0.04
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
    const popSign = new ThreeMeshUI.Block({
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        height: 0.8,
        width: 0.6,
        alignContent: 'left', 
        justifyContent: 'start', 
        padding: 0.08,
        fontColor: new THREE.Color(0xFFFFFF),
        fontSize: 0.05,
        backgroundColor: new THREE.Color(0xd24f39),
        backgroundOpacity: 1
    });
    popSign.add(
        new ThreeMeshUI.Text({
            content: 'Sign in'
        })
    );
    const signText = new ThreeMeshUI.Text({
        content: 'Email:',
        fontSize: 0.04
    });
    const signText2 = new ThreeMeshUI.Text({
        content: 'Password:',
        fontSize: 0.04
    });
    popSign.add(signText, signText2);
    popSign.name = 'popsign';
    signText.position.set(-0.14, -0.08, 0);
    signText2.position.set(-0.24, -0.25, 0);
    popSign.position.set(1.25, 0, 0); 

    // Add keyboard for input to signin box
    keyboard();
    popSign.add(scene.getObjectByName('keyboard'));
    //

    //Add exit to signin popup (deletePopupUI to parent obj)
    // Signup Exit button 
    const signExitContain = new ThreeMeshUI.Block({ //contains exit button
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        alignContent: 'right',
        justifyContent: 'start',
        height: 0.8,
        width: 0.6,
        padding: 0.05,
        backgroundOpacity: 0
    });
    const signExit = new ThreeMeshUI.Block({
        width: 0.08,
        height: 0.08,
        justifyContent: 'center',
        alignContent: 'center',
        backgroundTexture: exitIcon
    });

    signExit.setupState({
        state: "selected",
        attributes: selectedAttributes,
        onSet: () => {
            //if keyboard was created, delete it 
            if (scene.getObjectByName('keysFull')) deleteKeyboard();

            deletePopupUI(signExit, 'sign'); 
        }
    });
    signExit.setupState({
        state: "hovered",
        atributes: {
            backgroundColor: new THREE.Color(0xc2c2c2),
            backgroundOpacity: 1
        }
    });
    signExit.setupState(idleStateAttributes);

    signExitContain.add(signExit);
    objsToTest.push(signExit);

    popSign.add(signExitContain);

    //Button on signin to submit 
    const submitBut = new ThreeMeshUI.Block({
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        fontColor: new THREE.Color(0x000000),
        alignContent: 'center',
        justifyContent: 'center',
        height: 0.1, 
        width: 0.2, 
        offset: 0.03,
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
            //delete the keyboard
            if (scene.getObjectByName('keysFull')) deleteKeyboard();

            //delete existing children of popClips (including popSign)
            popClips.remove(popSign);
            const signin = scene.getObjectByName('signin');
            const text = scene.getObjectByName('clipstext');
            popClips.remove(signin, text);

            //add new clip static text
            makeClips();
            popClips.add(scene.getObjectByName('newclips'));
        }
    });
    submitBut.setupState({        
        state: "hovered",
        atributes: {
            backgroundColor: new THREE.Color(0xd3d3d3),
            backgroundOpacity: 1
        }
    });
    submitBut.setupState({        
        state: "idle",
        attributes: {
            backgroundOpacity: 1,
            backgroundColor: new THREE.Color(0xFFFFFF)
        }
    });
    objsToTest.push(submitBut);
    popSign.add(submitBut);
    submitBut.position.set(0, -0.15, 0);

    //Add signin popup to clips popup
    popSign.visible = false;
    popClips.add(popSign); 
    
    //Button on Clips popup to signin
    const signinBut = new ThreeMeshUI.Block({
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
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
    signinBut.setupState({
        state: "idle",
        attributes: {
            backgroundColor: new THREE.Color(0xc72408)
        }
    });
    signinBut.name = 'signin';
    submitBut.name = signExit.name = 'input';
    signinBut.position.set(-0.65, 0.05, 0.03); //move to left
    objsToTest.push(signinBut);
    popClips.add(signinBut);

    // Red underline 
    const box = new THREE.PlaneGeometry(0.06, 0.02);
    const material = new THREE.MeshBasicMaterial({color: 0xd24f39});
    const plane = new THREE.Mesh(box, material);
    plane.position.set(-0.75, 0.23, 0.03);
    plane.visible = true;
    container.add(plane); 

    // Transcript Text
    makeTranscriptText();
    popTranscript.add(
        new ThreeMeshUI.Text({
            content: 'Transcript\n',
            fontFamily: font_json_bold,
            fontTexture: font_png_bold,
            fontSize: 0.055
        }),
        scene.getObjectByName('trantext')
    );

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
    const detText5 = new ThreeMeshUI.Text({
        content: 'Producer\n',
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        fontSize: 0.045
    });
    const detText6 = new ThreeMeshUI.Text({
        content: 'Ari Palitz\n',
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
        detText1, detText2, detText3, detText4, detText5, detText6
    );
    detText1.position.set(0, -0.05, 0);
    detText2.position.set(0, -0.055, 0);
    detText3.position.set(0, -0.1, 0);
    detText4.position.set(0, -0.105, 0);
    detText5.position.set(0, -0.15, 0);
    detText6.position.set(0, -0.155, 0);

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
    clipsText1.name = 'clipstext';
    popClips.add(clipsText, clipsText1);
    clipsText1.position.set(0, -0.05, 0);

    // Share Text 
    const shareText1 = new ThreeMeshUI.Text({
        content: 'Directed by David Gelb, With Marc Raibert, Produced by Ari Palitz, In The Possible (Los Angeles, CA: Within, 2017), 11 minutes\n',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    const shareText2 = new ThreeMeshUI.Text({
        content: 'To embed your video in an LMS or other website\n',
        fontFamily: font_json_bold,
        fontTexture: font_png_bold,
        fontSize: 0.045
    });
    const shareText3 = new ThreeMeshUI.Text({
        content: 'https://video.alexanderstreet.com/watch/hello-robot\n',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    const shareText4 = new ThreeMeshUI.Text({
        content: 'iframe src="https://video.alexanderstreet.com/embed...\n',
        fontFamily: font_json,
        fontTexture: font_png,
        fontSize: 0.04
    });
    // Red buttons (doesn't click)
    const redButAttributes = {
        fontFamily: '/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json',
        fontTexture: '/360videodemo/assets/AvenirNextLTPro-Bold.png',
        alignContent: 'center',
        justifyContent: 'center',
        height: 0.1, 
        width: 0.45, 
        contentDirection: 'row-reverse',
        backgroundColor: new THREE.Color(0xc72408), 
        backgroundOpacity: 1
    };
    const permalink = new ThreeMeshUI.Block(redButAttributes);
    const embed = new ThreeMeshUI.Block(redButAttributes);
    permalink.add(
        new ThreeMeshUI.Text({
            content: 'Copy Permalink'
        })
    );
    embed.add(
        new ThreeMeshUI.Text({
            content: 'Copy Embed Code'
        })
    );
    popShare.add(
        new ThreeMeshUI.Text({
            content: 'Hello Robot\n',
            fontFamily: font_json_bold,
            fontTexture: font_png_bold,
            fontSize: 0.055    
        }), shareText1, shareText2, shareText3, shareText4, permalink, embed
    );
    shareText1.position.set(0, -0.05, 0);
    shareText2.position.set(0, -0.1, 0);
    shareText3.position.set(0.05, -0.13, 0);
    shareText4.position.set(0.05, -0.2, 0);
    permalink.position.set(0.45, -0.08, 0);
    embed.position.set(0.45, -0.2, 0);

    // Cite Text
    const whiteborder = new ThreeMeshUI.Block({
        height: 0.08, 
        width: 0.45, 
        contentDirection: 'row-reverse',
        backgroundColor: new THREE.Color(0xffffff), 
        backgroundOpacity: 0.5, 
        justifyContent: 'center',
        alignContent: 'left',
        padding: 0.05,
        fontFamily: '/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json',
        fontTexture: '/360videodemo/assets/AvenirNextLTPro-Bold.png',
        fontSize: 0.05,
        fontColor: new THREE.Color(0x000000)
    });
    whiteborder.add(new ThreeMeshUI.Text({content: 'MLA8'}));
    const copycite = new ThreeMeshUI.Block(redButAttributes);
    copycite.add(
        new ThreeMeshUI.Text({
            content: 'Copy Citation'
        })
    );
    const citeText1 = new ThreeMeshUI.Text({
        content: '"Hello, Robot." , directed by David Gelb., produced by Ari Palitz., Within, 2017. Alexander Street, https://video.alexanderstreet.com/watch/hello-robot.',
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
        }), whiteborder, citeText1, copycite
    );
    whiteborder.position.set(-0.57, 0.15, 0);
    citeText1.position.set(0, -0.16, 0);
    copycite.position.set(0, -0.16, 0);
    
    // Add all popups to container
    popTranscript.visible = popDetails.visible = popClips.visible = popShare.visible = popCite.visible = false;
    container.add(popTranscript, popDetails, popClips, popShare, popCite);
    
    // Toggle visibility between popups
    popupsArr = [popTranscript, popDetails, popClips, popShare, popCite];

    // Set container to invisible as default
    container.visible = false;
}
    

// MAIN MENU BUTTONS UI CREATION -------------------------------------------------------------------
function makeMenuUI() {
    // Group which contains all menu UI
    const menuContain = new THREE.Group(); 
    menuContain.name = "UI";
    scene.add(menuContain);

    // Button Attributes
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
        }
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


    // Add all buttons to button menu container
    const buttonContain = new ThreeMeshUI.Block({
        height: 0.1, 
        width: 1.3,
        backgroundOpacity: 1,
        justifyContent: 'center',
        contentDirection: 'row-reverse' //for buttons to be horizontal
    });

    buttonContain.position.set(0, 0, -0.3) 
    buttonContain.rotation.x = -0.5;
    buttonContain.add(buttonCite, buttonShare, buttonClips, buttonDetails, buttonTranscript);
    objsToTest.push(buttonTranscript, buttonDetails, buttonClips, buttonShare, buttonCite);
    menuContain.add(buttonContain);

    // Make all underlines 
    const tranUnder = makeUnderlines(-0.52, -0.01, -0.27); 
    const detUnder = makeUnderlines(-0.26, -0.01, -0.27);
    const clipsUnder = makeUnderlines(0, -0.01, -0.27);
    const shareUnder = makeUnderlines(0.26, -0.01, -0.27);
    const citeUnder = makeUnderlines(0.52, -0.01, -0.27);

    underArr = [tranUnder, detUnder, clipsUnder, shareUnder, citeUnder];

    // Create and add video controls to menuContain 
    makeVideoControls();
    const vid = scene.getObjectByName('controlsContain');
    menuContain.add(vid);


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

    // Optional (NUVO-2745): Add entire menu as child of camera so it stays fixed in space
    // camera.add(menuContain); 
    menuContain.position.set(0, 0.88, -1); 
}

export { makeMenuUI, popupsArr, underArr };