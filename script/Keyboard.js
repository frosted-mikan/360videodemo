/*
    Keyboard and input box creation for signin box
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { scene, objsToTest } from '/360videodemo/script/script.js';

var font_json_bold = "/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json";
var font_png_bold = "/360videodemo/assets/AvenirNextLTPro-Bold.png";

const colors = {
	keyboardBack: 0x858585,
	panelBack: 0xffffff,
	button: 0x363636,
	hovered: 0x1c1c1c,
	selected: 0xd24f39,
    font: 0x000000
};

let userText;

function keyboard () {
    // const keyboardContain = new THREE.Group();
    // keyboardContain.name = "keyboard";
    // scene.add(keyboardContain);

    const textPanel = new ThreeMeshUI.Block({
    	fontFamily: font_json_bold,
		fontTexture: font_png_bold,
    	width: 0.5,
    	height: 0.05,
    	backgroundColor: new THREE.Color(colors.panelBack),
    	backgroundOpacity: 1,
        alignContent: 'center'
    });

    textPanel.position.set(-0.3, 0.09, 0.1); 

    //
    userText = new ThreeMeshUI.Text({ content: '' });

    const textField = new ThreeMeshUI.Block({
    	width: 0.3,
    	height: 0.05,
    	fontSize: 0.04,
    	padding: 0.002,
    	backgroundOpacity: 0,
        fontColor: new THREE.Color(colors.font),
        alignContent: 'left'
    }).add(userText);

    textPanel.add(textField);
    textPanel.name = "keyboard";
    // keyboardContain.add(textPanel);
    scene.add(textPanel);

    // TODO: textpanel hidden overflow?
    // textPanel.setupState({
    //     state: "selected",
    //     onSet: () => {
    //         scene.getObjectByName('keysFull').visible = true;
    //     }
    // });
    // objsToTest.push(textPanel);

    makeKeyboard();
    textPanel.add(scene.getObjectByName('keysFull'));
}

function makeKeyboard() {

	keyboard = new ThreeMeshUI.Keyboard({
		fontFamily: font_json_bold,
		fontTexture: font_png_bold,
		fontSize: 0.035, 
		backgroundColor: new THREE.Color(colors.keyboardBack),
	  	backgroundOpacity: 1,
	  	backspaceTexture: '/360videodemo/assets/backspace.png',
	  	shiftTexture: '/360videodemo/assets/shift.png',
	  	enterTexture: '/360videodemo/assets/enter.png'
	});

	keyboard.position.set(0.3, -0.7, 0.3);
	keyboard.rotation.x = -0.55;
    keyboard.name = "keysFull";
    // keyboard.visible = false;
	scene.add(keyboard);

	//

	keyboard.keys.forEach((key)=> {

		objsToTest.push(key);
        key.name = "keys";

		key.setupState({
			state: 'idle',
			attributes: {
				offset: 0,
				backgroundColor: new THREE.Color( colors.button ),
    			backgroundOpacity: 1
			}
		});

		key.setupState({
			state: 'hovered',
			attributes: {
				offset: 0,
				backgroundColor: new THREE.Color( colors.hovered ),
				backgroundOpacity: 1
			}
		});

		key.setupState({
			state: 'selected',
			attributes: {
				offset: -0.009,
				backgroundColor: new THREE.Color( colors.selected ),
				backgroundOpacity: 1
			},
			// triggered when the user clicked on a keyboard's key
			onSet: ()=> {

				// if the key have a command (eg: 'backspace', 'switch', 'enter'...)
				// special actions are taken
				if ( key.info.command ) {

					switch( key.info.command ) {
						case 'enter' :
							userText.set({ content: userText.content += '\n' });
							break;

						case 'space' :
							userText.set({ content: userText.content += ' ' });
							break;

						case 'backspace' :
							if ( !userText.content.length ) break
							userText.set({
								content: userText.content.substring(0, userText.content.length - 1) || ""
							});
							break;

						case 'shift' :
							keyboard.toggleCase();
							break;

					};

				// print a glyph, if any
				} else if ( key.info.input ) {

					userText.set({ content: userText.content += key.info.input });

				};

			}
		});

	});

};

export { keyboard };
