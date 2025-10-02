import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { PointerLockControls } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/controls/PointerLockControls.js';

const canvas = document.getElementById('scene');
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1018);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

const clock = new THREE.Clock();

const room = {
  width: 14,
  depth: 14,
  height: 6,
};

const playerHeight = 1.6;
controls.getObject().position.set(0, playerHeight, 6);

const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const tmpVec = new THREE.Vector3();
const forwardDir = new THREE.Vector3();
const sideDir = new THREE.Vector3();
const cameraPos = new THREE.Vector3();

const objectStates = new Map();
let carriedObject = null;

initLights();
initRoom();
createProps();

resize();
window.addEventListener('resize', resize);

startButton.addEventListener('click', () => {
  controls.lock();
});

controls.addEventListener('lock', () => {
  overlay.classList.add('hidden');
});

controls.addEventListener('unlock', () => {
  overlay.classList.remove('hidden');
});

document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      moveState.forward = true;
      break;
    case 'ArrowDown':
      moveState.backward = true;
      break;
    case 'ArrowLeft':
      moveState.left = true;
      break;
    case 'ArrowRight':
      moveState.right = true;
      break;
    case 'KeyE':
      if (carriedObject) {
        dropCarried();
      } else {
        tryPickup();
      }
      break;
    default:
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
      moveState.forward = false;
      break;
    case 'ArrowDown':
      moveState.backward = false;
      break;
    case 'ArrowLeft':
      moveState.left = false;
      break;
    case 'ArrowRight':
      moveState.right = false;
      break;
    default:
      break;
  }
});

document.addEventListener('click', () => {
  if (!controls.isLocked) {
    return;
  }

  if (carriedObject) {
    throwCarried();
  }
});

function initLights() {
  const ambient = new THREE.AmbientLight(0xbfc1ff, 0.4);
  scene.add(ambient);

  const spot = new THREE.SpotLight(0xffffff, 1.1, 40, Math.PI / 5, 0.3, 1.2);
  spot.position.set(4, room.height - 0.5, 4);
  spot.castShadow = true;
  spot.shadow.bias = -0.0001;
  scene.add(spot);

  const fill = new THREE.PointLight(0x4477ff, 0.25, 20);
  fill.position.set(-4, 2.5, -3);
  scene.add(fill);
}

function initRoom() {
  const floorTex = new THREE.TextureLoader().load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r162/examples/textures/hardwood2_diffuse.jpg');
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(6, 6);
  floorTex.anisotropy = 8;

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.7,
    metalness: 0.05,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.width, room.depth), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b1f2d,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.BackSide,
  });

  const roomGeo = new THREE.BoxGeometry(room.width, room.height, room.depth);
  const roomMesh = new THREE.Mesh(roomGeo, wallMaterial);
  roomMesh.position.y = room.height / 2;
  roomMesh.receiveShadow = true;
  scene.add(roomMesh);

  const rug = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 0.01, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a2f55, roughness: 0.8 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.005, 0);
  rug.receiveShadow = true;
  scene.add(rug);
}

function createProps() {
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.15, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x353846, roughness: 0.6 })
  );
  table.position.set(-2, 1.05, -2);
  table.castShadow = true;
  table.receiveShadow = true;
  scene.add(table);

  const tableStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 1.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a2e3d, roughness: 0.7 })
  );
  tableStand.position.set(-2, 0.5, -2);
  tableStand.castShadow = true;
  tableStand.receiveShadow = true;
  scene.add(tableStand);

  const couch = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.2, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x2a3a4d, roughness: 0.85 })
  );
  couch.position.set(3, 0.6, 2.5);
  couch.castShadow = true;
  couch.receiveShadow = true;
  scene.add(couch);

  const lampStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1.2, 20),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3, metalness: 0.5 })
  );
  lampStand.position.set(0, 0.6, -3.5);
  lampStand.castShadow = true;
  scene.add(lampStand);

  const lampShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 0.7, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xf1e7c6, roughness: 0.5, side: THREE.DoubleSide })
  );
  lampShade.position.set(0, 1.3, -3.5);
  lampShade.castShadow = true;
  scene.add(lampShade);

  const props = [
    createGrabbableBox(new THREE.Vector3(-1.8, 1.2, -2), 0xff8a5c, 0.35),
    createGrabbableBox(new THREE.Vector3(-2.3, 1.2, -2.5), 0x6ddccf, 0.3),
    createGrabbableSphere(new THREE.Vector3(0.5, 0.5, 0.5), 0x9ad5ff, 0.28),
    createGrabbableSphere(new THREE.Vector3(2.5, 0.5, -1.5), 0xffd670, 0.32),
  ];

  props.forEach((mesh) => {
    objectStates.set(mesh, {
      radius: mesh.geometry.boundingSphere.radius,
      velocity: new THREE.Vector3(),
    });
  });
}

