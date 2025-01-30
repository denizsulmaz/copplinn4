// Setup Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('sonicCanvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0x000); // Black background

// Create Sphere with Gold Color
const geometry = new THREE.SphereGeometry(4, 40, 40); // Higher resolution for smoother distortions
const material = new THREE.MeshBasicMaterial({ color: 0xD6B577, wireframe: true });
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);
camera.position.z = 5;

// Store Initial Vertex Positions
const originalVertices = geometry.attributes.position.array.slice();

// Setup Audio Processing
const player = new Tone.Player("media/experimental.wav").toDestination();
const fft = new Tone.FFT(64); // Fast Fourier Transform for frequency analysis
player.connect(fft);
player.autostart = false; // Default: Muted
let isMuted = true;
let audioData = new Array(64).fill(0); // Placeholder for smooth start
let startTime = 0;
let initialDistortionPhase = true; // Track when it's in the "chaotic start" phase

// Mute/Unmute Button Logic
document.getElementById('muteButton').addEventListener('click', () => {
    if (isMuted) {
        player.start(); // Start audio
        document.getElementById('muteButton').innerText = "Mute";
        startTime = performance.now(); // Record start time for initial burst
        initialDistortionPhase = true; // Enable the burst phase
    } else {
        player.stop(); // Stop audio
        document.getElementById('muteButton').innerText = "Unmute";
        audioData.fill(0); // Reset effect
    }
    isMuted = !isMuted;
});

// Animate with Dynamic Distortion
function animate() {
    requestAnimationFrame(animate);

    if (!isMuted) {
        audioData = fft.getValue(); // Get frequency data
    }

    const positions = geometry.attributes.position.array;
    let elapsedTime = (performance.now() - startTime) / 3000; // Time in seconds

    for (let i = 0; i < positions.length; i += 3) {
        let index = Math.floor(i / 3) % audioData.length;
        let frequencyResponse = (audioData[index] / 100) || 0; // Scaled effect
        
        // INITIAL BURST: Strong deformation in the first 3 seconds
        let burstFactor = initialDistortionPhase ? Math.max(1.5 - elapsedTime * 0.5, 0) : 0; // Quickly fades after 3s

        if (elapsedTime > 3) {
            initialDistortionPhase = false; // Stop burst phase after 3s
        }

        // CIRCULAR HARMONY: Make distortion flow in smooth sinusoidal motion
        let harmonicWave = Math.sin(i * 0.2 + performance.now() * 0.005) * 0.04;

        // Apply deformation while keeping circular shape
        positions[i] = originalVertices[i] * (1 + frequencyResponse * (0.3 + burstFactor)) + harmonicWave; // X-axis
        positions[i + 1] = originalVertices[i + 1] * (1 + frequencyResponse * (0.3 + burstFactor)) + harmonicWave; // Y-axis
        positions[i + 2] = originalVertices[i + 2] * (1 + frequencyResponse * (0.3 + burstFactor)) + harmonicWave; // Z-axis
    }

    geometry.attributes.position.needsUpdate = true; // Update shape

    sphere.rotation.x += 0.002; // Slightly increased for smoother effect
    sphere.rotation.y += 0.003;

    renderer.render(scene, camera);
}

const SMOOTHING = 0.1; // Lower = slower movement
const DISTORTION_INTENSITY = 4.0; // Higher = more distortion
const SOUND_THRESHOLD = 0.05; // Ignore very small sounds

let lastStrength = []; // Store previous values to smooth changes

animate();

// Resize Handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
