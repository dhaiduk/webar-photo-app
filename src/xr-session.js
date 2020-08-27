import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import img1 from './photos/Photo_Color.1000.png';
import img2 from './photos/Photo_Color.1001.png';
import img3 from './photos/Photo_Color.1002.png';
import img4 from './photos/Photobooth0.png';
import img5 from './photos/Photobooth1.png';
import img6 from './photos/Photobooth2.png';
import img7 from './photos/Shem_Photobooth3_WO_shadow.png';
import img8 from './photos/Solomon40.png';

let container; //, labelContainer;
let camera, scene, renderer, light;
let controller;

let hitTestSource = null;
let hitTestSourceRequested = false;

let reticle;

let width, height;

let geometry;

let imgArray = [img1, img2, img3, img4, img5, img6, img7, img8];

let count = 0;
const WIDTH_IMG = 1.920;
const HEIGHT_IMG = 1.080;

function initReticle() {
  let ring = new THREE.RingBufferGeometry(0.045, 0.05, 32).rotateX(- Math.PI / 2);
  let dot = new THREE.CircleBufferGeometry(0.005, 32).rotateX(- Math.PI / 2);
  reticle = new THREE.Mesh(
    BufferGeometryUtils.mergeBufferGeometries([ring, dot]),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 20);
}

function initLight() {
  light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  light.position.set(0.5, 1, 0.25);
}

function initScene() {
  scene = new THREE.Scene();
}

function initGeometry() {
  geometry = new THREE.PlaneBufferGeometry(1, 1, 1);
}

function initXR() {
  container = document.createElement('div');
  document.body.appendChild(container);

  width = window.innerWidth;
  height = window.innerHeight;

  initScene();

  initCamera();

  initLight();
  scene.add(light);

  initRenderer()
  container.appendChild(renderer.domElement);

  document.body.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  initGeometry();

  controller = renderer.xr.getController(0);
  controller.addEventListener('select', onSelect);
  scene.add(controller);

  initReticle();
  scene.add(reticle);

  window.addEventListener('resize', onWindowResize, false);
  animate()
}

function onSelect() {

  if (reticle.visible) {

    if (count <= 7) count++; else count = 0;
    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: THREE.ImageUtils.loadTexture(imgArray[count]), transparent: true, opacity: 1, color: 0xffffff }));
    mesh.position.setFromMatrixPosition(reticle.matrix);
    mesh.scale.set(WIDTH_IMG * 5, HEIGHT_IMG * 5, 1);
    scene.add(mesh);

  }

}

function onWindowResize() {
  width = window.innerWidth;
  height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {

  if (frame) {

    var referenceSpace = renderer.xr.getReferenceSpace();
    var session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {

      session.requestReferenceSpace('viewer').then(function (referenceSpace) {

        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {

          hitTestSource = source;

        });

      });

      session.addEventListener('end', function () {

        hitTestSourceRequested = false;
        hitTestSource = null;

      });

      hitTestSourceRequested = true;

    }

    if (hitTestSource) {

      var hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length) {

        var hit = hitTestResults[0];

        reticle.visible = true;
        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

      } else {

        reticle.visible = false;

      }

    }

  }

  renderer.render(scene, camera);

}

export { initXR }