"""Deterministic generator for data/parcels.json. All names and places are fictional."""
import json, random, math
random.seed(42)

# City centers on the 1000x1000 stylized map (x east, y south) derived from approx lat/lon.
CITIES = {
  'Santa Ana': (373, 351), 'Anaheim': (313, 193), 'Garden Grove': (269, 316), 'Westminster': (194, 351),
  'Fullerton': (299, 140), 'Orange': (403, 281), 'Costa Mesa': (313, 544), 'Irvine': (448, 474),
  'Tustin': (448, 368), 'Huntington Beach': (194, 509),
}
LANG_BY_CITY = {
  'Santa Ana': ['es','es','es','en'], 'Anaheim': ['es','en','en'], 'Garden Grove': ['vi','vi','en','ko'], 'Westminster': ['vi','vi','en'],
  'Fullerton': ['ko','en','es'], 'Orange': ['en','en','es'], 'Costa Mesa': ['en','es'], 'Irvine': ['en','ko','en'],
  'Tustin': ['en','es'], 'Huntington Beach': ['en','en'],
}
FAITHS = [
  ('Baptist church','church'),('United Methodist church','church'),('Lutheran church','church'),('Catholic parish','church'),
  ('Presbyterian church','church'),('Episcopal church','church'),('Pentecostal church','church'),('Korean Presbyterian church','church'),
  ('Vietnamese Catholic parish','church'),('Evangelical church','church'),('Synagogue','synagogue'),('Islamic center','mosque'),
  ('Buddhist temple','temple'),('Sikh gurdwara','gurdwara'),('Hindu temple','temple'),('Friends meeting','meetinghouse'),
  ('Nondenominational church','church'),('Seventh-day Adventist church','church'),('Orthodox church','church'),('Community church','church'),
]
FIRST = ['Elm Hollow','Harbor Light','Cedar Mesa','Willow Creek','Sunrise Hill','Palmgrove','Riverbend','Canyon View','Bright Water','Meadowlark',
 'Stonebridge','Fairhaven','Silver Lake','Hilltop','Blue Jacaranda','Lantern Hill','Pepper Tree','Goldenrod','Maple Court','Orchard Gate',
 'Eastwind','Quiet Harbor','Mission Vale','Seabreeze','Ironwood','Coral Point','Bellflower','Sycamore Row','Saddleback View','Morning Star',
 'Wisteria','Three Oaks','Magnolia Hill','Sandpiper','Crescent','Sagebrush','Clearwater','Horizon','Greenfield','Peregrine',
 'Dove Hollow','Red Barn','Shepherd Hill','Kingfisher','Amber Grove','Northgate','Tidewater','Cottonwood','Lighthouse','Juniper']
random.shuffle(FIRST)

def faith_name(first, faith):
    label = faith[0]
    if 'Catholic parish' in label:
        return f"{first} Catholic Parish (sample)"
    if label == 'Synagogue': return f"Temple {first} (sample)"
    if label == 'Islamic center': return f"{first} Islamic Center (sample)"
    if label == 'Buddhist temple': return f"{first} Buddhist Temple (sample)"
    if label == 'Sikh gurdwara': return f"{first} Gurdwara Sahib (sample)"
    if label == 'Hindu temple': return f"{first} Hindu Temple (sample)"
    if label == 'Friends meeting': return f"{first} Friends Meeting (sample)"
    if 'Korean' in label: return f"{first} Korean Presbyterian Church (sample)"
    if 'Vietnamese' in label: return f"{first} Vietnamese Catholic Parish (sample)"
    base = label.replace(' church','').replace(' parish','')
    return f"{first} {base} Church (sample)"

def slug(s):
    return ''.join(c if c.isalnum() else '-' for c in s.lower().replace(' (sample)','')).strip('-').replace('--','-')

