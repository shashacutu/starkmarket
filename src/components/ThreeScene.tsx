"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Wireframe Grid
    const gridHelper = new THREE.GridHelper(100, 50, 0x4c1d95, 0x1e1b4b);
    gridHelper.position.y = -5;
    scene.add(gridHelper);

    // Floating Cubes (Industrial look)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x7c3aed, 
      wireframe: true 
    });

    const cubes: THREE.Mesh[] = [];
    for (let i = 0; i < 20; i++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 50
      );
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(cube);
      cubes.push(cube);
    }

    camera.position.z = 15;
    camera.position.y = 2;

    const animate = () => {
      requestAnimationFrame(animate);
      
      cubes.forEach((cube, i) => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
        cube.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
      });

      gridHelper.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 bg-black pointer-events-none" />;
}
