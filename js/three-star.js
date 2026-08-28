
// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('three-container');
    if (!container) return;

    // --- 1. Basic Setup ---
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30; // Further back

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Premium tone mapping for better colors
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- 2. Lighting (Dramatic Cinematic Lighting) ---
    // Minimal ambient light to keep shadows deep
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // Main bright white/blue rim light from top right
    const rimLight = new THREE.SpotLight(0xffffff, 5);
    rimLight.position.set(15, 20, -10);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 0.5;
    scene.add(rimLight);

    // Intense orange fill light from bottom left
    const orangeLight = new THREE.PointLight(0xf06723, 8, 50);
    orangeLight.position.set(-10, -10, 10);
    scene.add(orangeLight);
    
    // Core glow light in the center
    const centerGlow = new THREE.PointLight(0xf06723, 2, 20);
    centerGlow.position.set(0, 0, 5);
    scene.add(centerGlow);

    // --- 3. The Premium 3D Star ---
    const starGroup = new THREE.Group();
    scene.add(starGroup);

    const starShape = new THREE.Shape();
    const outerRadius = 5;
    const innerRadius = 2; // sharper inner points
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) {
            starShape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        } else {
            starShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
    }

    // Elegant, thin extrusion
    const extrudeSettings = {
        depth: 0.4,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSteps: 2,
        bevelThickness: 0.2,
        bevelSize: 0.1,
    };

    const geometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    geometry.center();

    // High-end dark metallic material with orange tint
    const material = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 1.0,
        roughness: 0.2,
        emissive: 0xf06723,
        emissiveIntensity: 0.2,
    });

    const star = new THREE.Mesh(geometry, material);
    starGroup.add(star);
    
    // Add an outer glowing wireframe for a high-tech/holographic look
    const wireframeGeo = new THREE.EdgesGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({ 
        color: 0xf06723, 
        linewidth: 2,
        transparent: true,
        opacity: 0.8
    });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    // Scale slightly up to outline the solid mesh
    wireframe.scale.set(1.02, 1.02, 1.02);
    starGroup.add(wireframe);

    // --- 4. Premium Environment Particles (Floating Embers) ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50; 
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0xf06723,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- 5. Scroll Animation Logic ---
    const heroReveal = document.getElementById('hero-reveal');
    let scrollProgress = 0;
    let targetProgress = 0;
    
    let baseRotationY = 0;
    let baseRotationX = 0;

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

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function updateScroll() {
        const rect = heroReveal.getBoundingClientRect();
        const maxScroll = rect.height - window.innerHeight;
        
        if (maxScroll > 0) {
            let p = -rect.top / maxScroll;
            targetProgress = Math.max(0, Math.min(1, p));
        }
    }
    
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        scrollProgress += (targetProgress - scrollProgress) * 0.05;

        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        baseRotationY += delta * 0.2; // Elegant slow spin
        baseRotationX = Math.sin(elapsedTime * 0.3) * 0.1; // Very subtle tilt

        // Fly progress: start far away, fly PAST the camera
        const flyProgress = Math.pow(scrollProgress, 2); 
        starGroup.position.z = flyProgress * 50; // Camera is at 30, so at progress=0.8, z=32 (passed camera!)
        
        starGroup.rotation.y = baseRotationY + (flyProgress * Math.PI * 2);
        starGroup.rotation.x = baseRotationX + (flyProgress * Math.PI);
        starGroup.rotation.z = flyProgress * Math.PI;

        // Dynamic light moves with the star
        centerGlow.position.copy(starGroup.position);
        
        // Embers float upwards slowly
        const positions = particlesMesh.geometry.attributes.position.array;
        for(let i=1; i<particlesCount*3; i+=3) {
            positions[i] += 0.02; // move Y up
            if (positions[i] > 25) positions[i] = -25;
        }
        particlesMesh.geometry.attributes.position.needsUpdate = true;
        
        particlesMesh.rotation.y = elapsedTime * 0.05;

        camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 10 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }

    animate();
});