# Lot shape templates: polygon (normalized, bbox inside [0,1]), building rect, parking rect(s), street side.
def shapes():
    return [
      # wide rectangle, building top-left, parking top-right
      dict(poly=[(0,0),(1,0),(1,0.72),(0,0.72)], bld=(0.06,0.08,0.3,0.24), park=[(0.42,0.06,0.52,0.3)], street='top'),
      # deep rectangle, building bottom-left, parking along left
      dict(poly=[(0,0),(0.78,0),(0.78,1),(0,1)], bld=(0.08,0.66,0.3,0.26), park=[(0.08,0.1,0.26,0.5)], street='bottom'),
      # L-shape
      dict(poly=[(0,0),(1,0),(1,0.5),(0.55,0.5),(0.55,0.9),(0,0.9)], bld=(0.06,0.08,0.28,0.22), park=[(0.4,0.06,0.54,0.38)], street='top'),
      # trapezoid
      dict(poly=[(0.08,0),(0.92,0),(1,0.8),(0,0.8)], bld=(0.12,0.08,0.3,0.26), park=[(0.5,0.1,0.4,0.3)], street='top'),
      # chamfered corner
      dict(poly=[(0,0),(0.82,0),(1,0.18),(1,0.88),(0,0.88)], bld=(0.6,0.52,0.32,0.28), park=[(0.06,0.52,0.48,0.3)], street='bottom'),
      # square campus
      dict(poly=[(0,0),(1,0),(1,1),(0,1)], bld=(0.08,0.08,0.34,0.3), park=[(0.5,0.08,0.44,0.36),(0.08,0.44,0.34,0.2)], street='top'),
      # long frontage
      dict(poly=[(0,0),(1,0),(1,0.55),(0,0.55)], bld=(0.66,0.08,0.28,0.3), park=[(0.06,0.08,0.54,0.24)], street='top'),
    ]

def jitter(cx, cy, r=62):
    a = random.random()*math.tau; d = random.random()**0.6 * r
    return round(cx + math.cos(a)*d), round(cy + math.sin(a)*d*0.9)

parcels = []
used = set()
def pos(city):
    for _ in range(50):
        x,y = jitter(*CITIES[city])
        if all((x-ux)**2+(y-uy)**2 > 24**2 for ux,uy in used):
            used.add((x,y)); return x,y
    used.add((x,y)); return x,y

cities = list(CITIES)
# 48 congregations
plan_c = []
for i in range(48):
    plan_c.append(cities[i % len(cities)])
random.shuffle(plan_c)
fi = 0
for i,city in enumerate(plan_c):
    faith = FAITHS[i % len(FAITHS)]
    first = FIRST[fi]; fi += 1
    name = faith_name(first, faith)
    shp = random.choice(shapes())
    lot = round(random.choice([1.4,1.8,2.1,2.4,2.8,3.2,3.6,4.1,4.6,5.2,6.0,7.5]) * random.uniform(0.9,1.1), 2)
    bshare = random.uniform(0.14,0.26); pshare = random.uniform(0.28,0.48)
    bld = round(lot*bshare,2); park = round(lot*pshare,2); openA = round(max(0.1, lot-bld-park),2)
    spaces = int(park*43560/350)
    # ownership dates: most long-held; two acquired after cutoff (ineligible congregations)
    if i in (7, 29):
        since = random.choice(['2024-03-15','2024-09-01'])
    else:
        since = f"{random.randint(1952,2021)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
    zoning = random.choices(['residential','institutional','commercial'],[0.55,0.33,0.12])[0]
    hazards = []
    if random.random() < 0.08: hazards.append('liquefaction')
    if random.random() < 0.05: hazards.append('noise-airport')
    if city in ('Orange','Irvine','Tustin','Anaheim') and random.random() < 0.08: hazards.append('fire-severity')
    flood = random.random() < 0.1
    x,y = pos(city)
    parcels.append(dict(
      id=slug(name)+'-'+city.lower().split()[0][:2]+str(i%10), displayName=name, ownerType='congregation', ownerSince=since, faith=faith[0], city=city,
      mapX=x, mapY=y, lotAcres=lot, buildingAcres=bld, parkingAcres=park, parkingSpaces=spaces, openAcres=openA,
      zoning=zoning, nearSchoolM=random.choice([180,260,350,420,600,750,900,1200,1800]), nearTransitM=random.choice([120,200,300,380,450,650,800,1100,1500,2200]),
      nearGroceryM=random.choice([250,400,550,700,900,1300,1700]), slopePct=random.choice([1,1,2,2,3,4,6,9]) + (6 if 'fire-severity' in hazards else 0),
      floodZone=flood, hazards=hazards, congregationLanguage=random.choice(LANG_BY_CITY[city]),
      lotPolygon=[dict(x=px,y=py) for px,py in shp['poly']], buildingRect=dict(zip('xywh',shp['bld'])), parkingRects=[dict(zip('xywh',p)) for p in shp['park']], streetSide=shp['street'],
    ))
