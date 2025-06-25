const VIB3_PRESETS_EXPANDED = [
    // --- Analytical & Structural ---
    {
        name: "Dimensional Blueprint (Hypercube)",
        geometry: 'hypercube',
        projection: 'orthographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 12.0, u_lineThickness: 0.005, u_rotationSpeed: 0.05,
            u_patternIntensity: 1.0, u_colorShift: 0.0, u_universeModifier: 1.0, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Crystalline Matrix (Crystal)",
        geometry: 'crystal',
        projection: 'perspective',
        geometryParams: { latticeSize: [3,3,3,3] },
        params: {
            u_dimension: 3.7, u_gridDensity: 3,
            u_lineThickness: 0.01, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.5, u_colorShift: 0.6, u_universeModifier: 0.8, u_morphFactor: 0.1,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Sierpinski Dust (Fractal)",
        geometry: 'fractal',
        projection: 'perspective',
        geometryParams: { iterations: 4 },
        params: {
            u_dimension: 3.0, u_gridDensity: 4,
            u_lineThickness: 0.002,
            u_rotationSpeed: 0.15, u_patternIntensity: 2.0, u_colorShift: -0.3, u_universeModifier: 1.2,
            u_morphFactor: 0.0, u_glitchIntensity: 0.01, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Tetrahedral Precision (Hypertetrahedron)",
        geometry: 'hypertetrahedron',
        projection: 'orthographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 1.0, u_lineThickness: 0.003, u_rotationSpeed: 0.02,
            u_patternIntensity: 1.0, u_colorShift: 0.2, u_universeModifier: 1.0, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.01,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Cosmic Flow (Torus)",
        geometry: 'torus',
        projection: 'perspective',
        params: {
            u_dimension: 3.8, u_gridDensity: 20.0, u_lineThickness: 0.008, u_rotationSpeed: 0.6,
            u_patternIntensity: 0.7, u_colorShift: 0.8, u_universeModifier: 0.5, u_morphFactor: 0.7,
            u_glitchIntensity: 0.005, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Bio-Luminescent Wave (Wave)",
        geometry: 'wave',
        projection: 'perspective',
        geometryParams: { divisions: 25 },
        params: {
            u_dimension: 3.5, u_gridDensity: 25, u_lineThickness: 0.015, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.3, u_colorShift: 0.4, u_universeModifier: 1.0, u_morphFactor: 0.4,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Nebula Bloom (Hypersphere)",
        geometry: 'hypersphere',
        projection: 'stereographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 18.0, u_lineThickness: 0.004, u_rotationSpeed: 0.2,
            u_patternIntensity: 0.9, u_colorShift: -0.7, u_universeModifier: 0.9, u_morphFactor: 0.8,
            u_glitchIntensity: 0.0, u_shellWidth: 0.08, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Klein Fold Dance (KleinBottle)",
        geometry: 'kleinbottle',
        projection: 'perspective',
        params: {
            u_dimension: 3.2, u_gridDensity: 22.0, u_lineThickness: 0.007, u_rotationSpeed: 0.3,
            u_patternIntensity: 1.1, u_colorShift: 0.15, u_universeModifier: 1.1, u_morphFactor: 0.5,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Ethereal Echoes (Wave + Stereographic)",
        geometry: 'wave',
        projection: 'stereographic',
        geometryParams: { divisions: 15 },
        params: {
            u_dimension: 4.2, u_gridDensity: 15, u_lineThickness: 0.003, u_rotationSpeed: 0.05,
            u_patternIntensity: 2.5, u_colorShift: 0.9, u_universeModifier: 2.0, u_morphFactor: 1.0,
            u_glitchIntensity: 0.001, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Quantum Foam (Fractal + Ortho)",
        geometry: 'fractal',
        projection: 'orthographic',
        geometryParams: { iterations: 3 },
        params: {
            u_dimension: 4.5, u_gridDensity: 3, u_lineThickness: 0.008, u_rotationSpeed: 0.4,
            u_patternIntensity: 0.6, u_colorShift: -0.5, u_universeModifier: 0.4, u_morphFactor: 0.2,
            u_glitchIntensity: 0.05, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Dimensional Rift (Hypercube + Morph)",
        geometry: 'hypercube',
        projection: 'perspective',
        params: {
            u_dimension: 5.0, u_gridDensity: 8.0, u_lineThickness: 0.01, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.0, u_colorShift: 0.0, u_universeModifier: 1.5, u_morphFactor: 1.5,
            u_glitchIntensity: 0.1, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Minimalist Lines (Hypertetrahedron)",
        geometry: 'hypertetrahedron',
        projection: 'perspective',
        params: {
            u_dimension: 3.0, u_gridDensity: 1.0, u_lineThickness: 0.002, u_rotationSpeed: 0.0,
            u_patternIntensity: 3.0, u_colorShift: 0.5, u_universeModifier: 0.3, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.005,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Glitch Storm (Torus + Glitch)",
        geometry: 'torus',
        projection: 'perspective',
        params: {
            u_dimension: 3.6, u_gridDensity: 15.0, u_lineThickness: 0.02, u_rotationSpeed: 1.5,
            u_patternIntensity: 0.8, u_colorShift: -0.2, u_universeModifier: 0.7, u_morphFactor: 0.3,
            u_glitchIntensity: 0.15,
            u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Warp Speed (Hypersphere + Fast Rotate)",
        geometry: 'hypersphere',
        projection: 'perspective',
        params: {
            u_dimension: 3.0, u_gridDensity: 10.0, u_lineThickness: 0.003, u_rotationSpeed: 3.0,
            u_patternIntensity: 0.5, u_colorShift: 0.3, u_universeModifier: 0.6, u_morphFactor: 1.0,
            u_glitchIntensity: 0.02, u_shellWidth: 0.02, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Particle Accelerator (Crystal + Ortho)",
        geometry: 'crystal',
        projection: 'orthographic',
        geometryParams: { latticeSize: [5,2,2,2] },
        params: {
            u_dimension: 3.3, u_gridDensity: 3, u_lineThickness: 0.005, u_rotationSpeed: 2.0,
            u_patternIntensity: 1.8, u_colorShift: 0.75, u_universeModifier: 1.3, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Recursive Reality (KleinBottle + Stereographic)",
        geometry: 'kleinbottle',
        projection: 'stereographic',
        params: {
            u_dimension: 4.8, u_gridDensity: 18.0, u_lineThickness: 0.01, u_rotationSpeed: 0.25,
            u_patternIntensity: 1.0, u_colorShift: -0.8, u_universeModifier: 1.0, u_morphFactor: 1.2,
            u_glitchIntensity: 0.03, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    // --- Start of 32 New Presets ---

    // Subtle & Atmospheric
    {
        name: "Quiet Contemplation (Hypersphere)",
        geometry: 'hypersphere', projection: 'perspective',
        params: {
            u_dimension: 3.5, u_gridDensity: 8.0, u_lineThickness: 0.002, u_rotationSpeed: 0.02,
            u_patternIntensity: 2.0, u_colorShift: 0.7, u_universeModifier: 1.2, u_morphFactor: 0.1,
            u_glitchIntensity: 0.0, u_shellWidth: 0.01, u_tetraThickness: 0.01,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Foggy Morning (Wave)",
        geometry: 'wave', projection: 'orthographic', geometryParams: { divisions: 20 },
        params: {
            u_dimension: 3.0, u_gridDensity: 20, u_lineThickness: 0.005, u_rotationSpeed: 0.01,
            u_patternIntensity: 2.5, u_colorShift: 0.5, u_universeModifier: 0.8, u_morphFactor: 0.05,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Stardust Veil (Fractal)",
        geometry: 'fractal', projection: 'stereographic', geometryParams: { iterations: 2 },
        params: {
            u_dimension: 4.0, u_gridDensity: 2, u_lineThickness: 0.001, u_rotationSpeed: 0.03,
            u_patternIntensity: 1.5, u_colorShift: -0.6, u_universeModifier: 1.5, u_morphFactor: 0.2,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Aurora Wisps (Torus)",
        geometry: 'torus', projection: 'stereographic',
        params: {
            u_dimension: 4.2, u_gridDensity: 12.0, u_lineThickness: 0.003, u_rotationSpeed: 0.08,
            u_patternIntensity: 1.8, u_colorShift: 0.85, u_universeModifier: 0.7, u_morphFactor: 0.3,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },

    // High-Energy & Complex
    {
        name: "Synaptic Overload (Hypercube)",
        geometry: 'hypercube', projection: 'perspective',
        params: {
            u_dimension: 4.5, u_gridDensity: 25.0, u_lineThickness: 0.015, u_rotationSpeed: 1.8,
            u_patternIntensity: 0.5, u_colorShift: 0.0, u_universeModifier: 0.6, u_morphFactor: 1.2,
            u_glitchIntensity: 0.08, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Tesseract Frenzy (Hypertetrahedron)",
        geometry: 'hypertetrahedron', projection: 'perspective',
        params: {
            u_dimension: 4.0, u_gridDensity: 2.0, u_lineThickness: 0.02, u_rotationSpeed: 2.5,
            u_patternIntensity: 0.7, u_colorShift: -0.4, u_universeModifier: 0.9, u_morphFactor: 0.5,
            u_glitchIntensity: 0.12, u_shellWidth: 0.05, u_tetraThickness: 0.08,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Crystal Collision (Crystal)",
        geometry: 'crystal', projection: 'perspective', geometryParams: { latticeSize: [4,4,4,4] },
        params: {
            u_dimension: 3.8, u_gridDensity: 4, u_lineThickness: 0.025, u_rotationSpeed: 1.2,
            u_patternIntensity: 0.9, u_colorShift: 0.25, u_universeModifier: 1.0, u_morphFactor: 0.8,
            u_glitchIntensity: 0.03, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Klein Kaleidoscope (KleinBottle)",
        geometry: 'kleinbottle', projection: 'orthographic',
        params: {
            u_dimension: 3.5, u_gridDensity: 25.0, u_lineThickness: 0.01, u_rotationSpeed: 0.9,
            u_patternIntensity: 0.6, u_colorShift: 0.5, u_universeModifier: 1.5, u_morphFactor: 0.9,
            u_glitchIntensity: 0.06, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },

    // Geometric Explorations
    {
        name: "Fractal Bloom (Fractal + Perspective)",
        geometry: 'fractal', projection: 'perspective', geometryParams: { iterations: 5 }, // High iteration
        params: {
            u_dimension: 3.0, u_gridDensity: 5, u_lineThickness: 0.002, u_rotationSpeed: 0.05,
            u_patternIntensity: 1.0, u_colorShift: 0.1, u_universeModifier: 1.0, u_morphFactor: 0.1,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Wave Lattice (Wave + Crystal Params)", // Concept: use Wave geom but Crystal-like params
        geometry: 'wave', projection: 'orthographic', geometryParams: { divisions: 8 }, // Low division for "nodes"
        params: {
            u_dimension: 4.0, u_gridDensity: 8, u_lineThickness: 0.03, u_rotationSpeed: 0.02, // Thicker lines
            u_patternIntensity: 1.2, u_colorShift: -0.1, u_universeModifier: 0.7, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Inflated Torus (Torus + High Morph)",
        geometry: 'torus', projection: 'perspective',
        params: {
            u_dimension: 3.3, u_gridDensity: 10.0, u_lineThickness: 0.005, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.0, u_colorShift: 0.3, u_universeModifier: 1.0, u_morphFactor: 1.4, // High morph
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Stereo Hypercube (Hypercube + Stereographic)",
        geometry: 'hypercube', projection: 'stereographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 10.0, u_lineThickness: 0.008, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.0, u_colorShift: -0.9, u_universeModifier: 1.0, u_morphFactor: 0.2,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },

    // Dimensional Studies
    {
        name: "Flatland Echo (Hypertetrahedron 3D)",
        geometry: 'hypertetrahedron', projection: 'orthographic',
        params: {
            u_dimension: 3.0, u_gridDensity: 1.0, u_lineThickness: 0.004, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.5, u_colorShift: 0.0, u_universeModifier: 1.0, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.015,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Quintessence (Hypercube 5D)",
        geometry: 'hypercube', projection: 'perspective',
        params: {
            u_dimension: 5.0, u_gridDensity: 7.0, u_lineThickness: 0.007, u_rotationSpeed: 0.08,
            u_patternIntensity: 1.1, u_colorShift: 0.33, u_universeModifier: 1.3, u_morphFactor: 0.4,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Spherical Expansion (Hypersphere 4.5D)",
        geometry: 'hypersphere', projection: 'stereographic',
        params: {
            u_dimension: 4.5, u_gridDensity: 16.0, u_lineThickness: 0.006, u_rotationSpeed: 0.12,
            u_patternIntensity: 1.0, u_colorShift: -0.15, u_universeModifier: 1.0, u_morphFactor: 0.6,
            u_glitchIntensity: 0.0, u_shellWidth: 0.06, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Projected Flow (Torus 3.2D)",
        geometry: 'torus', projection: 'orthographic',
        params: {
            u_dimension: 3.2, u_gridDensity: 20.0, u_lineThickness: 0.01, u_rotationSpeed: 0.2,
            u_patternIntensity: 1.4, u_colorShift: 0.66, u_universeModifier: 0.9, u_morphFactor: 0.1,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },

    // Minimalist & Stark
    {
        name: "Void Structure (Crystal)",
        geometry: 'crystal', projection: 'orthographic', geometryParams: { latticeSize: [2,2,2,2] },
        params: {
            u_dimension: 4.0, u_gridDensity: 2, u_lineThickness: 0.002, u_rotationSpeed: 0.0,
            u_patternIntensity: 3.0, u_colorShift: 0.0, // High pattern intensity can make it stark if color is B&W
            u_universeModifier: 0.5, u_morphFactor: 0.0, u_glitchIntensity: 0.0,
            u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Single Point Wave (Wave)", // Idea: Wave on a 1x1x1 grid point
        geometry: 'wave', projection: 'perspective', geometryParams: { divisions: 1 },
        params: {
            u_dimension: 3.0, u_gridDensity: 1, u_lineThickness: 0.1, // Thick point
            u_rotationSpeed: 0.0, u_patternIntensity: 1.0, u_colorShift: 0.2, u_universeModifier: 1.0,
            u_morphFactor: 0.0, u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Ghostly Hypercube (Hypercube)",
        geometry: 'hypercube', projection: 'perspective',
        params: {
            u_dimension: 3.7, u_gridDensity: 5.0, u_lineThickness: 0.001, u_rotationSpeed: 0.03,
            u_patternIntensity: 2.8, u_colorShift: -0.5, u_universeModifier: 1.8, u_morphFactor: 0.0,
            u_glitchIntensity: 0.005, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Unfolding Plane (KleinBottle)", // Using Klein for its surface property
        geometry: 'kleinbottle', projection: 'orthographic',
        params: {
            u_dimension: 3.0, u_gridDensity: 15.0, u_lineThickness: 0.004, u_rotationSpeed: 0.01,
            u_patternIntensity: 2.0, u_colorShift: 0.0, u_universeModifier: 2.5, // High universe mod for expansion
            u_morphFactor: 0.0, u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },

    // Effect-Driven
    {
        name: "Universe Collapse (Hypersphere)",
        geometry: 'hypersphere', projection: 'perspective',
        params: {
            u_dimension: 4.0, u_gridDensity: 15.0, u_lineThickness: 0.01, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.0, u_colorShift: 0.1, u_universeModifier: 0.3, // Min universe mod
            u_morphFactor: 1.0, u_glitchIntensity: 0.0, u_shellWidth: 0.01,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Pattern Overdrive (Torus)",
        geometry: 'torus', projection: 'orthographic',
        params: {
            u_dimension: 3.5, u_gridDensity: 25.0, u_lineThickness: 0.005, u_rotationSpeed: 0.3,
            u_patternIntensity: 0.1, // Min pattern intensity (max contrast/brightness)
            u_colorShift: 0.4, u_universeModifier: 1.0, u_morphFactor: 0.5,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Digital Distortion (Wave)",
        geometry: 'wave', projection: 'perspective', geometryParams: { divisions: 10 },
        params: {
            u_dimension: 3.0, u_gridDensity: 10, u_lineThickness: 0.01, u_rotationSpeed: 0.05,
            u_patternIntensity: 1.0, u_colorShift: 0.0, u_universeModifier: 1.0, u_morphFactor: 0.2,
            u_glitchIntensity: 0.12, // High glitch
            u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Extreme Morph (Hypercube)",
        geometry: 'hypercube', projection: 'stereographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 10.0, u_lineThickness: 0.008, u_rotationSpeed: 0.1,
            u_patternIntensity: 1.0, u_colorShift: 0.0, u_universeModifier: 1.0, u_morphFactor: 1.5, // Max morph
            u_glitchIntensity: 0.05, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },

    // Thematic/Conceptual
    {
        name: "Neural Network Visual (Crystal)",
        geometry: 'crystal', projection: 'perspective', geometryParams: { latticeSize: [6,5,4,2] },
        params: {
            u_dimension: 3.6, u_gridDensity: 4, u_lineThickness: 0.003, u_rotationSpeed: 0.03,
            u_patternIntensity: 1.6, u_colorShift: -0.25, u_universeModifier: 1.1, u_morphFactor: 0.1,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Quantum Entanglement (Fractal)", // Points appearing distant but connected by color/animation
        geometry: 'fractal', projection: 'orthographic', geometryParams: { iterations: 3 },
        params: {
            u_dimension: 4.2, u_gridDensity: 3, u_lineThickness: 0.005, u_rotationSpeed: 0.2,
            u_patternIntensity: 1.0, u_colorShift: 0.7, u_universeModifier: 2.0, u_morphFactor: 0.0,
            u_glitchIntensity: 0.01, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Ancient Monolith (Hypertetrahedron)",
        geometry: 'hypertetrahedron', projection: 'perspective',
        params: {
            u_dimension: 3.1, u_gridDensity: 1.0, u_lineThickness: 0.05, u_rotationSpeed: 0.005, // Very slow
            u_patternIntensity: 2.2, u_colorShift: 0.1, u_universeModifier: 0.9, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.1, // Thick planes
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Hyperspace Jump (Hypersphere)",
        geometry: 'hypersphere', projection: 'perspective',
        params: {
            u_dimension: 5.0, u_gridDensity: 20.0, u_lineThickness: 0.002, u_rotationSpeed: 2.8,
            u_patternIntensity: 0.4, u_colorShift: 0.45, u_universeModifier: 0.4, u_morphFactor: 1.3,
            u_glitchIntensity: 0.07, u_shellWidth: 0.005, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Tidal Pull (Wave + Stereographic)",
        geometry: 'wave', projection: 'stereographic', geometryParams: { divisions: 22 },
        params: {
            u_dimension: 3.9, u_gridDensity: 22, u_lineThickness: 0.008, u_rotationSpeed: 0.06,
            u_patternIntensity: 1.2, u_colorShift: -0.65, u_universeModifier: 1.0, u_morphFactor: 0.7,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Twisted Logic (KleinBottle + Morph)",
        geometry: 'kleinbottle', projection: 'perspective',
        params: {
            u_dimension: 3.4, u_gridDensity: 20.0, u_lineThickness: 0.006, u_rotationSpeed: 0.15,
            u_patternIntensity: 0.8, u_colorShift: 0.95, u_universeModifier: 1.2, u_morphFactor: 1.1,
            u_glitchIntensity: 0.04, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Celestial Gears (Torus + Ortho)",
        geometry: 'torus', projection: 'orthographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 16.0, u_lineThickness: 0.012, u_rotationSpeed: 0.07,
            u_patternIntensity: 1.3, u_colorShift: -0.35, u_universeModifier: 0.8, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    },
    {
        name: "Silent Observer (Hypercube)",
        geometry: 'hypercube', projection: 'orthographic',
        params: {
            u_dimension: 4.0, u_gridDensity: 6.0, u_lineThickness: 0.003, u_rotationSpeed: 0.001, // Extremely slow
            u_patternIntensity: 2.0, u_colorShift: 0.5, u_universeModifier: 2.0, u_morphFactor: 0.0,
            u_glitchIntensity: 0.0, u_shellWidth: 0.05, u_tetraThickness: 0.02,
            u_audioBass: 0, u_audioMid: 0, u_audioHigh: 0
        }
    }
    // --- End of 32 New Presets ---
];

class PresetManager {
    constructor(coreInstance, initialPresets = []) {
        this.core = coreInstance;
        this.presets = [...initialPresets]; // Built-in presets
        this.userPresets = []; // For presets saved by the user via dashboard
    }

    addPreset(presetObject, isUserPreset = false) {
        if (!presetObject || !presetObject.name || !presetObject.params) {
            console.error("PresetManager: Invalid preset object provided.", presetObject);
            return;
        }
        if (isUserPreset) {
            // Could add checks for duplicate names if desired
            this.userPresets.push(presetObject);
        } else {
            this.presets.push(presetObject); // For adding more built-in ones dynamically
        }
        // In a real UI, an event would be dispatched here to update the dashboard's preset list.
        console.log(`PresetManager: Added ${isUserPreset ? 'user' : 'built-in'} preset "${presetObject.name}".`);
    }

    loadPresetByName(name) {
        let preset = this.userPresets.find(p => p.name === name) || this.presets.find(p => p.name === name);
        if (preset) {
            this.core.loadPreset(preset); // Call HypercubeCore's method
        } else {
            console.warn(`PresetManager: Preset named "${name}" not found.`);
        }
    }

    saveCurrentSettingsAsUserPreset(name) {
        if (!name || typeof name !== 'string' || name.trim() === "") {
            name = `User Preset ${this.userPresets.length + 1}`;
        }
        const currentSettings = this.core.getCurrentSettingsAsPreset();
        const userPreset = { ...currentSettings, name: name.trim() };

        // Avoid duplicate names for user presets
        if (this.userPresets.some(p => p.name === userPreset.name)) {
            console.warn(`PresetManager: A user preset named "${userPreset.name}" already exists. Please choose a different name or delete the existing one.`);
            return null; // Indicate failure or handle renaming
        }

        this.userPresets.push(userPreset);
        this.storeUserPresetsToLocalStorage(); // Persist
        console.log("PresetManager: Saved user preset:", userPreset);
        // In a real UI, an event would be dispatched here to update the dashboard's preset list.
        return userPreset;
    }

    getAllPresetNames() {
        // Return built-in presets first, then user presets
        return [
            ...this.presets.map(p => ({name: p.name, type: 'built-in'})),
            ...this.userPresets.map(p => ({name: p.name, type: 'user'}))
        ];
    }

    exportUserPresetsToString() {
        return JSON.stringify(this.userPresets, null, 2);
    }

    importUserPresetsFromString(jsonString) {
        try {
            const importedUserPresets = JSON.parse(jsonString);
            if (Array.isArray(importedUserPresets)) {
                // Simple merge: add new ones, potentially overwrite if names clash or add logic for that
                for (const preset of importedUserPresets) {
                    if (preset && preset.name && preset.params) {
                        const existingIndex = this.userPresets.findIndex(p => p.name === preset.name);
                        if (existingIndex !== -1) {
                            this.userPresets[existingIndex] = preset; // Overwrite
                        } else {
                            this.userPresets.push(preset);
                        }
                    }
                }
                this.storeUserPresetsToLocalStorage();
                console.log("PresetManager: Imported user presets.");
                // In a real UI, an event would be dispatched here to update the dashboard's preset list.
            } else {
                console.error("PresetManager: Imported presets data is not an array.");
            }
        } catch (e) {
            console.error("PresetManager: Error importing user presets.", e);
        }
    }

    loadUserPresetsFromLocalStorage() {
        try {
            const storedPresets = localStorage.getItem('hyperAV_userPresets');
            if (storedPresets) {
                this.userPresets = JSON.parse(storedPresets);
                console.log("PresetManager: Loaded user presets from LocalStorage.");
            }
        } catch (e) {
            console.error("PresetManager: Error loading user presets from LocalStorage.", e);
        }
    }

    storeUserPresetsToLocalStorage() {
        try {
            localStorage.setItem('hyperAV_userPresets', JSON.stringify(this.userPresets));
            console.log("PresetManager: Stored user presets to LocalStorage.");
        } catch (e) {
            console.error("PresetManager: Error storing user presets to LocalStorage.", e);
        }
    }
}

// Make VIB3_PRESETS_EXPANDED and PresetManager globally accessible if not using modules,
// or they would be imported by HypercubeCore.js.
// For non-module environment, ensure this file is loaded before HypercubeCore.js.
if (typeof window !== 'undefined') {
    window.VIB3_PRESETS_EXPANDED = VIB3_PRESETS_EXPANDED;
    window.PresetManager = PresetManager;
}
