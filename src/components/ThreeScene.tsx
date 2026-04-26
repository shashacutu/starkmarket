"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    
    renderer.setClearColor(0x000000, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Floating Cubes (Noir look)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    const cubes: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 60
      );
      cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      scene.add(cube);
      cubes.push(cube);
    }

    camera.position.z = 15;
    camera.position.y = 2;

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      cubes.forEach((cube, i) => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.005;
        cube.position.y += Math.sin(Date.now() * 0.001 + i) * 0.01;
      });

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
      cancelAnimationFrame(frameId);
      renderer.dispose();
      scene.clear();
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 bg-black pointer-events-none" />;
}
