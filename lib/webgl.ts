/** Detects whether WebGL is hardware-accelerated. Software renderers (SwiftShader, llvmpipe) get the 2D fallbacks. */
export type GlQuality = 'none' | 'software' | 'hardware';
let cached: GlQuality | null = null;
export function webglQuality(): GlQuality {
  if (cached) return cached;
  try {
    if (typeof location !== 'undefined' && /[?&]gl=force/.test(location.search)) return (cached = 'hardware');
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return (cached = 'none');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    const soft = /swiftshader|llvmpipe|software|mesa offscreen|basic render/i.test(renderer);
    return (cached = soft ? 'software' : 'hardware');
  } catch {
    return (cached = 'none');
  }
}
