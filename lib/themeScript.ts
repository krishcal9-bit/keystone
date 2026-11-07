export const THEME_KEY = 'keystone:v1:theme';
export const LANG_KEY = 'keystone:v1:lang';

/** Inline script: applies the stored or system theme (and UI language) before first paint. */
export const themeInitScript = `(function(){try{var k='${THEME_KEY}';var s=localStorage.getItem(k);var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(s==='light'||s==='dark')?s:(d?'dark':'light');document.documentElement.setAttribute('data-theme',t);var l=localStorage.getItem('${LANG_KEY}');if(l==='es'||l==='en'){document.documentElement.setAttribute('data-lang',l);document.documentElement.lang=l;}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
