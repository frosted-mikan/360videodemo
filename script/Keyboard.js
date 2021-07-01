/*
    Keyboard and input box creation for signin box
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { scene, objsToTest, camera } from '/360videodemo/script/script.js';

var font_json_bold = "/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json";
var font_png_bold = "/360videodemo/assets/AvenirNextLTPro-Bold.png";

const colors = {
	keyboardBack: 0x858585,
	panelBack: 0xffffff,
	button: 0x363636,
	hovered: 0xd3d3d3,
	selected: 0x1c1c1c,
    font: 0x000000
};

let userText, emailText, passText; // text will appear here
// Determines which panel is selected 
var toggle = {
	aInternal: false,
	aListener: function() {},
	set a(val) {
	  this.aInternal = val;
	  this.aListener(val);
	},
	get a() {
	  return this.aInternal;
	},
	registerListener: function(listener) {
	  this.aListener = listener;
	}
  }


function keyboard () {
    const keyboardContain = new THREE.Group();
    keyboardContain.name = "keyboard";
    scene.add(keyboardContain);

	// White input boxes
	const whiteBoxAttributes = {
    	fontFamily: font_json_bold,
		fontTexture: font_png_bold,
    	width: 0.43,
    	height: 0.05,
    	backgroundColor: new THREE.Color(colors.panelBack),
    	backgroundOpacity: 1,
        alignContent: 'center',
		hiddenOverflow: true // inputs have hidden overflow 
	};
    const emailPanel = new ThreeMeshUI.Block(whiteBoxAttributes);
    emailPanel.position.set(0, 0.14, 0.03); 
	const passPanel = new ThreeMeshUI.Block(whiteBoxAttributes);
	passPanel.position.set(0, -0.03, 0.03);
	emailPanel.name = passPanel.name = 'input';

    // User input text 
    emailText = new ThreeMeshUI.Text({content: ''});
	passText = new ThreeMeshUI.Text({content: ''});

	// Text will appear here
	const textFieldAttributes = {
    	width: 0.4,
    	height: 0.05,
    	fontSize: 0.04,
		fontFamily: font_json_bold,
		fontTexture: font_png_bold,
    	padding: 0.002,
    	backgroundOpacity: 0,
        fontColor: new THREE.Color(colors.font),
        alignContent: 'left'
	};
    const emailField = new ThreeMeshUI.Block(textFieldAttributes).add(emailText);
	const passField = new ThreeMeshUI.Block(textFieldAttributes).add(passText);
	emailField.position.set(0, 0.14, 0.03);
	passField.position.set(0, -0.03, 0.03);
	emailPanel.add(emailField);
	passPanel.add(passField);
	keyboardContain.add(emailPanel, passPanel);

	// Set up listener for which panel is selected
	userText = emailText;
	toggle.registerListener(function() {
		if (!toggle.a) userText = emailText;
		else userText = passText;
	});

	// Set panel states
	emailPanel.setupState({
		state: "idle",
		attributes: whiteBoxAttributes
	});
	emailPanel.setupState({
		state: "hovered",
		attributes: {
			backgroundColor: new THREE.Color(colors.hovered),
		}
	});
    emailPanel.setupState({
        state: "selected",
        onSet: () => {
            scene.getObjectByName('keysFull').visible = true;
			toggle.a = false
        }
    });
	passPanel.setupState({
		state: "idle",
		attributes: whiteBoxAttributes
	});
	passPanel.setupState({
		state: "hovered",
		attributes: {
			backgroundColor: new THREE.Color(colors.hovered),
		}
	});
    passPanel.setupState({
        state: "selected",
        onSet: () => {
            scene.getObjectByName('keysFull').visible = true;
			toggle.a = true;
        }
    });
    objsToTest.push(emailPanel, passPanel);
	makeKeyboard();

}

// Make the actual keyboard
function makeKeyboard() {
	const keyboard = new ThreeMeshUI.Keyboard({
		fontFamily: font_json_bold,
		fontTexture: font_png_bold,
		fontSize: 0.035, 
		backgroundColor: new THREE.Color(colors.keyboardBack),
	  	backgroundOpacity: 1,
	  	backspaceTexture: '/360videodemo/assets/backspace.png',
	  	shiftTexture: '/360videodemo/assets/shift.png',
	  	enterTexture: '/360videodemo/assets/enter.png'
	});

    keyboard.name = "keysFull";
    keyboard.visible = false;
	scene.add(keyboard);
	camera.add(keyboard); //make keyboard fixed in view
	keyboard.position.set(0, -0.5, -1.12);
	keyboard.rotation.x = -0.55;

	//

	keyboard.keys.forEach((key)=> {
		objsToTest.push(key);
        key.name = "keys";

		key.setupState({
			state: 'idle',
			attributes: {
				offset: 0,
				backgroundColor: new THREE.Color(colors.button),
    			backgroundOpacity: 1
			}
		});

		key.setupState({
			state: 'hovered',
			attributes: {
				offset: 0,
				backgroundColor: new THREE.Color(colors.hovered),
				backgroundOpacity: 1
			}
		});

		key.setupState({
			state: 'selected',
			attributes: {
				offset: -0.009,
				backgroundColor: new THREE.Color(colors.selected),
				backgroundOpacity: 1
			},
			// triggered when the user clicked on a keyboard's key
			onSet: ()=> {
				if (key.info.command) {

					switch(key.info.command) {
						case 'enter' :
							userText.set({content: userText.content += '\n'});
							break;

						case 'space' :
							userText.set({content: userText.content += ' '});
							break;

						case 'backspace' :
							if (!userText.content.length) break
							userText.set({
								content: userText.content.substring(0, userText.content.length - 1) || ""
							});
							break;

						case 'shift' :
							keyboard.toggleCase();
							break;

					};

				// print a glyph, if any
				} else if (key.info.input) {
					userText.set({content: userText.content += key.info.input});
				};
			}
		});

	});

};

export { keyboard };
