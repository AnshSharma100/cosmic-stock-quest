/**
 * Utility to load and pair vertex/fragment shaders
 */
export class ShaderLoader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Load a shader pair from the shaders directory
     * @param {string} name - Base name of shader pair (e.g. 'star' for star.vsh/star.fsh)
     * @returns {Promise<{vertexShader: string, fragmentShader: string}>}
     */
    async load(name) {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }

        const [vertexShader, fragmentShader] = await Promise.all([
            fetch(`/shaders/${name}.vsh`).then(r => r.text()),
            fetch(`/shaders/${name}.fsh`).then(r => r.text())
        ]);

        const pair = { vertexShader, fragmentShader };
        this.cache.set(name, pair);
        return pair;
    }
}