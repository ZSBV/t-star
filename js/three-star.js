// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('three-container');
    if (!container) return;

    // --- 1. Basic Setup ---
    const scene = new THREE.Scene();
    
    // Transparent background so we can see the HTML background if needed,
    // but a very faint radial gradient looks even more premium. We'll leave it transparent and use CSS.
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for high DPI but limit to 2
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- 2. Lighting (Premium Studio Setup) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(10, 10, 10);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffcc88, 0.8);
    fillLight.position.set(-10, 0, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf06723, 1.5); // Orange rim
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // --- 3. The 3D Star ---
    const starShape = new THREE.Shape();
    const outerRadius = 4;
    const innerRadius = 1.8;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2; // Pointing up
        if (i === 0) {
            starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
            starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
    }

    const extrudeSettings = {
        depth: 1.5,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSteps: 4,
        bevelThickness: 0.4,
        bevelSize: 0.4,
    };

    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    geometry.center();

    // Premium Gold/Orange Material (MeshPhysicalMaterial)
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xf06723, // T-Star Orange
        emissive: 0x4a1900,
        roughness: 0.15,
        metalness: 0.8,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 1.0,
    });

    const star = new THREE.Mesh(geometry, material);
    star.castShadow = true;
    star.receiveShadow = true;
    scene.add(star);

    // --- 4. Floating Particles (Premium dust effect) ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40; // Spread across scene
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xf06723,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- 5. Scroll Animation Logic ---
    const heroReveal = document.getElementById('hero-reveal');
    let scrollProgress = 0;
    let targetProgress = 0;
    
    // Initial Base Rotation
    let baseRotationY = 0;
    let baseRotationX = 0;

    // Mouse movement interaction (parallax)
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        targetMouseX = (event.clientX - windowHalfX) * 0.001;
        targetMouseY = (event.clientY - windowHalfY) * 0.001;
    });

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Calculate scroll progress specifically for the hero section
    function updateScroll() {
        const rect = heroReveal.getBoundingClientRect();
        // total distance to scroll = height of heroReveal minus viewport height
        const maxScroll = rect.height - window.innerHeight;
        
        if (maxScroll > 0) {
            let p = -rect.top / maxScroll;
            // Clamp between 0 and 1
            targetProgress = Math.max(0, Math.min(1, p));
        }
    }
    
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    // The Render Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Smoothly interpolate scroll progress (adds weight/fluidity to the animation)
        scrollProgress += (targetProgress - scrollProgress) * 0.05;

        // Smoothly interpolate mouse (parallax)
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // 1. Idle Animation (Floating and Spinning)
        baseRotationY += delta * 0.3; // Constant slow spin
        baseRotationX = Math.sin(elapsedTime * 0.5) * 0.2; // Gentle bobbing tilt

        // 2. Scroll-Linked Animation (The Star flies towards the camera and rotates wildly)
        // At progress 0: far away, normal size
        // At progress 0.6: starts flying past the camera
        // At progress 1.0: behind the camera completely
        
        // Let's map progress to Z position (0 -> 0, 1 -> 30, camera is at 25)
        const flyProgress = Math.pow(scrollProgress, 2); // Accelerates as you scroll down
        star.position.z = flyProgress * 40;
        
        // Add extra rotation based on scroll speed
        star.rotation.y = baseRotationY + (flyProgress * Math.PI * 4); // Spins multiple times
        star.rotation.x = baseRotationX + (flyProgress * Math.PI);
        star.rotation.z = flyProgress * Math.PI * 2;

        // Apply mouse parallax to camera
        camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        // Particle floating
        particlesMesh.rotation.y = elapsedTime * 0.05;
        particlesMesh.position.y = Math.sin(elapsedTime * 0.2) * 2;

        renderer.render(scene, camera);
    }

    animate();
});
