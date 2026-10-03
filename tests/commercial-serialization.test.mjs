import test from 'node:test'
import assert from 'node:assert/strict'
import server from '../lib/commercial/server.ts'
import { registration } from './fixtures/commercial.mjs'
import { commercialFixture } from './fixtures/promo-commercial.mjs'

function approvedRecord(geo = 'MX') {
  return registration(geo, { offer: structuredClone(commercialFixture(geo).campaigns[0]) })
}

test('public campaign snapshots allow-list nested fields and drop private configuration extras', () => {
  for (const geo of ['MX', 'CO', 'PE']) {
    const record = approvedRecord(geo)
    const original = structuredClone(record)
    record.offer.copy[`es-${geo}`].privateAffiliateUrl = 'https://partner.test/private-only-fixture'
    record.offer.offer.complianceReview.privateCredential = { token: 'private-review-marker' }
    record.offer.cadence.privateCampaign = { id: 'private-cadence-marker' }
    const snapshot = server.snapshotFromRegistry(geo, [record])
    assert.equal(snapshot.offers.length, 1)
    assert.equal(snapshot.campaigns.length, 1)
    assert.deepEqual(snapshot.campaigns[0].copy, original.offer.copy)
    assert.deepEqual(snapshot.campaigns[0].cadence, original.offer.cadence)
    assert.deepEqual(snapshot.offers[0].complianceReview, original.offer.offer.complianceReview)
    assert.doesNotMatch(JSON.stringify(snapshot), /private-only-fixture|private-review-marker|private-cadence-marker|privateAffiliateUrl|privateCredential|privateCampaign/)
  }
})

test('coercible objects and arrays cannot cross selected scalar publication fields', () => {
  const paths = [
    ['offer', 'validFrom'], ['offer', 'validUntil'],
    ['offer', 'offer', 'source'], ['offer', 'offer', 'lastVerifiedAt'], ['offer', 'offer', 'status'],
    ['offer', 'offer', 'complianceReview', 'status'], ['offer', 'offer', 'complianceReview', 'market'],
    ['offer', 'offer', 'complianceReview', 'legalSource'], ['offer', 'offer', 'complianceReview', 'verifiedAt'],
    ['offer', 'offer', 'complianceReview', 'reviewBy'],
  ]
  for (const path of paths) {
    const record = approvedRecord()
    const parent = path.slice(0, -1).reduce((value, key) => value[key], record)
    const key = path.at(-1)
    parent[key] = [parent[key]]
    const snapshot = server.snapshotFromRegistry('MX', [record])
    assert.equal(snapshot.operators.length, 1, 'an invalid offer does not grant or revoke separate operator approval')
    assert.equal(snapshot.offers.length, 0, path.join('.'))
    assert.equal(snapshot.campaigns.length, 0, path.join('.'))
  }
})

test('legal status and dates require scalar strings before operator publication', () => {
  for (const field of ['status', 'source', 'verifiedAt', 'reviewBy']) {
    const record = approvedRecord()
    const legal = {
      status: 'verified', source: 'https://partner.test/legal',
      verifiedAt: new Date(Date.now() - 86_400_000).toISOString(),
      reviewBy: new Date(Date.now() + 86_400_000).toISOString(),
    }
    record.legal = { ...legal, [field]: [legal[field]] }
    assert.equal(server.snapshotFromRegistry('MX', [record]).operators.length, 0, field)
  }
})
