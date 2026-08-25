import type { Tag } from '@lib/types';

/**
 * Tags describe how a place *feels* or *works* for a traveller, as opposed to
 * what it is (that is the category's job). They power the "Travel by interest"
 * navigation, the discovery quiz and most of the filter chips.
 *
 * Keep the list tight. A tag that applies to almost everything filters nothing.
 */
export const tags: Tag[] = [
  /* — Trip shape — */
  { slug: 'day-trip', name: 'Day Trip', nameBn: 'একদিনের ভ্রমণ', featured: true, description: 'Reachable and enjoyable in a single day from a major city, without an overnight stay.' },
  { slug: 'weekend', name: 'Weekend Trip', nameBn: 'সপ্তাহান্তের ভ্রমণ', featured: true, description: 'One or two nights — the classic Thursday-evening-to-Saturday-night Bangladeshi break.' },
  { slug: 'expedition', name: 'Expedition', description: 'Needs three days or more, and usually a guide, permits or a boat charter.' },
  { slug: 'road-trip', name: 'Road Trip', description: 'The drive is a substantial part of the appeal.' },
  { slug: 'boat-trip', name: 'Boat Trip', nameBn: 'নৌভ্রমণ', featured: true, description: 'Only reachable by water, or best experienced from a boat.' },

  /* — Who it suits — */
  { slug: 'family', name: 'Family Friendly', nameBn: 'পরিবারের জন্য', featured: true, description: 'Works with children and older relatives: short walks, shade, food nearby and no serious hazards.' },
  { slug: 'couples', name: 'For Couples', description: 'Quiet, unhurried places that reward taking your time.' },
  { slug: 'solo', name: 'Good Solo', description: 'Straightforward and safe to visit alone, with easy public transport and other visitors around.' },
  { slug: 'group', name: 'Groups & Friends', description: 'Best with a few people — shared boat hire, shared jeeps, or simply more fun in company.' },
  { slug: 'students', name: 'Budget & Students', description: 'Cheap to reach and cheap to be at; the backbone of Bangladeshi student travel.' },

  /* — What you go for — */
  { slug: 'photography', name: 'Photography', nameBn: 'ফটোগ্রাফি', featured: true, description: 'Places that genuinely reward carrying a camera — strong light, structure or scale.' },
  { slug: 'sunrise', name: 'Sunrise', description: 'The early start is the whole point.' },
  { slug: 'sunset', name: 'Sunset', description: 'Best in the last hour of light.' },
  { slug: 'birdwatching', name: 'Birdwatching', nameBn: 'পাখি দেখা', featured: true, description: 'Wetlands and forests with a reliable species list, mostly between November and February.' },
  { slug: 'trekking', name: 'Trekking', nameBn: 'ট্রেকিং', featured: true, description: 'Requires real walking — an hour or more on foot, often on rough ground.' },
  { slug: 'adventure', name: 'Adventure', nameBn: 'অ্যাডভেঞ্চার', featured: true, description: 'Rapids, ridges, caves and long river journeys. Not for a first trip.' },
  { slug: 'swimming', name: 'Swimming', description: 'Safe water for a swim, at least in the right season.' },
  { slug: 'camping', name: 'Camping', description: 'Overnighting on site is normal and permitted.' },
  { slug: 'food', name: 'Food Destination', nameBn: 'খাবার', featured: true, description: 'Somewhere you would travel for the eating alone.' },
  { slug: 'shopping', name: 'Crafts & Shopping', description: 'Buy directly from weavers, potters and growers.' },
  { slug: 'architecture', name: 'Architecture', featured: true, description: 'Worth visiting for the building itself, not only its history.' },
  { slug: 'pilgrimage', name: 'Pilgrimage', nameBn: 'তীর্থ', description: 'An active place of devotion; dress and behave accordingly.' },
  { slug: 'literary', name: 'Literary', description: 'Tied to a writer, a poem or a novel that shaped Bengali culture.' },
  { slug: 'festival', name: 'Festival Site', description: 'Transformed by a specific annual event — an urs, a mela, a boat race.' },

  /* — Character — */
  { slug: 'hidden-gem', name: 'Hidden Gem', nameBn: 'অজানা রত্ন', featured: true, description: 'Genuinely under-visited relative to how good it is.' },
  { slug: 'iconic', name: 'Iconic', description: 'The places every Bangladeshi can name.' },
  { slug: 'unesco', name: 'UNESCO Listed', description: 'Inscribed on the UNESCO World Heritage List.' },
  { slug: 'offbeat', name: 'Offbeat', description: 'Odd, specific and not on any standard itinerary.' },
  { slug: 'crowded', name: 'Gets Crowded', description: 'Busy on Fridays and public holidays; go on a weekday if you can.' },
  { slug: 'seasonal', name: 'Strongly Seasonal', featured: true, description: 'Only worth the trip in a specific window — a monsoon flood, a flowering, a migration, a harvest.' },
  { slug: 'accessible', name: 'Step-Free Access', description: 'Most of the site can be reached without stairs or rough ground.' },
  { slug: 'permit', name: 'Permit / Escort Needed', description: 'Requires official permission, a registered guide or a convoy. Check current rules before travelling.' },
  { slug: 'free', name: 'Free to Visit', description: 'No entry ticket.' },
  { slug: 'night', name: 'Overnight On Site', description: 'The experience includes sleeping there — on a boat, in a forest rest house, or on a beach.' },
];

export const tagBySlug = new Map(tags.map((t) => [t.slug, t]));
export const featuredTags = tags.filter((t) => t.featured);