# 2 colleges
for name, city, lot in [("Pacific Crest College (sample)", 'Orange', 14.0), ("Harborview Theological Seminary (sample)", 'Costa Mesa', 9.5)]:
    shp = shapes()[5]
    x,y = pos(city)
    bld = round(lot*0.22,2); park = round(lot*0.34,2); openA = round(lot-bld-park,2)
    parcels.append(dict(id=slug(name), displayName=name, ownerType='college', ownerSince='1968-08-15' if lot>10 else '1991-02-02', faith='Independent nonprofit college', city=city,
      mapX=x, mapY=y, lotAcres=lot, buildingAcres=bld, parkingAcres=park, parkingSpaces=int(park*43560/350), openAcres=openA, zoning='institutional',
      nearSchoolM=200, nearTransitM=350 if city=='Orange' else 600, nearGroceryM=800, slopePct=2, floodZone=False, hazards=[], congregationLanguage='en',
      lotPolygon=[dict(x=px,y=py) for px,py in shp['poly']], buildingRect=dict(zip('xywh',shp['bld'])), parkingRects=[dict(zip('xywh',p)) for p in shp['park']], streetSide=shp['street']))
# 10 ineligible controls
controls = [
  ("Westgate Logistics Yard (sample)", 'commercial', 'Anaheim', 'commercial'),
  ("Harbor Plaza Shopping Center (sample)", 'commercial', 'Garden Grove', 'commercial'),
  ("Coast Auto Mall Lot C (sample)", 'commercial', 'Huntington Beach', 'commercial'),
  ("Brookline Estate (private) (sample)", 'private', 'Orange', 'residential'),
  ("Vista Family Trust Lot (sample)", 'private', 'Tustin', 'residential'),
  ("Alder Street Duplexes (sample)", 'private', 'Santa Ana', 'residential'),
  ("Meridian Holdings Parcel (sample)", 'private', 'Irvine', 'commercial'),
  ("City Corporation Yard (sample)", 'public', 'Fullerton', 'institutional'),
  ("Flood Control Basin 12 (sample)", 'public', 'Westminster', 'institutional'),
  ("District Bus Depot (sample)", 'public', 'Costa Mesa', 'institutional'),
]
for name, otype, city, zoning in controls:
    shp = random.choice(shapes()); x,y = pos(city)
    lot = round(random.uniform(1.5,6.5),2); bld = round(lot*0.3,2); park = round(lot*0.4,2); openA = round(lot-bld-park,2)
    parcels.append(dict(id=slug(name), displayName=name, ownerType=otype, ownerSince=f"{random.randint(1970,2020)}-05-01", faith=None, city=city,
      mapX=x, mapY=y, lotAcres=lot, buildingAcres=bld, parkingAcres=park, parkingSpaces=int(park*43560/350), openAcres=openA, zoning=zoning,
      nearSchoolM=random.choice([400,800,1500]), nearTransitM=random.choice([300,700,1400]), nearGroceryM=random.choice([500,900]), slopePct=random.choice([1,2,3]),
      floodZone=name.startswith('Flood'), hazards=['hazardous-site'] if 'Logistics' in name else [], congregationLanguage='en',
      lotPolygon=[dict(x=px,y=py) for px,py in shp['poly']], buildingRect=dict(zip('xywh',shp['bld'])), parkingRects=[dict(zip('xywh',p)) for p in shp['park']], streetSide=shp['street']))

# A hand-tuned demo parcel first: a Santa Ana Spanish-speaking church with 120 spaces (demo script: 120 → 60)
demo = parcels[0]
demo.update(dict(displayName="Oakfield Community Church (sample)", id="oakfield-community-church", faith='Community church', city='Santa Ana', zoning='institutional',
  lotAcres=3.9, buildingAcres=0.7, parkingAcres=0.96, parkingSpaces=120, openAcres=2.24, ownerSince='1979-06-10', congregationLanguage='es',
  nearSchoolM=320, nearTransitM=260, nearGroceryM=480, slopePct=1, floodZone=False, hazards=[], mapX=366, mapY=344, streetSide='top',
  lotPolygon=[dict(x=0,y=0),dict(x=1,y=0),dict(x=1,y=0.72),dict(x=0,y=0.72)], buildingRect=dict(x=0.06,y=0.08,w=0.3,h=0.24), parkingRects=[dict(x=0.42,y=0.06,w=0.52,h=0.3)]))
ids = [p['id'] for p in parcels]
assert len(ids)==len(set(ids))==60, (len(ids), len(set(ids)))
json.dump(parcels, open('data/parcels.json','w'), indent=1)
print(len(parcels), sum(p['ownerType']=='congregation' for p in parcels))
