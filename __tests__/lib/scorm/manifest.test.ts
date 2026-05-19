import { describe, it, expect } from 'vitest'
import { parseManifest } from '@/lib/scorm/manifest'

const SCORM_12_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course1" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>Test Course</title>
      <item identifier="item1" identifierref="res1">
        <title>Lesson 1</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`

const SCORM_2004_MANIFEST = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="course2"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org1">
    <organization identifier="org1">
      <title>Test 2004 Course</title>
      <item identifier="item1" identifierref="res1">
        <title>Module 1</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res1" type="webcontent" adlcp:scormType="sco" href="scormcontent/index.html">
      <file href="scormcontent/index.html"/>
    </resource>
  </resources>
</manifest>`

describe('parseManifest', () => {
  it('detects SCORM 1.2 version and launch file', () => {
    const result = parseManifest(SCORM_12_MANIFEST)
    expect(result.version).toBe('1.2')
    expect(result.launchFile).toBe('index.html')
  })

  it('detects SCORM 2004 version and launch file', () => {
    const result = parseManifest(SCORM_2004_MANIFEST)
    expect(result.version).toBe('2004')
    expect(result.launchFile).toBe('scormcontent/index.html')
  })

  it('rejects path traversal in href', () => {
    const malicious = SCORM_12_MANIFEST.replace('index.html', '../../../etc/passwd')
    expect(() => parseManifest(malicious)).toThrow('path traversal')
  })

  it('throws on missing manifest XML', () => {
    expect(() => parseManifest('')).toThrow()
  })

  it('throws on manifest with no resources', () => {
    const noResources = `<?xml version="1.0"?>
    <manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
      <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion></metadata>
      <organizations default="org1">
        <organization identifier="org1"><title>Empty</title></organization>
      </organizations>
      <resources></resources>
    </manifest>`
    expect(() => parseManifest(noResources)).toThrow('No launchable resource')
  })
})
