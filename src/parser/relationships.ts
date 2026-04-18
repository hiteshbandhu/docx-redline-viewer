import type { RelationshipMap } from './types'

export function parseRelationships(xml: string): RelationshipMap {
  const map: RelationshipMap = {}
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const rels = doc.querySelectorAll('Relationship')
  for (const rel of rels) {
    const id = rel.getAttribute('Id')
    const target = rel.getAttribute('Target')
    if (id && target) map[id] = target
  }
  return map
}
