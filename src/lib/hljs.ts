import hljs from 'highlight.js/lib/core';
import hljsJava from 'highlight.js/lib/languages/java';
import hljsXml from 'highlight.js/lib/languages/xml';
import hljsProperties from 'highlight.js/lib/languages/properties';
import hljsYaml from 'highlight.js/lib/languages/yaml';
import hljsJson from 'highlight.js/lib/languages/json';
import hljsIni from 'highlight.js/lib/languages/ini';
import hljsDockerfile from 'highlight.js/lib/languages/dockerfile';
import hljsBash from 'highlight.js/lib/languages/bash';

hljs.registerLanguage('java', hljsJava);
hljs.registerLanguage('xml', hljsXml);
hljs.registerLanguage('properties', hljsProperties);
hljs.registerLanguage('yaml', hljsYaml);
hljs.registerLanguage('json', hljsJson);
hljs.registerLanguage('ini', hljsIni);
hljs.registerLanguage('dockerfile', hljsDockerfile);
hljs.registerLanguage('bash', hljsBash);

export function highlight(code: string, lang: string): string {
	try {
		return hljs.highlight(code, { language: lang }).value;
	} catch {
		return escapeHtml(code);
	}
}

export function highlightByExtension(code: string, path: string): string {
	const LANG_MAP: Record<string, string> = {
		java: 'java',
		xml: 'xml',
		xsd: 'xml',
		xhtml: 'xml',
		html: 'xml',
		htm: 'xml',
		ftl: 'xml',
		json: 'json',
		properties: 'properties',
		yaml: 'yaml',
		yml: 'yaml',
		mf: 'ini',
		sf: 'ini'
	};
	const ext = path.split('.').pop()?.toLowerCase() ?? '';
	const lang = LANG_MAP[ext];
	return lang ? highlight(code, lang) : escapeHtml(code);
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
