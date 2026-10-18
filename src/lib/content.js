export const photo = (id, width = 1500) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

export const editorialPhotos = {
  hero: 'photo-1600210492486-724fe5c67fb0',
  home: 'photo-1600607687939-ce8a6c25118c',
  garden: 'photo-1600566753086-00f18fb6b3ea',
  interior: 'photo-1600210492486-724fe5c67fb0',
}

export const propertyPhotoSets = {
  house: ['photo-1600210492486-724fe5c67fb0', 'photo-1600566753086-00f18fb6b3ea', 'photo-1600607687939-ce8a6c25118c', 'photo-1600585154340-be6161a56a0c', 'photo-1600585154526-990dced4db0d', 'photo-1600566753190-17f0baa2a6c3', 'photo-1600585152915-d208bec867a1', 'photo-1613490493576-7fde63acd811'],
  apartment: ['photo-1600607687939-ce8a6c25118c', 'photo-1600210492486-724fe5c67fb0', 'photo-1600566753086-00f18fb6b3ea', 'photo-1600566753190-17f0baa2a6c3', 'photo-1613977257363-707ba9348227', 'photo-1600585152915-d208bec867a1', 'photo-1600585154340-be6161a56a0c', 'photo-1613490493576-7fde63acd811'],
  land: ['photo-1500382017468-9049fed747ef', 'photo-1500530855697-b586d89ba3ee', 'photo-1470770841072-f978cf4d019e', 'photo-1511497584788-876760111969', 'photo-1500534623283-312aade485b7', 'photo-1518837695005-2083093ee35b', 'photo-1501785888041-af3ef285b470', 'photo-1426604966848-d7adac402bff'],
  commercial: ['photo-1486406146926-c627a92ad1ab', 'photo-1497366858526-0766cadbe8fa', 'photo-1613490493576-7fde63acd811', 'photo-1487958449943-2429e8be8625', 'photo-1497366216548-37526070297c', 'photo-1497366754035-f200968a6e72', 'photo-1497366811353-6870744d04b2', 'photo-1524758631624-e2822e304c36'],
  office: ['photo-1497366754035-f200968a6e72', 'photo-1497366811353-6870744d04b2', 'photo-1497366216548-37526070297c', 'photo-1524758631624-e2822e304c36', 'photo-1497366858526-0766cadbe8fa', 'photo-1486406146926-c627a92ad1ab', 'photo-1487958449943-2429e8be8625', 'photo-1613490493576-7fde63acd811'],
  shop: ['photo-1441986300917-64674bd600d8', 'photo-1472851294608-062f824d29cc', 'photo-1556742049-0cfed4f6a45d', 'photo-1512436991641-6745cdb1723f', 'photo-1551232864-3f0890e580d9', 'photo-1483985988355-763728e1935b', 'photo-1721152531778-47bb07d618bc', 'photo-1768758533474-5cd148638a98'],
  other: ['photo-1600607687939-ce8a6c25118c', 'photo-1600210492486-724fe5c67fb0', 'photo-1600566753086-00f18fb6b3ea', 'photo-1486406146926-c627a92ad1ab', 'photo-1500382017468-9049fed747ef', 'photo-1497366754035-f200968a6e72', 'photo-1441986300917-64674bd600d8', 'photo-1600585154340-be6161a56a0c'],
}
export const photoLocationInspirations = ['Lagos, Nigeria', 'Accra, Ghana', 'Nairobi, Kenya', 'Cape Town, South Africa', 'Marrakech, Morocco', 'Lisbon, Portugal', 'London, United Kingdom', 'Copenhagen, Denmark', 'Paris, France', 'Istanbul, Türkiye', 'Dubai, UAE', 'Singapore', 'Mumbai, India', 'Toronto, Canada', 'New York, USA', 'São Paulo, Brazil', 'Sydney, Australia', 'Auckland, New Zealand']
const locationOffsets = { house: 0, apartment: 2, land: 4, commercial: 6, office: 8, shop: 10, other: 12 }

export function getPropertyImages(property) {
  const supplied = Array.isArray(property?.image_urls) ? property.image_urls.filter(url => typeof url === 'string' && /^https:\/\/\S+$/.test(url)) : []
  if (supplied.length) return supplied
  const type = property?.property_type in propertyPhotoSets ? property.property_type : 'other'
  return propertyPhotoSets[type].map(id => photo(id, 1400))
}

export function getPropertyPhotoLocation(property, imageIndex = 0) {
  if (property?.image_urls?.length) return null
  const type = property?.property_type in locationOffsets ? property.property_type : 'other'
  const index = (imageIndex + locationOffsets[type]) % photoLocationInspirations.length
  return photoLocationInspirations[index]
}
