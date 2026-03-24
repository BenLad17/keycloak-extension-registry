import { describe, it, expect } from 'vitest';
import {
	mavenDependencySnippet,
	yamlManifestSnippet,
	initContainerSnippet
} from './install-snippets';

describe('mavenDependencySnippet', () => {
	it('returns well-formed dependency XML for known GAV', () => {
		const result = mavenDependencySnippet('com.example', 'my-extension', '1.0.0');

		expect(result).toContain('<dependency>');
		expect(result).toContain('<groupId>com.example</groupId>');
		expect(result).toContain('<artifactId>my-extension</artifactId>');
		expect(result).toContain('<version>1.0.0</version>');
		expect(result).toContain('</dependency>');
	});

	it('interpolates all three coordinates independently', () => {
		const result = mavenDependencySnippet('org.keycloak', 'keycloak-extension-registry', '24.0.5');

		expect(result).toContain('<groupId>org.keycloak</groupId>');
		expect(result).toContain('<artifactId>keycloak-extension-registry</artifactId>');
		expect(result).toContain('<version>24.0.5</version>');
	});

	it('produces output with each coordinate on its own indented line', () => {
		const result = mavenDependencySnippet('io.quarkus', 'quarkus-core', '3.15.0');
		const lines = result.split('\n');

		expect(lines[0]).toBe('<dependency>');
		expect(lines[1]).toBe('  <groupId>io.quarkus</groupId>');
		expect(lines[2]).toBe('  <artifactId>quarkus-core</artifactId>');
		expect(lines[3]).toBe('  <version>3.15.0</version>');
		expect(lines[4]).toBe('</dependency>');
	});
});

describe('yamlManifestSnippet', () => {
	it('returns well-formed YAML entry for known GAV', () => {
		const result = yamlManifestSnippet('com.example', 'my-extension', '1.0.0');

		expect(result).toMatch(/^- groupId:/);
		expect(result).toContain('artifactId:');
		expect(result).toContain('version:');
	});

	it('interpolates all three coordinates independently', () => {
		const result = yamlManifestSnippet('org.keycloak', 'keycloak-extension-registry', '24.0.5');

		expect(result).toContain('org.keycloak');
		expect(result).toContain('keycloak-extension-registry');
		expect(result).toContain('24.0.5');
	});

	it('produces output with correct per-line YAML structure', () => {
		const result = yamlManifestSnippet('io.quarkus', 'quarkus-core', '3.15.0');
		const lines = result.split('\n');

		expect(lines[0]).toBe('- groupId: io.quarkus');
		expect(lines[1]).toBe('  artifactId: quarkus-core');
		expect(lines[2]).toBe('  version: 3.15.0');
	});
});

describe('initContainerSnippet', () => {
	it('returns well-formed init container YAML with required fields', () => {
		const result = initContainerSnippet(
			'com.example',
			'my-extension',
			'1.0.0',
			'ghcr.io/myorg/downloader:latest'
		);

		expect(result).toContain('- name: install-extensions');
		expect(result).toContain('image:');
		expect(result).toContain('volumeMounts:');
		expect(result).toContain('providers');
		expect(result).toContain('extensions-manifest');
	});

	it('interpolates all four parameters into the snippet', () => {
		const result = initContainerSnippet(
			'org.keycloak',
			'keycloak-ext',
			'24.0.5',
			'ghcr.io/myorg/downloader:v2'
		);

		expect(result).toContain('# - groupId: org.keycloak');
		expect(result).toContain('#   artifactId: keycloak-ext');
		expect(result).toContain('#   version: 24.0.5');
		expect(result).toContain('  image: ghcr.io/myorg/downloader:v2');
	});

	it('includes args with --manifest and --target flags; first non-comment line is the container name', () => {
		const result = initContainerSnippet(
			'io.quarkus',
			'quarkus-core',
			'3.15.0',
			'ghcr.io/myorg/downloader:latest'
		);
		const lines = result.split('\n');
		const nonCommentLines = lines.filter((l) => !l.startsWith('#'));

		expect(nonCommentLines[0]).toBe('- name: install-extensions');
		expect(result).toContain('--manifest');
		expect(result).toContain('--target');
	});
});
