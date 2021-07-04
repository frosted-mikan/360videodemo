/*
    Extra content for the popups to resemble NUVO
*/

import * as THREE from 'https://cdn.skypack.dev/three@0.129.0';
import { scene } from '/360videodemo/script/script.js';

// Create new clips for clips popup after signin 
function makeClips() {
    // Group with all elements 
    const clipsAll = new THREE.Group();
    
    // Red Create clip button (doesn't click)
    const createClip = new ThreeMeshUI.Block({
        fontFamily: '/360videodemo/assets/AvenirNextLTPro-Bold-msdf.json',
        fontTexture: '/360videodemo/assets/AvenirNextLTPro-Bold.png',
        alignContent: 'center',
        justifyContent: 'center',
        height: 0.1, 
        width: 0.3, 
        contentDirection: 'row-reverse',
        backgroundColor: new THREE.Color(0xc72408), 
        backgroundOpacity: 1
    });
    createClip.add(
        new ThreeMeshUI.Text({
            content: 'Create Clip'
        })
    );
    clipsAll.add(createClip);
    createClip.position.set(0.5, 0.26, 0.03);
    
    // Outer container with two columns 
    const clipsContain = new ThreeMeshUI.Block({ 
        height: 0.5,
        width: 1.6,
        padding: 0.05,
        backgroundOpacity: 0, 
        contentDirection: 'row-reverse'
    });
    clipsAll.name = "newclips"; 
    clipsAll.add(clipsContain);
    clipsContain.position.set(0.05, -0.05, 0.03);
    scene.add(clipsAll);
    
    // First column 
    const firstCol = new ThreeMeshUI.Block({
        height: 0.5,
        width: 0.8,
        alignContent: 'left',
        backgroundOpacity: 0
    });
    
    // Second column 
    const secCol = new ThreeMeshUI.Block({
        height: 0.5,
        width: 0.8,
        alignContent: 'left',
        backgroundOpacity: 0 
    });
    clipsContain.add(firstCol, secCol);
    
    // New Clips
    const newclip = new THREE.TextureLoader().load('/360videodemo/assets/clipimg.png');
    const clipAttributes = {
        width: 0.6,
        height: 0.22,
        margin: 0.02,
        padding: 0.02,
        backgroundTexture: newclip
    };
    const clip1 = new ThreeMeshUI.Block(clipAttributes);
    const clip2 = new ThreeMeshUI.Block(clipAttributes);
    const clip3 = new ThreeMeshUI.Block(clipAttributes);
    const clip4 = new ThreeMeshUI.Block(clipAttributes);

    firstCol.add(clip1, clip2);
    secCol.add(clip3, clip4);
}

// Create body of Transcript popup
function makeTranscriptText() {
    //Group with all elements 
    const tranAll = new THREE.Group();
    tranAll.name = 'trantext';
    scene.add(tranAll);
    
    //Outer container (row)
    const tranContain = new ThreeMeshUI.Block({ 
        height: 0.5,
        width: 1.6,
        padding: 0.05,
        backgroundOpacity: 1, 
        contentDirection: 'row-reverse'
    });
    tranContain.position.set(0.05, -0.05, 0);
    tranAll.add(tranContain);
    
    //Text column 
    const firstCol = new ThreeMeshUI.Block({
        height: 0.5,
        width: 1.3,
        alignContent: 'left',
        backgroundOpacity: 0, 
        fontFamily: '/360videodemo/assets/AvenirNextLTPro-Regular-msdf.json',
        fontTexture: '/360videodemo/assets/AvenirNextLTPro-Regular.png',
        fontSize: 0.04
    });
    
    //Time codes column
    const secCol = new ThreeMeshUI.Block({
        height: 0.5,
        width: 0.3,
        alignContent: 'center',
        backgroundOpacity: 0
    });
    tranContain.add(firstCol, secCol);

    //Time codes 
    const timeAttributes = {
        height: 0.06,
        width: 0.22,
        backgroundOpacity: 0.7,
        backgroundColor: new THREE.Color(0xffffff),
        fontFamily: '/360videodemo/assets/AvenirNextLTPro-Regular-msdf.json',
        fontTexture: '/360videodemo/assets/AvenirNextLTPro-Regular.png',
        fontSize: 0.04,
        padding: 0.02,
        margin: 0.02,
        fontColor: new THREE.Color(0x000000)
    };
    const time1 = new ThreeMeshUI.Block(timeAttributes);
    time1.add(new ThreeMeshUI.Text({content: '00:00:00'}));
    const time2 = new ThreeMeshUI.Block(timeAttributes);
    time2.add(new ThreeMeshUI.Text({content: '00:01:35'}));
    const time3 = new ThreeMeshUI.Block(timeAttributes);
    time3.add(new ThreeMeshUI.Text({content: '00:01:50'}));
    const time4 = new ThreeMeshUI.Block(timeAttributes);
    time4.add(new ThreeMeshUI.Text({content: '00:01:55'}))
    secCol.add(time1, time2, time3, time4);
    
    //Transcript text
    const text1 = new ThreeMeshUI.Text({content: 'TRANSCRIPT OF VIDEO FILE:\n'});
    text1.position.set(0, -0.038, 0);
    const text2 = new ThreeMeshUI.Text({content: 'UNKNOWN: (inaudible)\n'});
    text2.position.set(0, -0.09, 0);
    const text3 = new ThreeMeshUI.Text({content: 'UNKNOWN: How bad was it?\n'});
    text3.position.set(0,-0.15, 0);
    const text4 = new ThreeMeshUI.Text({content: 'UNKNOWN: Its sliced, I dont think were gonna be able to fix this one, this is gonna go into this scrap pile but well make more.'});
    text4.position.set(0, -0.2, 0);
    firstCol.add(text1, text2, text3, text4);

}

export { makeClips, makeTranscriptText };
