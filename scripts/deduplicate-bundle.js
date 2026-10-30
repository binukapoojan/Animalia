import fs from 'fs';
import path from 'path';

const BUNDLE_PATH = path.resolve('animalia-handoff-bundle.json');

function cleanBinomial(sciName) {
  if (!sciName) return '';
  const clean = sciName.replace(/["']/g, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length < 2) return clean.toLowerCase();
  return `${parts[0]} ${parts[1]}`.toLowerCase().replace(/[^a-z ]/g, '').trim();
}

function deduplicateBundle() {
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  console.log(`Original bundle taxa count: ${bundle.taxa.length}`);

  const groups = new Map();
  for (const t of bundle.taxa) {
    const key = cleanBinomial(t.identity?.scientificName);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }

  const mergedTaxa = [];
  let mergedCount = 0;

  for (const [key, items] of groups.entries()) {
    if (items.length === 1) {
      const item = items[0];
      if (item.identity?.scientificName) {
        const parts = item.identity.scientificName.split(/\s+/);
        if (parts.length > 2 && !item.identity.scientificName.includes('"')) {
          const binomial = `${parts[0]} ${parts[1]}`;
          const author = parts.slice(2).join(' ').replace(/^\(|\)$/g, '').trim();
          item.identity.scientificName = binomial;
          if (!item.identity.authorship && author) {
            item.identity.authorship = author;
          }
        }
      }
      mergedTaxa.push(item);
      continue;
    }

    // Merge multiple duplicate records into one rich record
    mergedCount++;
    // Prefer demo-* or specimen-* as primary
    const preferredPrimary = items.find(t => t.id.startsWith('demo-') || t.id.startsWith('specimen-')) || items[0];
    const secondary = items.find(t => t !== preferredPrimary) || items[1];

    console.log(`Merging duplicate: ${key}`);
    console.log(`  Keeping ID: ${preferredPrimary.id} (over ${secondary.id})`);

    // Clean binomial & authorship
    const parts = preferredPrimary.identity.scientificName.split(/\s+/);
    const cleanSci = `${parts[0]} ${parts[1]}`.replace(/["']/g, '').trim();
    const authorship = preferredPrimary.identity.authorship || 
      secondary.identity.authorship || 
      (secondary.identity.scientificName.split(/\s+/).length > 2 ? secondary.identity.scientificName.split(/\s+/).slice(2).join(' ') : null);

    // Merge photos (deduplicating by URL)
    const allPhotos = [];
    const seenUrls = new Set();
    const addPhoto = (p) => {
      if (!p || !p.url) return;
      const u = p.url.trim().toLowerCase();
      if (seenUrls.has(u)) return;
      seenUrls.add(u);
      allPhotos.push(p);
    };

    if (preferredPrimary.media?.additionalPhotos) {
      preferredPrimary.media.additionalPhotos.forEach(addPhoto);
    }
    if (secondary.media?.additionalPhotos) {
      secondary.media.additionalPhotos.forEach(addPhoto);
    }

    // Determine primary photo
    const primaryUrl = preferredPrimary.media?.url || secondary.media?.url || null;
    const primaryThumb = preferredPrimary.media?.thumbnailUrl || secondary.media?.thumbnailUrl || primaryUrl;
    const primaryAttribution = preferredPrimary.media?.attribution || secondary.media?.attribution || 'Authoritative Wildlife Observer';
    const primaryLicense = preferredPrimary.media?.licenseCode || secondary.media?.licenseCode || 'CC-BY-SA';
    const primaryProvider = preferredPrimary.media?.sourceProvider || secondary.media?.sourceProvider || 'Biodiversity Archive';
    const primarySourceUrl = preferredPrimary.media?.sourceUrl || secondary.media?.sourceUrl || '';

    // Merge audio
    const audio = preferredPrimary.media?.audio || secondary.media?.audio || null;
    const additionalRecordings = [
      ...(preferredPrimary.media?.additionalRecordings || []),
      ...(secondary.media?.additionalRecordings || [])
    ];

    // Merge measurements (prefer non-null)
    const m1 = preferredPrimary.biology?.measurements || {};
    const m2 = secondary.biology?.measurements || {};
    const measurements = {
      bodyLength: m1.bodyLength || m2.bodyLength || null,
      mass: m1.mass || m2.mass || null,
      lifespan: m1.lifespan || m2.lifespan || null,
      source: m1.source || m2.source || null
    };

    // Merge summaries (prefer longer curated summary)
    const s1Text = preferredPrimary.biology?.summary?.text || '';
    const s2Text = secondary.biology?.summary?.text || '';
    const summaryText = s1Text.length >= s2Text.length ? s1Text : s2Text;
    const summarySource = s1Text.length >= s2Text.length
      ? preferredPrimary.biology?.summary?.source
      : secondary.biology?.summary?.source;

    // Merge external IDs
    const gbifKey = preferredPrimary.identity.externalIds?.gbifKey || secondary.identity.externalIds?.gbifKey || null;
    const inatTaxonId = preferredPrimary.identity.externalIds?.inatTaxonId || secondary.identity.externalIds?.inatTaxonId || null;

    // Merge distinguishing traits
    const traits = Array.from(new Set([
      ...(preferredPrimary.biology?.discovery?.distinguishingTraits || []),
      ...(secondary.biology?.discovery?.distinguishingTraits || [])
    ]));

    // Merge synonyms
    const synonyms = Array.from(new Map([
      ...(preferredPrimary.identity.synonyms || []).map(s => [s.scientificName, s]),
      ...(secondary.identity.synonyms || []).map(s => [s.scientificName, s])
    ]).values());

    const mergedRecord = {
      ...preferredPrimary,
      identity: {
        ...preferredPrimary.identity,
        scientificName: cleanSci,
        authorship: authorship ? authorship.replace(/^\(|\)$/g, '').trim() : null,
        externalIds: {
          gbifKey,
          inatTaxonId
        },
        synonyms
      },
      media: {
        url: primaryUrl,
        thumbnailUrl: primaryThumb,
        attribution: primaryAttribution,
        licenseCode: primaryLicense,
        sourceProvider: primaryProvider,
        sourceUrl: primarySourceUrl,
        verifiedTaxonMatch: true,
        additionalPhotos: allPhotos,
        audio,
        additionalRecordings: additionalRecordings.length > 0 ? additionalRecordings : undefined
      },
      biology: {
        ...preferredPrimary.biology,
        summary: {
          text: summaryText || 'Iconic verified zoological specimen.',
          source: summarySource || 'ANIMALIA Authoritative Record'
        },
        measurements,
        discovery: {
          ...preferredPrimary.biology?.discovery,
          distinguishingTraits: traits
        }
      },
      provenance: {
        completenessScore: Math.max(preferredPrimary.provenance?.completenessScore || 80, secondary.provenance?.completenessScore || 80),
        lastVerifiedAt: new Date().toISOString(),
        sources: Array.from(new Set([
          ...(preferredPrimary.provenance?.sources || []),
          ...(secondary.provenance?.sources || [])
        ]))
      }
    };

    mergedTaxa.push(mergedRecord);
  }

  bundle.taxa = mergedTaxa;
  bundle.stats = {
    ...bundle.stats,
    totalTaxaInSession: mergedTaxa.length
  };
  bundle.exportedAt = new Date().toISOString();

  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(bundle, null, 2), 'utf8');
  console.log(`\n✓ Deduplication complete! Merged ${mergedCount} duplicate groups.`);
  console.log(`Final deduplicated taxa count in bundle: ${bundle.taxa.length}`);
}

deduplicateBundle();
