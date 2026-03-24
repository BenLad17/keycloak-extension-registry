import { describe, it, expect } from 'vitest';
import { parsePomMetadata } from './pom.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FULL_POM = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>io.phasetwo</groupId>
  <artifactId>keycloak-magic-link</artifactId>
  <version>0.25</version>
  <name>Keycloak Magic Link</name>
  <description>A Keycloak extension that provides magic link authentication.</description>
  <url>https://github.com/p2-inc/keycloak-magic-link</url>

  <licenses>
    <license>
      <name>Apache License, Version 2.0</name>
      <url>https://www.apache.org/licenses/LICENSE-2.0.txt</url>
    </license>
  </licenses>

  <scm>
    <url>https://github.com/p2-inc/keycloak-magic-link</url>
    <connection>scm:git:https://github.com/p2-inc/keycloak-magic-link.git</connection>
  </scm>

  <developers>
    <developer>
      <name>Alice Smith</name>
      <email>alice@example.com</email>
      <organization>Phase Two, Inc.</organization>
      <organizationUrl>https://phasetwo.io</organizationUrl>
    </developer>
    <developer>
      <name>Bob Jones</name>
      <email>bob@example.com</email>
      <organization>Phase Two, Inc.</organization>
      <organizationUrl>https://phasetwo.io</organizationUrl>
    </developer>
  </developers>
</project>`;

const MINIMAL_POM = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>minimal-extension</artifactId>
  <version>1.0.0</version>
</project>`;

const MULTI_DEVELOPER_POM = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>org.example</groupId>
  <artifactId>multi-dev-extension</artifactId>
  <version>2.0.0</version>
  <name>Multi Developer Extension</name>
  <url>https://example.org/multi-dev</url>

  <licenses>
    <license>
      <name>MIT License</name>
      <url>https://opensource.org/licenses/MIT</url>
    </license>
  </licenses>

  <scm>
    <url>https://github.com/example/multi-dev-extension</url>
  </scm>

  <developers>
    <developer>
      <name>Carol White</name>
      <email>carol@example.org</email>
      <organization>Example Org</organization>
      <organizationUrl>https://example.org</organizationUrl>
    </developer>
    <developer>
      <name>Dave Brown</name>
      <email>dave@example.org</email>
    </developer>
    <developer>
      <name>Eve Green</name>
      <email>eve@example.org</email>
      <organization>Example Org</organization>
      <organizationUrl>https://example.org</organizationUrl>
    </developer>
  </developers>
</project>`;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('parsePomMetadata', () => {
	it('extracts all fields from a full POM', () => {
		const meta = parsePomMetadata(FULL_POM);

		expect(meta.name).toBe('Keycloak Magic Link');
		expect(meta.description).toBe('A Keycloak extension that provides magic link authentication.');
		expect(meta.url).toBe('https://github.com/p2-inc/keycloak-magic-link');
		expect(meta.licenseName).toBe('Apache License, Version 2.0');
		expect(meta.licenseUrl).toBe('https://www.apache.org/licenses/LICENSE-2.0.txt');
		// SCM <url> is preferred over <connection>
		expect(meta.scmUrl).toBe('https://github.com/p2-inc/keycloak-magic-link');
		expect(meta.developers).toHaveLength(2);
		expect(meta.developers[0]).toEqual({
			name: 'Alice Smith',
			email: 'alice@example.com',
			org: 'Phase Two, Inc.',
			orgUrl: 'https://phasetwo.io'
		});
		expect(meta.developers[1]).toEqual({
			name: 'Bob Jones',
			email: 'bob@example.com',
			org: 'Phase Two, Inc.',
			orgUrl: 'https://phasetwo.io'
		});
	});

	it('returns null/[] for all optional fields in a minimal POM', () => {
		const meta = parsePomMetadata(MINIMAL_POM);

		expect(meta.name).toBeNull();
		expect(meta.description).toBeNull();
		expect(meta.url).toBeNull();
		expect(meta.licenseName).toBeNull();
		expect(meta.licenseUrl).toBeNull();
		expect(meta.scmUrl).toBeNull();
		expect(meta.developers).toEqual([]);
	});

	it('extracts all three developers from a multi-developer POM', () => {
		const meta = parsePomMetadata(MULTI_DEVELOPER_POM);

		expect(meta.developers).toHaveLength(3);
		expect(meta.developers[0].name).toBe('Carol White');
		expect(meta.developers[0].org).toBe('Example Org');
		expect(meta.developers[1].name).toBe('Dave Brown');
		// Dave has no organization — should be null
		expect(meta.developers[1].org).toBeNull();
		expect(meta.developers[1].orgUrl).toBeNull();
		expect(meta.developers[2].name).toBe('Eve Green');
	});

	it('does not pick up <url> from inside <scm> or <licenses> blocks as project url', () => {
		// Construct a POM where the only <url> tags are inside nested blocks
		const pomWithNestedUrlsOnly = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <groupId>org.test</groupId>
  <artifactId>nested-url-test</artifactId>
  <version>1.0.0</version>
  <licenses>
    <license>
      <name>MIT</name>
      <url>https://opensource.org/licenses/MIT</url>
    </license>
  </licenses>
  <scm>
    <url>https://github.com/test/nested-url-test</url>
  </scm>
</project>`;

		const meta = parsePomMetadata(pomWithNestedUrlsOnly);
		// Project url should be null — not accidentally matched from nested blocks
		expect(meta.url).toBeNull();
		// But the nested-block URLs should be correctly extracted in their own fields
		expect(meta.licenseUrl).toBe('https://opensource.org/licenses/MIT');
		expect(meta.scmUrl).toBe('https://github.com/test/nested-url-test');
	});
});