function createGrabbableBox(position, color, size) {
  const geometry = new THREE.BoxGeometry(size, size, size);
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createGrabbableSphere(position, color, radius) {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  geometry.computeBoundingSphere();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function tryPickup() {
  controls.getObject().getWorldPosition(cameraPos);

  let closest = null;
  let minDistance = Infinity;

  objectStates.forEach((state, mesh) => {
    if (mesh === carriedObject) {
      return;
    }

    const distance = mesh.position.distanceTo(cameraPos);
    if (distance < 1.6 && distance < minDistance) {
      closest = mesh;
      minDistance = distance;
    }
  });

  if (!closest) {
    return;
  }

  carriedObject = closest;
  const state = objectStates.get(carriedObject);
  state.velocity.set(0, 0, 0);
}

function dropCarried() {
  if (!carriedObject) {
    return;
  }
  const state = objectStates.get(carriedObject);
  state.velocity.set(0, 0, 0);
  carriedObject = null;
}

function throwCarried() {
  const state = objectStates.get(carriedObject);
  if (!state) {
    carriedObject = null;
    return;
  }
  controls.getDirection(forwardDir);
  forwardDir.normalize();
  const throwForce = 8;
  state.velocity.copy(forwardDir).multiplyScalar(throwForce);
  state.velocity.y += 1.5;
  carriedObject = null;
}

function updatePlayer(delta) {
  if (!controls.isLocked) {
    return;
  }

  const speed = 5.5;
  controls.getDirection(forwardDir);
  forwardDir.y = 0;
  forwardDir.normalize();

  sideDir.crossVectors(controls.getObject().up, forwardDir).normalize();

  tmpVec.set(0, 0, 0);

  if (moveState.forward) tmpVec.add(forwardDir);
  if (moveState.backward) tmpVec.sub(forwardDir);
  if (moveState.left) tmpVec.sub(sideDir);
  if (moveState.right) tmpVec.add(sideDir);

  if (tmpVec.lengthSq() > 0) {
    tmpVec.normalize();
    tmpVec.multiplyScalar(speed * delta);
    controls.getObject().position.add(tmpVec);
  }

  const minX = -room.width / 2 + 0.5;
  const maxX = room.width / 2 - 0.5;
  const minZ = -room.depth / 2 + 0.5;
  const maxZ = room.depth / 2 - 0.5;

  controls.getObject().position.x = THREE.MathUtils.clamp(
    controls.getObject().position.x,
    minX,
    maxX
  );
  controls.getObject().position.z = THREE.MathUtils.clamp(
    controls.getObject().position.z,
    minZ,
    maxZ
  );
  controls.getObject().position.y = playerHeight;
}

function updateObjects(delta) {
  objectStates.forEach((state, mesh) => {
    if (mesh === carriedObject) {
      controls.getObject().getWorldPosition(cameraPos);
      controls.getDirection(forwardDir);
      forwardDir.normalize();
      const holdOffset = 1.1;
      const targetPos = tmpVec
        .copy(cameraPos)
        .addScaledVector(forwardDir, holdOffset);
      targetPos.y += 0.2;
      mesh.position.lerp(targetPos, 0.5);
      state.velocity.set(0, 0, 0);
      return;
    }

    state.velocity.y -= 9.8 * delta;

    mesh.position.addScaledVector(state.velocity, delta);

    const radius = state.radius;

    if (mesh.position.y - radius < 0) {
      mesh.position.y = radius;
      state.velocity.y = -state.velocity.y * 0.45;
      state.velocity.x *= 0.6;
      state.velocity.z *= 0.6;
    }

    const minX = -room.width / 2 + radius;
    const maxX = room.width / 2 - radius;
    const minZ = -room.depth / 2 + radius;
    const maxZ = room.depth / 2 - radius;

    if (mesh.position.x < minX) {
      mesh.position.x = minX;
      state.velocity.x = -state.velocity.x * 0.4;
    } else if (mesh.position.x > maxX) {
      mesh.position.x = maxX;
      state.velocity.x = -state.velocity.x * 0.4;
    }

    if (mesh.position.z < minZ) {
      mesh.position.z = minZ;
      state.velocity.z = -state.velocity.z * 0.4;
    } else if (mesh.position.z > maxZ) {
      mesh.position.z = maxZ;
      state.velocity.z = -state.velocity.z * 0.4;
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  updatePlayer(delta);
  updateObjects(delta);
  renderer.render(scene, camera);
}

animate();
