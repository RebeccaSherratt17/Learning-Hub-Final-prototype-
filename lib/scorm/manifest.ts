// Server-only: this module is used by server-side upload pipeline only.
// Do not import from client components.

export interface ManifestResult {
  version: '1.2' | '2004'
  launchFile: string
}

/**
 * Parse a SCORM imsmanifest.xml string.
 * Returns the SCORM version and the launch file path.
 * Throws on invalid/malicious manifests.
 */
export function parseManifest(xml: string): ManifestResult {
  if (!xml || !xml.trim()) {
    throw new Error('Empty manifest XML')
  }

  // Detect SCORM version from schemaversion element
  const schemaVersionMatch = xml.match(/<schemaversion[^>]*>([\s\S]*?)<\/schemaversion>/i)
  const schemaVersion = schemaVersionMatch?.[1]?.trim() ?? ''

  let version: '1.2' | '2004'
  if (schemaVersion.startsWith('2004') || schemaVersion.includes('CAM 1.3')) {
    version = '2004'
  } else if (schemaVersion === '1.2' || schemaVersion.startsWith('1.')) {
    version = '1.2'
  } else {
    // Fallback: check namespace for 2004 indicator
    if (xml.includes('imscp_v1p1') || xml.includes('adlcp_v1p3')) {
      version = '2004'
    } else {
      version = '1.2'
    }
  }

  // Find the default organization
  const defaultOrgMatch = xml.match(/<organizations[^>]*default="([^"]+)"/)
  const defaultOrgId = defaultOrgMatch?.[1]

  // Find the first item with identifierref in the default org (or any org)
  let identifierref: string | null = null

  if (defaultOrgId) {
    const orgRegex = new RegExp(
      `<organization[^>]*identifier="${defaultOrgId}"[^>]*>([\\s\\S]*?)<\\/organization>`,
      'i'
    )
    const orgMatch = xml.match(orgRegex)
    if (orgMatch) {
      const itemMatch = orgMatch[1].match(/identifierref="([^"]+)"/)
      identifierref = itemMatch?.[1] ?? null
    }
  }

  // Fallback: first item with identifierref anywhere
  if (!identifierref) {
    const itemMatch = xml.match(/identifierref="([^"]+)"/)
    identifierref = itemMatch?.[1] ?? null
  }

  if (!identifierref) {
    throw new Error('No launchable resource found in manifest')
  }

  // Find the resource with matching identifier and extract href
  const resourceRegex = new RegExp(
    `<resource[^>]*identifier="${identifierref}"[^>]*href="([^"]+)"`,
    'i'
  )
  const resourceMatch = xml.match(resourceRegex)
  const launchFile = resourceMatch?.[1]

  if (!launchFile) {
    const altRegex = new RegExp(
      `<resource[^>]*identifier="${identifierref}"[^>]*>`,
      'i'
    )
    const altMatch = xml.match(altRegex)
    if (!altMatch) {
      throw new Error('No launchable resource found in manifest')
    }
    throw new Error('Resource found but no href attribute on resource element')
  }

  // Security: reject path traversal
  if (launchFile.includes('..')) {
    throw new Error('Invalid manifest: path traversal detected in resource href')
  }

  return { version, launchFile }
}
